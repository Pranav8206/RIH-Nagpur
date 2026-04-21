"use client";

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import AnomalyTable from '@/components/anomalies/AnomalyTable';
import AnomalyFilters from '@/components/anomalies/AnomalyFilters';
import BulkActions from '@/components/anomalies/BulkActions';
import { ShieldAlert, RefreshCw, AlertTriangle } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';

export default function AnomaliesListPage() {
  const queryClient = useQueryClient();
    const { axiosInstance } = useAppContext();
  const [filters, setFilters] = useState({ status: '', severity: '', vendor: '' });
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ['anomalies', filters, page],
        queryFn: async ({ queryKey }) => {
            const [_key, currentFilters, currentPage] = queryKey;
            const params = new URLSearchParams();

            if (currentPage) params.append('page', currentPage);
            params.append('limit', '20');
            if (currentFilters.status) params.append('status', currentFilters.status);
            if (currentFilters.severity) params.append('severity', currentFilters.severity);

            const { data } = await axiosInstance.get(`/anomalies?${params.toString()}`);
            return data;
        },
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
              axiosInstance.patch(`/anomalies/${id}`, { status: actionStatus })
          );
          await Promise.all(promises);
          queryClient.invalidateQueries(['anomalies']);
          setSelectedIds([]);
      } catch(err) {
          alert("Failed to process bulk edit"); 
      }
  };

  const handleSyncAnomalies = async () => {
      try {
          await axiosInstance.post('/anomalies/detect', {});
      } finally {
          queryClient.invalidateQueries(['anomalies']);
      }
  };

  return (
      <div className="min-h-[calc(100vh-64px)] bg-transparent pb-12 selection:bg-primary-accent-light/50 font-sans">
         <main className="max-w-400 mx-auto px-4 sm:px-6 lg:px-8 pt-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                   <h1 className="text-2xl font-bold tracking-tight text-text-primary flex items-center">
                     <ShieldAlert className="w-6 h-6 mr-2 text-primary-accent" />
                     Anomaly Detection Center
                   </h1>
                   <p className="text-sm text-text-secondary mt-1">Review flagged algorithmic multi-layer transactions instantly.</p>
                </div>
                <button 
                                    onClick={handleSyncAnomalies}
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

            {!isLoading && !isError && (data?.data?.length || 0) === 0 && (
                <div className="mb-6 p-5 rounded-xl border border-amber-200 bg-amber-50 text-amber-900 shadow-sm flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 mt-0.5 text-amber-600 shrink-0" />
                    <div className="flex-1">
                        <h4 className="font-semibold text-sm">No anomalies are cached yet</h4>
                        <p className="text-sm mt-1 text-amber-800">
                            This page now auto-scans your imported transactions on first load, but if nothing unusual is found you can run detection again with the refresh button.
                        </p>
                    </div>
                </div>
            )}

            <div className="bg-surface rounded-xl border border-border-light shadow-sm overflow-hidden flex flex-col min-h-150 bg-opacity-70 backdrop-filter backdrop-blur-sm">
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
