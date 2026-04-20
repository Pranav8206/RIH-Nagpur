import mongoose, { Schema, model } from "mongoose";

const predictionSchema = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    department: { type: String, required: true },
    period: { type: String, required: true },
    predicted_leakage: { type: Number, min: 0, default: 0 },
    confidence_interval: { type: String, default: "95%" },
    baseline_spend: { type: Number, min: 0, default: 0 },
    variance_percent: { type: Number, default: 0 },
    forecast_reason: { type: String, default: "" },
    alert_threshold: { type: Number, min: 0, required: true },
    alert_triggered: { type: Boolean, default: false },
  },
  { 
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

predictionSchema.index({ user_id: 1 });

// Middleware
predictionSchema.pre("save", async function() {
  this.updated_at = new Date();
  if (this.department) {
    this.department = this.department.trim();
  }
  if (this.predicted_leakage >= this.alert_threshold) {
    this.alert_triggered = true;
  }
});

export const Prediction = model("Prediction", predictionSchema);
