import mongoose, { Schema, model } from "mongoose";

const dashboardMetricSchema = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    date_snapshot: { type: Date, default: Date.now },
    total_transactions: { type: Number, default: 0 },
    total_spend: { type: Number, default: 0 },
    anomalies_detected: { type: Number, default: 0 },
    anomalies_high_risk: { type: Number, default: 0 },
    classified_anomalies: { type: Number, default: 0 },
    recommendations_open: { type: Number, default: 0 },
    total_recovered: { type: Number, default: 0 },
    recovery_rate: { type: Number, default: 0 },
    top_leakage_type: { type: String, default: "None" },
    top_vendor: { type: String, default: "None" },
    top_department: { type: String, default: "None" },
  },
  { 
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

dashboardMetricSchema.index({ user_id: 1, date_snapshot: -1 });

// Middleware
dashboardMetricSchema.pre("save", async function() {
  this.updated_at = new Date();
});

export const DashboardMetric = model("DashboardMetric", dashboardMetricSchema);
