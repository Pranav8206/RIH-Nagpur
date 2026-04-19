import React from 'react';

export default function LoadingSkeleton({ type = 'table', rows = 5, className = '' }) {
    if (type === 'card') {
        return (
            <div className={`bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-pulse ${className}`}>
                <div className="h-5 bg-gray-100 rounded w-1/3 mb-6"></div>
                <div className="space-y-4">
                    <div className="h-10 bg-gray-50 rounded border border-gray-100"></div>
                    <div className="h-10 bg-gray-50 rounded border border-gray-100 w-5/6"></div>
                    <div className="h-10 bg-gray-50 rounded border border-gray-100 w-4/6"></div>
                </div>
            </div>
        );
    }

    // Default table lists map rendering empty structure bounds cleanly
    return (
        <div className={`flex-1 w-full bg-white relative overflow-hidden ${className}`}>
            <div className="p-4 space-y-4">
                {[...Array(rows)].map((_, i) => (
                    <div key={i} className="h-[52px] bg-gray-50 rounded-lg animate-pulse w-full border border-gray-100 border-opacity-60"></div>
                ))}
            </div>
        </div>
    );
}
