import LoginPage from "@/components/Auth/LoginPage";
import React from "react";

export const metadata = {
  title: "Login | ProjectName",
  description:
    "Login to access your personalized dashboard, manage your projects, and collaborate with your team. Enter your credentials to get started and unlock the full potential of ProjectName.",
};

export default function page() {
  return <LoginPage />;
}
