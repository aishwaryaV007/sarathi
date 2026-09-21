// ============================================================================
// Sarathi Rules Engine  —  THE CORE / the "brain"
// ----------------------------------------------------------------------------
// Takes a BusinessProfile (the Describe-page answers) and returns a dynamic,
// statute-cited, location-resolved checklist ordered by dependency sequence.
//
// Architectural separation:
//   1. data/approvals/catalog.json: Content, portal URLs, documents, stages
//   2. lib/rules-engine.ts: Conditional logic, location authority resolution,
//      and dependency staging. (Now powered by dynamic LLM AI inference instead of static JSON)
// ============================================================================

import catalog from "../data/approvals/catalog.json";
import type {
  BusinessProfile,
  Approval,
  ChecklistResult,
  MsmeCategory,
  PollutionCategory,
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
  stage?: number;
  stageName?: string;
  dependsOn?: string[];
  locationDependent?: boolean;
}

const CATALOG = catalog as unknown as Record<string, CatalogEntry>;

// ---------------------------------------------------------------------------
// Pure classifiers
// ---------------------------------------------------------------------------

/** MSME category from investment. Notification S.O. 1364(E), 2025. Investment is in LAKH. */
export function classifyMsme(investmentLakh: number): MsmeCategory {
  if (investmentLakh <= 250) return "Micro"; // ≤ ₹2.5 crore
  if (investmentLakh <= 2500) return "Small"; // ≤ ₹25 crore
  if (investmentLakh <= 12500) return "Medium"; // ≤ ₹125 crore
  return "Large";
}

/** Factories Act applicability: 10+ workers with power, 20+ without power. */
export function factoryApplies(workers: number, usesPower: boolean): boolean {
  return usesPower ? workers >= 10 : workers >= 20;
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
  city: string = ""
): LocationAuthorityResult {
  const normCity = (city || "").toLowerCase().trim();
  const normState = (state || "telangana").toLowerCase().trim();

  // 1. TELANGANA
  if (normState === "telangana" || normState === "ts") {
    const isGhmc = GHMC_AREAS.some((area) => normCity.includes(area));
    const isRural = RURAL_KEYWORDS.some((kw) => normCity.includes(kw));
    const isNorthTS = NORTH_TS_AREAS.some((area) => normCity.includes(area));

    const powerDiscom = isNorthTS
      ? "Northern Power Distribution Company of Telangana (TSNPDCL)"
      : "Southern Power Distribution Company of Telangana (TSSPDCL)";
    const powerPortal = isNorthTS
      ? "https://www.tsnpdcl.in"
      : "https://www.tssspdcl.com";

    if (isGhmc) {
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

    if (isRural) {
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
        locationLabel: "Rural Gram Panchayat Jurisdiction",
      };
    }

    // CDMA / Urban Municipality (e.g. Ghatkesar, Warangal, Karimnagar, Nizamabad, Siddipet)
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
    const isRural = RURAL_KEYWORDS.some((kw) => normCity.includes(kw));

    if (isMumbai) {
      return {
        tradeAuthority: "Brihanmumbai Municipal Corporation (BMC / MCGM)",
        tradePortal: "https://portal.mcgm.gov.in",
        tradeStatute: "Mumbai Municipal Corporation Act, 1888",
        authorityType: "GHMC", // Metropolitan municipal tier
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
    authorityType: "CDMA",
    powerDiscom: "State Electricity Distribution Company (DISCOM)",
    powerPortal: "",
    pcbDept: "State Pollution Control Board (SPCB)",
    pcbPortal: "",
    factoriesDept: "State Directorate of Factories",
    factoriesPortal: "",
    fireDept: "State Fire Services",
    firePortal: "",
    labourDept: "State Labour Department",
    labourPortal: "",
    locationLabel: "Local Jurisdiction",
  };
}

// ---------------------------------------------------------------------------
// Approval Hydration with Location Authority & Lifecycle Stages
// ---------------------------------------------------------------------------

function hydrateApproval(
  id: string,
  reason: string,
  profile: BusinessProfile,
  category?: PollutionCategory
): Approval | null {
  const base = CATALOG[id];
  if (!base) return null;

  const loc = resolveLocationAuthority(profile.state, profile.city);

  let department = base.department;
  let portalUrl = base.portalUrl;
  let statute = base.statute;
  let authorityType: "GHMC" | "CDMA" | "Panchayat" | "State" | "Central" = "Central";

  // Location-dependent overrides
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

  return {
    id: base.id,
    name: base.name,
    department,
    statute,
    timeline: base.timeline,
    documents: base.documents,
    icon: base.icon,
    portalUrl,
    reason,
    category,
    stage: base.stage ?? 2,
    stageName: base.stageName ?? "Clearances & Setup",
    dependsOn: base.dependsOn ?? [],
    locationDependent: !!base.locationDependent,
    authorityType,
  };
}

// ---------------------------------------------------------------------------
// The Engine — Trigger logic, conditional rules, & dependency ordering
// ---------------------------------------------------------------------------

export function generateChecklist(profile: BusinessProfile): ChecklistResult {
  const msme = classifyMsme(profile.investmentLakh);
  const pollution = profile.pollutionCategory;
  const isManufacturing = profile.isManufacturing;
  const factory = isManufacturing && factoryApplies(profile.workers, profile.usesPower);
  const needsPollutionConsent = pollution !== "white";

  // Check for alcohol/liquor intent (flag or text description)
  const servesAlcohol =
    !!profile.servesAlcohol ||
    !!profile.alcohol ||
    /\b(alcohol|liquor|wine|beer|bar|pub)\b/i.test(profile.description || "");

  // Candidate map for triggered approvals: id -> { reason, category }
  const triggered = new Map<string, { reason: string; category?: PollutionCategory }>();

  // Helper to trigger an approval
  const trigger = (id: string, reason: string, cat?: PollutionCategory) => {
    if (!triggered.has(id)) {
      triggered.set(id, { reason, category: cat });
    }
  };

  // 1. Legal Entity & Incorporation Structure
  if (profile.entityType === "company") {
    trigger(
      "company_incorporation",
      "You selected a Private Limited corporate structure — SPICe+ incorporation via Ministry of Corporate Affairs is required."
    );
  }
  if (profile.isStartup) {
    trigger(
      "startup_dpiit",
      "You indicated this is a startup — DPIIT Startup India recognition unlocks tax exemptions, patent rebates, and funding."
    );
  }

  // 2. Base Approvals triggered by Business Type
  const baseList = ["udyam", "gst", "trade_licence", "shops", ...(profile.sectorApprovals || [])];

  const baseReasons: Record<string, string> = {
    udyam: `Every enterprise should register — sets your official MSME status (${msme}).`,
    gst: "Required once turnover crosses threshold; needed for interstate trade, B2B, and opening bank accounts.",
    trade_licence: "Mandatory municipal licence required to operate commercial premises.",
    shops: "Mandatory for commercial establishments employing workers under Shops & Establishments Act.",
    bis_isi: "Packaged drinking water must carry the mandatory ISI mark (IS 14543) before distribution.",
    fssai: "Mandatory food licence required under FSS Act, 2006 for handling, processing, or serving food items.",
    groundwater_noc: "Extracting groundwater for commercial/industrial use requires CGWA / State NOC.",
    drug_licence: "Dispensing or selling medicines requires a Drug Licence under Drugs & Cosmetics Act, 1940.",
    legal_metrology: "Selling goods by weight or measurement requires Legal Metrology verification.",
    eating_house: "Operating a restaurant or serving food to the public requires an Eating House licence.",
    excise_licence: "Serving or selling liquor requires a State Excise licence.",
  };

  for (const id of baseList) {
    // If food handling is explicitly denied, skip FSSAI even if AI hallucinates it
    if (id === "fssai" && profile.handlesFood === false) {
      continue;
    }
    trigger(id, baseReasons[id] ?? "Base statutory approval required for this business sector.");
  }

  // 3. Conditional Rules Check

  // A. Alcohol / Liquor rule
  if (servesAlcohol) {
    trigger(
      "excise_licence",
      "You indicated plans to sell or serve liquor/alcohol — State Prohibition & Excise licence is required."
    );
  }

  // B. Food handling rule (if user handles food)
  if (profile.handlesFood && !triggered.has("fssai")) {
    trigger(
      "fssai",
      "You indicated you will handle, prepare, or sell food items — FSSAI food licence applies."
    );
  }

  // C. Pollution consent rules (CPCB categorisation)
  if (needsPollutionConsent) {
    trigger(
      "cte",
      `Your activity is classified as ${pollution.toUpperCase()} category — Consent to Establish (CTE) is required before construction or setup.`,
      pollution
    );
    trigger(
      "cto",
      `Consent to Operate (CTO) is required before you commence commercial operations (${pollution.toUpperCase()} category).`,
      pollution
    );
  }

  // D. Groundwater extraction rule
  if (profile.usesGroundwater && !triggered.has("groundwater_noc")) {
    trigger(
      "groundwater_noc",
      "You indicated borewell or groundwater extraction for operations — CGWA / State Ground Water NOC is mandatory."
    );
  }

  // E. Factory & Fire safety rules
  if (factory) {
    trigger(
      "factory_licence",
      `Manufacturing with ${profile.workers} workers${profile.usesPower ? " and electric power" : ""} — Factories Act, 1948 applies.`
    );
    trigger(
      "fire_noc",
      "A factory premises requires Fire Safety NOC clearance from State Fire Services."
    );
  }

  // F. Employee count rules (Labour)
  if (profile.workers >= 20) {
    trigger(
      "epf",
      "EPF registration is mandatory for any enterprise employing 20 or more workers."
    );
  }
  if (profile.workers >= 10) {
    trigger(
      "esi",
      "ESI registration is mandatory for establishments employing 10 or more workers."
    );
  }

  // G. Power connection rule
  if (profile.usesPower || factory || profile.workers >= 10) {
    trigger(
      "power_connection",
      "Industrial or commercial electricity load connection required from the DISCOM."
    );
  }

  // 4. Hydrate triggered approvals with location authority
  const hydrated: Approval[] = [];
  for (const [id, meta] of triggered.entries()) {
    const a = hydrateApproval(id, meta.reason, profile, meta.category);
    if (a) hydrated.push(a);
  }

  // 5. Dependency Sequencing: Order approvals in logical operational lifecycle
  const STAGE_ORDER: Record<string, number> = {
    // Stage 1
    company_incorporation: 10,
    startup_dpiit: 20,
    udyam: 30,
    gst: 40,
    // Stage 2
    groundwater_noc: 110,
    cte: 120,
    factory_licence: 130,
    fire_noc: 140,
    trade_licence: 150,
    power_connection: 160,
    // Stage 3
    cto: 210,
    fssai: 220,
    bis_isi: 230,
    drug_licence: 240,
    eating_house: 250,
    excise_licence: 260,
    legal_metrology: 270,
    // Stage 4
    shops: 310,
    esi: 320,
    epf: 330,
  };

  hydrated.sort((a, b) => {
    const orderA = STAGE_ORDER[a.id] ?? 500;
    const orderB = STAGE_ORDER[b.id] ?? 500;
    return orderA - orderB;
  });

  // 6. Incentives tailored to MSME tier, sector, & state
  const incentives: { name: string; note: string }[] = [];
  const loc = resolveLocationAuthority(profile.state, profile.city);

  if (isManufacturing) {
    if (profile.state === "telangana") {
      incentives.push({
        name: "T-IDEA / T-PRIDE Capital Subsidy",
        note: `Up to 15%–35% investment subsidy on plant & machinery for ${msme} units in Telangana.`,
      });
      incentives.push({
        name: "TS-iPASS Fast Track Clearances",
        note: "Statutory clearances processed within 15–30 days with deemed approval provisions.",
      });
      incentives.push({
        name: "Power Tariff Reimbursement",
        note: "₹1.00 per unit power cost reimbursement for first 5 years of commercial production.",
      });
      incentives.push({
        name: "Stamp Duty & Transfer Duty Reimbursement",
        note: "100% reimbursement of stamp duty paid on purchase of industrial land or shed.",
      });
    } else {
      incentives.push({
        name: "Capital Investment Subsidy",
        note: `${msme} manufacturing units are eligible for state capital subsidies on machinery.`,
      });
      incentives.push({
        name: "Stamp Duty Exemption / Reimbursement",
        note: "Reimbursement on land registration and lease deeds for new industrial units.",
      });
      incentives.push({
        name: "Power Cost Subsidy",
        note: "Concessional power tariffs or per-unit reimbursement during first 3–5 years.",
      });
    }
  } else {
    // Services / Commercial / Retail
    incentives.push({
      name: "MSME Credit Guarantee (CGTMSE)",
      note: "Collateral-free credit facility up to ₹5 crore for eligible Micro and Small enterprises.",
    });
    incentives.push({
      name: "Prime Minister's Employment Generation Programme (PMEGP)",
      note: "Margin-money subsidy between 15% and 35% on project cost for eligible micro units.",
    });
    if (profile.state === "telangana" && loc.authorityType === "GHMC") {
      incentives.push({
        name: "GHMC Online Trade Licence Instant Renewal",
        note: "Streamlined single-window annual licence renewal through the GHMC portal.",
      });
    }
  }

  return {
    businessLabel: profile.businessLabel,
    msme,
    pollution: profile.pollutionCategory,
    factoryApplies: factory,
    needsPollutionConsent,
    approvals: hydrated,
    incentives,
  };
}
