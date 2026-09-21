// Shared types for the Sarathi rules engine.

/** Raw answers collected from the Describe page (Step 1 + Step 2). */
export interface BusinessProfile {
  /** Free-text description the user typed. */
  description: string;
  /** Resolved business type key (from business-types.json), e.g. "water_plant". */
  businessType: string;
  state: "telangana" | "maharashtra" | "other";
  city: string;
  /** Investment in plant, machinery & equipment, in LAKH rupees. 40 = ₹40 lakh. */
  investmentLakh: number;
  workers: number;
  usesPower: boolean;
  handlesFood: boolean;
  premises: "owned" | "rented";
  usesGroundwater: boolean;
  entityType: "proprietor" | "partnership" | "company" | "notyet";
  /** true if the user marked this as a startup seeking DPIIT recognition. */
  isStartup?: boolean;
}

/** A single approval, hydrated from catalog.json with runtime context filled in. */
export interface Approval {
  id: string;
  name: string;
  department: string;
  statute: string;
  timeline: string;
  documents: string[];
  icon: string;
  portalUrl: string;
  /** Why the engine included this approval — shown as a tooltip / explanation. */
  reason: string;
  /** Pollution category tag, only set on pollution consents. */
  category?: "white" | "green" | "orange" | "red";
}

export type MsmeCategory = "Micro" | "Small" | "Medium" | "Large";
export type PollutionCategory = "white" | "green" | "orange" | "red";

/** The full result the engine returns for a profile. */
export interface ChecklistResult {
  businessLabel: string;
  msme: MsmeCategory;
  pollution: PollutionCategory;
  factoryApplies: boolean;
  needsPollutionConsent: boolean;
  approvals: Approval[];
  /** Government incentive schemes the profile likely qualifies for. */
  incentives: { name: string; note: string }[];
}
