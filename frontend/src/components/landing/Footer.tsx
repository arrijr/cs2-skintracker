// /frontend/src/components/landing/Footer.tsx — [Frontend]
// {/* Footer for Landing Page */}
"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Mail,
  Twitter,
  Youtube,
  Github,
  Shield,
  Heart
} from "lucide-react";

const footerLinks = {
  product: [
    { name: "Features", href: "#features" },
    { name: "Pricing", href: "#pricing" },
    { name: "API", href: "/docs/api" },
    { name: "Changelog", href: "/docs/changelog" }
  ],
  company: [
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
    { name: "Blog", href: "/blog" },
    { name: "Careers", href: "/careers" }
  ],
  legal: [
    { name: "Terms of Service", href: "/legal/terms" },
    { name: "Privacy Policy", href: "/legal/privacy" },
    { name: "Refund Policy", href: "/legal/refund" }
  ],
  support: [
    { name: "Help Center", href: "/help" },
    { name: "FAQ", href: "/faq" },
    { name: "Status", href: "/status" }
  ]
};

const socialLinks = [
  { name: "Twitter", href: "https://twitter.com/skintracker", icon: Twitter, color: "text-blue-400 hover:text-blue-300" },
  { name: "YouTube", href: "https://youtube.com/@skintracker", icon: Youtube, color: "text-red-400 hover:text-red-300" },
  { name: "GitHub", href: "https://github.com/skintracker", icon: Github, color: "text-slate-400 hover:text-slate-300" }
];

export default function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-slate-800">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          
          {/* Main Footer Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
            
            {/* Brand Column */}
            <div className="lg:col-span-2 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-brand-green to-brand-blue rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">CS</span>
                  </div>
                  <span className="text-white font-bold text-xl">SKINTRACKR</span>
                </div>
                <p className="text-slate-300 leading-relaxed max-w-md">
                  The ultimate CS2 skin price tracker. Monitor your portfolio, 
                  set alerts, and never miss a profitable trade again.
                </p>
              </div>

              {/* Social Links */}
              <div className="space-y-4">
                <h3 className="text-white font-semibold">Follow us</h3>
                <div className="flex space-x-4">
                  {socialLinks.map((social) => {
                    const Icon = social.icon;
                    return (
                      <Link
                        key={social.name}
                        href={social.href}
                        className={`p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors duration-200 ${social.color}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Icon className="h-5 w-5" />
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Link Columns */}
            <div className="space-y-6">
              <h3 className="text-white font-semibold">Product</h3>
              <ul className="space-y-3">
                {footerLinks.product.map((link) => (
                  <li key={link.name}>
                    <Link 
                      href={link.href} 
                      className="text-slate-300 hover:text-white transition-colors duration-200"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-6">
              <h3 className="text-white font-semibold">Company</h3>
              <ul className="space-y-3">
                {footerLinks.company.map((link) => (
                  <li key={link.name}>
                    <Link 
                      href={link.href} 
                      className="text-slate-300 hover:text-white transition-colors duration-200"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-6">
              <h3 className="text-white font-semibold">Support</h3>
              <ul className="space-y-3">
                {footerLinks.support.map((link) => (
                  <li key={link.name}>
                    <Link 
                      href={link.href} 
                      className="text-slate-300 hover:text-white transition-colors duration-200"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* CTA Section */}
          <div className="border-t border-slate-800 pt-12 mb-8">
            <div className="text-center space-y-6">
              <h3 className="text-2xl sm:text-3xl font-bold text-white">
                Ready to track your skins?
              </h3>
              <p className="text-slate-300 text-lg max-w-2xl mx-auto">
                Join thousands of traders who are already maximizing their CS2 skin profits.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  className="bg-brand-green hover:bg-brand-green/90 text-white px-8 py-4 text-lg font-semibold btn-enhanced"
                  asChild
                >
                  <Link href="/sign-up">
                    Create your free account
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <Shield className="h-4 w-4" />
                  <span>No credit card required</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-slate-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <span>© 2026 SkinTrackr. Made with</span>
                <Heart className="h-4 w-4 text-brand-red" />
                <span>for the CS2 community.</span>
              </div>
              
              <div className="flex items-center gap-6 text-sm">
                {footerLinks.legal.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    className="text-slate-400 hover:text-white transition-colors duration-200"
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
