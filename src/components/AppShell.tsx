import type { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { WhatsAppButton } from "./WhatsAppButton";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <section className="hero-gradient border-b border-border">
      <div className="max-w-7xl mx-auto px-6 py-16 md:py-24 text-center">
        {eyebrow && (
          <span className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-accent mb-4">
            {eyebrow}
          </span>
        )}
        <h1 className="text-4xl md:text-5xl font-display font-semibold text-foreground leading-tight max-w-3xl mx-auto">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto text-lg">{subtitle}</p>
        )}
      </div>
    </section>
  );
}
