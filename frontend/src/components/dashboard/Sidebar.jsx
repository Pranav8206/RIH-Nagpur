"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShieldAlert,
  Tags,
  Lightbulb,
  Settings,
  LogOut,
  UploadCloud,
  Menu,
  X,
} from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import toast from "react-hot-toast";
import Image from "next/image";

const Sidebar = () => {
  const pathname = usePathname();
  const { logout } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
      window.location.href = "/login";
    } catch (error) {
      toast.error("Unable to logout");
    }
  };

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Import", href: "/import", icon: UploadCloud },
    { name: "Anomalies", href: "/anomalies", icon: ShieldAlert },
    { name: "Classifications", href: "/classifications", icon: Tags },
    { name: "Recommend", href: "/recommendations", icon: Lightbulb },
  ];

  return (
    <>
      {/* Desktop Compact Sidebar (Left) */}
      <div className="hidden md:flex flex-col w-20 bg-surface border-r border-border-light min-h-screen sticky top-0 md:h-screen">
        <div className="h-16 flex items-center justify-center border-b border-border-light">
          <Link
            href="/"
            className="flex items-center justify-center w-10 h-10 rounded-lg hover:scale-105 transition-transform"
          >
            <Image src="/logo.png" alt="Logo" width={40} height={40} />
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-2 space-y-2 flex flex-col no-scrollbar">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href || pathname?.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center justify-center space-y-1 py-3 px-1 rounded-xl transition-colors shrink-0 ${
                  isActive
                    ? "bg-primary-accent-light/30 text-primary-accent-dark"
                    : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                }`}
                title={item.name}
              >
                <item.icon className="w-[22px] h-[22px]" strokeWidth={1.5} />
                <span className="text-[10px] sm:text-[9px] font-medium text-center leading-tight tracking-wide">
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>

        <div className="p-2 border-t border-border-light flex flex-col space-y-2 pb-4">
          <button
            className="flex flex-col items-center justify-center py-3 rounded-xl text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
            title="Settings"
          >
            <Settings className="w-6 h-6 mb-1" strokeWidth={1.5} />
            <span className="text-[10px] font-medium">Settings</span>
          </button>
          <button
            onClick={handleLogout}
            className="flex flex-col items-center justify-center py-3 rounded-xl text-error hover:bg-red-50 transition-colors"
            title="Logout"
          >
            <LogOut className="w-6 h-6 mb-1" strokeWidth={1.5} />
            <span className="text-[10px] font-medium">Log out</span>
          </button>
        </div>
      </div>

      {/* Mobile Header (Top) */}
      <div className="md:hidden flex items-center justify-between w-full h-16 bg-surface px-4 border-b border-border-light sticky top-0 z-30 shadow-sm">
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary-accent rounded-lg flex items-center justify-center">
            <ShieldAlert className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-text-primary">
            Spend<span className="text-primary-accent">Shield</span>
          </span>
        </Link>
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 text-text-secondary hover:bg-surface-hover rounded-lg transition-colors focus:outline-none"
          aria-label="Open menu"
        >
          <Menu size={26} />
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Drawer (Right-to-Left) */}
      <div
        className={`fixed inset-y-0 right-0 w-64 bg-surface z-50 transform transition-transform duration-300 md:hidden flex flex-col shadow-2xl border-l border-border-light ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-border-light">
          <span className="font-semibold text-text-primary">Menu</span>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 text-text-secondary hover:bg-surface-hover rounded-lg transition-colors focus:outline-none"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href || pathname?.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${
                  isActive
                    ? "bg-primary-accent-light/30 text-primary-accent-dark font-semibold"
                    : "text-text-secondary hover:bg-surface-hover hover:text-text-primary font-medium"
                }`}
              >
                <item.icon className="w-[18px] h-[18px]" strokeWidth={2} />
                <span className="text-sm">{item.name}</span>
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-border-light space-y-1">
          <button className="flex w-full items-center space-x-3 px-4 py-3 rounded-xl font-medium text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors text-sm">
            <Settings className="w-[18px] h-[18px]" />
            <span>Settings</span>
          </button>
          <button
            onClick={() => {
              setIsOpen(false);
              handleLogout();
            }}
            className="flex w-full items-center space-x-3 px-4 py-3 rounded-xl font-medium text-error hover:bg-red-50 transition-colors text-sm"
          >
            <LogOut className="w-[18px] h-[18px]" />
            <span>Log out</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
