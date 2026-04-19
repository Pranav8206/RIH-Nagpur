import mongoose, { Schema, model } from "mongoose";

const auditLogSchema = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    action_type: { type: String, enum: ["View", "Classify", "Recommend", "Execute"], required: true },
    entity_type: { type: String, required: true },
    entity_id: { type: Schema.Types.ObjectId, required: true },
    change_from: { type: String, default: "" },
    change_to: { type: String, default: "" },
    reason: { type: String, default: "" },
    ip_address: { type: String, default: "0.0.0.0" },
    timestamp: { type: Date, default: Date.now },
  },
  { 
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

auditLogSchema.index({ user_id: 1 });
auditLogSchema.index({ entity_id: 1 });

// Middleware
auditLogSchema.pre("save", function(next) {
  this.updated_at = new Date();
  next();
});

export const AuditLog = model("AuditLog", auditLogSchema);
