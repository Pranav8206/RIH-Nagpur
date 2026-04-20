"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader } from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import toast from "react-hot-toast";

export default function ProtectedRoute({ children }) {
  const router = useRouter();
  const { authReady, token } = useAppContext();
  const isAuthenticated = Boolean(token);

  useEffect(() => {
    if (authReady && !isAuthenticated) {
      toast.error("Login to proceed");
      router.replace("/login");
    }
  }, [authReady, isAuthenticated, router]);

  if (!authReady) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader size={50} className="animate-spin text-primary-accent-dark" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return children;
}
