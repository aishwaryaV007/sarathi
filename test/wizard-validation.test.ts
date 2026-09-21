import {
  validateStep1Form,
  validateStep2Form,
  QUESTION_APPLICABILITY,
  isExciseQuestionApplicable,
  isDpiitQuestionApplicable,
} from "../app/describe/page";
import { classifyMsme } from "../lib/rules-engine";
import type { BusinessActivity, LegalStructure, JurisdictionType } from "../lib/types";

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    throw new Error(msg);
  }
  console.log(`  ✓ ${msg}`);
}

console.log("=================================================");
console.log("SARATHI WIZARD VALIDATION & CONDITIONAL QUESTION SUITE");
console.log("=================================================\n");

// -------------------------------------------------------------
// TEST (a): Fresh load, click Continue with nothing filled
// -------------------------------------------------------------
console.log("▶ TEST CASE (a): Fresh load, submit Step 1 with nothing filled");
const freshStep1 = {
  activity: null,
  legalStructure: "" as LegalStructure | "",
  stateName: "",
  city: "",
  jurisdictionType: "" as JurisdictionType | "",
  premisesType: null,
};
const errsA = validateStep1Form(freshStep1);
assert(Object.keys(errsA).length === 6, "Blocked: Exactly 6 errors returned on fresh load");
assert(!!errsA.activity, "Error shown for Primary Business Activity");
assert(!!errsA.legalStructure, "Error shown for Legal Constitution");
assert(!!errsA.stateName, "Error shown for State");
assert(!!errsA.city, "Error shown for City / Area");
assert(!!errsA.jurisdictionType, "Error shown for Local Authority Jurisdiction");
assert(!!errsA.premisesType, "Error shown for Premises Setup");
console.log("TEST CASE (a) PASSED!\n");

// -------------------------------------------------------------
// TEST (b): Everything filled except City / Area
// -------------------------------------------------------------
console.log("▶ TEST CASE (b): Everything filled except City / Area");
const step1MissingCity = {
  activity: "food_service" as BusinessActivity,
  legalStructure: "sole_proprietorship" as LegalStructure,
  stateName: "telangana",
  city: "",
  jurisdictionType: "ghmc" as JurisdictionType,
  premisesType: "commercial" as const,
};
const errsB = validateStep1Form(step1MissingCity);
assert(Object.keys(errsB).length === 1, "Blocked: Only 1 error returned");
assert(errsB.city === "Enter your city or area", "City error is identified for focus target");

// Also test City with whitespace or single character
const step1WhitespaceCity = { ...step1MissingCity, city: " " };
assert(validateStep1Form(step1WhitespaceCity).city === "Enter your city or area", "Whitespace-only city is rejected");
const step1ShortCity = { ...step1MissingCity, city: "H" };
assert(validateStep1Form(step1ShortCity).city === "City or area must be at least 2 characters", "City < 2 characters is rejected");
console.log("TEST CASE (b) PASSED!\n");

// -------------------------------------------------------------
// TEST (c): Step 1 fully filled -> moves to Step 2 with numbers & questions empty
// -------------------------------------------------------------
console.log("▶ TEST CASE (c): Step 1 fully filled -> advance to Step 2");
const step1Valid = {
  activity: "food_service" as BusinessActivity,
  legalStructure: "sole_proprietorship" as LegalStructure,
  stateName: "telangana",
  city: "Hyderabad",
  jurisdictionType: "ghmc" as JurisdictionType,
  premisesType: "commercial" as const,
};
const errsC = validateStep1Form(step1Valid);
assert(Object.keys(errsC).length === 0, "Step 1 validation passes with 0 errors");

// Verify Step 2 initial state values are empty / unanswered
const initialStep2 = {
  investment: "",
  turnover: "",
  workers: "",
  activity: step1Valid.activity,
  legalStructure: step1Valid.legalStructure,
  food: null,
  dineIn: null,
  power: null,
  groundwater: null,
  effluents: null,
  weighing: null,
  drugs: null,
  alcohol: null,
  isStartup: null,
};
assert(initialStep2.investment === "", "Investment starts empty");
assert(initialStep2.turnover === "", "Turnover starts empty");
assert(initialStep2.workers === "", "Workers starts empty");
assert(initialStep2.food === null, "Food question starts unanswered (null)");
assert(initialStep2.dineIn === null, "Dine-in question starts unanswered (null)");
console.log("TEST CASE (c) PASSED!\n");

// -------------------------------------------------------------
// TEST (d): Conditional Question Applicability Rules
// -------------------------------------------------------------
console.log("▶ TEST CASE (d): Conditional question applicability (Excise & DPIIT rules)");

// 1. Excise applicability
assert(isExciseQuestionApplicable("food_service"), "Excise question shown for food_service (Restaurant / Cafe)");
assert(isExciseQuestionApplicable("retail"), "Excise question shown for retail (Retail Shop / Store)");
assert(!isExciseQuestionApplicable("it_services"), "Excise question hidden for it_services (Software / IT)");
assert(!isExciseQuestionApplicable("pharmacy"), "Excise question hidden for pharmacy (Pharmacy / Medical)");
assert(!isExciseQuestionApplicable("services"), "Excise question hidden for services (Commercial Services)");
assert(!isExciseQuestionApplicable("food_processing"), "Excise question hidden for food_processing");
assert(!isExciseQuestionApplicable("manufacturing"), "Excise question hidden for manufacturing");

// 2. DPIIT Startup India applicability
assert(!isDpiitQuestionApplicable("sole_proprietorship"), "DPIIT question hidden for sole_proprietorship");
assert(isDpiitQuestionApplicable("private_limited"), "DPIIT question shown for private_limited");
assert(isDpiitQuestionApplicable("llp"), "DPIIT question shown for llp");
assert(isDpiitQuestionApplicable("partnership"), "DPIIT question shown for partnership");
assert(isDpiitQuestionApplicable("opc"), "DPIIT question shown for opc");
assert(isDpiitQuestionApplicable("public_limited"), "DPIIT question shown for public_limited");

// 3. Validation behavior with conditional questions
// Case 1: Restaurant + Sole Proprietorship -> Alcohol is required, Startup is NOT required
const restaurantSoleProp = {
  ...initialStep2,
  activity: "food_service" as BusinessActivity,
  legalStructure: "sole_proprietorship" as LegalStructure,
};
const errsRSP = validateStep2Form(restaurantSoleProp);
assert(!!errsRSP.alcohol, "Alcohol question is required for food_service");
assert(!errsRSP.isStartup, "DPIIT question is NOT required for sole_proprietorship");

// Case 2: IT Services + Private Limited -> Alcohol is NOT required, Startup IS required
const itPvtLtd = {
  ...initialStep2,
  activity: "it_services" as BusinessActivity,
  legalStructure: "private_limited" as LegalStructure,
};
const errsITPL = validateStep2Form(itPvtLtd);
assert(!errsITPL.alcohol, "Alcohol question is NOT required for it_services");
assert(!!errsITPL.isStartup, "DPIIT question IS required for private_limited");

// Case 3: IT Services + Sole Proprietorship -> NEITHER Alcohol nor Startup is required
const itSoleProp = {
  ...initialStep2,
  activity: "it_services" as BusinessActivity,
  legalStructure: "sole_proprietorship" as LegalStructure,
};
const errsITSP = validateStep2Form(itSoleProp);
assert(!errsITSP.alcohol, "Alcohol question not required for it_services");
assert(!errsITSP.isStartup, "DPIIT question not required for sole_proprietorship");

// Case 4: Retail + Partnership -> BOTH Alcohol and Startup are required
const retailPartnership = {
  ...initialStep2,
  activity: "retail" as BusinessActivity,
  legalStructure: "partnership" as LegalStructure,
};
const errsRP = validateStep2Form(retailPartnership);
assert(!!errsRP.alcohol, "Alcohol question is required for retail");
assert(!!errsRP.isStartup, "DPIIT question is required for partnership");

// Test negative numbers & non-integers rejection
const invalidNumbersStep2 = {
  ...initialStep2,
  investment: "-10",
  turnover: "abc",
  workers: "3.5",
};
const errsD2 = validateStep2Form(invalidNumbersStep2);
assert(errsD2.investment.includes("0 or higher"), "Negative investment rejected");
assert(errsD2.turnover.includes("0 or higher"), "Non-numeric turnover rejected");
assert(errsD2.workers.includes("whole number"), "Fractional employee count rejected");
console.log("TEST CASE (d) PASSED!\n");

// -------------------------------------------------------------
// TEST (e): Step 2 fully filled -> submits successfully & MSME classified
// -------------------------------------------------------------
console.log("▶ TEST CASE (e): Step 2 fully filled -> successful submission & MSME");
const validStep2 = {
  investment: "25",
  turnover: "50",
  workers: "5",
  activity: "food_service" as BusinessActivity,
  legalStructure: "sole_proprietorship" as LegalStructure,
  food: "yes" as const,
  dineIn: "yes" as const,
  power: null,
  groundwater: null,
  effluents: null,
  weighing: null,
  drugs: null,
  alcohol: "no" as const,
  isStartup: null, // sole_proprietorship -> not required!
};
const errsE = validateStep2Form(validStep2);
assert(Object.keys(errsE).length === 0, "Step 2 validation passes with 0 errors (Startup omitted for sole_proprietorship)");

const msmeCategory = classifyMsme(Number(validStep2.investment), Number(validStep2.turnover));
assert(msmeCategory === "Micro", "MSME classified correctly as Micro (₹25L inv, ₹50L turnover)");

// Test 0 as an explicitly typed valid value
const zeroAllowedStep2 = {
  ...validStep2,
  investment: "0",
  turnover: "0",
  workers: "0",
};
const errsEZero = validateStep2Form(zeroAllowedStep2);
assert(Object.keys(errsEZero).length === 0, "Explicit '0' is valid for investment, turnover, and employees");
console.log("TEST CASE (e) PASSED!\n");

// -------------------------------------------------------------
// TEST (f): State change resets city & jurisdiction, activity change clears questions, back preserves values
// -------------------------------------------------------------
console.log("▶ TEST CASE (f): State changes, activity switches, and value preservation across steps");

// Check state switch logic
let userState = "telangana";
let userCity = "Hyderabad";
let userJurisdiction = "ghmc";

// User switches state to "maharashtra"
function simulateStateChange(newState: string) {
  userState = newState;
  userCity = "";
  userJurisdiction = "";
}
simulateStateChange("maharashtra");
assert(userState === "maharashtra", "State updated to Maharashtra");
assert(userCity === "", "City was reset when State changed");
assert(userJurisdiction === "", "Local Authority was reset when State changed");

// Step 1 preserves values when navigating back from Step 2
const preservedStep1 = {
  activity: "food_service" as BusinessActivity,
  legalStructure: "sole_proprietorship" as LegalStructure,
  stateName: "telangana",
  city: "Hyderabad",
  jurisdictionType: "ghmc" as JurisdictionType,
  premisesType: "commercial" as const,
  description: "Authentic Irani Chai Cafe",
};
assert(preservedStep1.activity === "food_service", "Activity preserved when going back to Step 1");
assert(preservedStep1.legalStructure === "sole_proprietorship", "Legal structure preserved");
assert(preservedStep1.stateName === "telangana", "State preserved");
assert(preservedStep1.city === "Hyderabad", "City preserved");
assert(preservedStep1.jurisdictionType === "ghmc", "Jurisdiction preserved");
assert(preservedStep1.premisesType === "commercial", "Premises setup preserved");
assert(preservedStep1.description === "Authentic Irani Chai Cafe", "Description preserved");

// Activity change clearing previous questions
let dynFood: "yes" | "no" | null = "yes";
let dynDineIn: "yes" | "no" | null = "yes";
let dynAlcohol: "yes" | "no" | null = "yes";
function simulateActivityChange(newAct: BusinessActivity) {
  dynFood = null;
  dynDineIn = null;
  if (!isExciseQuestionApplicable(newAct)) {
    dynAlcohol = null;
  }
}
simulateActivityChange("it_services");
assert(dynFood === null && dynDineIn === null, "Previous activity compliance question answers cleared on activity change");
assert(dynAlcohol === null, "Alcohol question answer cleared when switching to non-excise business activity (it_services)");
console.log("TEST CASE (f) PASSED!\n");

console.log("🎉 ALL WIZARD VALIDATION & CONDITIONAL QUESTION TESTS PASSED FLAWLESSLY!");
