// POST /api/checklist
// Body:  { profile: BusinessProfile }  (the full Describe-page answers)
// Returns: { result: ChecklistResult }  — the dynamic, statute-cited checklist.
// This is the endpoint the Checklist page calls to replace its hardcoded data.

import { NextResponse } from "next/server";
import { generateChecklist } from "@/lib/rules-engine";
import type { BusinessProfile } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const profile = body.profile as BusinessProfile;
    if (!profile || !profile.businessType) {
      return NextResponse.json({ error: "profile is required" }, { status: 400 });
    }
    // Sensible defaults so a partial profile never crashes the engine.
    const safe: BusinessProfile = {
      description: profile.description ?? "",
      businessType: profile.businessType,
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
