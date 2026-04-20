"use client";

import { useEffect, useRef, useState } from "react";
import { Mail, Lock, Eye, EyeOff, Loader } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import toast from "react-hot-toast";
import ReCAPTCHA from "react-google-recaptcha";
import { useAppContext } from "@/context/AppContext";
import { motion } from "framer-motion";

const pageVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.38, ease: "easeOut", staggerChildren: 0.08 },
  },
};

const sectionVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.28, ease: "easeOut" },
  },
};

function SkeletonBlock({ className = "" }) {
  return (
    <motion.div
      className={`rounded-xl bg-slate-200/70 ${className}`}
      animate={{ opacity: [0.45, 0.95, 0.45] }}
      transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

function LoginSkeleton() {
  return (
    <div className="min-h-screen bg-background px-4 py-8 md:px-8 md:py-12">
      <div className="mx-auto grid min-h-[76vh] w-full max-w-7xl overflow-hidden rounded-4xl border border-border-light bg-background shadow-sm md:grid-cols-2">
        <div className="hidden md:block bg-slate-200/60" />
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
    </div>
  );
}

export default function LoginPage() {
  const captchaRef = useRef(null);
  const [isPageBootLoading, setIsPageBootLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaKey, setCaptchaKey] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const captchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "";
  const isCaptchaConfigured = Boolean(captchaSiteKey);

  const {
    loading,
    error,
    setLoading,
    setError,
    setAuth,
    apiBaseUrl,
    isAuthenticated,
    authReady,
  } = useAppContext();

  useEffect(() => {
    if (authReady && isAuthenticated) {
      router.replace("/");
    }
  }, [authReady, isAuthenticated, router]);

  useEffect(() => {
    const timer = setTimeout(() => setIsPageBootLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (authReady && isAuthenticated) {
    return null;
  }

  if (isPageBootLoading) {
    return <LoginSkeleton />;
  }

  const resetCaptcha = () => {
    setCaptchaToken("");
    captchaRef.current?.reset?.();
    setCaptchaKey((value) => value + 1);
  };

  return (
    <motion.div
      className="min-h-screen bg-background px-4 py-8 md:px-8 md:py-12"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div
        className="mx-auto grid min-h-[76vh] w-full max-w-7xl overflow-hidden rounded-4xl border border-border-light bg-background shadow-sm md:grid-cols-2"
        variants={sectionVariants}
      >
        <motion.aside
          className="relative hidden md:block"
          variants={sectionVariants}
        >
          <img
            src="/AuthPages/login.jpeg"
            alt="Login sidebar"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-br from-black/70 via-black/40 to-black/20" />
          <div className="absolute inset-0 flex flex-col justify-end p-10 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/80">
              SpendShield
            </p>
            <h1 className="font-editorial mt-3 text-5xl leading-tight">
              Welcome Back
            </h1>
            <p className="mt-4 max-w-md text-sm text-white/85">
              Sign in to manage your bookings and equipment.
            </p>
          </div>
        </motion.aside>

        <motion.section
          className="flex items-center bg-surface px-5 py-10 sm:px-10 md:px-12"
          variants={sectionVariants}
        >
          <div className="mx-auto w-full max-w-md">
            <motion.p
              className="text-xs font-semibold uppercase tracking-[0.14em] text-text-tertiary"
              variants={sectionVariants}
            >
              Login
            </motion.p>
            <motion.h2
              className="font-editorial mt-2 text-4xl text-text-primary"
              variants={sectionVariants}
            >
              Welcome back
            </motion.h2>
            <motion.p
              className="mt-2 text-sm text-text-secondary"
              variants={sectionVariants}
            >
              Sign in to manage your bookings and equipment.
            </motion.p>

            <motion.form
              className="mt-8 space-y-6"
              variants={sectionVariants}
              onSubmit={async (e) => {
                e.preventDefault();
                if (!isCaptchaConfigured) {
                  toast.error("reCAPTCHA is not configured.");
                  return;
                }

                if (!captchaToken) {
                  toast.error("Please complete reCAPTCHA.");
                  return;
                }

                setLoading(true);
                setError(null);

                try {
                  const response = await axios.post(
                    `${apiBaseUrl}/users/login`,
                    {
                      email,
                      password,
                      captchaToken,
                    },
                  );

                  const payload = response?.data?.data;
                  if (!response?.data?.success || !payload?.token) {
                    throw new Error(
                      response?.data?.message ||
                        "Login failed. Please try again.",
                    );
                  }

                  setAuth({ token: payload.token, user: payload.user });
                  toast.success("Login successful.");
                  resetCaptcha();
                  router.push("/");
                } catch (err) {
                  const message =
                    err?.response?.data?.message ||
                    err?.message ||
                    "Login failed. Please try again.";
                  setError(message);
                  toast.error(message);
                  resetCaptcha();
                } finally {
                  setLoading(false);
                }
              }}
            >
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-text-tertiary">
                  Email
                </label>
                <div className="relative">
                  <Mail
                    className="absolute left-0 top-1/2 -translate-y-1/2 text-text-tertiary"
                    size={18}
                  />
                  <input
                    type="email"
                    value={email}
                    placeholder="you@example.com"
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border-0 border-b border-border-light bg-transparent py-3 pl-7 pr-2 text-sm text-text-primary outline-none transition placeholder:text-text-tertiary/80 focus:border-secondary-accent"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-text-tertiary">
                  Password
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-0 top-1/2 -translate-y-1/2 text-text-tertiary"
                    size={18}
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    placeholder="Enter your password"
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border-0 border-b border-border-light bg-transparent py-3 pl-7 pr-9 text-sm text-text-primary outline-none transition placeholder:text-text-tertiary/80 focus:border-secondary-accent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <div className="mt-2 text-right">
                  <button
                    type="button"
                    className="text-xs font-medium text-secondary-accent hover:text-text-primary"
                  >
                    Forgot password?
                  </button>
                </div>
              </div>

              <div className="space-y-3 rounded-2xl">
                {isCaptchaConfigured ? (
                  <ReCAPTCHA
                    key={captchaKey}
                    ref={captchaRef}
                    sitekey={captchaSiteKey}
                    onChange={(value) => setCaptchaToken(value || "")}
                    onExpired={() => setCaptchaToken("")}
                  />
                ) : (
                  <div className="space-y-1">
                    <p className="text-sm text-amber-700">
                      reCAPTCHA is not configured.
                    </p>
                    <p className="text-xs text-text-tertiary">
                      Add NEXT_PUBLIC_RECAPTCHA_SITE_KEY in your frontend .env.
                    </p>
                  </div>
                )}
              </div>

              {error && (
                <div className="rounded-xl border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !isCaptchaConfigured}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-accent-dark disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading && <Loader size={16} className="animate-spin" />}
                {loading ? "Signing in..." : "Login"}
              </button>
            </motion.form>

            <motion.p
              className="mt-7 text-sm text-text-secondary"
              variants={sectionVariants}
            >
              Do not have an account?
              <Link
                href="/signup"
                className="ml-1 font-semibold text-secondary-accent hover:text-text-primary"
              >
                Sign up
              </Link>
            </motion.p>
          </div>
        </motion.section>
      </motion.div>
    </motion.div>
  );
}
