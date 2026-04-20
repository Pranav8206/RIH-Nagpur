"use client";

import React, { useState, useEffect } from "react";
import { Loader2, CheckCircle, AlertTriangle, AlertCircle, RefreshCw } from "lucide-react";
import { useAppContext } from "@/context/AppContext";

export default function PasteParseComponent({ onSuccess }) {
  const { axiosInstance } = useAppContext();
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  
  // States: 'idle', 'success', 'partial', 'failure', 'created'
  const [step, setStep] = useState("idle"); 
  
  const [parsedData, setParsedData] = useState({
    vendor_name: "",
    amount: "",
    date: "",
    category: "Other",
  });
  
  const [missingFields, setMissingFields] = useState([]);
  const [apiError, setApiError] = useState("");
  const [feedbackMsg, setFeedbackMsg] = useState("");
  const [createdData, setCreatedData] = useState(null);

  const handleKeyDown = (e) => {
    if (e.ctrlKey && e.key === "Enter") {
      parseData();
    }
  };

  const parseData = async () => {
    if (!inputText.trim()) return;

    setLoading(true);
    setApiError("");
    setFeedbackMsg("");
    setMissingFields([]);
    
    try {
      const { data } = await axiosInstance.post(
        "/import/parse-text",
        { raw_text: inputText }
      );

      // We expect HTTP 200, 400, or 422. Since Axios throws on 4xx, we handle success here
      if (data.success && data.confidence === 0.9) {
        setStep("success");
      } else if (data.success) {
        setStep("partial");
        setFeedbackMsg(data.feedback);
      }

      setMissingFields(data.missing_fields || []);
      setParsedData({
        vendor_name: data.parsed?.vendor_name || "",
        amount: data.parsed?.amount || "",
        date: data.parsed?.date || "",
        category: data.parsed?.category || "Other",
      });

    } catch (err) {
      // API returned failure, likely 422 from parse-text
      setStep("failure");
      setApiError(err.response?.data?.error || err.message || "Could not parse text");
    } finally {
      setLoading(false);
    }
  };

  const handleFieldEdit = (field, value) => {
    setParsedData((prev) => ({ ...prev, [field]: value }));
    // Remove from missing fields dynamically if user fills it
    if (value && missingFields.includes(field)) {
      setMissingFields((prev) => prev.filter((f) => f !== field));
    }
  };

  const resetForm = () => {
    setInputText("");
    setParsedData({ vendor_name: "", amount: "", date: "", category: "Other" });
    setStep("idle");
    setMissingFields([]);
    setApiError("");
    setFeedbackMsg("");
    setCreatedData(null);
  };

  // Determine if minimum viable transaction data is provided
  const isFormValid = () => {
    const isVendorValid = parsedData.vendor_name && parsedData.vendor_name.trim() !== "";
    const isAmountValid = parsedData.amount && parseFloat(parsedData.amount) > 0;
    const isDateValid = parsedData.date !== "";
    return isVendorValid && isAmountValid && isDateValid;
  };

  const createTransaction = async () => {
    if (!isFormValid()) return;

    setSubmitLoading(true);
    setApiError("");

    try {
      const payload = {
        ...parsedData,
        amount: parseFloat(parsedData.amount),
      };

      await axiosInstance.post("/transactions", payload);

      setCreatedData(payload);
      setStep("created");
      if (onSuccess) onSuccess(1);
    } catch (err) {
      setApiError(err.response?.data?.message || err.message || "Failed to create transaction");
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 md:p-8 bg-white border border-gray-200 rounded-xl shadow-sm my-8">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">Paste Expense Data</h2>
        <p className="text-sm text-gray-500 mt-1">Paste expense text and extract details automatically</p>
      </div>

      {step === "idle" && (
        <div className="space-y-4">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. GCP $2500 04/15/2024 IT"
            rows={5}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow resize-none"
            disabled={loading}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Ctrl + Enter to parse</span>
            <div className="flex space-x-3">
              <button
                onClick={() => setInputText("")}
                disabled={loading || !inputText}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 transition"
              >
                Clear
              </button>
              <button
                onClick={parseData}
                disabled={loading || !inputText.trim()}
                className="flex items-center justify-center px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 transition min-w-30"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Parsing...
                  </>
                ) : (
                  "Parse Data"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {(step === "success" || step === "partial") && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Status Header */}
          <div className={`flex items-start p-4 border rounded-lg ${step === "success" ? "bg-green-50 border-green-200" : "bg-yellow-50 border-yellow-200"}`}>
            {step === "success" ? (
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 shrink-0" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 shrink-0" />
            )}
            <div>
              <h3 className={`text-sm font-bold ${step === "success" ? "text-green-800" : "text-yellow-800"}`}>
                {step === "success" ? "Transaction data extracted" : "Some fields missing. Please complete required fields."}
              </h3>
              {feedbackMsg && <p className={`text-xs mt-1 ${step === "success" ? "text-green-600" : "text-yellow-700"}`}>{feedbackMsg}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Name *</label>
              <input
                type="text"
                value={parsedData.vendor_name}
                onChange={(e) => handleFieldEdit("vendor_name", e.target.value)}
                className={`w-full p-2 border rounded-md outline-none focus:ring-2 focus:ring-blue-500 ${!parsedData.vendor_name ? "border-red-400 bg-red-50" : "border-gray-300"}`}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={parsedData.amount}
                  onChange={(e) => handleFieldEdit("amount", e.target.value)}
                  className={`w-full p-2 pl-7 border rounded-md outline-none focus:ring-2 focus:ring-blue-500 ${!parsedData.amount ? "border-red-400 bg-red-50" : "border-gray-300"}`}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
              <input
                type="date"
                value={parsedData.date}
                max={new Date().toISOString().split("T")[0]}
                onChange={(e) => handleFieldEdit("date", e.target.value)}
                className={`w-full p-2 border rounded-md outline-none focus:ring-2 focus:ring-blue-500 ${!parsedData.date ? "border-red-400 bg-red-50" : "border-gray-300"}`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={parsedData.category}
                onChange={(e) => handleFieldEdit("category", e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="IT">IT</option>
                <option value="Travel">Travel</option>
                <option value="Operations">Operations</option>
                <option value="Sales">Sales</option>
                <option value="HR">HR</option>
                <option value="Finance">Finance</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {apiError && (
             <div className="text-red-600 text-sm mt-2 flex items-center"><AlertCircle className="w-4 h-4 mr-2"/> {apiError}</div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
               onClick={resetForm}
               className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition"
            >
              Cancel
            </button>
            <button
              onClick={createTransaction}
              disabled={!isFormValid() || submitLoading}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {submitLoading ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...</>
              ) : "Create Transaction"}
            </button>
          </div>
        </div>
      )}

      {step === "failure" && (
        <div className="space-y-5 flex flex-col items-center animate-in fade-in duration-300">
           <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start w-full">
               <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3 shrink-0" />
               <div>
                 <h3 className="text-sm font-bold text-red-800">Could not parse text</h3>
                 <p className="text-xs text-red-600 mt-1">{apiError}</p>
               </div>
           </div>
           
           <div className="w-full">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Example Formats:</h4>
              <ul className="text-sm text-gray-600 space-y-2 bg-gray-50 border p-3 rounded-md italic font-mono">
                 <li>"GCP $2500 04/15/2024"</li>
                 <li>"Vendor: GCP | Amount: 2500 | Date: 04/15/2024"</li>
              </ul>
           </div>

           <div className="flex space-x-4 w-full justify-center">
              <button
                onClick={resetForm}
                className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition"
              >
                Try Again
              </button>
              {/* Optional switch to manual form trigger can go here, simulated by resetting text and user opens another tab/modal manually in bigger app */}
           </div>
        </div>
      )}

      {step === "created" && createdData && (
         <div className="text-center space-y-5 animate-in zoom-in-95 duration-500">
             <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-2">
                 <CheckCircle className="h-8 w-8 text-green-600" />
             </div>
             <div>
                <h3 className="text-xl font-bold text-gray-900">Transaction created successfully</h3>
             </div>
             
             <div className="bg-gray-50 rounded-lg p-4 max-w-sm mx-auto text-left border border-gray-200 flex flex-col space-y-2 text-sm">
                 <div className="flex justify-between border-b pb-2">
                   <span className="text-gray-500">Vendor</span>
                   <span className="font-semibold text-gray-900 truncate max-w-37.5">{createdData.vendor_name}</span>
                 </div>
                 <div className="flex justify-between border-b pb-2">
                   <span className="text-gray-500">Amount</span>
                   <span className="font-semibold text-gray-900">${createdData.amount}</span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-gray-500">Date</span>
                   <span className="font-semibold text-gray-900">{createdData.date}</span>
                 </div>
             </div>

             <button
               onClick={resetForm}
               className="inline-flex items-center px-5 py-2.5 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition mt-4"
             >
               <RefreshCw className="h-4 w-4 mr-2" />
               Parse Another
             </button>
         </div>
      )}
    </div>
  );
}
