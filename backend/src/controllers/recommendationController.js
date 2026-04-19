import Joi from "joi";
import { Recommendation } from "../models/recommendation.model.js";
import { Classification } from "../models/classification.model.js";
import { Anomaly } from "../models/anomaly.model.js";
import { Transaction } from "../models/transaction.model.js";
import { generateRecommendations } from "../services/recommendationService.js";
import { logAction } from "../services/auditService.js";

// Joi Schemas
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

    // Step 1: Find classifications that ALREADY have recommendations
    const existingRecs = await Recommendation.find().select('classification_id').lean();
    const existingRecIds = existingRecs.map(r => r.classification_id);

    // Step 2: Grab User's anomalies to filter classifications strictly natively avoiding heavy JOINs
    const userAnomalies = await Anomaly.find({ user_id: userId }).select('_id').lean();
    const anomalyIds = userAnomalies.map(a => a._id);

    // Fetch batch of classifications missing recommendations mapped to current user
    const unrecommendedClassifications = await Classification.find({
        anomaly_id: { $in: anomalyIds }, 
        _id: { $nin: existingRecIds }
    }).lean();

    if (unrecommendedClassifications.length === 0) {
        return res.status(200).json({
            success: true,
            generated: 0,
            pending: 0,
            total_recovery_potential: 0,
            message: "No new classifications found needing recommendations"
        });
    }

    // Process mapping queries dynamically waiting on functional Service loop 
    const createdRecommendationsArrays = await Promise.all(
        unrecommendedClassifications.map(classification => generateRecommendations(classification))
    );
    
    // Flatten Array of Arrays returned from Service
    const createdRecommendations = createdRecommendationsArrays.flat();

    // Aggregations
    const pendingCount = createdRecommendations.filter(r => r.status === "Pending").length;
    const totalPotential = createdRecommendations.reduce((sum, r) => sum + r.estimated_recovery, 0);

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

    // Extract light classifications summary
    const classIds = recommendations.map(r => r.classification_id);
    const relatedClassifications = await Classification.find({ _id: { $in: classIds } }).select('_id leakage_type confidence_score root_cause').lean();

    const mappedRecommendations = recommendations.map(rec => {
        const classf = relatedClassifications.find(c => c._id.toString() === rec.classification_id.toString());
        return {
            ...rec,
            classification_summary: classf || null
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

export const getRecommendationById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized", error: "Missing user ID context" });

    if (!id.match(/^[0-9a-fA-F]{24}$/)) return res.status(400).json({ success: false, message: "Validation Error", error: "Invalid ID format" });

    const recommendation = await Recommendation.findOne({ _id: id, user_id: userId }).lean();
    if (!recommendation) return res.status(404).json({ success: false, message: "Not found", error: "Recommendation not found" });

    const classification = await Classification.findById(recommendation.classification_id).lean();
    
    let anomaly = null;
    if (classification && classification.anomaly_id) {
       anomaly = await Anomaly.findById(classification.anomaly_id).lean();
    }

    return res.status(200).json({
      success: true,
      data: {
        id: recommendation._id,
        classification,
        anomaly, 
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

    const recommendation = await Recommendation.findOne({ _id: id, user_id: userId });
    if (!recommendation) return res.status(404).json({ success: false, message: "Not found", error: "Recommendation not found" });

    if (recommendation.status !== "Pending") {
        return res.status(400).json({ success: false, message: "Validation Error", error: 'Only Pending recommendations can be executed' });
    }

    const { actual_recovery, notes } = req.body;
    const originalData = recommendation.toObject();

    recommendation.status = "Executed";
    recommendation.executed_by = userId;
    recommendation.executed_date = new Date();
    
    if (actual_recovery !== undefined) recommendation.actual_recovery = actual_recovery;
    if (notes) recommendation.notes = notes;

    const savedRec = await recommendation.save();

    await logAction(userId, "executed", "recommendation", savedRec._id, { change_from: originalData, change_to: savedRec }, "User marked recommendation as Executed");

    return res.status(200).json({
      success: true,
      data: savedRec
    });

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

    const recommendation = await Recommendation.findOne({ _id: id, user_id: userId });
    if (!recommendation) return res.status(404).json({ success: false, message: "Not found", error: "Recommendation not found" });

    if (recommendation.status !== "Pending") {
        return res.status(400).json({ success: false, message: "Validation Error", error: 'Only Pending recommendations can be rejected' });
    }

    const { reason } = req.body;
    const originalData = recommendation.toObject();

    recommendation.status = "Rejected";
    recommendation.notes = reason;

    const savedRec = await recommendation.save();

    await logAction(userId, "rejected", "recommendation", savedRec._id, { change_from: originalData, change_to: savedRec }, `User rejected recommendation: ${reason}`);

    return res.status(200).json({
      success: true,
      data: savedRec
    });

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
        
        // Deep string replacement relies on native JS nested fetches strictly avoiding slow populated chained returns
        const classification = await Classification.findById(recommendation.classification_id).lean();
        const anomaly = classification?.anomaly_id ? await Anomaly.findById(classification.anomaly_id).lean() : null;
        const transaction = anomaly?.transaction_id ? await Transaction.findById(anomaly.transaction_id).lean() : null;

        const vendorName = transaction?.vendor_name || "Vendor";
        const recoveryAmt = recommendation.estimated_recovery || 0;
        const actionSteps = recommendation.action_description || "Please review account details for discrepancies.";

        if (format === "email") {
            const lines = (recommendation.template_email || "").split('\n');
            const subjectLine = lines.find(l => l.startsWith("Subject:"))?.replace("Subject:", "").trim() || `Action Required regarding ${vendorName}`;
            const bodyContent = lines.filter(l => !l.startsWith("Subject:")).join('\n') || actionSteps;

            const structuredEmail = {
                subject: subjectLine,
                body: `To Whom It May Concern,\n\n${bodyContent}\n\nEstimated discrepancy: $${recoveryAmt}\n\nAction required: ${actionSteps}\n\nBest Regards,\nBilling Team`,
                to: `billing@${vendorName.toLowerCase().replace(/\s/g, '')}.com`,
                cc: "internal-finance@company.com"
            };

            return res.status(200).json({ success: true, data: structuredEmail });
        } 
        
        if (format === "document" || format === "pdf") {
            // Generates raw text payload formatted neatly translating well into PDF writers logically
            const documentStr = `===========================================
LEAKAGE DISPUTE DOCUMENTATION
===========================================
Vendor: ${vendorName.toUpperCase()}
Transaction Ref: ${transaction?.invoice_number || "N/A"}
Date Triggered: ${anomaly?.detected_at ? new Date(anomaly.detected_at).toDateString() : "N/A"}

DISCREPANCY OVERVIEW
-------------------------------------------
Calculated Discrepancy Amount: $${recoveryAmt}
Issue Type: ${classification?.leakage_type || "Unknown"}
Root Cause Analysis: ${classification?.root_cause || "Pending"}

REQUIRED ACTION STEPS
-------------------------------------------
${actionSteps}

NOTES
-------------------------------------------
${recommendation.notes || "No additional notes provided."}
===========================================
`;
            return res.status(200).json({ success: true, data: { format: format, content: documentStr } });
        }

        return res.status(400).json({ success: false, message: "Validation Error", error: "Unknown format. Use 'email', 'pdf', or 'document'" });

    } catch (error) {
        console.error("Export recommendation error:", error);
        return res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};
