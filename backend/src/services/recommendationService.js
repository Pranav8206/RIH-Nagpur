import { Recommendation } from "../models/recommendation.model.js";

// Template configurations handling the text outputs mapping logic
const ACTION_TEMPLATES = {
  "Duplicate": {
    action: "Request immediate refund for duplicate invoice",
    email: "Subject: Urgent: Duplicate Invoice Payment Refund Request\n\nDear Billing Dept,\nPlease refund the duplicate charge..."
  },
  "Vendor Overpayment": {
    action: "Initiate vendor negotiation / price correction",
    email: "Subject: Price discrepancy review\n\nCan we schedule a call to review the recent invoice markup?"
  },
  "Idle Subscription": {
    action: "Cancel subscription immediately from portal",
    email: "Subject: Immediate Account Cancellation\n\nPlease close this account and halt auto-renewal."
  },
  "Fraud": {
    action: "Escalate to Legal & Security team",
    email: "Subject: SECURITY ALERT: Potential Fraudulent Activity detected on Corporate Card"
  },
  "Unauthorized": {
    action: "Issue compliance internal warning to employee",
    email: "Subject: Policy Violation: Use of unapproved vendor\n\nPlease migrate your tools to our approved list."
  },
  "Budget Creep": {
    action: "Schedule budgeting review meeting with department head",
    email: "Subject: Q3 Budget creep detected\n\nWe noticed a variance in standard spend. Let's align on forecasts."
  }
};

/**
 * Automates creation of recommended mitigation strategies
 * @param {Object} classification The finalized classification doc
 * @returns {Promise<Array<Object>>} Inserted recommendation objects
 */
export const generateRecommendations = async (classification) => {
  try {
    const leakageType = classification.leakage_type;
    const template = ACTION_TEMPLATES[leakageType] || ACTION_TEMPLATES["Fraud"];
    
    // Calculates priority logarithmically leaning based on raw recovery cash pool
    let priorityVal = 3;
    if (classification.estimated_recovery > 50000) priorityVal = 5;
    else if (classification.estimated_recovery > 10000) priorityVal = 4;
    else if (classification.estimated_recovery < 1000) priorityVal = 2;

    const rec = new Recommendation({
        user_id: classification.user_id, // Handled implicitly via parent below
        classification_id: classification._id,
        recommendation_type: "Remediation Action",
        action_template: leakageType,
        estimated_recovery: classification.estimated_recovery,
        priority: priorityVal,
        status: "Pending", // Ensures Virtual `isActionable` remains True
        action_description: template.action,
        template_email: template.email
    });

    // To ensure strict schema validations if `user_id` wasn't mapped through from classification to rec
    if (!rec.user_id) {
        const { Anomaly } = await import("../models/anomaly.model.js");
        const linkedAnomaly = await Anomaly.findById(classification.anomaly_id).lean();
        if (linkedAnomaly) rec.user_id = linkedAnomaly.user_id;
    }

    const savedRec = await rec.save();
    return [savedRec]; // Return as an array according to requirements

  } catch (error) {
    console.error("Error in recommendationService:", error.message);
    throw new Error("Failed to generate recommendation.");
  }
};
