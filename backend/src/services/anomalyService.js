import { Anomaly } from "../models/anomaly.model.js";
import { Transaction } from "../models/transaction.model.js";

/**
 * Helper to calculate statistical mean and standard deviation
 * @param {Array<number>} amounts 
 * @returns { mean: number, stdDev: number}
 */
const calculateStats = (amounts) => {
  if (!amounts || amounts.length === 0) return { mean: 0, stdDev: 0 };
  const n = amounts.length;
  const mean = amounts.reduce((sum, val) => sum + val, 0) / n;
  const variance = amounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
  return { mean, stdDev: Math.sqrt(variance) };
};

/**
 * Detects anomalies using custom Z-score and heuristics, saves to DB
 * @param {Array<Object>} transactions array of transaction documents
 * @returns {Promise<Array<Object>>} created anomaly records 
 */
export const detectAnomalies = async (transactions) => {
  if (!transactions || transactions.length === 0) return [];

  const anomaliesToCreate = [];
  const amounts = transactions.map(t => t.amount);
  const { mean, stdDev } = calculateStats(amounts);
  const sortedAmounts = [...amounts].sort((a, b) => a - b);
  const percentile90 = sortedAmounts[Math.floor(sortedAmounts.length * 0.9)] ?? 0;

  // Use a map to aggressively detect duplicates (same vendor, same amount, same rough date)
  const groupedKeys = new Map();
  const vendorCounts = new Map();

  for (const trx of transactions) {
    const vendorKey = (trx.vendor_name || "").toLowerCase();
    vendorCounts.set(vendorKey, (vendorCounts.get(vendorKey) || 0) + 1);
    const vendorOccurrences = vendorCounts.get(vendorKey);

    // 1. DUPLICATE DETECTION LOGIC
    // We assume exact amount, vendor and date constitutes a high-risk duplicate
    const dateStr = new Date(trx.date).toISOString().split('T')[0]; 
    const dupKey = `${trx.vendor_name}-${trx.amount}-${dateStr}`;
    
    if (groupedKeys.has(dupKey)) {
      anomaliesToCreate.push({
        user_id: trx.user_id,
        transaction_id: trx._id,
        anomaly_score: 0.95,
        detection_type: "Statistical",
        detection_method: "Duplicate Heuristic",
        severity: "High",
        reason_description: "Transaction amount, vendor, and date strongly match another transaction.",
        status: "New"
      });
      continue; // Skip z-score outlier check if it's already flagged directly
    } else {
      groupedKeys.set(dupKey, true);
    }

    // 2. OUTLIER LOGIC (Custom Z-Score)
    // Formula: Z = (X - μ) / σ
    if (stdDev > 0) {
      const zScore = Math.abs((trx.amount - mean) / stdDev);
      
      // Values with a zScore > 2 are significantly outside normal variance
      if (zScore > 2) {
        // Normalize anomalous Z-score to a 0-1 scale (capped at 1)
        const normalizedScore = Math.min(1, Math.max(0, (zScore - 2) / 4 + 0.5));
        
        anomaliesToCreate.push({
          user_id: trx.user_id,
          transaction_id: trx._id,
          anomaly_score: parseFloat(normalizedScore.toFixed(3)),
          detection_type: "Statistical",
          detection_method: "Z-Score Heuristics",
          severity: normalizedScore > 0.8 ? "High" : "Medium",
          reason_description: `Amount deviates heavily from typical department average with a Z-score of ${zScore.toFixed(2)}.`,
          status: "New"
        });
        continue;
      }
    }

    // 3. HIGH-SPEND AND RECURRENCE HEURISTICS
    // These help ensure realistic expense datasets surface meaningful flagged records.
    if (transactions.length >= 20 && trx.amount >= percentile90 && trx.amount > mean) {
      anomaliesToCreate.push({
        user_id: trx.user_id,
        transaction_id: trx._id,
        anomaly_score: 0.72,
        detection_type: "Behavioral",
        detection_method: "Top Spend Percentile",
        severity: "Medium",
        reason_description: "Transaction sits in the highest spend band for the current user dataset.",
        status: "New"
      });
      continue;
    }

    if (vendorOccurrences >= 5 && trx.amount >= mean * 0.75) {
      anomaliesToCreate.push({
        user_id: trx.user_id,
        transaction_id: trx._id,
        anomaly_score: 0.65,
        detection_type: "Behavioral",
        detection_method: "Recurring Vendor Pattern",
        severity: "Low",
        reason_description: "Vendor appears unusually often across the imported transaction set.",
        status: "New"
      });
    }
  }

  try {
    if (anomaliesToCreate.length > 0) {
      const createdAnomalies = await Anomaly.insertMany(anomaliesToCreate);
      return createdAnomalies;
    }
    return [];
  } catch (error) {
    console.error("Error in anomalyService:", error.message);
    throw new Error("Failed to detect and save anomalies");
  }
};

/**
 * Detect anomalies for transactions that do not yet have anomaly records.
 * Returns both scanned and created counts for API feedback.
 */
export const syncMissingAnomaliesForUser = async (userId) => {
  if (!userId) return { detected: 0, created: 0, anomalies: [] };

  const existingAnomalies = await Anomaly.find({ user_id: userId }).select("transaction_id").lean();
  const existingTransactionIds = existingAnomalies.map((anomaly) => anomaly.transaction_id);

  const unprocessedTransactions = await Transaction.find({
    user_id: userId,
    is_deleted: { $ne: true },
    _id: { $nin: existingTransactionIds }
  }).lean();

  if (unprocessedTransactions.length === 0) {
    return { detected: 0, created: 0, anomalies: [] };
  }

  const createdAnomalies = await detectAnomalies(unprocessedTransactions);
  return {
    detected: unprocessedTransactions.length,
    created: createdAnomalies.length,
    anomalies: createdAnomalies
  };
};
