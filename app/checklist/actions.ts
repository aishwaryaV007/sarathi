"use server";

import { createClient } from "@/utils/supabase/server";

export async function getLatestProject() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not logged in" };
  }

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return { success: false, error: "No projects found" };
  }

  // Convert project schema back to profile schema
  const profile = data.profile_data || {
    description: data.description,
    businessLabel: data.description, // Approximation
    legalStructure: "private_limited", // We don't save this exactly, using default approximation for UI
    businessActivity: data.business_type,
    sector: "services", // default
    state: data.state,
    city: data.city,
    jurisdictionType: "ghmc",
    premisesType: data.premises,
    hasPhysicalPremises: data.premises !== "home_office",
    premises: data.premises,
    investmentLakh: data.investment_lakh,
    annualTurnoverLakh: 0,
    workers: data.workers,
    usesPower: data.uses_power,
    handlesFood: data.handles_food,
    servesAlcohol: false,
    handlesDrugs: false,
    usesWeighingInstruments: false,
    usesGroundwater: data.uses_groundwater,
    waterEffluentDischarge: false,
    isStartup: false,
    entityType: data.entity_type,
    isManufacturing: false,
  };

  return { success: true, profile };
}

export async function getUserDocuments(): Promise<{ authenticated: boolean; documentTypes: string[] }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { authenticated: false, documentTypes: [] };
    }

    const { data, error } = await supabase
      .from("documents")
      .select("doc_type, status")
      .eq("user_id", user.id);

    if (error || !data) {
      return { authenticated: true, documentTypes: [] };
    }

    const documentTypes = data
      .filter((d: any) => d.status === "verified" || !d.status)
      .map((d: any) => String(d.doc_type).trim());

    return { authenticated: true, documentTypes };
  } catch {
    return { authenticated: false, documentTypes: [] };
  }
}

