import fs from "fs";
import mongoose from "mongoose";
import { Transaction } from "../models/transaction.model.js";
import { AuditLog } from "../models/auditLog.model.js";
import { readAndParseCSV, validateRow } from "../utils/csvParser.js";
import { parseRawText } from "../utils/textParser.js";

const isObjectIdString = (value) => typeof value === "string" && mongoose.Types.ObjectId.isValid(value);

export const importCSV = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }
    console.log("import csv called");
    
    const filePath = req.file.path;
    let parsedRows;

    // Parse the CSV
    try {
      parsedRows = await readAndParseCSV(filePath);
    } catch (parseError) {
      // Clean up file if there is a parsing error
      fs.unlinkSync(filePath);
      return res.status(400).json({ success: false, message: "Error parsing CSV file." });
    }

    if (parsedRows.length === 0) {
      fs.unlinkSync(filePath);
      return res.status(422).json({ success: false, message: "No rows found in the CSV file" });
    }

    let validRows = [];
    const errors = [];
    let validationErrorsCount = 0;
    const userId = req.user._id;

    // Validate each row
    parsedRows.forEach((row, index) => {
      // Basic empty check
      if (Object.keys(row).length === 0) return;

      const { isValid, errors: rowErrors, validatedData } = validateRow(row);
      if (!isValid) {
        validationErrorsCount += 1;
        errors.push({
          row: index + 1, // 1-based index (header is 0 usually from outside perception, but parsedRows corresponds to data rows)
          errors: rowErrors,
        });
      } else {
        const cleanedApproverId = isObjectIdString(validatedData.approver_id)
          ? validatedData.approver_id
          : undefined;

        // Add user_id and prepare for insert
        validRows.push({
          ...validatedData,
          approver_id: cleanedApproverId,
          user_id: userId,
        });
      }
    });

    if (validRows.length === 0) {
      fs.unlinkSync(filePath);
      return res.status(422).json({
        success: false,
        message: "No valid rows found to import.",
        errors,
      });
    }

    // Filter duplicates via `invoice_number`
    // 1. Detect duplicates inside the CSV itself
    const invoiceSet = new Set();
    const uniqueValidRows = [];
    let csvDuplicatesSkipped = 0;

    for (const row of validRows) {
      if (row.invoice_number) {
        if (invoiceSet.has(row.invoice_number)) {
          csvDuplicatesSkipped++;
          errors.push({
            row: -1, // Cannot easily track original CSV index here cleanly based on current array flow, so using -1
            errors: [`Duplicate invoice_number '${row.invoice_number}' found within CSV`]
          });
          continue;
        }
        invoiceSet.add(row.invoice_number);
      }
      uniqueValidRows.push(row);
    }

    // 2. Detect duplicates in Database
    const invoiceNumbers = Array.from(invoiceSet);
    const existingTransactions = await Transaction.find({
      user_id: userId,
      invoice_number: { $in: invoiceNumbers },
    }).select("invoice_number");

    const existingInvoiceSet = new Set(existingTransactions.map((t) => t.invoice_number));

    const finalInsertBatch = [];
    let dbDuplicatesSkipped = 0;

    uniqueValidRows.forEach((row) => {
      if (row.invoice_number && existingInvoiceSet.has(row.invoice_number)) {
        dbDuplicatesSkipped++;
        errors.push({
          row: -1,
          errors: [`Duplicate invoice_number '${row.invoice_number}' found in Database`]
        });
      } else {
        finalInsertBatch.push(row);
      }
    });

    let insertedCount = 0;
    let insertedTransactions = [];

    if (finalInsertBatch.length > 0) {
      // Bulk Insert using create to avoid silent no-op results from bulk validation paths.
      const createdTransactions = await Transaction.create(finalInsertBatch);
      insertedTransactions = Array.isArray(createdTransactions)
        ? createdTransactions
        : [createdTransactions];
      insertedCount = insertedTransactions.length;

      // Log import in AuditLog
      await AuditLog.create({
        user_id: userId,
        action_type: "Import",
        entity_type: "Transaction",
        entity_id: userId, // Logging against user for bulk actions since multiple entities created
        reason: `Bulk imported ${insertedCount} transactions`,
        ip_address: req.ip || "0.0.0.0",
      });
    }

    // Unlink the temporary file
    fs.unlinkSync(filePath);

    const summary = {
      total: parsedRows.length,
      created: insertedCount,
      failed: validationErrorsCount,
      skipped: csvDuplicatesSkipped + dbDuplicatesSkipped,
      valid: validRows.length,
    };

    let message = "Import completed successfully.";
    if (insertedCount === 0 && summary.skipped > 0) {
      message = "No new rows inserted. All valid rows were skipped as duplicates.";
    } else if (insertedCount === 0 && summary.failed > 0) {
      message = "No rows inserted because validation failed.";
    } else if (insertedCount === 0) {
      message = "No rows inserted. Check header mappings and required fields (vendor_name, amount, date).";
    }

    res.status(200).json({
      success: true,
      message,
      summary,
      diagnostics: {
        csv_duplicates: csvDuplicatesSkipped,
        db_duplicates: dbDuplicatesSkipped,
        queued_for_insert: finalInsertBatch.length,
        existing_in_db: existingTransactions.length,
      },
      transactions: insertedTransactions,
      errors: errors,
    });
  } catch (error) {
    // Attempt file cleanup on DB/system failure
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

/**
 * Controller: parseText
 * Endpoint: POST /api/import/parse-text
 */
export const parseText = async (req, res, next) => {
  try {
    const { raw_text } = req.body;

    if (!raw_text || typeof raw_text !== "string" || !raw_text.trim()) {
      return res.status(400).json({ success: false, message: "raw_text is required and cannot be empty" });
    }

    const { parsed, format_detected } = parseRawText(raw_text);

    // Confidence scoring
    const missingFields = [];
    if (!parsed.vendor_name) missingFields.push("vendor_name");
    
    // Requirements state amount must be > 0 and date not future
    const today = new Date().toISOString().split("T")[0];
    if (parsed.amount === undefined || parsed.amount <= 0) missingFields.push("amount");
    if (!parsed.date || parsed.date > today) missingFields.push("date");

    const totalRequired = 3; // vendor, amount, date
    const foundRequired = totalRequired - missingFields.length;
    
    let confidence = 0.5;
    if (foundRequired === 3) confidence = 0.9;
    else if (foundRequired === 2) confidence = 0.75;
    else confidence = 0.5;

    // Optional category handling (Not strictly required for confidence calculation as per prompt)
    if (!parsed.category) {
       parsed.category = "Other";
    }

    if (foundRequired === 0) {
      return res.status(422).json({
        success: false,
        error: "Could not parse text",
        examples: [
          "GCP $2500 04/15/2024 IT",
          "Vendor: GCP | Amount: 2500 | Date: 04/15/2024"
        ]
      });
    }

    if (confidence === 0.9) {
      return res.status(200).json({
        success: true,
        parsed,
        format_detected,
        confidence,
        missing_fields: missingFields
      });
    } else {
      let feedback = `Could not detect ${missingFields.join(" and ")}. `;
      if (missingFields.includes("date")) feedback += "Try adding format MM/DD/YYYY";
      else if (missingFields.includes("amount")) feedback += "Try adding a currency symbol like $";
      
      return res.status(200).json({
        success: true,
        parsed,
        confidence,
        missing_fields: missingFields,
        feedback: feedback.trim()
      });
    }

  } catch (error) {
    next(error);
  }
};

