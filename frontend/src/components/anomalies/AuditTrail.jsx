"use client";
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Clock, User, ArrowRight } from 'lucide-react';

export default function AuditTrail({ entityId }) {
    // Isolated Audit mapping structure pulling localized component renders 
    const { data, isLoading } = useQuery({
       queryKey: ['audit_logs', entityId],
       queryFn: async () => {
           if(!entityId) return [];
           
           // Generating Mocked UI flow explicitly to match UI components 
           // since explicit backend API mappings for GET general /api/audit_logs array extraction lacked distinct implementation requests
           return [
               { _id: '1', action: 'Matrix Pipeline Identified', performed_by: 'ML Matrix Engine System', timestamp: new Date(Date.now() - 86400000).toISOString(), details: { reason: "Standard statistical deviation flagged accurately via internal deviation hooks." } },
               { _id: '2', action: 'Status Pipeline Advanced', performed_by: 'johndoe_sysadmin@internal.vault', timestamp: new Date(Date.now() - 3600000).toISOString(), details: { from: "Flagged Extracted", to: "Under Initial Review" } }
           ];
       }
    });

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
           <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex flex-col justify-center">
              <h3 className="text-sm font-bold text-slate-800 tracking-tight flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-blue-500" /> Audit Pipeline Event Map
              </h3>
           </div>
           
           <div className="p-6">
               {isLoading ? (
                   <div className="space-y-4">
                       <div className="h-10 bg-gray-50 rounded animate-pulse"></div>
                       <div className="h-10 bg-gray-50 rounded animate-pulse ml-4 border-l-2 border-blue-200"></div>
                   </div>
               ) : (
                   <div className="relative border-l-2 border-gray-100 ml-3 space-y-6">
                       {data?.map((log) => (
                           <div key={log._id} className="relative pl-6">
                               <div className="absolute w-4 h-4 bg-white border-[3px] border-blue-400 rounded-full -left-[9px] top-0 shadow-sm"></div>
                               <div className="flex justify-between items-start mb-1">
                                    <h4 className="text-sm font-bold text-slate-800 tracking-tight">{log.action}</h4>
                                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">{new Date(log.timestamp).toLocaleString(undefined, {hour:'numeric', minute:'2-digit', month:'short', day:'numeric'})}</span>
                               </div>
                               <div className="flex items-center text-[11px] font-bold tracking-widest uppercase text-gray-400 mb-2">
                                    <User className="w-3 h-3 mr-1 opacity-70" /> {log.performed_by || 'System Core Integration'}
                               </div>
                               {log.details && Object.keys(log.details).length > 0 && (
                                   <div className="text-xs text-gray-600 bg-gray-50/80 border border-gray-100 p-3 rounded-lg shadow-inner inline-block mt-1 font-medium tracking-wide">
                                       {log.details.to ? (
                                           <div className="flex items-center space-x-2 font-mono font-bold text-[11px]">
                                              <span className="line-through opacity-70 text-gray-400">{log.details.from}</span>
                                              <ArrowRight className="w-3 h-3 text-blue-400" />
                                              <span className="text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">{log.details.to}</span>
                                           </div>
                                       ) : (
                                           <span>{log.details.reason || JSON.stringify(log.details)}</span>
                                       )}
                                   </div>
                               )}
                           </div>
                       ))}
                   </div>
               )}
           </div>
        </div>
    );
}
