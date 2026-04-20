import mongoose, { Schema, model } from "mongoose";

const classificationSchema = new Schema(
  {
    anomaly_id: { type: Schema.Types.ObjectId, ref: "Anomaly", required: true },
    leakage_type: { 
      type: String, 
      enum: ["Duplicate", "Fraud", "Idle Subscription", "Vendor Overpayment", "Budget Creep", "Unauthorized"],
      required: true
    },
    confidence_score: { type: Number, min: 0, max: 1, default: 0.5 },
    root_cause: { type: String, default: "Unknown" },
    key_indicators: { type: Schema.Types.Mixed, default: {} },
    recommended_action: { type: String, default: "" },
    estimated_recovery: { type: Number, min: 0, default: 0 },
    impact_level: { type: String, default: "Low" },
    classification_date: { type: Date, default: Date.now },
    manual_override: { type: Boolean, default: false },
    override_reason: { type: String, default: "" },
  },
  { 
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

classificationSchema.index({ anomaly_id: 1 });

// Virtuals
classificationSchema.virtual("recoveryPotential").get(function() {
  return (this.estimated_recovery || 0) * (this.confidence_score || 0);
});

// Instance Methods
classificationSchema.methods.classifyLeakage = function(type, score, cause) {
  this.leakage_type = type;
  this.confidence_score = score;
  this.root_cause = cause;
  return this;
};

classificationSchema.methods.getRecoveryPotential = function() {
  return this.recoveryPotential;
};

// Middleware
classificationSchema.pre("save", function(next) {
  this.updated_at = new Date();
  if (this.root_cause) {
    this.root_cause = this.root_cause.trim();
  }
  next();
});

export const Classification = model("Classification", classificationSchema);
export default Classification;
