"use client";

import React, { useState } from "react";
import axios from "axios";
import { CheckCircle, AlertCircle, RefreshCw } from "lucide-react";

export default function ManualEntryForm() {
  const initialFormState = {
    vendor_name: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    category: "IT",
    department: "",
    payment_method: "",
    invoice_number: "",
    description: "",
  };

  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [apiError, setApiError] = useState("");

  const validateField = (name, value) => {
    let error = "";

    if (name === "vendor_name") {
      if (!value.trim()) error = "Vendor Name is required";
      else if (value.length > 255) error = "Maximum 255 characters allowed";
    }

    if (name === "amount") {
      if (!value) error = "Amount is required";
      else if (parseFloat(value) <= 0) error = "Amount must be greater than 0";
    }

    if (name === "date") {
      if (!value) error = "Date is required";
      else {
        const selectedDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize to start of day
        if (selectedDate > today) error = "Date cannot be in the future";
      }
    }

    setErrors((prev) => ({ ...prev, [name]: error }));
    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    validateField(name, value);
    setApiError("");
    setSuccessMessage("");
  };

  // Check if form is valid overall for button disable state
  const isFormValid = () => {
    const isVendorValid = formData.vendor_name.trim().length > 0 && formData.vendor_name.length <= 255;
    const isAmountValid = formData.amount !== "" && parseFloat(formData.amount) > 0;
    const isDateValid = formData.date !== "" && new Date(formData.date) <= new Date();

    const hasNoErrors = !errors.vendor_name && !errors.amount && !errors.date;
    return isVendorValid && isAmountValid && isDateValid && hasNoErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Trigger validation on all fields
    const vendorErr = validateField("vendor_name", formData.vendor_name);
    const amountErr = validateField("amount", formData.amount);
    const dateErr = validateField("date", formData.date);

    if (vendorErr || amountErr || dateErr) return;

    setLoading(true);
    setApiError("");
    setSuccessMessage("");

    try {
      const token = localStorage.getItem("token") || "";
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount),
        // Send optional fields as null/undefined if empty, though strings are usually fine
      };

      await axios.post("/api/transactions", payload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      setSuccessMessage("Transaction added successfully");
    } catch (err) {
      setApiError(err.response?.data?.message || err.message || "Failed to add transaction");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData(initialFormState);
    setSuccessMessage("");
    setApiError("");
    setErrors({});
  };

  return (
    <div className="max-w-lg w-full mx-auto p-6 md:p-8 bg-white border border-gray-200 rounded-xl shadow-sm my-8">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">Add Transaction</h2>

      {successMessage ? (
        <div className="flex flex-col items-center justify-center p-6 bg-green-50 border border-green-200 rounded-lg space-y-4">
          <CheckCircle className="h-12 w-12 text-green-500" />
          <h3 className="text-lg font-medium text-green-800">{successMessage}</h3>
          <button
            onClick={handleReset}
            className="mt-2 bg-white text-green-700 border border-green-300 font-medium py-2 px-6 rounded-lg hover:bg-green-100 transition-colors shadow-sm"
          >
            Add Another
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Global API Error */}
          {apiError && (
            <div className="flex items-center space-x-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span>{apiError}</span>
            </div>
          )}

          {/* Vendor Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vendor Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="vendor_name"
              value={formData.vendor_name}
              onChange={handleChange}
              placeholder="e.g. AWS, Adobe"
              className={`w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow ${
                errors.vendor_name ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.vendor_name && <p className="mt-1 text-xs text-red-600">{errors.vendor_name}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                <input
                  type="number"
                  name="amount"
                  min="0.01"
                  step="0.01"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="0.00"
                  className={`w-full p-2.5 pl-7 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow ${
                    errors.amount ? "border-red-500" : "border-gray-300"
                  }`}
                />
              </div>
              {errors.amount && <p className="mt-1 text-xs text-red-600">{errors.amount}</p>}
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                max={new Date().toISOString().split("T")[0]}
                className={`w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow ${
                  errors.date ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.date && <p className="mt-1 text-xs text-red-600">{errors.date}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow bg-white"
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

            {/* Department */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow bg-white"
              >
                <option value="">Select Department</option>
                <option value="Engineering">Engineering</option>
                <option value="Sales">Sales</option>
                <option value="Marketing">Marketing</option>
                <option value="Admin">Admin</option>
                <option value="Support">Support</option>
                <option value="HR">HR</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
              <select
                name="payment_method"
                value={formData.payment_method}
                onChange={handleChange}
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow bg-white"
              >
                <option value="">Select Method</option>
                <option value="Card">Card</option>
                <option value="ACH">ACH</option>
                <option value="Check">Check</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Invoice Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Number</label>
              <input
                type="text"
                name="invoice_number"
                value={formData.invoice_number}
                onChange={handleChange}
                placeholder="e.g. INV-2026-X"
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
              >
              </input>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              placeholder="Enter brief description or note"
              className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow resize-none"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isFormValid() || loading}
            className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm mt-4"
          >
            {loading ? (
              <>
                <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                Adding...
              </>
            ) : (
              "Add Transaction"
            )}
          </button>
        </form>
      )}
    </div>
  );
}
