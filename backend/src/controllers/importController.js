import fs from "fs";
import mongoose from "mongoose";
import { Transaction } from "../models/transaction.model.js";
import { AuditLog } from "../models/auditLog.model.js";
import { readAndParseCSV, validateRow } from "../utils/csvParser.js";

export const importCSV = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

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
    const userId = req.user._id;

    // Validate each row
    parsedRows.forEach((row, index) => {
      // Basic empty check
      if (Object.keys(row).length === 0) return;

      const { isValid, errors: rowErrors, validatedData } = validateRow(row);
      if (!isValid) {
        errors.push({
          row: index + 1, // 1-based index (header is 0 usually from outside perception, but parsedRows corresponds to data rows)
          errors: rowErrors,
        });
      } else {
        // Add user_id and prepare for insert
        validRows.push({
          ...validatedData,
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
      // Bulk Insert
      insertedTransactions = await Transaction.insertMany(finalInsertBatch, { ordered: false });
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

    res.status(200).json({
      success: true,
      summary: {
        total: parsedRows.length,
        created: insertedCount,
        failed: errors.length - (csvDuplicatesSkipped + dbDuplicatesSkipped) > 0 ? errors.length : 0, 
        skipped: csvDuplicatesSkipped + dbDuplicatesSkipped,
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
