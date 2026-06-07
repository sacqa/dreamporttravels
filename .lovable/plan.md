# Plan — Production-ready upgrade (phased)

The full request (WordPress-style CMS + customer accounts + payment redesign + security audit + all bug fixes) is too large to ship safely in one go. I'll deliver it in 4 phases. Each phase is independently testable and you can pause/redirect between them.

## Phase 1 — Frontend cleanup + Payment UX (small)
- Remove JazzCash/Easypaisa branding from Header, Footer, Home, About, etc. Keep them ONLY on the checkout page.
- Replace checkout with clean "Choose payment method" buttons (JazzCash / Easypaisa / Bank Transfer / Cash). JazzCash button still calls the existing `initiateJazzCashPayment` server fn — if not configured, falls back to manual confirmation with clear messaging. Easypaisa = demo placeholder for now (manual confirm) until API is added.
- Order confirmation page polish.

## Phase 2 — Customer account area
- New `/account` route (protected via `_authenticated/` layout, integration-managed gate).
- Tabs: **Profile** (name, phone, edit), **Orders** (history with status), **Addresses** (saved CRUD), **Security** (change password).
- Add `/auth/forgot-password` + `/reset-password` flow using `supabase.auth.resetPasswordForEmail`.
- Header dropdown: "My Account / Orders / Sign out".
- New DB table `customer_addresses` (user_id FK, label, line1, city, phone, is_default) with RLS scoped to `auth.uid()`.

## Phase 3 — CMS-style admin (the big one)
A new `site_content` table (key/value JSONB) drives editable frontend content. Admin gets a **Site Content** tab with sections:
- **Homepage** — hero title/subtitle/CTA, featured services, testimonials list.
- **About / Contact / Footer** — editable rich text + contact details.
- **Banners** — promotional banner (text, link, enabled, color).
- **Categories** — for visas (Tourist/Business/Work) + Umrah (Economy/Standard/Premium).
- **App settings** — site name, support phone, WhatsApp, social links, SEO meta.
- **Checkout settings** — enable/disable each payment method, instructions text, terms.

Frontend reads from `site_content` via a single `useSiteContent()` hook (cached). Falls back to current hardcoded defaults if a key is missing — so nothing breaks during rollout.

Existing admin tabs (Orders, Visas, Umrah, Inquiries, Payments) remain; **Site Content** is added.

## Phase 4 — Security & polish
- Run security scanner, fix RLS gaps, tighten policies.
- Enable HIBP password check.
- Input validation (Zod) on all forms.
- Rate-limit AI image generation (per-admin throttle in DB).
- Final bug sweep: cart edge cases, mobile nav, broken links, console errors.
- PWA: verify manifest + service worker + offline fallback.

## Technical notes
- New tables (`customer_addresses`, `site_content`) created via migration with proper `GRANT` + RLS following project rules.
- All admin writes go through `has_role('admin')` policies (already deployed).
- `useSiteContent` uses TanStack Query with `staleTime: 5 min` to avoid hammering DB.
- No new external dependencies; reuses shadcn/ui, sonner, lucide-react.

## What I need from you
1. **Approve the plan** (or tell me which phases to drop/reorder).
2. **Phase order** — default is 1 → 2 → 3 → 4. Want a different order?
3. **Easypaisa**: confirm "demo button now, real API later" is OK.
4. After approval, I'll start with **Phase 1** (smallest, immediate visible cleanup) and check in before moving to Phase 2.
