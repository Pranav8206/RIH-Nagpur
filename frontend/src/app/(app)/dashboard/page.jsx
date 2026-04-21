"use client";

import React, { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";
import {
  RefreshCcw,
  TrendingUp,
  TriangleAlert,
  Lightbulb,
  RotateCw,
  IndianRupee,
  ShieldAlert,
} from "lucide-react";
import { useAppContext } from "@/context/AppContext";

const PIE_COLORS = ["#3f6212", "#16a34a", "#a16207", "#84cc16"];

const formatCurrency = (value = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);

const compactNumber = (value = 0) =>
  new Intl.NumberFormat("en-IN", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value || 0);

const toShortDate = (value) => {
  if (!value) return "-";

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
    }
  }

  if (/^\d{4}-\d{2}$/.test(value)) {
    const [year, month] = value.split("-");
    const parsed = new Date(Number(year), Number(month) - 1, 1);
    return parsed.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
  }

  return value;
};

export default function DashboardPage() {
  const { axiosInstance, user } = useAppContext();
  const [metrics, setMetrics] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [topAnomalies, setTopAnomalies] = useState([]);
  const [departmentData, setDepartmentData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [metricsRes, timelineRes, topRes, deptRes] = await Promise.allSettled([
        axiosInstance.get("/dashboard/metrics?refresh=true"),
        axiosInstance.get("/dashboard/timeline?period=day"),
        axiosInstance.get("/dashboard/top-anomalies?limit=6"),
        axiosInstance.get("/dashboard/by-department"),
      ]);

      const metricsData = metricsRes.status === "fulfilled" ? (metricsRes.value?.data?.data || {}) : {};
      const timelineData = timelineRes.status === "fulfilled"
        ? (timelineRes.value?.data?.data || { dates: [], total_spend: [], anomalies: [], recovered: [] })
        : { dates: [], total_spend: [], anomalies: [], recovered: [] };
      const topData = topRes.status === "fulfilled" ? (topRes.value?.data?.data || []) : [];
      const deptData = deptRes.status === "fulfilled" ? (deptRes.value?.data?.data || []) : [];

      setMetrics(metricsData);

      const tData = timelineData;
      const tDates = Array.isArray(tData?.dates) ? tData.dates : [];
      const tSpend = Array.isArray(tData?.total_spend) ? tData.total_spend : [];
      const tAnomalies = Array.isArray(tData?.anomalies) ? tData.anomalies : [];

      const formattedTimeline = tDates.map((date, idx) => ({
        dates: date,
        total_spend: tSpend[idx] || 0,
        anomalies: tAnomalies[idx] || 0,
      }));

      setTimeline(formattedTimeline);
      setTopAnomalies(topData);
      setDepartmentData(deptData);

      if (
        metricsRes.status === "rejected" ||
        timelineRes.status === "rejected" ||
        topRes.status === "rejected" ||
        deptRes.status === "rejected"
      ) {
        setError("Some dashboard data sources failed to load. Showing available live data.");
      }
    } catch {
      setError("Could not load dashboard analytics. Please check backend connectivity and try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const totalSpend = metrics?.total_spend || 0;
  const potentialSavings = metrics?.recovery_potential || 0;
  const unusualTransactions = metrics?.anomalies_detected || 0;
  const spendReductionPct = totalSpend > 0 ? Math.round((potentialSavings / totalSpend) * 100) : 0;

  const trendData = timeline.slice(-10).map((item) => ({
    label: toShortDate(item.dates),
    spend: item.total_spend || 0,
    anomalies: item.anomalies || 0,
  }));

  const topDept = departmentData.slice(0, 3);
  const totalDeptSpend = topDept.reduce((sum, row) => sum + (row.total_spend || 0), 0);
  const pieData = topDept.map((row) => ({
    name: row.department || "Uncategorized",
    value: row.total_spend || 0,
    pct: totalDeptSpend > 0 ? Math.round(((row.total_spend || 0) / totalDeptSpend) * 100) : 0,
  }));

  const issueRows = topAnomalies.slice(0, 3).map((row) => {
    const vendor = row.transaction?.vendor_name || "Vendor";
    const method = row.detection_method || "Anomaly";
    const action = row.recommendation?.status === "Pending" ? "Fix Now" : "Analyze";

    return {
      id: row._id,
      issue: `${method} - ${vendor}`,
      impact: row.recovery_potential || row.transaction?.amount || 0,
      action,
    };
  });

  const insights = [
    {
      id: "insight-1",
      icon: TriangleAlert,
      text: `Unusual transactions this cycle: ${unusualTransactions}`,
      tone: "bg-warning/10 text-warning",
    },
    {
      id: "insight-2",
      icon: RotateCw,
      text: `${metrics?.recommendations_open || 0} pending recommendations can be actioned now`,
      tone: "bg-surface-hover text-primary-accent-dark",
    },
    {
      id: "insight-3",
      icon: ShieldAlert,
      text: `High risk anomalies: ${metrics?.anomalies_high_risk || 0}`,
      tone: "bg-surface-hover text-text-secondary",
    },
    {
      id: "insight-4",
      icon: Lightbulb,
      text: `Top spend department: ${metrics?.top_department || "-"}`,
      tone: "bg-surface-hover text-text-secondary",
    },
  ];

  const userInitials =
    user?.name
      ?.split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "JD";

  return (
    <div className="min-h-[calc(100vh-64px)] bg-transparent text-text-primary pb-10 selection:bg-primary-accent-light/50">
      <main className="max-w-400 mx-auto px-4 sm:px-6 lg:px-8 pt-7">
        <div className="flex items-center justify-between gap-4 mb-5">
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchDashboardData}
              className="inline-flex items-center gap-2 rounded-xl border border-border-light bg-surface px-4 py-2 text-sm font-semibold text-text-secondary shadow-sm transition hover:bg-surface-hover"
              title="Sync Data"
              disabled={loading}
            >
              <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Sync Data
            </button>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-accent text-sm font-bold text-surface">
              {userInitials}
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl border border-error/20 bg-error/10 px-4 py-3 text-sm text-error">
            {error}
          </div>
        )}

        <section className="rounded-3xl border border-border-light bg-surface p-4 sm:p-5 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">This Month Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <article className="rounded-2xl border border-border-light bg-surface-hover p-4">
              <p className="text-sm text-text-secondary">Total Spend</p>
              <p className="mt-1 text-3xl sm:text-4xl font-semibold text-text-primary leading-none">{formatCurrency(totalSpend)}</p>
            </article>

            <article className="rounded-2xl border border-border-light bg-surface-hover p-4">
              <div className="flex items-start justify-between">
                <p className="text-sm text-text-secondary">Potential Savings</p>
                <span className="inline-flex items-center rounded-full bg-primary-accent-light/40 px-2 py-0.5 text-xs font-semibold text-primary-accent-dark">
                  +{compactNumber(potentialSavings)}
                </span>
              </div>
              <p className="mt-1 text-3xl sm:text-4xl font-semibold text-text-primary leading-none">{formatCurrency(potentialSavings)}</p>
            </article>

            <article className="rounded-2xl border border-border-light bg-surface-hover p-4">
              <p className="text-sm text-text-secondary">Unusual Transactions</p>
              <p className="mt-1 text-3xl sm:text-4xl font-semibold text-text-primary leading-none">{unusualTransactions}</p>
            </article>
          </div>

          <div className="mt-3 flex items-center gap-2 rounded-2xl bg-primary-accent-light/25 px-4 py-2 text-primary-accent-dark">
            <TrendingUp className="h-4 w-4" />
            <p className="text-sm">
              You can <span className="font-semibold">reduce {spendReductionPct}%</span> of your expenses
            </p>
          </div>
        </section>

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
          <section className="lg:col-span-7 rounded-3xl border border-border-light bg-surface p-5 shadow-sm">
            <h3 className="text-xl font-semibold mb-3">Key Insights</h3>
            <div className="space-y-2">
              {insights.map((item) => (
                <div key={item.id} className={`flex items-center gap-2 rounded-xl px-3 py-2 ${item.tone}`}>
                  <item.icon className="h-4 w-4" />
                  <p className="text-sm">{item.text}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="lg:col-span-5 rounded-3xl border border-border-light bg-surface p-5 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold">Spending Trend</h3>
                <p className="text-text-tertiary">Your spending pattern</p>
              </div>
              <IndianRupee className="h-4 w-4 text-primary-accent-dark" />
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
                  <CartesianGrid stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6B7280" }} />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{ borderRadius: 14, border: "1px solid #e5e7eb", backgroundColor: "#FFFFFF" }}
                    formatter={(value, key) => [key === "spend" ? formatCurrency(Number(value)) : value, key === "spend" ? "Spend" : "Anomalies"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="spend"
                    stroke="#3f6212"
                    strokeWidth={3}
                    dot={{ r: 0 }}
                    activeDot={{ r: 5, stroke: "#3f6212", fill: "#fff" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="lg:col-span-7 rounded-3xl border border-border-light bg-surface p-5 shadow-sm">
            <h3 className="text-xl font-semibold mb-2">Top Issues to Fix</h3>
            <div className="overflow-x-auto">
              <table className="w-full min-w-150 text-left">
                <thead>
                  <tr className="text-sm uppercase text-text-tertiary border-b border-border-light">
                    <th className="py-2 font-semibold">Issue</th>
                    <th className="py-2 font-semibold">Impact</th>
                    <th className="py-2 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={3} className="py-5 text-text-tertiary">Loading issue summary...</td>
                    </tr>
                  )}

                  {!loading && issueRows.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-5 text-text-tertiary">No active issues available for this cycle.</td>
                    </tr>
                  )}

                  {!loading && issueRows.map((row, index) => (
                    <tr key={row.id} className="border-b border-border-light/70 last:border-0">
                      <td className="py-3 text-base text-text-primary">{row.issue}</td>
                      <td className="py-3 text-base font-semibold text-text-primary">{formatCurrency(row.impact)}</td>
                      <td className="py-3 text-right">
                        <span
                          className={`inline-flex items-center rounded-xl px-3 py-1.5 text-sm font-semibold ${
                            index === 0
                              ? "bg-secondary-accent text-surface"
                              : index === 1
                                ? "bg-warning/20 text-warning"
                                : "bg-primary-accent-light/30 text-primary-accent-dark"
                          }`}
                        >
                          {row.action}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="lg:col-span-5 rounded-3xl border border-border-light bg-surface p-5 shadow-sm">
            <h3 className="text-xl font-semibold">Where your money goes</h3>
            <p className="mt-1 text-text-tertiary text-sm">
              {pieData[0]?.name ? `${pieData[0].name} is your highest expense` : "Spend split by department"}
            </p>

            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 items-center">
              <div className="space-y-2">
                {pieData.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between rounded-lg bg-surface-hover px-3 py-2 border border-border-light">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                      <span className="text-sm text-text-primary">{item.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-text-secondary">{item.pct}%</span>
                  </div>
                ))}
              </div>

              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={52}
                      outerRadius={88}
                      stroke="none"
                      label={({ percent }) => `${Math.round((percent || 0) * 100)}%`}
                      labelLine={false}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`${entry.name}-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val) => formatCurrency(Number(val))} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
