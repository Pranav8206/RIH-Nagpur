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
    if (priority >= 5) return 'bg-warning/20 text-warning';
    if (priority >= 3) return 'bg-primary-accent-light/35 text-primary-accent-dark';
    return 'bg-surface-hover text-text-secondary';
  };

  return (
    <div className="p-4 sm:p-5 space-y-3 bg-surface">
        {data.map((row) => {
          const summary = row.anomaly_summary || {};
          const supportingText = row.friendly_summary || summary.reason_description || summary.detection_method || 'Review this recommendation';
          const impactLabel = getImpactLabel(row.priority || 0);

          return (
            <div
              key={row._id}
              onClick={() => router.push(`/recommendations/${row._id}`)}
              className="group cursor-pointer rounded-2xl border border-border-light bg-surface px-4 py-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:px-5"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-accent-light/30 text-primary-accent-dark">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-medium text-text-primary">
                        {row.friendly_title || row.action_description || 'Review recommendation'}
                      </h3>
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${getImpactTone(row.priority || 0)}`}>
                        {impactLabel}
                      </span>
                    </div>
                    <p className="max-w-2xl text-sm leading-6 text-text-secondary">
                      {supportingText}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-text-tertiary">
                      <span className="inline-flex items-center gap-2 font-medium text-text-secondary">
                        <CircleDollarSign className="h-4 w-4 text-primary-accent-dark" />
                        Save {formatCurrency(row.estimated_recovery)} /month
                      </span>
                      <span>Status: {row.status || 'Pending'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                  <button className="inline-flex items-center gap-2 rounded-full bg-primary-accent px-5 py-2.5 text-sm font-medium text-surface shadow-sm transition group-hover:bg-primary-accent-dark">
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
