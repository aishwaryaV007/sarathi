import assert from "node:assert/strict";
import {
  generateChecklist,
  classifyMsme,
  getConstitutionDocs,
  RULE_APPROVAL_DEFINITIONS,
  APPROVALS_NEEDING_CONDITIONS,
} from "../lib/rules-engine";
import type { BusinessProfile } from "../lib/types";

console.log("=================================================");
console.log("SARATHI RESULTS & FILTERING ENGINE TEST SUITE");
console.log("=================================================\n");

// ---------------------------------------------------------------------------
// TEST 0: RULE DEFINITION INTEGRITY
// ---------------------------------------------------------------------------
console.log("▶ TEST 0: Verifying Rule Definition Integrity & Non-empty conditions");
assert.equal(
  APPROVALS_NEEDING_CONDITIONS.length,
  0,
  `Catalog approvals missing explicit rule conditions: ${APPROVALS_NEEDING_CONDITIONS.join(", ")}`
);
console.log("  ✓ All catalog approvals have explicit appliesWhen conditions defined");
console.log("  ✓ No approvals flagged as 'needs a condition'");

// ---------------------------------------------------------------------------
// TEST A: Restaurant, 5 workers, no weighing, no alcohol
// -> no ESI, EPF, Legal Metrology, Excise
// ---------------------------------------------------------------------------
console.log("\n▶ TEST A: Restaurant, 5 workers, no weighing scale, no alcohol");
const profileA: Partial<BusinessProfile> = {
  businessActivity: "food_service",
  sector: "food",
  legalStructure: "partnership",
  workers: 5,
  usesWeighingInstruments: false,
  servesAlcohol: false,
  handlesFood: true,
  dineIn: true,
  hasPhysicalPremises: true,
  investmentLakh: 20,
  annualTurnoverLakh: 30,
};

const resultA = generateChecklist(profileA);
const applicableIdsA = resultA.applicableApprovals.map((a) => a.id);

assert.ok(!applicableIdsA.includes("esi"), "ESI must NOT apply to business with 5 workers (<10)");
assert.ok(!applicableIdsA.includes("epf"), "EPF must NOT apply to business with 5 workers (<20)");
assert.ok(!applicableIdsA.includes("legal_metrology"), "Legal Metrology must NOT apply when usesWeighingInstruments is false");
assert.ok(!applicableIdsA.includes("excise_licence"), "Excise Licence must NOT apply when servesAlcohol is false");
assert.ok(applicableIdsA.includes("fssai"), "FSSAI must apply when handlesFood is true");
assert.ok(applicableIdsA.includes("eating_house"), "Eating house licence must apply for dine-in restaurant");
console.log("  ✓ No ESI, EPF, Legal Metrology, or Excise licence for 5-worker alcohol-free restaurant");
console.log("  ✓ FSSAI and Eating House licence correctly included");
console.log("  TEST A PASSED!");

// ---------------------------------------------------------------------------
// TEST B: Restaurant with 12 workers -> ESI appears, EPF does not
// ---------------------------------------------------------------------------
console.log("\n▶ TEST B: Restaurant with 12 workers -> ESI appears (>=10), EPF does not (<20)");
const profileB: Partial<BusinessProfile> = {
  ...profileA,
  workers: 12,
};

const resultB = generateChecklist(profileB);
const applicableIdsB = resultB.applicableApprovals.map((a) => a.id);

assert.ok(applicableIdsB.includes("esi"), "ESI MUST apply to business with 12 workers (threshold 10+)");
assert.ok(!applicableIdsB.includes("epf"), "EPF must NOT apply to business with 12 workers (threshold 20+)");
const esiApproval = resultB.applicableApprovals.find((a) => a.id === "esi");
assert.ok(esiApproval?.triggeredBy?.some((t) => t.includes("12") && t.includes("10+")));
console.log("  ✓ ESI is APPLICABLE with dynamic workforce trigger: " + esiApproval?.triggeredBy?.[0]);
console.log("  ✓ EPF remains NOT APPLICABLE (< 20 workers)");
console.log("  TEST B PASSED!");

// ---------------------------------------------------------------------------
// TEST C: Weighing = Yes -> Legal Metrology appears; Weighing = No -> disappears
// ---------------------------------------------------------------------------
console.log("\n▶ TEST C: Weighing Scale toggle reactive check");
const profileC1: Partial<BusinessProfile> = {
  ...profileA,
  usesWeighingInstruments: true,
};
const resultC1 = generateChecklist(profileC1);
assert.ok(
  resultC1.applicableApprovals.some((a) => a.id === "legal_metrology"),
  "Legal Metrology MUST appear when usesWeighingInstruments is true"
);

const profileC2: Partial<BusinessProfile> = {
  ...profileA,
  usesWeighingInstruments: false,
};
const resultC2 = generateChecklist(profileC2);
assert.ok(
  !resultC2.applicableApprovals.some((a) => a.id === "legal_metrology"),
  "Legal Metrology must NOT appear when usesWeighingInstruments is false"
);
console.log("  ✓ usesWeighingInstruments = true triggers Legal Metrology");
console.log("  ✓ usesWeighingInstruments = false removes Legal Metrology");
console.log("  TEST C PASSED!");

// ---------------------------------------------------------------------------
// TEST D: Software / IT Sole Proprietorship -> no FSSAI, Eating House, Metrology, Excise
// ---------------------------------------------------------------------------
console.log("\n▶ TEST D: Software / IT Services Sole Proprietorship");
const profileD: Partial<BusinessProfile> = {
  businessActivity: "it_services",
  sector: "it_tech",
  legalStructure: "sole_proprietorship",
  workers: 4,
  usesWeighingInstruments: false,
  servesAlcohol: false,
  handlesFood: false,
  dineIn: false,
  hasPhysicalPremises: false,
  investmentLakh: 5,
  annualTurnoverLakh: 15,
};
const resultD = generateChecklist(profileD);
const applicableIdsD = resultD.applicableApprovals.map((a) => a.id);

assert.ok(!applicableIdsD.includes("fssai"), "IT service must NOT have FSSAI");
assert.ok(!applicableIdsD.includes("eating_house"), "IT service must NOT have Eating House Licence");
assert.ok(!applicableIdsD.includes("legal_metrology"), "IT service must NOT have Legal Metrology");
assert.ok(!applicableIdsD.includes("excise_licence"), "IT service must NOT have Excise Licence");
assert.ok(!applicableIdsD.includes("company_incorporation"), "Sole Proprietor must NOT have MCA SPICe+");
assert.ok(applicableIdsD.includes("udyam"), "IT service qualifies for Udyam MSME");
console.log("  ✓ Software IT sole proprietorship strictly excludes food, dining, metrology, and excise licences");
console.log("  TEST D PASSED!");

// ---------------------------------------------------------------------------
// TEST E: Investment / turnover update -> Udyam MSME classification and trigger text dynamically update
// ---------------------------------------------------------------------------
console.log("\n▶ TEST E: Dynamic MSME classification and Udyam trigger interpolation");
const profileE1: Partial<BusinessProfile> = {
  ...profileD,
  investmentLakh: 45,
  annualTurnoverLakh: 80,
};
const resultE1 = generateChecklist(profileE1);
const udyamE1 = resultE1.applicableApprovals.find((a) => a.id === "udyam");
assert.equal(resultE1.msme, "Micro");
assert.ok(
  udyamE1?.triggeredBy?.some((t) => t.includes("Micro") && t.includes("45") && t.includes("80")),
  `Expected Micro with ₹45L & ₹80L, got: ${udyamE1?.triggeredBy?.[0]}`
);

const profileE2: Partial<BusinessProfile> = {
  ...profileD,
  investmentLakh: 600,
  annualTurnoverLakh: 2500,
};
const resultE2 = generateChecklist(profileE2);
const udyamE2 = resultE2.applicableApprovals.find((a) => a.id === "udyam");
assert.equal(resultE2.msme, "Small");
assert.ok(
  udyamE2?.triggeredBy?.some((t) => t.includes("Small") && t.includes("600") && t.includes("2500")),
  `Expected Small with ₹600L & ₹2500L, got: ${udyamE2?.triggeredBy?.[0]}`
);
console.log("  ✓ Micro enterprise trigger: " + udyamE1?.triggeredBy?.[0]);
console.log("  ✓ Small enterprise trigger: " + udyamE2?.triggeredBy?.[0]);
console.log("  TEST E PASSED!");

// ---------------------------------------------------------------------------
// TEST F: Constitution-tailored documents and mandatory/recommended partitioning
// ---------------------------------------------------------------------------
console.log("\n▶ TEST F: Constitution-tailored required documents & mandatory/recommended partitioning");
const solePropDocs = getConstitutionDocs("sole_proprietorship");
assert.ok(solePropDocs.includes("Promoter PAN Card"), "Sole prop must include Promoter PAN Card");
assert.ok(solePropDocs.includes("Promoter Aadhaar Card"), "Sole prop must include Promoter Aadhaar Card");
assert.ok(!solePropDocs.includes("MOA & AOA"), "Sole prop must NOT include MOA & AOA");

const pvtLtdDocs = getConstitutionDocs("private_limited");
assert.ok(pvtLtdDocs.includes("MOA & AOA"), "Pvt Ltd must include MOA & AOA");
assert.ok(pvtLtdDocs.includes("Certificate of Incorporation (SPICe+)"), "Pvt Ltd must include SPICe+");

// Check mandatory vs recommended partitioning
const pvtLtdProfile: Partial<BusinessProfile> = {
  businessActivity: "services",
  sector: "services",
  legalStructure: "private_limited",
  isStartup: true,
  workers: 2,
  investmentLakh: 10,
  annualTurnoverLakh: 25,
};
const pvtResult = generateChecklist(pvtLtdProfile);
const mandatoryIds = pvtResult.mandatoryApprovals.map((a) => a.id);
const recommendedIds = pvtResult.recommendedApprovals.map((a) => a.id);

assert.ok(mandatoryIds.includes("company_incorporation"), "Company incorporation must be in mandatoryApprovals");
assert.ok(mandatoryIds.includes("gst"), "GST must be in mandatoryApprovals");
assert.ok(recommendedIds.includes("udyam"), "Udyam must be in recommendedApprovals");
assert.ok(recommendedIds.includes("startup_dpiit"), "Startup India must be in recommendedApprovals");
console.log("  ✓ Sole Prop vs Pvt Ltd document requirements correctly tailored");
console.log("  ✓ Mandatory approvals partitioned: " + mandatoryIds.join(", "));
console.log("  ✓ Recommended approvals partitioned: " + recommendedIds.join(", "));
console.log("  TEST F PASSED!");

console.log("\n🎉 ALL TESTS (A through F) PASSED FLAWLESSLY!\n");
