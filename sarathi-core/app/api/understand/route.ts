// POST /api/understand
// Body:  { description: string }
// Returns: extracted facts (businessType, city, state, investmentLakh, workers, ...)
// The Describe page calls this after Step 1 to pre-fill Step 2 and pick follow-ups.

import { NextResponse } from "next/server";
import { understand } from "@/lib/ai";

export async function POST(req: Request) {
  try {
    const { description } = await req.json();
    if (typeof description !== "string" || !description.trim()) {
      return NextResponse.json({ error: "description is required" }, { status: 400 });
    }
    const facts = await understand(description);
    return NextResponse.json({ facts });
  } catch (e) {
    return NextResponse.json({ error: "Failed to process" }, { status: 500 });
  }
}
