import { Link } from "@tanstack/react-router";
import { SITE } from "@/lib/site";
import { Mail, MapPin, Phone, ShieldCheck } from "lucide-react";

const legal = [
  { to: "/privacy-policy", label: "Privacy Policy" },
  { to: "/terms", label: "Terms & Conditions" },
  { to: "/refund-policy", label: "Refund Policy" },
  { to: "/cancellation-policy", label: "Cancellation Policy" },
  { to: "/shipping-policy", label: "Service Delivery" },
  { to: "/cookie-policy", label: "Cookie Policy" },
  { to: "/disclaimer", label: "Disclaimer" },
  { to: "/faqs", label: "FAQs" },
];

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground mt-24">
      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div className="md:col-span-1 space-y-4">
          <div className="text-xl font-display font-semibold tracking-tight">{SITE.shortName}</div>
          <p className="text-sm text-primary-foreground/70 leading-relaxed">
            {SITE.legalName} — a registered Pakistani travel management company specializing in global visa processing and religious tourism.
          </p>
          <div className="inline-flex items-center gap-2 text-xs bg-white/10 px-3 py-1.5 rounded-full">
            <ShieldCheck className="h-3.5 w-3.5" /> SECP Registered Entity
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-widest mb-4">Services</h4>
          <ul className="space-y-2.5 text-sm text-primary-foreground/70">
            <li><Link to="/visas" className="hover:text-primary-light">Visa Services</Link></li>
            <li><Link to="/umrah" className="hover:text-primary-light">Umrah Packages</Link></li>
            <li><Link to="/contact" className="hover:text-primary-light">Service Inquiry</Link></li>
            <li><Link to="/auth" className="hover:text-primary-light">Customer Account</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-widest mb-4">Legal</h4>
          <ul className="grid grid-cols-1 gap-2.5 text-sm text-primary-foreground/70">
            {legal.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="hover:text-primary-light">{l.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-widest mb-4">Contact</h4>
          <ul className="space-y-3 text-sm text-primary-foreground/70">
            <li className="flex gap-2"><MapPin className="h-4 w-4 mt-0.5 shrink-0" /><span>{SITE.address}</span></li>
            <li className="flex gap-2"><Phone className="h-4 w-4 mt-0.5 shrink-0" /><a href={`tel:${SITE.phoneIntl}`} className="hover:text-primary-light">{SITE.phone}</a></li>
            <li className="flex gap-2"><Mail className="h-4 w-4 mt-0.5 shrink-0" /><a href={`mailto:${SITE.email}`} className="hover:text-primary-light">{SITE.email}</a></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col md:flex-row justify-between gap-3 text-xs text-primary-foreground/60">
          <p>© {new Date().getFullYear()} {SITE.legalName}. All rights reserved.</p>
          <div className="flex gap-4">
            <span>🔒 SSL Encrypted</span>
            <span>JazzCash Integrated</span>
            <span>Easypaisa Ready</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
