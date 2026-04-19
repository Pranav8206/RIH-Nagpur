"use client";
import React from 'react';
import { Target, Activity, FileText, Calendar, CreditCard, Hash } from 'lucide-react';

export default function AnomalyDetailCard({ anomaly, transaction }) {
    
    // Safety destructures checking bounds cleanly
    if (!anomaly || !transaction) return null;

    const formatCurrency = (amt) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amt || 0);
    const formatDate = (dateStr) => dateStr ? new Date(dateStr).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric'}) : 'N/A';

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
               <h2 className="text-lg font-bold text-slate-800 tracking-tight flex items-center">
                  <Target className="w-5 h-5 mr-2 text-blue-500" /> Matrix Fingerprint
               </h2>
               <div className={`px-2.5 py-1 rounded-lg border text-xs font-bold uppercase tracking-widest ${
                   anomaly.severity === 'High' ? 'bg-red-50 text-red-700 border-red-200' :
                   anomaly.severity === 'Medium' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                   'bg-emerald-50 text-emerald-700 border-emerald-200'
               }`}>
                  {anomaly.severity} Severity
               </div>
            </div>

            <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 divide-x divide-gray-100">
                    
                    {/* Transaction Identity Constraints */}
                    <div className="space-y-5 pr-4">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center">
                           <FileText className="w-3.5 h-3.5 mr-1" /> Bound Transaction
                        </h3>
                        
                        <div>
                            <div className="text-xs font-medium text-gray-500 mb-0.5">Vendor Target</div>
                            <div className="text-xl font-bold text-slate-800">{transaction.vendor_name}</div>
                        </div>

                        <div className="flex space-x-8">
                             <div>
                                 <div className="text-xs font-medium text-gray-500 mb-1 flex items-center">
                                     <Activity className="w-3 h-3 mr-1" /> Volume
                                 </div>
                                 <div className="text-xl font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded inline-block">
                                     {formatCurrency(transaction.amount)}
                                 </div>
                             </div>
                             <div>
                                 <div className="text-xs font-medium text-gray-500 mb-1 flex items-center">
                                     <Calendar className="w-3 h-3 mr-1" /> Stamp
                                 </div>
                                 <div className="text-sm font-semibold text-slate-700 mt-2">{formatDate(transaction.date)}</div>
                             </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                             <div>
                                 <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center">
                                    <Hash className="w-3 h-3 mr-1" /> Invoice ID
                                 </div>
                                 <div className="text-xs font-mono text-slate-700 font-semibold">{transaction.invoice_number}</div>
                             </div>
                             <div>
                                 <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center">
                                    <CreditCard className="w-3 h-3 mr-1" /> Method
                                 </div>
                                 <div className="text-xs font-semibold text-slate-700">{transaction.payment_method}</div>
                             </div>
                        </div>
                    </div>

                    {/* Algorithmic Output Constraints */}
                    <div className="pl-8 space-y-6">
                         <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center">
                           <Activity className="w-3.5 h-3.5 mr-1" /> Output Matrices
                        </h3>

                        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                             <div className="flex justify-between items-end mb-2">
                                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Engine Score</div>
                                <div className="text-lg font-mono font-bold text-red-600">{anomaly.anomaly_score.toFixed(2)}</div>
                             </div>
                             {/* Progress indicator mimicking accuracy strings */}
                             <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                 <div className="h-full bg-gradient-to-r from-red-400 to-red-600 transition-all duration-1000" style={{ width: `${Math.min(100, Math.max(0, anomaly.anomaly_score * 100))}%` }}></div>
                             </div>
                        </div>

                        <div>
                             <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Algorithmic Method</div>
                             <div className="text-sm border border-gray-200 bg-gray-50 w-full py-1.5 px-3 rounded-lg text-slate-700 font-medium inline-block shadow-sm">
                                 {anomaly.detection_method || 'Statistical Limit Check'}
                             </div>
                        </div>
                        
                        <div>
                             <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Node Log</div>
                             <p className="text-sm text-slate-600 bg-white p-3 border border-gray-100 shadow-sm rounded-lg leading-relaxed">
                                 {anomaly.reason_description || 'Manual validation array trigger.'}
                             </p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
