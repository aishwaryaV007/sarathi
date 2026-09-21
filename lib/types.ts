// Shared types for the Sarathi dynamic rules engine.

export type LegalStructure =
  | "sole_proprietorship"
  | "partnership"
  | "llp"
  | "private_limited"
  | "public_limited"
  | "opc"
  | "cooperative"
  | "other";

export type BusinessActivity =
  | "retail"
  | "wholesale"
  | "manufacturing"
  | "services"
  | "food_service"
  | "food_processing"
  | "pharmacy"
  | "it_services"
  | "construction"
  | "logistics"
  | "healthcare"
  | "other";

export type Sector =
  | "food"
  | "manufacturing"
  | "it_tech"
  | "healthcare_pharma"
  | "retail_trade"
  | "hospitality"
  | "services"
  | "chemicals"
  | "other";

export type JurisdictionType =
  | "ghmc"
  | "municipality"
  | "panchayat"
  | "industrial_area";

export type ApplicabilityStatus =
  | "APPLICABLE"
  | "POTENTIALLY_APPLICABLE"
  | "NOT_APPLICABLE";

export type MsmeCategory = "Micro" | "Small" | "Medium" | "Large";
export type PollutionCategory = "white" | "green" | "orange" | "red";

/** Business Profile evaluated by the rules engine. */
export interface BusinessProfile {
  description?: string;
  businessLabel?: string;
  legalStructure: LegalStructure;
  businessActivity: BusinessActivity;
  sector: Sector;
  state: string; // e.g. "telangana", "maharashtra", "other"
  city: string;
  district?: string;
  jurisdictionType?: JurisdictionType;
  businessStage?: "new" | "expansion" | "existing";
  investmentLakh: number; // In Lakh rupees
  annualTurnoverLakh?: number; // In Lakh rupees
  workers: number; // Employee/worker count
  hasPhysicalPremises: boolean;
  premises: "owned" | "rented" | "leased";
  premisesType?: "commercial" | "industrial" | "home_office" | "warehouse";
  usesPower: boolean; // Uses industrial / 3-phase electric power for production
  usesMachinery?: boolean;
  handlesFood: boolean;
  servesAlcohol?: boolean;
  handlesDrugs?: boolean;
  usesWeighingInstruments?: boolean;
  usesGroundwater: boolean;
  pollutionCategory?: PollutionCategory;
  generatesHazardousWaste?: boolean;
  waterEffluentDischarge?: boolean;
  isStartup?: boolean;

  // Backward-compatibility fields
  entityType?: "proprietor" | "partnership" | "company" | "notyet" | string;
  isManufacturing?: boolean;
  sectorApprovals?: string[];
  alcohol?: boolean;
}

/** A single approval, hydrated from catalog.json with runtime rules evaluation and location context. */
export interface Approval {
  id: string;
  name: string;
  department: string;
  statute: string;
  timeline: string;
  documents: string[];
  icon: string;
  portalUrl: string;

  /** Multi-tier applicability determination. */
  applicability: ApplicabilityStatus;
  /** Clear statutory explanation of why this determination was made. */
  reason: string;
  /** Factors from the profile that triggered or contributed to this rule. */
  triggeredBy: string[];
  /** Conditions or inspections required to confirm applicability if POTENTIALLY_APPLICABLE. */
  verificationConditions?: string[];
  /** Specific items or details the user still needs to provide. */
  missingInfo?: string[];

  /** CPCB Pollution category tag, set on pollution consents. */
  category?: PollutionCategory;
  /** Lifecycle stage sequence: 1: Entity, 2: Infrastructure/Premises, 3: Operational, 4: Labour */
  stage?: number;
  stageName?: string;
  dependsOn?: string[];
  locationDependent?: boolean;
  authorityType?: "GHMC" | "CDMA" | "Panchayat" | "State" | "Central";
}

/** Matched Government Scheme or Subsidy. */
export interface SchemeMatch {
  id: string;
  name: string;
  department: string;
  description: string;
  subsidy: string;
  maxAmount: string;
  tags: string[];
  confidence: "high" | "moderate";
  eligibilityReason: string;
  portalUrl?: string;
}

/** The full result the engine returns for a profile. */
export interface ChecklistResult {
  businessLabel: string;
  msme: MsmeCategory;
  pollution: PollutionCategory;
  factoryApplies: boolean;
  needsPollutionConsent: boolean;

  /** Legacy / Flat list of actionable approvals (Applicable + Potentially Applicable) */
  approvals: Approval[];

  /** Strictly Applicable (Mandatory) approvals */
  applicableApprovals: Approval[];
  /** Approvals needing specific verification or local threshold review */
  potentiallyApplicableApprovals: Approval[];
  /** Approvals explicitly evaluated as not required for this profile, with reasons */
  notApplicableApprovals: Approval[];

  /** Legacy incentive notes */
  incentives: { name: string; note: string }[];
  /** Dynamically matched government schemes and subsidies */
  matchedSchemes: SchemeMatch[];
  /** Echo of the evaluated business profile */
  profileSummary: BusinessProfile;
}
