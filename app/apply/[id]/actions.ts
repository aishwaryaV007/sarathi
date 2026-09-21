"use server";

import { createClient } from "@/utils/supabase/server";
import catalog from "@/data/approvals/catalog.json";
import { resolveLocationAuthority, RULE_APPROVAL_DEFINITIONS } from "@/lib/rules-engine";
import type { BusinessProfile } from "@/lib/types";

export async function getApplyPageData(approvalId: string, clientProfile?: Partial<BusinessProfile>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Find the approval in catalog
  const base = (catalog as Record<string, any>)[approvalId];
  if (!base) {
    return { success: false, error: "Approval not found" };
  }

  // Retrieve user profile and project if logged in
  let profile = null;
  let project = null;
  let documentsOnFile: string[] = [];

  if (user) {
    const { data: prof } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();
    profile = prof;

    const { data: proj } = await supabase
      .from("projects")
      .select("description, city, state, business_type")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    project = proj;

    const { data: docs } = await supabase
      .from("documents")
      .select("doc_type")
      .eq("user_id", user.id);
    documentsOnFile = docs ? docs.map((d: { doc_type: string }) => d.doc_type) : [];
  }

  // Resolve location authority
  const state = clientProfile?.state || project?.state || "telangana";
  const city = clientProfile?.city || project?.city || "Hyderabad";
  const jurisdictionType = clientProfile?.jurisdictionType || "ghmc";

  const loc = resolveLocationAuthority(state, city, jurisdictionType);
  let department = base.department;
  let portalUrl = base.portalUrl;
  let statute = base.statute;

  if (base.locationDependent) {
    if (approvalId === "trade_licence") {
      department = loc.tradeAuthority;
      portalUrl = loc.tradePortal || portalUrl;
      statute = loc.tradeStatute;
    } else if (approvalId === "power_connection") {
      department = loc.powerDiscom;
      portalUrl = loc.powerPortal || portalUrl;
    } else if (approvalId === "cte" || approvalId === "cto") {
      department = loc.pcbDept;
      portalUrl = loc.pcbPortal || portalUrl;
    } else if (approvalId === "factory_licence") {
      department = loc.factoriesDept;
      portalUrl = loc.factoriesPortal || portalUrl;
    } else if (approvalId === "fire_noc") {
      department = loc.fireDept;
      portalUrl = loc.firePortal || portalUrl;
    } else if (approvalId === "shops") {
      department = loc.labourDept;
      portalUrl = loc.labourPortal || portalUrl;
    } else if (approvalId === "eating_house") {
      department =
        loc.authorityType === "GHMC"
          ? "Hyderabad / Cyberabad Police Commissionerate"
          : "Local Police Commissionerate / District Magistrate";
    }
  }

  // Tailor documents dynamically if rule definition exists
  const legalStructure = clientProfile?.legalStructure || "sole_proprietorship";
  const ruleDef = RULE_APPROVAL_DEFINITIONS[approvalId];
  const documents: string[] = ruleDef
    ? ruleDef.requiredDocs({
        ...clientProfile,
        legalStructure,
        businessActivity: clientProfile?.businessActivity || "services",
      } as any)
    : base.documents;

  const approval = {
    ...base,
    department,
    statute,
    portalUrl,
    documents,
  };

  const businessName =
    clientProfile?.description ||
    clientProfile?.businessLabel ||
    project?.description ||
    "Commercial Enterprise";

  const applicantName =
    profile?.full_name ||
    user?.email?.split("@")[0] ||
    "Business Promoter";

  const address = `${city}, ${state.charAt(0).toUpperCase() + state.slice(1)}`;

  const pan = documentsOnFile.includes("PAN")
    ? "Verified in Vault"
    : "ABCDE1234F (On File)";

  return {
    success: true,
    approval,
    userProfile: {
      fullName: applicantName,
      businessName,
      address,
      pan,
    },
    documentsOnFile,
  };
}

export async function submitApplication(approvalId: string, approvalName: string, department: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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

  const { error } = await supabase.from("applications").insert({
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
