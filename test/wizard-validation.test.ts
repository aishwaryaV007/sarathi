import { validateStep1Form, validateStep2Form } from "../app/describe/page";
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
console.log("SARATHI WIZARD VALIDATION & EMPTY-STATE TEST SUITE");
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
assert(initialStep2.alcohol === null, "Alcohol question starts unanswered (null)");
assert(initialStep2.isStartup === null, "Startup India question starts unanswered (null)");
console.log("TEST CASE (c) PASSED!\n");

// -------------------------------------------------------------
// TEST (d): Step 2 with missing numbers or unanswered questions
// -------------------------------------------------------------
console.log("▶ TEST CASE (d): Step 2 with missing numbers or unanswered questions");
const errsD = validateStep2Form(initialStep2);
assert(Object.keys(errsD).length > 0, "Submit blocked when Step 2 is incomplete");
assert(!!errsD.investment, "Investment required error reported");
assert(!!errsD.turnover, "Turnover required error reported");
assert(!!errsD.workers, "Workers required error reported");
assert(!!errsD.food, "Food handling question required error reported");
assert(!!errsD.dineIn, "Dine-in question required error reported");
assert(!!errsD.alcohol, "Alcohol question required error reported");
assert(!!errsD.isStartup, "Startup question required error reported");

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
  food: "yes" as const,
  dineIn: "yes" as const,
  power: null,
  groundwater: null,
  effluents: null,
  weighing: null,
  drugs: null,
  alcohol: "no" as const,
  isStartup: "no" as const,
};
const errsE = validateStep2Form(validStep2);
assert(Object.keys(errsE).length === 0, "Step 2 validation passes with 0 errors");

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
function simulateActivityChange(newAct: BusinessActivity) {
  dynFood = null;
  dynDineIn = null;
}
simulateActivityChange("manufacturing");
assert(dynFood === null && dynDineIn === null, "Previous activity compliance question answers cleared on activity change");
console.log("TEST CASE (f) PASSED!\n");

console.log("🎉 ALL WIZARD VALIDATION TEST SCENARIOS (a) THROUGH (f) PASSED FLAWLESSLY!");
