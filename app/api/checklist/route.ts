// POST /api/checklist
// Body:  { profile: BusinessProfile }  (the full Describe-page answers)
// Returns: { result: ChecklistResult }  — the dynamic, statute-cited checklist.
// This is the endpoint the Checklist page calls to generate data based on the AI profile.

import { NextResponse } from "next/server";
import { generateChecklist } from "@/lib/rules-engine";
import { understand } from "@/lib/ai";
import type { BusinessProfile } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const profile = body.profile as BusinessProfile;
    if (!profile) {
      return NextResponse.json({ error: "profile is required" }, { status: 400 });
    }

    // Call the LLM to extract the dynamic fields if not already present
    if (!profile.businessLabel || profile.businessLabel === "") {
      try {
        const facts = await understand(profile.description || "");
        profile.businessLabel = facts.businessLabel;
        profile.pollutionCategory = facts.pollutionCategory;
        profile.isManufacturing = facts.isManufacturing;
        profile.sectorApprovals = facts.sectorApprovals;
        // Optionally override user inputs if the LLM extracted something useful
        if (facts.state && facts.state !== "other") profile.state = facts.state;
      } catch (err) {
        console.error("LLM extraction failed in checklist route:", err);
      }
    }

    // Sensible defaults so a partial profile never crashes the engine.
    const safe: BusinessProfile = {
      description: profile.description ?? "",
      businessLabel: profile.businessLabel || "General Business",
      pollutionCategory: profile.pollutionCategory || "white",
      isManufacturing: !!profile.isManufacturing,
      sectorApprovals: Array.isArray(profile.sectorApprovals) ? profile.sectorApprovals : [],
      state: profile.state ?? "telangana",
      city: profile.city ?? "",
      investmentLakh: Number(profile.investmentLakh) || 0,
      workers: Number(profile.workers) || 0,
      usesPower: !!profile.usesPower,
      handlesFood: !!profile.handlesFood,
      premises: profile.premises ?? "rented",
      usesGroundwater: !!profile.usesGroundwater,
      entityType: profile.entityType ?? "notyet",
      isStartup: !!profile.isStartup,
    };
    const result = generateChecklist(safe);
    return NextResponse.json({ result });
  } catch (e) {
    return NextResponse.json({ error: "Failed to generate checklist" }, { status: 500 });
  }
}
