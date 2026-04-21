import Joi from "joi";
import mongoose from "mongoose";
import { Transaction } from "../models/transaction.model.js";
import { Anomaly } from "../models/anomaly.model.js";
import { DashboardMetric } from "../models/dashboardMetric.model.js";
import { computeMetrics as computeMetricsService } from "../services/dashboardService.js";
import { getCache, setCache, clearCache } from "../utils/cache.js";

// Schemas securely enforcing REST dates natively to stop crash-exceptions
export const computeMetricsSchema = Joi.object({
  date_snapshot: Joi.date().optional()
});

const toObjectId = (value) => {
  if (!value) return value;
  return mongoose.Types.ObjectId.isValid(value) ? new mongoose.Types.ObjectId(value) : value;
};

export const getMetrics = async (req, res) => {
  try {
    const userId = req.user?.id;
    const userObjectId = toObjectId(userId);
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized", error: "Missing identity mapping payload" });

    const targetDate = req.query.date_snapshot ? new Date(req.query.date_snapshot) : new Date();
    const dateStr = targetDate.toISOString().split('T')[0];
    const cacheKey = `dashboard:metrics:${userId}:${dateStr}`;
  const forceRefresh = String(req.query.refresh || "").toLowerCase() === "true";

  if (!forceRefresh) {
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return res.status(200).json({ success: true, from_cache: true, data: cachedData });
    }
    }

    const endOfDay = new Date(dateStr);
    endOfDay.setHours(23, 59, 59, 999);

  let metric = await computeMetricsService(userObjectId, endOfDay);
  metric = metric?.toObject ? metric.toObject() : metric;

    const resData = {
        total_transactions: metric.total_transactions || 0,
        total_spend: metric.total_spend || 0,
        anomalies_detected: metric.anomalies_detected || 0,
        anomalies_high_risk: metric.anomalies_high_risk || 0,
        recommendations_open: metric.recommendations_open || 0,
        total_recovered: metric.total_recovered || 0,
    recovery_potential: metric.recovery_potential || 0,
        recovery_rate: metric.recovery_rate || 0,
        top_leakage_type: metric.top_leakage_type || "None",
        top_vendor: metric.top_vendor || "None",
        top_department: metric.top_department || "None"
    };

  await setCache(cacheKey, resData, 60);

    return res.status(200).json({ success: true, from_cache: false, data: resData });

  } catch (error) {
    console.error("Dashboard metrics error:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

export const getTimeline = async (req, res) => {
  try {
    const userId = req.user?.id;
    const userObjectId = toObjectId(userId);
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized", error: "Missing identity mapping payload" });

    const { period = "month", date_from, date_to } = req.query;

    const matchStage = { user_id: userObjectId, is_deleted: { $ne: true } };
    if (date_from || date_to) {
        matchStage.date = {};
        if (date_from) matchStage.date.$gte = new Date(date_from);
        if (date_to) matchStage.date.$lte = new Date(date_to);
    }
    
    let formatStr = "%Y-%m-%d"; 
    if (period === "week") formatStr = "%Y-%U"; // Yearly Week index natively handled via Mongo
    if (period === "month") formatStr = "%Y-%m"; 

    // Aggregation structuring resolving timeline bounds
    const pipeline = [
        { $match: matchStage },
        { 
            $lookup: {
                from: "anomalies", 
                localField: "_id",
                foreignField: "transaction_id",
                as: "linked_anomalies"
            }
        },
        // Using explicit $sum combinations preventing internal populated structures crashing limit bounds 
        { 
            $group: {
                _id: { $dateToString: { format: formatStr, date: "$date" } },
                total_spend: { $sum: "$amount" },
                anomalies: { $sum: { $size: "$linked_anomalies" } },
                recovered: { $sum: 0 } // Safest logical approximation directly isolated down from explicit Transactions
            }
        },
        { $sort: { "_id": 1 } }
    ];

    const results = await Transaction.aggregate(pipeline);

    // Transforming strict output mappings natively 
    const out = {
        dates: results.map(r => r._id),
        total_spend: results.map(r => r.total_spend),
        anomalies: results.map(r => r.anomalies),
        recovered: results.map(r => r.recovered)
    };

    return res.status(200).json({ success: true, data: out });

  } catch (error) {
    console.error("Dashboard timeline error:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

export const getTopAnomalies = async (req, res) => {
  try {
    const userId = req.user?.id;
    const userObjectId = toObjectId(userId);
    const limit = parseInt(req.query.limit, 10) || 10;
    
    // Comprehensive joined aggregations dropping nested items cleanly down the chain sequentially
    const pipeline = [
      { $match: { user_id: userObjectId, status: { $ne: "Resolved" } } },
      { 
          $lookup: {
            from: "transactions",
            localField: "transaction_id",
            foreignField: "_id",
            as: "transaction"
          }
      },
      { $unwind: "$transaction" },
      { 
          $lookup: {
            from: "recommendations",
            localField: "_id",
            foreignField: "anomaly_id",
            as: "recommendation"
          }
      },
      { $unwind: { path: "$recommendation", preserveNullAndEmptyArrays: true } },
      {
          $addFields: {
              recovery_potential: { $ifNull: ["$recommendation.estimated_recovery", 0] },
              severity_weight: {
                 $switch: {
                    branches: [
                       { case: { $eq: ["$severity", "High"] }, then: 3 },
                       { case: { $eq: ["$severity", "Medium"] }, then: 2 },
                       { case: { $eq: ["$severity", "Low"] }, then: 1 }
                    ],
                    default: 0
                 }
              }
          }
      },
      { $sort: { severity_weight: -1, recovery_potential: -1 } },
      { $limit: limit },
      {
          $project: {
              severity_weight: 0 
          }
      }
    ];

    const results = await Anomaly.aggregate(pipeline);

    return res.status(200).json({ success: true, data: results });

  } catch (error) {
    console.error("Dashboard top anomalies error:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

export const getByDepartment = async (req, res) => {
  try {
    const userId = req.user?.id;
    const userObjectId = toObjectId(userId);

    const pipeline = [
      { $match: { user_id: userObjectId, is_deleted: { $ne: true } } },
      { 
          $lookup: {
            from: "anomalies",
            localField: "_id",
            foreignField: "transaction_id",
            as: "anomalies_arr"
          }
      },
      {
          $lookup: {
            from: "recommendations",
            localField: "anomalies_arr._id",
            foreignField: "anomaly_id",
            as: "recommendations_arr"
          }
      },
      {
          $group: {
              _id: "$department",
              total_spend: { $sum: "$amount" },
              anomalies_detected: { $sum: { $size: "$anomalies_arr" } },
            recovery_potential: { $sum: { $sum: "$recommendations_arr.estimated_recovery" } } 
          }
      },
      {
         $project: {
             department: { $ifNull: ["$_id", "Uncategorized"] },
             total_spend: 1,
             anomalies_detected: 1,
             recovery_potential: 1,
             recovery_rate: {
                 $cond: [
                   { $gt: ["$total_spend", 0] },
                   { $multiply: [{ $divide: ["$recovery_potential", "$total_spend"] }, 100] },
                   0
                 ]
             },
             _id: 0
         }
      },
      { $sort: { total_spend: -1 } }
    ];

    const results = await Transaction.aggregate(pipeline);
    return res.status(200).json({ success: true, data: results });

  } catch (error) {
    console.error("Dashboard by department error:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

export const getByVendor = async (req, res) => {
  try {
    const userId = req.user?.id;
    const userObjectId = toObjectId(userId);

    const pipeline = [
      { $match: { user_id: userObjectId, is_deleted: { $ne: true } } },
      { 
          $lookup: {
            from: "anomalies",
            localField: "_id",
            foreignField: "transaction_id",
            as: "anomalies_arr"
          }
      },
      {
          $lookup: {
            from: "recommendations",
            localField: "anomalies_arr._id",
            foreignField: "anomaly_id",
            as: "recommendations_arr"
          }
      },
      {
          $group: {
              _id: "$vendor_name",
              transaction_count: { $sum: 1 },
              total_spend: { $sum: "$amount" },
              anomalies: { $sum: { $size: "$anomalies_arr" } },
            recovery_potential: { $sum: { $sum: "$recommendations_arr.estimated_recovery" } } 
          }
      },
      {
         $project: {
             vendor: "$_id",
             transaction_count: 1,
             total_spend: 1,
             anomalies: 1,
             recovery_potential: 1,
             _id: 0
         }
      },
      { $sort: { recovery_potential: -1, total_spend: -1 } }
    ];

    const results = await Transaction.aggregate(pipeline);
    return res.status(200).json({ success: true, data: results });

  } catch (error) {
    console.error("Dashboard by vendor error:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

export const computeMetricsCache = async (req, res) => {
  try {
    const userId = req.user?.id;
    const userObjectId = toObjectId(userId);
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized", error: "Missing Identity payload" });

    const targetDate = req.body.date_snapshot ? new Date(req.body.date_snapshot) : new Date();
    targetDate.setHours(23, 59, 59, 999);
    
    // Clear out stale key
    const dateStr = targetDate.toISOString().split('T')[0];
    const cacheKey = `dashboard:metrics:${userId}:${dateStr}`;
    await clearCache(cacheKey);

    const metric = await computeMetricsService(userObjectId, targetDate);

    await setCache(cacheKey, metric, 900);

    return res.status(200).json({ success: true, data: metric });
  } catch (error) {
    console.error("Compute metrics error:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};
