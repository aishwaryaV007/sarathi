// POST /api/checklist
// Body:  { profile: BusinessProfile }  (the full Describe-page answers)
// Returns: { result: ChecklistResult }  — the dynamic, statute-cited checklist.

import { NextResponse } from "next/server";
import { generateChecklist } from "@/lib/rules-engine";
import { understand } from "@/lib/ai";
import type { BusinessProfile } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const profile = body.profile as Partial<BusinessProfile>;
    if (!profile) {
      return NextResponse.json({ error: "profile is required" }, { status: 400 });
    }

    // Call optional LLM extraction only if businessActivity and legalStructure aren't specified
    if ((!profile.businessActivity || !profile.businessLabel) && profile.description) {
      try {
        const facts = await understand(profile.description);
        if (!profile.businessLabel && facts.businessLabel) profile.businessLabel = facts.businessLabel;
        if (!profile.pollutionCategory && facts.pollutionCategory) profile.pollutionCategory = facts.pollutionCategory;
        if (profile.isManufacturing === undefined && facts.isManufacturing !== undefined) profile.isManufacturing = facts.isManufacturing;
        if (!profile.sectorApprovals && facts.sectorApprovals) profile.sectorApprovals = facts.sectorApprovals;
        if (!profile.state && facts.state && facts.state !== "other") profile.state = facts.state;
      } catch (err) {
        console.error("LLM extraction skipped in checklist route:", err);
      }
    }

    const result = generateChecklist(profile);
    return NextResponse.json({ result });
  } catch (e) {
    console.error("Error generating checklist:", e);
    return NextResponse.json({ error: "Failed to generate checklist" }, { status: 500 });
  }
}
