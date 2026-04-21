import Joi from "joi";
import { Recommendation } from "../models/recommendation.model.js";
import { Anomaly } from "../models/anomaly.model.js";
import { Transaction } from "../models/transaction.model.js";
import { generateRecommendations } from "../services/recommendationService.js";
import { logAction } from "../services/auditService.js";

const GROQ_CHAT_COMPLETIONS_URL = "https://api.groq.com/openai/v1/chat/completions";

const formatCurrency = (amount) => `INR ${new Intl.NumberFormat("en-IN").format(Math.round(amount || 0))}`;

const buildFallbackSummary = ({ txCount, totalSpend, pendingCount, recoveryPotential, topVendors, topCategories }) => {
  const vendorText = topVendors.length
    ? topVendors.map((entry) => `${entry.vendor} (${formatCurrency(entry.amount)})`).join(", ")
    : "No dominant vendor pattern yet";

  const categoryText = topCategories.length
    ? topCategories.map((entry) => `${entry.category} (${formatCurrency(entry.amount)})`).join(", ")
    : "No category trend available";

  return {
    overview: `You have ${txCount} transactions with total spend of ${formatCurrency(totalSpend)}. There are ${pendingCount} pending recommendations that can potentially recover ${formatCurrency(recoveryPotential)}.`,
    highlights: [
      `Top spending vendors: ${vendorText}.`,
      `Top spending categories: ${categoryText}.`,
      pendingCount > 0
        ? `Focus on pending recommendations first to recover value quickly.`
        : "No pending recommendations right now. Keep monitoring for new anomalies."
    ],
    recommendations: [
      "Start with the highest-impact recommendation and close one item at a time.",
      "Track monthly vendor spend and flag unusual jumps early.",
      "Review repeated charges and subscription renewals every month."
    ],
    source: "fallback"
  };
};

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

const toTitleCase = (value = "") => value
  .toString()
  .toLowerCase()
  .split(" ")
  .filter(Boolean)
  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
  .join(" ");

const normalizeTitleKey = (value = "") => value
  .toString()
  .toLowerCase()
  .replace(/[^a-z0-9\s]/g, " ")
  .replace(/\s+/g, " ")
  .trim();

const isGenericRecommendationTitle = (value = "") => {
  const normalized = normalizeTitleKey(value);
  if (!normalized) return true;

  const blocked = new Set([
    "recommendation",
    "review recommendation",
    "compliance warning issued",
    "action required",
    "review this recommendation"
  ]);

  return blocked.has(normalized);
};

const buildFriendlyFallbackMetadata = (item) => {
  const vendor = toTitleCase(item.vendor_name || "vendor");
  const category = toTitleCase(item.category || "spend");
  const amountText = formatCurrency(item.amount || item.estimated_recovery || 0);
  const method = (item.detection_method || "").toLowerCase();

  if (method.includes("duplicate")) {
    return {
      title: `Check duplicate charge from ${vendor}`,
      summary: `This looks like a duplicate payment. Review invoice records and request a refund where needed.`
    };
  }

  if (method.includes("high") || (item.priority || 0) >= 5) {
    return {
      title: `Review unusually high spend at ${vendor}`,
      summary: `Spending appears higher than normal. Validate the charge and recover excess amount if applicable.`
    };
  }

  if (method.includes("compliance") || method.includes("policy")) {
    return {
      title: `Resolve policy risk in ${category}`,
      summary: `This transaction may violate policy checks. Verify supporting documents and complete corrective action.`
    };
  }

  return {
    title: `Review ${vendor} ${category} transaction`,
    summary: `A potential saving of about ${amountText} is available. Confirm details and take corrective action.`
  };
};

const buildFriendlyMetadataWithGroq = async (items) => {
  const fallbackMap = new Map(items.map((item) => [
    String(item.id),
    buildFriendlyFallbackMetadata(item)
  ]));

  const model = process.env.GROQ_MODEL;
  const apiKey = process.env.GROQ_API_KEY;
  if (!model || !apiKey || items.length === 0) return fallbackMap;

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
        max_tokens: 900,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "You write friendly finance UX copy. Return strict JSON with key items. Each item must contain id, title, summary. Title must be short, unique, and human-readable. Avoid robotic words."
          },
          {
            role: "user",
            content: JSON.stringify({
              instructions: "For each record, create a clear title and one-sentence summary in simple English.",
              items
            })
          }
        ]
      })
    });

    if (!groqResponse.ok) return fallbackMap;

    const groqJson = await groqResponse.json();
    const content = groqJson?.choices?.[0]?.message?.content || "";
    const parsed = parseGroqJson(content);
    const parsedItems = Array.isArray(parsed?.items) ? parsed.items : [];

    if (parsedItems.length === 0) return fallbackMap;

    const finalMap = new Map(fallbackMap);
    for (const entry of parsedItems) {
      const id = String(entry?.id || "");
      if (!id || !finalMap.has(id)) continue;

      const fallback = finalMap.get(id);
      finalMap.set(id, {
        title: typeof entry.title === "string" && entry.title.trim() ? entry.title.trim() : fallback.title,
        summary: typeof entry.summary === "string" && entry.summary.trim() ? entry.summary.trim() : fallback.summary
      });
    }

    const titleCounts = new Map();
    for (const meta of finalMap.values()) {
      const key = normalizeTitleKey(meta?.title || "");
      if (!key) continue;
      titleCounts.set(key, (titleCounts.get(key) || 0) + 1);
    }

    const itemById = new Map(items.map((item) => [String(item.id), item]));
    for (const [id, meta] of finalMap.entries()) {
      const normalizedTitle = normalizeTitleKey(meta?.title || "");
      const isDuplicate = normalizedTitle ? (titleCounts.get(normalizedTitle) || 0) > 1 : false;

      if (!isDuplicate && !isGenericRecommendationTitle(meta?.title || "")) continue;

      const item = itemById.get(id) || { id };
      const fallback = buildFriendlyFallbackMetadata(item);
      const disambiguator = toTitleCase(item.vendor_name || item.category || item.detection_method || "").trim();
      const uniqueTitle = disambiguator && !normalizeTitleKey(fallback.title).includes(normalizeTitleKey(disambiguator))
        ? `${fallback.title} - ${disambiguator}`
        : fallback.title;

      finalMap.set(id, {
        title: uniqueTitle,
        summary: fallback.summary
      });
    }

    return finalMap;
  } catch {
    return fallbackMap;
  }
};

export const executeRecommendationSchema = Joi.object({
  actual_recovery: Joi.number().min(0).optional(),
  notes: Joi.string().optional()
});

export const rejectRecommendationSchema = Joi.object({
  reason: Joi.string().required()
});

export const generateFlow = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized", error: "Missing user ID context" });

    const existingRecs = await Recommendation.find({ user_id: userId }).select("anomaly_id").lean();
    const existingIds = new Set(existingRecs.map((rec) => rec.anomaly_id.toString()));

    const anomalies = await Anomaly.find({ user_id: userId, status: { $ne: "Resolved" } }).lean();
    const pendingAnomalies = anomalies.filter((anomaly) => !existingIds.has(anomaly._id.toString()));

    if (pendingAnomalies.length === 0) {
      return res.status(200).json({
        success: true,
        generated: 0,
        pending: 0,
        total_recovery_potential: 0,
        message: "No new anomalies found needing recommendations"
      });
    }

    const createdRecommendationsArrays = await Promise.all(
      pendingAnomalies.map((anomaly) => generateRecommendations(anomaly))
    );
    const createdRecommendations = createdRecommendationsArrays.flat();

    const pendingCount = createdRecommendations.filter((recommendation) => recommendation.status === "Pending").length;
    const totalPotential = createdRecommendations.reduce((sum, recommendation) => sum + (recommendation.estimated_recovery || 0), 0);

    await logAction(userId, "generated", "recommendation_batch", null, { change_to: `Generated ${createdRecommendations.length} recommendations.` }, "System generated mitigation workflows");

    return res.status(201).json({
      success: true,
      data: {
        generated: createdRecommendations.length,
        pending: pendingCount,
        total_recovery_potential: parseFloat(totalPotential.toFixed(2))
      }
    });
  } catch (error) {
    console.error("Generate recommendation error:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

export const getRecommendations = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized", error: "Missing user ID context" });

    const { status, priority, page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    const query = { user_id: userId };
    if (status) query.status = status;
    if (priority) query.priority = parseInt(priority, 10);

    const total = await Recommendation.countDocuments(query);
    const recommendations = await Recommendation.find(query)
      .sort({ created_at: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    const anomalyIds = recommendations.map((recommendation) => recommendation.anomaly_id).filter(Boolean);
    const relatedAnomalies = anomalyIds.length > 0 ? await Anomaly.find({ _id: { $in: anomalyIds } }).lean() : [];

    const transactionIds = relatedAnomalies.map((anomaly) => anomaly.transaction_id).filter(Boolean);
    const relatedTransactions = transactionIds.length > 0 ? await Transaction.find({ _id: { $in: transactionIds } }).lean() : [];

    const llmItems = recommendations.map((recommendation) => {
      const anomaly = relatedAnomalies.find((entry) => entry._id.toString() === recommendation.anomaly_id.toString()) || null;
      const transaction = anomaly?.transaction_id
        ? relatedTransactions.find((entry) => entry._id.toString() === anomaly.transaction_id.toString()) || null
        : null;

      return {
        id: recommendation._id.toString(),
        vendor_name: transaction?.vendor_name,
        category: transaction?.category,
        amount: transaction?.amount,
        detection_method: anomaly?.detection_method,
        reason_description: anomaly?.reason_description,
        action_description: recommendation.action_description,
        estimated_recovery: recommendation.estimated_recovery,
        priority: recommendation.priority
      };
    });

    const metadataById = await buildFriendlyMetadataWithGroq(llmItems);

    const mappedRecommendations = recommendations.map((recommendation) => {
      const anomaly = relatedAnomalies.find((entry) => entry._id.toString() === recommendation.anomaly_id.toString()) || null;
      const transaction = anomaly?.transaction_id
        ? relatedTransactions.find((entry) => entry._id.toString() === anomaly.transaction_id.toString()) || null
        : null;
      const friendlyMeta = metadataById.get(recommendation._id.toString()) || buildFriendlyFallbackMetadata({
        id: recommendation._id.toString(),
        vendor_name: transaction?.vendor_name,
        amount: transaction?.amount,
        detection_method: anomaly?.detection_method,
        estimated_recovery: recommendation.estimated_recovery,
        priority: recommendation.priority
      });

      return {
        ...recommendation,
        anomaly_summary: anomaly,
        transaction_summary: transaction,
        friendly_title: friendlyMeta.title,
        friendly_summary: friendlyMeta.summary
      };
    });

    return res.status(200).json({
      success: true,
      total,
      page: pageNum,
      limit: limitNum,
      data: mappedRecommendations
    });
  } catch (error) {
    console.error("Fetch recommendations error:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

export const getFriendlyRecommendationSummary = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized", error: "Missing user ID context" });
    }

    const [transactions, recommendations] = await Promise.all([
      Transaction.find({ user_id: userId, is_deleted: false }).sort({ date: -1 }).limit(250).lean(),
      Recommendation.find({ user_id: userId }).sort({ created_at: -1 }).limit(100).lean()
    ]);

    const txCount = transactions.length;
    const totalSpend = transactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);
    const pendingRecommendations = recommendations.filter((rec) => rec.status === "Pending");
    const pendingCount = pendingRecommendations.length;
    const recoveryPotential = pendingRecommendations.reduce((sum, rec) => sum + (rec.estimated_recovery || 0), 0);

    const vendorTotalsMap = new Map();
    const categoryTotalsMap = new Map();

    for (const tx of transactions) {
      const vendor = tx.vendor_name || "Unknown";
      const category = tx.category || "Uncategorized";
      vendorTotalsMap.set(vendor, (vendorTotalsMap.get(vendor) || 0) + (tx.amount || 0));
      categoryTotalsMap.set(category, (categoryTotalsMap.get(category) || 0) + (tx.amount || 0));
    }

    const topVendors = [...vendorTotalsMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([vendor, amount]) => ({ vendor, amount }));

    const topCategories = [...categoryTotalsMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([category, amount]) => ({ category, amount }));

    const fallback = buildFallbackSummary({
      txCount,
      totalSpend,
      pendingCount,
      recoveryPotential,
      topVendors,
      topCategories
    });

    const model = process.env.GROQ_MODEL;
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey || !model) {
      return res.status(200).json({
        success: true,
        data: {
          ...fallback,
          stats: { txCount, totalSpend, pendingCount, recoveryPotential }
        }
      });
    }

    const payload = {
      txCount,
      totalSpend,
      pendingCount,
      recoveryPotential,
      topVendors,
      topCategories,
      recentTransactions: transactions.slice(0, 20).map((tx) => ({
        vendor_name: tx.vendor_name,
        category: tx.category,
        amount: tx.amount,
        date: tx.date,
        description: tx.description
      })),
      pendingRecommendations: pendingRecommendations.slice(0, 12).map((rec) => ({
        action_description: rec.action_description,
        recommendation_type: rec.recommendation_type,
        estimated_recovery: rec.estimated_recovery,
        priority: rec.priority
      }))
    };

    const groqResponse = await fetch(GROQ_CHAT_COMPLETIONS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        max_tokens: 700,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are a finance assistant. Convert transaction and recommendation data into simple, friendly language. Return JSON only with keys: overview (string), highlights (string[] max 4), recommendations (string[] max 4). Keep it practical and non-technical. Mention INR currency in plain language."
          },
          {
            role: "user",
            content: JSON.stringify(payload)
          }
        ]
      })
    });

    if (!groqResponse.ok) {
      const fallbackWithStats = {
        ...fallback,
        stats: { txCount, totalSpend, pendingCount, recoveryPotential }
      };
      return res.status(200).json({ success: true, data: fallbackWithStats });
    }

    const groqJson = await groqResponse.json();
    const content = groqJson?.choices?.[0]?.message?.content || "";
    const parsed = parseGroqJson(content);

    if (!parsed || !parsed.overview) {
      return res.status(200).json({
        success: true,
        data: {
          ...fallback,
          stats: { txCount, totalSpend, pendingCount, recoveryPotential }
        }
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        overview: String(parsed.overview),
        highlights: Array.isArray(parsed.highlights) ? parsed.highlights.slice(0, 4) : fallback.highlights,
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations.slice(0, 4) : fallback.recommendations,
        source: "groq",
        stats: { txCount, totalSpend, pendingCount, recoveryPotential }
      }
    });
  } catch (error) {
    console.error("Get friendly recommendation summary error:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

export const getRecommendationById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized", error: "Missing user ID context" });

    if (!id.match(/^[0-9a-fA-F]{24}$/)) return res.status(400).json({ success: false, message: "Validation Error", error: "Invalid ID format" });

    const recommendation = await Recommendation.findOne({ _id: id, user_id: userId }).lean();
    if (!recommendation) return res.status(404).json({ success: false, message: "Not found", error: "Recommendation not found" });

    const anomaly = await Anomaly.findById(recommendation.anomaly_id).lean();
    const transaction = anomaly?.transaction_id ? await Transaction.findById(anomaly.transaction_id).lean() : null;

    const friendlyMap = await buildFriendlyMetadataWithGroq([
      {
        id: recommendation._id.toString(),
        vendor_name: transaction?.vendor_name,
        category: transaction?.category,
        amount: transaction?.amount,
        detection_method: anomaly?.detection_method,
        reason_description: anomaly?.reason_description,
        action_description: recommendation.action_description,
        estimated_recovery: recommendation.estimated_recovery,
        priority: recommendation.priority
      }
    ]);
    const friendlyMeta = friendlyMap.get(recommendation._id.toString()) || buildFriendlyFallbackMetadata({
      id: recommendation._id.toString(),
      vendor_name: transaction?.vendor_name,
      amount: transaction?.amount,
      detection_method: anomaly?.detection_method,
      estimated_recovery: recommendation.estimated_recovery,
      priority: recommendation.priority
    });

    return res.status(200).json({
      success: true,
      data: {
        id: recommendation._id,
        friendly_title: friendlyMeta.title,
        friendly_summary: friendlyMeta.summary,
        anomaly,
        transaction,
        recommendation_type: recommendation.recommendation_type,
        action_description: recommendation.action_description,
        template_email: recommendation.template_email,
        template_document: recommendation.template_document,
        priority: recommendation.priority,
        estimated_recovery: recommendation.estimated_recovery,
        status: recommendation.status,
        created_at: recommendation.created_at
      }
    });
  } catch (error) {
    console.error("Get recommendation by ID error:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

export const executeRecommendation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized", error: "Missing user ID context" });

    if (!id.match(/^[0-9a-fA-F]{24}$/)) return res.status(400).json({ success: false, message: "Validation Error", error: "Invalid ID format" });

    const { actual_recovery, notes } = req.body;
    const existingRecommendation = await Recommendation.findOne({ _id: id, user_id: userId }).lean();
    if (!existingRecommendation) {
      return res.status(404).json({ success: false, message: "Not found", error: "Recommendation not found" });
    }

    if (existingRecommendation.status !== "Pending") {
      return res.status(400).json({ success: false, message: "Validation Error", error: "Only Pending recommendations can be executed" });
    }

    const updateFields = {
      status: "Executed",
      executed_by: userId,
      executed_date: new Date()
    };
    if (actual_recovery !== undefined) updateFields.actual_recovery = actual_recovery;
    if (notes) updateFields.notes = notes;

    const savedRec = await Recommendation.findOneAndUpdate(
      { _id: id, user_id: userId, status: "Pending" },
      { $set: updateFields },
      { new: true }
    );

    if (!savedRec) {
      return res.status(400).json({ success: false, message: "Validation Error", error: "Only Pending recommendations can be executed" });
    }

    await logAction(userId, "executed", "recommendation", savedRec._id, { change_from: existingRecommendation, change_to: savedRec }, "User marked recommendation as Executed");

    return res.status(200).json({ success: true, data: savedRec });
  } catch (error) {
    console.error("Execute recommendation error:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

export const rejectRecommendation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized", error: "Missing user ID context" });

    if (!id.match(/^[0-9a-fA-F]{24}$/)) return res.status(400).json({ success: false, message: "Validation Error", error: "Invalid ID format" });

    const { reason } = req.body;
    const existingRecommendation = await Recommendation.findOne({ _id: id, user_id: userId }).lean();
    if (!existingRecommendation) {
      return res.status(404).json({ success: false, message: "Not found", error: "Recommendation not found" });
    }

    if (existingRecommendation.status !== "Pending") {
      return res.status(400).json({ success: false, message: "Validation Error", error: "Only Pending recommendations can be rejected" });
    }

    const savedRec = await Recommendation.findOneAndUpdate(
      { _id: id, user_id: userId, status: "Pending" },
      { $set: { status: "Rejected", notes: reason } },
      { new: true }
    );

    if (!savedRec) {
      return res.status(400).json({ success: false, message: "Validation Error", error: "Only Pending recommendations can be rejected" });
    }

    await logAction(userId, "rejected", "recommendation", savedRec._id, { change_from: existingRecommendation, change_to: savedRec }, `User rejected recommendation: ${reason}`);

    return res.status(200).json({ success: true, data: savedRec });
  } catch (error) {
    console.error("Reject recommendation error:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

export const exportRecommendation = async (req, res) => {
  try {
    const { id } = req.params;
    const { format = "email" } = req.query;
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized", error: "Missing user ID context" });
    if (!id.match(/^[0-9a-fA-F]{24}$/)) return res.status(400).json({ success: false, message: "Validation Error", error: "Invalid ID format" });

    const recommendation = await Recommendation.findOne({ _id: id, user_id: userId }).lean();
    if (!recommendation) return res.status(404).json({ success: false, message: "Not found", error: "Recommendation not found" });

    const anomaly = await Anomaly.findById(recommendation.anomaly_id).lean();
    const transaction = anomaly?.transaction_id ? await Transaction.findById(anomaly.transaction_id).lean() : null;

    const vendorName = transaction?.vendor_name || "Vendor";
    const recoveryAmt = recommendation.estimated_recovery || 0;
    const actionSteps = recommendation.action_description || "Please review account details for discrepancies.";

    if (format === "email") {
      const lines = (recommendation.template_email || "").split('\n');
      const subjectLine = lines.find((line) => line.startsWith("Subject:"))?.replace("Subject:", "").trim() || `Action Required regarding ${vendorName}`;
      const bodyContent = lines.filter((line) => !line.startsWith("Subject:")).join('\n') || actionSteps;

      const structuredEmail = {
        subject: subjectLine,
        body: `To Whom It May Concern,\n\n${bodyContent}\n\nEstimated discrepancy:  ₹${recoveryAmt}\n\nAction required: ${actionSteps}\n\nBest Regards,\nBilling Team`,
        to: `billing@${vendorName.toLowerCase().replace(/\s/g, '')}.com`,
        cc: "internal-finance@company.com"
      };

      return res.status(200).json({ success: true, data: structuredEmail });
    }

    if (format === "document" || format === "pdf") {
      const documentStr = `===========================================\r\nLEAKAGE DISPUTE DOCUMENTATION\r\n===========================================\r\nVendor: ${vendorName.toUpperCase()}\r\nTransaction Ref: ${transaction?.invoice_number || "N/A"}\r\nDate Triggered: ${anomaly?.detected_at ? new Date(anomaly.detected_at).toDateString() : "N/A"}\r\n\r\nDISCREPANCY OVERVIEW\r\n-------------------------------------------\r\nCalculated Discrepancy Amount:  ₹${recoveryAmt}\r\nIssue Type: ${anomaly?.detection_method || "Unknown"}\r\nRoot Cause Analysis: ${anomaly?.reason_description || "Pending"}\r\n\r\nREQUIRED ACTION STEPS\r\n-------------------------------------------\r\n${actionSteps}\r\n\r\nNOTES\r\n-------------------------------------------\r\n${recommendation.notes || "No additional notes provided."}\r\n===========================================\r\n`;
      return res.status(200).json({ success: true, data: { format, content: documentStr } });
    }

    return res.status(400).json({ success: false, message: "Validation Error", error: "Unknown format. Use 'email', 'pdf', or 'document'" });
  } catch (error) {
    console.error("Export recommendation error:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};
