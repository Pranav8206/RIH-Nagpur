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
      <div className="min-h-[calc(100vh-64px)] bg-transparent pb-12 font-sans text-text-primary selection:bg-primary-accent-light/50">
         <main className="max-w-400 mx-auto px-4 sm:px-6 lg:px-8 pt-8">
            <div className="flex items-center justify-between gap-4 mb-8">
                <div>
                   <p className="text-sm font-medium text-text-tertiary tracking-wide uppercase">Recommendations</p>
                   <h1 className="text-3xl font-semibold tracking-tight text-text-primary mt-1">You can save {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(totalPotential)} per month</h1>
                </div>
                <button
                           onClick={() => {
                              queryClient.invalidateQueries({ queryKey: ['recommendations'] });
                              queryClient.invalidateQueries({ queryKey: ['recommendation-summary'] });
                           }}
                  className="inline-flex items-center gap-2 rounded-full border border-border-light bg-surface px-4 py-2 text-sm font-medium text-text-secondary shadow-sm hover:bg-surface-hover transition"
                  disabled={isFetching}
                >
                  <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                  Sync Database
                </button>
            </div>

            {isError && (
                <div className="mb-6 rounded-2xl border border-error/20 bg-error/10 p-4 text-error shadow-sm animate-in fade-in">
                   <h4 className="font-semibold text-sm">Unable to load recommendations</h4>
                   <p className="text-sm mt-1">{error.message}</p>
                </div>
            )}

                  <section className="mb-6 rounded-3xl border border-border-light bg-surface p-5 shadow-sm">
                     <div className="flex items-center gap-2 text-sm font-semibold text-primary-accent-dark mb-2">
                        <MessageCircleHeart className="h-4 w-4" />
                        Friendly AI Summary
                     </div>

                     {summaryLoading ? (
                        <p className="text-sm text-text-tertiary">Preparing a simple summary of your transactions...</p>
                     ) : (
                        <>
                           <p className="text-text-secondary text-sm leading-6">
                              {summaryData?.overview || 'Your recommendations are ready. Start with the top-impact items to maximize monthly savings.'}
                           </p>

                           {Array.isArray(summaryData?.recommendations) && summaryData.recommendations.length > 0 && (
                              <ul className="mt-3 space-y-2">
                                 {summaryData.recommendations.slice(0, 3).map((tip, index) => (
                                    <li key={`${tip}-${index}`} className="flex items-start gap-2 text-sm text-text-secondary">
                                       <CheckCircle2 className="h-4 w-4 text-primary-accent-dark mt-0.5 shrink-0" />
                                       <span>{tip}</span>
                                    </li>
                                 ))}
                              </ul>
                           )}
                        </>
                     )}
                  </section>

                  <div className="rounded-3xl border border-border-light bg-surface shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between border-b border-border-light px-5 py-4 bg-surface-hover">
                           <div className="flex items-center gap-2 text-sm font-medium text-text-tertiary">
                              <Sparkles className="h-4 w-4 text-primary-accent-dark" />
                    Suggested actions
                  </div>
                           <div className="text-sm text-text-tertiary">{data?.data?.length || 0} items</div>
                </div>
                <RecommendationTable
                   data={data?.data || []}
                   isLoading={isLoading}
                />

                <div className="flex items-center justify-between gap-4 border-t border-border-light px-5 py-4 bg-surface-hover text-sm">
                    <span className="text-text-tertiary">
                        Page {data?.page || 1}{data?.total > 0 ? ` of ${Math.ceil(data.total / (data.limit || 20))}` : ''}
                    </span>
                    <div className="flex gap-2">
                        <button
                           onClick={() => setPage((p) => Math.max(1, p - 1))}
                           disabled={page === 1 || isLoading}
                           className="rounded-full border border-border-light bg-surface px-4 py-2 font-medium text-text-secondary shadow-sm disabled:opacity-50 hover:bg-surface-hover transition"
                        >
                           Previous
                        </button>
                        <button
                           onClick={() => setPage((p) => p + 1)}
                           disabled={!data || data.data.length < (data.limit || 20) || isLoading}
                           className="rounded-full border border-border-light bg-surface px-4 py-2 font-medium text-text-secondary shadow-sm disabled:opacity-50 hover:bg-surface-hover transition"
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
