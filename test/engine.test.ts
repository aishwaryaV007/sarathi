import { generateChecklist, resolveLocationAuthority } from "../lib/rules-engine";
import type { BusinessProfile } from "../lib/types";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`  ✓ ${message}`);
}

console.log("=================================================");
console.log("SARATHI DYNAMIC RULES ENGINE — VERIFICATION SUITE");
console.log("=================================================\n");

// ============================================================================
// TEST 1: Sole Proprietor, Software/IT Service, Telangana, 5 employees
// ============================================================================
console.log("▶ TEST 1: Sole Proprietor, Software/IT Service, 5 workers (Remote/Office)");
const itProfile: Partial<BusinessProfile> = {
  description: "IT software development and SaaS consulting firm",
  legalStructure: "sole_proprietorship",
  businessActivity: "it_services",
  sector: "it_tech",
  state: "telangana",
  city: "Hyderabad",
  jurisdictionType: "ghmc",
  investmentLakh: 15,
  annualTurnoverLakh: 35,
  workers: 5,
  hasPhysicalPremises: false,
  premises: "rented",
  premisesType: "home_office",
  usesPower: false,
  handlesFood: false,
  usesGroundwater: false,
  servesAlcohol: false,
  handlesDrugs: false,
};

const itResult = generateChecklist(itProfile);
const itApplicableIds = itResult.applicableApprovals.map((a) => a.id);
const itNotApplicableIds = itResult.notApplicableApprovals.map((a) => a.id);

console.log(`  MSME: ${itResult.msme} | Pollution: ${itResult.pollution} | Factory: ${itResult.factoryApplies}`);
console.log(`  Applicable (${itResult.applicableApprovals.length}):`, itApplicableIds.join(", "));
console.log(`  Needs Verification (${itResult.potentiallyApplicableApprovals.length}):`, itResult.potentiallyApplicableApprovals.map((a) => a.id).join(", "));
console.log(`  Not Applicable (${itResult.notApplicableApprovals.length}):`, itNotApplicableIds.join(", "));

assert(!itApplicableIds.includes("fssai"), "IT service does NOT have FSSAI");
assert(!itApplicableIds.includes("factory_licence"), "IT service does NOT have Factory Licence");
assert(!itApplicableIds.includes("cte") && !itApplicableIds.includes("cto"), "IT service does NOT have Pollution CTE/CTO (White Category)");
assert(!itApplicableIds.includes("groundwater_noc"), "IT service does NOT have Groundwater NOC");
assert(!itApplicableIds.includes("drug_licence"), "IT service does NOT have Drug Licence");
assert(!itApplicableIds.includes("company_incorporation"), "Sole Proprietorship does NOT have MCA Company Incorporation");
assert(itApplicableIds.includes("udyam"), "IT service qualifies for Udyam MSME");
assert(itApplicableIds.includes("gst"), "IT service with ₹35L turnover qualifies for GST (threshold ₹20L)");
console.log("  TEST 1 PASSED!\n");

// ============================================================================
// TEST 2: Partnership, Restaurant, Telangana, 15 employees, physical premises
// ============================================================================
console.log("▶ TEST 2: Partnership, Restaurant, 15 workers, physical premises, food handling");
const restProfile: Partial<BusinessProfile> = {
  description: "Dine-in multi-cuisine family restaurant in Hyderabad",
  legalStructure: "partnership",
  businessActivity: "food_service",
  sector: "food",
  state: "telangana",
  city: "Hyderabad",
  jurisdictionType: "ghmc",
  investmentLakh: 45,
  annualTurnoverLakh: 80,
  workers: 15,
  hasPhysicalPremises: true,
  premises: "rented",
  premisesType: "commercial",
  usesPower: true,
  handlesFood: true,
  usesGroundwater: false,
  servesAlcohol: false,
  handlesDrugs: false,
};

const restResult = generateChecklist(restProfile);
const restApplicableIds = restResult.applicableApprovals.map((a) => a.id);
const restPotentialIds = restResult.potentiallyApplicableApprovals.map((a) => a.id);

console.log(`  MSME: ${restResult.msme} | Pollution: ${restResult.pollution} | Factory: ${restResult.factoryApplies}`);
console.log(`  Applicable (${restResult.applicableApprovals.length}):`, restApplicableIds.join(", "));
console.log(`  Needs Verification (${restResult.potentiallyApplicableApprovals.length}):`, restPotentialIds.join(", "));

assert(restApplicableIds.includes("fssai"), "Restaurant has FSSAI Food Licence");
assert(restApplicableIds.includes("eating_house"), "Restaurant has Police Eating House Licence");
assert(restApplicableIds.includes("trade_licence"), "Restaurant has Municipal Trade Licence");
assert(restApplicableIds.includes("shops"), "Restaurant with workers has Shops & Establishment");
assert(restApplicableIds.includes("esi"), "Restaurant with 15 workers has ESI (>= 10)");
assert(!restApplicableIds.includes("epf"), "Restaurant with 15 workers does NOT have mandatory EPF (< 20)");
assert(restPotentialIds.includes("fire_noc"), "Restaurant Fire NOC is marked POTENTIALLY_APPLICABLE / Needs Verification");
assert(!restApplicableIds.includes("factory_licence"), "Restaurant does NOT have Factory Licence");
assert(!restApplicableIds.includes("company_incorporation"), "Partnership does NOT have MCA Company Incorporation");
console.log("  TEST 2 PASSED!\n");

// ============================================================================
// TEST 3: Private Limited, Food Manufacturing, Telangana, 50 workers, machinery, factory
// ============================================================================
console.log("▶ TEST 3: Private Limited, Food Manufacturing Plant, 50 workers, factory");
const mfgProfile: Partial<BusinessProfile> = {
  description: "Automated snacks and food processing manufacturing plant",
  legalStructure: "private_limited",
  businessActivity: "food_processing",
  sector: "food",
  state: "telangana",
  city: "Ghatkesar",
  jurisdictionType: "municipality",
  investmentLakh: 250,
  annualTurnoverLakh: 600,
  workers: 50,
  hasPhysicalPremises: true,
  premises: "owned",
  premisesType: "industrial",
  usesPower: true,
  usesMachinery: true,
  handlesFood: true,
  usesGroundwater: true,
  waterEffluentDischarge: true,
  servesAlcohol: false,
};

const mfgResult = generateChecklist(mfgProfile);
const mfgApplicableIds = mfgResult.applicableApprovals.map((a) => a.id);

console.log(`  MSME: ${mfgResult.msme} | Pollution: ${mfgResult.pollution} | Factory: ${mfgResult.factoryApplies}`);
console.log(`  Applicable (${mfgResult.applicableApprovals.length}):`, mfgApplicableIds.join(", "));

assert(mfgApplicableIds.includes("company_incorporation"), "Pvt Ltd has MCA SPICe+ Incorporation");
assert(mfgApplicableIds.includes("factory_licence"), "50 workers manufacturing plant has Factory Licence");
assert(mfgApplicableIds.includes("cte") && mfgApplicableIds.includes("cto"), "Food manufacturing has PCB CTE and CTO (Orange category)");
assert(mfgApplicableIds.includes("fire_noc"), "Factory premises has Fire Safety NOC");
assert(mfgApplicableIds.includes("epf"), "50 workers has EPF (>= 20)");
assert(mfgApplicableIds.includes("esi"), "50 workers has ESI (>= 10)");
assert(mfgApplicableIds.includes("groundwater_noc"), "Borewell water usage has Groundwater NOC");
assert(mfgApplicableIds.includes("power_connection"), "Manufacturing plant has Industrial Power Connection");
assert(mfgApplicableIds.includes("fssai"), "Food manufacturing has FSSAI");
assert(mfgResult.notApplicableApprovals.some((a) => a.id === "shops"), "Factory Act exempts Shops & Establishment Act");
console.log("  TEST 3 PASSED!\n");

// ============================================================================
// TEST 4: Sole Proprietor, Retail Clothing Shop, Telangana, 3 employees, physical shop
// ============================================================================
console.log("▶ TEST 4: Sole Proprietor, Retail Clothing Shop, 3 workers, physical shop");
const retailProfile: Partial<BusinessProfile> = {
  description: "Readymade garment and clothing retail shop",
  legalStructure: "sole_proprietorship",
  businessActivity: "retail",
  sector: "retail_trade",
  state: "telangana",
  city: "Warangal",
  jurisdictionType: "municipality",
  investmentLakh: 8,
  annualTurnoverLakh: 18,
  workers: 3,
  hasPhysicalPremises: true,
  premises: "rented",
  premisesType: "commercial",
  usesPower: false,
  handlesFood: false,
  usesGroundwater: false,
};

const retailResult = generateChecklist(retailProfile);
const retailApplicableIds = retailResult.applicableApprovals.map((a) => a.id);
const retailNotApplicableIds = retailResult.notApplicableApprovals.map((a) => a.id);

console.log(`  MSME: ${retailResult.msme} | Pollution: ${retailResult.pollution} | Factory: ${retailResult.factoryApplies}`);
console.log(`  Applicable (${retailResult.applicableApprovals.length}):`, retailApplicableIds.join(", "));
console.log(`  Not Applicable (${retailResult.notApplicableApprovals.length}):`, retailNotApplicableIds.join(", "));

assert(retailApplicableIds.includes("trade_licence"), "Retail shop has Municipal Trade Licence");
assert(retailApplicableIds.includes("shops"), "Retail shop with 3 workers has Shops & Establishment");
assert(retailApplicableIds.includes("udyam"), "Retail shop has Udyam MSME");
assert(!retailApplicableIds.includes("factory_licence"), "Retail shop does NOT have Factory Licence");
assert(!retailApplicableIds.includes("fssai"), "Clothing retail does NOT have FSSAI");
assert(!retailApplicableIds.includes("cte") && !retailApplicableIds.includes("cto"), "Clothing retail does NOT have Pollution CTE/CTO");
assert(!retailApplicableIds.includes("epf"), "3 workers does NOT have EPF (< 20)");
assert(!retailApplicableIds.includes("esi"), "3 workers does NOT have ESI (< 10)");
console.log("  TEST 4 PASSED!\n");

// ============================================================================
// TEST 5: Pharmacy, Private Limited / Partnership, Physical premises
// ============================================================================
console.log("▶ TEST 5: Pharmacy, Partnership, Physical premises, Pharmaceutical sales");
const pharmaProfile: Partial<BusinessProfile> = {
  description: "Retail pharmacy and medical store stocking prescription medicines",
  legalStructure: "partnership",
  businessActivity: "pharmacy",
  sector: "healthcare_pharma",
  state: "telangana",
  city: "Hyderabad",
  jurisdictionType: "ghmc",
  investmentLakh: 12,
  annualTurnoverLakh: 40,
  workers: 4,
  hasPhysicalPremises: true,
  premises: "rented",
  premisesType: "commercial",
  usesPower: false,
  handlesDrugs: true,
  handlesFood: false,
  usesGroundwater: false,
};

const pharmaResult = generateChecklist(pharmaProfile);
const pharmaApplicableIds = pharmaResult.applicableApprovals.map((a) => a.id);

console.log(`  MSME: ${pharmaResult.msme} | Pollution: ${pharmaResult.pollution} | Factory: ${pharmaResult.factoryApplies}`);
console.log(`  Applicable (${pharmaResult.applicableApprovals.length}):`, pharmaApplicableIds.join(", "));

assert(pharmaApplicableIds.includes("drug_licence"), "Pharmacy has Drug Licence (Form 20/21)");
assert(pharmaApplicableIds.includes("trade_licence"), "Pharmacy has Municipal Trade Licence");
assert(pharmaApplicableIds.includes("shops"), "Pharmacy has Shops & Establishment");
assert(pharmaApplicableIds.includes("gst"), "Pharmacy has GST");
assert(!pharmaApplicableIds.includes("factory_licence"), "Pharmacy does NOT have Factory Licence");
assert(!pharmaApplicableIds.includes("fssai"), "Pharmacy does NOT have FSSAI");
console.log("  TEST 5 PASSED!\n");

// ============================================================================
// TEST 6: Scheme Matching Test
// ============================================================================
console.log("▶ TEST 6: Dynamic Scheme Matching");
assert(mfgResult.matchedSchemes.some((s) => s.id === "tidea"), "Telangana manufacturing MSME matches T-IDEA scheme");
assert(retailResult.matchedSchemes.some((s) => s.id === "mudra"), "Retail micro-business matches PM MUDRA Yojana");
console.log("  Matched schemes for Mfg:", mfgResult.matchedSchemes.map((s) => s.name).join(", "));
console.log("  Matched schemes for Retail:", retailResult.matchedSchemes.map((s) => s.name).join(", "));
console.log("  TEST 6 PASSED!\n");

// ============================================================================
// TEST 7: Location Authority Resolution Test
// ============================================================================
console.log("▶ TEST 7: Location Authority Resolution");
const hydLoc = resolveLocationAuthority("telangana", "Hyderabad", "ghmc");
assert(hydLoc.authorityType === "GHMC", "Hyderabad resolves to GHMC");
assert(hydLoc.tradeAuthority.includes("Greater Hyderabad"), "Trade authority is GHMC");

const ruralLoc = resolveLocationAuthority("telangana", "Ankushapur", "panchayat");
assert(ruralLoc.authorityType === "Panchayat", "Rural resolves to Panchayat");
assert(ruralLoc.tradeAuthority.includes("Gram Panchayat"), "Trade authority is Gram Panchayat");

const mumbaiLoc = resolveLocationAuthority("maharashtra", "Mumbai");
assert(mumbaiLoc.tradeAuthority.includes("Brihanmumbai"), "Mumbai resolves to BMC / MCGM");
console.log("  TEST 7 PASSED!\n");

console.log("🎉 ALL 7 TEST SUITES PASSED FLAWLESSLY!");
