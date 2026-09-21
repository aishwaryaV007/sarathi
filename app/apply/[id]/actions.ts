"use server";

import { createClient } from "@/utils/supabase/server";

export async function submitApplication(approvalId: string, approvalName: string, department: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in to apply." };
  }

  // 1. Find or create a project for the user
  let { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (!project) {
    const { data: newProject, error: projectError } = await supabase
      .from("projects")
      .insert({
        user_id: user.id,
        description: "My Business Project",
        business_type: "General",
        city: "",
        state: "telangana",
        investment_lakh: 0,
        workers: 0,
        uses_power: false,
        handles_food: false,
        uses_groundwater: false,
        premises: "rented",
        entity_type: "notyet",
      })
      .select("id")
      .single();

    if (projectError || !newProject) {
      console.error(projectError);
      return { error: "Failed to create project." };
    }
    project = newProject;
  }

  // 2. Insert the application
  const slaDeadline = new Date();
  slaDeadline.setDate(slaDeadline.getDate() + 15); // Add 15 days SLA

  const { error } = await supabase
    .from("applications")
    .insert({
      project_id: project.id,
      user_id: user.id,
      approval_id: approvalId,
      approval_name: approvalName,
      department: department,
      status: "under_review",
      sla_deadline: slaDeadline.toISOString(),
    });

  if (error) {
    console.error(error);
    return { error: "Failed to submit application." };
  }

  return { success: true };
}
