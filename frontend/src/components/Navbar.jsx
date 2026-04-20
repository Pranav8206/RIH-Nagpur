"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Menu,
  X,
  ShieldAlert,
  ArrowRight,
  LayoutDashboard,
  Wrench,
  CalendarCheck2,
  Settings,
  LogOut,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import toast from "react-hot-toast";
import Image from "next/image";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showCtaText, setShowCtaText] = useState(false);
  const [menuActionLoading, setMenuActionLoading] = useState(false);
  const dropdownRef = useRef(null);
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, authReady, logout, deleteAccount } =
    useAppContext();

  // Move the pathname check AFTER all hooks (not before return)
  const shouldHideNavbar = pathname?.match(
    /^\/(dashboard|anomalies|classifications|recommendations|import)/,
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowCtaText(true);
    }, 900);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const ctaLabel = isAuthenticated ? "Dashboard" : "Get Started";

  const avatarContent = useMemo(() => {
    if (user?.profilePic) {
      return (
        <Image
          src={user.profilePic}
          alt={user?.fullName || "Profile"}
          className="h-10 w-10 rounded-full object-cover"
        />
      );
    }

    const firstLetter = user?.fullName?.charAt(0)?.toUpperCase() || "U";
    return (
      <span className="text-sm font-bold text-text-secondary">
        {firstLetter}
      </span>
    );
  }, [user]);

  const handleCtaClick = () => {
    if (isAuthenticated) {
      router.push("/dashboard");
      return;
    }
    toast.error("Login to proceed");
    router.push("/signup");
  };

  const handleLogout = async () => {
    setMenuActionLoading(true);
    try {
      await logout();
      setIsMenuOpen(false);
      toast.success("Logged out successfully");
      router.push("/login");
    } catch (error) {
      toast.error("Unable to logout right now");
    } finally {
      setMenuActionLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "Delete your account permanently? This action cannot be undone.",
    );
    if (!confirmed) return;

    setMenuActionLoading(true);
    try {
      await deleteAccount();
      setIsMenuOpen(false);
      toast.success("Account deleted successfully");
      router.push("/signup");
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to delete account";
      toast.error(message);
    } finally {
      setMenuActionLoading(false);
    }
  };

  // Return early AFTER all hooks, not before
  if (shouldHideNavbar) return null;

  return (
    <nav className="sticky top-0 z-50 w-full bg-background border-b border-border-light shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-3">
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 cursor-pointer">
            <Image src="/logo.png" alt="Logo" width={40} height={40} />
            <span className="text-2xl font-bold text-text-primary tracking-tight">
              Spend<span className="text-primary-accent">Shield</span>
            </span>
          </Link>

          {/* Desktop CTA + Profile */}
          <div
            className="relative hidden items-center gap-3 md:flex"
            ref={dropdownRef}
          >
            {authReady && isAuthenticated && (
              <button
                onClick={() => setIsMenuOpen((prev) => !prev)}
                className="grid h-11 w-11 place-items-center rounded-full border border-border-light bg-surface/90 shadow-sm transition hover:border-border-light"
                aria-label="Open user menu"
              >
                {avatarContent}
              </button>
            )}
            <button
              onClick={handleCtaClick}
              className="inline-flex cursor-pointer min-w-44 items-center justify-center gap-2 rounded-xl bg-primary-accent px-5 py-2 font-semibold text-text-primary shadow-sm transition-all hover:bg-primary-accent-dark active:scale-95"
            >
              {authReady && showCtaText ? (
                <>
                  <span className="text-white">{ctaLabel}</span>
                  <ArrowRight size={16} className="text-white" />
                </>
              ) : (
                <span className="inline-block h-6 w-33 animate-pulse rounded bg-primary-accent-light/70" />
              )}
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 top-14 w-56 rounded-2xl border border-border-light bg-surface p-2 shadow-xl">
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    router.push("/user/place1");
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium text-text-secondary hover:bg-surface-hover"
                >
                  <LayoutDashboard size={16} />
                  <span>Place1</span>
                </button>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    router.push("/user/place1");
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium text-text-secondary hover:bg-surface-hover"
                >
                  <Wrench size={16} />
                  <span>Place2</span>
                </button>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    router.push("/user/place2");
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium text-text-secondary hover:bg-surface-hover"
                >
                  <CalendarCheck2 size={16} />
                  <span>Place3</span>
                </button>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    router.push("/user/place4");
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium text-text-secondary hover:bg-surface-hover"
                >
                  <Settings size={16} />
                  <span>Settings</span>
                </button>
                <div className="my-1 border-t border-border-light" />
                <button
                  onClick={handleLogout}
                  disabled={menuActionLoading}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium text-text-secondary hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={menuActionLoading}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium text-red-500 hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Trash2 size={16} />
                  <span>Delete Account</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-text-secondary focus:outline-none"
            >
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isOpen && (
          <div className="md:hidden mt-4 pb-4 space-y-4 animate-in slide-in-from-top duration-200">
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  setIsOpen(false);
                  handleCtaClick();
                }}
                className="w-full rounded-xl bg-primary-accent py-3 font-semibold text-text-primary"
              >
                {authReady && showCtaText ? ctaLabel : "Please wait..."}
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsMenuOpen((prev) => !prev);
                }}
                className="w-full rounded-xl border border-border-light py-3 font-medium text-text-secondary"
              >
                Open Menu
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
