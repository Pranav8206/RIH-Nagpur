import React from 'react';
import Sidebar from '@/components/dashboard/Sidebar';

export default function AppLayout({ children }) {
    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-background">
            <Sidebar />
            <div className="flex-1 w-full overflow-x-hidden">
                {children}
            </div>
        </div>
    );
}
