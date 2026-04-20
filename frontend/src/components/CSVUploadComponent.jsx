"use client";

import React, { useState, useEffect } from "react";
import Papa from "papaparse";
import axios from "axios";
import { UploadCloud, CheckCircle, XCircle, AlertCircle, FileText, Loader2 } from "lucide-react";

export default function CSVUploadComponent({ onSuccess }) {
  const [file, setFile] = useState(null);
  const [parsedHeaders, setParsedHeaders] = useState([]);
  const [parsedRows, setParsedRows] = useState([]);
  const [mappings, setMappings] = useState({});
  const [previewData, setPreviewData] = useState([]);
  
  // Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  const MAPPABLE_COLUMNS = [
    { value: "Skip", label: "Skip Category" },
    { value: "vendor_name", label: "Vendor Name" },
    { value: "amount", label: "Amount" },
    { value: "date", label: "Date" },
    { value: "category", label: "Category" },
  ];

  // Helper for auto-mapping
  const autoMapHeader = (header) => {
    const raw = header.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (raw.includes("vendor") || raw.includes("supplier") || raw.includes("merchant")) return "vendor_name";
    if (raw.includes("amount") || raw.includes("cost") || raw.includes("price") || raw.includes("total")) return "amount";
    if (raw.includes("date") || raw.includes("time")) return "date";
    if (raw.includes("cat") || raw.includes("type")) return "category";
    return "Skip";
  };

  const handleFileUpload = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    if (!selectedFile.name.endsWith(".csv")) {
      alert("Please upload a .csv file");
      return;
    }

    setFile(selectedFile);
    parseCSV(selectedFile);
  };

  const parseCSV = (csvFile) => {
    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      preview: 10, // Preview first 10 rows
      complete: (results) => {
        const headers = results.meta.fields || [];
        setParsedHeaders(headers);
        setParsedRows(results.data);

        // Auto-map headers initially
        const initialMappings = {};
        headers.forEach((h) => {
          initialMappings[h] = autoMapHeader(h);
        });
        setMappings(initialMappings);
      },
    });
  };

  const handleMappingChange = (header, targetColumn) => {
    setMappings((prev) => ({ ...prev, [header]: targetColumn }));
  };

  // Re-calculate preview mapping whenever mappings or raw rows change
  useEffect(() => {
    const mapped = parsedRows.map((row) => {
      const newRow = {};
      Object.keys(row).forEach((colHeader) => {
        const mappedKey = mappings[colHeader];
        if (mappedKey && mappedKey !== "Skip") {
          newRow[mappedKey] = row[colHeader];
        }
      });
      return newRow;
    });
    setPreviewData(mapped);
  }, [mappings, parsedRows]);

  const isValidRow = (row) => {
    // Basic frontend validations matching the backend rules
    const vendorOk = row.vendor_name && row.vendor_name.toString().trim() !== "";
    const amtClean = parseFloat(row.amount?.toString().replace(/[₹$,]/g, ""));
    const amountOk = !isNaN(amtClean) && amtClean > 0;
    const dateOk = row.date && !isNaN(new Date(row.date).getTime());

    return vendorOk && amountOk && dateOk;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const submitToServer = async () => {
    if (!file) return;

    setIsUploading(true);
    setUploadResult(null);

    const formData = new FormData();
    formData.append("transactions_file", file);

    try {
      // NOTE: User must be authenticated, we're assuming token is stored in localStorage here, modify if via cookies or auth-context
      const token = localStorage.getItem("token") || ""; 
      const response = await axios.post("/api/import/csv", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      setUploadResult({
        success: response.data.success,
        summary: response.data.summary,
        errors: response.data.errors || [],
      });
      
      if (response.data.success && onSuccess) {
        onSuccess(response.data.summary?.created || 0);
      }
    } catch (err) {
      setUploadResult({
        success: false,
        summary: null,
        errors: err.response?.data?.errors || [{ row: "Server", errors: [err.response?.data?.message || err.message] }],
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8 bg-white border border-gray-200 rounded-xl shadow-sm my-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Import Transactions</h2>
          <p className="text-sm text-gray-500 mt-1">Upload a CSV file to bulk import transactions.</p>
        </div>
      </div>

      {/* 1. Upload Section */}
      {!file && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 hover:bg-blue-50 transition-colors flex flex-col items-center justify-center relative bg-gray-50">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <UploadCloud className="h-10 w-10 text-gray-400 mb-4" />
          <p className="text-base font-medium text-gray-700">Click to upload or drag and drop</p>
          <p className="text-sm text-gray-500 mt-1">Only .csv files up to 10MB</p>
        </div>
      )}

      {/* File Info */}
      {file && (
        <div className="flex items-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <FileText className="h-6 w-6 text-blue-500 mr-3" />
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-900">{file.name}</p>
            <p className="text-xs text-blue-600">{formatFileSize(file.size)}</p>
          </div>
          <button 
            onClick={() => { setFile(null); setParsedRows([]); setUploadResult(null); }}
            className="text-blue-500 hover:text-blue-700 text-sm font-medium"
          >
            Change File
          </button>
        </div>
      )}

      {/* 3. Column Mapping */}
      {parsedHeaders.length > 0 && !uploadResult && (
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-gray-900 border-b pb-2">Map Columns</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
            {parsedHeaders.map((header) => (
              <div key={header} className="flex flex-col space-y-1">
                <label className="text-xs font-semibold text-gray-600 uppercase truncate" title={header}>
                  {header}
                </label>
                <select
                  value={mappings[header] || "Skip"}
                  onChange={(e) => handleMappingChange(header, e.target.value)}
                  className="bg-white border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full p-2"
                >
                  {MAPPABLE_COLUMNS.map((col) => (
                    <option key={col.value} value={col.value}>{col.label}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Preview Table */}
      {previewData.length > 0 && !uploadResult && (
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-gray-900 border-b pb-2">Data Preview (First 10 Rows)</h3>
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200 text-sm text-left">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Vendor Name</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {previewData.map((row, idx) => {
                  const valid = isValidRow(row);
                  return (
                    <tr key={idx} className={valid ? "hover:bg-gray-50" : "bg-red-50 hover:bg-red-100"}>
                      <td className="px-4 py-3">
                        {valid ? <CheckCircle className="h-4 w-4 text-green-500" /> : <AlertCircle className="h-4 w-4 text-red-500" />}
                      </td>
                      <td className="px-4 py-3 text-gray-900 truncate max-w-[200px]">{row.vendor_name || "-"}</td>
                      <td className="px-4 py-3 text-gray-900">{row.amount || "-"}</td>
                      <td className="px-4 py-3 text-gray-900">{row.date || "-"}</td>
                      <td className="px-4 py-3 text-gray-500">
                        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">{row.category || "-"}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. Upload Button */}
      {file && !uploadResult && (
        <div className="flex justify-end pt-4">
          <button
            onClick={submitToServer}
            disabled={isUploading}
            className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Importing...</span>
              </>
            ) : (
              <>
                <UploadCloud className="h-5 w-5" />
                <span>Upload Database</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* 7. Result Section */}
      {uploadResult && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className={`p-6 rounded-lg border flex flex-col items-center justify-center text-center space-y-3 
            ${uploadResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            
            {uploadResult.success ? (
              <CheckCircle className="h-12 w-12 text-green-500" />
            ) : (
              <XCircle className="h-12 w-12 text-red-500" />
            )}
            
            <div>
              <h3 className={`text-xl font-bold ${uploadResult.success ? 'text-green-800' : 'text-red-800'}`}>
                {uploadResult.success ? 'Import Complete!' : 'Import Failed'}
              </h3>
              
              {uploadResult.summary && (
                <div className="flex items-center justify-center space-x-6 mt-3 text-sm">
                   <div className="flex flex-col text-gray-700 font-medium">
                     <span className="text-xl font-bold text-gray-900">{uploadResult.summary.total}</span>
                     Rows Checked
                   </div>
                   <div className="w-px h-8 bg-gray-300"></div>
                   <div className="flex flex-col text-green-700 font-medium">
                     <span className="text-xl font-bold">{uploadResult.summary.created}</span>
                     Imported
                   </div>
                   <div className="w-px h-8 bg-gray-300"></div>
                   <div className="flex flex-col text-red-700 font-medium">
                     <span className="text-xl font-bold">{uploadResult.summary.failed}</span>
                     Errors
                   </div>
                   <div className="w-px h-8 bg-gray-300"></div>
                   <div className="flex flex-col text-orange-700 font-medium">
                     <span className="text-xl font-bold">{uploadResult.summary.skipped}</span>
                     Skipped (Dups)
                   </div>
                </div>
              )}
            </div>
          </div>

          {/* Failed rows detailed List */}
          {uploadResult.errors && uploadResult.errors.length > 0 && (
            <div className="bg-white border border-red-200 rounded-lg overflow-hidden">
               <div className="bg-red-50 px-4 py-3 border-b border-red-200">
                 <h4 className="flex items-center text-sm font-bold text-red-800">
                   <AlertCircle className="h-4 w-4 mr-2" />
                   Review Errors ({uploadResult.errors.length})
                 </h4>
               </div>
               <div className="max-h-60 overflow-y-auto">
                 <table className="min-w-full divide-y divide-red-100 text-sm">
                    <thead className="bg-red-50/50 text-red-700 font-semibold sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left">Row / Status</th>
                        <th className="px-4 py-2 text-left">Error Message</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {uploadResult.errors.map((err, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-red-600 font-mono whitespace-nowrap">
                            {err.row === -1 ? 'Database Duplicate' : `Row #${err.row}`}
                          </td>
                          <td className="px-4 py-3 text-gray-700">
                            <ul className="list-disc pl-4 space-y-1">
                               {err.errors.map((rmsg, j) => (
                                 <li key={j}>{rmsg}</li>
                               ))}
                            </ul>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                 </table>
               </div>
            </div>
          )}
          
          <div className="flex justify-center pt-2">
             <button 
                onClick={() => { setFile(null); setParsedRows([]); setUploadResult(null); }}
                className="text-blue-600 font-medium bg-blue-50 border border-blue-200 px-6 py-2 rounded-lg hover:bg-blue-100 transition"
             >
               Perform Another Upload
             </button>
          </div>
        </div>
      )}
    </div>
  );
}
