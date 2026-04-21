"use client";

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { RefreshCcw, Sparkles, MessageCircleHeart, CheckCircle2, Lightbulb } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import PageHeader from '@/components/shared/PageHeader';

import RecommendationTable from '@/components/recommendations/RecommendationTable';

export default function RecommendationsListPage() {
  const queryClient = useQueryClient();
  const { axiosInstance } = useAppContext();
  const [page, setPage] = useState(1);
   const [reanalyzing, setReanalyzing] = useState(false);
   const [reanalysisMessage, setReanalysisMessage] = useState('');

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

   const handleRefresh = () => {
      setReanalysisMessage('');
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
      queryClient.invalidateQueries({ queryKey: ['recommendation-summary'] });
   };

   const handleReanalyze = async () => {
      setReanalyzing(true);
      setReanalysisMessage('');
      try {
         await axiosInstance.post('/anomalies/detect', {});
         const response = await axiosInstance.post('/recommendations/generate', {});
         const generated = response?.data?.data?.generated ?? response?.data?.generated ?? 0;
         const message = response?.data?.message || (generated > 0
            ? `Reanalysis complete. ${generated} recommendation(s) generated.`
            : 'Reanalysis complete. No new recommendations were created.');
         setReanalysisMessage(message);
         queryClient.invalidateQueries({ queryKey: ['recommendations'] });
         queryClient.invalidateQueries({ queryKey: ['recommendation-summary'] });
      } catch (err) {
         setReanalysisMessage(err?.response?.data?.message || 'Reanalysis failed. Please try again.');
      } finally {
         setReanalyzing(false);
      }
   };

  return (
      <div className="min-h-[calc(100vh-64px)] bg-transparent pb-12 font-sans text-text-primary selection:bg-primary-accent-light/50">
         <main className="max-w-400 mx-auto px-4 sm:px-6 lg:px-8 pt-8">
            <PageHeader
              title={`You can save ${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(totalPotential)} per month`}
              subtitle="Recommendations"
              icon={Lightbulb}
              actions={
                        <div className="flex items-center gap-2">
                           <button
                              onClick={handleRefresh}
                              className="inline-flex items-center gap-2 rounded-full border border-border-light bg-surface px-4 py-2 text-sm font-medium text-text-secondary shadow-sm hover:bg-surface-hover transition"
                              disabled={isFetching || reanalyzing}
                           >
                              <RefreshCcw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                              Refresh
                           </button>
                           <button
                              onClick={handleReanalyze}
                              className="inline-flex items-center gap-2 rounded-full border border-primary-accent-light bg-primary-accent px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-accent-dark transition disabled:opacity-60"
                              disabled={isFetching || reanalyzing}
                           >
                              <Sparkles className={`h-4 w-4 ${reanalyzing ? 'animate-spin' : ''}`} />
                              {reanalyzing ? 'Reanalyzing...' : 'Reanalyze Recommendations'}
                           </button>
                        </div>
              }
            />

                  {reanalysisMessage && (
                     <div className="mb-6 rounded-2xl border border-primary-accent-light bg-primary-accent-light/20 p-4 text-sm text-text-secondary shadow-sm">
                        {reanalysisMessage}
                     </div>
                  )}

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

                        {!isLoading && !isError && (data?.data?.length || 0) === 0 && (
                           <div className="mx-5 mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
                              <p className="text-sm font-semibold">No recommendations right now</p>
                              <p className="mt-1 text-sm text-amber-800">
                                 Common reasons: no anomalies detected yet, all anomalies are resolved, or recommendations were already generated for existing anomalies.
                              </p>
                              <button
                                 onClick={handleReanalyze}
                                 disabled={reanalyzing}
                                 className="mt-3 inline-flex items-center gap-2 rounded-full border border-amber-300 bg-white px-4 py-2 text-sm font-medium text-amber-900 hover:bg-amber-100 transition disabled:opacity-60"
                              >
                                 <Sparkles className={`h-4 w-4 ${reanalyzing ? 'animate-spin' : ''}`} />
                                 {reanalyzing ? 'Reanalyzing...' : 'Run Reanalysis'}
                              </button>
                           </div>
                        )}

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
