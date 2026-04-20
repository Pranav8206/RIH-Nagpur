"use client";
import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { ChevronLeft, ShieldAlert } from 'lucide-react';

import AnomalyDetailCard from '@/components/anomalies/AnomalyDetailCard';
import ClassificationPanel from '@/components/anomalies/ClassificationPanel';
import RecommendationPanel from '@/components/anomalies/RecommendationPanel';
import AuditTrail from '@/components/anomalies/AuditTrail';
import RelatedTransactions from '@/components/anomalies/RelatedTransactions';

export default function AnomalyDetailView() {
    const { id } = useParams();
    const router = useRouter();

    // The entire context runs strictly mapping React Query states utilizing fast caching logic
    const { data, isLoading, isError } = useQuery({
       queryKey: ['anomaly', id],
       queryFn: async () => {
           const res = await axios.get(`/anomalies/${id}`);
           return res.data;
       }
    });

    if (isLoading) {
        return (
          <div className="min-h-[calc(100vh-64px)] bg-[#F8FAFC] flex justify-center pt-32">
             <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        );
    }

    if (isError || !data?.data) {
        return (
          <div className="min-h-[calc(100vh-64px)] bg-[#F8FAFC] flex flex-col items-center pt-32 animate-in fade-in">
             <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6 border border-red-100 shadow-sm">
                <ShieldAlert className="w-10 h-10 text-red-500" />
             </div>
             <h2 className="text-xl font-bold text-slate-800 tracking-tight">Node Unreachable</h2>
             <p className="text-gray-500 mt-2 text-sm max-w-sm text-center">The anomaly requested limits could not be verified securely against DB outputs.</p>
             <button onClick={() => router.push('/anomalies')} className="mt-8 text-sm font-semibold text-blue-600 bg-white border border-blue-200 px-5 py-2 rounded-lg hover:bg-blue-50 transition-colors shadow-sm tracking-wide">
                Return to Matrix
             </button>
          </div>
        );
    }

    // Explode boundaries natively bypassing complex tree routing limits
    const { anomaly, transaction, classifications, recommendations } = data.data;

    return (
       <div className="min-h-[calc(100vh-64px)] bg-[#FAFBFD] pb-24 selection:bg-blue-100 font-sans">
           <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm backdrop-blur-md bg-opacity-95">
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
                   <div className="flex items-center space-x-4">
                       <button 
                          onClick={() => router.push('/anomalies')}
                          className="p-1.5 rounded-lg bg-gray-50 hover:bg-blue-50 text-gray-500 hover:text-blue-600 transition flex items-center shadow-sm border border-gray-200 hover:border-blue-200"
                       >
                         <ChevronLeft className="w-5 h-5" />
                       </button>
                       <div className="flex items-center space-x-3 border-l border-gray-200 pl-4">
                           <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center">
                              Review Node <span className="ml-2 font-mono text-gray-400 font-medium text-lg">#{anomaly._id?.slice(-8).toUpperCase()}</span>
                           </h1>
                       </div>
                   </div>
                   
                   <div className="flex items-center">
                       <span className="text-xs font-bold uppercase tracking-widest text-gray-400 mr-3">Status Lock</span>
                       <span className={`px-2.5 py-1 rounded border text-[11px] font-bold uppercase tracking-widest shadow-sm ${
                           anomaly.status === 'Resolved' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                           anomaly.status === 'Reviewed' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                           'bg-gray-50 text-slate-700 border-gray-200'
                       }`}>{anomaly.status}</span>
                   </div>
                </div>
           </div>

           <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                   
                   <div className="lg:col-span-8 space-y-6">
                       <AnomalyDetailCard anomaly={anomaly} transaction={transaction} />
                       
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <ClassificationPanel classification={classifications?.[0]} anomalyId={id} />
                           <RecommendationPanel recommendation={recommendations?.[0]} anomalyId={id} classificationId={classifications?.[0]?._id} currentClassification={classifications?.[0]} />
                       </div>

                       <AuditTrail entityId={id} anomalyId={id} classificationId={classifications?.[0]?._id} />
                   </div>
                   
                   <div className="lg:col-span-4 space-y-6">
                       <RelatedTransactions vendor={transaction?.vendor_name} currentTrxId={transaction?._id} />
                   </div>
               </div>
           </main>
       </div>
    );
}
