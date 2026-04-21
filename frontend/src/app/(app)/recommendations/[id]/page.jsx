"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  AlertTriangle,
  CircleDollarSign,
  Building2,
  Calendar,
  BadgeCheck,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import LoadingSkeleton from "@/components/shared/LoadingSkeleton";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0);

const formatDate = (value) => {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return date.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
};

export default function RecommendationDetailView() {
  const { id } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { axiosInstance } = useAppContext();
  const [actionLoading, setActionLoading] = useState("");

  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["recommendation", id],
    queryFn: async () => {
      const res = await axiosInstance.get(`/recommendations/${id}`);
      return res.data?.data;
    },
    enabled: Boolean(id),
  });

  const handleExecute = async () => {
    if (!id || data?.status !== "Pending") return;
    setActionLoading("execute");
    try {
      await axiosInstance.patch(`/recommendations/${id}/execute`, {});
      await Promise.all([
        queryClient.invalidateQueries(["recommendation", id]),
        queryClient.invalidateQueries(["recommendations"]),
        queryClient.invalidateQueries(["recommendation-summary"]),
      ]);
    } catch {
      alert("Unable to mark this recommendation as completed right now.");
    } finally {
      setActionLoading("");
    }
  };

  const handleReject = async () => {
    if (!id || data?.status !== "Pending") return;
    setActionLoading("reject");
    try {
      await axiosInstance.patch(`/recommendations/${id}/reject`, {
        reason: "Not applicable right now",
      });
      await Promise.all([
        queryClient.invalidateQueries(["recommendation", id]),
        queryClient.invalidateQueries(["recommendations"]),
        queryClient.invalidateQueries(["recommendation-summary"]),
      ]);
    } catch {
      alert("Unable to dismiss this recommendation right now.");
    } finally {
      setActionLoading("");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-[#fbfaf7] p-6 sm:p-8">
        <div className="max-w-5xl mx-auto pt-12">
          <LoadingSkeleton type="card" className="h-64" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-[#fbfaf7] p-6 sm:p-8">
        <div className="max-w-3xl mx-auto pt-16 text-center rounded-3xl border border-red-200 bg-white p-8 shadow-sm">
          <AlertTriangle className="h-10 w-10 mx-auto text-red-500" />
          <h1 className="text-xl font-semibold text-slate-800 mt-4">Could not load recommendation</h1>
          <p className="text-sm text-slate-500 mt-2">{error?.message || "Please try again."}</p>
          <button
            onClick={() => router.push("/recommendations")}
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to recommendations
          </button>
        </div>
      </div>
    );
  }

  const canTakeAction = data.status === "Pending";

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#fbfaf7] pb-10 text-slate-800">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <button
          onClick={() => router.push("/recommendations")}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 mb-5"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-[0_12px_35px_rgba(15,23,42,0.07)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-800">
                {data.friendly_title || "Recommendation"}
              </h1>
              <p className="text-slate-600 text-sm sm:text-base mt-2 leading-6 max-w-3xl">
                {data.friendly_summary || data.action_description || "Review this recommendation and take the best next step."}
              </p>
            </div>
            <span className="inline-flex items-center rounded-full bg-[#edf3e9] px-3 py-1 text-xs font-semibold text-[#65795d] border border-[#d7e2cf] w-fit">
              {data.status}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs uppercase tracking-wide text-slate-500">Potential monthly saving</div>
              <div className="mt-2 text-2xl font-semibold text-slate-900 inline-flex items-center gap-2">
                <CircleDollarSign className="h-5 w-5 text-[#7a8c72]" />
                {formatCurrency(data.estimated_recovery)}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs uppercase tracking-wide text-slate-500">Vendor / Category</div>
              <div className="mt-2 text-base font-medium text-slate-800 inline-flex items-center gap-2">
                <Building2 className="h-4 w-4 text-slate-500" />
                {(data.transaction?.vendor_name || "Unknown vendor").toString()}
              </div>
              <div className="text-sm text-slate-500 mt-1">{data.transaction?.category || "Uncategorized"}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs uppercase tracking-wide text-slate-500">Detected on</div>
              <div className="mt-2 text-base font-medium text-slate-800 inline-flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-500" />
                {formatDate(data.anomaly?.detected_at || data.created_at)}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs uppercase tracking-wide text-slate-500">Why this was flagged</div>
              <div className="mt-2 text-sm text-slate-700 inline-flex items-start gap-2 leading-6">
                <BadgeCheck className="h-4 w-4 text-slate-500 mt-1 shrink-0" />
                <span>{data.anomaly?.reason_description || data.anomaly?.detection_method || "Unusual pattern detected in transaction."}</span>
              </div>
            </div>
          </div>

          <div className="mt-7 pt-6 border-t border-slate-200 flex flex-wrap gap-3">
            <button
              onClick={handleExecute}
              disabled={!canTakeAction || actionLoading.length > 0}
              className="inline-flex items-center gap-2 rounded-full bg-[#7a8c72] px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50 hover:bg-[#6a7c63] transition"
            >
              <CheckCircle2 className="h-4 w-4" />
              {actionLoading === "execute" ? "Saving..." : "Mark as completed"}
            </button>
            <button
              onClick={handleReject}
              disabled={!canTakeAction || actionLoading.length > 0}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 disabled:opacity-50 hover:bg-slate-50 transition"
            >
              <XCircle className="h-4 w-4" />
              {actionLoading === "reject" ? "Saving..." : "Dismiss"}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
