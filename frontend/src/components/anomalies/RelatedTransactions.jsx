"use client";
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Search, ExternalLink, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function RelatedTransactions({ vendor, currentTrxId }) {
    const { data, isLoading, isError } = useQuery({
       queryKey: ['related_transactions', vendor],
       queryFn: async () => {
           if(!vendor) return [];
           // Fetch bounded transaction arrays explicitly resolving similar outputs 
           const res = await axios.get(`http://localhost:5000/api/transactions?vendor_name=${encodeURIComponent(vendor)}&limit=5`);
           return res.data;
       },
       enabled: !!vendor
    });

    const formatCurrency = (amt) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amt || 0);

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col sticky top-24">
           <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-800 tracking-tight flex items-center">
                 <Search className="w-4 h-4 mr-2 text-blue-500" /> Vendor History
              </h3>
              <span className="text-xs font-semibold text-gray-500 px-2 py-0.5 rounded bg-white shadow-sm border border-gray-100 block max-w-[120px] truncate">{vendor || 'Unknown'}</span>
           </div>

           <div className="p-0">
               {isLoading ? (
                   <div className="p-6 space-y-3">
                       {[1,2,3].map(i => <div key={i} className="h-12 bg-gray-50 border border-gray-100 rounded-lg animate-pulse"></div>)}
                   </div>
               ) : isError ? (
                   <div className="p-6 text-center text-red-500 text-xs font-semibold flex items-center justify-center">
                       <AlertCircle className="w-4 h-4 mr-1.5" /> Failed mapping API arrays inherently.
                   </div>
               ) : !data?.data?.length ? (
                   <div className="p-8 text-center text-gray-400 text-sm font-medium tracking-wide">
                       No transactional relational maps found in DB.
                   </div>
               ) : (
                   <div className="divide-y divide-gray-100">
                       {data.data.filter(t => t._id !== currentTrxId).map((trx) => (
                           <div key={trx._id} className="p-4 hover:bg-gray-50 transition-colors flex justify-between items-center group cursor-pointer border-l-2 border-l-transparent hover:border-l-blue-400">
                               <div>
                                   <div className="text-sm font-bold font-mono tracking-tighter text-slate-800 group-hover:text-blue-700 transition">
                                       {formatCurrency(trx.amount)}
                                   </div>
                                   <div className="text-[11px] text-gray-500 mt-1 font-semibold tracking-widest uppercase">
                                       {new Date(trx.date).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})} <span className="opacity-50 mx-0.5">•</span> {trx.category}
                                   </div>
                               </div>
                               <div className="text-right flex flex-col items-end">
                                   <span className="inline-flex items-center text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-white shadow-sm px-1.5 py-0.5 rounded border border-gray-200">
                                       {trx.status}
                                   </span>
                                   <Link href="#" className="mt-1 text-blue-500 opacity-0 group-hover:opacity-100 transition p-1" title="View Full Extracted Document">
                                       <ExternalLink className="w-3.5 h-3.5" />
                                   </Link>
                               </div>
                           </div>
                       ))}
                       {data.data.length <= 1 && (
                            <div className="p-8 text-center text-gray-500 text-xs font-medium tracking-wide bg-gray-50/80 italic border-t border-gray-100">
                               Only the current core active node matrix exists exactly for this specific payload limit.
                           </div>
                       )}
                   </div>
               )}
           </div>
        </div>
    );
}
