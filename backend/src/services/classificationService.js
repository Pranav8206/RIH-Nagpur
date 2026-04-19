import { Classification } from "../models/classification.model.js";

// Ensure this matches the procurement logic constants
const APPROVED_VENDORS = ["AWS", "Microsoft", "Uber", "Dell", "Salesforce"];

/**
 * Implements strict rule-based classification assigning root causes and calculating recovery 
 * @param {Object} anomaly The saved anomaly document
 * @returns {Promise<Object>} Created classification document 
 */
export const classifyAnomaly = async (anomaly) => {
  try {
    let transaction;
    // Keep it stateless and unpopulated where possible. 
    // Usually standard architecture passes populated models. If not we grab it quickly cleanly.
    if (anomaly.transaction_id && anomaly.transaction_id.vendor_name) {
      transaction = anomaly.transaction_id;
    } else {
      const { Transaction } = await import("../models/transaction.model.js");
      transaction = await Transaction.findById(anomaly.transaction_id).lean();
    }

    if (!transaction) throw new Error("Transaction not found for anomaly.");

    // Default fallbacks
    let leakageType = "Fraud";
    let confidence = 0.50;
    let rootCause = "Unknown Suspicious Pattern";
    let estRecovery = transaction.amount || 0;
    let impact = anomaly.severity || "Low";

    const reasonDesc = (anomaly.reason_description || "").toLowerCase();
    const methodDesc = (anomaly.detection_method || "").toLowerCase();

    // 1. Unauthorized Vendor Check
    // vendor not in approved list
    if (!APPROVED_VENDORS.includes(transaction.vendor_name) && !reasonDesc.includes("duplicate")) {
      leakageType = "Unauthorized";
      confidence = 0.95;
      rootCause = "Purchased outside of approved procurement vendors";
    }
    // 2. Duplicate Detection
    // identified via previous heuristics matching exact patterns
    else if (methodDesc.includes("duplicate") || reasonDesc.includes("duplicate") || reasonDesc.includes("match another")) {
      leakageType = "Duplicate";
      confidence = 0.99;
      rootCause = "System failed to deduplicate invoice submissions";
    }
    // 3. Amount Outlier Analysis
    // identified via z-scores, potentially classifying as overpayment vs budget creep
    else if (methodDesc.includes("z-score")) {
       if (transaction.amount > 50000) {
           leakageType = "Budget Creep";
           confidence = 0.85;
           rootCause = "Uncontrolled license scaling or package upgrade resulting in increasing spend trend";
       } else {
           leakageType = "Vendor Overpayment";
           confidence = 0.70;
           rootCause = "Possible unnegotiated markup on vendor unit pricing";
           estRecovery = parseFloat((transaction.amount * 0.3).toFixed(2)); // Recover 30% gap
       }
    }
    // 4. Idle Subscription
    // recurring pattern usually indicated by vague recurring charges with low amounts
    else if (transaction.payment_method === "Credit Card" && transaction.amount < 5000 && reasonDesc.includes("subscription")) {
       leakageType = "Idle Subscription";
       confidence = 0.80;
       rootCause = "Recurring automated payment without active verified use";
    }

    const newClass = new Classification({
      anomaly_id: anomaly._id,
      leakage_type: leakageType,
      confidence_score: confidence,
      root_cause: rootCause,
      key_indicators: { 
          vendor: transaction.vendor_name, 
          amount: transaction.amount, 
          detected_via: methodDesc 
      },
      recommended_action: `Investigate ${leakageType} workflow immediately.`,
      estimated_recovery: estRecovery,
      impact_level: impact
    });

    const savedClassification = await newClass.save();
    return savedClassification;

  } catch (error) {
    console.error("Error in classificationService:", error.message);
    throw new Error("Failed to classify anomaly.");
  }
};
