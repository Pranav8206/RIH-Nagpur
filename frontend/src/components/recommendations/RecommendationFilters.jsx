"use client";
import React from 'react';
import { Filter } from 'lucide-react';

export default function RecommendationFilters({ currentFilters, onFilterChange }) {
    return (
        <div className="p-4 border-b border-border-light bg-gray-50/80 flex flex-col sm:flex-row items-center gap-4 shadow-sm z-10 w-full relative content-start">
            <div className="flex items-center text-sm font-bold text-text-tertiary mr-2 uppercase tracking-widest shrink-0">
               <Filter className="w-4 h-4 mr-1.5" /> Action Configs
            </div>

            <select 
               className="text-sm rounded-lg border border-border-light outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300 py-2.5 pl-3 pr-8 shadow-sm flex-1 sm:flex-none min-w-[200px] bg-surface cursor-pointer tracking-wide appearance-none"
               value={currentFilters.status || ''}
               onChange={(e) => onFilterChange({ status: e.target.value })}
            >
                <option value="">All Bound Matrix Statuses</option>
                <option value="Pending">Pending Execution Mapping</option>
                <option value="Executed">Compiled Target Setup</option>
                <option value="Rejected">Force Rejected Sequence</option>
            </select>

            <select 
               className="text-sm rounded-lg border border-border-light outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300 py-2.5 pl-3 pr-8 shadow-sm flex-1 sm:flex-none min-w-[150px] bg-surface cursor-pointer tracking-wide appearance-none"
               value={currentFilters.priority || ''}
               onChange={(e) => onFilterChange({ priority: e.target.value })}
            >
                <option value="">Any Array Priority</option>
                <option value="High">Severe High Risk</option>
                <option value="Medium">Medium Warning Payload</option>
                <option value="Low">Low Friction Flag Node</option>
            </select>
            
            {(currentFilters.status || currentFilters.priority) && (
               <button 
                  onClick={() => onFilterChange({ status: '', priority: '' })}
                  className="text-xs text-error font-bold hover:text-red-700 tracking-wider shrink-0 uppercase px-3 py-1.5 rounded hover:bg-red-50 transition border border-transparent hover:border-red-100 shadow-sm"
               >
                  Reset Locks
               </button>
            )}
        </div>
    );
}
