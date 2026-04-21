"use client";
import React from 'react';
import { Filter, Search } from 'lucide-react';

export default function AnomalyFilters({ currentFilters, onFilterChange }) {
    return (
        <div className="p-4 border-b border-border-light bg-gray-50/80 flex flex-col sm:flex-row items-center gap-4 shadow-sm z-10 w-full relative">
            <div className="flex items-center text-sm font-bold text-text-tertiary mr-2 uppercase tracking-widest shrink-0">
               <Filter className="w-4 h-4 mr-1.5" /> Filters
            </div>

            <select 
               className="text-sm form-select rounded-lg border border-border-light outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 py-2.5 pl-3 pr-8 shadow-sm flex-1 sm:flex-none min-w-37.5 bg-surface cursor-pointer tracking-wide appearance-none bg-no-repeat"
               value={currentFilters.status || ''}
               onChange={(e) => onFilterChange({ status: e.target.value })}
            >
               <option value="">All Status</option>
               <option value="New">New</option>
               <option value="Reviewed">Reviewed</option>
               <option value="Resolved">Resolved</option>
            </select>

            <select 
               className="text-sm form-select rounded-lg border border-border-light outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 py-2.5 pl-3 pr-8 shadow-sm flex-1 sm:flex-none min-w-37.5 bg-surface cursor-pointer tracking-wide appearance-none"
               value={currentFilters.severity || ''}
               onChange={(e) => onFilterChange({ severity: e.target.value })}
            >
               <option value="">Any Level</option>
               <option value="High">High</option>
               <option value="Medium">Medium</option>
               <option value="Low">Low</option>
            </select>

            <div className="relative flex-1 w-full max-w-75">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-text-tertiary pointer-events-none" />
                <input 
                   type="text"
                   placeholder="Search vendor..." 
                   className="w-full text-sm pl-10 pr-4 py-2.5 border border-border-light rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-shadow outline-none tracking-wide text-text-primary"
                   value={currentFilters.vendor}
                   onChange={(e) => onFilterChange({ vendor: e.target.value })}
                />
            </div>
            
            {(currentFilters.status || currentFilters.severity || currentFilters.vendor) && (
               <button 
                  onClick={() => onFilterChange({ status: '', severity: '', vendor: '' })}
                  className="text-xs text-error font-bold hover:text-red-700 tracking-wider shrink-0 uppercase px-2 py-1 rounded hover:bg-red-50 transition border border-transparent hover:border-red-100"
               >
                  Reset Filters
               </button>
            )}
        </div>
    );
}
