import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { AppProvider } from "@/context/AppContext";
import QueryProvider from "./QueryProvider";
import { Toaster } from "react-hot-toast";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: "Project Title",
  description:
    "Project description",
  keywords: [
    "project keyword 1",
    "project keyword 2",
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
