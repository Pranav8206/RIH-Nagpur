"use client";
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function DepartmentChart({ data = [], isLoading }) {
    if (isLoading) {
        return (
          <div className="bg-surface p-5 rounded-xl border border-border-light shadow-sm h-100 flex items-center justify-center">
            <div className="animate-pulse space-y-4 w-full px-8">
               <div className="h-4 bg-gray-200 rounded w-1/4 mb-8"></div>
               {[...Array(5)].map((_, i) => (
                 <div key={i} className="h-8 bg-surface-hover rounded w-full border border-border-light"></div>
               ))}
            </div>
          </div>
        );
    }

    const formatCurrency = (val) => `$${(val / 1000).toFixed(1)}k`;

    return (
        <div className="bg-surface p-6 rounded-xl border border-border-light shadow-sm h-100 min-h-100 min-w-0 flex flex-col overflow-hidden">
            <h3 className="text-lg font-semibold text-text-primary mb-6 tracking-tight">Internal Department Spend vs Risk</h3>
          <div className="min-h-0 min-w-0 flex-1">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
               <BarChart data={data} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                  <XAxis type="number" tickFormatter={formatCurrency} stroke="#9CA3AF" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="department" type="category" width={90} tick={{ fontSize: 13, fill: '#374151', fontWeight: 500 }} axisLine={false} tickLine={false} />
                  <Tooltip 
                     formatter={(value, name) => [`$${value.toLocaleString()}`, name.replace('_', ' ')]}
                     contentStyle={{ borderRadius: '12px', border: '1px solid #f3f4f6', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', backgroundColor: 'rgba(255, 255, 255, 0.95)' }}
                     cursor={{ fill: '#f8fafc' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '13px', paddingTop: '15px', color: '#6B7280' }} />
                  <Bar dataKey="total_spend" name="Total Spend" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={14} />
                  <Bar dataKey="recovery_potential" name="Recovery Potential" fill="#10b981" radius={[0, 4, 4, 0]} barSize={14} />
               </BarChart>
            </ResponsiveContainer>
                </div>
        </div>
    );
}
