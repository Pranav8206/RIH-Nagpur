import React from 'react';

export default function LoadingSkeleton({ type = 'table', rows = 5, className = '' }) {
    if (type === 'card') {
        return (
            <div className={`bg-surface p-6 rounded-xl border border-border-light shadow-sm animate-pulse ${className}`}>
                <div className="h-5 bg-surface-hover rounded w-1/3 mb-6"></div>
                <div className="space-y-4">
                    <div className="h-10 bg-surface-hover rounded border border-border-light"></div>
                    <div className="h-10 bg-surface-hover rounded border border-border-light w-5/6"></div>
                    <div className="h-10 bg-surface-hover rounded border border-border-light w-4/6"></div>
                </div>
            </div>
        );
    }

    // Default table lists map rendering empty structure bounds cleanly
    return (
        <div className={`flex-1 w-full bg-surface relative overflow-hidden ${className}`}>
            <div className="p-4 space-y-4">
                {[...Array(rows)].map((_, i) => (
                    <div key={i} className="h-[52px] bg-surface-hover rounded-lg animate-pulse w-full border border-border-light border-opacity-60"></div>
                ))}
            </div>
        </div>
    );
}
