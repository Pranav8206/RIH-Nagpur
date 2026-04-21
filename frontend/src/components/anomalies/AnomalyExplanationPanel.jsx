"use client";

import React from "react";
import { Sparkles, Lightbulb } from "lucide-react";

export default function AnomalyExplanationPanel({ explanation, isLoading }) {
  return (
    <div className="bg-surface rounded-xl border border-border-light shadow-sm overflow-hidden h-full flex flex-col">
      <div className="px-6 py-4 border-b border-border-light bg-surface-hover flex items-center">
        <Sparkles className="w-4 h-4 mr-2 text-primary-accent" />
        <h3 className="text-sm font-bold text-text-primary tracking-tight">AI explanation</h3>
      </div>

      <div className="p-6 flex-1 flex flex-col">
        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-4 w-40 bg-surface-hover rounded" />
            <div className="h-4 w-full bg-surface-hover rounded" />
            <div className="h-4 w-5/6 bg-surface-hover rounded" />
            <div className="h-16 w-full bg-surface-hover rounded-lg" />
          </div>
        ) : explanation ? (
          <div className="space-y-4">
            <div>
              <div className="text-xs font-bold text-text-tertiary uppercase tracking-widest mb-1">Simple summary</div>
              <p className="text-sm text-text-secondary leading-relaxed">{explanation.summary}</p>
            </div>

            <div>
              <div className="text-xs font-bold text-text-tertiary uppercase tracking-widest mb-2">What the AI noticed</div>
              <ul className="space-y-2">
                {explanation.reasons?.map((reason, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-text-secondary bg-surface-hover p-3 rounded-lg border border-border-light">
                    <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
              <div className="text-xs font-bold text-blue-700 uppercase tracking-widest mb-1">What to do next</div>
              <p className="text-sm text-blue-900 leading-relaxed">{explanation.next_step}</p>
            </div>

            <div className="text-xs text-text-tertiary">
              {explanation.source === "groq" ? "Generated with Groq" : "Using saved reason from the system"}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center text-text-tertiary text-sm">
            No explanation available yet.
          </div>
        )}
      </div>
    </div>
  );
}