# Sarathi — Implementation Notes & Context

> Additional context from the Claude planning session. Supplements PROJECT_BRIEF.md.

---

## Competition Context

- **Event:** Smart India Hackathon 2026, Problem Statement 26130
- **Issuer:** Government of Maharashtra / Maharashtra State Innovation Society
- **Round:** Department-level (first filter) — must pass to advance
- **Format:** Judges will **test the product live** — they type arbitrary businesses and expect correct results
- **Team:** 3 members, professional-level, willing to work nights
- **Stakes:** Competing against talented, articulate peers — output must be excellent

---

## Key Architecture Decisions (rationale)

### Why the LLM does NOT generate the checklist
- LLMs hallucinate — a wrong statute citation destroys credibility
- The rules engine + curated JSON dataset guarantees every output is verifiable
- The LLM's **only job**: translate messy free-text → structured `BusinessProfile`
- This is a RAG pattern (Retrieval-Augmented Generation) — the same approach used by production legal-AI systems

### Why Groq over other LLMs
- **Speed:** 300–500 tokens/sec on LPU hardware — judge's query feels instant on stage
- **Free tier:** 30 req/min, ~1,000/day — more than enough for a demo
- **OpenAI-compatible API** — works with Vercel AI SDK out of the box
- **Keyword fallback** exists in `lib/ai.ts` — app works even if API is down

### Why Supabase
- Postgres + Auth + Storage + pgvector in one service
- Email login in 20 minutes (don't hand-build auth)
- Document vault = Supabase Storage bucket, files linked to user ID
- Free tier is sufficient for hackathon

---

## The Winning Pitch Points

1. **"Existing portals are submission counters — ours is a guide"**
2. **Singapore GoBusiness** already proved this model works internationally — nobody's built it for India's small entrepreneur
3. **Every checklist item cites the actual law** — verifiable, never a guess
4. **One-time document upload** — PAN/Aadhaar uploaded once, reused across all applications
5. **Works for ANY business type** — same engine, different triggers, different output
6. **No privileged government API needed** — runs on public statutory data
7. **Free** — replaces the ₹5,000–₹25,000 paid liaison agent

---

## Dataset Strategy

### The 19 business types currently in business-types.json:
water_plant, rice_mill, oil_mill, food_processing, dairy, restaurant,
pharmacy, kirana, supermarket, cloth_store, garment_unit, plastic_unit,
chemical_unit, engineering_unit, printing_press, liquor_shop, salon, clinic, generic

### The 21 approvals currently in catalog.json:
Udyam, GST, CTE, CTO, Factory Licence, Fire NOC, EPF, ESI, Trade Licence,
Shops & Establishment, Power Connection, Groundwater NOC, FSSAI, BIS/ISI,
Drug Licence, Legal Metrology, Excise, Eating House, Company Incorporation,
Startup DPIIT, Power

### Enrichment needed (§9-B of PROJECT_BRIEF):
- Add `sourceUrl` to each catalog entry → provably cited
- Verify each statute, department, document list against real gov source
- Key sources: India Code (indiacode.nic.in), NSWS, TG-iPASS, FSSAI/BIS/CPCB websites

---

## Engine Trigger Rules Summary

| Condition | Approvals Added |
|---|---|
| Always (universal) | Udyam, GST, Trade Licence, Shops & Establishment |
| Business type's sectorApprovals | Varies (e.g., water_plant → BIS/ISI, FSSAI, Groundwater NOC) |
| Pollution ≠ White | CTE + CTO |
| Manufacturing + workers | Factory Licence + Fire NOC |
| ≥ 20 workers | EPF |
| ≥ 10 workers | ESI |
| usesPower = true | Power Connection |
| usesGroundwater = true | Groundwater NOC |
| entityType = "company" | Company Incorporation |
| isStartup = true | DPIIT Startup Recognition |

---

## MSME Classification Thresholds

| Category | Investment Limit (in lakh) |
|---|---|
| Micro | ≤ 250 (₹2.5 crore) |
| Small | ≤ 2500 (₹25 crore) |
| Medium | ≤ 12500 (₹125 crore) |
| Large | > 12500 |

Source: S.O. 1364(E), 2025

---

## What to Mock (honest, expected at hackathon stage)

- **DigiLocker integration** — show OAuth flow architecture, use sample signed documents
- **Real government portal submission** — show the button + simulated success, say "integration-ready"
- **Aadhaar verification** — show the UI, use sample data
- These are all honest: real integration requires registered org + official API access

---

## Demo Script (what to rehearse)

1. Judge types: "packaged drinking water plant, Ghatkesar, 30 workers, ₹40 lakh"
2. Answers follow-up questions (power: yes, food: yes, groundwater: yes)
3. Sees: ~14 approvals, Micro, Orange, Factories Act Applies — each with statute chip
4. Judge changes to: "pharmacy" or "cloth store" → checklist changes dynamically
5. Expands an approval → sees law + required documents (with "on file" reuse markers)
6. Clicks Apply → pre-filled form, documents from vault, submit → validation check → success
7. Opens Dashboard → tracked with SLA timer + renewal dates

**Test these 15 inputs before demo day:**
water plant, kirana shop, rice mill, cloth store, supermarket, pharmacy,
restaurant, dairy, oil mill, chemical factory, garment unit, printing press,
salon, clinic, private limited company
