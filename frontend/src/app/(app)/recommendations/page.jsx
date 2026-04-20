"use client";

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, RefreshCw } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';

import RecommendationTable from '@/components/recommendations/RecommendationTable';
import RecommendationFilters from '@/components/recommendations/RecommendationFilters';

export default function RecommendationsListPage() {
  const queryClient = useQueryClient();
   const { axiosInstance } = useAppContext();
  const [filters, setFilters] = useState({ status: '', priority: '' });
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ['recommendations', filters, page],
      queryFn: async ({ queryKey }) => {
         const [_key, currentFilters, currentPage] = queryKey;
         const params = new URLSearchParams();

         if (currentPage) params.append('page', currentPage);
         params.append('limit', '20');
         if (currentFilters.status) params.append('status', currentFilters.status);
         if (currentFilters.priority) params.append('priority', currentFilters.priority);

         const { data } = await axiosInstance.get(`/recommendations?${params.toString()}`);
         return data;
      },
    keepPreviousData: true, 
  });

  const handleFilterChange = (newFilters) => {
     setFilters({ ...filters, ...newFilters });
     setPage(1); 
  };

  return (
      <div className="min-h-[calc(100vh-64px)] bg-transparent pb-12 selection:bg-primary-accent-light/50 font-sans">
         <main className="max-w-400 mx-auto px-4 sm:px-6 lg:px-8 pt-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                   <h1 className="text-2xl font-bold tracking-tight text-text-primary flex items-center">
                     <ShieldCheck className="w-6 h-6 mr-2 text-primary-accent" />
                     Action Modules Configuration Limit
                   </h1>
                   <p className="text-sm text-text-secondary mt-1 tracking-wide font-medium">Execute generated Action setups securely tracking analytical mappings properly directly via nested array checks.</p>
                </div>
                <div className="flex space-x-3">
                    <button 
                      onClick={() => alert("Batch execution pushing mapped API limits natively!")}
                      className="text-sm font-bold tracking-tight text-surface bg-primary-accent border border-primary-accent-dark/50 px-4 py-2 rounded-lg shadow-sm hover:shadow hover:bg-primary-accent-dark transition"
                    >
                        Execute Active Nodes Layouts
                    </button>
                    <button 
                      onClick={() => queryClient.invalidateQueries(['recommendations'])}
                      className="flex items-center text-sm font-bold text-text-secondary bg-surface border border-border-light px-4 py-2 rounded-lg shadow-sm hover:bg-surface-hover transition"
                      disabled={isFetching}
                    >
                        <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-primary-accent' : ''}`} />
                    </button>
                </div>
            </div>

            {isError && (
                <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-xl text-error shadow-sm animate-in fade-in">
                   <h4 className="font-bold tracking-tight text-sm">Action Arrays Missing Limit Error Map</h4>
                   <p className="text-sm mt-1">{error.message}</p>
                </div>
            )}

            <div className="bg-surface rounded-xl border border-border-light shadow-sm overflow-hidden flex flex-col min-h-150 bg-opacity-70 backdrop-filter backdrop-blur-sm">
                <RecommendationFilters currentFilters={filters} onFilterChange={handleFilterChange} />
                
                <RecommendationTable 
                   data={data?.data || []} 
                   isLoading={isLoading} 
                />

                <div className="p-4 border-t border-border-light flex items-center justify-between text-sm bg-surface-hover mt-auto">
                    <span className="text-text-secondary font-medium">
                        {data?.data?.length === 0 ? "Empty Execution Tree Layout Boundaries" : `Dataset Page ${data?.page || 1}`}
                        {data?.total > 0 && ` of ${Math.ceil(data.total / (data.limit || 20))} Records Mapping Payload Array`}
                    </span>
                    <div className="flex space-x-2">
                        <button 
                           onClick={() => setPage(p => Math.max(1, p - 1))}
                           disabled={page === 1 || isLoading}
                           className="px-4 py-1.5 border border-border-light bg-surface hover:bg-surface-hover rounded-lg text-text-secondary disabled:opacity-50 font-bold shadow-sm"
                        >
                           Previous Check
                        </button>
                        <button 
                           onClick={() => setPage(p => p + 1)}
                           disabled={!data || data.data.length < (data.limit || 20) || isLoading}
                           className="px-4 py-1.5 border border-border-light bg-surface hover:bg-surface-hover rounded-lg text-text-secondary disabled:opacity-50 font-bold shadow-sm"
                        >
                           Follow Node Ext
                        </button>
                    </div>
                </div>
            </div>
         </main>
      </div>
  );
}
