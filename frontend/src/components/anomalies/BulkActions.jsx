"use client";
import React from 'react';
import { Settings, X, CheckSquare, CheckCircle } from 'lucide-react';

export default function BulkActions({ selectedCount, onActionTrigger, onClear }) {
    return (
        <div className="bg-[#eff6ff] p-3 px-5 border-b border-blue-100 flex justify-between items-center z-10 w-full animate-in fade-in slide-in-from-top-2 relative shadow-inner">
            <div className="flex items-center text-sm font-bold text-blue-800 tracking-tight">
               <CheckSquare className="w-4 h-4 mr-2 text-blue-600" />
               {selectedCount} Matrix Node{selectedCount !== 1 ? 's' : ''} Selected
            </div>
            <div className="flex items-center gap-3">
               <button 
                  onClick={() => onActionTrigger("Reviewed")}
                  className="text-xs font-bold tracking-tight px-3 py-1.5 bg-white border border-blue-200 text-blue-700 rounded-lg shadow-sm hover:bg-blue-50 transition-colors flex items-center h-8"
               >
                  <Settings className="w-3.5 h-3.5 mr-1.5 opacity-70" /> Flag Reviewed Array
               </button>
               <button 
                  onClick={() => onActionTrigger("Resolved")}
                  className="text-xs font-bold tracking-tight px-3 py-1.5 bg-emerald-600 border border-emerald-700/50 text-white rounded-lg shadow-sm hover:bg-emerald-700 hover:shadow transition-all flex items-center h-8"
               >
                  <CheckCircle className="w-3.5 h-3.5 mr-1.5 opacity-80" /> Execute Resolve
               </button>
               <div className="w-px h-6 bg-blue-200 mx-1"></div>
               <button onClick={onClear} className="p-1.5 hover:bg-blue-100 rounded text-blue-400 hover:text-blue-700 transition-colors border border-transparent hover:border-blue-200">
                 <X className="w-4 h-4" />
               </button>
            </div>
        </div>
    );
}
