"use client";

import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import CSVUploadComponent from "@/components/CSVUploadComponent";
import PasteParseComponent from "@/components/PasteParseComponent";
import ManualEntryForm from "@/components/ManualEntryForm";
import {
  FileUp,
  FileText,
  Edit,
  CheckCircle,
  Download,
  Activity,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Loader2,
  List,
} from "lucide-react";
import Link from "next/link";
import { useAppContext } from "@/context/AppContext";

export default function ImportPage() {
  const queryClient = useQueryClient();
  const { axiosInstance } = useAppContext();

  const [activeTab, setActiveTab] = useState("csv");
  const [globalSuccess, setGlobalSuccess] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [showTransactionsModal, setShowTransactionsModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingTx, setEditingTx] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState("");
  const [modalError, setModalError] = useState("");

  const {
    data: transactionsResponse,
    isLoading: transactionsLoading,
    refetch: refetchTransactions,
  } = useQuery({
    queryKey: ["import-transactions", searchTerm],
    enabled: showTransactionsModal,
    queryFn: async ({ queryKey }) => {
      const [, term] = queryKey;
      const params = new URLSearchParams();
      params.append("limit", "100");
      if (term?.trim()) params.append("vendor_name", term.trim());
      const { data } = await axiosInstance.get(
        `/transactions?${params.toString()}`,
      );
      return data;
    },
    keepPreviousData: true,
  });

  const transactions = transactionsResponse?.data || [];

  const handleSuccess = (count) => {
    if (count > 0) {
      setImportedCount((prev) => prev + count);
      setGlobalSuccess(true);

      // Auto-hide success after 8 seconds to let user continue
      setTimeout(() => {
        setGlobalSuccess(false);
      }, 8000);

      queryClient.invalidateQueries(["import-transactions"]);
    }
  };

  const handleDownloadTemplate = () => {
    const templateContent =
      "vendor_name,amount,date,category,department,invoice_number,payment_method,description\nExample Vendor,150.00,2026-05-01,IT,Engineering,INV-001,Card,Monthly subscription";
    const blob = new Blob([templateContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "expense_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const closeModal = () => {
    setShowTransactionsModal(false);
    setEditingTx(null);
    setEditForm(null);
    setModalError("");
  };

  const openEditModal = (transaction) => {
    setEditingTx(transaction);
    setEditForm({
      vendor_name: transaction.vendor_name || "",
      amount: transaction.amount || "",
      date: transaction.date
        ? new Date(transaction.date).toISOString().split("T")[0]
        : "",
      category: transaction.category || "Other",
      department: transaction.department || "",
      payment_method: transaction.payment_method || "",
      description: transaction.description || "",
      status: transaction.status || "Pending",
    });
    setModalError("");
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateTransaction = async (e) => {
    e.preventDefault();
    if (!editingTx?._id || !editForm) return;

    if (!editForm.vendor_name.trim()) {
      setModalError("Vendor name is required.");
      return;
    }
    if (!editForm.amount || Number(editForm.amount) <= 0) {
      setModalError("Amount must be greater than zero.");
      return;
    }

    setIsSavingEdit(true);
    setModalError("");
    try {
      await axiosInstance.patch(`/transactions/${editingTx._id}`, {
        vendor_name: editForm.vendor_name.trim(),
        amount: Number(editForm.amount),
        date: editForm.date,
        category: editForm.category,
        department: editForm.department || undefined,
        payment_method: editForm.payment_method || undefined,
        description: editForm.description || undefined,
        status: editForm.status,
      });

      await Promise.all([
        queryClient.invalidateQueries(["import-transactions"]),
        queryClient.invalidateQueries(["transactions"]),
        queryClient.invalidateQueries(["anomalies"]),
      ]);

      setEditingTx(null);
      setEditForm(null);
      await refetchTransactions();
    } catch (err) {
      setModalError(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          "Failed to update transaction.",
      );
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteTransaction = async (transactionId) => {
    if (!transactionId) return;
    const shouldDelete = window.confirm("Delete this transaction?");
    if (!shouldDelete) return;

    setIsDeletingId(transactionId);
    setModalError("");
    try {
      await axiosInstance.delete(`/transactions/${transactionId}`);
      await Promise.all([
        queryClient.invalidateQueries(["import-transactions"]),
        queryClient.invalidateQueries(["transactions"]),
        queryClient.invalidateQueries(["anomalies"]),
      ]);
      await refetchTransactions();
    } catch (err) {
      setModalError(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          "Failed to delete transaction.",
      );
    } finally {
      setIsDeletingId("");
    }
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount || 0);

  return (
    <div className="max-w-screen-2xl mx-auto p-4 md:p-8 space-y-6 animate-in fade-in duration-500 text-text-primary">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-editorial">
            Import Transactions
          </h1>
          <p className="text-text-secondary mt-1">
            Choose how you want to add your expenses
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setShowTransactionsModal(true);
              setModalError("");
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-accent text-surface hover:bg-primary-accent-dark transition font-medium text-sm"
          >
            <List className="h-4 w-4" />
            View All Transactions
          </button>
          {activeTab === "csv" && (
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center space-x-2 text-sm font-medium text-primary-accent bg-surface border border-border-light hover:bg-surface-hover px-4 py-2 rounded-lg transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Download CSV Template</span>
            </button>
          )}
        </div>
      </div>

      {/* Global Success Notification */}
      {globalSuccess && importedCount > 0 && (
        <div className="bg-surface border border-border-light rounded-xl p-6 shadow-sm flex flex-col items-center justify-center text-center space-y-4 animate-in slide-in-from-top-4 duration-500">
          <CheckCircle className="h-10 w-10 text-success" />
          <h2 className="text-xl font-semibold text-text-primary">
            {importedCount} transactions added successfully
          </h2>

          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Link
              href="/anomalies"
              className="flex items-center space-x-2 bg-surface border border-border-light text-text-secondary px-4 py-2 rounded-lg hover:bg-surface-hover font-medium text-sm transition"
            >
              <Activity className="h-4 w-4" />
              <span>Run Anomaly Detection</span>
            </Link>
            <button
              onClick={() => setGlobalSuccess(false)}
              className="flex items-center space-x-2 bg-primary-accent text-surface px-4 py-2 rounded-lg hover:bg-primary-accent-dark font-medium text-sm transition"
            >
              <Plus className="h-4 w-4" />
              <span>Import More</span>
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-border-light">
        <nav
          className="flex space-x-8 overflow-x-auto no-scrollbar"
          aria-label="Tabs"
        >
          <button
            onClick={() => setActiveTab("csv")}
            className={`whitespace-nowrap flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "csv"
                ? "border-primary-accent text-primary-accent"
                : "border-transparent text-text-secondary hover:text-text-primary hover:border-border-light"
            }`}
          >
            <FileUp
              className={`h-5 w-5 mr-2 ${activeTab === "csv" ? "text-primary-accent" : "text-text-tertiary"}`}
            />
            CSV Upload
          </button>

          <button
            onClick={() => setActiveTab("paste")}
            className={`whitespace-nowrap flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "paste"
                ? "border-primary-accent text-primary-accent"
                : "border-transparent text-text-secondary hover:text-text-primary hover:border-border-light"
            }`}
          >
            <FileText
              className={`h-5 w-5 mr-2 ${activeTab === "paste" ? "text-primary-accent" : "text-text-tertiary"}`}
            />
            Paste & Parse
          </button>

          <button
            onClick={() => setActiveTab("manual")}
            className={`whitespace-nowrap flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "manual"
                ? "border-primary-accent text-primary-accent"
                : "border-transparent text-text-secondary hover:text-text-primary hover:border-border-light"
            }`}
          >
            <Edit
              className={`h-5 w-5 mr-2 ${activeTab === "manual" ? "text-primary-accent" : "text-text-tertiary"}`}
            />
            Manual Entry
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="pt-2">
        {activeTab === "csv" && (
          <div className="animate-in fade-in duration-300">
            <CSVUploadComponent onSuccess={handleSuccess} />
          </div>
        )}

        {activeTab === "paste" && (
          <div className="animate-in fade-in duration-300">
            <PasteParseComponent onSuccess={handleSuccess} />
          </div>
        )}

        {activeTab === "manual" && (
          <div className="animate-in fade-in duration-300">
            <ManualEntryForm onSuccess={handleSuccess} />
          </div>
        )}
      </div>

      {showTransactionsModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-2xl border border-border-light bg-surface shadow-2xl flex flex-col">
            <div className="px-5 py-4 border-b border-border-light flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Your Transactions</h2>
                <p className="text-sm text-text-secondary">
                  Search, edit, or delete transaction records.
                </p>
              </div>
              <button
                onClick={closeModal}
                className="p-2 rounded-md border border-border-light hover:bg-surface-hover transition"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-5 py-4 border-b border-border-light bg-surface-hover/60">
              <div className="relative max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-3 text-text-tertiary" />
                <input
                  type="text"
                  placeholder="Search by vendor name"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-border-light bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary-accent-light"
                />
              </div>
              {modalError && (
                <p className="text-sm text-error mt-2">{modalError}</p>
              )}
            </div>

            <div className="overflow-auto flex-1">
              <table className="w-full text-sm">
                <thead className="bg-surface-hover sticky top-0 z-10">
                  <tr className="text-left text-text-tertiary border-b border-border-light">
                    <th className="px-4 py-3 font-semibold">Vendor</th>
                    <th className="px-4 py-3 font-semibold">Invoice</th>
                    <th className="px-4 py-3 font-semibold">Amount</th>
                    <th className="px-4 py-3 font-semibold">Date</th>
                    <th className="px-4 py-3 font-semibold">Category</th>
                    <th className="px-4 py-3 font-semibold text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {transactionsLoading ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-8 text-center text-text-secondary"
                      >
                        <span className="inline-flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" /> Loading
                          transactions...
                        </span>
                      </td>
                    </tr>
                  ) : transactions.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-8 text-center text-text-secondary"
                      >
                        No transactions found.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx) => (
                      <tr
                        key={tx._id}
                        className="border-b border-border-light/70 hover:bg-surface-hover/40 transition"
                      >
                        <td className="px-4 py-3 font-medium">
                          {tx.vendor_name || "Unknown"}
                        </td>
                        <td className="px-4 py-3 text-text-secondary">
                          {tx.invoice_number || "-"}
                        </td>
                        <td className="px-4 py-3">
                          {formatCurrency(tx.amount)}
                        </td>
                        <td className="px-4 py-3 text-text-secondary">
                          {tx.date
                            ? new Date(tx.date).toLocaleDateString("en-IN")
                            : "-"}
                        </td>
                        <td className="px-4 py-3 text-text-secondary">
                          {tx.category || "Other"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => openEditModal(tx)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-border-light hover:bg-surface-hover text-text-secondary"
                            >
                              <Pencil className="h-3.5 w-3.5" /> Edit
                            </button>
                            <button
                              onClick={() => handleDeleteTransaction(tx._id)}
                              disabled={isDeletingId === tx._id}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-red-200 text-error hover:bg-red-50 disabled:opacity-50"
                            >
                              {isDeletingId === tx._id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}{" "}
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {editingTx && editForm && (
            <div className="fixed inset-0 z-60 bg-black/40 flex items-center justify-center p-4">
              <div className="w-full max-w-2xl rounded-2xl border border-border-light bg-surface shadow-2xl">
                <div className="px-5 py-4 border-b border-border-light flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Edit Transaction</h3>
                  <button
                    onClick={() => {
                      setEditingTx(null);
                      setEditForm(null);
                      setModalError("");
                    }}
                    className="p-2 rounded-md border border-border-light hover:bg-surface-hover"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <form
                  onSubmit={handleUpdateTransaction}
                  className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">
                      Vendor Name
                    </label>
                    <input
                      name="vendor_name"
                      value={editForm.vendor_name}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-primary-accent-light"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Amount
                    </label>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      name="amount"
                      value={editForm.amount}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-primary-accent-light"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      name="date"
                      value={editForm.date}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-primary-accent-light"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Category
                    </label>
                    <input
                      name="category"
                      value={editForm.category}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-primary-accent-light"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Department
                    </label>
                    <input
                      name="department"
                      value={editForm.department}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-primary-accent-light"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Payment Method
                    </label>
                    <input
                      name="payment_method"
                      value={editForm.payment_method}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-primary-accent-light"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Status
                    </label>
                    <select
                      name="status"
                      value={editForm.status}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 rounded-lg border border-border-light bg-surface focus:outline-none focus:ring-2 focus:ring-primary-accent-light"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Approved">Approved</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">
                      Description
                    </label>
                    <textarea
                      name="description"
                      rows={3}
                      value={editForm.description}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-primary-accent-light"
                    />
                  </div>

                  <div className="md:col-span-2 flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTx(null);
                        setEditForm(null);
                        setModalError("");
                      }}
                      className="px-4 py-2 rounded-lg border border-border-light hover:bg-surface-hover"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingEdit}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-accent text-surface hover:bg-primary-accent-dark disabled:opacity-50"
                    >
                      {isSavingEdit ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : null}
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
