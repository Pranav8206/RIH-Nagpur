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

export default function LoginLoading() {
  return (
    <motion.div
      className="min-h-screen bg-background px-4 py-8 md:px-8 md:py-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
    >
      <div className="mx-auto grid min-h-[76vh] w-full max-w-7xl overflow-hidden rounded-4xl border border-border-light bg-background shadow-sm md:grid-cols-2">
        <motion.div
          className="hidden md:block bg-slate-200/60"
          initial={{ opacity: 0.6 }}
          animate={{ opacity: [0.6, 0.8, 0.6] }}
          transition={{ duration: 1.3, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="flex items-center bg-surface px-5 py-10 sm:px-10 md:px-12">
          <div className="mx-auto w-full max-w-md space-y-5">
            <SkeletonBlock className="h-3 w-24" />
            <SkeletonBlock className="h-9 w-48" />
            <SkeletonBlock className="h-4 w-72 max-w-full" />
            <SkeletonBlock className="mt-5 h-11 w-full" />
            <SkeletonBlock className="h-11 w-full" />
            <SkeletonBlock className="h-20 w-full" />
            <SkeletonBlock className="h-11 w-full" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}