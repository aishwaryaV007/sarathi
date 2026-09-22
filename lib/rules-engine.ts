// ============================================================================
// Sarathi Rules Engine  —  THE CORE / the "brain"
// ----------------------------------------------------------------------------
// Takes a multi-factor BusinessProfile and returns a dynamic, statute-cited,
// location-resolved, 3-tier checklist (Applicable, Needs Verification, Not Applicable)
// along with dynamically matched government incentive schemes.
//
// Architectural separation:
//   1. data/approvals/catalog.json: Content, portal URLs, documents, stages
//   2. data/approvals/rules.json: Declarative triggers, conditions, verification logic
//   3. data/schemes/schemes.json: Government schemes & dynamic eligibility conditions
//   4. lib/rules-engine.ts: Evaluation pipeline, location authority resolver,
//      and dependency staging.
// ============================================================================

import catalog from "../data/approvals/catalog.json";
import rulesData from "../data/approvals/rules.json";
import schemesData from "../data/schemes/schemes.json";
import type {
  BusinessProfile,
  Approval,
  ChecklistResult,
  MsmeCategory,
  PollutionCategory,
  ApplicabilityStatus,
  SchemeMatch,
  LegalStructure,
  BusinessActivity,
  Sector,
  JurisdictionType,
} from "./types";

interface CatalogEntry {
  id: string;
  name: string;
  department: string;
  statute: string;
  timeline: string;
  documents: string[];
  icon: string;
  portalUrl: string;
  sourceUrl?: string;
  stage?: number;
  stageName?: string;
  dependsOn?: string[];
  locationDependent?: boolean;
  submissionType?: "online" | "physical" | "both";
}

interface SchemeEntry {
  id: string;
  name: string;
  department: string;
  description: string;
  subsidy: string;
  maxAmount: string;
  tags: string[];
  eligibleSectors?: string[];
  eligibleActivities?: string[];
  eligibleEnterpriseSizes?: string[];
  eligibleLegalStructures?: string[];
  eligibleStates?: string[];
  eligibleStages?: string[];
  eligibleStartupOnly?: boolean;
  minInvestmentLakh?: number;
  maxInvestmentLakh?: number;
  portalUrl?: string;
}

const CATALOG = catalog as unknown as Record<string, CatalogEntry>;
const RULES = (rulesData as any).rules as Record<string, any>;
const SCHEMES = schemesData as unknown as SchemeEntry[];

// ---------------------------------------------------------------------------
// MSME Thresholds Config (easy to update in one place)
// ---------------------------------------------------------------------------

export const MSME_THRESHOLDS = {
  Micro: { maxInvestmentLakh: 250, maxTurnoverLakh: 1000 },
  Small: { maxInvestmentLakh: 2500, maxTurnoverLakh: 10000 },
  Medium: { maxInvestmentLakh: 12500, maxTurnoverLakh: 25000 },
} as const;

/** MSME category from investment and turnover. Notification S.O. 1364(E), 2025. */
export function classifyMsme(investmentLakh: number, turnoverLakh?: number): MsmeCategory {
  const inv = Number(investmentLakh) || 0;
  const turn = Number(turnoverLakh) || 0;

  // Micro: Investment <= ₹2.5 Cr (250 Lakhs) and Turnover <= ₹10 Cr (1000 Lakhs)
  if (inv <= MSME_THRESHOLDS.Micro.maxInvestmentLakh && turn <= MSME_THRESHOLDS.Micro.maxTurnoverLakh) return "Micro";
  // Small: Investment <= ₹25 Cr (2500 Lakhs) and Turnover <= ₹100 Cr (10000 Lakhs)
  if (inv <= MSME_THRESHOLDS.Small.maxInvestmentLakh && turn <= MSME_THRESHOLDS.Small.maxTurnoverLakh) return "Small";
  // Medium: Investment <= ₹125 Cr (12500 Lakhs) and Turnover <= ₹250 Cr (25000 Lakhs)
  if (inv <= MSME_THRESHOLDS.Medium.maxInvestmentLakh && turn <= MSME_THRESHOLDS.Medium.maxTurnoverLakh) return "Medium";
  return "Large";
}

/** Factories Act applicability: 10+ workers with power, 20+ without power. */
export function factoryApplies(workers: number, usesPower: boolean): boolean {
  const w = Number(workers) || 0;
  return usesPower ? w >= 10 : w >= 20;
}

// ---------------------------------------------------------------------------
// Dynamic Constitution-Based Document Tailoring
// ---------------------------------------------------------------------------

export function getConstitutionDocs(legalStructure: LegalStructure, specificDocs: string[] = []): string[] {
  let baseDocs: string[] = [];
  switch (legalStructure) {
    case "sole_proprietorship":
      baseDocs = [
        "Promoter PAN Card",
        "Promoter Aadhaar Card",
        "Bank account statement / cancelled cheque",
        "Premises proof (Electricity Bill / Rent Agreement)",
      ];
      break;
    case "partnership":
      baseDocs = [
        "Partnership Deed",
        "PAN of Firm",
        "Partners ID & Address Proof",
        "Premises proof (Electricity Bill / Rent Agreement)",
      ];
      break;
    case "llp":
      baseDocs = [
        "LLP Agreement",
        "Certificate of Incorporation",
        "PAN of LLP",
        "Designated Partner DIN/DPIN",
        "Premises proof (Electricity Bill / Rent Agreement)",
      ];
      break;
    case "private_limited":
    case "public_limited":
    case "opc":
      baseDocs = [
        "Certificate of Incorporation (SPICe+)",
        "MOA & AOA",
        "PAN & TAN of Company",
        "Board Resolution",
        "Director DIN & KYC",
        "Premises proof (Electricity Bill / Rent Agreement)",
      ];
      break;
    default:
      baseDocs = [
        "Promoter PAN Card",
        "Promoter Aadhaar Card",
        "Premises proof (Electricity Bill / Rent Agreement)",
      ];
      break;
  }
  const set = new Set([...baseDocs, ...specificDocs]);
  return Array.from(set);
}

// ---------------------------------------------------------------------------
// Declarative Rule Approval Definitions
// ---------------------------------------------------------------------------

export interface RuleApprovalDefinition {
  id: string;
  name: string;
  authority: string;
  level: "mandatory" | "recommended";
  appliesWhen: (answers: BusinessProfile) => boolean;
  triggerText: (answers: BusinessProfile) => string;
  requiredDocs: (answers: BusinessProfile) => string[];
}

export const RULE_APPROVAL_DEFINITIONS: Record<string, RuleApprovalDefinition> = {
  company_incorporation: {
    id: "company_incorporation",
    name: "Company Incorporation (SPICe+)",
    authority: "Ministry of Corporate Affairs (MCA)",
    level: "mandatory",
    appliesWhen: (p) => ["private_limited", "public_limited", "opc"].includes(p.legalStructure),
    triggerText: (p) =>
      `Corporate legal structure (${p.legalStructure.replace(/_/g, " ")}) requires statutory incorporation under the Companies Act, 2013 via SPICe+`,
    requiredDocs: (p) =>
      getConstitutionDocs(p.legalStructure, [
        "Director DIN & DSC",
        "MOA & AOA",
        "Registered office address proof",
        "Declaration of Compliance",
      ]),
  },
  startup_dpiit: {
    id: "startup_dpiit",
    name: "Startup India (DPIIT) Recognition",
    authority: "DPIIT, Ministry of Commerce & Industry",
    level: "recommended",
    appliesWhen: (p) =>
      p.isStartup === true && ["private_limited", "llp", "partnership"].includes(p.legalStructure),
    triggerText: (p) =>
      `Startup venture with eligible constitution (${p.legalStructure.replace(/_/g, " ")}) qualifies for 80-IAC tax exemption and seed funding recognition under Startup India`,
    requiredDocs: () => [
      "Incorporation / Registration Certificate",
      "PAN of Entity",
      "Brief write-up on innovation & scalability",
    ],
  },
  udyam: {
    id: "udyam",
    name: "Udyam (MSME) Registration",
    authority: "Ministry of MSME, Government of India",
    level: "recommended",
    appliesWhen: (p) => classifyMsme(p.investmentLakh, p.annualTurnoverLakh) !== "Large",
    triggerText: (p) => {
      const msme = classifyMsme(p.investmentLakh, p.annualTurnoverLakh);
      return `Classified as ${msme} Enterprise based on investment of ₹${p.investmentLakh} lakh and turnover of ₹${p.annualTurnoverLakh || 0} lakh`;
    },
    requiredDocs: (p) =>
      getConstitutionDocs(p.legalStructure, [
        "Aadhaar of Promoter",
        "PAN of Enterprise / Promoter",
        "Bank Account Details",
      ]),
  },
  gst: {
    id: "gst",
    name: "GST Registration",
    authority: "Central Board of Indirect Taxes & Customs (CBIC)",
    level: "mandatory",
    appliesWhen: (p) =>
      Boolean(
        (p.annualTurnoverLakh || 0) >= 20 ||
          ["private_limited", "public_limited", "llp"].includes(p.legalStructure) ||
          p.isManufacturing
      ),
    triggerText: (p) => {
      if ((p.annualTurnoverLakh || 0) >= 20) {
        return `Turnover (₹${p.annualTurnoverLakh} lakh) reaches or exceeds the ₹20L statutory threshold for mandatory GST registration`;
      }
      if (["private_limited", "public_limited", "llp"].includes(p.legalStructure)) {
        return `Corporate entity (${p.legalStructure.replace(/_/g, " ")}) requires GSTIN for inter-state transactions and bank accounts`;
      }
      return `Manufacturing activity requires GST registration for Input Tax Credit`;
    },
    requiredDocs: (p) =>
      getConstitutionDocs(p.legalStructure, [
        "Entity PAN",
        "Premises Proof (Electricity Bill / Lease)",
        "Bank statement / cancelled cheque",
        "Promoter Photo & Aadhaar",
      ]),
  },
  trade_licence: {
    id: "trade_licence",
    name: "Trade / Establishment Licence",
    authority: "Local Municipal Body / Gram Panchayat",
    level: "mandatory",
    appliesWhen: (p) => Boolean(p.hasPhysicalPremises && p.premisesType !== "home_office"),
    triggerText: (p) =>
      `Operating physical commercial premises in ${p.city || "local municipality"} requires municipal trade licence`,
    requiredDocs: (p) =>
      getConstitutionDocs(p.legalStructure, [
        "Premises ownership proof / Lease agreement",
        "Property tax payment receipt",
        "Premises layout photo",
      ]),
  },
  power_connection: {
    id: "power_connection",
    name: "Industrial / Commercial Power Connection",
    authority: "State Electricity Distribution Company (DISCOM)",
    level: "mandatory",
    appliesWhen: (p) => Boolean(p.usesPower || (p.hasPhysicalPremises && p.isManufacturing)),
    triggerText: () =>
      `Commercial / Industrial power load sanction required from DISCOM for operations and machinery`,
    requiredDocs: () => [
      "Electricity bill of premises / meter details",
      "Connected load application & wiring test report",
      "Premises ownership or rent deed",
    ],
  },
  fssai: {
    id: "fssai",
    name: "FSSAI Food Licence",
    authority: "Food Safety & Standards Authority of India (FSSAI)",
    level: "mandatory",
    appliesWhen: (p) => p.handlesFood === true,
    triggerText: () =>
      `Handling, preparing, storing, or packaging food products requires statutory licensing under Food Safety & Standards Act, 2006`,
    requiredDocs: (p) =>
      getConstitutionDocs(p.legalStructure, [
        "Food safety management plan",
        "Water testing analysis report (NABL accredited lab)",
        "List of food categories",
        "Premises layout plan",
      ]),
  },
  eating_house: {
    id: "eating_house",
    name: "Eating House Licence",
    authority: "Local Police Commissionerate / Municipal Body",
    level: "mandatory",
    appliesWhen: (p) =>
      p.handlesFood === true && p.businessActivity === "food_service" && p.dineIn === true,
    triggerText: () =>
      `Public restaurant / dining establishment with dine-in facilities requires Police Commissionerate Eating House licence`,
    requiredDocs: () => [
      "Trade Licence",
      "FSSAI Food Licence",
      "Fire Safety NOC / Self-declaration",
      "Dining seating layout plan",
      "Police character verification certificate",
    ],
  },
  excise_licence: {
    id: "excise_licence",
    name: "State Excise Licence (Liquor / Bar)",
    authority: "State Prohibition & Excise Department",
    level: "mandatory",
    appliesWhen: (p) =>
      p.servesAlcohol === true && ["food_service", "retail"].includes(p.businessActivity),
    triggerText: () =>
      `Selling, dispensing, or serving alcoholic beverages requires State Prohibition & Excise licence`,
    requiredDocs: () => [
      "Premises layout map (distance > 100m from temples/schools)",
      "Eating House Licence / Trade Licence",
      "Police character clearance certificate",
      "Solvency certificate",
    ],
  },
  legal_metrology: {
    id: "legal_metrology",
    name: "Legal Metrology Registration",
    authority: "State Legal Metrology Department",
    level: "mandatory",
    appliesWhen: (p) => p.usesWeighingInstruments === true,
    triggerText: () =>
      `Use of commercial weighing or measuring instruments in trade requires verification and stamping under Legal Metrology Act, 2009`,
    requiredDocs: () => [
      "Weighing instrument model approval certificate",
      "Purchase bill of weighing scale / instruments",
      "Premises possession proof",
    ],
  },
  drug_licence: {
    id: "drug_licence",
    name: "Drug Licence (Retail / Wholesale)",
    authority: "State Drugs Control Administration",
    level: "mandatory",
    appliesWhen: (p) => p.handlesDrugs === true && p.businessActivity === "pharmacy",
    triggerText: () =>
      `Dispensing, stocking, and retailing pharmaceutical medicines requires Drug Licence (Form 20/21) under Drugs & Cosmetics Act, 1940`,
    requiredDocs: () => [
      "Registered Pharmacist certificate & affidavit",
      "Refrigerator purchase invoice",
      "Premises layout plan (min 10 sq.m)",
      "Premises lease or ownership deed",
    ],
  },
  factory_licence: {
    id: "factory_licence",
    name: "Factory Plan Approval & Licence",
    authority: "State Directorate of Factories / DISH",
    level: "mandatory",
    appliesWhen: (p) => Boolean(p.isManufacturing && factoryApplies(p.workers, !!p.usesPower)),
    triggerText: (p) =>
      `Manufacturing workforce (${p.workers} workers) with ${p.usesPower ? "power (threshold 10+)" : "manual power (threshold 20+)"} triggers mandatory Factories Act, 1948 licence`,
    requiredDocs: () => [
      "Factory building layout plan approved by DISH",
      "Machinery layout & power load list",
      "Pollution Consent to Establish (CTE)",
      "Local authority clearance",
    ],
  },
  cte: {
    id: "cte",
    name: "Consent to Establish (CTE)",
    authority: "State Pollution Control Board",
    level: "mandatory",
    appliesWhen: (p) => Boolean(p.isManufacturing && classifyPollutionCategory(p) !== "white"),
    triggerText: (p) =>
      `Manufacturing operations classified under ${classifyPollutionCategory(p).toUpperCase()} pollution category require Consent to Establish (CTE) before plant setup`,
    requiredDocs: () => [
      "Detailed Project Report (DPR)",
      "Site layout plan",
      "Effluent & emission treatment plant design scheme",
      "Land conversion & title deed",
    ],
  },
  cto: {
    id: "cto",
    name: "Consent to Operate (CTO)",
    authority: "State Pollution Control Board",
    level: "mandatory",
    appliesWhen: (p) => Boolean(p.isManufacturing && classifyPollutionCategory(p) !== "white"),
    triggerText: (p) =>
      `Manufacturing operations classified under ${classifyPollutionCategory(p).toUpperCase()} pollution category require Consent to Operate (CTO) prior to commercial production`,
    requiredDocs: () => [
      "CTE compliance report",
      "Pollution control equipment installation verification",
      "Environmental management plan",
    ],
  },
  groundwater_noc: {
    id: "groundwater_noc",
    name: "Ground Water Extraction NOC",
    authority: "Central Ground Water Authority (CGWA) / State Ground Water Dept",
    level: "mandatory",
    appliesWhen: (p) => p.usesGroundwater === true,
    triggerText: () =>
      `Commercial borewell extraction of groundwater requires mandatory NOC from CGWA / State Ground Water Authority`,
    requiredDocs: () => [
      "Hydrogeological survey report",
      "Digital flow meter specifications with telemetry",
      "Artificial recharge and rainwater harvesting proposal",
      "Land ownership proof",
    ],
  },
  fire_noc: {
    id: "fire_noc",
    name: "Fire Safety NOC",
    authority: "State Disaster Response & Fire Services",
    level: "mandatory",
    appliesWhen: (p) =>
      Boolean(p.hasPhysicalPremises && (p.isManufacturing && factoryApplies(p.workers, !!p.usesPower))),
    triggerText: () =>
      `Factory manufacturing premises with workforce and machinery requires statutory Fire Safety NOC`,
    requiredDocs: () => [
      "Fire safety layout plan",
      "Fire extinguisher and hydrant installation certificate",
      "Water storage capacity certificate",
    ],
  },
  shops: {
    id: "shops",
    name: "Shops & Establishment Registration",
    authority: "State Labour Department",
    level: "mandatory",
    appliesWhen: (p) => Boolean(p.hasPhysicalPremises && !p.isManufacturing),
    triggerText: () =>
      `Physical commercial establishment operating outside the Factories Act requires registration under State Shops & Establishments Act`,
    requiredDocs: (p) =>
      getConstitutionDocs(p.legalStructure, [
        "Premises rental agreement / sale deed",
        "Employer PAN & ID",
        "Employee list & details",
      ]),
  },
  esi: {
    id: "esi",
    name: "ESI Registration",
    authority: "ESIC (via Shram Suvidha)",
    level: "mandatory",
    appliesWhen: (p) => p.workers >= 10,
    triggerText: (p) =>
      `Workforce of ${p.workers} meets or exceeds statutory threshold (10+ employees) under Employees' State Insurance Act, 1948`,
    requiredDocs: () => [
      "Entity PAN & Certificate",
      "Employee list with monthly wage details",
      "Bank account details",
      "Employer ID proof",
    ],
  },
  epf: {
    id: "epf",
    name: "EPF Registration",
    authority: "EPFO (via Shram Suvidha)",
    level: "mandatory",
    appliesWhen: (p) => p.workers >= 20,
    triggerText: (p) =>
      `Workforce of ${p.workers} meets or exceeds statutory threshold (20+ employees) under Employees' Provident Funds Act, 1952`,
    requiredDocs: () => [
      "Entity PAN & Certificate",
      "Employee details (Aadhaar & Bank info for UAN)",
      "Salary register & date of setup",
      "Promoter KYC",
    ],
  },
  bis_isi: {
    id: "bis_isi",
    name: "BIS Certification (ISI Mark)",
    authority: "Bureau of Indian Standards (BIS)",
    level: "mandatory",
    appliesWhen: (p) =>
      Boolean(
        p.isManufacturing &&
          (!!p.description?.toLowerCase().includes("water") || p.sector === "chemicals")
      ),
    triggerText: () =>
      `Product category is under mandatory Quality Control Order (QCO) requiring Bureau of Indian Standards (BIS) ISI mark certification`,
    requiredDocs: () => [
      "In-house testing laboratory layout & equipment list",
      "NABL test reports",
      "Manufacturing process flowchart",
      "Quality control staff qualifications",
    ],
  },
};

/**
 * Tracks catalog approvals that do NOT have a condition defined.
 * If an approval has no condition defined, it MUST NOT appear in the list.
 */
export const APPROVALS_NEEDING_CONDITIONS: string[] = Object.keys(CATALOG).filter(
  (id) => !id.startsWith("_") && !RULE_APPROVAL_DEFINITIONS[id]
);


/** CPCB Pollution Categorisation (White, Green, Orange, Red) */
export function classifyPollutionCategory(profile: BusinessProfile): PollutionCategory {
  if (profile.pollutionCategory) return profile.pollutionCategory;

  const activity = profile.businessActivity;
  const sector = profile.sector;

  if (profile.generatesHazardousWaste || sector === "chemicals") {
    return "red";
  }

  if (activity === "manufacturing" || activity === "food_processing") {
    if (profile.waterEffluentDischarge || profile.usesGroundwater) {
      return "orange";
    }
    return "orange";
  }

  if (activity === "food_service") {
    return "green";
  }

  if (sector === "it_tech" || activity === "it_services" || activity === "services") {
    return "white";
  }

  if (activity === "retail" || activity === "wholesale" || activity === "pharmacy") {
    return "white";
  }

  return "white";
}

// ---------------------------------------------------------------------------
// Location Authority Resolver (GHMC vs CDMA vs Panchayat)
// ---------------------------------------------------------------------------

export interface LocationAuthorityResult {
  tradeAuthority: string;
  tradePortal: string;
  tradeStatute: string;
  authorityType: "GHMC" | "CDMA" | "Panchayat" | "State" | "Central";
  powerDiscom: string;
  powerPortal: string;
  pcbDept: string;
  pcbPortal: string;
  factoriesDept: string;
  factoriesPortal: string;
  fireDept: string;
  firePortal: string;
  labourDept: string;
  labourPortal: string;
  locationLabel: string;
}

const GHMC_AREAS = [
  "hyderabad",
  "secunderabad",
  "ghmc",
  "cyberabad",
  "kukatpally",
  "gachibowli",
  "madhapur",
  "hitec",
  "serilingampally",
  "charminar",
  "lb nagar",
  "malkajgiri",
  "jubilee hills",
  "banjara hills",
  "begumpet",
  "uppal",
  "dilsukhnagar",
  "khairatabad",
  "ameerpet",
  "manikonda",
  "kondapur",
  "miyapur",
  "alwal",
  "quthbullapur",
  "kapra",
];

const RURAL_KEYWORDS = [
  "panchayat",
  "gram panchayat",
  "village",
  "rural",
  "mandal",
  "gp",
];

const NORTH_TS_AREAS = [
  "warangal",
  "karimnagar",
  "nizamabad",
  "khammam",
  "adilabad",
  "ramagundam",
  "mancherial",
  "jagtial",
];

export function resolveLocationAuthority(
  state: string = "telangana",
  city: string = "",
  jurisdictionType?: JurisdictionType
): LocationAuthorityResult {
  const normCity = (city || "").toLowerCase().trim();
  const normState = (state || "telangana").toLowerCase().trim();

  // 1. TELANGANA
  if (normState === "telangana" || normState === "ts") {
    const isExplicitGhmc = jurisdictionType === "ghmc" || GHMC_AREAS.some((area) => normCity.includes(area));
    const isExplicitRural = jurisdictionType === "panchayat" || RURAL_KEYWORDS.some((kw) => normCity.includes(kw));
    const isNorthTS = NORTH_TS_AREAS.some((area) => normCity.includes(area));

    const powerDiscom = isNorthTS
      ? "Northern Power Distribution Company of Telangana (TSNPDCL)"
      : "Southern Power Distribution Company of Telangana (TSSPDCL)";
    const powerPortal = isNorthTS
      ? "https://www.tsnpdcl.in"
      : "https://www.tssspdcl.com";

    if (isExplicitGhmc) {
      return {
        tradeAuthority: "Greater Hyderabad Municipal Corporation (GHMC)",
        tradePortal: "https://www.ghmc.gov.in",
        tradeStatute: "Greater Hyderabad Municipal Corporation Act, 1955",
        authorityType: "GHMC",
        powerDiscom,
        powerPortal,
        pcbDept: "Telangana State Pollution Control Board (TSPCB)",
        pcbPortal: "https://tspcb.cgg.gov.in",
        factoriesDept: "Directorate of Factories, Telangana (via TS-iPASS)",
        factoriesPortal: "https://tsipass.telangana.gov.in",
        fireDept: "Telangana State Disaster Response & Fire Services",
        firePortal: "https://fire.telangana.gov.in",
        labourDept: "Labour Department, Government of Telangana",
        labourPortal: "https://labour.telangana.gov.in",
        locationLabel: "GHMC Urban Jurisdiction (Hyderabad Metropolitan Area)",
      };
    }

    if (isExplicitRural) {
      return {
        tradeAuthority: "Gram Panchayat / Panchayat Raj & Rural Development Department",
        tradePortal: "https://epanchayat.telangana.gov.in",
        tradeStatute: "Telangana Panchayat Raj Act, 2018",
        authorityType: "Panchayat",
        powerDiscom,
        powerPortal,
        pcbDept: "Telangana State Pollution Control Board (TSPCB)",
        pcbPortal: "https://tspcb.cgg.gov.in",
        factoriesDept: "Directorate of Factories, Telangana (via TS-iPASS)",
        factoriesPortal: "https://tsipass.telangana.gov.in",
        fireDept: "Telangana State Disaster Response & Fire Services",
        firePortal: "https://fire.telangana.gov.in",
        labourDept: "Labour Department, Government of Telangana",
        labourPortal: "https://labour.telangana.gov.in",
        locationLabel: "Rural Gram Panchayat Jurisdiction (Telangana)",
      };
    }

    // CDMA / Urban Municipality
    const cityNameDisplay = city ? city.trim() : "Local";
    return {
      tradeAuthority: `Commissioner & Director of Municipal Administration (CDMA) / ${cityNameDisplay} Municipality`,
      tradePortal: "https://cdma.telangana.gov.in",
      tradeStatute: "Telangana Municipalities Act, 2019",
      authorityType: "CDMA",
      powerDiscom,
      powerPortal,
      pcbDept: "Telangana State Pollution Control Board (TSPCB)",
      pcbPortal: "https://tspcb.cgg.gov.in",
      factoriesDept: "Directorate of Factories, Telangana (via TS-iPASS)",
      factoriesPortal: "https://tsipass.telangana.gov.in",
      fireDept: "Telangana State Disaster Response & Fire Services",
      firePortal: "https://fire.telangana.gov.in",
      labourDept: "Labour Department, Government of Telangana",
      labourPortal: "https://labour.telangana.gov.in",
      locationLabel: `CDMA Urban Local Body (${cityNameDisplay} Municipality)`,
    };
  }

  // 2. MAHARASHTRA
  if (normState === "maharashtra") {
    const isMumbai = ["mumbai", "bmc", "mcgm", "suburban", "thane"].some((a) =>
      normCity.includes(a)
    );
    const isPune = ["pune", "pmc", "pcmc"].some((a) => normCity.includes(a));
    const isRural = jurisdictionType === "panchayat" || RURAL_KEYWORDS.some((kw) => normCity.includes(kw));

    if (isMumbai) {
      return {
        tradeAuthority: "Brihanmumbai Municipal Corporation (BMC / MCGM)",
        tradePortal: "https://portal.mcgm.gov.in",
        tradeStatute: "Mumbai Municipal Corporation Act, 1888",
        authorityType: "GHMC",
        powerDiscom: "MSEDCL / Adani Electricity / Tata Power",
        powerPortal: "https://www.mahadiscom.in",
        pcbDept: "Maharashtra Pollution Control Board (MPCB)",
        pcbPortal: "https://mpcb.gov.in",
        factoriesDept: "Directorate of Industrial Safety & Health (DISH), Maharashtra",
        factoriesPortal: "https://dish.maharashtra.gov.in",
        fireDept: "Mumbai Fire Brigade / Maharashtra Fire Services",
        firePortal: "https://portal.mcgm.gov.in",
        labourDept: "Labour Department, Government of Maharashtra",
        labourPortal: "https://lms.mahaonline.gov.in",
        locationLabel: "BMC Metropolitan Jurisdiction (Mumbai)",
      };
    }

    if (isPune) {
      return {
        tradeAuthority: "Pune Municipal Corporation (PMC)",
        tradePortal: "https://pmc.gov.in",
        tradeStatute: "Maharashtra Municipal Corporations Act, 1949",
        authorityType: "CDMA",
        powerDiscom: "MSEDCL",
        powerPortal: "https://www.mahadiscom.in",
        pcbDept: "Maharashtra Pollution Control Board (MPCB)",
        pcbPortal: "https://mpcb.gov.in",
        factoriesDept: "Directorate of Industrial Safety & Health (DISH), Maharashtra",
        factoriesPortal: "https://dish.maharashtra.gov.in",
        fireDept: "Maharashtra Fire Services",
        firePortal: "https://nfs.mahaonline.gov.in",
        labourDept: "Labour Department, Government of Maharashtra",
        labourPortal: "https://lms.mahaonline.gov.in",
        locationLabel: "PMC Urban Local Body (Pune)",
      };
    }

    if (isRural) {
      return {
        tradeAuthority: "Gram Panchayat / Rural Development Department, Maharashtra",
        tradePortal: "https://rdd.maharashtra.gov.in",
        tradeStatute: "Maharashtra Village Panchayats Act, 1959",
        authorityType: "Panchayat",
        powerDiscom: "MSEDCL",
        powerPortal: "https://www.mahadiscom.in",
        pcbDept: "Maharashtra Pollution Control Board (MPCB)",
        pcbPortal: "https://mpcb.gov.in",
        factoriesDept: "Directorate of Industrial Safety & Health (DISH), Maharashtra",
        factoriesPortal: "https://dish.maharashtra.gov.in",
        fireDept: "Maharashtra Fire Services",
        firePortal: "https://nfs.mahaonline.gov.in",
        labourDept: "Labour Department, Government of Maharashtra",
        labourPortal: "https://lms.mahaonline.gov.in",
        locationLabel: "Rural Gram Panchayat Jurisdiction (Maharashtra)",
      };
    }

    return {
      tradeAuthority: `Directorate of Municipal Administration / ${city || "Local"} Municipal Council`,
      tradePortal: "https://mahamunici.in",
      tradeStatute: "Maharashtra Municipal Councils Act, 1965",
      authorityType: "CDMA",
      powerDiscom: "MSEDCL",
      powerPortal: "https://www.mahadiscom.in",
      pcbDept: "Maharashtra Pollution Control Board (MPCB)",
      pcbPortal: "https://mpcb.gov.in",
      factoriesDept: "Directorate of Industrial Safety & Health (DISH), Maharashtra",
      factoriesPortal: "https://dish.maharashtra.gov.in",
      fireDept: "Maharashtra Fire Services",
      firePortal: "https://nfs.mahaonline.gov.in",
      labourDept: "Labour Department, Government of Maharashtra",
      labourPortal: "https://lms.mahaonline.gov.in",
      locationLabel: "Municipal Council / Local Body (Maharashtra)",
    };
  }

  // 3. OTHER STATES / DEFAULT
  return {
    tradeAuthority: "Local Municipal Corporation / Urban Local Body / Gram Panchayat",
    tradePortal: "",
    tradeStatute: "State Municipalities Act / Panchayat Raj Act",
    authorityType: jurisdictionType === "panchayat" ? "Panchayat" : "CDMA",
    powerDiscom: "State Electricity Distribution Company (DISCOM)",
    powerPortal: "",
    pcbDept: "State Pollution Control Board (SPCB)",
    pcbPortal: "",
    factoriesDept: "State Directorate of Factories / Boilers",
    factoriesPortal: "",
    fireDept: "State Disaster Response & Fire Services",
    firePortal: "",
    labourDept: "State Labour Department",
    labourPortal: "",
    locationLabel: `${state ? state.charAt(0).toUpperCase() + state.slice(1) : "Local"} Jurisdiction`,
  };
}

// ---------------------------------------------------------------------------
// Normalization & Backward Compatibility
// ---------------------------------------------------------------------------

export function normalizeProfile(raw: Partial<BusinessProfile>): BusinessProfile {
  // Infer legal structure
  let legalStructure: LegalStructure = raw.legalStructure || "sole_proprietorship";
  if (!raw.legalStructure && raw.entityType) {
    if (raw.entityType === "company") legalStructure = "private_limited";
    else if (raw.entityType === "partnership") legalStructure = "partnership";
    else if (raw.entityType === "proprietor") legalStructure = "sole_proprietorship";
  }

  // Infer activity & sector from description or flags if missing
  const desc = (raw.description || "").toLowerCase();
  let businessActivity: BusinessActivity = raw.businessActivity || "services";
  let sector: Sector = raw.sector || "services";

  if (!raw.businessActivity) {
    if (raw.isManufacturing || desc.includes("manufacturing") || desc.includes("plant") || desc.includes("factory") || desc.includes("mill") || desc.includes("fabricat")) {
      businessActivity = desc.includes("food") || desc.includes("drinking water") || desc.includes("beverage") ? "food_processing" : "manufacturing";
    } else if (desc.includes("restaurant") || desc.includes("cafe") || desc.includes("hotel") || desc.includes("kitchen") || desc.includes("dhaba") || desc.includes("eatery") || desc.includes("canteen")) {
      businessActivity = "food_service";
    } else if (desc.includes("pharmacy") || desc.includes("medical store") || desc.includes("chemist") || desc.includes("drug")) {
      businessActivity = "pharmacy";
    } else if (desc.includes("software") || desc.includes("it service") || desc.includes("consulting") || desc.includes("tech") || desc.includes("app dev")) {
      businessActivity = "it_services";
    } else if (desc.includes("cloth") || desc.includes("garment") || desc.includes("shop") || desc.includes("retail") || desc.includes("store") || desc.includes("supermarket")) {
      businessActivity = "retail";
    }
  }

  if (!raw.sector) {
    if (businessActivity === "food_service" || businessActivity === "food_processing" || desc.includes("food") || desc.includes("water plant")) {
      sector = "food";
    } else if (businessActivity === "pharmacy" || desc.includes("pharma") || desc.includes("medical")) {
      sector = "healthcare_pharma";
    } else if (businessActivity === "it_services" || desc.includes("software")) {
      sector = "it_tech";
    } else if (businessActivity === "manufacturing") {
      sector = desc.includes("chemical") ? "chemicals" : "manufacturing";
    } else if (businessActivity === "retail") {
      sector = "retail_trade";
    }
  }

  const isManufacturing =
    businessActivity === "manufacturing" ||
    businessActivity === "food_processing" ||
    !!raw.isManufacturing ||
    desc.includes("manufacturing") ||
    desc.includes("water plant");

  const handlesFood =
    raw.handlesFood === true ||
    sector === "food" ||
    businessActivity === "food_service" ||
    businessActivity === "food_processing" ||
    desc.includes("food") ||
    desc.includes("water plant");

  const servesAlcohol =
    raw.servesAlcohol === true ||
    raw.alcohol === true ||
    /\b(alcohol|liquor|wine|beer|bar|pub)\b/i.test(desc);

  const handlesDrugs =
    raw.handlesDrugs === true ||
    businessActivity === "pharmacy" ||
    sector === "healthcare_pharma" ||
    desc.includes("pharmacy") ||
    desc.includes("medical store") ||
    desc.includes("chemist");

  const usesWeighingInstruments =
    raw.usesWeighingInstruments !== undefined
      ? raw.usesWeighingInstruments
      : businessActivity === "retail" ||
        businessActivity === "wholesale" ||
        businessActivity === "food_processing" ||
        desc.includes("grocery") ||
        desc.includes("supermarket");

  const hasPhysicalPremises =
    raw.hasPhysicalPremises !== undefined
      ? raw.hasPhysicalPremises
      : raw.premises === "owned" || raw.premises === "rented" || businessActivity !== "it_services";

  const dineIn =
    raw.dineIn !== undefined
      ? raw.dineIn
      : businessActivity === "food_service" && !desc.includes("cloud kitchen") && !desc.includes("takeaway");

  return {
    description: raw.description || "",
    businessLabel: raw.businessLabel || getBusinessLabel(businessActivity, sector, desc),
    legalStructure,
    businessActivity,
    sector,
    state: raw.state || "telangana",
    city: raw.city || "",
    district: raw.district || "",
    jurisdictionType: raw.jurisdictionType,
    businessStage: raw.businessStage || "new",
    investmentLakh: Number(raw.investmentLakh) || 0,
    annualTurnoverLakh: Number(raw.annualTurnoverLakh) || 0,
    workers: Number(raw.workers) || 0,
    hasPhysicalPremises,
    premises: raw.premises || "rented",
    premisesType: raw.premisesType || (isManufacturing ? "industrial" : hasPhysicalPremises ? "commercial" : "home_office"),
    usesPower: !!raw.usesPower,
    usesMachinery: raw.usesMachinery !== undefined ? raw.usesMachinery : isManufacturing,
    handlesFood,
    dineIn,
    servesAlcohol,
    handlesDrugs,
    usesWeighingInstruments,
    usesGroundwater: !!raw.usesGroundwater,
    pollutionCategory: raw.pollutionCategory,
    generatesHazardousWaste: !!raw.generatesHazardousWaste,
    waterEffluentDischarge: !!raw.waterEffluentDischarge,
    isStartup: !!raw.isStartup,
    // Aliases
    entityType: legalStructure === "private_limited" || legalStructure === "public_limited" || legalStructure === "opc"
      ? "company"
      : legalStructure === "partnership" || legalStructure === "llp"
      ? "partnership"
      : "proprietor",
    isManufacturing,
    sectorApprovals: raw.sectorApprovals || [],
  };
}

function getBusinessLabel(activity: BusinessActivity, sector: Sector, desc: string): string {
  if (desc.includes("water plant")) return "Packaged Drinking Water Plant";
  if (desc.includes("rice mill")) return "Rice / Grain Processing Mill";
  if (activity === "food_service") return "Restaurant / Food Service";
  if (activity === "food_processing") return "Food Processing & Packaging Unit";
  if (activity === "pharmacy") return "Pharmacy / Medical Retail";
  if (activity === "it_services") return "Software & IT Services";
  if (activity === "manufacturing") return sector === "chemicals" ? "Chemical Manufacturing Unit" : "Manufacturing Unit";
  if (activity === "retail") return "Retail Shop / Commercial Store";
  return "Commercial Enterprise";
}

// ---------------------------------------------------------------------------
// Dynamic Multi-Factor Approval Evaluation
// ---------------------------------------------------------------------------

interface EvaluatedApprovalOutput {
  status: ApplicabilityStatus;
  reason: string;
  triggeredBy: string[];
  verificationConditions?: string[];
  missingInfo?: string[];
}

function evaluateApprovalRule(
  id: string,
  profile: BusinessProfile,
  msme: MsmeCategory,
  pollution: PollutionCategory,
  factoryRequired: boolean
): EvaluatedApprovalOutput {
  const rule = RULES[id] || {};
  const isMfg = profile.isManufacturing || profile.businessActivity === "manufacturing" || profile.businessActivity === "food_processing";
  const workers = profile.workers;

  switch (id) {
    // 1. Company Incorporation (SPICe+)
    case "company_incorporation": {
      const isCorporate =
        profile.legalStructure === "private_limited" ||
        profile.legalStructure === "public_limited" ||
        profile.legalStructure === "opc";
      if (isCorporate) {
        return {
          status: "APPLICABLE",
          reason: `SPICe+ incorporation via the Ministry of Corporate Affairs (MCA) is required for your ${profile.legalStructure.replace(/_/g, " ")} structure.`,
          triggeredBy: [`Legal Structure: ${profile.legalStructure.replace(/_/g, " ")}`],
          missingInfo: rule.missingInfo,
        };
      }
      return {
        status: "NOT_APPLICABLE",
        reason: `Your business constitution is a ${profile.legalStructure.replace(/_/g, " ")}. Corporate MCA SPICe+ incorporation does not apply.`,
        triggeredBy: [`Legal Structure: ${profile.legalStructure.replace(/_/g, " ")}`],
      };
    }

    // 2. Startup India (DPIIT) Recognition
    case "startup_dpiit": {
      if (profile.isStartup) {
        const isEligibleEntity =
          profile.legalStructure === "private_limited" ||
          profile.legalStructure === "llp" ||
          profile.legalStructure === "partnership";
        if (isEligibleEntity) {
          return {
            status: "APPLICABLE",
            reason: "You indicated startup intent with an eligible legal constitution. DPIIT recognition unlocks 80-IAC tax exemptions, patent subsidies, and government tender exemptions.",
            triggeredBy: ["Startup status flagged", `Constitution: ${profile.legalStructure.replace(/_/g, " ")}`],
            verificationConditions: rule.verificationConditions,
          };
        }
        return {
          status: "POTENTIALLY_APPLICABLE",
          reason: "You indicated startup intent, but Startup India guidelines require a registered Private Limited Company, LLP, or registered Partnership. Conversion or incorporation is required to claim DPIIT recognition.",
          triggeredBy: ["Startup status flagged", `Constitution: ${profile.legalStructure.replace(/_/g, " ")}`],
          verificationConditions: ["Convert or incorporate as a Private Limited Company or LLP to become eligible"],
        };
      }
      return {
        status: "NOT_APPLICABLE",
        reason: "Not currently indicated as this venture was not marked as a technology or innovative startup seeking DPIIT recognition.",
        triggeredBy: ["General commercial venture (non-startup)"],
      };
    }

    // 3. Udyam MSME Registration
    case "udyam": {
      if (msme === "Large") {
        return {
          status: "NOT_APPLICABLE",
          reason: "Your investment and turnover exceed the statutory threshold of ₹125 Crore / ₹250 Crore for MSME classification.",
          triggeredBy: [`MSME Category: ${msme}`],
        };
      }
      return {
        status: "APPLICABLE",
        reason: `MSME registration under MSMED Act, 2006. Confirms your ${msme} status based on investment of ₹${profile.investmentLakh} lakh and turnover of ₹${profile.annualTurnoverLakh || 0} lakh, unlocking priority lending, subsidy access, and statutory delayed payment protection (Sec 15-24).`,
        triggeredBy: [`Classified as ${msme} Enterprise based on investment of ₹${profile.investmentLakh} lakh and turnover of ₹${profile.annualTurnoverLakh || 0} lakh`],
        missingInfo: rule.missingInfo,
      };
    }

    // 4. GST Registration
    case "gst": {
      const isCorporate =
        profile.legalStructure === "private_limited" ||
        profile.legalStructure === "public_limited" ||
        profile.legalStructure === "llp";
      const highTurnover = (profile.annualTurnoverLakh || 0) >= 20;

      if (highTurnover || isCorporate || isMfg) {
        return {
          status: "APPLICABLE",
          reason: isCorporate
            ? "Mandatory for corporate entities to conduct commercial business and open current bank accounts."
            : highTurnover
            ? `Turnover estimate (₹${profile.annualTurnoverLakh} lakh) reaches or exceeds statutory GST registration thresholds (CGST Act, 2017 Section 22).`
            : "Mandatory for manufacturing and inter-state commercial distribution to claim Input Tax Credit (ITC).",
          triggeredBy: [
            isCorporate ? "Corporate Legal Structure" : highTurnover ? "Turnover threshold reached" : "Manufacturing activity",
          ],
          missingInfo: ["PAN of enterprise/promoter", "Bank statement/cancelled cheque", "Premises ownership/lease document"],
        };
      }

      // Small sole prop or retail under threshold
      return {
        status: "POTENTIALLY_APPLICABLE",
        reason: "Annual turnover is below mandatory statutory threshold (₹40L for goods / ₹20L for services). Voluntary GST registration is recommended if you plan to deal with B2B vendors, claim Input Tax Credit, or sell inter-state.",
        triggeredBy: ["Turnover currently below mandatory threshold"],
        verificationConditions: ["Assess whether initial year B2B sales or interstate purchases will require GST registration"],
      };
    }

    // 5. Trade / Establishment Licence
    case "trade_licence": {
      if (!profile.hasPhysicalPremises || profile.premisesType === "home_office") {
        return {
          status: "NOT_APPLICABLE",
          reason: "No physical commercial walk-in or industrial premises required (home office / digital service).",
          triggeredBy: ["Remote / Home-office setup without physical commercial establishment"],
        };
      }

      if (profile.jurisdictionType === "panchayat") {
        return {
          status: "POTENTIALLY_APPLICABLE",
          reason: "Premises is in a Rural Gram Panchayat. Gram Panchayat D&O (Dangerous & Offensive Trades) licence applies instead of Urban Municipal Trade Licence under State Panchayat Raj Act.",
          triggeredBy: ["Rural Gram Panchayat Jurisdiction"],
          verificationConditions: ["Verify local Gram Panchayat trade sanction rules"],
        };
      }

      return {
        status: "APPLICABLE",
        reason: "Mandatory municipal licence required under State Municipalities Act / Municipal Corporation Act to operate commercial premises.",
        triggeredBy: ["Physical commercial/retail/food premises located within municipal jurisdiction"],
        missingInfo: ["Premises property tax receipt", "Lease agreement / Sale deed", "Premises photo"],
      };
    }

    // 6. Shops & Establishment Registration
    case "shops": {
      if (factoryRequired) {
        return {
          status: "NOT_APPLICABLE",
          reason: "Premises is covered under the Factories Act, 1948, which explicitly exempts the manufacturing plant from the Shops & Establishments Act.",
          triggeredBy: ["Factories Act applies (dual registration exempted)"],
        };
      }

      if (!profile.hasPhysicalPremises && workers === 0) {
        return {
          status: "NOT_APPLICABLE",
          reason: "No commercial establishment or hired employees. Remote sole proprietor with zero employees is exempted.",
          triggeredBy: ["Zero employees and no commercial establishment"],
        };
      }

      if (workers > 0) {
        return {
          status: "APPLICABLE",
          reason: `Mandatory registration under State Shops & Establishments Act governing working hours, employee welfare, statutory leave, and wage records for your ${workers} worker(s).`,
          triggeredBy: [`Employs ${workers} worker(s) in commercial establishment`],
          missingInfo: ["Employee master register", "Proof of commercial establishment address"],
        };
      }

      return {
        status: "POTENTIALLY_APPLICABLE",
        reason: "Commercial premises with zero external employees — some state jurisdictions require self-proprietorship shop intimation while others exempt.",
        triggeredBy: ["Owner-operated commercial premises"],
        verificationConditions: ["Check local labour inspectorate exemption for zero-employee retail/office"],
      };
    }

    // 7. Consent to Establish (CTE)
    case "cte": {
      if (pollution === "white") {
        return {
          status: "NOT_APPLICABLE",
          reason: "Your activity is classified as WHITE category by CPCB — completely exempted from environmental Consent to Establish (CTE).",
          triggeredBy: ["CPCB Pollution Category: White (Non-polluting)"],
        };
      }

      if (pollution === "green") {
        return {
          status: "POTENTIALLY_APPLICABLE",
          reason: "Classified as GREEN category. May be eligible for simplified online consent or white-category self-declaration depending on local SPCB industrial estate norms.",
          triggeredBy: ["CPCB Pollution Category: Green"],
          verificationConditions: ["Verify if unit is located in a notified industrial zone with common effluent facilities"],
        };
      }

      return {
        status: "APPLICABLE",
        reason: `Your activity is classified as ${pollution.toUpperCase()} category under CPCB guidelines — Consent to Establish (CTE) is mandatory under Water Act, 1974 & Air Act, 1981 prior to setup.`,
        triggeredBy: [`CPCB Pollution Category: ${pollution.toUpperCase()}`, "Industrial / emissions activity"],
        missingInfo: ["Site plan and machinery layout", "Project report with water balance chart and effluent management plan"],
      };
    }

    // 8. Consent to Operate (CTO)
    case "cto": {
      if (pollution === "white") {
        return {
          status: "NOT_APPLICABLE",
          reason: "Non-polluting White category activity — completely exempted from environmental Consent to Operate (CTO).",
          triggeredBy: ["CPCB Pollution Category: White"],
        };
      }

      if (pollution === "green") {
        return {
          status: "POTENTIALLY_APPLICABLE",
          reason: "Green category activity — simplified online operational intimation or consent depending on state PCB rules.",
          triggeredBy: ["CPCB Pollution Category: Green"],
          verificationConditions: ["Verify whether simplified one-time intimation is permitted"],
        };
      }

      return {
        status: "APPLICABLE",
        reason: `Mandatory operational environmental clearance (${pollution.toUpperCase()} category) required under Water & Air Acts before starting commercial production.`,
        triggeredBy: [`CPCB Pollution Category: ${pollution.toUpperCase()}`],
        missingInfo: ["CTE compliance report", "Proof of installed pollution control equipment"],
      };
    }

    // 9. Factory Plan Approval & Licence
    case "factory_licence": {
      if (!isMfg) {
        return {
          status: "NOT_APPLICABLE",
          reason: "Your business does not conduct a manufacturing process (commercial retail, IT, hospitality, and services are governed by Shops & Establishments Act instead).",
          triggeredBy: [`Business activity: ${profile.businessActivity.replace(/_/g, " ")}`],
        };
      }

      if (factoryRequired) {
        return {
          status: "APPLICABLE",
          reason: `Manufacturing with ${workers} workers and ${profile.usesPower ? "electric power" : "manual processes"} meets statutory threshold (10+ with power / 20+ without) under Factories Act, 1948 Section 6.`,
          triggeredBy: [
            "Manufacturing activity",
            `Workers: ${workers} (${profile.usesPower ? "Uses electric power" : "No power"})`,
          ],
          missingInfo: ["Sanctioned factory building plan", "Machinery layout flow chart", "Stability certificate from chartered structural engineer"],
        };
      }

      return {
        status: "POTENTIALLY_APPLICABLE",
        reason: `Manufacturing activity with machinery detected, but workforce (${workers}) is currently below the mandatory threshold (10 with power / 20 without). Final applicability depends on seasonal contract labour expansion or local factory inspectorate verification.`,
        triggeredBy: ["Manufacturing activity with machinery", `Workers count: ${workers}`],
        verificationConditions: ["Verify if total headcount including contract workers exceeds 10 with power"],
      };
    }

    // 10. Fire Safety NOC
    case "fire_noc": {
      if (isMfg && factoryRequired) {
        return {
          status: "APPLICABLE",
          reason: "Factory premises with machinery and workforce requires mandatory Fire Safety NOC from State Disaster Response & Fire Services.",
          triggeredBy: ["Factory manufacturing premises", `Workforce: ${workers}`],
          missingInfo: ["Fire safety layout plan", "Installation proof of fire extinguishers, hose reels, and alarm system"],
        };
      }

      if (profile.businessActivity === "food_service" || profile.servesAlcohol) {
        return {
          status: "POTENTIALLY_APPLICABLE",
          reason: "Fire NOC applicability for restaurants/hospitality depends on building height (> 15m), built-up area (> 500 sq.m), or seating capacity (> 50 covers).",
          triggeredBy: ["Hospitality / Food service premises"],
          verificationConditions: ["Verify total dining carpet area and seating capacity with municipal fire department"],
        };
      }

      if (profile.hasPhysicalPremises && profile.premisesType === "commercial") {
        return {
          status: "POTENTIALLY_APPLICABLE",
          reason: "Commercial premises fire safety clearance depends on the total building floor area and commercial occupancy type.",
          triggeredBy: ["Commercial physical premises"],
          verificationConditions: ["Verify building completion certificate and fire egress routes with commercial building owner"],
        };
      }

      return {
        status: "NOT_APPLICABLE",
        reason: "Low-risk ground floor premises, home office, or non-hazardous activity below statutory fire inspection thresholds.",
        triggeredBy: ["Low fire risk / Non-hazardous premises"],
      };
    }

    // 11. Industrial / Commercial Power Connection
    case "power_connection": {
      if (isMfg || profile.usesPower) {
        return {
          status: "APPLICABLE",
          reason: "Industrial / Commercial 3-phase power load connection and sanction required from the DISCOM for machinery operations.",
          triggeredBy: ["Industrial power requirement / Machinery operations"],
          missingInfo: ["Connected load estimate in kW/kVA", "Electrical wiring installation test report"],
        };
      }

      if (profile.hasPhysicalPremises) {
        return {
          status: "POTENTIALLY_APPLICABLE",
          reason: "Check whether the existing commercial electricity meter at your premises provides adequate sanctioned load for your operations.",
          triggeredBy: ["Commercial premises power check"],
          verificationConditions: ["Review electricity bill of premises to confirm tariff category (Commercial non-domestic)"],
        };
      }

      return {
        status: "NOT_APPLICABLE",
        reason: "No dedicated commercial or industrial electricity load required.",
        triggeredBy: ["Home office / Zero high-power machinery"],
      };
    }

    // 12. FSSAI Food Licence
    case "fssai": {
      if (profile.handlesFood) {
        const isMfgFood = profile.businessActivity === "food_processing" || (isMfg && profile.handlesFood);
        return {
          status: "APPLICABLE",
          reason: isMfgFood
            ? "Mandatory FSSAI Manufacturing Licence under Food Safety & Standards Act, 2006 for processing and packaging food products."
            : "Mandatory FSSAI Food Licence / Registration for handling, preparing, storing, or selling food and beverage items.",
          triggeredBy: ["Food-related business activity / Food handling indicated"],
          missingInfo: ["Food safety management plan", "Water testing analysis report (NABL accredited lab)", "List of food categories"],
        };
      }

      return {
        status: "NOT_APPLICABLE",
        reason: "Your business does not involve food processing, dining, handling, or edible beverage distribution.",
        triggeredBy: [`Sector: ${profile.sector.replace(/_/g, " ")} (non-food)`],
      };
    }

    // 13. BIS Certification (ISI Mark)
    case "bis_isi": {
      const isWaterPlant = profile.description?.toLowerCase().includes("water plant") || profile.description?.toLowerCase().includes("mineral water");
      if (isWaterPlant) {
        return {
          status: "APPLICABLE",
          reason: "Packaged drinking water is under mandatory Quality Control Order (QCO) — BIS ISI Mark (IS 14543 / IS 13428) is mandatory before distribution.",
          triggeredBy: ["Packaged Drinking Water / Mineral Water activity"],
          missingInfo: ["In-house testing laboratory setup", "Microbiological test report"],
        };
      }

      if (isMfg) {
        return {
          status: "POTENTIALLY_APPLICABLE",
          reason: "Check if your manufactured products are covered under the Central Government's expanding mandatory Quality Control Orders (QCO) list.",
          triggeredBy: ["Manufacturing sector product standards"],
          verificationConditions: ["Verify specific product HS code against mandatory BIS schedule"],
        };
      }

      return {
        status: "NOT_APPLICABLE",
        reason: "Business products or services are not subject to mandatory Bureau of Indian Standards (BIS) certification.",
        triggeredBy: ["Non-QCO product/service"],
      };
    }

    // 14. Drug Licence
    case "drug_licence": {
      if (profile.handlesDrugs || profile.businessActivity === "pharmacy" || profile.sector === "healthcare_pharma") {
        return {
          status: "APPLICABLE",
          reason: "Mandatory Drug Licence (Form 20/21) under Drugs & Cosmetics Act, 1940 from State Drugs Control Administration for stocking and selling pharmaceuticals.",
          triggeredBy: ["Pharmacy / Pharmaceutical sales or distribution"],
          missingInfo: ["Registered Pharmacist certificate", "Refrigerator purchase invoice", "Premises plan (min 10 sq.m)"],
        };
      }

      return {
        status: "NOT_APPLICABLE",
        reason: "Business does not stock, dispense, manufacture, or distribute pharmaceutical medicines or drugs.",
        triggeredBy: ["Non-pharmaceutical business activity"],
      };
    }

    // 15. Eating House Licence
    case "eating_house": {
      if (profile.handlesFood && profile.businessActivity === "food_service" && profile.dineIn) {
        return {
          status: "APPLICABLE",
          reason: "Mandatory Eating House Licence from the City Police Commissionerate / District Magistrate to operate a restaurant or public dining establishment.",
          triggeredBy: ["Dine-in restaurant / public food service"],
          verificationConditions: ["Local police station NOC", "Fire safety inspection certificate"],
        };
      }

      return {
        status: "NOT_APPLICABLE",
        reason: "Business is not an eating house, restaurant, or public dining establishment.",
        triggeredBy: ["Non-dining business activity"],
      };
    }

    // 16. State Excise Licence
    case "excise_licence": {
      if (profile.servesAlcohol) {
        return {
          status: "APPLICABLE",
          reason: "Mandatory State Prohibition & Excise Licence required to purchase, store, dispense, or serve alcoholic beverages, beer, or spirits.",
          triggeredBy: ["Alcohol / liquor service or retail sale indicated"],
          missingInfo: ["Excise location map (distance from temples/schools > 100m)", "Police character certificate"],
        };
      }

      return {
        status: "NOT_APPLICABLE",
        reason: "Business does not store, sell, or dispense alcoholic beverages.",
        triggeredBy: ["No alcohol or liquor activity"],
      };
    }

    // 17. Legal Metrology Registration
    case "legal_metrology": {
      if (profile.usesWeighingInstruments) {
        return {
          status: "APPLICABLE",
          reason: "Mandatory verification and stamping of commercial weighing scales/instruments under Legal Metrology Act, 2009.",
          triggeredBy: ["Use of commercial weighing or measuring instruments in trade"],
          missingInfo: ["Weighing instrument model approval certificate", "Inspector stamping receipt"],
        };
      }

      if (profile.businessActivity === "retail" || profile.businessActivity === "wholesale" || isMfg) {
        return {
          status: "POTENTIALLY_APPLICABLE",
          reason: "Manufacturing or selling pre-packaged commodities requires registration under Legal Metrology (Packaged Commodities) Rules, 2011.",
          triggeredBy: ["Pre-packaged retail or manufactured commodities"],
          verificationConditions: ["Confirm whether packaged goods display mandatory declarations (MRP, Net Qty, Best Before)"],
        };
      }

      return {
        status: "NOT_APPLICABLE",
        reason: "Business does not use commercial weighing/measuring equipment or package commodities for trade.",
        triggeredBy: ["Services / IT / non-measured goods"],
      };
    }

    // 18. EPF Registration
    case "epf": {
      if (workers >= 20) {
        return {
          status: "APPLICABLE",
          reason: `Mandatory EPF Registration under Employees' Provident Funds Act, 1952 for employing 20 or more workers (current count: ${workers}).`,
          triggeredBy: [`Workforce count (${workers}) >= 20`],
          missingInfo: ["Employee Aadhaar, bank details, and PAN for UAN generation"],
        };
      }

      if (workers >= 10 && workers < 20) {
        return {
          status: "POTENTIALLY_APPLICABLE",
          reason: `Workforce is ${workers}. Voluntary EPF registration is permitted under Section 1(4) to offer retirement benefits and attract talent.`,
          triggeredBy: [`Workforce count: ${workers} (between 10 and 19)`],
          verificationConditions: ["Decide whether to opt for voluntary EPF registration"],
        };
      }

      return {
        status: "NOT_APPLICABLE",
        reason: `Workforce (${workers}) is below the mandatory statutory threshold of 20 employees.`,
        triggeredBy: [`Workforce: ${workers} (threshold: 20)`],
      };
    }

    // 19. ESI Registration
    case "esi": {
      if (workers >= 10) {
        return {
          status: "APPLICABLE",
          reason: `Mandatory ESI Registration under Employees' State Insurance Act, 1948 for employing 10 or more workers (current count: ${workers}).`,
          triggeredBy: [`Workforce count (${workers}) >= 10`],
          missingInfo: ["Employee monthly gross wage sheet"],
        };
      }

      if (workers >= 5 && workers < 10) {
        return {
          status: "POTENTIALLY_APPLICABLE",
          reason: `Workforce is ${workers}. ESI registration will become mandatory immediately once your employee count reaches 10.`,
          triggeredBy: [`Workforce count: ${workers} (approaching 10)`],
          verificationConditions: ["Review projected staffing plans for initial operating year"],
        };
      }

      return {
        status: "NOT_APPLICABLE",
        reason: `Workforce (${workers}) is below the statutory threshold of 10 employees.`,
        triggeredBy: [`Workforce: ${workers} (threshold: 10)`],
      };
    }

    // 20. Ground Water Extraction NOC
    case "groundwater_noc": {
      if (profile.usesGroundwater) {
        return {
          status: "APPLICABLE",
          reason: "Mandatory Ground Water Extraction NOC from CGWA / State Ground Water Department for commercial or industrial borewell extraction.",
          triggeredBy: ["Borewell / groundwater extraction indicated for operations"],
          missingInfo: ["Hydrogeological survey report", "Digital flow meter installation with telemetry", "Artificial recharge and rainwater harvesting proposal"],
        };
      }

      return {
        status: "NOT_APPLICABLE",
        reason: "No commercial borewell groundwater extraction (water sourced through municipal piped network, tankers, or private water supply).",
        triggeredBy: ["No groundwater borewell extraction"],
      };
    }

    default:
      return {
        status: "POTENTIALLY_APPLICABLE",
        reason: "Requires regulatory review based on specific operational characteristics.",
        triggeredBy: ["General regulatory framework"],
      };
  }
}

// ---------------------------------------------------------------------------
// Approval Hydration with Location Authority & Lifecycle Stages
// ---------------------------------------------------------------------------

function hydrateApproval(
  id: string,
  evalResult: EvaluatedApprovalOutput,
  profile: BusinessProfile,
  category?: PollutionCategory
): Approval | null {
  const base = CATALOG[id];
  if (!base) return null;

  const loc = resolveLocationAuthority(profile.state, profile.city, profile.jurisdictionType);
  const ruleDef = RULE_APPROVAL_DEFINITIONS[id];

  let department = base.department;
  let portalUrl = base.portalUrl;
  let statute = base.statute;
  let authorityType: "GHMC" | "CDMA" | "Panchayat" | "State" | "Central" = "Central";

  if (base.locationDependent) {
    if (id === "trade_licence") {
      department = loc.tradeAuthority;
      portalUrl = loc.tradePortal || portalUrl;
      statute = loc.tradeStatute;
      authorityType = loc.authorityType;
    } else if (id === "power_connection") {
      department = loc.powerDiscom;
      portalUrl = loc.powerPortal || portalUrl;
      authorityType = loc.authorityType;
    } else if (id === "cte" || id === "cto") {
      department = loc.pcbDept;
      portalUrl = loc.pcbPortal || portalUrl;
      authorityType = "State";
    } else if (id === "factory_licence") {
      department = loc.factoriesDept;
      portalUrl = loc.factoriesPortal || portalUrl;
      authorityType = "State";
    } else if (id === "fire_noc") {
      department = loc.fireDept;
      portalUrl = loc.firePortal || portalUrl;
      authorityType = "State";
    } else if (id === "shops") {
      department = loc.labourDept;
      portalUrl = loc.labourPortal || portalUrl;
      authorityType = "State";
    } else if (id === "eating_house") {
      const isHyd = loc.authorityType === "GHMC";
      department = isHyd
        ? "Hyderabad / Cyberabad Police Commissionerate"
        : "Local Police Commissionerate / District Magistrate";
      authorityType = "State";
    } else {
      authorityType = "State";
    }
  }

  const documents = ruleDef ? ruleDef.requiredDocs(profile) : base.documents;
  const level = ruleDef ? ruleDef.level : undefined;

  return {
    id: base.id,
    name: base.name,
    department,
    statute,
    timeline: base.timeline,
    documents,
    icon: base.icon,
    portalUrl,
    sourceUrl: base.sourceUrl,
    applicability: evalResult.status,
    level,
    reason: evalResult.reason,
    triggeredBy: evalResult.triggeredBy,
    verificationConditions: evalResult.verificationConditions,
    missingInfo: evalResult.missingInfo,
    category,
    stage: base.stage ?? 2,
    stageName: base.stageName ?? "Premises & Infrastructure",
    dependsOn: base.dependsOn ?? [],
    locationDependent: !!base.locationDependent,
    authorityType,
    submissionType: base.submissionType ?? "online",
  };
}

// ---------------------------------------------------------------------------
// Dynamic Scheme Matching
// ---------------------------------------------------------------------------

export function evaluateSchemes(profile: BusinessProfile, msme: MsmeCategory): SchemeMatch[] {
  const matches: SchemeMatch[] = [];
  const isMfg = profile.isManufacturing || profile.businessActivity === "manufacturing" || profile.businessActivity === "food_processing";
  const normState = (profile.state || "telangana").toLowerCase();
  const inv = profile.investmentLakh;

  for (const s of SCHEMES) {
    let eligible = true;
    let confidence: "high" | "moderate" = "high";
    const reasons: string[] = [];

    // State filter
    if (s.eligibleStates && !s.eligibleStates.includes(normState)) {
      eligible = false;
      continue;
    }

    // Enterprise size filter
    if (s.eligibleEnterpriseSizes && !s.eligibleEnterpriseSizes.includes(msme)) {
      eligible = false;
      continue;
    }

    // Sector & Activity filter
    if (s.eligibleSectors && !s.eligibleSectors.includes("all")) {
      const matchSector = s.eligibleSectors.includes(profile.sector);
      const matchActivity = s.eligibleActivities ? s.eligibleActivities.includes(profile.businessActivity) : false;
      if (!matchSector && !matchActivity) {
        eligible = false;
        continue;
      }
    }

    // Legal Structure filter
    if (s.eligibleLegalStructures && !s.eligibleLegalStructures.includes(profile.legalStructure)) {
      eligible = false;
      continue;
    }

    // Startup-only filter
    if (s.eligibleStartupOnly && !profile.isStartup) {
      eligible = false;
      continue;
    }

    // Investment caps
    if (s.minInvestmentLakh && inv < s.minInvestmentLakh) {
      confidence = "moderate";
    }
    if (s.maxInvestmentLakh && inv > s.maxInvestmentLakh) {
      eligible = false;
      continue;
    }

    if (eligible) {
      if (s.id === "tidea") {
        reasons.push(`Manufacturing MSME based in Telangana with investment of ₹${inv} lakh.`);
      } else if (s.id === "pmegp") {
        reasons.push(`New ${msme} project eligible for margin money capital subsidy.`);
      } else if (s.id === "cgtmse") {
        reasons.push(`${msme} enterprise qualifies for collateral-free bank credit guarantee.`);
      } else if (s.id === "mudra") {
        reasons.push(`Eligible for collateral-free non-farm micro loan up to ₹10 Lakhs.`);
      } else if (s.id === "standup") {
        reasons.push(`Greenfield project eligible under priority banking credit.`);
      } else if (s.id === "sisfs") {
        reasons.push(`Eligible for proof-of-concept seed funding grants upon DPIIT recognition.`);
      } else {
        reasons.push("Business profile aligns with statutory scheme eligibility guidelines.");
      }

      matches.push({
        id: s.id,
        name: s.name,
        department: s.department,
        description: s.description,
        subsidy: s.subsidy,
        maxAmount: s.maxAmount,
        tags: s.tags,
        confidence,
        eligibilityReason: reasons.join(" "),
        portalUrl: s.portalUrl,
      });
    }
  }

  return matches;
}

// ---------------------------------------------------------------------------
// Main Pipeline Execution
// ---------------------------------------------------------------------------

export function generateChecklist(rawProfile: Partial<BusinessProfile>): ChecklistResult {
  const profile = normalizeProfile(rawProfile);
  const msme = classifyMsme(profile.investmentLakh, profile.annualTurnoverLakh);
  const pollution = classifyPollutionCategory(profile);
  const factory = !!(profile.isManufacturing && factoryApplies(profile.workers, !!profile.usesPower));
  const needsPollutionConsent = pollution !== "white";

  const allApprovals: Approval[] = [];
  const mandatoryApprovals: Approval[] = [];
  const recommendedApprovals: Approval[] = [];
  const potentiallyApplicableApprovals: Approval[] = [];
  const notApplicableApprovals: Approval[] = [];

  // Evaluate all catalog approvals against explicit rule definitions
  for (const id of Object.keys(CATALOG)) {
    if (id.startsWith("_")) continue;
    const ruleDef = RULE_APPROVAL_DEFINITIONS[id];

    // If an approval has no condition defined, it MUST NOT appear in the list.
    if (!ruleDef) {
      continue;
    }

    const applies = ruleDef.appliesWhen(profile);
    const category = (id === "cte" || id === "cto") ? pollution : undefined;

    if (applies) {
      const trigger = ruleDef.triggerText(profile);
      const evalResult: EvaluatedApprovalOutput = {
        status: "APPLICABLE",
        reason: trigger,
        triggeredBy: [trigger],
      };
      const hydrated = hydrateApproval(id, evalResult, profile, category);
      if (hydrated) {
        allApprovals.push(hydrated);
        if (ruleDef.level === "mandatory") {
          mandatoryApprovals.push(hydrated);
        } else {
          recommendedApprovals.push(hydrated);
        }
      }
    } else {
      const evalResult = evaluateApprovalRule(id, profile, msme, pollution, factory);
      // Since ruleDef.appliesWhen was false, this cannot be strictly APPLICABLE
      if (evalResult.status === "APPLICABLE") {
        evalResult.status = "NOT_APPLICABLE";
      }
      const hydrated = hydrateApproval(id, evalResult, profile, category);
      if (hydrated) {
        allApprovals.push(hydrated);
        if (evalResult.status === "POTENTIALLY_APPLICABLE") {
          potentiallyApplicableApprovals.push(hydrated);
        } else {
          notApplicableApprovals.push(hydrated);
        }
      }
    }
  }

  // Dependency Sorting
  const STAGE_ORDER: Record<string, number> = {
    company_incorporation: 10,
    startup_dpiit: 20,
    udyam: 30,
    gst: 40,
    groundwater_noc: 110,
    cte: 120,
    factory_licence: 130,
    fire_noc: 140,
    trade_licence: 150,
    power_connection: 160,
    cto: 210,
    fssai: 220,
    bis_isi: 230,
    drug_licence: 240,
    eating_house: 250,
    excise_licence: 260,
    legal_metrology: 270,
    shops: 310,
    esi: 320,
    epf: 330,
  };

  const sortFn = (a: Approval, b: Approval) => {
    const orderA = STAGE_ORDER[a.id] ?? 500;
    const orderB = STAGE_ORDER[b.id] ?? 500;
    return orderA - orderB;
  };

  mandatoryApprovals.sort(sortFn);
  recommendedApprovals.sort(sortFn);
  const applicableApprovals = [...mandatoryApprovals, ...recommendedApprovals];
  potentiallyApplicableApprovals.sort(sortFn);
  notApplicableApprovals.sort(sortFn);

  // Legacy active approvals (Applicable + Potentially Applicable) for backward compatibility
  const activeApprovals = [...applicableApprovals, ...potentiallyApplicableApprovals].sort(sortFn);

  // Dynamic Schemes & Subsidies matching
  const matchedSchemes = evaluateSchemes(profile, msme);

  // Legacy incentive notes
  const incentives: { name: string; note: string }[] = matchedSchemes.map((s) => ({
    name: s.name,
    note: `${s.subsidy} (${s.maxAmount}) — ${s.eligibilityReason}`,
  }));

  return {
    businessLabel: profile.businessLabel || "Commercial Enterprise",
    msme,
    pollution,
    factoryApplies: factory,
    needsPollutionConsent,
    approvals: activeApprovals,
    applicableApprovals,
    mandatoryApprovals,
    recommendedApprovals,
    potentiallyApplicableApprovals,
    notApplicableApprovals,
    incentives,
    matchedSchemes,
    profileSummary: profile,
  };
}

