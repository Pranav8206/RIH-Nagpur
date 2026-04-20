import mongoose, { Schema, model } from "mongoose";

const anomalySchema = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    transaction_id: { type: Schema.Types.ObjectId, ref: "Transaction", required: true },
    anomaly_score: { type: Number, min: 0, max: 1, default: 0 },
    detection_type: { type: String, required: true },
    detection_method: { type: String, required: true },
    severity: { type: String, enum: ["Low", "Medium", "High"], default: "Low" },
    reason_description: { type: String, default: "" },
    detected_at: { type: Date, default: Date.now },
    status: { type: String, enum: ["New", "Reviewed", "Resolved"], default: "New" },
    notes: { type: String, default: "" },
  },
  { 
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

anomalySchema.index({ transaction_id: 1 });
anomalySchema.index({ user_id: 1, status: 1 });

// Virtuals
anomalySchema.virtual("isHighRisk").get(function() {
  return this.anomaly_score > 0.8;
});

// Instance Methods
anomalySchema.methods.calculateAnomalyScore = function() {
  // Logic to calculate dynamically here, returning current for now
  return this.anomaly_score;
};

anomalySchema.methods.checkIfHighRisk = function() {
  return this.anomaly_score > 0.8 || this.severity === "High";
};

// Middleware
anomalySchema.pre("save", function(next) {
  this.updated_at = new Date();
  if (this.detection_type) {
    this.detection_type = this.detection_type.trim().toLowerCase();
  }
  next();
});

export const Anomaly = model("Anomaly", anomalySchema);
export default Anomaly;
