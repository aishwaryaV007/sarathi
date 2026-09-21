"use server";

import { createClient } from "@/utils/supabase/server";
import catalog from "@/data/approvals/catalog.json";

export async function getApplyPageData(approvalId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Find the approval in catalog
  const approval = (catalog as Record<string, any>)[approvalId];
  if (!approval) {
    return { success: false, error: "Approval not found" };
  }

  if (!user) {
    return { 
      success: true, 
      approval,
      userProfile: { fullName: "Guest User", businessName: "Demo Business", address: "Local", pan: "Not on file" },
      documentsOnFile: []
    };
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  // Get latest project
  const { data: project } = await supabase
    .from("projects")
    .select("description, city, state")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  // Get documents
  const { data: docs } = await supabase
    .from("documents")
    .select("doc_type")
    .eq("user_id", user.id);

  const documentsOnFile = docs ? docs.map((d: { doc_type: string }) => d.doc_type) : [];

  return {
    success: true,
    approval,
    userProfile: {
      fullName: profile?.full_name || user.email?.split("@")[0] || "User",
      businessName: project?.description || "My Business",
      address: `${project?.city || "City"}, ${project?.state || "State"}`,
      pan: documentsOnFile.includes("PAN") ? "On File" : "Not uploaded"
    },
    documentsOnFile
  };
}

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
    .order("created_at", { ascending: false })
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
