"use client";
import React from "react";
import {
  Target,
  Activity,
  FileText,
  Calendar,
  CreditCard,
  Hash,
} from "lucide-react";

export default function AnomalyDetailCard({ anomaly, transaction }) {
  // Safety destructures checking bounds cleanly
  if (!anomaly || !transaction) return null;

  const formatCurrency = (amt) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "INR",
    }).format(amt || 0);
  const formatDate = (dateStr) =>
    dateStr
      ? new Date(dateStr).toLocaleDateString(undefined, {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "N/A";

  return (
    <div className="bg-surface rounded-xl border border-border-light shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-border-light bg-surface-hover flex justify-between items-center">
        <h2 className="text-lg font-bold text-text-primary tracking-tight flex items-center">
          <Target className="w-5 h-5 mr-2 text-primary-accent" /> Transaction details
        </h2>
        <div
          className={`px-2.5 py-1 rounded-lg border text-xs font-bold uppercase tracking-widest ${
            anomaly.severity === "High"
              ? "bg-error/10 text-error border-red-200"
              : anomaly.severity === "Medium"
                ? "bg-orange-50 text-orange-700 border-orange-200"
                : "bg-primary-accent-light/30 text-primary-accent-dark border-primary-accent-light"
          }`}
        >
          {anomaly.severity} Severity
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 divide-x divide-gray-100">
          <div className="space-y-5 pr-4">
            <h3 className="text-xs font-bold text-text-tertiary uppercase tracking-widest mb-2 flex items-center">
              <FileText className="w-3.5 h-3.5 mr-1" /> Transaction
            </h3>

            <div>
              <div className="text-xs font-medium text-text-tertiary mb-0.5">
                Vendor
              </div>
              <div className="text-xl font-bold text-text-primary">
                {transaction.vendor_name}
              </div>
            </div>

            <div className="flex space-x-8">
              <div>
                <div className="text-xs font-medium text-text-tertiary mb-1 flex items-center">
                  <Activity className="w-3 h-3 mr-1" /> Amount
                </div>
                <div className="text-xl font-bold text-primary-accent bg-primary-accent-light/30 px-2 py-1 rounded inline-block">
                  {formatCurrency(transaction.amount)}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-text-tertiary mb-1 flex items-center">
                  <Calendar className="w-3 h-3 mr-1" /> Date
                </div>
                <div className="text-sm font-semibold text-text-secondary mt-2">
                  {formatDate(transaction.date)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-surface-hover p-3 rounded-lg border border-border-light">
              <div>
                <div className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-1 flex items-center">
                  <Hash className="w-3 h-3 mr-1" /> Invoice number
                </div>
                <div className="text-xs font-mono text-text-secondary font-semibold">
                  {transaction.invoice_number}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-1 flex items-center">
                  <CreditCard className="w-3 h-3 mr-1" /> Payment method
                </div>
                <div className="text-xs font-semibold text-text-secondary">
                  {transaction.payment_method}
                </div>
              </div>
            </div>
          </div>

          {/* Algorithmic Output Constraints */}
          <div className="pl-8 space-y-6">
            <h3 className="text-xs font-bold text-text-tertiary uppercase tracking-widest mb-2 flex items-center">
              <Activity className="w-3.5 h-3.5 mr-1" /> Why it was flagged
            </h3>

            <div className="bg-surface p-4 rounded-xl border border-border-light shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
              <div className="flex justify-between items-end mb-2">
                <div className="text-xs font-bold text-text-tertiary uppercase tracking-wider">
                  Risk score
                </div>
                <div className="text-lg font-mono font-bold text-error">
                  {anomaly.anomaly_score.toFixed(2)}
                </div>
              </div>
              <div className="h-2 w-full bg-surface-hover rounded-full overflow-hidden">
                <div
                  className="h-full bg-linear-to-r from-red-400 to-red-600 transition-all duration-1000"
                  style={{
                    width: `${Math.min(100, Math.max(0, anomaly.anomaly_score * 100))}%`,
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-1.5">
                Detection method
              </div>
              <div className="text-sm border border-border-light bg-surface-hover w-full py-1.5 px-3 rounded-lg text-text-secondary font-medium inline-block shadow-sm">
                {anomaly.detection_method || "System check"}
              </div>
            </div>

            <div>
              <div className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-1.5">
                Plain reason
              </div>
              <p className="text-sm text-text-secondary bg-surface p-3 border border-border-light shadow-sm rounded-lg leading-relaxed">
                {anomaly.reason_description ||
                  "This transaction was flagged by the system and should be reviewed."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
