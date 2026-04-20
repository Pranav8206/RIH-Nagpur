"use client";
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Calendar } from 'lucide-react';

export default function TimelineChart({ data = [], isLoading }) {
   if (isLoading) {
        return (
          <div className="bg-surface p-5 rounded-xl border border-border-light shadow-sm h-100 flex items-center justify-center">
             <div className="animate-pulse w-full px-8 flex items-end space-x-2 h-48">
               {[...Array(12)].map((_, i) => (
                 <div key={i} className="flex-1 bg-surface-hover rounded-t border border-border-light border-b-0" style={{ height: `${Math.max(20, Math.random() * 100)}%` }}></div>
               ))}
             </div>
          </div>
        );
   }

   const formatCurrency = (val) => ` ₹${(val / 1000).toFixed(0)}k`;

   return (
    <div className="bg-surface p-6 rounded-xl border border-border-light shadow-sm h-100 min-h-100 min-w-0 flex flex-col overflow-hidden">
           <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-text-primary tracking-tight">Timeline Mapping</h3>
              <div className="relative">
                 <select className="appearance-none pl-8 pr-8 py-1.5 text-xs font-medium border border-border-light rounded-lg text-text-secondary bg-surface-hover hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-100 outline-none cursor-pointer">
                     <option>Last 30 Days</option>
                     <option>Last Quarter</option>
                     <option>Year to Date</option>
                 </select>
                 <Calendar className="w-3.5 h-3.5 text-text-tertiary absolute left-2.5 top-2 pointer-events-none" />
              </div>
           </div>
           
           <div className="min-h-0 min-w-0 flex-1">
           <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
               <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                   <XAxis dataKey="dates" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} dy={12} />
                   <YAxis tickFormatter={formatCurrency} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} dx={-10} />
                   <Tooltip 
                       contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', backgroundColor: 'rgba(255, 255, 255, 0.98)' }}
                       formatter={(val, name) => {
                           if(name === 'total_spend') return [` ₹${val.toLocaleString()}`, 'Total Volume'];
                           if(name === 'anomalies') return [val, 'Anomalies Hit'];
                           if(name === 'recovered') return [` ₹${val.toLocaleString()}`, 'Recovered Volume'];
                           return [val, name];
                       }}
                   />
                   <Legend iconType="circle" wrapperStyle={{ fontSize: '13px', paddingTop: '20px', color: '#6b7280' }} />
                   
                   {/* Gradient Fill def */}
                   <defs>
                      <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                         <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                   </defs>

                   <Line type="monotone" dataKey="total_spend" name="Total Spend" stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{ r: 6, strokeWidth: 0, fill: '#2563eb' }} color="url(#colorSpend)" />
                   <Line type="monotone" dataKey="recovered" name="Recovered" stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 5, fill: '#059669' }} />
               </LineChart>
           </ResponsiveContainer>
           </div>
       </div>
   );
}
