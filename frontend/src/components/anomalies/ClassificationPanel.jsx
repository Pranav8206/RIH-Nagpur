"use client";
import React, { useState } from 'react';
import axios from 'axios';
import { useQueryClient } from '@tanstack/react-query';
import { Network, ArrowRight } from 'lucide-react';

export default function ClassificationPanel({ classification, anomalyId }) {
    const queryClient = useQueryClient();
    const [loading, setLoading] = useState(false);

    const handleClassify = async () => {
        setLoading(true);
        try {
            await axios.post(`http://localhost:5000/api/classifications/classify`); 
            await queryClient.invalidateQueries(['anomaly', anomalyId]);
        } catch(e) {
            alert('Classification Trigger Failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-surface rounded-xl border border-border-light shadow-sm overflow-hidden h-full flex flex-col">
           <div className="px-6 py-4 border-b border-border-light bg-surface-hover flex items-center">
              <Network className="w-4 h-4 mr-2 text-primary-accent" />
              <h3 className="text-sm font-bold text-text-primary tracking-tight">AI Classification Node</h3>
           </div>
           
           <div className="p-6 flex-1 flex flex-col">
               {classification ? (
                   <div className="space-y-4">
                       <div>
                           <div className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-1.5">Leakage Taxonomy</div>
                           <div className="inline-block px-3 py-1.5 bg-primary-accent-light/30 border border-primary-accent-light text-primary-accent-dark font-bold rounded shadow-sm text-sm tracking-tight">
                               {classification.leakage_type}
                           </div>
                       </div>
                       
                       <div>
                           <div className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-1.5 flex justify-between">
                              <span>Model Confidence</span>
                              <span className="text-primary-accent">{(classification.confidence_score * 100).toFixed(1)}%</span>
                           </div>
                           <div className="h-2 w-full bg-surface-hover rounded-full overflow-hidden">
                               <div className="h-full bg-primary-accent rounded-full transition-all duration-1000" style={{ width: `${classification.confidence_score * 100}%` }}></div>
                           </div>
                       </div>

                       <div>
                           <div className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-1.5">Root Cause Vector</div>
                           <p className="text-sm text-text-secondary bg-surface p-3 border border-border-light shadow-sm rounded-lg">
                               {classification.root_cause || 'Pattern derivation from internal neural matching.'}
                           </p>
                       </div>
                   </div>
               ) : (
                   <div className="flex-1 flex flex-col items-center justify-center text-center">
                       <Network className="w-8 h-8 text-indigo-200 mb-3" />
                       <h4 className="text-sm font-semibold text-text-secondary">Awaiting Taxonomy Pattern</h4>
                       <p className="text-xs text-text-tertiary mt-1 max-w-[200px] mb-5 leading-relaxed tracking-wide">This node has not been routed through the ML verification pipeline natively yet.</p>
                       <button 
                         onClick={handleClassify}
                         disabled={loading}
                         className="flex items-center text-xs font-bold text-white bg-primary-accent px-4 py-2 rounded-lg hover:bg-indigo-700 transition shadow-sm disabled:opacity-50"
                       >
                          {loading ? 'Processing...' : (
                              <><Network className="w-3.5 h-3.5 mr-2" /> Classify Now <ArrowRight className="w-3.5 h-3.5 ml-2" /></>
                          )}
                       </button>
                   </div>
               )}
           </div>
        </div>
    );
}
