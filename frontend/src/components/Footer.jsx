"use client";
import React from "react";
import { usePathname } from "next/navigation";
import {
  Facebook,
  Twitter,
  Instagram,
  Mail,
  Phone,
  MapPin,
  ShieldAlert,
} from "lucide-react";
import Image from "next/image";

const Footer = () => {
  const pathname = usePathname();
  if (
    pathname?.match(/^\/(dashboard|anomalies|recommendations)/)
  )
    return null;

  return (
    <footer className="w-full">
      <div className="w-full mx-auto bg-surface shadow-sm border border-border-light p-6 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Image src="/logo.png" alt="Logo" width={40} height={40} />
              <span className="text-2xl font-bold text-text-primary tracking-tight">
                Spend<span className="text-primary-accent">Shield</span>
              </span>
            </div>
            <p className="text-text-tertiary leading-relaxed">
              Advanced algorithmic anomaly detection system built to protect
              your corporate expenditures and optimize financial recovery pools
              automatically.
            </p>
            <div className="flex gap-4">
              <div className="p-2 bg-background rounded-lg hover:bg-surface-hover transition-colors cursor-pointer">
                <Facebook size={20} className="text-text-secondary" />
              </div>
              <div className="p-2 bg-background rounded-lg hover:bg-surface-hover transition-colors cursor-pointer">
                <Instagram size={20} className="text-text-secondary" />
              </div>
              <div className="p-2 bg-background rounded-lg hover:bg-surface-hover transition-colors cursor-pointer">
                <Twitter size={20} className="text-text-secondary" />
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-text-primary mb-6">Explore</h4>
            <ul className="space-y-4 text-text-tertiary">
              <li className="hover:text-primary-accent-dark cursor-pointer transition-colors">
                Link 1
              </li>
              <li className="hover:text-primary-accent-dark cursor-pointer transition-colors">
                Link 2
              </li>
              <li className="hover:text-primary-accent-dark cursor-pointer transition-colors">
                Link 3
              </li>
              <li className="hover:text-primary-accent-dark cursor-pointer transition-colors">
                Link 4
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-bold text-text-primary mb-6">Support</h4>
            <ul className="space-y-4 text-text-tertiary">
              <li className="hover:text-primary-accent-dark cursor-pointer transition-colors">
                Help Center
              </li>
              <li className="hover:text-primary-accent-dark cursor-pointer transition-colors">
                Privacy Policy
              </li>
              <li className="hover:text-primary-accent-dark cursor-pointer transition-colors">
                Terms of Service
              </li>
              <li className="hover:text-primary-accent-dark cursor-pointer transition-colors">
                Trust & Safety
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-text-primary mb-6">Get in Touch</h4>
            <div className="space-y-4">
              <div className="flex items-start gap-3 text-text-tertiary">
                <MapPin
                  size={20}
                  className="text-primary-accent-dark shrink-0"
                />
                <span>Amravati, Maharashtra, India</span>
              </div>
              <div className="flex items-center gap-3 text-text-tertiary">
                <Phone
                  size={20}
                  className="text-primary-accent-dark shrink-0"
                />
                <span>+91 9876543210</span>
              </div>
              <div className="flex items-center gap-3 text-text-tertiary">
                <Mail size={20} className="text-primary-accent-dark shrink-0" />
                <span>support@project-name.com</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border-light flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-text-tertiary text-sm">
            © 2026 SpendShield. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
