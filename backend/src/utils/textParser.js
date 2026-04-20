/**
 * textParser.js
 * Utilities for extracting transaction data from raw text.
 */

export const detectFormat = (text) => {
  if (text.includes("|")) return "pipe-separated";
  if (text.includes(",")) return "comma-separated";
  if (text.includes("\n") && text.match(/vendor:|amount:|date:|paid to:/i)) return "key-value";
  return "loose";
};

export const extractAmount = (text) => {
  // Regex to match $2500, 2500, 2,500.50
  // First, extract any block that resembles a currency/number with a symbol or just a stand-alone number.
  // Using a robust regex to pick up $ or just pure numbers with decimals.
  const amountRegex = /(?:[$₹€£]?\s*)?(\d{1,3}(?:[,\s]\d{3})*(?:\.\d{2})?|\d+(?:\.\d+)?)(?=\s|$|,|\|)/g;
  
  const matches = [...text.matchAll(amountRegex)];
  
  if (matches.length === 0) return null;
  
  // Try to find the most "plausible" amount, which is often the first one that has a currency symbol next to it
  // But for simple texts without symbols, the first match often is the amount or the date year. Let's do a trick: 
  // We'll clean numbers and avoid things that look strictly like dates (e.g. 2024, 15 attached to dates).
  
  // A better simple robust amount matcher:
  const currencyRegex = /[$₹€£]\s*(\d+(?:[.,]\d+)?)/;
  const currMatch = text.match(currencyRegex);
  if (currMatch) {
     return parseFloat(currMatch[1].replace(/,/g, ""));
  }

  // Fallback to general number matching, taking the first valid one that isn't plainly a year from a date
  // (We'll extract dates later, but numbers are easily confused)
  for (const match of matches) {
      let rawNum = match[1].replace(/,/g, "");
      let val = parseFloat(rawNum);
      if (val > 0 && val !== 2024 && val !== 2025 && val !== 2026 && val !== 2027) { 
         // simple heuristic to skip year if loose format
         return val;
      }
  }
  return null;
};

export const extractDate = (text) => {
  // Matches MM/DD/YYYY or DD/MM/YYYY or YYYY-MM-DD
  const dateRegex1 = /\b(\d{4})-(\d{1,2})-(\d{1,2})\b/; // YYYY-MM-DD
  const dateRegex2 = /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\b/; // MM/DD/YYYY or DD/MM/YYYY

  let match1 = text.match(dateRegex1);
  if (match1) {
    const d = new Date(`${match1[1]}-${match1[2].padStart(2, '0')}-${match1[3].padStart(2, '0')}`);
    if (!isNaN(d.getTime())) return d.toISOString().split("T")[0];
  }

  let match2 = text.match(dateRegex2);
  if (match2) {
    let part1 = match2[1];
    let part2 = match2[2];
    let part3 = match2[3];
    if (part3.length === 2) {
       part3 = "20" + part3; // Assume 20xx
    }
    
    // JS dates work well with YYYY-MM-DD
    const attempt1 = new Date(`${part3}-${part1.padStart(2, '0')}-${part2.padStart(2, '0')}`);
    const attempt2 = new Date(`${part3}-${part2.padStart(2, '0')}-${part1.padStart(2, '0')}`);
    
    if (!isNaN(attempt1.getTime()) && attempt1.getMonth() + 1 === parseInt(part1)) {
        return attempt1.toISOString().split("T")[0];
    } else if (!isNaN(attempt2.getTime())) {
        return attempt2.toISOString().split("T")[0];
    }
  }
  return null;
};

export const extractVendor = (text, format) => {
  let lowerCaseText = text.toLowerCase();

  // Try Key-Value extracting
  if (format === "key-value" || format === "comma-separated" || format === "pipe-separated") {
     const kvRegex = /(?:vendor|merchant|paid to)\s*[:=]?\s*([a-zA-Z0-9\s]+)(?:[,||\n]|$)/i;
     const kvMatch = text.match(kvRegex);
     if (kvMatch && kvMatch[1].trim()) {
        return kvMatch[1].trim();
     }
  }
  
  // Try pipe or comma separated if vendor was not explicitly named. Usually it is the first item.
  if (format === "pipe-separated") {
      let parts = text.split("|");
      return parts[0].trim();
  }
  if (format === "comma-separated") {
      let parts = text.split(",");
      // Take first part as long as it's not a pure number or date
      if (isNaN(parseFloat(parts[0].trim()))) {
          return parts[0].trim();
      }
  }

  // Loose format: vendor is likely the first word or words before the first number or date.
  // Take words until we hit a number or a date
  const words = text.split(/\s+/);
  let vendorParts = [];
  for (const word of words) {
     if (word.match(/[$₹€£]?\d+/)) break; // stop at numbers/amounts
     if (word.toLowerCase() === "department" || word.toLowerCase() === "it" || word.match(/\//)) break;
     vendorParts.push(word);
  }
  if (vendorParts.length > 0) return vendorParts.join(" ").trim();

  return null;
};

export const extractInvoiceNumber = (text) => {
  const invoiceRegex = /(?:invoice(?:\s*number)?|inv(?:oice)?\s*(?:no|number|#)?|bill(?:ing)?\s*(?:no|number|#)?)\s*[:=\-]?\s*([A-Za-z0-9][A-Za-z0-9\-/_.]*)/i;
  const match = text.match(invoiceRegex);
  if (match && match[1]) return match[1].trim();

  const fallbackRegex = /\bINV[-_/]?[A-Z0-9]+\b/i;
  const fallbackMatch = text.match(fallbackRegex);
  if (fallbackMatch) return fallbackMatch[0].trim();

  return null;
};

export const matchCategory = (text) => {
  const lowerCaseText = text.toLowerCase();
  
  if (lowerCaseText.match(/\b(it|software|cloud|aws|gcp|azure|tech|hardware)\b/)) return "IT";
  if (lowerCaseText.match(/\b(travel|flight|hotel|taxi|uber|lyft|airbnb)\b/)) return "Travel";
  if (lowerCaseText.match(/\b(food|meal|lunch|dinner|restaurant|coffee)\b/)) return "Operations";
  if (lowerCaseText.match(/\b(marketing|sales|ad|ads|campaign)\b/)) return "Sales";
  if (lowerCaseText.match(/\b(hr|payroll)\b/)) return "HR";
  if (lowerCaseText.match(/\b(finance|bank|fee)\b/)) return "Finance";

  return "Other";
};

export const parseRawText = (raw_text) => {
  if (!raw_text || typeof raw_text !== "string") {
      return { parsed: {}, format_detected: "unknown" };
  }

  const cleanText = raw_text.replace(/\s+/g, " ").trim();
  const format_detected = detectFormat(cleanText);

  let parsed = {};
  
  // Extract
  const vendor = extractVendor(cleanText, format_detected);
  if (vendor) parsed.vendor_name = vendor;

  const invoiceNumber = extractInvoiceNumber(cleanText);
  if (invoiceNumber) parsed.invoice_number = invoiceNumber;

  const amount = extractAmount(cleanText);
  if (amount !== null) parsed.amount = amount;

  const date = extractDate(cleanText);
  if (date) parsed.date = date;

  const category = matchCategory(cleanText);
  if (category && category !== "Other") {
      parsed.category = category;
  } else {
      parsed.category = "Other"; // default
  }

  return {
     parsed,
     format_detected
  };
};
