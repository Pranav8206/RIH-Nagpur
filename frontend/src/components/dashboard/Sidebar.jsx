"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  ShieldAlert, 
  Tags, 
  Lightbulb, 
  Settings, 
  LogOut 
} from 'lucide-react';
import { useAppContext } from "@/context/AppContext";
import toast from "react-hot-toast";

const Sidebar = () => {
    const pathname = usePathname();
    const { logout } = useAppContext();

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
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Anomalies', href: '/anomalies', icon: ShieldAlert },
        { name: 'Classifications', href: '/classifications', icon: Tags },
        { name: 'Recommendations', href: '/recommendations', icon: Lightbulb },
    ];

    return (
        <div className="hidden md:flex flex-col w-64 bg-surface border-r border-border-light min-h-screen sticky top-0 md:h-screen">
            <div className="h-16 flex items-center px-6 border-b border-border-light">
                <Link href="/" className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-primary-accent rounded-lg flex items-center justify-center shadow-md">
                        <ShieldAlert className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-text-primary">
                        Expense<span className="text-primary-accent">Guard</span>
                    </span>
                </Link>
            </div>
            
            <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
                {navigation.map((item) => {
                    const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${
                                isActive 
                                    ? 'bg-primary-accent-light/30 text-primary-accent-dark' 
                                    : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                            }`}
                        >
                            <item.icon className={`w-5 h-5 ${isActive ? 'text-primary-accent' : 'text-text-tertiary'}`} />
                            <span>{item.name}</span>
                        </Link>
                    )
                })}
            </div>

            <div className="p-4 border-t border-border-light">
                <button
                    className="flex w-full items-center space-x-3 px-3 py-2.5 rounded-lg font-medium text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
                >
                    <Settings className="w-5 h-5 text-text-tertiary" />
                    <span>Settings</span>
                </button>
                <button
                    onClick={handleLogout}
                    className="flex w-full items-center space-x-3 px-3 py-2.5 rounded-lg font-medium text-error hover:bg-red-50 transition-colors mt-1"
                >
                    <LogOut className="w-5 h-5 text-error" />
                    <span>Log out</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
