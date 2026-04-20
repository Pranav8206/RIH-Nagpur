"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  ArrowRight, 
  ShieldCheck, 
  ActivitySquare, 
  PieChart, 
  Lock, 
  Zap,
  TrendingDown
} from "lucide-react";

export default function Home() {
  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-text-primary font-sans overflow-x-hidden">
      
      {/* Hero Section */}
      <section className="relative pt-24 pb-20 md:pt-32 md:pb-32 px-4 sm:px-6 lg:px-8">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[400px] bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center relative z-10">
          
          {/* Hero Content */}
          <motion.div 
            initial="hidden" 
            animate="visible" 
            variants={staggerContainer}
            className="flex flex-col max-w-2xl"
          >
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-accent-light/50 border border-primary-accent-light text-primary-accent-dark text-sm font-semibold mb-6 w-max shadow-sm backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-accent opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-accent-dark"></span>
              </span>
              Next-Gen Anomaly Detection
            </motion.div>

            <motion.h1 variants={fadeUp} className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-text-primary leading-[1.1] mb-6">
              Stop Expense <br className="hidden md:block"/>
              Leakage with <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-accent to-secondary-accent">Precision.</span>
            </motion.h1>

            <motion.p variants={fadeUp} className="text-lg md:text-xl text-slate-600 mb-10 leading-relaxed font-medium">
              Protect your corporate expenditures with AI-powered monitoring algorithms. Instantly identify rogue spending, optimize financial recovery pools, and secure your bottom line natively.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4">
              <Link href="/dashboard" className="px-8 py-4 rounded-xl bg-gradient-to-r from-primary-accent to-primary-accent-dark text-surface font-bold text-lg hover:shadow-lg hover:shadow-primary-accent/30 transition-all flex items-center justify-center gap-2 group hover:scale-[1.02] active:scale-[0.98]">
                Access Dashboard
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button className="px-8 py-4 rounded-xl bg-white border border-slate-200 text-slate-800 font-bold text-lg hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm flex items-center justify-center">
                View Documentation
              </button>
            </motion.div>
          </motion.div>

          {/* Hero Image */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="relative lg:ml-auto w-full max-w-[600px] xl:max-w-[700px] aspect-[4/3]"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-indigo-500/20 rounded-3xl blur-2xl transform -rotate-6" />
            <div className="relative h-full w-full rounded-3xl overflow-hidden border border-slate-200/50 shadow-2xl bg-white/50 backdrop-blur-sm p-2">
              <Image 
                src="/hero-dashboard.png" 
                alt="ExpenseGuard Dashboard Preview"
                fill
                priority
                className="object-cover rounded-2xl shadow-inner"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white border-y border-slate-200 py-12">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-around gap-8 text-center divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
            {[
              { label: "Active Monitors", value: "24/7" },
              { label: "Recovery Yield", value: "98.4%" },
              { label: "Protected Spend", value: "$12B+" },
              { label: "False Positives", value: "< 0.1%" },
            ].map((stat, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col flex-1 pt-6 sm:pt-0"
              >
                <div className="text-4xl font-extrabold text-primary-accent mb-2">{stat.value}</div>
                <div className="text-sm font-semibold text-text-secondary uppercase tracking-wider">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="max-w-[1400px] mx-auto relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Enterprise-grade capabilities out of the box</h2>
            <p className="text-lg text-slate-600">We leverage multi-layered algorithmic heuristics to flag bad actors before financial closure occurs.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: ShieldCheck,
                title: "Vendor Integrity Engine",
                desc: "Automatically cross-references vendor matrices against global fraud registries and internal blacklists."
              },
              {
                icon: ActivitySquare,
                title: "Real-time Detection",
                desc: "Monitor transaction pipelines continuously to detect anomalous spending patterns within milliseconds."
              },
              {
                icon: TrendingDown,
                title: "Waste Reduction",
                desc: "Identify duplicate invoices and operational overlaps to instantly build recovery pools."
              },
              {
                icon: PieChart,
                title: "Departmental Insights",
                desc: "Granular visibility into how individual cost centers are performing against standard deviations."
              },
              {
                icon: Zap,
                title: "Automated Workflows",
                desc: "Set automatic freeze actions via integrations whenever severe threshold anomalies trigger."
              },
              {
                icon: Lock,
                title: "Bank-level Security",
                desc: "All financial telemetry is processed locally within segmented secure enclaves."
              }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="group p-8 rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary-accent-light/30 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary-accent transition-all duration-300">
                  <feature.icon className="w-7 h-7 text-primary-accent group-hover:text-surface transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-text-primary mb-3">{feature.title}</h3>
                <p className="text-text-secondary leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Modern CTA */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1200px] mx-auto">
          <div className="relative rounded-[2.5rem] bg-slate-900 overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-900/40 to-indigo-900/40 mix-blend-overlay" />
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/20 blur-3xl rounded-full" />
            
            <div className="relative z-10 px-8 py-16 md:py-20 md:px-16 flex flex-col md:flex-row items-center justify-between gap-10">
              <div className="max-w-xl text-center md:text-left">
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Ready to secure your expenditure?</h2>
                <p className="text-blue-100 text-lg sm:text-xl opacity-90 mb-0">
                  Join hundreds of financial control teams leveraging ExpenseGuard today.
                </p>
              </div>
              <div className="shrink-0 flex gap-4 w-full md:w-auto">
                <Link href="/dashboard" className="w-full md:w-auto px-8 py-4 rounded-xl bg-white text-slate-900 font-bold text-lg hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all flex items-center justify-center gap-2 group">
                  Open Engine
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
