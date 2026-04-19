"use client";
import React from 'react';
import { PlayCircle, ShieldCheck, FileDown, Mail, ArrowRight, Zap, Target } from 'lucide-react';

export default function SidebarActions({ onRunDetection, onRunClassification, isProcessing }) {
    return (
       <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col h-full bg-opacity-70 bg-clip-padding backdrop-filter backdrop-blur-sm">
           <div className="mb-6">
               <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center">
                  <Zap className="w-4 h-4 mr-1.5 text-yellow-500" />
                  Algorithm Triggers
               </h3>
               <div className="space-y-3">
                   <button 
                      onClick={onRunDetection}
                      disabled={isProcessing}
                      className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-blue-50 text-gray-700 hover:text-blue-700 rounded-lg border border-gray-200 hover:border-blue-300 transition-all group shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                       <span className="flex items-center text-sm font-semibold">
                          <Target className="w-4 h-4 mr-2.5 text-blue-500" /> 
                          Run ML Matrix
                       </span>
                       <PlayCircle className="w-4 h-4 opacity-40 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                   </button>

                   <button 
                      onClick={onRunClassification}
                      disabled={isProcessing}
                      className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-emerald-50 text-gray-700 hover:text-emerald-700 rounded-lg border border-gray-200 hover:border-emerald-300 transition-all group shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                       <span className="flex items-center text-sm font-semibold">
                          <ShieldCheck className="w-4 h-4 mr-2.5 text-emerald-500" /> 
                          Apply Taxonomies
                       </span>
                       <ArrowRight className="w-4 h-4 opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                   </button>
               </div>
           </div>

           <div className="mt-auto pt-6 border-t border-gray-100">
               <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Export Workflows</h3>
               <div className="grid grid-cols-2 gap-3">
                   <button className="flex flex-col items-center justify-center p-3 border border-gray-200 bg-gray-50/50 rounded-xl hover:bg-white hover:shadow-sm hover:border-red-200 transition-all text-gray-600 group">
                       <FileDown className="w-5 h-5 mb-1.5 text-red-400 group-hover:-translate-y-0.5 transition-transform" />
                       <span className="text-xs font-bold tracking-tight">PDF Report</span>
                   </button>
                   <button className="flex flex-col items-center justify-center p-3 border border-gray-200 bg-gray-50/50 rounded-xl hover:bg-white hover:shadow-sm hover:border-emerald-200 transition-all text-gray-600 group">
                       <FileDown className="w-5 h-5 mb-1.5 text-emerald-500 group-hover:-translate-y-0.5 transition-transform" />
                       <span className="text-xs font-bold tracking-tight">Data Dump</span>
                   </button>
                   <button className="col-span-2 flex items-center justify-center p-3 border border-gray-200 bg-gray-50/50 rounded-xl hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all text-gray-600 group mt-1">
                       <Mail className="w-4 h-4 mr-2 text-blue-500 group-hover:text-white transition-colors" />
                       <span className="text-sm font-bold tracking-tight">Distribute via Email</span>
                   </button>
               </div>
           </div>
       </div>
    );
}
