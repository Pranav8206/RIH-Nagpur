"use client";
import React from 'react';
import { Filter, Search } from 'lucide-react';

export default function AnomalyFilters({ currentFilters, onFilterChange }) {
    return (
        <div className="p-4 border-b border-gray-100 bg-gray-50/80 flex flex-col sm:flex-row items-center gap-4 shadow-sm z-10 w-full relative">
            <div className="flex items-center text-sm font-bold text-gray-400 mr-2 uppercase tracking-widest shrink-0">
               <Filter className="w-4 h-4 mr-1.5" /> Mapping Rules
            </div>

            <select 
               className="text-sm form-select rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 py-2.5 pl-3 pr-8 shadow-sm flex-1 sm:flex-none min-w-[150px] bg-white cursor-pointer tracking-wide appearance-none bg-no-repeat"
               value={currentFilters.status || ''}
               onChange={(e) => onFilterChange({ status: e.target.value })}
            >
                <option value="">All Matrix Status</option>
                <option value="New">Flagged New</option>
                <option value="Reviewed">Under Review</option>
                <option value="Resolved">Resolved / Cleared</option>
            </select>

            <select 
               className="text-sm form-select rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 py-2.5 pl-3 pr-8 shadow-sm flex-1 sm:flex-none min-w-[150px] bg-white cursor-pointer tracking-wide appearance-none"
               value={currentFilters.severity || ''}
               onChange={(e) => onFilterChange({ severity: e.target.value })}
            >
                <option value="">Any Array Severity</option>
                <option value="High">Severe High Risk</option>
                <option value="Medium">Medium Warning</option>
                <option value="Low">Low Friction Flag</option>
            </select>

            <div className="relative flex-1 w-full max-w-[300px]">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400 pointer-events-none" />
                <input 
                   type="text"
                   placeholder="Search Vendor strings..." 
                   className="w-full text-sm pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-shadow outline-none tracking-wide text-gray-800"
                   value={currentFilters.vendor}
                   onChange={(e) => onFilterChange({ vendor: e.target.value })}
                />
            </div>
            
            {(currentFilters.status || currentFilters.severity || currentFilters.vendor) && (
               <button 
                  onClick={() => onFilterChange({ status: '', severity: '', vendor: '' })}
                  className="text-xs text-red-500 font-bold hover:text-red-700 tracking-wider shrink-0 uppercase px-2 py-1 rounded hover:bg-red-50 transition border border-transparent hover:border-red-100"
               >
                  Reset Drops
               </button>
            )}
        </div>
    );
}
