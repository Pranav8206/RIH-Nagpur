"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import { Eye, Clock, ShieldAlert, CheckCircle, Activity } from 'lucide-react';

export default function AnomalyTable({ data = [], isLoading, selectedIds, onSelectToggle, onSelectAll }) {
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="flex-1 w-full bg-surface relative overflow-hidden">
        <div className="p-4 space-y-4">
           {[...Array(10)].map((_, i) => (
             <div key={i} className="h-[52px] bg-surface-hover rounded-lg animate-pulse w-full border border-border-light"></div>
           ))}
        </div>
      </div>
    );
  }

  const formatCurrency = (amt) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'INR' }).format(amt || 0);
  const formatDate = (dateStr) => dateStr ? new Date(dateStr).toLocaleDateString() : 'N/A';

  const getSeverityBadge = (severity) => {
    switch(severity) {
      case 'High': return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] uppercase tracking-wider font-bold bg-error/10 text-error border border-red-200"><div className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5 shadow-sm"></div>High</span>;
      case 'Medium': return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] uppercase tracking-wider font-bold bg-orange-50 text-orange-700 border border-orange-200"><div className="w-1.5 h-1.5 rounded-full bg-orange-500 mr-1.5 shadow-sm"></div>Medium</span>;
      default: return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] uppercase tracking-wider font-bold bg-primary-accent-light/30 text-primary-accent-dark border border-primary-accent-light"><div className="w-1.5 h-1.5 rounded-full bg-primary-accent mr-1.5 shadow-sm"></div>Low</span>;
    }
  };

  const currentIds = data.map(d => d._id);
  const isAllSelected = currentIds.length > 0 && currentIds.every(id => selectedIds.includes(id));

  return (
    <div className="overflow-x-auto flex-1 min-h-[500px]">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-surface text-text-tertiary text-xs uppercase tracking-widest relative border-b border-border-light shadow-[0_1px_2px_rgba(0,0,0,0.03)] font-bold">
              <th className="px-5 py-4 w-4">
                 <input 
                   type="checkbox" 
                   className="rounded border-gray-300 text-primary-accent focus:ring-blue-500 w-4 h-4 shadow-sm cursor-pointer"
                   checked={isAllSelected}
                   onChange={() => onSelectAll(isAllSelected ? [] : currentIds)}
                 />
              </th>
              <th className="px-5 py-4">Vendor</th>
              <th className="px-5 py-4 text-right">Amount</th>
              <th className="px-5 py-4 text-center">Date</th>
              <th className="px-5 py-4">Reason</th>
              <th className="px-5 py-4 text-center">Level</th>
              <th className="px-5 py-4 text-center hidden sm:table-cell">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 bg-surface group-trigger">
            {data.length === 0 ? (
               <tr>
                   <td colSpan="9" className="text-center py-24 text-text-tertiary">
                      <Activity className="w-8 h-8 mx-auto mb-3 opacity-20" />
                     <span className="font-medium tracking-wide">No flagged transactions match the current filters.</span>
                   </td>
               </tr>
            ) : (
               data.map((row) => (
                 <tr 
                   key={row._id} 
                   className={`transition-all cursor-pointer border-l-2 ${selectedIds.includes(row._id) ? 'bg-blue-50/60 border-l-blue-500' : 'hover:bg-gray-50/80 border-l-transparent'}`}
                   onClick={(e) => {
                       if(e.target.type !== 'checkbox' && e.target.tagName !== 'BUTTON') {
                            router.push(`/anomalies/${row._id}`);
                       }
                   }}
                 >
                   <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                       <input 
                         type="checkbox" 
                         className="rounded border-gray-300 text-primary-accent focus:ring-blue-500 w-4 h-4 cursor-pointer"
                         checked={selectedIds.includes(row._id)}
                         onChange={() => onSelectToggle(row._id)}
                       />
                   </td>
                   <td className="px-5 py-3.5">
                       <div className="font-semibold text-text-primary truncate max-w-[180px]">{row.transaction_summary?.vendor_name || 'System Auto'}</div>
                   </td>
                   
                   <td className="px-5 py-3.5 text-right font-bold text-text-secondary whitespace-nowrap tracking-tight">
                       {formatCurrency(row.transaction_summary?.amount)}
                   </td>
                   <td className="px-5 py-3.5 text-center text-text-tertiary whitespace-nowrap text-xs font-medium">
                       {formatDate(row.transaction_summary?.date)}
                   </td>
                   <td className="px-5 py-3.5 text-text-secondary font-medium">
                       <div className="max-w-[320px] truncate" title={row.reason_description || 'No reason available'}>
                         {row.reason_description || 'No reason available'}
                       </div>
                   </td>
                   <td className="px-5 py-3.5 text-center">
                       {getSeverityBadge(row.severity)}
                   </td>
                   <td className="px-5 py-3.5 text-center hidden sm:table-cell">
                       <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded border text-[11px] font-bold uppercase tracking-widest w-24
                           ${row.status === 'Resolved' ? 'bg-emerald-50/50 text-primary-accent-dark border-primary-accent-light' :
                             row.status === 'Reviewed' ? 'bg-blue-50/50 text-primary-accent-dark border-primary-accent-light' : 
                             'bg-surface-hover text-text-secondary border-border-light'
                           }`}>
                           {row.status === 'Resolved' ? <CheckCircle className="w-3 h-3 mr-1 opacity-70" /> : (row.status === 'Reviewed' ? <ShieldAlert className="w-3 h-3 mr-1 opacity-70" /> : <Clock className="w-3 h-3 mr-1 opacity-70" />)}
                           {row.status}
                       </span>
                   </td>
                 </tr>
               ))
            )}
          </tbody>
        </table>
    </div>
  );
}
