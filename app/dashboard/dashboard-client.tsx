"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, CalendarClock, ArrowRight, HelpCircle, Plus } from "lucide-react";
import { useLanguage } from "@/lib/i18n/context";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

function getStatusStyles(type: string) {
  if (type === "green") return "bg-sarathi-green-050 text-sarathi-green border border-[#bbf7d0]";
  if (type === "amber") return "bg-sarathi-amber-050 text-[#b45309] border border-[#fcefd8]";
  return "bg-sarathi-blue-050 text-sarathi-blue-600 border border-sarathi-blue-100";
}

function getProgressColor(type: string) {
  if (type === "green") return "bg-sarathi-green";
  if (type === "amber") return "bg-[#f59e0b]";
  return "bg-sarathi-blue";
}

export function DashboardClient() {
  const { t } = useLanguage();
  const [userApplications, setUserApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchApps() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data } = await supabase
          .from("applications")
          .select("*")
          .eq("user_id", user.id)
          .order("submitted_at", { ascending: false });
        
        if (data) setUserApplications(data);
      }
      setLoading(false);
    }
    fetchApps();
  }, []);

  return (
    <div className="min-h-[calc(100vh-140px)] py-11 px-6">
      <div className="max-w-[1120px] mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-9 border-b border-sarathi-line pb-6">
          <div>
            <h1 className="font-serif font-bold text-[32px] text-sarathi-ink tracking-[-0.2px] mb-1.5">
              {t("dashboard.title")}
            </h1>
            <p className="text-[16px] text-sarathi-muted">
              {t("dashboard.subtitle")}
            </p>
          </div>
          <Link 
            href="/describe" 
            className="inline-flex items-center gap-1.5 bg-sarathi-blue hover:bg-sarathi-blue-700 text-white font-semibold text-[14.5px] h-[44px] px-6 rounded-[8px] transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            {t("dashboard.newApproval")}
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
          
          {/* Main List */}
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12 bg-white rounded-[12px] border border-sarathi-line shadow-sm">
                <div className="w-8 h-8 border-4 border-sarathi-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <h3 className="text-lg font-bold text-sarathi-ink">Loading...</h3>
              </div>
            ) : userApplications.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-[12px] border border-sarathi-line shadow-sm">
                <FileText className="w-12 h-12 text-sarathi-line-strong mx-auto mb-4" />
                <h3 className="text-lg font-bold text-sarathi-ink">{t("dashboard.noApps")}</h3>
                <p className="text-sarathi-muted mb-6">{t("dashboard.noAppsDesc")}</p>
                <Link href="/describe" className="inline-flex items-center gap-1.5 bg-sarathi-blue hover:bg-sarathi-blue-700 text-white font-semibold text-[14.5px] h-[44px] px-6 rounded-[8px] transition-colors">
                  {t("dashboard.getStarted")}
                </Link>
              </div>
            ) : (
              userApplications.map((app) => (
                <Link key={app.id} href={`/apply/${app.approval_id}`} className="block">
                  <Card className="border-sarathi-line shadow-sm rounded-[12px] hover:border-sarathi-blue-100 transition-colors cursor-pointer bg-white hover:shadow-md">
                    <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-5">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-full bg-sarathi-page border border-sarathi-line flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5 text-sarathi-blue" />
                        </div>
                        <div>
                          <div className="font-bold text-[16px] text-sarathi-ink group-hover:text-sarathi-blue transition-colors">{app.approval_name}</div>
                          <div className="text-[13.5px] text-sarathi-muted mt-0.5">{app.department}</div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col w-full md:w-[260px] shrink-0">
                        <div className="flex items-center justify-between w-full mb-2">
                          <span className={`text-[12px] font-bold px-2.5 py-0.5 rounded-full ${getStatusStyles(app.status === 'approved' ? 'green' : 'blue')}`}>
                            {app.status.replace("_", " ")}
                          </span>
                          <span className="text-[13px] font-semibold text-sarathi-muted">
                            {t("dashboard.submitted")}
                          </span>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full h-2 rounded-full bg-sarathi-page border border-sarathi-line-strong/50 overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-1000 ${getProgressColor(app.status === 'approved' ? 'green' : 'blue')}`}
                            style={{ width: app.status === 'approved' ? '100%' : '50%' }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            
            {/* Upcoming Renewals Card */}
            <Card className="border-sarathi-line shadow-sm rounded-[12px] overflow-hidden">
              <div className="bg-sarathi-page border-b border-sarathi-line px-5 py-3.5 font-semibold text-[14.5px] text-sarathi-ink flex items-center gap-2">
                <CalendarClock className="w-[18px] h-[18px] text-sarathi-blue" />
                {t("dashboard.renewals")}
              </div>
              <CardContent className="p-5">
                <div className="text-sm text-sarathi-muted">
                  {t("dashboard.noRenewals")}
                </div>
              </CardContent>
            </Card>

            {/* Need Help Card */}
            <Card className="border-sarathi-blue-100 shadow-sm rounded-[12px] overflow-hidden bg-sarathi-blue-050">
              <CardContent className="p-5 flex flex-col items-start">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center mb-4 shadow-sm">
                  <HelpCircle className="w-5 h-5 text-sarathi-blue-600" />
                </div>
                <h3 className="font-bold text-[16px] text-sarathi-ink mb-1.5">{t("dashboard.needHelp")}</h3>
                <p className="text-[13.5px] text-sarathi-muted mb-5 leading-relaxed">
                  {t("dashboard.helpDesc")}
                </p>
                <button className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-sarathi-blue-700 bg-white border border-sarathi-blue-100 hover:border-sarathi-blue px-4 py-2 rounded-[8px] transition-colors w-full justify-center shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                  {t("dashboard.contactSupport")}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
}
