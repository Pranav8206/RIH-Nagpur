"use client";
import React from 'react';
import { ListTree } from 'lucide-react';

export default function KeyIndicators({ indicators }) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
               <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center">
                  <ListTree className="w-4 h-4 mr-2 text-indigo-400" /> Vector Mappings JSON
               </h3>
            </div>
            
            <div className="p-6 bg-gray-50/30 flex-1">
               {(!indicators || Object.keys(indicators).length === 0) ? (
                   <div className="flex items-center justify-center h-full text-xs font-semibold text-gray-400 tracking-wider">
                       No custom object indicators mapping payload strings locally.
                   </div>
               ) : (
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       {Object.entries(indicators).map(([key, value], idx) => (
                           <div key={idx} className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-center">
                               <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1 break-all truncate">
                                   {key.replace(/_/g, ' ')}
                               </span>
                               <span className="text-sm font-semibold tracking-wide text-slate-700 capitalize">
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
