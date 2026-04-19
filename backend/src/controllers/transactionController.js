import Joi from "joi";
import { Transaction } from "../models/transaction.model.js";
import { Anomaly } from "../models/anomaly.model.js";
import { Classification } from "../models/classification.model.js";
import { logAction } from "../services/auditService.js";

// Joi Schemas
export const createTransactionSchema = Joi.object({
  vendor_name: Joi.string().required(),
  category: Joi.string().optional(),
  amount: Joi.number().greater(0).required(),
  date: Joi.date().optional(),
  invoice_number: Joi.string().required(),
  payment_method: Joi.string().optional(),
  description: Joi.string().optional(),
  department: Joi.string().optional(),
  approver_id: Joi.string().optional(),
  status: Joi.string().valid("Approved", "Pending").optional()
});

export const updateTransactionSchema = Joi.object({
  vendor_name: Joi.string().optional(),
  category: Joi.string().optional(),
  amount: Joi.number().greater(0).optional(),
  date: Joi.date().optional(),
  // invoice_number omitted to prevent tampering
  payment_method: Joi.string().optional(),
  description: Joi.string().optional(),
  department: Joi.string().optional(),
  approver_id: Joi.string().optional(),
  status: Joi.string().valid("Approved", "Pending").optional()
});

export const createTransaction = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized", error: "Missing user ID context" });

    const body = req.body;

    const existing = await Transaction.findOne({ invoice_number: body.invoice_number, is_deleted: { $ne: true } });
    if (existing) {
        return res.status(400).json({ success: false, message: "Validation Error", error: `Invoice number ${body.invoice_number} already exists` });
    }

    const transaction = new Transaction({
        ...body,
        user_id: userId
    });

    const savedTransaction = await transaction.save();

    await logAction(userId, "created", "transaction", savedTransaction._id, { change_to: savedTransaction }, "User created new transaction");

    return res.status(201).json({
        success: true,
        data: savedTransaction
    });
  } catch (error) {
    console.error("Create transaction error:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

export const getTransactions = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized", error: "Missing user ID context" });

    const { page = 1, limit = 20, category, vendor_name, department, date_from, date_to } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    const query = { user_id: userId, is_deleted: { $ne: true } };

    if (category) query.category = category;
    if (vendor_name) query.vendor_name = new RegExp(vendor_name, 'i');
    if (department) query.department = department;

    if (date_from || date_to) {
        query.date = {};
        if (date_from) query.date.$gte = new Date(date_from);
        if (date_to) query.date.$lte = new Date(date_to);
    }

    const total = await Transaction.countDocuments(query);
    const transactions = await Transaction.find(query)
        .sort({ date: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean();

    return res.status(200).json({
        success: true,
        total,
        page: pageNum,
        limit: limitNum,
        data: transactions
    });

  } catch (error) {
    console.error("Fetch transactions error:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

export const getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized", error: "Missing user ID context" });

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({ success: false, message: "Validation Error", error: "Invalid transaction ID format" });
    }

    const transaction = await Transaction.findOne({ _id: id, user_id: userId, is_deleted: { $ne: true } }).lean();

    if (!transaction) {
        return res.status(404).json({ success: false, message: "Not found", error: "Transaction not found" });
    }

    const relatedAnomalies = await Anomaly.find({ transaction_id: transaction._id }).lean();
    
    let relatedClassifications = [];
    if (relatedAnomalies.length > 0) {
        const anomalyIds = relatedAnomalies.map(a => a._id);
        relatedClassifications = await Classification.find({ anomaly_id: { $in: anomalyIds } }).lean();
    }

    return res.status(200).json({
        success: true,
        data: {
             ...transaction,
             anomalies: relatedAnomalies,
             classifications: relatedClassifications
        }
    });

  } catch (error) {
    console.error("Get transaction by ID error:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

export const updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized", error: "Missing user ID context" });

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({ success: false, message: "Validation Error", error: "Invalid transaction ID format" });
    }

    if (req.body.invoice_number) {
        delete req.body.invoice_number; 
    }

    const transaction = await Transaction.findOne({ _id: id, user_id: userId, is_deleted: { $ne: true } });

    if (!transaction) {
        return res.status(404).json({ success: false, message: "Not found", error: "Transaction not found" });
    }

    const originalData = transaction.toObject();

    Object.keys(req.body).forEach(key => {
        transaction[key] = req.body[key];
    });

    const savedTransaction = await transaction.save();

    await logAction(userId, "updated", "transaction", savedTransaction._id, { change_from: originalData, change_to: savedTransaction }, "User updated transaction values");

    return res.status(200).json({
        success: true,
        data: savedTransaction
    });

  } catch (error) {
    console.error("Update transaction error:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

export const deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized", error: "Missing user ID context" });

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({ success: false, message: "Validation Error", error: "Invalid transaction ID format" });
    }

    const transaction = await Transaction.findOne({ _id: id, user_id: userId, is_deleted: { $ne: true } });

    if (!transaction) {
        return res.status(404).json({ success: false, message: "Not found", error: "Transaction not found" });
    }

    transaction.is_deleted = true;
    await transaction.save();

    await logAction(userId, "deleted", "transaction", transaction._id, { change_to: { is_deleted: true } }, "User soft-deleted transaction");

    return res.status(200).json({
        success: true,
        message: "Transaction deleted successfully"
    });

  } catch (error) {
    console.error("Delete transaction error:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};
