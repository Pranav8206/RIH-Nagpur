import React from 'react';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';

export default function StatusBadge({ status }) {
    if (!status) return null;
    
    // Normalize string variants seamlessly mapping fallback structures
    const normalized = status.toLowerCase();
    
    let colorClass = 'bg-gray-100 text-gray-700 border-gray-300';
    let Icon = Clock;

    if (['resolved', 'executed', 'approved', 'completed'].includes(normalized)) {
        colorClass = 'bg-emerald-50 text-emerald-800 border-emerald-200';
        Icon = CheckCircle;
    } else if (['rejected', 'flagged', 'failed', 'dismissed'].includes(normalized)) {
        colorClass = 'bg-red-50 text-red-800 border-red-200';
        Icon = AlertCircle;
    } else if (['reviewed', 'in progress', 'action required'].includes(normalized)) {
        colorClass = 'bg-blue-50 text-blue-800 border-blue-200';
        Icon = AlertCircle;
    }

    return (
        <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded border text-[11px] font-bold uppercase tracking-widest shadow-sm min-w-[90px] ${colorClass}`}>
            <Icon className="w-3 h-3 mr-1.5 opacity-70" />
            {status}
        </span>
    );
}
