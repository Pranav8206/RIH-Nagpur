import { Recommendation } from "../models/recommendation.model.js";
import { Anomaly } from "../models/anomaly.model.js";
import { Transaction } from "../models/transaction.model.js";

/**
 * Automates creation of recommended mitigation strategies
 * @param {Object} anomaly The finalized anomaly doc
 * @returns {Promise<Array<Object>>} Inserted recommendation objects
 */
export const generateRecommendations = async (anomaly) => {
  try {
    const transaction = anomaly.transaction_id && anomaly.transaction_id.vendor_name
      ? anomaly.transaction_id
      : await Transaction.findById(anomaly.transaction_id).lean();

    if (!transaction) throw new Error("Transaction not found for anomaly.");

    const reason = `${anomaly.detection_method || "Anomaly"} - ${anomaly.reason_description || "Review required."}`;
    const leakageType = anomaly.severity === "High" ? "Fraud" : anomaly.detection_method?.includes("Duplicate") ? "Duplicate" : "Vendor Overpayment";
    const actionDescription = anomaly.severity === "High"
      ? "Escalate to finance and security review immediately"
      : anomaly.detection_method?.includes("Duplicate")
        ? "Validate invoice duplication and request vendor refund"
        : "Review transaction and negotiate recovery with vendor";
    
    // Calculates priority logarithmically leaning based on raw recovery cash pool
    let priorityVal = 3;
    if (anomaly.anomaly_score > 0.9) priorityVal = 5;
    else if (anomaly.anomaly_score > 0.75) priorityVal = 4;
    else if (anomaly.anomaly_score < 0.6) priorityVal = 2;

    const rec = new Recommendation({
      user_id: anomaly.user_id,
      anomaly_id: anomaly._id,
        recommendation_type: "Remediation Action",
      action_template: leakageType,
      estimated_recovery: Math.round((transaction.amount || 0) * 0.3),
        priority: priorityVal,
        status: "Pending", // Ensures Virtual `isActionable` remains True
      action_description: actionDescription,
      template_email: `Subject: Review required for ${transaction.vendor_name}\n\n${reason}`
    });

    const savedRec = await rec.save();
    return [savedRec]; // Return as an array according to requirements

  } catch (error) {
    console.error("Error in recommendationService:", error.message);
    throw new Error("Failed to generate recommendation.");
  }
};
