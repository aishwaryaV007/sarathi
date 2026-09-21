# Sarathi — Core (brain + backend) integration guide

This folder is the **working brain** of Sarathi. Drop these files into your
Next.js repo, install a few packages, and your hardcoded Checklist page becomes
a real, dynamic, statute-cited engine that adapts to any business.

Everything here has been **tested** — the engine runs and produces correct,
different checklists for water plant, kirana, pharmacy, restaurant, chemical
unit, cloth store, and a Pvt Ltd rice-mill startup.

---

## 1. Where each file goes (copy into your repo, same paths)

```
lib/types.ts                       → lib/types.ts
lib/rules-engine.ts                → lib/rules-engine.ts   (THE CORE)
lib/ai.ts                          → lib/ai.ts
lib/db.ts                          → lib/db.ts
data/approvals/catalog.json        → data/approvals/catalog.json
data/approvals/business-types.json → data/approvals/business-types.json
app/api/understand/route.ts        → app/api/understand/route.ts
app/api/checklist/route.ts         → app/api/checklist/route.ts
supabase/schema.sql                → run once in Supabase SQL Editor
```

## 2. Install packages

```bash
npm install ai @ai-sdk/openai zod @supabase/supabase-js @supabase/ssr
```

## 3. Environment variables — `.env.local` (never commit this)

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
GROQ_API_KEY=gsk_...
GOOGLE_GENERATIVE_AI_API_KEY=...   # optional, for document reading later
```

> The app works **without** GROQ_API_KEY — `lib/ai.ts` falls back to a
> keyword resolver, so your demo never breaks if wifi dies. With the key,
> free-text understanding is smarter.

## 4. Set up the database
Open Supabase → SQL Editor → paste `supabase/schema.sql` → Run. That creates
the profile, documents, projects, and applications tables with row-level
security, plus a private `documents` storage bucket.

---

## 5. How the frontend calls the brain

### Describe page (Step 1 → Step 2)
After the user types a description, call `/api/understand` to pre-fill:

```ts
const res = await fetch("/api/understand", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ description }),
});
const { facts } = await res.json();
// facts = { businessType, city, state, investmentLakh, workers, usesPower,
//           handlesFood, usesGroundwater, entityType }
// Use these to pre-fill Step 2 and to store in state.
```

### Checklist page (replace the hardcoded array)
Build a `profile` from all the answers, then:

```ts
const res = await fetch("/api/checklist", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ profile }),
});
const { result } = await res.json();
// result = {
//   businessLabel, msme, pollution, factoryApplies, needsPollutionConsent,
//   approvals: [{ id, name, department, statute, timeline, documents[],
//                 icon, reason, category? }],
//   incentives: [{ name, note }]
// }
```

Render `result.approvals` exactly like your current hardcoded cards — same
fields (name, department, statute → the green law chip, documents, timeline).
The four summary tiles read `result.approvals.length`, `result.msme`,
`result.pollution`, and `result.factoryApplies`.

### Passing the profile between pages
Simplest for the hackathon: store the Describe answers in a React context or
`sessionStorage`, read them on the Checklist page, POST to `/api/checklist`.
(Later: save to the `projects` table so it persists.)

---

## 6. Data model of a `BusinessProfile` (what Checklist needs)

```ts
{
  description: string,
  businessType: string,     // e.g. "water_plant" (from /api/understand)
  state: "telangana" | "maharashtra" | "other",
  city: string,
  investmentLakh: number,   // 40 = ₹40 lakh
  workers: number,
  usesPower: boolean,
  handlesFood: boolean,
  premises: "owned" | "rented",
  usesGroundwater: boolean,
  entityType: "proprietor" | "partnership" | "company" | "notyet",
  isStartup?: boolean
}
```

---

## 7. Extending it (your data person's job)

- **Add a business type:** copy an entry in `business-types.json`, set its
  pollution category, its `sectorApprovals` (ids from `catalog.json`), and
  `aliases` (so free text maps to it). No code change needed.
- **Add an approval:** add an entry to `catalog.json`, then either list its id
  in a business type's `sectorApprovals`, or add a trigger in
  `rules-engine.ts` (section 1–8).
- **Depth beats breadth:** 8–10 well-researched business types with correct
  statutes will impress judges far more than 60 shallow ones.

## 8. Test the engine yourself

```bash
npx tsx test/engine.test.ts
```

Prints the checklist for 7 sample businesses so you can verify correctness.
