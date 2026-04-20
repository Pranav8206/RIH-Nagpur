"use client";

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import AnomalyTable from '@/components/anomalies/AnomalyTable';
import AnomalyFilters from '@/components/anomalies/AnomalyFilters';
import BulkActions from '@/components/anomalies/BulkActions';
import { ShieldAlert, RefreshCw } from 'lucide-react';

const fetchAnomalies = async ({ queryKey }) => {
   const [_key, filters, page] = queryKey;
   const params = new URLSearchParams();
   
   if (page) params.append('page', page);
   params.append('limit', '20');
   if (filters.status) params.append('status', filters.status);
   if (filters.severity) params.append('severity', filters.severity);
   
   const { data } = await axios.get(`http://localhost:5000/api/anomalies?${params.toString()}`);
   return data;
};

export default function AnomaliesListPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ status: '', severity: '', vendor: '' });
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ['anomalies', filters, page],
    queryFn: fetchAnomalies,
    keepPreviousData: true, 
  });

  const handleFilterChange = (newFilters) => {
     setFilters({ ...filters, ...newFilters });
     setPage(1); 
     setSelectedIds([]); 
  };

  const handleBulkAction = async (actionStatus) => {
      if(selectedIds.length === 0) return;
      try {
          const promises = selectedIds.map(id => 
              axios.patch(`http://localhost:5000/api/anomalies/${id}`, { status: actionStatus })
          );
          await Promise.all(promises);
          queryClient.invalidateQueries(['anomalies']);
          setSelectedIds([]);
      } catch(err) {
          alert("Failed to process bulk edit"); 
      }
  };

  return (
      <div className="min-h-[calc(100vh-64px)] bg-transparent pb-12 selection:bg-primary-accent-light/50 font-sans">
         <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                   <h1 className="text-2xl font-bold tracking-tight text-text-primary flex items-center">
                     <ShieldAlert className="w-6 h-6 mr-2 text-primary-accent" />
                     Anomaly Detection Center
                   </h1>
                   <p className="text-sm text-text-secondary mt-1">Review flagged algorithmic multi-layer transactions instantly.</p>
                </div>
                <button 
                  onClick={() => queryClient.invalidateQueries(['anomalies'])}
                  className="flex items-center text-sm font-medium text-text-secondary bg-surface border border-border-light px-4 py-2 rounded-lg shadow-sm hover:bg-surface-hover transition"
                  disabled={isFetching}
                >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin text-primary-accent' : ''}`} /> Sync Database Arrays
                </button>
            </div>

            {isError && (
                <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-xl text-error shadow-sm animate-in fade-in">
                   <h4 className="font-semibold text-sm">Failed to Sync Data limits</h4>
                   <p className="text-sm mt-1">{error.message}</p>
                </div>
            )}

            <div className="bg-surface rounded-xl border border-border-light shadow-sm overflow-hidden flex flex-col min-h-[600px] bg-opacity-70 backdrop-filter backdrop-blur-sm">
                
                <AnomalyFilters currentFilters={filters} onFilterChange={handleFilterChange} />
                
                {selectedIds.length > 0 && (
                    <BulkActions 
                       selectedCount={selectedIds.length} 
                       onActionTrigger={handleBulkAction} 
                       onClear={() => setSelectedIds([])}
                    />
                )}

                <AnomalyTable 
                   data={data?.data || []} 
                   isLoading={isLoading} 
                   selectedIds={selectedIds}
                   onSelectToggle={(id) => {
                       setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
                   }}
                   onSelectAll={(allIds) => setSelectedIds(allIds)}
                />

                <div className="p-4 border-t border-border-light flex items-center justify-between text-sm bg-surface-hover mt-auto">
                    <span className="text-text-secondary font-medium">
                        {data?.data?.length === 0 ? "Showing 0 algorithmic limits" : `Showing Page ${data?.page || 1}`}
                        {data?.total > 0 && ` of ${Math.ceil(data.total / (data.limit || 20))} Arrays`}
                    </span>
                    <div className="flex space-x-2">
                        <button 
                           onClick={() => setPage(p => Math.max(1, p - 1))}
                           disabled={page === 1 || isLoading}
                           className="px-4 py-1.5 border border-border-light bg-surface hover:bg-surface-hover rounded-lg text-text-secondary disabled:opacity-50 transition-colors shadow-sm font-semibold"
                        >
                           Previous Segment
                        </button>
                        <button 
                           onClick={() => setPage(p => p + 1)}
                           disabled={!data || data.data.length < (data.limit || 20) || isLoading}
                           className="px-4 py-1.5 border border-border-light bg-surface hover:bg-surface-hover rounded-lg text-text-secondary disabled:opacity-50 transition-colors shadow-sm font-semibold"
                        >
                           Follow Segment
                        </button>
                    </div>
                </div>
            </div>
         </main>
      </div>
  );
}
