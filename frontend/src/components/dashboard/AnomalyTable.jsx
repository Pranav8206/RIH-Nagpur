"use client";
import React from 'react';
import { Eye, ShieldAlert, CheckCircle } from 'lucide-react';

export default function AnomalyTable({ data = [], isLoading }) {
  if (isLoading) {
    return (
      <div className="bg-surface rounded-xl border border-border-light overflow-hidden shadow-sm h-full">
        <div className="p-4 border-b border-border-light"><div className="h-5 bg-gray-200 rounded w-1/4 animate-pulse"></div></div>
        <div className="p-4 space-y-4">
           {[...Array(5)].map((_, i) => (
             <div key={i} className="h-12 bg-surface-hover rounded-lg animate-pulse w-full"></div>
           ))}
        </div>
      </div>
    );
  }

  const formatCurrency = (amt) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amt || 0);

  const getSeverityBadge = (severity) => {
    switch(severity) {
      case 'High': return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-error/20 text-red-800 border border-red-200 shadow-sm">High Risk</span>;
      case 'Medium': return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800 border border-orange-200 shadow-sm">Medium</span>;
      default: return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-yellow-50 text-yellow-800 border border-yellow-200 shadow-sm">Low</span>;
    }
  };

  return (
    <div className="bg-surface rounded-xl border border-border-light shadow-sm overflow-hidden flex flex-col h-full bg-opacity-70 bg-clip-padding backdrop-filter backdrop-blur-sm">
      <div className="p-5 border-b border-border-light flex justify-between items-center bg-gray-50/80">
        <h2 className="text-lg font-semibold text-text-primary tracking-tight">Top Anomalies Action Center</h2>
        <span className="text-xs font-medium text-text-secondary bg-surface px-2 py-1 rounded shadow-sm border border-border-light flex items-center">
            <ShieldAlert className="w-3 h-3 mr-1 text-error" />
            Requires Attention
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-surface-hover text-text-tertiary text-xs uppercase tracking-wider">
              <th className="px-6 py-4 font-medium border-b border-border-light">Vendor Identity</th>
              <th className="px-6 py-4 font-medium border-b border-border-light">Transaction</th>
              <th className="px-6 py-4 font-medium border-b border-border-light">Severity</th>
              <th className="px-6 py-4 font-medium border-b border-border-light">AI Classification</th>
              <th className="px-6 py-4 font-medium border-b border-border-light text-right">Recovery $</th>
              <th className="px-6 py-4 font-medium border-b border-border-light text-center">Execute Mapping</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.length === 0 ? (
               <tr><td colSpan="6" className="text-center py-10 text-text-tertiary font-medium tracking-wide">No unresolved anomalies currently flag DB matrix.</td></tr>
            ) : (
               data.map((row, idx) => (
                 <tr key={idx} className="hover:bg-blue-50/40 transition-colors group">
                   <td className="px-6 py-4">
                     <div className="font-semibold text-text-primary">{row.transaction?.vendor_name || 'System User'}</div>
                     <div className="text-xs text-text-tertiary mt-0.5">{row.transaction?.category || 'Uncategorized Expense'}</div>
                   </td>
                   <td className="px-6 py-4 text-text-secondary font-semibold">{formatCurrency(row.transaction?.amount)}</td>
                   <td className="px-6 py-4">{getSeverityBadge(row.anomaly?.severity || 'Low')}</td>
                   <td className="px-6 py-4 text-sm font-medium text-text-secondary w-48 truncate">{row.classification?.leakage_type || 'Unclassified Pattern'}</td>
                   <td className="px-6 py-4 text-right font-bold text-primary-accent border-l border-gray-50/50">{formatCurrency(row.recovery_potential)}</td>
                   <td className="px-6 py-4 text-center border-l border-gray-50/50">
                      <div className="flex items-center justify-center space-x-2">
                        {row.recommendation ? (
                          <button className="flex items-center text-xs font-semibold bg-primary-accent-light/30 text-primary-accent-dark px-3 py-1.5 rounded-lg border border-primary-accent-light hover:bg-emerald-100 transition shadow-sm w-full justify-center">
                            <CheckCircle className="w-3.5 h-3.5 mr-1" /> Verify
                          </button>
                        ) : row.classification ? (
                           <button className="text-xs font-medium text-white bg-primary-accent px-3 py-1.5 rounded-lg hover:bg-blue-700 transition shadow-sm w-full">
                             Build Action
                           </button>
                        ) : (
                          <button className="text-xs font-medium text-text-secondary bg-surface px-3 py-1.5 rounded-lg hover:bg-gray-50 transition border border-gray-300 shadow-sm w-full">
                            Classify
                          </button>
                        )}
                      </div>
                   </td>
                 </tr>
               ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
