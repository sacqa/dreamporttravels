import { Link, useNavigate } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { useCartItems } from "@/lib/cart";
import { ShoppingBag, Menu, X, Phone, Shield, LogOut, LogIn } from "lucide-react";
import { useState } from "react";
import { SITE } from "@/lib/site";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const nav = [
  { to: "/", label: "Home" },
  { to: "/visas", label: "Visa Services" },
  { to: "/umrah", label: "Umrah Packages" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

export function Header() {
  const items = useCartItems();
  const count = items.reduce((s, i) => s + i.quantity, 0);
  const [open, setOpen] = useState(false);
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/" });
  }


  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="hidden md:flex items-center justify-between bg-primary text-primary-foreground px-6 py-1.5 text-xs">
        <div className="flex gap-5">
          <a href={`tel:${SITE.phoneIntl}`} className="flex items-center gap-1.5 hover:text-primary-light">
            <Phone className="h-3 w-3" /> {SITE.phone}
          </a>
          <span className="opacity-80">📍 {SITE.shortAddress}</span>
        </div>
        <div className="flex items-center gap-3 opacity-90">
          <span className="text-[10px] uppercase tracking-widest">Secure Payments:</span>
          <span className="text-[10px] font-bold">JazzCash</span>
          <span className="text-[10px] font-bold">Easypaisa</span>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-4">
        <Logo />
        <nav className="hidden lg:flex items-center gap-7">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="text-sm font-medium text-muted-foreground hover:text-accent transition-colors"
              activeProps={{ className: "text-accent" }}
              activeOptions={{ exact: n.to === "/" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            to="/cart"
            className="relative inline-flex items-center justify-center h-10 w-10 rounded-full hover:bg-muted transition-colors"
            aria-label="Cart"
          >
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {count}
              </span>
            )}
          </Link>
          {isAdmin && (
            <Link
              to="/admin"
              className="hidden sm:inline-flex items-center gap-1.5 bg-accent text-accent-foreground px-3 py-2 rounded-full text-xs font-semibold hover:opacity-90 transition"
              title="Admin Dashboard"
            >
              <Shield className="h-3.5 w-3.5" /> Admin
            </Link>
          )}
          {user ? (
            <button
              onClick={signOut}
              className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-accent px-2"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          ) : (
            <Link
              to="/auth"
              className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-accent px-2"
            >
              <LogIn className="h-4 w-4" /> Sign In
            </Link>
          )}
          <Link
            to="/visas"
            className="hidden sm:inline-flex bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-semibold hover:bg-primary-light transition-colors"
          >
            Apply Visa
          </Link>
          <button
            className="lg:hidden h-10 w-10 inline-flex items-center justify-center rounded-full hover:bg-muted"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="lg:hidden border-t border-border bg-background px-4 py-3 flex flex-col gap-1">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              onClick={() => setOpen(false)}
              className="px-3 py-2.5 rounded-md font-medium hover:bg-muted"
            >
              {n.label}
            </Link>
          ))}
          {isAdmin && (
            <Link to="/admin" onClick={() => setOpen(false)} className="px-3 py-2.5 rounded-md font-medium bg-accent/10 text-accent">
              🛡 Admin Dashboard
            </Link>
          )}
          {user ? (
            <button onClick={() => { setOpen(false); signOut(); }} className="px-3 py-2.5 rounded-md font-medium text-left hover:bg-muted">Sign out</button>
          ) : (
            <Link to="/auth" onClick={() => setOpen(false)} className="px-3 py-2.5 rounded-md font-medium hover:bg-muted">Sign in</Link>
          )}
        </nav>
      )}
    </header>
  );
}
            onClick={() => setOpen(!open)}
            aria-label="Menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="lg:hidden border-t border-border bg-background px-4 py-3 flex flex-col gap-1">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              onClick={() => setOpen(false)}
              className="px-3 py-2.5 rounded-md font-medium hover:bg-muted"
            >
              {n.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
