import { createClient } from "@/utils/supabase/server";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let userApplications: any[] = [];
  
  if (user) {
    const { data } = await supabase
      .from("applications")
      .select("*")
      .eq("user_id", user.id)
      .order("submitted_at", { ascending: false });
    
    if (data) {
      userApplications = data;
    }
  }

  return <DashboardClient userApplications={userApplications} />;
}
