"use client";
import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ShieldAlert, Zap, Network } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';

import ClassificationDetailCard from '@/components/classifications/ClassificationDetailCard';
import KeyIndicators from '@/components/classifications/KeyIndicators';
import LoadingSkeleton from '@/components/shared/LoadingSkeleton';

export default function ClassificationDetailView() {
    const { id } = useParams();
    const router = useRouter();
    const [actionSync, setActionSync] = useState(false);
    const { axiosInstance } = useAppContext();

    // Bypassing blocking sequential requests completely caching natively mapping queries!
    const { data, isLoading, isError } = useQuery({
       queryKey: ['classification', id],
       queryFn: async () => {
           const res = await axiosInstance.get(`/classifications/${id}`);
           return res.data;
       }
    });

    if (isLoading) {
        return (
          <div className="min-h-screen bg-[#F8FAFC] p-8 max-w-5xl mx-auto pt-32">
             <LoadingSkeleton type="card" className="h-64" />
          </div>
        );
    }

    if (isError || !data?.data) {
        return (
          <div className="min-h-[calc(100vh-64px)] bg-[#F8FAFC] flex flex-col items-center pt-32 animate-in fade-in">
             <div className="w-20 h-20 bg-red-50 border border-red-100 rounded-full flex items-center justify-center mb-6 shadow-sm">
                <ShieldAlert className="w-10 h-10 text-red-500" />
             </div>
             <h2 className="text-xl font-bold text-gray-800 tracking-tight">Taxonomy Limit Missing</h2>
             <p className="text-sm font-medium text-gray-500 mt-2 text-center max-w-sm">The explicit ML node mapping was missing or inaccessible under current security loops.</p>
             <button onClick={() => router.push('/classifications')} className="mt-8 text-sm font-bold text-indigo-600 bg-white border border-indigo-200 px-4 py-2 rounded-lg shadow-sm hover:bg-indigo-50 transition">Drop Back</button>
          </div>
        );
    }

    const classification = data.data;

    const handleMockGeneration = async () => {
         setActionSync(true);
         setTimeout(() => {
             alert('Recommendation Workflow mapped properly dynamically via hooks!');
             setActionSync(false);
         }, 1000);
    };

    return (
       <div className="min-h-[calc(100vh-64px)] bg-[#FAFBFD] pb-24 font-sans text-slate-800">
           <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm backdrop-blur-md bg-opacity-95">
                <div className="max-w-[1200px] mx-auto px-4 py-3.5 flex items-center justify-between">
                   <div className="flex items-center space-x-4">
                       <button 
                          onClick={() => router.push('/classifications')}
                          className="p-1.5 rounded-lg bg-gray-50 hover:bg-indigo-50 text-gray-500 hover:text-indigo-600 border border-gray-200 hover:border-indigo-200 transition shadow-sm"
                       >
                         <ChevronLeft className="w-5 h-5" />
                       </button>
                       <div className="border-l border-gray-200 pl-4">
                           <h1 className="text-xl font-bold tracking-tight flex items-center">
                               Taxonomy Map <span className="font-mono text-gray-400 font-medium text-[16px] tracking-wider ml-2 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">#{classification._id?.slice(-8).toUpperCase()}</span>
                           </h1>
                       </div>
                   </div>
                   
                   <div className="flex items-center space-x-3">
                       <button onClick={handleMockGeneration} disabled={actionSync} className="text-xs font-bold tracking-widest text-white bg-indigo-600 uppercase px-4 py-2 border border-indigo-700/50 rounded-lg hover:bg-indigo-700 transition flex items-center shadow-sm disabled:opacity-50">
                           <Zap className="w-3.5 h-3.5 mr-2" />
                           {actionSync ? 'Compiling Action...' : 'Compile Recovery'}
                       </button>
                   </div>
                </div>
           </div>

           <main className="max-w-[1200px] mx-auto px-4 pt-8 animate-in fade-in slide-in-from-bottom-4">
                 <ClassificationDetailCard classification={classification} />
                 
                 <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                     <KeyIndicators indicators={classification.key_indicators} />
                     
                     <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col">
                          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center">
                             <Network className="w-4 h-4 mr-2 text-indigo-500" /> Actions Sandbox Limit
                          </h3>
                          <div className="flex-1 flex flex-col space-y-4">
                              <textarea 
                                 className="w-full text-sm flex-1 bg-gray-50 border border-gray-200 rounded-lg p-4 resize-none outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 placeholder-gray-400 font-medium tracking-wide transition"
                                 placeholder="Force internal overrides marking strings correctly locally..."
                              ></textarea>
                              <div className="flex items-center justify-end space-x-3 mt-auto pt-2">
                                  <button className="text-xs font-bold tracking-widest uppercase px-4 py-2.5 bg-gray-50 text-slate-700 border border-gray-200 rounded-lg hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors shadow-sm">
                                      Flag Override
                                  </button>
                                  <button className="text-xs font-bold px-4 py-2.5 bg-emerald-600 text-white border border-emerald-700/50 uppercase tracking-widest rounded-lg hover:bg-emerald-700 hover:shadow transition-all">
                                      Verify Output
                                  </button>
                              </div>
                          </div>
                     </div>
                 </div>
           </main>
       </div>
    );
}
