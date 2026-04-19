"use client";
import React, { useState } from 'react';
import { Send } from 'lucide-react';

export default function EmailPreview({ body, subject }) {
    const [emailContent, setEmailContent] = useState(body || "Dear Vendor,\n\nWe noticed a billing anomaly regarding...");

    return (
        <div className="bg-white border border-indigo-100 rounded-xl shadow-sm flex flex-col relative overflow-hidden h-[450px]">
             <div className="bg-gradient-to-r from-indigo-50 to-white px-4 py-3 border-b border-indigo-50/80 flex items-center justify-between">
                 <div>
                     <div className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 mb-0.5">Automated Subject Ext Output Code Setup Layout Limits</div>
                     <div className="text-sm font-bold text-slate-700">{subject || 'Billing Discrepancy Notice'}</div>
                 </div>
                 <button className="flex items-center text-xs font-bold text-white bg-indigo-600 px-4 py-2 hover:bg-indigo-700 rounded-lg shadow-sm border border-indigo-700/50 transition">
                     <Send className="w-3.5 h-3.5 mr-2" /> Send via Integration Limit Block Nodes Arrays Outputs Out
                 </button>
             </div>
             <textarea 
                 value={emailContent}
                 onChange={(e) => setEmailContent(e.target.value)}
                 className="flex-1 w-full p-6 text-sm text-gray-700 font-medium leading-relaxed resize-none outline-none focus:ring-inset focus:ring-2 focus:ring-indigo-100"
                 placeholder="Auto-generated email content renders here..."
             />
        </div>
    );
}
