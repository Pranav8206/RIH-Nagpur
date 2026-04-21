"use client";

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { RefreshCw, Sparkles, MessageCircleHeart, CheckCircle2 } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';

import RecommendationTable from '@/components/recommendations/RecommendationTable';

export default function RecommendationsListPage() {
  const queryClient = useQueryClient();
  const { axiosInstance } = useAppContext();
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ['recommendations', page],
      queryFn: async ({ queryKey }) => {
         const [_key, currentPage] = queryKey;
         const params = new URLSearchParams();

         if (currentPage) params.append('page', currentPage);
         params.append('limit', '20');

         const { data } = await axiosInstance.get(`/recommendations?${params.toString()}`);
         return data;
      },
    keepPreviousData: true, 
  });

  const totalPotential = data?.data?.reduce((sum, recommendation) => sum + (recommendation.estimated_recovery || 0), 0) || 0;

   const { data: summaryData, isLoading: summaryLoading } = useQuery({
      queryKey: ['recommendation-summary'],
      queryFn: async () => {
         const { data } = await axiosInstance.get('/recommendations/summary');
         return data?.data;
      }
   });

  return (
      <div className="min-h-[calc(100vh-64px)] bg-[#FBF8F2] pb-12 font-sans text-slate-800 selection:bg-[#d7e0d7]">
         <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
            <div className="flex items-center justify-between gap-4 mb-8">
                <div>
                   <p className="text-sm font-medium text-slate-500 tracking-wide uppercase">Recommendations</p>
                   <h1 className="text-3xl font-semibold tracking-tight text-slate-800 mt-1">You can save {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(totalPotential)} per month</h1>
                </div>
                <button
                           onClick={() => {
                              queryClient.invalidateQueries(['recommendations']);
                              queryClient.invalidateQueries(['recommendation-summary']);
                           }}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50 transition"
                  disabled={isFetching}
                >
                  <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                  Sync Database
                </button>
            </div>

            {isError && (
                <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700 shadow-sm animate-in fade-in">
                   <h4 className="font-semibold text-sm">Unable to load recommendations</h4>
                   <p className="text-sm mt-1">{error.message}</p>
                </div>
            )}

                  <section className="mb-6 rounded-3xl border border-[#dfe6da] bg-[#f7faf5] p-5 shadow-[0_10px_25px_rgba(15,23,42,0.05)]">
                     <div className="flex items-center gap-2 text-sm font-semibold text-[#6c7f65] mb-2">
                        <MessageCircleHeart className="h-4 w-4" />
                        Friendly AI Summary
                     </div>

                     {summaryLoading ? (
                        <p className="text-sm text-slate-500">Preparing a simple summary of your transactions...</p>
                     ) : (
                        <>
                           <p className="text-slate-700 text-sm leading-6">
                              {summaryData?.overview || 'Your recommendations are ready. Start with the top-impact items to maximize monthly savings.'}
                           </p>

                           {Array.isArray(summaryData?.recommendations) && summaryData.recommendations.length > 0 && (
                              <ul className="mt-3 space-y-2">
                                 {summaryData.recommendations.slice(0, 3).map((tip, index) => (
                                    <li key={`${tip}-${index}`} className="flex items-start gap-2 text-sm text-slate-600">
                                       <CheckCircle2 className="h-4 w-4 text-[#7a8c72] mt-0.5 shrink-0" />
                                       <span>{tip}</span>
                                    </li>
                                 ))}
                              </ul>
                           )}
                        </>
                     )}
                  </section>

            <div className="rounded-3xl border border-slate-200 bg-white/80 shadow-[0_12px_40px_rgba(15,23,42,0.06)] overflow-hidden backdrop-blur-sm">
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 bg-white/70">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                    <Sparkles className="h-4 w-4 text-[#7a8c72]" />
                    Suggested actions
                  </div>
                  <div className="text-sm text-slate-500">{data?.data?.length || 0} items</div>
                </div>
                <RecommendationTable
                   data={data?.data || []}
                   isLoading={isLoading}
                />

                <div className="flex items-center justify-between gap-4 border-t border-slate-200 px-5 py-4 bg-white/70 text-sm">
                    <span className="text-slate-500">
                        Page {data?.page || 1}{data?.total > 0 ? ` of ${Math.ceil(data.total / (data.limit || 20))}` : ''}
                    </span>
                    <div className="flex gap-2">
                        <button
                           onClick={() => setPage((p) => Math.max(1, p - 1))}
                           disabled={page === 1 || isLoading}
                           className="rounded-full border border-slate-200 bg-white px-4 py-2 font-medium text-slate-600 shadow-sm disabled:opacity-50 hover:bg-slate-50 transition"
                        >
                           Previous
                        </button>
                        <button
                           onClick={() => setPage((p) => p + 1)}
                           disabled={!data || data.data.length < (data.limit || 20) || isLoading}
                           className="rounded-full border border-slate-200 bg-white px-4 py-2 font-medium text-slate-600 shadow-sm disabled:opacity-50 hover:bg-slate-50 transition"
                        >
                           Next
                        </button>
                    </div>
                </div>
            </div>
         </main>
      </div>
  );
}
