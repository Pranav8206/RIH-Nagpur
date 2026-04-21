"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, CalendarDays, RefreshCcw } from "lucide-react";
import { useAppContext } from "@/context/AppContext";

const weekdayHeaders = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const monthLabels = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const toDateKey = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const toAmountNumber = (value) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const normalized = value.replace(/,/g, "").trim();
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const formatMoney = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value || 0);

const formatMonthTitle = (date) =>
  date.toLocaleString("en-US", { month: "long", year: "numeric" });

const buildMonthGrid = (monthDate) => {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const firstWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstWeekday; i += 1) {
    cells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(year, month, day));
  }

  return cells;
};

export default function TransactionsCalendarPage() {
  const { axiosInstance } = useAppContext();
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [filters, setFilters] = useState({
    vendor_name: "",
    category: "",
    department: "",
  });
  const [selectedDateKey, setSelectedDateKey] = useState("");
  const [transactionsByDate, setTransactionsByDate] = useState({});
  const [anomalyCountByDate, setAnomalyCountByDate] = useState({});
  const [anomalyByTransaction, setAnomalyByTransaction] = useState({});
  const [monthTotal, setMonthTotal] = useState(0);
  const [monthCount, setMonthCount] = useState(0);
  const [uniqueCategories, setUniqueCategories] = useState([]);
  const [uniqueDepartments, setUniqueDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchMonthTransactions = async (monthDate, currentFilters = filters) => {
    setLoading(true);
    setError("");

    try {
      const year = monthDate.getFullYear();
      const month = monthDate.getMonth();
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0);

      const startStr = toDateKey(start);
      const endStr = toDateKey(end);
      const params = new URLSearchParams();
      params.append("limit", "2000");
      params.append("date_from", startStr);
      params.append("date_to", endStr);

      if (currentFilters.vendor_name.trim()) {
        params.append("vendor_name", currentFilters.vendor_name.trim());
      }
      if (currentFilters.category) {
        params.append("category", currentFilters.category);
      }
      if (currentFilters.department) {
        params.append("department", currentFilters.department);
      }

      const { data } = await axiosInstance.get(`/transactions?${params.toString()}`);

      const rows = data?.data || [];
      const txById = rows.reduce((acc, trx) => {
        if (trx?._id) acc[trx._id] = trx;
        return acc;
      }, {});

      const anomalyRes = await axiosInstance.get("/anomalies?limit=5000&page=1");

      const anomalies = anomalyRes?.data?.data || [];

      const anomalyMap = {};
      const anomalyDateCounts = {};

      anomalies.forEach((anomaly) => {
        const transactionId = anomaly?.transaction_id;
        if (!transactionId || !txById[transactionId]) return;

        if (!anomalyMap[transactionId]) {
          anomalyMap[transactionId] = anomaly;
        }

        const txDateKey = toDateKey(txById[transactionId].date);
        if (txDateKey) {
          anomalyDateCounts[txDateKey] = (anomalyDateCounts[txDateKey] || 0) + 1;
        }
      });

      const grouped = rows.reduce((acc, trx) => {
        const key = toDateKey(trx.date);
        if (!key) return acc;
        if (!acc[key]) acc[key] = [];
        acc[key].push(trx);
        return acc;
      }, {});

      Object.values(grouped).forEach((items) => {
        items.sort((a, b) => new Date(b.date) - new Date(a.date));
      });

      setTransactionsByDate(grouped);
      setAnomalyCountByDate(anomalyDateCounts);
      setAnomalyByTransaction(anomalyMap);
      setMonthTotal(rows.reduce((sum, trx) => sum + toAmountNumber(trx.amount), 0));
      setMonthCount(rows.length);

      setUniqueCategories(
        Array.from(
          new Set(rows.map((trx) => trx.category).filter(Boolean)),
        ).sort((a, b) => a.localeCompare(b)),
      );
      setUniqueDepartments(
        Array.from(
          new Set(rows.map((trx) => trx.department).filter(Boolean)),
        ).sort((a, b) => a.localeCompare(b)),
      );

      const firstDateKey = Object.keys(grouped).sort()[0] || "";
      setSelectedDateKey(firstDateKey);
    } catch (requestError) {
      const message =
        requestError?.response?.data?.error ||
        requestError?.response?.data?.message ||
        requestError?.message ||
        "Failed to load transactions";
      setError(message);
      setTransactionsByDate({});
      setAnomalyCountByDate({});
      setAnomalyByTransaction({});
      setMonthTotal(0);
      setMonthCount(0);
      setUniqueCategories([]);
      setUniqueDepartments([]);
      setSelectedDateKey("");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthTransactions(currentMonth, filters);
  }, [currentMonth, filters]);

  const monthCells = useMemo(() => buildMonthGrid(currentMonth), [currentMonth]);

  const selectedDayTransactions = useMemo(
    () => transactionsByDate[selectedDateKey] || [],
    [transactionsByDate, selectedDateKey],
  );

  const goPrevMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goNextMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const selectableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear - 5; year <= currentYear + 1; year += 1) {
      years.push(year);
    }
    return years;
  }, []);

  const selectedDayAnomalyCount = selectedDateKey ? anomalyCountByDate[selectedDateKey] || 0 : 0;

  return (
    <div className="min-h-screen bg-transparent text-text-primary pb-12 font-sans selection:bg-primary-accent-light/50">
      <main className="max-w-400 mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center">
              <CalendarDays className="w-6 h-6 mr-2 text-primary-accent" />
              Transaction Calendar
            </h1>
            <p className="text-sm text-text-secondary mt-1 font-medium">
              Review all user transactions by date for faster auditing and leakage spotting.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={goPrevMonth}
              className="p-2 rounded-lg border border-border-light bg-surface hover:bg-surface-hover"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <select
              value={currentMonth.getMonth()}
              onChange={(event) =>
                setCurrentMonth(
                  (prev) => new Date(prev.getFullYear(), Number(event.target.value), 1),
                )
              }
              className="rounded-lg border border-border-light bg-surface px-3 py-2 text-sm font-semibold text-text-primary"
              aria-label="Select month"
            >
              {monthLabels.map((label, index) => (
                <option key={label} value={index}>
                  {label}
                </option>
              ))}
            </select>
            <select
              value={currentMonth.getFullYear()}
              onChange={(event) =>
                setCurrentMonth(
                  (prev) => new Date(Number(event.target.value), prev.getMonth(), 1),
                )
              }
              className="rounded-lg border border-border-light bg-surface px-3 py-2 text-sm font-semibold text-text-primary"
              aria-label="Select year"
            >
              {selectableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <button
              onClick={goNextMonth}
              className="p-2 rounded-lg border border-border-light bg-surface hover:bg-surface-hover"
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => fetchMonthTransactions(currentMonth, filters)}
              className="flex items-center gap-2 text-sm font-semibold text-text-secondary bg-surface border border-border-light px-3 py-2 rounded-lg hover:bg-surface-hover"
            >
              <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin text-primary-accent" : ""}`} />
              Sync
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          <input
            type="text"
            value={filters.vendor_name}
            onChange={(event) => setFilters((prev) => ({ ...prev, vendor_name: event.target.value }))}
            placeholder="Filter by vendor"
            className="w-full rounded-lg border border-border-light bg-surface px-3 py-2 text-sm outline-none focus:border-primary-accent"
          />
          <select
            value={filters.category}
            onChange={(event) => setFilters((prev) => ({ ...prev, category: event.target.value }))}
            className="w-full rounded-lg border border-border-light bg-surface px-3 py-2 text-sm outline-none focus:border-primary-accent"
          >
            <option value="">All Categories</option>
            {uniqueCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <select
            value={filters.department}
            onChange={(event) => setFilters((prev) => ({ ...prev, department: event.target.value }))}
            className="w-full rounded-lg border border-border-light bg-surface px-3 py-2 text-sm outline-none focus:border-primary-accent"
          >
            <option value="">All Departments</option>
            {uniqueDepartments.map((department) => (
              <option key={department} value={department}>
                {department}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="bg-surface border border-border-light rounded-xl p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-text-tertiary">Monthly Transactions</p>
            <p className="text-2xl font-bold mt-1">{monthCount}</p>
          </div>
          <div className="bg-surface border border-border-light rounded-xl p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-text-tertiary">Monthly Spend</p>
            <p className="text-2xl font-bold mt-1">{formatMoney(monthTotal)}</p>
          </div>
          <div className="bg-surface border border-border-light rounded-xl p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-text-tertiary">Selected Day</p>
            <p className="text-base font-semibold mt-1">{selectedDateKey || "No date selected"}</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-xl text-error text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <section className="lg:col-span-8 bg-surface rounded-xl border border-border-light shadow-sm p-4">
            <div className="grid grid-cols-7 gap-2 mb-2">
              {weekdayHeaders.map((day) => (
                <div key={day} className="text-center text-xs font-bold uppercase tracking-wide text-text-tertiary py-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {monthCells.map((dateObj, index) => {
                if (!dateObj) {
                  return <div key={`blank-${index}`} className="h-24 rounded-lg bg-transparent" />;
                }

                const key = toDateKey(dateObj);
                const dayTransactions = transactionsByDate[key] || [];
                const daySpend = dayTransactions.reduce((sum, trx) => sum + toAmountNumber(trx.amount), 0);
                const dayAnomalyCount = anomalyCountByDate[key] || 0;
                const isSelected = key === selectedDateKey;
                const hasData = dayTransactions.length > 0;

                return (
                  <button
                    key={key}
                    onClick={() => setSelectedDateKey(key)}
                    className={`h-24 rounded-lg border p-2 text-left transition-colors ${
                      isSelected
                        ? "border-primary-accent bg-primary-accent-light/20"
                        : hasData
                          ? "border-border-light bg-surface-hover hover:border-primary-accent/40"
                          : "border-border-light/70 bg-background/30 hover:bg-surface-hover"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">{dateObj.getDate()}</span>
                      <div className="flex items-center gap-1">
                        {dayAnomalyCount > 0 && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700">
                            A:{dayAnomalyCount}
                          </span>
                        )}
                        {hasData && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary-accent-light/40 text-primary-accent-dark">
                          {dayTransactions.length}
                        </span>
                        )}
                      </div>
                    </div>
                    <p className="mt-2 text-[11px] text-text-secondary leading-tight">
                      {hasData ? formatMoney(daySpend) : "No transactions"}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="bg-surface rounded-xl border border-border-light shadow-sm p-4 lg:col-span-4 lg:sticky lg:top-6">
            <h2 className="text-sm font-bold uppercase tracking-wide text-text-tertiary mb-3">
              {selectedDateKey ? `Transactions on ${selectedDateKey}` : "Daily Transactions"}
            </h2>

            <div className="space-y-3 max-h-155 overflow-y-auto pr-1">
              {!selectedDateKey && (
                <p className="text-sm text-text-secondary">Select a date from the calendar to inspect transactions.</p>
              )}

              {selectedDateKey && selectedDayTransactions.length === 0 && (
                <p className="text-sm text-text-secondary">No transactions found for this day.</p>
              )}

              {selectedDayTransactions.map((trx) => (
                <article
                  key={trx._id}
                  className="rounded-lg border border-border-light p-3 bg-surface-hover"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold text-text-primary truncate">
                      {trx.vendor_name || "Unknown Vendor"}
                    </h3>
                    <p className="text-sm font-bold text-primary-accent-dark">
                      {formatMoney(toAmountNumber(trx.amount))}
                    </p>
                  </div>

                  <p className="text-xs text-text-secondary mt-1">
                    Invoice: {trx.invoice_number || "N/A"}
                  </p>
                  <p className="text-xs text-text-secondary mt-1">
                    Category: {trx.category || "Uncategorized"} | Department: {trx.department || "General"}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {anomalyByTransaction[trx._id] ? (
                      <Link
                        href={`/anomalies/${anomalyByTransaction[trx._id]._id}`}
                        className="text-xs font-semibold px-2.5 py-1 rounded border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                      >
                        View Anomaly
                      </Link>
                    ) : (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded border border-gray-200 bg-gray-50 text-gray-500">
                        No Anomaly
                      </span>
                    )}

                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
