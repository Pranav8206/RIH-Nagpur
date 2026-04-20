"use client";

import React, { useState, useEffect } from "react";
import { RefreshCcw, AlertTriangle } from "lucide-react";
import { useAppContext } from "@/context/AppContext";

import KPICard from "@/components/dashboard/KPICard";
import AnomalyTable from "@/components/dashboard/AnomalyTable";
import DepartmentChart from "@/components/dashboard/DepartmentChart";
import TimelineChart from "@/components/dashboard/TimelineChart";
import SidebarActions from "@/components/dashboard/SidebarActions";

export default function DashboardPage() {
  const { axiosInstance } = useAppContext();
  const [metrics, setMetrics] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [topAnomalies, setTopAnomalies] = useState([]);
  const [departmentData, setDepartmentData] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);

  // Standard payload fetcher aggregating endpoints concurrently
  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Resolve mappings bypassing waterfall blocking delays
      const [metricsRes, timelineRes, topRes, deptRes] = await Promise.all([
        axiosInstance
          .get("/dashboard/metrics")
          .catch(() => ({ data: { data: {} } })),
        axiosInstance
          .get("/dashboard/timeline?period=month")
          .catch(() => ({ data: { data: { dates: [] } } })),
        axiosInstance
          .get("/dashboard/top-anomalies?limit=5")
          .catch(() => ({ data: { data: [] } })),
        axiosInstance
          .get("/dashboard/by-department")
          .catch(() => ({ data: { data: [] } })),
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
          recovered: tData.recovered[idx],
        }));
        setTimeline(tFormatted);
      }

      setTopAnomalies(topRes.data.data || []);
      setDepartmentData(deptRes.data.data || []);
    } catch (err) {
      console.error("Failed fetching dashboard data", err);
      setError(
        "Connection to Analytics Core Refused. Ensure backend services are booting correctly locally.",
      );
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
      await axiosInstance.post("/anomalies/detect", {});
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
      await axiosInstance.post("/classifications/classify", {});
      await fetchDashboardData();
    } catch (err) {
      alert("Classification taxonomy matrix failed.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-text-primary pb-12 font-sans selection:bg-primary-accent-light/50">
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 pt-6 max-w-400 mx-auto mb-2">
        <h2 className="text-2xl font-bold text-text-primary">
          Dashboard Overview
        </h2>
        <div className="flex items-center space-x-5">
          <button
            onClick={fetchDashboardData}
            className="flex items-center gap-2 text-sm font-medium text-text-secondary bg-surface border border-border-light px-4 py-2 rounded-lg shadow-sm hover:bg-surface-hover transition"
            title="Sync Dashboard"
          >
            <RefreshCcw
              className={`w-4 h-4 ${loading ? "animate-spin text-primary-accent" : ""}`}
            />
            <span className="hidden sm:inline">Sync Data</span>
          </button>
          <div className="h-9 w-9 rounded-full bg-linear-to-tr from-primary-accent to-secondary-accent flex items-center justify-center text-surface text-sm font-bold shadow-md cursor-pointer hover:shadow-lg transition-shadow border-2 border-surface">
            JD
          </div>
        </div>
      </div>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Global Error Handle */}
        {error && (
          <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-xl flex items-start text-error shadow-sm animate-in fade-in slide-in-from-top-4">
            <AlertTriangle className="w-5 h-5 mr-3 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm">
                System Synchronization Error
              </h4>
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
            value={`$${(metrics?.total_recovered + (metrics?.recovery_potential || 0) || 0).toLocaleString()}`}
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
          <div className="lg:col-span-9 h-125">
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
