// ============================================================================
// AI layer — turns the user's plain-language description into structured facts.
// Uses the Vercel AI SDK with Groq (Llama 3.3 70B) for speed. If no API key is
// set, or the call fails, it falls back to the deterministic keyword resolver
// in the rules engine — so the app ALWAYS works, even offline in a demo.
// ============================================================================

import { generateObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import { resolveBusinessType } from "./rules-engine";
import businessTypes from "../data/approvals/business-types.json";

// Groq is OpenAI-API-compatible, so we point the OpenAI provider at it.
const groq = createOpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY ?? "",
});

const businessKeys = Object.keys(businessTypes).filter((k) => !k.startsWith("_"));

// The shape we want the LLM to return. generateObject GUARANTEES valid JSON.
const ExtractSchema = z.object({
  businessType: z
    .string()
    .describe(`One of: ${businessKeys.join(", ")}. Pick the closest. Use "generic" if unclear.`),
  city: z.string().describe("The city/area/locality mentioned, or empty string."),
  state: z.enum(["telangana", "maharashtra", "other"]).describe("Indian state; default telangana if unclear."),
  investmentLakh: z.number().describe("Investment in LAKH rupees if a figure is mentioned, else 0."),
  workers: z.number().describe("Number of workers/employees mentioned, else 0."),
  usesPower: z.boolean().describe("true if manufacturing/machinery with electricity is implied."),
  handlesFood: z.boolean().describe("true if the business sells, makes, or handles food/water/beverages."),
  usesGroundwater: z.boolean().describe("true if a borewell / groundwater use is implied (e.g. water plant)."),
  entityType: z.enum(["proprietor", "partnership", "company", "notyet"]).describe("Business structure; notyet if unstated."),
});

export type ExtractedFacts = z.infer<typeof ExtractSchema>;

/** Extract structured facts from free text. Never throws — always returns something. */
export async function understand(description: string): Promise<ExtractedFacts> {
  const fallback: ExtractedFacts = {
    businessType: resolveBusinessType(description),
    city: "",
    state: "telangana",
    investmentLakh: 0,
    workers: 0,
    usesPower: false,
    handlesFood: false,
    usesGroundwater: false,
    entityType: "notyet",
  };

  if (!process.env.GROQ_API_KEY) return fallback;

  try {
    const { object } = await generateObject({
      model: groq("llama-3.3-70b-versatile"),
      schema: ExtractSchema,
      prompt:
        `You are a business-approval assistant for India. Read the entrepreneur's ` +
        `description and extract structured facts. Description:\n\n"${description}"`,
    });
    // Guard the business type against the known list.
    if (!businessKeys.includes(object.businessType)) {
      object.businessType = resolveBusinessType(description);
    }
    return object;
  } catch (e) {
    console.error("[understand] AI failed, using keyword fallback:", e);
    return fallback;
  }
}
