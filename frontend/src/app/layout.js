import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { AppProvider } from "@/context/AppContext";
import QueryProvider from "./QueryProvider";
import { Toaster } from "react-hot-toast";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: "SpendShield - AI-Powered Expense Management",
  description:
    "SpendShield is an AI-powered expense management platform that helps you track, analyze, and optimize your spending.",
  keywords: [
    "SpendShield",
    "Expense Management",
    "AI-Powered",
    "Expense Tracking",
    "Expense Analysis",
    "Expense Optimization",
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className="min-h-screen bg-background text-text-primary flex flex-col"
        suppressHydrationWarning
      >
        <QueryProvider>
          <AppProvider>
            <Navbar />
            <main className="grow">{children}</main>
            <Footer />
            <Toaster />
          </AppProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
