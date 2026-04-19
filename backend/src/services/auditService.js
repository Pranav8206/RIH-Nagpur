import { AuditLog } from "../models/auditLog.model.js";

/**
 * Pure dependency-free abstraction for writing system logs securely
 * @param {string|ObjectId} user_id ID representing who performed action
 * @param {string} action_type Enum Action e.g., 'View', 'Classify'
 * @param {string} entity_type Identifiable collection representation
 * @param {string|ObjectId} entity_id ID of touched document 
 * @param {Object} changes Object containing structural JSON `{ change_from, change_to }`
 * @param {string} reason Text explanation usually provided from front-end
 * @returns {Promise<Object|null>} Inserted Log / null if exception
 */
export const logAction = async (user_id, action_type, entity_type, entity_id, changes, reason) => {
  try {
    const { change_from, change_to } = changes || {};

    const log = new AuditLog({
      user_id: user_id,
      action_type: action_type,
      entity_type: entity_type,
      entity_id: entity_id,
      change_from: change_from ? JSON.stringify(change_from) : undefined,
      change_to: change_to ? JSON.stringify(change_to) : undefined,
      reason: reason || "Standard system operation tracking",
      ip_address: "127.0.0.1", // Standard localhost placeholder. Usually wired to `req.ip` from express middleware.
      timestamp: new Date()
    });

    const savedLog = await log.save();
    return savedLog;
  } catch (error) {
    console.error("Error logging audit action internally:", error.message);
    // Explicitly non-blocking app flow due to being an audit log; returns cleanly.
    return null;
  }
};
