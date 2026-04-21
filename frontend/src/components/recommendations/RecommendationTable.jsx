"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, CircleDollarSign, Sparkles } from 'lucide-react';
import LoadingSkeleton from '../shared/LoadingSkeleton';
import EmptyState from '../shared/EmptyState';

export default function RecommendationTable({ data = [], isLoading }) {
  const router = useRouter();

  if (isLoading) return <LoadingSkeleton type="card" rows={4} />;
  
  if (!data || data.length === 0) {
      return <EmptyState message="No recommendations found." icon={Sparkles} />;
  }

  const formatCurrency = (amt) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'INR' }).format(amt || 0);
  const getImpactLabel = (priority) => {
    if (priority >= 5) return 'High Impact';
    if (priority >= 3) return 'Medium Impact';
    return 'Low Impact';
  };

  const getImpactTone = (priority) => {
    if (priority >= 5) return 'bg-[#efe0d1] text-[#7a5c3b]';
    if (priority >= 3) return 'bg-[#e4eadf] text-[#6e7f67]';
    return 'bg-[#ece8ef] text-[#76697a]';
  };

  return (
    <div className="p-4 sm:p-5 space-y-3 bg-[#fbfaf8]">
        {data.map((row) => {
          const summary = row.anomaly_summary || {};
          const supportingText = summary.reason_description || summary.detection_method || row.action_type || 'Review this recommendation';
          const impactLabel = getImpactLabel(row.priority || 0);

          return (
            <div
              key={row._id}
              onClick={() => router.push(`/recommendations/${row._id}`)}
              className="group cursor-pointer rounded-2xl border border-slate-200 bg-[#fdfbf8] px-4 py-4 shadow-[0_1px_1px_rgba(15,23,42,0.03)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(15,23,42,0.08)] sm:px-5"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e6ded1] text-[#7c6a51]">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-medium text-slate-800">
                        {row.action_description || 'Review recommendation'}
                      </h3>
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${getImpactTone(row.priority || 0)}`}>
                        {impactLabel}
                      </span>
                    </div>
                    <p className="max-w-2xl text-sm leading-6 text-slate-500">
                      {supportingText}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                      <span className="inline-flex items-center gap-2 font-medium text-slate-700">
                        <CircleDollarSign className="h-4 w-4 text-[#7a8c72]" />
                        Save {formatCurrency(row.estimated_recovery)} /month
                      </span>
                      <span>Status: {row.status || 'Pending'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                  <button className="inline-flex items-center gap-2 rounded-full bg-[#7a8c72] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition group-hover:bg-[#6b7d63]">
                    Fix
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
    </div>
  );
}
