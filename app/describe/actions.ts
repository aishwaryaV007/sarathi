"use server";

import { createClient } from "@/utils/supabase/server";

export async function saveProject(profile: any) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not logged in. Continuing in guest mode." };
  }

  const { data, error } = await supabase
    .from("projects")
    .insert({
      user_id: user.id,
      description: profile.description,
      business_type: profile.businessActivity,
      city: profile.city,
      state: profile.state,
      investment_lakh: profile.investmentLakh,
      workers: profile.workers,
      uses_power: profile.usesPower,
      handles_food: profile.handlesFood,
      uses_groundwater: profile.usesGroundwater,
      premises: profile.premisesType,
      entity_type: profile.entityType,
      profile_data: profile,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Failed to save project:", error);
    return { success: false, error: "Database error." };
  }

  return { success: true, projectId: data.id };
}
