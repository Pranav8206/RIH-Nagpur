"use client";
import React from 'react';
import { ArrowUpIcon, ArrowDownIcon, Activity } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

export default function KPICard({ 
  title, 
  value, 
  trend, 
  isPositiveTrend,
  isLoading,
  sparklineData = [], 
  hasAction = false,
  onActionClick
}) {
  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-10 bg-gray-50 rounded w-full"></div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col h-full">
      <h3 className="text-sm font-medium text-gray-500 mb-1">{title}</h3>
      <div className="flex items-end space-x-2 mb-4">
        <span className="text-3xl font-bold text-gray-900">{value}</span>
        {trend !== undefined && (
          <span className={`flex items-center text-sm font-medium ${isPositiveTrend ? 'text-green-600' : 'text-red-500'}`}>
            {isPositiveTrend ? <ArrowUpIcon className="w-4 h-4 mr-1" /> : <ArrowDownIcon className="w-4 h-4 mr-1" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>

      <div className="flex-grow"></div>

      <div className="h-12 w-full mt-2">
        {sparklineData && sparklineData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparklineData}>
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={isPositiveTrend !== false ? "#10b981" : "#ef4444"} 
                strokeWidth={2} 
                dot={false} 
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-300">
             <Activity className="w-5 h-5 opacity-50" />
          </div>
        )}
      </div>

      {hasAction && (
        <button 
          onClick={onActionClick}
          className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors focus:ring-4 focus:ring-blue-100 shadow-sm"
        >
          Recover Now
        </button>
      )}
    </div>
  );
}
