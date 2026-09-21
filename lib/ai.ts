// ============================================================================
// AI layer — turns the user's plain-language description into structured facts.
// Uses the Vercel AI SDK with Groq (Llama 3.3 70B) for speed.
// ============================================================================

import { generateObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import catalog from "../data/approvals/catalog.json";

// Groq is OpenAI-API-compatible, so we point the OpenAI provider at it.
const groq = createOpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY ?? "",
});

// The available sector approvals from the catalog, so the LLM knows what it can pick.
const catalogKeys = Object.keys(catalog).filter(k => !k.startsWith("_"));
const catalogDescriptions = Object.entries(catalog)
  .filter(([k]) => !k.startsWith("_"))
  .map(([k, v]) => `- ${k}: ${(v as any).name}`)
  .join("\n");

// The shape we want the LLM to return. generateObject GUARANTEES valid JSON.
const ExtractSchema = z.object({
  businessLabel: z.string().describe("A concise, professional title for the business described, e.g. 'Packaged Drinking Water Plant' or 'IT Consulting Firm'"),
  pollutionCategory: z.enum(["white", "green", "orange", "red"]).describe("CPCB pollution category based on environmental impact. White=none, Green=low, Orange=medium, Red=high."),
  isManufacturing: z.boolean().describe("true if the business involves manufacturing, processing, or fabricating physical goods."),
  sectorApprovals: z.array(z.string()).describe("Array of specific catalog IDs this business definitely requires based on its sector. Pick from the provided list only."),
  
  city: z.string().describe("The city/area/locality mentioned, or empty string."),
  state: z.enum(["telangana", "maharashtra", "other"]).describe("Indian state; default telangana if unclear."),
  investmentLakh: z.number().describe("Investment in LAKH rupees if a figure is mentioned, else 0."),
  workers: z.number().describe("Number of workers/employees mentioned, else 0."),
  usesPower: z.boolean().describe("true if manufacturing/machinery with electricity is implied."),
  handlesFood: z.boolean().describe("true if the business sells, makes, or handles food/water/beverages/medicine."),
  usesGroundwater: z.boolean().describe("true if a borewell / groundwater use is implied (e.g. water plant)."),
  entityType: z.enum(["proprietor", "partnership", "company", "notyet"]).describe("Business structure; notyet if unstated."),
});

export type ExtractedFacts = z.infer<typeof ExtractSchema>;

/** Extract structured facts from free text. */
export async function understand(description: string): Promise<ExtractedFacts> {
  const fallback: ExtractedFacts = {
    businessLabel: "General Business",
    pollutionCategory: "white",
    isManufacturing: false,
    sectorApprovals: [],
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
        `You are a business-approval expert for India. Read the entrepreneur's ` +
        `description and extract structured facts. \n\n` +
        `Available sector approval IDs you can pick from:\n${catalogDescriptions}\n\n` +
        `Description:\n"${description}"`,
    });
    
    // Guard sector approvals against hallucinations
    object.sectorApprovals = object.sectorApprovals.filter(id => catalogKeys.includes(id));
    
    return object;
  } catch (e) {
    console.error("[understand] AI failed, using fallback:", e);
    return fallback;
  }
}
