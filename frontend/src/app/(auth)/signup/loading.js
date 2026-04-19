"use client";

import { motion } from "framer-motion";

function SkeletonBlock({ className = "" }) {
  return (
    <motion.div
      className={`rounded-xl bg-slate-200/70 ${className}`}
      animate={{ opacity: [0.45, 0.95, 0.45] }}
      transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

export default function SignupLoading() {
  return (
    <div className="min-h-screen bg-background px-4 py-8 md:px-8 md:py-10">
      <div className="mx-auto grid min-h-[90vh] w-full max-w-7xl overflow-hidden rounded-4xl border border-border-light bg-background shadow-sm md:grid-cols-2">
        <div className="relative hidden md:block bg-slate-200/60" />

        <div className="flex items-center bg-surface px-5 py-10 sm:px-10 md:px-12">
          <div className="mx-auto w-full max-w-md space-y-4">
            <SkeletonBlock className="h-3 w-28" />
            <SkeletonBlock className="h-9 w-52" />
            <SkeletonBlock className="h-4 w-72 max-w-full" />

            <div className="mt-6 rounded-2xl border border-border-light bg-background/60 p-5 space-y-4">
              <SkeletonBlock className="h-11 w-full" />
              <SkeletonBlock className="h-11 w-full" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SkeletonBlock className="h-11" />
                <SkeletonBlock className="h-11" />
              </div>
              <SkeletonBlock className="h-20 w-full" />
              <SkeletonBlock className="h-10 w-full" />
              <SkeletonBlock className="h-11 w-full" />
            </div>

            <SkeletonBlock className="h-4 w-44" />
          </div>
        </div>
      </div>
    </div>
  );
}
