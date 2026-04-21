"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { List } from "lucide-react";

export default function PageHeader({ 
  title, 
  subtitle, 
  icon: Icon, 
  actions,
  showViewTransactions = true 
}) {
  const router = useRouter();

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center">
          {Icon && <Icon className="w-6 h-6 mr-2 text-primary-accent" />}
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-text-secondary mt-1 font-medium">
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {showViewTransactions && (
          <button
            onClick={() => router.push("/import")}
            className="flex items-center gap-2 text-sm font-semibold text-white bg-primary-accent border border-primary-accent-dark/50 px-4 py-2 rounded-lg hover:bg-primary-accent-dark transition shadow-sm"
          >
            <List className="w-4 h-4" />
            View All Transactions
          </button>
        )}
        {actions}
      </div>
    </div>
  );
}
