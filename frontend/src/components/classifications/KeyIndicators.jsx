"use client";
import React from 'react';
import { ListTree } from 'lucide-react';

export default function KeyIndicators({ indicators }) {
    return (
        <div className="bg-surface rounded-xl border border-border-light shadow-sm flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-border-light bg-surface-hover">
               <h3 className="text-xs font-bold text-text-tertiary uppercase tracking-widest flex items-center">
                  <ListTree className="w-4 h-4 mr-2 text-indigo-400" /> Vector Mappings JSON
               </h3>
            </div>
            
            <div className="p-6 bg-gray-50/30 flex-1">
               {(!indicators || Object.keys(indicators).length === 0) ? (
                   <div className="flex items-center justify-center h-full text-xs font-semibold text-text-tertiary tracking-wider">
                       No custom object indicators mapping payload strings locally.
                   </div>
               ) : (
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       {Object.entries(indicators).map(([key, value], idx) => (
                           <div key={idx} className="bg-surface p-3.5 rounded-xl border border-border-light shadow-sm flex flex-col justify-center">
                               <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1 break-all truncate">
                                   {key.replace(/_/g, ' ')}
                               </span>
                               <span className="text-sm font-semibold tracking-wide text-text-secondary capitalize">
                                   {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
                               </span>
                           </div>
                       ))}
                   </div>
               )}
            </div>
        </div>
    );
}
