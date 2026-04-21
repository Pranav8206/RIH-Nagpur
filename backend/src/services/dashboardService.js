import { DashboardMetric } from "../models/dashboardMetric.model.js";
import { Transaction } from "../models/transaction.model.js";
import { Anomaly } from "../models/anomaly.model.js";
import { Recommendation } from "../models/recommendation.model.js";
import mongoose from "mongoose";

const toObjectId = (value) => {
  if (!value) return value;
  return mongoose.Types.ObjectId.isValid(value) ? new mongoose.Types.ObjectId(value) : value;
};

/**
 * Computes live mathematical aggregations avoiding sub-joins utilizing grouping for performance
 * @param {string|ObjectId} user_id Dashboard Viewer ID 
 * @param {Date} targetDate Upper boundary for tracking metrics (defaults to Now)
 * @returns {Promise<Object>} The finalized inserted Dashboard Metric document
 */
export const computeMetrics = async (user_id, targetDate = new Date()) => {
  try {
    const userObjectId = toObjectId(user_id);
    const endDate = new Date(targetDate);
    endDate.setHours(23, 59, 59, 999); // Force alignment to end of given Date
    const startDate = new Date(endDate);
    startDate.setHours(0, 0, 0, 0);

    // 1. Transaction level sums
    const trxStats = await Transaction.aggregate([
      { $match: { user_id: userObjectId, is_deleted: { $ne: true }, date: { $lte: endDate } } },
      { 
        $group: {
          _id: null,
          total_transactions: { $sum: 1 },
          total_spend: { $sum: "$amount" },
        }
      }
    ]);

    // Secondary pipelines for quick facet extractions avoiding dense code
    const vendorStats = await Transaction.aggregate([
      { $match: { user_id: userObjectId, is_deleted: { $ne: true }, date: { $lte: endDate } } },
      { $group: { _id: "$vendor_name", sumSpend: { $sum: "$amount" } } },
      { $sort: { sumSpend: -1 } },
      { $limit: 1 }
    ]);

    const deptStats = await Transaction.aggregate([
      { $match: { user_id: userObjectId, is_deleted: { $ne: true }, date: { $lte: endDate } } },
      { $group: { _id: "$department", sumSpend: { $sum: "$amount" } } },
      { $sort: { sumSpend: -1 } },
      { $limit: 1 }
    ]);

    // 2. Anomaly level aggregations
    // Fast conditional grouping internally utilizing MongoDB math limits
    const anomalyStats = await Anomaly.aggregate([
      { $match: { user_id: userObjectId, detected_at: { $lte: endDate } } },
      {
        $group: {
           _id: null,
           total_anomalies: { $sum: 1 },
           total_high_risk: { 
             $sum: { $cond: [{ $eq: ["$severity", "High"] }, 1, 0] } 
           }
        }
      }
    ]);

    // 3. Recommendations tracking
    const recStats = await Recommendation.aggregate([
      { $match: { user_id: userObjectId, status: { $in: ["Pending", "Executed"] } } },
        { 
            $group: {
                _id: null,
                open_count: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } },
                total_recovered: { $sum: "$actual_recovery" },
                potential_recovery: { $sum: "$estimated_recovery" }
            }
        }
    ]);

    // Map extracted stats safely in case queries resulted empty []
    const tStats = trxStats[0] || { total_transactions: 0, total_spend: 0 };
    const aStats = anomalyStats[0] || { total_anomalies: 0, total_high_risk: 0 };
    const rStats = recStats[0] || { open_count: 0, total_recovered: 0, potential_recovery: 1 };
    
    // Mathematical boundary safety checks
    let recRate = 0;
    if (rStats.potential_recovery > 0) {
      recRate = (rStats.total_recovered / rStats.potential_recovery) * 100;
    }

    const metricData = {
      user_id: userObjectId,
      date_snapshot: endDate,
      total_transactions: tStats.total_transactions,
      total_spend: parseFloat(tStats.total_spend.toFixed(2)),
      anomalies_detected: aStats.total_anomalies,
      anomalies_high_risk: aStats.total_high_risk,
      recommendations_open: rStats.open_count,
      total_recovered: parseFloat(rStats.total_recovered.toFixed(2)),
      recovery_potential: parseFloat((rStats.potential_recovery || 0).toFixed(2)),
      recovery_rate: parseFloat(recRate.toFixed(2)),
      top_leakage_type: "Various",
      top_vendor: vendorStats.length > 0 ? vendorStats[0]._id : "None",
      top_department: deptStats.length > 0 ? deptStats[0]._id : "None"
    };

    const savedMetric = await DashboardMetric.findOneAndUpdate(
      {
        user_id: userObjectId,
        date_snapshot: { $gte: startDate, $lte: endDate }
      },
      { $set: metricData },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    return savedMetric;

  } catch (error) {
    console.error("Error computing dashboard metrics:", error.message);
    throw new Error("Failed to compute aggregated dashboard metrics");
  }
};
