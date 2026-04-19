"use client";
import React, { useState } from 'react';
import axios from 'axios';
import { useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, ArrowRight, Zap } from 'lucide-react';

export default function RecommendationPanel({ recommendation, classificationId, currentClassification }) {
    const queryClient = useQueryClient();
    const [loading, setLoading] = useState(false);

    const handleGenerate = async () => {
        setLoading(true);
        try {
            await axios.post(`http://localhost:5000/api/recommendations/generate`);
            await queryClient.invalidateQueries(['anomaly']); 
        } catch(e) {
            alert('Recommendation Logic API Error boundaries.');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amt) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amt || 0);

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden h-full flex flex-col">
           <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <div className="flex items-center">
                 <ShieldCheck className="w-4 h-4 mr-2 text-emerald-500" />
                 <h3 className="text-sm font-bold text-slate-800 tracking-tight">Resolution Templates</h3>
              </div>
              {recommendation && (
                 <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded border ${
                    recommendation.status === 'Executed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    recommendation.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                    'bg-amber-50 text-amber-700 border-amber-200'
                 }`}>
                     {recommendation.status}
                 </span>
              )}
           </div>
           
           <div className="p-6 flex-1 flex flex-col">
               {recommendation ? (
                   <div className="space-y-6">
                       <div>
                           <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex justify-between">
                               <span>Expected Node Recovery Pull</span>
                           </div>
                           <div className="text-3xl font-bold tracking-tight text-emerald-600 font-mono">
                               {formatCurrency(recommendation.estimated_recovery)}
                           </div>
                       </div>

                       <div>
                           <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center">
                               <Zap className="w-3 h-3 mr-1" /> Actionable Limits Map
                           </div>
                           <ul className="space-y-2">
                               {recommendation.action_steps?.map((step, idx) => (
                                  <li key={idx} className="flex items-start text-sm text-slate-700 bg-gray-50 p-2.5 rounded border border-gray-100 shadow-sm">
                                      <div className="w-5 h-5 rounded bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold border border-emerald-200 mr-3 flex-shrink-0 mt-0.5 shadow-sm">
                                         {idx + 1}
                                      </div>
                                      <span className="leading-snug">{step}</span>
                                  </li>
                               ))}
                               {!recommendation.action_steps?.length && (
                                  <li className="text-sm text-gray-400 italic">No explicit steps parsed.</li>
                               )}
                           </ul>
                       </div>
                   </div>
               ) : (
                   <div className="flex-1 flex flex-col items-center justify-center text-center">
                       <ShieldCheck className="w-8 h-8 text-emerald-200 mb-3" />
                       <h4 className="text-sm font-semibold text-slate-700">Missing Recovery Template</h4>
                       <p className="text-xs text-gray-500 mt-1 max-w-[250px] mb-5 leading-relaxed tracking-wide">
                           {currentClassification ? "Classification found natively. Trigger generation routines to parse recovery structures seamlessly." : "Entity must be Classified successfully before Action templates can compile."}
                       </p>
                       <button 
                         onClick={handleGenerate}
                         disabled={loading || !currentClassification}
                         className="flex items-center text-xs font-bold text-white bg-emerald-600 px-4 py-2 rounded-lg hover:bg-emerald-700 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                       >
                          {loading ? 'Compiling Code...' : (
                              <><ShieldCheck className="w-3.5 h-3.5 mr-2" /> Generate Routine Map <ArrowRight className="w-3.5 h-3.5 ml-2" /></>
                          )}
                       </button>
                   </div>
               )}
           </div>
        </div>
    );
}
