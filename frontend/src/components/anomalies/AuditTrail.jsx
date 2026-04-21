"use client";
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Clock, User, ArrowRight } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';

export default function AuditTrail({ entityId }) {
    const { axiosInstance } = useAppContext();

    const { data, isLoading } = useQuery({
       queryKey: ['audit_logs', entityId],
       queryFn: async () => {
           if (!entityId) return [];

           const { data } = await axiosInstance.get(`/anomalies/${entityId}`);
           const payload = data?.data;
           if (!payload) return [];

           const events = [];

           if (payload.transaction) {
               events.push({
                   _id: `transaction-${payload.transaction._id}`,
                   action: 'Transaction Imported',
                   performed_by: payload.transaction.vendor_name || 'Imported transaction',
                   timestamp: payload.transaction.created_at || payload.transaction.date || new Date().toISOString(),
                   details: {
                       reason: `Amount ${payload.transaction.amount || 0} recorded from import.`
                   }
               });
           }

           if (payload.anomaly) {
               events.push({
                   _id: `anomaly-${payload.anomaly._id}`,
                   action: 'Anomaly Detected',
                   performed_by: 'Anomaly detector',
                   timestamp: payload.anomaly.detected_at || payload.anomaly.created_at || new Date().toISOString(),
                   details: {
                       reason: payload.anomaly.reason_description || payload.anomaly.detection_method || 'Flagged from transaction data.'
                   }
               });
           }

           const recommendation = payload.recommendations?.[0];
           if (recommendation) {
               events.push({
                   _id: `recommendation-${recommendation._id}`,
                   action: 'Recommendation Created',
                   performed_by: 'Recommendation engine',
                   timestamp: recommendation.created_at || new Date().toISOString(),
                   details: {
                       reason: recommendation.action_description || recommendation.recommendation_type || 'Generated from anomaly output.'
                   }
               });
           }

           return events.sort((left, right) => new Date(left.timestamp) - new Date(right.timestamp));
       }
    });

    return (
        <div className="bg-surface rounded-xl border border-border-light shadow-sm overflow-hidden">
           <div className="px-6 py-4 border-b border-border-light bg-surface-hover flex flex-col justify-center">
              <h3 className="text-sm font-bold text-text-primary tracking-tight flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-primary-accent" /> Audit Pipeline Event Map
              </h3>
           </div>
           
           <div className="p-6">
               {isLoading ? (
                   <div className="space-y-4">
                       <div className="h-10 bg-surface-hover rounded animate-pulse"></div>
                       <div className="h-10 bg-surface-hover rounded animate-pulse ml-4 border-l-2 border-primary-accent-light"></div>
                   </div>
               ) : (
                   <div className="relative border-l-2 border-border-light ml-3 space-y-6">
                       {data?.map((log) => (
                           <div key={log._id} className="relative pl-6">
                               <div className="absolute w-4 h-4 bg-surface border-[3px] border-blue-400 rounded-full -left-2.25 top-0 shadow-sm"></div>
                               <div className="flex justify-between items-start mb-1">
                                    <h4 className="text-sm font-bold text-text-primary tracking-tight">{log.action}</h4>
                                    <span className="text-[10px] uppercase font-bold text-text-tertiary tracking-widest">{new Date(log.timestamp).toLocaleString(undefined, {hour:'numeric', minute:'2-digit', month:'short', day:'numeric'})}</span>
                               </div>
                               <div className="flex items-center text-[11px] font-bold tracking-widest uppercase text-text-tertiary mb-2">
                                    <User className="w-3 h-3 mr-1 opacity-70" /> {log.performed_by || 'System Core Integration'}
                               </div>
                               {log.details && Object.keys(log.details).length > 0 && (
                                   <div className="text-xs text-text-secondary bg-gray-50/80 border border-border-light p-3 rounded-lg shadow-inner inline-block mt-1 font-medium tracking-wide">
                                       {log.details.to ? (
                                           <div className="flex items-center space-x-2 font-mono font-bold text-[11px]">
                                              <span className="line-through opacity-70 text-text-tertiary">{log.details.from}</span>
                                              <ArrowRight className="w-3 h-3 text-blue-400" />
                                              <span className="text-primary-accent bg-primary-accent-light/30 px-1.5 py-0.5 rounded border border-blue-100">{log.details.to}</span>
                                           </div>
                                       ) : (
                                           <span>{log.details.reason || JSON.stringify(log.details)}</span>
                                       )}
                                   </div>
                               )}
                           </div>
                       ))}
                   </div>
               )}
           </div>
        </div>
    );
}
