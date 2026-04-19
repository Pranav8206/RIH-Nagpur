"use client";

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Network, RefreshCw } from 'lucide-react';

import ClassificationTable from '@/components/classifications/ClassificationTable';
import ClassificationFilters from '@/components/classifications/ClassificationFilters';

const fetchClassifications = async ({ queryKey }) => {
   const [_key, filters, page] = queryKey;
   const params = new URLSearchParams();
   
   if (page) params.append('page', page);
   params.append('limit', '20');
   if (filters.leakage_type) params.append('leakage_type', filters.leakage_type);
   if (filters.impact_level) params.append('impact_level', filters.impact_level);
   
   const { data } = await axios.get(`http://localhost:5000/api/classifications?${params.toString()}`);
   return data;
};

export default function ClassificationsListPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ leakage_type: '', impact_level: '' });
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ['classifications', filters, page],
    queryFn: fetchClassifications,
    keepPreviousData: true, 
  });

  const handleFilterChange = (newFilters) => {
     setFilters({ ...filters, ...newFilters });
     setPage(1); 
  };

  return (
      <div className="min-h-[calc(100vh-64px)] bg-[#F8FAFC] pb-12 selection:bg-indigo-100 font-sans">
         <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                   <h1 className="text-2xl font-bold tracking-tight text-slate-800 flex items-center">
                     <Network className="w-6 h-6 mr-2 text-indigo-600" />
                     Classification Model Taxonomies
                   </h1>
                   <p className="text-sm text-gray-500 mt-1 tracking-wide font-medium">Review algorithmic output hooks defining structural leakage mapping vectors locally.</p>
                </div>
                <div className="flex space-x-3">
                    <button 
                      onClick={() => alert("Simulated batch approval executing natively!")}
                      className="text-sm font-bold tracking-tight text-white bg-indigo-600 border border-indigo-700/50 px-4 py-2 rounded-lg shadow-sm hover:shadow hover:bg-indigo-700 transition"
                    >
                        Approve Matrix Bounds
                    </button>
                    <button 
                      onClick={() => queryClient.invalidateQueries(['classifications'])}
                      className="flex items-center text-sm font-bold text-gray-600 bg-white border border-gray-200 px-4 py-2 rounded-lg shadow-sm hover:bg-gray-50 transition"
                      disabled={isFetching}
                    >
                        <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-indigo-500' : ''}`} />
                    </button>
                </div>
            </div>

            {isError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 shadow-sm animate-in fade-in">
                   <h4 className="font-bold tracking-tight text-sm">Failed to Sync Taxonomies</h4>
                   <p className="text-sm mt-1">{error.message}</p>
                </div>
            )}

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col min-h-[600px] bg-opacity-70 backdrop-filter backdrop-blur-sm">
                <ClassificationFilters currentFilters={filters} onFilterChange={handleFilterChange} />
                
                <ClassificationTable 
                   data={data?.data || []} 
                   isLoading={isLoading} 
                />

                <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm bg-gray-50/50 mt-auto">
                    <span className="text-gray-500 font-medium">
                        {data?.data?.length === 0 ? "Empty Analytical Bounds" : `Dataset Page ${data?.page || 1}`}
                        {data?.total > 0 && ` of ${Math.ceil(data.total / (data.limit || 20))} Blocks`}
                    </span>
                    <div className="flex space-x-2">
                        <button 
                           onClick={() => setPage(p => Math.max(1, p - 1))}
                           disabled={page === 1 || isLoading}
                           className="px-4 py-1.5 border border-gray-200 bg-white hover:bg-gray-50 rounded-lg text-gray-700 disabled:opacity-50 font-bold shadow-sm"
                        >
                           Previous Drop
                        </button>
                        <button 
                           onClick={() => setPage(p => p + 1)}
                           disabled={!data || data.data.length < (data.limit || 20) || isLoading}
                           className="px-4 py-1.5 border border-gray-200 bg-white hover:bg-gray-50 rounded-lg text-gray-700 disabled:opacity-50 font-bold shadow-sm"
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
