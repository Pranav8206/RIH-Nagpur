"use client";

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { ShieldCheck, RefreshCw } from 'lucide-react';

import RecommendationTable from '@/components/recommendations/RecommendationTable';
import RecommendationFilters from '@/components/recommendations/RecommendationFilters';

const fetchRecommendations = async ({ queryKey }) => {
   const [_key, filters, page] = queryKey;
   const params = new URLSearchParams();
   
   if (page) params.append('page', page);
   params.append('limit', '20');
   if (filters.status) params.append('status', filters.status);
   if (filters.priority) params.append('priority', filters.priority);
   
   const { data } = await axios.get(`http://localhost:5000/api/recommendations?${params.toString()}`);
   return data;
};

export default function RecommendationsListPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ status: '', priority: '' });
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ['recommendations', filters, page],
    queryFn: fetchRecommendations,
    keepPreviousData: true, 
  });

  const handleFilterChange = (newFilters) => {
     setFilters({ ...filters, ...newFilters });
     setPage(1); 
  };

  return (
      <div className="min-h-[calc(100vh-64px)] bg-[#F8FAFC] pb-12 selection:bg-emerald-100 font-sans">
         <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                   <h1 className="text-2xl font-bold tracking-tight text-slate-800 flex items-center">
                     <ShieldCheck className="w-6 h-6 mr-2 text-emerald-600" />
                     Action Modules Configuration Limit
                   </h1>
                   <p className="text-sm text-gray-500 mt-1 tracking-wide font-medium">Execute generated Action setups securely tracking analytical mappings properly directly via nested array checks.</p>
                </div>
                <div className="flex space-x-3">
                    <button 
                      onClick={() => alert("Batch execution pushing mapped API limits natively!")}
                      className="text-sm font-bold tracking-tight text-white bg-emerald-600 border border-emerald-700/50 px-4 py-2 rounded-lg shadow-sm hover:shadow hover:bg-emerald-700 transition"
                    >
                        Execute Active Nodes Layouts
                    </button>
                    <button 
                      onClick={() => queryClient.invalidateQueries(['recommendations'])}
                      className="flex items-center text-sm font-bold text-gray-600 bg-white border border-gray-200 px-4 py-2 rounded-lg shadow-sm hover:bg-gray-50 transition"
                      disabled={isFetching}
                    >
                        <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-emerald-500' : ''}`} />
                    </button>
                </div>
            </div>

            {isError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 shadow-sm animate-in fade-in">
                   <h4 className="font-bold tracking-tight text-sm">Action Arrays Missing Limit Error Map</h4>
                   <p className="text-sm mt-1">{error.message}</p>
                </div>
            )}

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col min-h-[600px] bg-opacity-70 backdrop-filter backdrop-blur-sm">
                <RecommendationFilters currentFilters={filters} onFilterChange={handleFilterChange} />
                
                <RecommendationTable 
                   data={data?.data || []} 
                   isLoading={isLoading} 
                />

                <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm bg-gray-50/50 mt-auto">
                    <span className="text-gray-500 font-medium">
                        {data?.data?.length === 0 ? "Empty Execution Tree Layout Boundaries" : `Dataset Page ${data?.page || 1}`}
                        {data?.total > 0 && ` of ${Math.ceil(data.total / (data.limit || 20))} Records Mapping Payload Array`}
                    </span>
                    <div className="flex space-x-2">
                        <button 
                           onClick={() => setPage(p => Math.max(1, p - 1))}
                           disabled={page === 1 || isLoading}
                           className="px-4 py-1.5 border border-gray-200 bg-white hover:bg-gray-50 rounded-lg text-gray-700 disabled:opacity-50 font-bold shadow-sm"
                        >
                           Previous Check
                        </button>
                        <button 
                           onClick={() => setPage(p => p + 1)}
                           disabled={!data || data.data.length < (data.limit || 20) || isLoading}
                           className="px-4 py-1.5 border border-gray-200 bg-white hover:bg-gray-50 rounded-lg text-gray-700 disabled:opacity-50 font-bold shadow-sm"
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
