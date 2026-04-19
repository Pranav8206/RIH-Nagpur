"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { RefreshCcw, AlertTriangle } from 'lucide-react';

import KPICard from '@/components/dashboard/KPICard';
import AnomalyTable from '@/components/dashboard/AnomalyTable';
import DepartmentChart from '@/components/dashboard/DepartmentChart';
import TimelineChart from '@/components/dashboard/TimelineChart';
import SidebarActions from '@/components/dashboard/SidebarActions';

export default function DashboardPage() {
   const [metrics, setMetrics] = useState(null);
   const [timeline, setTimeline] = useState([]);
   const [topAnomalies, setTopAnomalies] = useState([]);
   const [departmentData, setDepartmentData] = useState([]);
   
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState(null);
   const [processing, setProcessing] = useState(false);

   // Configure JWT abstraction natively mimicking enterprise states
   const axiosConfig = {
      // headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } // Enable upon Auth tie-in
   };

   // Standard payload fetcher aggregating endpoints concurrently
   const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
         // Resolve mappings bypassing waterfall blocking delays 
         const [metricsRes, timelineRes, topRes, deptRes] = await Promise.all([
             axios.get("http://localhost:5000/api/dashboard/metrics", axiosConfig).catch(() => ({ data: { data: {} } })),
             axios.get("http://localhost:5000/api/dashboard/timeline?period=month", axiosConfig).catch(() => ({ data: { data: { dates: [] } } })),
             axios.get("http://localhost:5000/api/dashboard/top-anomalies?limit=5", axiosConfig).catch(() => ({ data: { data: [] } })),
             axios.get("http://localhost:5000/api/dashboard/by-department", axiosConfig).catch(() => ({ data: { data: [] } }))
         ]);

         setMetrics(metricsRes.data.data);
         
         // Timeline endpoints return raw parallel arrays `dates: [], anomalies: []`.
         // Convert into Array of Objects [{ date, anomalies }] structurally required by Recharts
         const tData = timelineRes.data.data;
         if (tData && tData.dates) {
             const tFormatted = tData.dates.map((date, idx) => ({
                 dates: date,
                 total_spend: tData.total_spend[idx],
                 anomalies: tData.anomalies[idx],
                 recovered: tData.recovered[idx]
             }));
             setTimeline(tFormatted);
         }

         setTopAnomalies(topRes.data.data || []);
         setDepartmentData(deptRes.data.data || []);

      } catch (err) {
         console.error("Failed fetching dashboard data", err);
         setError("Connection to Analytics Core Refused. Ensure backend services are booting correctly locally.");
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
       fetchDashboardData();
   }, []);

   const handleRunDetection = async () => {
      setProcessing(true);
      try {
         await axios.post("http://localhost:5000/api/anomalies/detect", {}, axiosConfig);
         await fetchDashboardData(); 
      } catch (err) {
         alert("Detection ML engine failed to synchronize.");
      } finally {
         setProcessing(false);
      }
   };

   const handleRunClassification = async () => {
      setProcessing(true);
      try {
         await axios.post("http://localhost:5000/api/classifications/classify", {}, axiosConfig);
         await fetchDashboardData();
      } catch (err) {
         alert("Classification taxonomy matrix failed.");
      } finally {
         setProcessing(false);
      }
   };

   return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-12 font-sans selection:bg-blue-100">
          {/* Top Navbar */}
          <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm backdrop-blur-md bg-opacity-90">
             <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                   <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-md">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                   </div>
                   <h1 className="text-xl font-bold tracking-tight text-slate-800">
                      Expense <span className="text-blue-600">Guard</span>
                   </h1>
                </div>

                <div className="flex items-center space-x-5">
                   <button 
                      onClick={fetchDashboardData}
                      className="text-gray-400 hover:text-blue-600 transition-colors p-1"
                      title="Sync Dashboard"
                   >
                     <RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin text-blue-500' : ''}`} />
                   </button>
                   <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shadow-md cursor-pointer hover:shadow-lg transition-shadow border-2 border-white">
                      JD
                   </div>
                </div>
             </div>
          </header>

          <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-8">
             
             {/* Global Error Handle */}
             {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start text-red-700 shadow-sm animate-in fade-in slide-in-from-top-4">
                   <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
                   <div>
                     <h4 className="font-semibold text-sm">System Synchronization Error</h4>
                     <p className="text-sm mt-1 opacity-90">{error}</p>
                   </div>
                </div>
             )}

             {/* KPIs Matrix */}
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-8">
                 <KPICard 
                    title="Gross Transactions" 
                    value={metrics?.total_transactions?.toLocaleString() || "0"} 
                    isLoading={loading} 
                 />
                 <KPICard 
                    title="Corporate Spend" 
                    value={`$${((metrics?.total_spend || 0) / 1000).toFixed(1)}k`} 
                    trend={2.4} 
                    isPositiveTrend={false} 
                    isLoading={loading} 
                 />
                 <KPICard 
                    title="Active Anomalies" 
                    value={metrics?.anomalies_detected?.toLocaleString() || "0"} 
                    trend={12} 
                    isPositiveTrend={false} 
                    isLoading={loading} 
                 />
                 <KPICard 
                    title="Extracted Recovery Pool" 
                    value={`$${((metrics?.total_recovered + (metrics?.recovery_potential || 0)) || 0).toLocaleString()}`} 
                    isLoading={loading} 
                    hasAction={true} 
                    onActionClick={() => alert("Bulk execution pipeline triggered!")}
                 />
                 <KPICard 
                    title="Yield Rate" 
                    value={`${metrics?.recovery_rate || 0}%`} 
                    trend={5.1} 
                    isPositiveTrend={true} 
                    isLoading={loading} 
                 />
             </div>

             {/* Center Heavy Elements */}
             <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
                {/* Main Action Table */}
                <div className="lg:col-span-9 h-[500px]"> 
                   <AnomalyTable data={topAnomalies} isLoading={loading} />
                </div>
                {/* Workflow Actions Segment */}
                <div className="lg:col-span-3">
                   <SidebarActions 
                      onRunDetection={handleRunDetection} 
                      onRunClassification={handleRunClassification}
                      isProcessing={processing}
                   />
                </div>
             </div>

             {/* Analytical Splits */}
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
                <TimelineChart data={timeline} isLoading={loading} />
                <DepartmentChart data={departmentData} isLoading={loading} />
             </div>

          </main>
      </div>
   );
}
