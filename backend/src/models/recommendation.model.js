import mongoose, { Schema, model } from "mongoose";

const recommendationSchema = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    classification_id: { type: Schema.Types.ObjectId, ref: "Classification", required: true },
    recommendation_type: { type: String, required: true },
    action_template: { type: String, default: "" },
    estimated_recovery: { type: Number, min: 0, default: 0 },
    priority: { type: Number, min: 1, max: 5, default: 3 },
    status: { type: String, enum: ["Pending", "Executed", "Rejected"], default: "Pending" },
    action_description: { type: String, default: "" },
    template_email: { type: String, default: "" },
    template_document: { type: String, default: "" },
    executed_date: { type: Date },
    executed_by: { type: Schema.Types.ObjectId, ref: "User" },
    actual_recovery: { type: Number, min: 0, default: 0 },
    notes: { type: String, default: "" },
  },
  { 
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

recommendationSchema.index({ classification_id: 1 });
recommendationSchema.index({ user_id: 1, status: 1 });

// Virtuals
recommendationSchema.virtual("isActionable").get(function() {
  return this.status === "Pending";
});

// Instance Methods
recommendationSchema.methods.markExecuted = function(adminId, actualRecoveryValue) {
  this.status = "Executed";
  this.executed_by = adminId;
  this.executed_date = new Date();
  this.actual_recovery = actualRecoveryValue || this.estimated_recovery;
  return this;
};

recommendationSchema.methods.calculateRecoveryGap = function() {
  return (this.estimated_recovery || 0) - (this.actual_recovery || 0);
};

// Middleware
recommendationSchema.pre("save", function(next) {
  this.updated_at = new Date();
  if (this.status) {
    this.status = this.status.charAt(0).toUpperCase() + this.status.slice(1).toLowerCase();
  }
  next();
});

export const Recommendation = model("Recommendation", recommendationSchema);
