import LoginPage from "@/components/Auth/LoginPage";
import React from "react";

export const metadata = {
  title: "Login | SpendShield ",
  description:
    "Login to access your personalized dashboard, manage your projects, and collaborate with your team. Enter your credentials to get started and unlock the full potential of SpendShield .",
};

export default function page() {
  return <LoginPage />;
}
