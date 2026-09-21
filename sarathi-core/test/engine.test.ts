import { generateChecklist, resolveBusinessType } from "../lib/rules-engine";
import type { BusinessProfile } from "../lib/types";

function make(partial: Partial<BusinessProfile>): BusinessProfile {
  return {
    description: "",
    businessType: "generic",
    state: "telangana",
    city: "Ghatkesar",
    investmentLakh: 40,
    workers: 5,
    usesPower: true,
    handlesFood: false,
    premises: "rented",
    usesGroundwater: false,
    entityType: "proprietor",
    ...partial,
  };
}

const scenarios: { title: string; p: BusinessProfile }[] = [
  {
    title: "Water plant, ₹40L, 30 workers, power, Ghatkesar",
    p: make({ businessType: "water_plant", investmentLakh: 40, workers: 30, usesPower: true, handlesFood: true, usesGroundwater: true }),
  },
  {
    title: "Kirana shop, ₹5L, 2 workers, no power",
    p: make({ businessType: "kirana", investmentLakh: 5, workers: 2, usesPower: false, handlesFood: true }),
  },
  {
    title: "Pharmacy, ₹8L, 3 workers",
    p: make({ businessType: "pharmacy", investmentLakh: 8, workers: 3, usesPower: false }),
  },
  {
    title: "Restaurant, ₹25L, 12 workers",
    p: make({ businessType: "restaurant", investmentLakh: 25, workers: 12, usesPower: true, handlesFood: true }),
  },
  {
    title: "Chemical unit, ₹3000L, 50 workers (Medium, Red)",
    p: make({ businessType: "chemical_unit", investmentLakh: 3000, workers: 50, usesPower: true }),
  },
  {
    title: "Cloth store, ₹6L, 1 worker (White, minimal)",
    p: make({ businessType: "cloth_store", investmentLakh: 6, workers: 1, usesPower: false }),
  },
  {
    title: "Pvt Ltd startup, rice mill, ₹80L, 25 workers",
    p: make({ businessType: "rice_mill", investmentLakh: 80, workers: 25, usesPower: true, handlesFood: true, entityType: "company", isStartup: true }),
  },
];

console.log("=== resolveBusinessType free-text matching ===");
for (const t of ["I want to start a mineral water business", "opening a medical shop", "a small RO plant", "cloud kitchen for biryani", "textile boutique"]) {
  console.log(`  "${t}"  ->  ${resolveBusinessType(t)}`);
}

console.log("\n=== checklist generation ===");
for (const s of scenarios) {
  const r = generateChecklist(s.p);
  console.log(`\n▶ ${s.title}`);
  console.log(`  ${r.businessLabel} · MSME=${r.msme} · Pollution=${r.pollution} · Factory=${r.factoryApplies} · ${r.approvals.length} approvals`);
  console.log("   " + r.approvals.map((a) => a.id).join(", "));
}
