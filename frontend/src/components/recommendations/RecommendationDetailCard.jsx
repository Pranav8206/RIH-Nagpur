"use client";
import React from 'react';
import { ShieldCheck, Activity, Terminal } from 'lucide-react';
import PriorityBadge from '../shared/PriorityBadge';
import StatusBadge from '../shared/StatusBadge';

export default function RecommendationDetailCard({ recommendation }) {
    if (!recommendation) return null;

    const formatCurrency = (amt) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amt || 0);

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
               <h2 className="text-lg font-bold text-slate-800 tracking-tight flex items-center">
                  <ShieldCheck className="w-5 h-5 mr-2 text-emerald-500" /> Executive Execution Map Layout Yield Engine Limit Drop
               </h2>
               <div className="flex space-x-3 items-center">
                  <PriorityBadge level={recommendation.priority} />
                  <StatusBadge status={recommendation.status} />
               </div>
            </div>

            <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 divide-x divide-gray-100">
                    
                    <div className="space-y-6 pr-4">
                        <div>
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center">
                               <Terminal className="w-3.5 h-3.5 mr-1" /> Core Logic Instruction Sequence
                            </div>
                            <div className="text-lg font-bold tracking-tight text-slate-800 leading-snug">{recommendation.action_description || 'Auto System Recovery Generator Block Protocol Map Format'}</div>
                            <div className="text-xs font-bold text-indigo-500 mt-2 uppercase tracking-widest bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded inline-block shadow-sm">{recommendation.action_type || 'General System Flag Output Ext Layout Mode Array Mapping'}</div>
                        </div>
                    </div>

                    <div className="pl-8 space-y-6">
                         <div>
                             <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center">
                               <Activity className="w-3.5 h-3.5 mr-1" /> Dynamic System Ext Layout Code Output Map Step List Hooks Block
                            </div>
                            
                            <ul className="space-y-2.5">
                               {recommendation.action_steps?.map((step, idx) => (
                                  <li key={idx} className="flex items-start text-sm text-slate-700 bg-gray-50 p-3 rounded-lg border border-gray-100 shadow-sm font-medium tracking-wide">
                                      <div className="w-5 h-5 rounded bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold border border-emerald-200 mr-3 flex-shrink-0 mt-0.5 shadow-sm">
                                         {idx + 1}
                                      </div>
                                      <span className="leading-snug">{step}</span>
                                  </li>
                               ))}
                               {!recommendation.action_steps?.length && (
                                  <li className="text-sm text-gray-400 italic">No exact sequence extracted arrays found natively internally via system matrix layout output engine structures properly globally.</li>
                               )}
                           </ul>
                         </div>
                         
                         <div className="bg-gray-50 p-4 border border-gray-100 shadow-inner rounded-xl flex justify-between items-center mt-6">
                             <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 leading-relaxed">
                               Map Code Recovery Vector Payload Yield Node Limit Engine Ext Map Root Target Code Limit Block End Map Limit Structure Limit Limit Yield
                            </div>
                             <div className="text-2xl font-bold tracking-tight text-emerald-600 font-mono ml-4 shrink-0">
                                {formatCurrency(recommendation.estimated_recovery)}
                            </div>
                         </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
