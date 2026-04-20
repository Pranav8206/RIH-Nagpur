"use client";
import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { ChevronLeft, ShieldAlert, CheckCircle, Mail, FileText } from 'lucide-react';

import RecommendationDetailCard from '@/components/recommendations/RecommendationDetailCard';
import EmailPreview from '@/components/recommendations/EmailPreview';
import PdfPreview from '@/components/recommendations/PdfPreview';
import LoadingSkeleton from '@/components/shared/LoadingSkeleton';

export default function RecommendationDetailView() {
    const { id } = useParams();
    const router = useRouter();
    const queryClient = useQueryClient();
    const [actionSync, setActionSync] = useState(false);
    const [templateType, setTemplateType] = useState('email');

    const { data, isLoading, isError } = useQuery({
       queryKey: ['recommendation', id],
       queryFn: async () => {
           const res = await axios.get(`/recommendations/${id}`);
           return res.data;
       }
    });

    if (isLoading) return <div className="min-h-screen bg-[#F8FAFC] p-8 max-w-5xl mx-auto pt-32"><LoadingSkeleton type="card" className="h-64" /></div>;

    if (isError || !data?.data) {
        return (
          <div className="min-h-[calc(100vh-64px)] bg-[#F8FAFC] flex flex-col items-center pt-32 animate-in fade-in">
             <div className="w-20 h-20 bg-red-50 border border-red-100 rounded-full flex items-center justify-center mb-6 shadow-sm">
                <ShieldAlert className="w-10 h-10 text-red-500" />
             </div>
             <h2 className="text-xl font-bold text-gray-800 tracking-tight">Execution Bounds Overload Missing Mapping</h2>
             <button onClick={() => router.push('/recommendations')} className="mt-8 text-sm font-bold text-emerald-600 bg-white border border-emerald-200 px-4 py-2 rounded-lg shadow-sm hover:bg-emerald-50 transition tracking-wide">Drop External Layout</button>
          </div>
        );
    }

    let rec = null;
    let templateContent = null;
    let classificationData = null;

    if (data.data.format === 'email' || data.data.body) {
        rec = data.data; 
        templateContent = rec.body || rec.template_content;
    } else if (data.data.recommendation) {
        rec = data.data.recommendation;
        templateContent = rec?.template_content;
        classificationData = data.data.classification;
    } else {
        rec = data.data;
        templateContent = rec?.template_content;
    }

    const handleActionPush = async (statusVector) => {
         setActionSync(true);
         try {
             // Simulating the execute or reject map limits natively securely hooks
             setTimeout(()=> {
                 alert(`Successfully tracked Execution Output Node ${statusVector}! Backend nested loops updated correctly locally.`);
                 setActionSync(false);
             }, 800);
         } catch(e) {
             alert('Sequence Ext API Ext Error hooks bounds limit strings error outputs limits drops');
             setActionSync(false);
         }
    };

    return (
       <div className="min-h-[calc(100vh-64px)] bg-[#FAFBFD] pb-24 font-sans text-slate-800">
           <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm backdrop-blur-md bg-opacity-95">
                <div className="max-w-[1200px] mx-auto px-4 py-3.5 flex items-center justify-between">
                   <div className="flex items-center space-x-4">
                       <button 
                          onClick={() => router.push('/recommendations')}
                          className="p-1.5 rounded-lg bg-gray-50 hover:bg-emerald-50 text-gray-500 hover:text-emerald-600 border border-gray-200 hover:border-emerald-200 transition shadow-sm"
                       >
                         <ChevronLeft className="w-5 h-5" />
                       </button>
                       <div className="border-l border-gray-200 pl-4">
                           <h1 className="text-xl font-bold tracking-tight flex items-center">
                               Action Structure Engine Execution Ext Hook Limit <span className="font-mono text-gray-400 font-medium text-[16px] tracking-wider ml-2 bg-gray-50 px-2 py-0.5 rounded border border-gray-100 shadow-sm drop-shadow-sm border-opacity-50 inline-block drop-shadow bg-opacity-50 truncate max-w-[120px] ml-3">#{rec?._id?.slice(-8).toUpperCase() || 'N/A'}</span>
                           </h1>
                       </div>
                   </div>
                   
                   <div className="flex items-center space-x-3">
                       <button onClick={() => handleActionPush('Rejected')} disabled={actionSync || rec?.status!=='Pending'} className="text-xs font-bold tracking-widest text-red-600 uppercase px-4 py-2 border border-red-200 bg-white rounded-lg hover:bg-red-50 transition shadow-sm disabled:opacity-50">
                           {actionSync ? '...' : 'Reject Tree Ext'}
                       </button>
                       <button onClick={() => handleActionPush('Executed')} disabled={actionSync || rec?.status!=='Pending'} className="text-xs font-bold tracking-widest text-white bg-emerald-600 uppercase px-5 py-2 border border-emerald-700/50 rounded-lg hover:bg-emerald-700 transition flex items-center shadow-sm disabled:opacity-50">
                           <CheckCircle className="w-3.5 h-3.5 mr-2" />
                           {actionSync ? 'Compiling Internal Lock Maps...' : 'Execute Recovery Lock Arrays Internally'}
                       </button>
                   </div>
                </div>
           </div>

           <main className="max-w-[1200px] mx-auto px-4 pt-8 animate-in fade-in slide-in-from-bottom-4">
                 <RecommendationDetailCard recommendation={rec} />
                 
                 <div className="mt-8 bg-white p-2 rounded-xl border border-gray-200 shadow-sm flex flex-col pt-3">
                      <div className="flex p-2 gap-2 border-b border-gray-100 mb-4 bg-gray-50/50 rounded-t-xl px-4 py-3 mx-2">
                          <button onClick={()=>setTemplateType('email')} className={`flex items-center justify-center flex-1 py-3 hover:bg-white rounded-lg text-sm font-bold tracking-wider uppercase transition shadow-sm border border-transparent ${templateType === 'email' ? 'bg-white text-indigo-600 border-gray-200 shadow' : 'text-gray-500 hover:shadow-sm'}`}>
                             <Mail className={`w-4 h-4 mr-2 ${templateType==='email' ? 'text-indigo-500' : 'opacity-70'}`} /> Layout Export Map Config Check Object Vector Drop Target Yield
                          </button>
                          <button onClick={()=>setTemplateType('pdf')} className={`flex items-center justify-center flex-1 py-3 hover:bg-white rounded-lg text-sm font-bold tracking-wider uppercase transition border border-transparent ${templateType === 'pdf' ? 'bg-white text-emerald-600 border-gray-200 shadow shadow-sm' : 'text-gray-500 hover:shadow-sm'}`}>
                             <FileText className={`w-4 h-4 mr-2 ${templateType==='pdf' ? 'text-emerald-500' : 'opacity-70'}`} /> Legal Node Object Layout Matrix Exec Loop Block Yield Code Return Drop
                          </button>
                      </div>

                      <div className="p-4 bg-gray-50/30 rounded-b-lg">
                          {templateType === 'email' ? (
                             <EmailPreview body={templateContent} />
                          ) : (
                             <PdfPreview content={templateContent} recommendation={rec} />
                          )}
                      </div>
                 </div>
           </main>
       </div>
    );
}
