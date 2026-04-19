import Joi from "joi";
import { Classification } from "../models/classification.model.js";
import { Anomaly } from "../models/anomaly.model.js";
import { Recommendation } from "../models/recommendation.model.js";
import { AuditLog } from "../models/auditLog.model.js";
import { classifyAnomaly } from "../services/classificationService.js";
import { logAction } from "../services/auditService.js";

// Joi Schemas
export const updateClassificationSchema = Joi.object({
  leakage_type: Joi.string().valid("Duplicate", "Fraud", "Idle Subscription", "Vendor Overpayment", "Budget Creep", "Unauthorized").optional(),
  confidence_score: Joi.number().min(0).max(1).optional(),
  root_cause: Joi.string().optional(),
  manual_override: Joi.boolean().optional(),
  override_reason: Joi.string().when('manual_override', { is: true, then: Joi.required() })
});

export const classifyFlow = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized", error: "Missing user ID context" });

    // Step 1: Find Anomalies missing Classifications
    const existingClassifications = await Classification.find().select('anomaly_id').lean();
    const classifiedAnomalyIds = existingClassifications.map(c => c.anomaly_id);

    // Fetch batch natively
    const unclassifiedAnomalies = await Anomaly.find({
        user_id: userId,
        _id: { $nin: classifiedAnomalyIds }
    }).lean();

    if (unclassifiedAnomalies.length === 0) {
        return res.status(200).json({
            success: true,
            classified: 0,
            high_risk: 0,
            total_recovery_potential: 0,
            message: "No unclassified anomalies found"
        });
    }

    // Process all mapping queries dynamically waiting on the functional Classification Service loop uniformly
    const createdClassifications = await Promise.all(
        unclassifiedAnomalies.map(anomaly => classifyAnomaly(anomaly))
    );

    // Calculate aggregated outputs securely
    const highRiskCount = createdClassifications.filter(c => c.impact_level === "High").length;
    const totalPotential = createdClassifications.reduce((sum, c) => sum + c.estimated_recovery, 0);

    // Ensure we trigger the audit correctly mapped logically
    await logAction(userId, "classified", "classification_batch", null, { change_to: `Created ${createdClassifications.length} classifications.` }, "User ran automated classification mapping");

    return res.status(201).json({
        success: true,
        data: {
             classified: createdClassifications.length,
             high_risk: highRiskCount,
             total_recovery_potential: parseFloat(totalPotential.toFixed(2))
        }
    });

  } catch (error) {
    console.error("Classify error:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

export const getClassifications = async (req, res) => {
  try {
    // Note: To filter by `user_id`, we must either store `user_id` originally on Classification, 
    // or perform a slightly more advanced lookup against the parent Anomaly since our classification 
    // schema technically doesn't directly map to user_id outside of its nested anomaly_id!
    // Since classification logic didn't append `user_id` statically in our model earlier (just `anomaly_id`),
    // we will pull the User's Anomalies securely first, then lookup from there.
    
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized", error: "Missing user ID context" });

    // Grab all legitimate parent anomalies locally avoiding unvalidated viewing queries
    const userAnomalies = await Anomaly.find({ user_id: userId }).select('_id').lean();
    const authorizedAnomalyIds = userAnomalies.map(a => a._id);

    const { leakage_type, impact_level, page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    const query = { anomaly_id: { $in: authorizedAnomalyIds } };
    if (leakage_type) query.leakage_type = leakage_type;
    if (impact_level) query.impact_level = impact_level;

    const total = await Classification.countDocuments(query);
    const classifications = await Classification.find(query)
      .sort({ created_at: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    return res.status(200).json({
      success: true,
      total,
      page: pageNum,
      limit: limitNum,
      data: classifications
    });

  } catch (error) {
    console.error("Fetch classifications error:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

export const getClassificationById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized", error: "Missing user ID context" });

    if (!id.match(/^[0-9a-fA-F]{24}$/)) return res.status(400).json({ success: false, message: "Validation Error", error: "Invalid classification ID format" });

    const classification = await Classification.findById(id).lean();
    if (!classification) return res.status(404).json({ success: false, message: "Not found", error: "Classification not found" });

    // Validate ownership via anomaly mapping safely
    const anomaly = await Anomaly.findOne({ _id: classification.anomaly_id, user_id: userId }).lean();
    if (!anomaly) return res.status(403).json({ success: false, message: "Forbidden", error: "Classification does not map to your user space" });

    const recommendations = await Recommendation.find({ classification_id: classification._id }).lean();
    
    // Grab all relevant audit logs securely mapped by `classification` OR the `anomaly` natively giving robust history flow
    const audit_logs = await AuditLog.find({ 
        $or: [
           { entity_type: "classification", entity_id: classification._id },
           { entity_type: "anomaly", entity_id: anomaly._id }
        ]
    }).sort({ timestamp: -1 }).lean();

    return res.status(200).json({
      success: true,
      data: {
        classification,
        anomaly,
        recommendations,
        audit_logs
      }
    });

  } catch (error) {
    console.error("Get classification by ID error:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

export const updateClassification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized", error: "Missing user ID context" });

    if (!id.match(/^[0-9a-fA-F]{24}$/)) return res.status(400).json({ success: false, message: "Validation Error", error: "Invalid classification ID format" });

    const classification = await Classification.findById(id);
    if (!classification) return res.status(404).json({ success: false, message: "Not found", error: "Classification not found" });

    // Validate auth space structure safely mapping through parent
    const anomaly = await Anomaly.findOne({ _id: classification.anomaly_id, user_id: userId }).lean();
    if (!anomaly) return res.status(403).json({ success: false, message: "Forbidden", error: "Not authorized" });

    const originalData = classification.toObject();

    const { leakage_type, confidence_score, root_cause, manual_override, override_reason } = req.body;

    if (leakage_type) classification.leakage_type = leakage_type;
    if (confidence_score !== undefined) classification.confidence_score = confidence_score;
    if (root_cause) classification.root_cause = root_cause;
    
    if (manual_override !== undefined) {
        classification.manual_override = manual_override;
        if (manual_override === true && !override_reason) {
            return res.status(400).json({ success: false, message: "Validation Error", error: "override_reason is strictly required if manual_override is true" });
        }
    }
    
    if (override_reason) classification.override_reason = override_reason;

    const savedClassification = await classification.save();

    await logAction(userId, "overridden", "classification", savedClassification._id, { change_from: originalData, change_to: savedClassification }, "User manually modified classification boundaries");

    return res.status(200).json({
      success: true,
      data: savedClassification
    });

  } catch (error) {
    console.error("Update classification error:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};
