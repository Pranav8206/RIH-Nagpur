"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import { Eye, ShieldCheck } from 'lucide-react';
import LoadingSkeleton from '../shared/LoadingSkeleton';
import EmptyState from '../shared/EmptyState';
import PriorityBadge from '../shared/PriorityBadge';
import StatusBadge from '../shared/StatusBadge';

export default function RecommendationTable({ data = [], isLoading }) {
  const router = useRouter();

  if (isLoading) return <LoadingSkeleton type="table" rows={8} />;
  
  if (!data || data.length === 0) {
      return <EmptyState message="No execution nodes isolated or matching structure bounds natively." icon={ShieldCheck} />;
  }

  const formatCurrency = (amt) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amt || 0);

  return (
    <div className="overflow-x-auto flex-1 min-h-[500px]">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-white text-gray-400 text-xs uppercase tracking-widest relative border-b border-gray-100 shadow-[0_1px_2px_rgba(0,0,0,0.03)] font-bold">
              <th className="px-5 py-4 whitespace-nowrap hidden lg:table-cell">Template Ref</th>
              <th className="px-5 py-4">Executable Action Template Limit</th>
              <th className="px-5 py-4 text-center">Node Vector</th>
              <th className="px-5 py-4 hidden md:table-cell text-center">Status Lock</th>
              <th className="px-5 py-4 text-right">Yield Capacity $</th>
              <th className="px-5 py-4 text-right">View Object</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 bg-white">
               {data.map((row) => (
                 <tr 
                   key={row._id} 
                   className="transition-all cursor-pointer border-l-2 hover:bg-emerald-50/40 border-l-transparent hover:border-l-emerald-400"
                   onClick={() => router.push(`/recommendations/${row._id}`)}
                 >
                   <td className="px-5 py-3.5 text-xs font-mono text-gray-400 tracking-wider font-semibold hidden lg:table-cell">
                       #{row._id.slice(-6).toUpperCase()}
                   </td>
                   <td className="px-5 py-3.5">
                       <div className="font-bold text-gray-900 truncate max-w-[300px] mb-0.5">{row.action_description || 'Auto-Resolution Model'}</div>
                       <div className="text-[11px] text-gray-500 font-bold uppercase tracking-widest">{row.action_type || 'Internal Extraction'}</div>
                   </td>
                   <td className="px-5 py-3.5 text-center">
                       <PriorityBadge level={row.priority} />
                   </td>
                   <td className="px-5 py-3.5 text-center hidden md:table-cell">
                       <StatusBadge status={row.status} />
                   </td>
                   <td className="px-5 py-3.5 text-right font-bold text-emerald-600 whitespace-nowrap tracking-tight font-mono text-[15px]">
                       {formatCurrency(row.estimated_recovery)}
                   </td>
                   <td className="px-5 py-3.5 text-right">
                       <button className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-white rounded-lg transition-all border border-transparent hover:border-emerald-200 hover:shadow-sm">
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
