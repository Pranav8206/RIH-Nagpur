"use client";

import React, { useState } from "react";
import CSVUploadComponent from "@/components/CSVUploadComponent";
import PasteParseComponent from "@/components/PasteParseComponent";
import ManualEntryForm from "@/components/ManualEntryForm";
import { FileUp, FileText, Edit, CheckCircle, Download, Activity, List, Plus } from "lucide-react";
import Link from "next/link";

export default function ImportPage() {
  const [activeTab, setActiveTab] = useState("csv");
  const [globalSuccess, setGlobalSuccess] = useState(false);
  const [importedCount, setImportedCount] = useState(0);

  const handleSuccess = (count) => {
    if (count > 0) {
      setImportedCount((prev) => prev + count);
      setGlobalSuccess(true);
      
      // Auto-hide success after 8 seconds to let user continue
      setTimeout(() => {
        setGlobalSuccess(false);
      }, 8000);
    }
  };

  const handleDownloadTemplate = () => {
    const templateContent = "vendor_name,amount,date,category,department,invoice_number,payment_method,description\nExample Vendor,150.00,2026-05-01,IT,Engineering,INV-001,Card,Monthly subscription";
    const blob = new Blob([templateContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "expense_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6 animate-in fade-in duration-500">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Import Transactions</h1>
          <p className="text-gray-500 mt-1">Choose how you want to add your expenses</p>
        </div>
        
        {activeTab === "csv" && (
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center space-x-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Download CSV Template</span>
          </button>
        )}
      </div>

      {/* Global Success Notification */}
      {globalSuccess && importedCount > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 shadow-sm flex flex-col items-center justify-center text-center space-y-4 animate-in slide-in-from-top-4 duration-500">
           <CheckCircle className="h-10 w-10 text-green-500" />
           <h2 className="text-xl font-semibold text-green-900">{importedCount} transactions added successfully</h2>
           
           <div className="flex flex-wrap justify-center gap-3 pt-2">
             <Link href="/anomalies" className="flex items-center space-x-2 bg-white border border-green-300 text-green-700 px-4 py-2 rounded-lg hover:bg-green-100 font-medium text-sm transition">
               <Activity className="h-4 w-4" />
               <span>Run Anomaly Detection</span>
             </Link>
             <Link href="/dashboard" className="flex items-center space-x-2 bg-white border border-green-300 text-green-700 px-4 py-2 rounded-lg hover:bg-green-100 font-medium text-sm transition">
               <List className="h-4 w-4" />
               <span>View Transactions</span>
             </Link>
             <button 
               onClick={() => setGlobalSuccess(false)}
               className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium text-sm transition"
             >
               <Plus className="h-4 w-4" />
               <span>Import More</span>
             </button>
           </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 overflow-x-auto no-scrollbar" aria-label="Tabs">
          <button
            onClick={() => setActiveTab("csv")}
            className={`whitespace-nowrap flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "csv"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <FileUp className={`h-5 w-5 mr-2 ${activeTab === "csv" ? "text-blue-500" : "text-gray-400"}`} />
            CSV Upload
          </button>

          <button
            onClick={() => setActiveTab("paste")}
            className={`whitespace-nowrap flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "paste"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <FileText className={`h-5 w-5 mr-2 ${activeTab === "paste" ? "text-blue-500" : "text-gray-400"}`} />
            Paste & Parse
          </button>

          <button
            onClick={() => setActiveTab("manual")}
            className={`whitespace-nowrap flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "manual"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <Edit className={`h-5 w-5 mr-2 ${activeTab === "manual" ? "text-blue-500" : "text-gray-400"}`} />
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

    </div>
  );
}
