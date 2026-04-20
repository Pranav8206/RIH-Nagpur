"use client";
import React from 'react';
import { Filter } from 'lucide-react';

export default function ClassificationFilters({ currentFilters, onFilterChange }) {
    return (
        <div className="p-4 border-b border-border-light bg-gray-50/80 flex flex-col sm:flex-row items-center gap-4 shadow-sm z-10 w-full relative content-start">
            <div className="flex items-center text-sm font-bold text-text-tertiary mr-2 uppercase tracking-widest shrink-0">
               <Filter className="w-4 h-4 mr-1.5" /> Taxonomies
            </div>

            <select 
               className="text-sm rounded-lg border border-border-light outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 py-2.5 pl-3 pr-8 shadow-sm flex-1 sm:flex-none min-w-[220px] bg-surface cursor-pointer tracking-wide appearance-none"
               value={currentFilters.leakage_type || ''}
               onChange={(e) => onFilterChange({ leakage_type: e.target.value })}
            >
                <option value="">All Matrix Leakage Types</option>
                <option value="Duplicate Invoice">Duplicate Invoice Drop</option>
                <option value="Policy Violation">Target Policy Violation</option>
                <option value="Excessive Tip">Excessive Numerical Flag</option>
                <option value="Subscription Creep">Recurrent Sub Creep</option>
            </select>

            <select 
               className="text-sm rounded-lg border border-border-light outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 py-2.5 pl-3 pr-8 shadow-sm flex-1 sm:flex-none min-w-[150px] bg-surface cursor-pointer tracking-wide appearance-none"
               value={currentFilters.impact_level || ''}
               onChange={(e) => onFilterChange({ impact_level: e.target.value })}
            >
                <option value="">Any Array Impact</option>
                <option value="High">Severe High Risk</option>
                <option value="Medium">Medium Warning Drop</option>
                <option value="Low">Low Friction Node</option>
            </select>
            
            {(currentFilters.leakage_type || currentFilters.impact_level) && (
               <button 
                  onClick={() => onFilterChange({ leakage_type: '', impact_level: '' })}
                  className="text-xs text-error font-bold hover:text-red-700 tracking-wider shrink-0 uppercase px-3 py-1.5 rounded hover:bg-red-50 transition border border-transparent hover:border-red-100 shadow-sm"
               >
                  Reset Drops
               </button>
            )}
        </div>
    );
}
