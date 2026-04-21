import Joi from "joi";
import { Transaction } from "../models/transaction.model.js";
import { Anomaly } from "../models/anomaly.model.js";
import { Recommendation } from "../models/recommendation.model.js";
import { syncMissingAnomaliesForUser } from "../services/anomalyService.js";
import { logAction } from "../services/auditService.js";

const GROQ_CHAT_COMPLETIONS_URL = "https://api.groq.com/openai/v1/chat/completions";

const formatCurrency = (amount) =>
  `INR ${new Intl.NumberFormat("en-IN").format(Math.round(amount || 0))}`;

const parseGroqJson = (rawText) => {
  if (!rawText) return null;

  const trimmed = rawText.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) return null;

    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
};

const buildFallbackAnomalyExplanation = ({ anomaly, transaction }) => {
  const vendor = transaction?.vendor_name || "this vendor";
  const amount = formatCurrency(transaction?.amount || 0);
  const reason = anomaly?.reason_description?.trim();
  const method = anomaly?.detection_method || "pattern check";

  return {
    title: "Why this was flagged",
    summary: reason || `This transaction was flagged because it looks unusual compared with the rest of your data.`,
    reasons: [
      `Vendor: ${vendor}`,
      `Amount: ${amount}`,
      `Detected by: ${method}`
    ],
    next_step: "Check the invoice, confirm the amount, and mark it as reviewed if it is valid.",
    source: "fallback"
  };
};

const buildGroqAnomalyExplanation = async ({ anomaly, transaction }) => {
  const fallback = buildFallbackAnomalyExplanation({ anomaly, transaction });
  const model = process.env.GROQ_MODEL;
  const apiKey = process.env.GROQ_API_KEY;

  if (!model || !apiKey) return fallback;

  try {
    const groqResponse = await fetch(GROQ_CHAT_COMPLETIONS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: 350,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You explain transaction anomalies in simple English. Return strict JSON with keys: title, summary, reasons (array of 3 short strings), next_step. Avoid technical words and keep the explanation practical."
          },
          {
            role: "user",
            content: JSON.stringify({
              anomaly: {
                severity: anomaly?.severity,
                detection_method: anomaly?.detection_method,
                reason_description: anomaly?.reason_description,
                anomaly_score: anomaly?.anomaly_score
              },
              transaction: {
                vendor_name: transaction?.vendor_name,
                amount: transaction?.amount,
                date: transaction?.date,
                invoice_number: transaction?.invoice_number,
                payment_method: transaction?.payment_method
              },
              instructions: "Explain why this transaction was flagged and what the user should check next."
            })
          }
        ]
      })
    });

    if (!groqResponse.ok) return fallback;

    const groqJson = await groqResponse.json();
    const content = groqJson?.choices?.[0]?.message?.content || "";
    const parsed = parseGroqJson(content);

    if (!parsed?.summary) return fallback;

    return {
      title: typeof parsed.title === "string" && parsed.title.trim() ? parsed.title.trim() : fallback.title,
      summary: String(parsed.summary),
      reasons: Array.isArray(parsed.reasons) && parsed.reasons.length
        ? parsed.reasons.slice(0, 3).map((item) => String(item))
        : fallback.reasons,
      next_step: typeof parsed.next_step === "string" && parsed.next_step.trim() ? parsed.next_step.trim() : fallback.next_step,
      source: "groq"
    };
  } catch (error) {
    console.error("Get anomaly explanation error:", error);
    return fallback;
  }
};

// Joi Schemas
export const updateAnomalySchema = Joi.object({
  status: Joi.string().valid("New", "Reviewed", "Resolved").optional(),
  notes: Joi.string().optional()
});

export const detectAnomaliesFlow = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized", error: "Missing user ID context" });

    const syncResult = await syncMissingAnomaliesForUser(userId);

    if (syncResult.detected === 0) {
      return res.status(200).json({
        success: true,
        detected: 0,
        created: 0,
        total_risk_score: 0,
        message: "No new unprocessed transactions found"
      });
    }

    const total_risk = syncResult.anomalies.reduce((sum, anomaly) => sum + anomaly.anomaly_score, 0);

    await logAction(userId, "detected", "anomaly_batch", null, { change_to: `Detected ${syncResult.created} new anomalies.` }, "User ran anomaly detection");

    return res.status(201).json({
      success: true,
      data: {
        detected: syncResult.detected,
        created: syncResult.created,
        total_risk_score: parseFloat(total_risk.toFixed(2))
      }
    });

  } catch (error) {
    console.error("Detect Anomalies error:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

export const getAnomalies = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized", error: "Missing user ID context" });

    const { status, severity, vendor, page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    const query = { user_id: userId };
    if (status) query.status = status;
    if (severity) query.severity = severity;

    if (vendor?.trim()) {
      const vendorRegex = new RegExp(vendor.trim(), "i");
      const vendorTransactions = await Transaction.find({
        user_id: userId,
        vendor_name: { $regex: vendorRegex }
      }).select("_id").lean();

      const vendorTransactionIds = vendorTransactions.map((trx) => trx._id);
      query.transaction_id = { $in: vendorTransactionIds };
    }

    if (!status && !severity && !vendor?.trim() && pageNum === 1) {
      await syncMissingAnomaliesForUser(userId);
    }

    const total = await Anomaly.countDocuments(query);

    const anomalies = await Anomaly.find(query)
      .sort({ detected_at: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    // Map a lightweight transaction summary array to avoid complex populates
    const trxIds = anomalies.map(a => a.transaction_id);
    const relatedTransactions = await Transaction.find({ _id: { $in: trxIds } }).select('_id amount vendor_name date invoice_number').lean();

    // Merge transactions structurally onto the response locally 
    const mappedAnomalies = anomalies.map(anomaly => {
        const trx = relatedTransactions.find(t => t._id.toString() === anomaly.transaction_id.toString());
        return {
            ...anomaly,
            transaction_summary: trx || null
        };
    });

    return res.status(200).json({
      success: true,
      total,
      page: pageNum,
      limit: limitNum,
      data: mappedAnomalies
    });

  } catch (error) {
    console.error("Fetch anomalies error:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

export const getAnomalyById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized", error: "Missing user ID context" });

    if (!id.match(/^[0-9a-fA-F]{24}$/)) return res.status(400).json({ success: false, message: "Validation Error", error: "Invalid anomaly ID format" });

    const anomaly = await Anomaly.findOne({ _id: id, user_id: userId }).lean();
    if (!anomaly) return res.status(404).json({ success: false, message: "Not found", error: "Anomaly not found" });

    // Fetch related dependencies via lightweight independent mappings
    const transaction = await Transaction.findById(anomaly.transaction_id).lean();
    const recommendations = await Recommendation.find({ anomaly_id: anomaly._id }).lean();

    return res.status(200).json({
      success: true,
      data: {
        anomaly,
        transaction,
        recommendations
      }
    });

  } catch (error) {
    console.error("Get anomaly by ID error:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

export const getAnomalyExplanation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized", error: "Missing user ID context" });
    if (!id.match(/^[0-9a-fA-F]{24}$/)) return res.status(400).json({ success: false, message: "Validation Error", error: "Invalid anomaly ID format" });

    const anomaly = await Anomaly.findOne({ _id: id, user_id: userId }).lean();
    if (!anomaly) return res.status(404).json({ success: false, message: "Not found", error: "Anomaly not found" });

    const transaction = anomaly.transaction_id ? await Transaction.findById(anomaly.transaction_id).lean() : null;
    const explanation = await buildGroqAnomalyExplanation({ anomaly, transaction });

    return res.status(200).json({
      success: true,
      data: explanation
    });
  } catch (error) {
    console.error("Get anomaly explanation endpoint error:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

export const updateAnomaly = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized", error: "Missing user ID context" });

    if (!id.match(/^[0-9a-fA-F]{24}$/)) return res.status(400).json({ success: false, message: "Validation Error", error: "Invalid anomaly ID format" });

    const anomaly = await Anomaly.findOne({ _id: id, user_id: userId });
    if (!anomaly) return res.status(404).json({ success: false, message: "Not found", error: "Anomaly not found" });

    const { status, notes } = req.body;
    const originalData = anomaly.toObject();

    // Check valid logical transitions matching requirement rules securely
    if (status && status !== anomaly.status) {
        const transitions = { "New": ["Reviewed", "Resolved"], "Reviewed": ["Resolved"], "Resolved": [] };
        
        if (!transitions[anomaly.status] || !transitions[anomaly.status].includes(status)) {
             return res.status(400).json({ success: false, message: "Validation Error", error: `Invalid transition from ${anomaly.status} to ${status}` });
        }
        anomaly.status = status;
    }

    if (notes !== undefined) anomaly.notes = notes;

    const savedAnomaly = await anomaly.save();

    await logAction(userId, "updated", "anomaly", savedAnomaly._id, { change_from: originalData, change_to: savedAnomaly }, "User updated anomaly");

    return res.status(200).json({
      success: true,
      data: savedAnomaly
    });

  } catch (error) {
    console.error("Update anomaly error:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};
