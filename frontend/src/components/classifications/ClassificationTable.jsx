"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import { Eye, ShieldAlert } from 'lucide-react';
import LoadingSkeleton from '../shared/LoadingSkeleton';
import EmptyState from '../shared/EmptyState';
import PriorityBadge from '../shared/PriorityBadge';

export default function ClassificationTable({ data = [], isLoading }) {
  const router = useRouter();

  if (isLoading) return <LoadingSkeleton type="table" rows={8} />;
  
  if (!data || data.length === 0) {
      return <EmptyState message="No classifications mapped via DB currently." icon={ShieldAlert} />;
  }

  const formatCurrency = (amt) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amt || 0);

  return (
    <div className="overflow-x-auto flex-1 min-h-[500px]">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-surface text-text-tertiary text-xs uppercase tracking-widest relative border-b border-border-light shadow-[0_1px_2px_rgba(0,0,0,0.03)] font-bold">
              <th className="px-5 py-4 whitespace-nowrap">ID Reference</th>
              <th className="px-5 py-4">Taxonomy Engine</th>
              <th className="px-5 py-4 text-center">Confidence Vector</th>
              <th className="px-5 py-4 hidden md:table-cell w-1/4">Root Mapping</th>
              <th className="px-5 py-4 text-right">Extracted Impact $</th>
              <th className="px-5 py-4 text-center">Risk Vector</th>
              <th className="px-5 py-4 text-right">Node Exec</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 bg-surface group-trigger">
               {data.map((row) => (
                 <tr 
                   key={row._id} 
                   className="transition-all cursor-pointer border-l-2 hover:bg-indigo-50/40 border-l-transparent hover:border-l-indigo-400"
                   onClick={() => router.push(`/classifications/${row._id}`)}
                 >
                   <td className="px-5 py-3.5 text-xs font-mono text-text-tertiary tracking-wider font-semibold">
                       #{row._id.slice(-6).toUpperCase()}
                   </td>
                   <td className="px-5 py-3.5">
                       <div className="font-bold text-text-primary truncate max-w-[200px]">{row.leakage_type}</div>
                   </td>
                   <td className="px-5 py-3.5">
                       <div className="flex items-center justify-center space-x-2">
                           <div className="w-16 h-1.5 bg-surface-hover rounded-full overflow-hidden shadow-inner">
                                <div className="h-full bg-primary-accent rounded-full" style={{width: `${row.confidence_score * 100}%`}}></div>
                           </div>
                           <span className="text-[11px] font-bold text-primary-accent font-mono tracking-tighter">{(row.confidence_score * 100).toFixed(0)}%</span>
                       </div>
                   </td>
                   <td className="px-5 py-3.5 text-text-tertiary text-[11px] font-medium tracking-wide hidden md:table-cell truncate max-w-[250px]">
                       {row.root_cause}
                   </td>
                   <td className="px-5 py-3.5 text-right font-bold text-primary-accent whitespace-nowrap tracking-tight">
                       {formatCurrency(row.estimated_recovery)}
                   </td>
                   <td className="px-5 py-3.5 text-center">
                       <PriorityBadge level={row.impact_level} />
                   </td>
                   <td className="px-5 py-3.5 text-right">
                       <button className="p-1.5 text-text-tertiary hover:text-indigo-600 hover:bg-white rounded-lg transition-all border border-transparent hover:border-indigo-200 hover:shadow-sm">
                           <Eye className="w-4 h-4" />
                       </button>
                   </td>
                 </tr>
               ))}
          </tbody>
        </table>
    </div>
  );
}
