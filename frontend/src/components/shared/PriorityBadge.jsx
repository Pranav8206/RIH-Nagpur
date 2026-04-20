import React from 'react';

export default function PriorityBadge({ level }) {
    if (!level) return null;
    
    const normalized = level.toLowerCase();
    
    let colorClass, dotColor;
    if (normalized === 'high' || normalized === 'critical') {
        colorClass = 'bg-error/10 text-red-800 border-red-200';
        dotColor = 'bg-red-500';
    } else if (normalized === 'medium') {
        colorClass = 'bg-orange-50 text-orange-800 border-orange-200';
        dotColor = 'bg-orange-500';
    } else {
        colorClass = 'bg-primary-accent-light/30 text-emerald-800 border-primary-accent-light';
        dotColor = 'bg-primary-accent';
    }

    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] uppercase tracking-wider font-bold border shadow-sm ${colorClass}`}>
            <div className={`w-1.5 h-1.5 rounded-full mr-1.5 shadow-sm ${dotColor}`}></div>
            {level}
        </span>
    );
}
