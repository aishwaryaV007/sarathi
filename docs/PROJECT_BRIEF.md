# SARATHI — Complete Project Brief & Build Guide
### The one document that explains everything. Give this to Antigravity as context. Keep it in the repo root.

> **Read this first, in full.** It explains what we are building, why, the tech
> stack, what already exists, what remains, and the rules to follow. Do not
> assume prior context — everything you need is here.

---

## 0. ONE-LINE SUMMARY

Sarathi is a web app that helps any entrepreneur in India discover **exactly
which government approvals/licences their business needs**, explained in plain
language, each **backed by the actual law**, with one-place applying, document
reuse, and status tracking — so they never need to pay a middle-man agent.

---

## 1. THE PROBLEM WE ARE SOLVING

This project is built for **Smart India Hackathon 2026, Problem Statement
26130**, issued by the Government of Maharashtra / Maharashtra State Innovation
Society. Title: *"Efficiency in streamlining industrial approvals, compliance
processes, and access to government support services."*

**The real-world problem:** When someone wants to start a business or factory in
India (say a water plant, a rice mill, a pharmacy), they need **8–15 different
government approvals** from **different departments** — pollution board, fire
department, labour department, FSSAI, GST, factory licence, and more. The exact
set depends on the business type, location, size, and number of workers.

Ordinary people **do not know**:
- which approvals apply to *their specific* business,
- what documents each one needs,
- where and in what order to apply.

So they either get confused and rejected, or they **pay agents ₹5,000–₹25,000
per licence** to figure it out. Government portals exist (see §2) but they are
**submission counters** — you must already know what to apply for. They don't
*guide* you.

**What the problem statement asks for:** a unified, intelligent solution that
generates a customised approval checklist, guides documentation, pre-validates
submissions, reuses verified data, coordinates parallel departmental workflows,
tracks timelines, and provides one dashboard for applications, approvals,
renewals, and incentives.

---

## 2. EXISTING SOLUTIONS & WHY OURS IS DIFFERENT

**Existing government portals:** TG-iPASS (Telangana), MAITRI 2.0 (Maharashtra),
NSWS (national). These let you *submit and track* applications in one place, but
they assume you already know which approvals you need. NSWS's own site says it is
"for guidance purpose only."

**Existing private tools:** TeamLease RegTech, Simpliance — paid, enterprise-only,
and they handle *ongoing compliance*, not the *initial setup journey*.

**Our differentiation (this is the heart — protect it in every design choice):**
1. **Plain-language understanding** — user describes the business in their own
   words; we discover the requirements. Existing portals make the user search.
2. **Statute-cited output** — every approval on the checklist shows the exact law
   that requires it. Verifiable, never a guess. (This is our #1 unique feature.)
3. **Guide + apply + track in one place**, with **one-time document upload reused
   everywhere**.
4. **Works for ANY business type** — small kirana to a Pvt Ltd factory.
5. **Free** — replaces the paid liaison agent for the small first-time entrepreneur.

International proof this model works: **Singapore's GoBusiness "Licence e-Adviser"**
does intent-questionnaire → tailored licence checklist. We bring that to India.

---

## 3. HOW THE APP WORKS (the user flow — 6 screens)

1. **Home** — explains the product; CTA "Start my approval journey."
2. **Login** — email sign-in (Supabase auth).
3. **Describe** — user types their business in plain language + location, then
   answers a few follow-up questions (investment, workers, power, food,
   premises, groundwater).
4. **Checklist** — THE WOW SCREEN. Shows the computed, statute-cited approval
   list + summary tiles (MSME category, pollution category, Factories Act, count)
   + document-vault sidebar + matched incentives.
5. **Apply** — pre-filled application for one approval; documents reused from the
   vault; a pre-submit validation check; "submitted" success.
6. **Documents** — the vault: PAN/Aadhaar/etc. uploaded once, reused everywhere.
7. **Dashboard** — tracks submitted applications with status + SLA timers +
   renewal reminders.

---

## 4. TECH STACK (verified current, Sept 2026)

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript 5.
- **Styling:** Tailwind CSS v4 (config in `globals.css` via `@theme`, OKLCH
  colors — NOT the old `tailwind.config.js` model), shadcn/ui components, Public
  Sans + Source Serif 4 fonts, lucide-react icons.
- **Backend logic:** Next.js API routes (`app/api/**/route.ts`) in TypeScript.
- **The "brain":** a rules engine in `lib/rules-engine.ts` (plain TypeScript).
- **Database + Auth + Storage:** Supabase (Postgres + pgvector + Auth + Storage).
- **AI layer:** Vercel AI SDK (`ai` package) → Groq (Llama 3.3 70B) for
  plain-language understanding, with a keyword fallback so the app works with no
  API key. Optional: Google Gemini 2.5 Flash for document reading later.
- **Validation:** Zod (structured LLM output + form validation).
- **Deploy:** Vercel.

**IMPORTANT — do NOT train any ML model.** We use a hosted LLM only to *read the
user's sentence*. The checklist itself is produced by our rules engine + curated
dataset, never by the LLM. This keeps outputs accurate and verifiable.

---

## 5. ARCHITECTURE

```
  Frontend pages (app/*/page.tsx)
        │  user types business → answers questions
        ▼
  /api/understand  ── LLM (Groq) or keyword fallback ──► structured facts
        │
        ▼
  /api/checklist  ── lib/rules-engine.ts ─────────────► the checklist
        │              (uses data/approvals/*.json)
        ▼
  Supabase  ── stores: user, documents (vault), projects, applications
```

- **Two kinds of "backend":** (a) LOGIC = the rules engine + API routes (decides
  the checklist); (b) STORAGE = Supabase (saves user, documents, applications).
- **The LLM only translates the sentence into facts.** It does NOT decide
  approvals. The engine + dataset decide approvals. This is deliberate.

---

## 6. THE DATA MODEL

**BusinessProfile** (built from the Describe answers; sent to /api/checklist):
```ts
{
  description: string,
  businessType: string,        // e.g. "water_plant" (a key in business-types.json)
  state: "telangana" | "maharashtra" | "other",
  city: string,
  investmentLakh: number,      // 40 = ₹40 lakh
  workers: number,
  usesPower: boolean,
  handlesFood: boolean,
  premises: "owned" | "rented",
  usesGroundwater: boolean,
  entityType: "proprietor" | "partnership" | "company" | "notyet",
  isStartup?: boolean
}
```

**ChecklistResult** (returned by /api/checklist; rendered on the Checklist page):
```ts
{
  businessLabel: string,       // "Packaged Drinking Water Plant"
  msme: "Micro"|"Small"|"Medium"|"Large",
  pollution: "white"|"green"|"orange"|"red",
  factoryApplies: boolean,
  needsPollutionConsent: boolean,
  approvals: [{
    id, name, department, statute, timeline,
    documents: string[], icon, portalUrl, reason, category?
  }],
  incentives: [{ name, note }]
}
```

**The dataset (knowledge base):**
- `data/approvals/catalog.json` — 21 approvals
- `data/approvals/business-types.json` — 19 business types

---

## 7. HOW THE ENGINE WORKS (lib/rules-engine.ts) — 4 stages

1. **Understand** — the sentence becomes facts (via /api/understand).
2. **Classify** — from the facts, compute:
   - MSME category from investment (Micro ≤ ₹2.5cr, Small ≤ ₹25cr, Medium ≤ ₹125cr)
   - Pollution category from the business type (white/green/orange/red)
   - Factories Act applies? (10+ workers with power, or 20+ without)
3. **Assemble** — add approvals in layers:
   - Universal: Udyam, GST, Trade Licence, Shops
   - Sector: from the business type's sectorApprovals
   - Triggered by facts: pollution → CTE+CTO; workers → Factory Licence + Fire NOC;
     ≥20 workers → EPF; ≥10 → ESI; usesPower → Power; usesGroundwater → Groundwater NOC;
     company → Company Incorporation; isStartup → DPIIT
4. **Hydrate** — pull full details from catalog.json, return the checklist.

---

## 8. WHAT IS ALREADY BUILT (do not rebuild)

- ✅ Next.js 16 + Tailwind v4 + shadcn scaffold
- ✅ Design tokens, fonts, Header + Footer
- ✅ Home, Login, Describe, Checklist (dynamic), Apply, Documents, Dashboard pages
- ✅ The engine: lib/rules-engine.ts, lib/types.ts
- ✅ The dataset: catalog.json + business-types.json
- ✅ AI layer: lib/ai.ts (Groq + keyword fallback)
- ✅ API routes: /api/understand, /api/checklist
- ✅ Supabase: lib/db.ts, supabase/schema.sql

---

## 9. WHAT REMAINS TO DO

**A. Make understanding real** — Verify /api/understand handles messy free-text.
**B. Verify & enrich dataset** — Add `sourceUrl` to catalog entries.
**C. Wire to Supabase** — Real auth, document upload, application submission, dashboard.
**D. Pre-submit validation** — Check required documents before submit.
**E. Polish for demo** — Test 15+ business inputs, smooth transitions.

**Do NOT build:** Real gov portal submission, real DigiLocker/Aadhaar (mock these).

---

## 10. RULES

1. Never let the LLM invent approvals.
2. Keep the existing design.
3. Build/change one page at a time; verify before next.
4. Mock DigiLocker/Aadhaar — never claim live integration.
5. The statute chip is sacred.
6. Don't break the build.
7. Data in JSON, logic in TypeScript.

---

## 11. THE DEMO FLOW

1. Judge types a business → answers questions.
2. Sees computed checklist with statute citations.
3. Changes business type → checklist changes (proves it's real).
4. Expands approval → sees law + documents.
5. Clicks Apply → pre-filled, documents reused, submit → success.
6. Dashboard → tracked with SLA timer.

**Winning line:** "Existing portals are a submission counter — ours is a guide."
