// ============================================================================
// Sarathi Rules Engine  —  THE CORE / the "brain"
// ----------------------------------------------------------------------------
// Takes a BusinessProfile (the Describe-page answers) and returns a dynamic,
// statute-cited checklist. It is TRIGGER-BASED: approvals are decided by the
// underlying attributes of the business (manufacturing? food? workers? power?
// groundwater? company?), NOT by a hardcoded per-business list. That is why it
// produces a sensible checklist even for a business type nobody hand-authored.
//
// Data (names, statutes, documents) lives in JSON so a non-coder can extend it:
//   data/approvals/catalog.json        — every approval's content
//   data/approvals/business-types.json — pollution category + sector approvals
// Logic (who gets what) lives HERE.
// ============================================================================

import catalog from "../data/approvals/catalog.json";
import businessTypes from "../data/approvals/business-types.json";
import type {
  BusinessProfile,
  Approval,
  ChecklistResult,
  MsmeCategory,
  PollutionCategory,
} from "./types";

type CatalogEntry = Omit<Approval, "reason" | "category">;
const CATALOG = catalog as unknown as Record<string, CatalogEntry>;
const BTYPES = businessTypes as unknown as Record<
  string,
  {
    label: string;
    pollution: PollutionCategory;
    sectorApprovals: string[];
    defaults: Partial<Record<string, boolean>>;
    aliases: string[];
  }
>;

// State-specific department names, patched onto the generic catalog entries.
const STATE_DEPTS: Record<string, Record<string, string>> = {
  telangana: {
    cte: "Telangana State Pollution Control Board (TSPCB)",
    cto: "Telangana State Pollution Control Board (TSPCB)",
    factory_licence: "Directorate of Factories, Telangana",
    fire_noc: "Telangana State Disaster Response & Fire Services",
    trade_licence: "Greater Hyderabad Municipal Corporation (GHMC) / local body",
    power_connection: "TSSPDCL / TSNPDCL",
    shops: "Labour Department, Telangana",
  },
  maharashtra: {
    cte: "Maharashtra Pollution Control Board (MPCB)",
    cto: "Maharashtra Pollution Control Board (MPCB)",
    factory_licence: "Directorate of Industrial Safety & Health (DISH), Maharashtra",
    fire_noc: "Maharashtra Fire Services",
    trade_licence: "Municipal Corporation / local body",
    power_connection: "MSEDCL",
    shops: "Labour Department, Maharashtra",
  },
};

// ---------------------------------------------------------------------------
// Pure classifiers
// ---------------------------------------------------------------------------

/** MSME category from investment (composite rule; turnover assumed in-band for
 *  the demo). S.O. 1364(E), 2025. Investment is in LAKH. */
export function classifyMsme(investmentLakh: number): MsmeCategory {
  if (investmentLakh <= 250) return "Micro"; // ≤ ₹2.5 crore
  if (investmentLakh <= 2500) return "Small"; // ≤ ₹25 crore
  if (investmentLakh <= 12500) return "Medium"; // ≤ ₹125 crore
  return "Large";
}

/** Factories Act applicability: 10+ workers with power, 20+ without. */
export function factoryApplies(workers: number, usesPower: boolean): boolean {
  return usesPower ? workers >= 10 : workers >= 20;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function hydrate(
  id: string,
  reason: string,
  state: string,
  category?: PollutionCategory
): Approval | null {
  const base = CATALOG[id];
  if (!base) return null; // id referenced but not in catalog — skip safely
  const dept = STATE_DEPTS[state]?.[id] ?? base.department;
  return { ...base, department: dept, reason, category };
}

/** Resolve a free-text description OR an explicit key to a business-type key. */
export function resolveBusinessType(input: string): string {
  const key = input.trim().toLowerCase();
  if (BTYPES[key]) return key; // already a valid key
  // alias / substring match against the description
  for (const [typeKey, def] of Object.entries(BTYPES)) {
    if (typeKey === "generic" || typeKey.startsWith("_")) continue;
    if (!def || !Array.isArray(def.aliases)) continue;
    if (def.aliases.some((a) => key.includes(a))) return typeKey;
  }
  return "generic";
}

// ---------------------------------------------------------------------------
// The engine
// ---------------------------------------------------------------------------

export function generateChecklist(profile: BusinessProfile): ChecklistResult {
  const bt = BTYPES[profile.businessType] ?? BTYPES["generic"];
  const state = profile.state;
  const msme = classifyMsme(profile.investmentLakh);
  const pollution = bt.pollution;
  const isManufacturing = !!bt.defaults.manufacturing;
  const factory = isManufacturing && factoryApplies(profile.workers, profile.usesPower);
  const needsPollutionConsent = pollution !== "white";

  const approvals: Approval[] = [];
  const add = (id: string, reason: string, category?: PollutionCategory) => {
    const a = hydrate(id, reason, state, category);
    if (a) approvals.push(a);
  };

  // 1. Entity / company structure (before anything else)
  if (profile.entityType === "company") {
    add("company_incorporation", "You chose a Private Limited company structure.");
  }
  if (profile.isStartup) {
    add("startup_dpiit", "You indicated this is a startup — DPIIT recognition unlocks tax and funding benefits.");
  }

  // 2. Universal registrations (almost every business)
  add("udyam", `Every enterprise should register — sets your MSME status (${msme}).`);
  add("gst", "Required once turnover crosses the threshold; needed for interstate trade and B2B.");
  add("trade_licence", "Required by the local body to operate any commercial premises.");
  add("shops", "Mandatory for any establishment employing people.");

  // 3. Sector-specific approvals (from the business type)
  const sectorReasons: Record<string, string> = {
    bis_isi: "Packaged drinking water must carry the ISI mark (mandatory certification).",
    fssai: "Any business that handles, sells, or manufactures food needs an FSSAI licence.",
    groundwater_noc: "Extracting groundwater for commercial use requires a CGWA/State NOC.",
    drug_licence: "Selling medicines requires a Drug Licence under the Drugs & Cosmetics Act.",
    legal_metrology: "Selling goods by weight or measure requires Legal Metrology registration.",
    excise_licence: "Selling liquor requires an Excise licence.",
    eating_house: "Serving food to the public requires an Eating House licence.",
  };
  for (const id of bt.sectorApprovals) {
    // FSSAI is also gated by handlesFood so a non-food variant won't wrongly get it
    if (id === "fssai" && !(profile.handlesFood || bt.defaults.handlesFood)) continue;
    add(id, sectorReasons[id] ?? "Required for this type of business.");
  }
  // If a non-food business type is nonetheless handling food, add FSSAI anyway.
  if (
    profile.handlesFood &&
    !bt.sectorApprovals.includes("fssai") &&
    !approvals.some((a) => a.id === "fssai")
  ) {
    add("fssai", "You indicated you will handle or sell food — FSSAI licence applies.");
  }

  // 4. Pollution consents (trigger: not White category)
  if (needsPollutionConsent) {
    add("cte", `Your activity is ${pollution.toUpperCase()} category — Consent to Establish is required before setup.`, pollution);
    add("cto", `Consent to Operate is required before you begin operations (${pollution.toUpperCase()} category).`, pollution);
  }

  // 5. Groundwater NOC (trigger: uses groundwater and not already added)
  if (profile.usesGroundwater && !approvals.some((a) => a.id === "groundwater_noc")) {
    add("groundwater_noc", "You indicated you will use a borewell / groundwater.");
  }

  // 6. Factory + Fire (trigger: manufacturing above the worker threshold)
  if (factory) {
    add("factory_licence", `Manufacturing with ${profile.workers} workers${profile.usesPower ? " and power" : ""} — Factories Act applies.`);
    add("fire_noc", "A factory premises requires a Fire Safety NOC.");
  }

  // 7. Labour registrations (trigger: worker count)
  if (profile.workers >= 20) {
    add("epf", "EPF registration is mandatory at 20 or more employees.");
  }
  if (profile.workers >= 10) {
    add("esi", "ESI registration is mandatory at 10 or more employees.");
  }

  // 8. Power connection (trigger: uses power)
  if (profile.usesPower) {
    add("power_connection", "An industrial/commercial power connection is needed for machinery.");
  }

  // Incentives (illustrative, keyed off MSME + manufacturing)
  const incentives: { name: string; note: string }[] = [];
  if (isManufacturing) {
    incentives.push({ name: "Capital Investment Subsidy", note: `${msme} manufacturing units are typically eligible.` });
    incentives.push({ name: "Stamp Duty Reimbursement", note: "On land / first sale deed for the unit." });
    incentives.push({ name: "Power Cost Reimbursement", note: "Per-unit reimbursement, usually first 5 years." });
  } else {
    incentives.push({ name: "MSME Credit Guarantee (CGTMSE)", note: "Collateral-free loans for registered MSMEs." });
    incentives.push({ name: "PMEGP Subsidy", note: "Margin-money subsidy for new micro enterprises." });
  }

  return {
    businessLabel: bt.label,
    msme,
    pollution,
    factoryApplies: factory,
    needsPollutionConsent,
    approvals,
    incentives,
  };
}
