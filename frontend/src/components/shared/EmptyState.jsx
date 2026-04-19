import React from 'react';
import { Database } from 'lucide-react';

export default function EmptyState({ message = "No algorithmic records strictly found.", subMessage = "Ensure matrix bounds matches tracking dependencies cleanly locally.", icon: Icon = Database }) {
    return (
        <div className="flex flex-col items-center justify-center p-16 text-center bg-gray-50/50 border border-gray-100 rounded-xl m-4">
            <div className="w-16 h-16 bg-white border border-gray-200 rounded-2xl flex items-center justify-center shadow-sm mb-5">
               <Icon className="w-8 h-8 text-gray-300" />
            </div>
            <h4 className="text-sm font-bold text-slate-700 tracking-tight">{message}</h4>
            <p className="text-xs font-semibold text-gray-500 mt-1 max-w-sm tracking-wide leading-relaxed">{subMessage}</p>
        </div>
    );
}
