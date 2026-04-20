"use client";
import React from "react";
import { Network, Activity, BarChart2 } from "lucide-react";
import PriorityBadge from "../shared/PriorityBadge";

export default function ClassificationDetailCard({ classification }) {
  if (!classification) return null;

  const formatCurrency = (amt) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "INR",
    }).format(amt || 0);

  return (
    <div className="bg-surface rounded-xl border border-border-light shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-border-light bg-surface-hover flex justify-between items-center">
        <h2 className="text-lg font-bold text-text-primary tracking-tight flex items-center">
          <Network className="w-5 h-5 mr-2 text-primary-accent" /> Validation
          Node Overview
        </h2>
        <PriorityBadge level={classification.impact_level} />
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 divide-x divide-gray-100">
          <div className="space-y-6 pr-4">
            <div>
              <div className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-1.5 flex items-center">
                <BarChart2 className="w-3.5 h-3.5 mr-1" /> Bound Taxonomy
              </div>
              <div className="text-xl font-bold tracking-tight text-text-primary">
                {classification.leakage_type}
              </div>
            </div>

            <div>
              <div className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-2 flex justify-between max-w-[80%]">
                <span>Algorithm Accuracy Score</span>
                <span className="text-primary-accent font-mono">
                  {(classification.confidence_score * 100).toFixed(1)}%
                </span>
              </div>
              <div className="h-2 w-[80%] bg-surface-hover rounded-full overflow-hidden shadow-inner border border-gray-200/50">
                <div
                  className="h-full bg-linear-to-r from-indigo-400 to-indigo-600 rounded-full transition-all duration-1000"
                  style={{ width: `${classification.confidence_score * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="pl-8 space-y-6">
            <div>
              <div className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-2 flex items-center">
                <Activity className="w-3.5 h-3.5 mr-1" /> Derived Root Pattern
              </div>
              <p className="text-sm font-medium text-text-secondary bg-surface-hover border border-border-light p-4 rounded-xl leading-relaxed tracking-wide shadow-sm">
                {classification.root_cause ||
                  "System derived flag missing explicit root strings."}
              </p>
            </div>

            <div>
              <div className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-1">
                Expected Boundary Retrieval
              </div>
              <div className="text-2xl font-bold tracking-tight text-primary-accent font-mono">
                {formatCurrency(classification.estimated_recovery)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
