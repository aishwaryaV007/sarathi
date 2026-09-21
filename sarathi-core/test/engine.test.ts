import { generateChecklist, resolveBusinessType, resolveLocationAuthority } from "../lib/rules-engine";
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

console.log("\n=== Location Authority Resolution Tests ===");
const hydLoc = resolveLocationAuthority("telangana", "Hyderabad");
console.log(`  Hyderabad -> Authority: ${hydLoc.tradeAuthority} (${hydLoc.authorityType}) | Portal: ${hydLoc.tradePortal}`);

const ghatLoc = resolveLocationAuthority("telangana", "Ghatkesar");
console.log(`  Ghatkesar -> Authority: ${ghatLoc.tradeAuthority} (${ghatLoc.authorityType}) | Portal: ${ghatLoc.tradePortal}`);

const ruralLoc = resolveLocationAuthority("telangana", "Ankushapur Gram Panchayat");
console.log(`  Rural GP  -> Authority: ${ruralLoc.tradeAuthority} (${ruralLoc.authorityType}) | Portal: ${ruralLoc.tradePortal}`);

console.log("\n=== Conditional Alcohol / Bar Trigger Test ===");
const barProfile = make({
  businessType: "restaurant",
  city: "Banjara Hills, Hyderabad",
  servesAlcohol: true,
  workers: 15,
});
const barResult = generateChecklist(barProfile);
const hasExcise = barResult.approvals.some((a) => a.id === "excise_licence");
const tradeApp = barResult.approvals.find((a) => a.id === "trade_licence");
console.log(`  Bar & Restaurant in Banjara Hills (GHMC):`);
console.log(`    Excise Licence triggered: ${hasExcise}`);
console.log(`    Trade Authority: ${tradeApp?.department} (${tradeApp?.authorityType})`);
console.log(`    Trade Portal: ${tradeApp?.portalUrl}`);

console.log("\n=== Dependency Sequence Verification ===");
const stages = barResult.approvals.map((a) => `[Stage ${a.stage}: ${a.name}]`);
console.log("  Execution Order:\n    " + stages.join("\n    "));
