import mongoose, { Schema, model } from "mongoose";

const transactionSchema = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    vendor_name: { type: String, required: true },
    category: { type: String, default: "Uncategorized" },
    amount: { type: Number, min: 0, required: true },
    date: { type: Date, default: Date.now },
    invoice_number: { type: String, unique: true, required: true },
    payment_method: { type: String, default: "Unknown" },
    description: { type: String, default: "" },
    department: { type: String, default: "General" },
    approver_id: { type: Schema.Types.ObjectId, ref: "User" },
    status: { type: String, enum: ["Approved", "Pending"], default: "Pending" },
    is_deleted: { type: Boolean, default: false },
  },
  { 
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

transactionSchema.index({ user_id: 1, date: -1 });
transactionSchema.index({ user_id: 1, status: 1 });
transactionSchema.index({ invoice_number: 1 }, { unique: true });

// Instance Methods
transactionSchema.methods.calculateSpendCategory = function() {
  if (["AWS", "GCP", "AZURE"].includes(this.vendor_name?.toUpperCase())) {
    this.category = "Cloud Services";
  }
  return this.category;
};

// Middleware
transactionSchema.pre("save", function(next) {
  this.updated_at = new Date();
  if (this.vendor_name) {
    this.vendor_name = this.vendor_name.toLowerCase();
  }
  next();
});

export const Transaction = model("Transaction", transactionSchema);
export default Transaction;
