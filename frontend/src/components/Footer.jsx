import React from "react";
import {
  Facebook,
  Twitter,
  Instagram,
  Mail,
  Phone,
  MapPin,
  Tractor,
} from "lucide-react";

const Footer = () => {
  return (
    <footer className="w-full px-4 pb-6 mt-12">
      <div className="max-w-7xl mx-auto bg-surface rounded-3xl shadow-sm border border-border-light p-8 md:p-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Tractor className="text-success" size={28} />
              <span className="text-2xl font-bold text-text-primary">
                Project<span className="text-success">Name</span>
              </span>
            </div>
            <p className="text-text-tertiary leading-relaxed">
              Lorem ipsum dolor sit amet consectetur adipisicing elit. At praesentium earum repudiandae molestiae consequuntur illo aliquid consectetur saepe voluptas esse commodi dolorum dolorem nulla quas est quis, aut odit sit natus magnam. 
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
            © 2026 ProjectName. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-tertiary font-medium">
              Verified for:
            </span>
            <div className="bg-success/10 text-success text-xs px-3 py-1 rounded-full font-bold">
              Sustainable Farming
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
