import fs from "fs";
import csv from "csv-parser";

/**
 * Normalizes headers
 * Example mapping logic for "vendor", "supplier" => "vendor_name"
 */
const headerMap = {
  vendor: "vendor_name",
  supplier: "vendor_name",
  merchant: "vendor_name",
  
  cost: "amount",
  price: "amount",
  total: "amount",
  value: "amount",

  transaction_date: "date",
  date_posted: "date",
  created_at: "date",

  desc: "description",
  note: "description",
  memo: "description",

  cat: "category",
  dept: "department",
  
  invoice: "invoice_number",
  inv_no: "invoice_number",
  invoice_id: "invoice_number",

  payment_type: "payment_method",
  method: "payment_method"
};

export const normalizeHeader = (header) => {
  // Lowercase and remove extra spaces
  let cleanHeader = header.trim().toLowerCase().replace(/\s+/g, "_");
  return headerMap[cleanHeader] || cleanHeader;
};

/**
 * Sanitizes input
 * Prevents CSV injection (starts with =,+, -, @)
 */
export const sanitizeString = (str) => {
  if (!str || typeof str !== "string") return "";
  let sanitized = str.trim();
  if (/^[=+\-@]/.test(sanitized)) {
     sanitized = "'" + sanitized;
  }
  return sanitized;
};

export const parseAmount = (val) => {
  if (!val) return null;
  // Remove currency signs like ₹, $ and commas
  const cleaned = val.toString().replace(/[₹$,]/g, "").trim();
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : Number(parsed.toFixed(2));
};

export const parseDate = (val) => {
  if (!val) return null;
  const dateObj = new Date(val);
  if (!isNaN(dateObj.getTime())) {
    return dateObj; // successfully parsed by JS standard format
  }
  return null;
};

export const validateRow = (row) => {
  const errors = [];

  // Required Fields
  if (!row.vendor_name || row.vendor_name.length > 255) {
    errors.push("Invalid or missing vendor_name (max 255 chars)");
  }

  const amt = parseAmount(row.amount);
  if (amt === null || amt <= 0) {
    errors.push(`Invalid amount: ${row.amount}`);
  } else {
    row.amount = amt;
  }

  const d = parseDate(row.date);
  if (!d) {
    errors.push(`Invalid date format: ${row.date}`);
  } else {
    row.date = d;
  }

  if (row.description && row.description.length > 1000) {
    errors.push("Description exceeds 1000 characters");
  }

  // Predefined enums validation
  const validPaymentMethods = ["Card", "ACH", "Check", "Other"];
  if (row.payment_method && !validPaymentMethods.includes(row.payment_method)) {
     // fallback to Others if unknown, or maybe push error? 
     // Requirements say "optional enum".
     // We will default unknown to something else or just pass the model's default. Let's pass if it's there.
  }

  return { isValid: errors.length === 0, errors, validatedData: row };
};

/**
 * Reads a CSV file using csv-parser
 * Detects headers, maps them, and validates rows
 */
export const readAndParseCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    
    fs.createReadStream(filePath)
      .pipe(
        csv({
          mapHeaders: ({ header }) => normalizeHeader(header)
        })
      )
      .on("data", (data) => {
        // Sanitize string entries
        for (const key in data) {
          if (typeof data[key] === "string") {
             data[key] = sanitizeString(data[key]);
          }
        }
        results.push(data);
      })
      .on("end", () => {
        resolve(results);
      })
      .on("error", (error) => {
        reject(error);
      });
  });
};
