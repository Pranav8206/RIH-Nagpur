"use client";

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Network, RefreshCw } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';

import ClassificationTable from '@/components/classifications/ClassificationTable';
import ClassificationFilters from '@/components/classifications/ClassificationFilters';

export default function ClassificationsListPage() {
  const queryClient = useQueryClient();
   const { axiosInstance } = useAppContext();
  const [filters, setFilters] = useState({ leakage_type: '', impact_level: '' });
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ['classifications', filters, page],
      queryFn: async ({ queryKey }) => {
         const [_key, currentFilters, currentPage] = queryKey;
         const params = new URLSearchParams();

         if (currentPage) params.append('page', currentPage);
         params.append('limit', '20');
         if (currentFilters.leakage_type) params.append('leakage_type', currentFilters.leakage_type);
         if (currentFilters.impact_level) params.append('impact_level', currentFilters.impact_level);

         const { data } = await axiosInstance.get(`/classifications?${params.toString()}`);
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
                     <Network className="w-6 h-6 mr-2 text-primary-accent" />
                     Classification Model Taxonomies
                   </h1>
                   <p className="text-sm text-text-secondary mt-1 tracking-wide font-medium">Review algorithmic output hooks defining structural leakage mapping vectors locally.</p>
                </div>
                <div className="flex space-x-3">
                    <button 
                      onClick={() => alert("Simulated batch approval executing natively!")}
                      className="text-sm font-bold tracking-tight text-surface bg-primary-accent border border-primary-accent-dark/50 px-4 py-2 rounded-lg shadow-sm hover:shadow hover:bg-primary-accent-dark transition"
                    >
                        Approve Matrix Bounds
                    </button>
                    <button 
                      onClick={() => queryClient.invalidateQueries(['classifications'])}
                      className="flex items-center text-sm font-bold text-text-secondary bg-surface border border-border-light px-4 py-2 rounded-lg shadow-sm hover:bg-surface-hover transition"
                      disabled={isFetching}
                    >
                        <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-primary-accent' : ''}`} />
                    </button>
                </div>
            </div>

            {isError && (
                <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-xl text-error shadow-sm animate-in fade-in">
                   <h4 className="font-bold tracking-tight text-sm">Failed to Sync Taxonomies</h4>
                   <p className="text-sm mt-1">{error.message}</p>
                </div>
            )}

            <div className="bg-surface rounded-xl border border-border-light shadow-sm overflow-hidden flex flex-col min-h-150 bg-opacity-70 backdrop-filter backdrop-blur-sm">
                <ClassificationFilters currentFilters={filters} onFilterChange={handleFilterChange} />
                
                <ClassificationTable 
                   data={data?.data || []} 
                   isLoading={isLoading} 
                />

                <div className="p-4 border-t border-border-light flex items-center justify-between text-sm bg-surface-hover mt-auto">
                    <span className="text-text-secondary font-medium">
                        {data?.data?.length === 0 ? "Empty Analytical Bounds" : `Dataset Page ${data?.page || 1}`}
                        {data?.total > 0 && ` of ${Math.ceil(data.total / (data.limit || 20))} Blocks`}
                    </span>
                    <div className="flex space-x-2">
                        <button 
                           onClick={() => setPage(p => Math.max(1, p - 1))}
                           disabled={page === 1 || isLoading}
                           className="px-4 py-1.5 border border-border-light bg-surface hover:bg-surface-hover rounded-lg text-text-secondary disabled:opacity-50 font-bold shadow-sm"
                        >
                           Previous Drop
                        </button>
                        <button 
                           onClick={() => setPage(p => p + 1)}
                           disabled={!data || data.data.length < (data.limit || 20) || isLoading}
                           className="px-4 py-1.5 border border-border-light bg-surface hover:bg-surface-hover rounded-lg text-text-secondary disabled:opacity-50 font-bold shadow-sm"
                        >
                           Follow Drop
                        </button>
                    </div>
                </div>
            </div>
         </main>
      </div>
  );
}
