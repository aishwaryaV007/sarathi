"use client";

import { useLanguage } from "@/lib/i18n/context";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { Plus } from "lucide-react";

export default function ProfilePage() {
  const { t } = useLanguage();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setUserData(user);
      }
      setLoading(false);
    }
    fetchProfile();
  }, []);

  return (
    <div className="min-h-[calc(100vh-140px)] py-11 px-6">
      <div className="max-w-[800px] mx-auto">
        <div className="bg-white rounded-[16px] border border-sarathi-line shadow-sm overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-sarathi-blue-050 to-white border-b border-sarathi-line relative"></div>
          
          <div className="px-8 pb-8 -mt-12 relative z-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
              <div className="flex items-end gap-5">
                {userData ? (
                  <div className="w-[100px] h-[100px] rounded-full bg-gradient-to-tr from-sarathi-blue to-[#8fb4e0] text-white flex items-center justify-center font-bold text-[40px] shadow-sm border-[4px] border-white ring-1 ring-sarathi-line-strong">
                    {userData.email?.charAt(0).toUpperCase() || "F"}
                  </div>
                ) : (
                  <div className="w-[100px] h-[100px] rounded-full bg-slate-200 animate-pulse border-[4px] border-white ring-1 ring-sarathi-line-strong"></div>
                )}
                
                <div className="pb-2">
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-sarathi-green bg-sarathi-green-050 border border-[#bbf7d0] px-2 py-0.5 rounded-full mb-2 uppercase tracking-wide">
                    Verified Founder
                  </div>
                  <h1 className="font-serif font-bold text-[36px] text-sarathi-ink tracking-[-0.2px] mb-1 leading-none">
                    {userData?.user_metadata?.full_name || "Founder Profile"}
                  </h1>
                </div>
              </div>
              
              <Link 
                href="/describe" 
                className="inline-flex items-center gap-2 bg-sarathi-blue hover:bg-blue-700 text-white font-semibold text-[15px] h-[48px] px-6 rounded-[8px] transition-all shadow-sm shrink-0 mb-2"
              >
                <Plus className="w-4 h-4" />
                Start New Business
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-[13px] font-semibold text-sarathi-muted mb-1 block">Email Address</label>
                  <div className="text-[15px] text-sarathi-ink font-medium bg-sarathi-page px-4 py-3 rounded-[8px] border border-sarathi-line">
                    {userData?.email || (loading ? "Loading..." : "Not provided")}
                  </div>
                </div>
                <div>
                  <label className="text-[13px] font-semibold text-sarathi-muted mb-1 block">Account Status</label>
                  <div className="text-[15px] text-sarathi-ink font-medium bg-sarathi-page px-4 py-3 rounded-[8px] border border-sarathi-line flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-sarathi-green"></span>
                    Active
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-[13px] font-semibold text-sarathi-muted mb-1 block">Member Since</label>
                  <div className="text-[15px] text-sarathi-ink font-medium bg-sarathi-page px-4 py-3 rounded-[8px] border border-sarathi-line">
                    {userData?.created_at ? new Date(userData.created_at).toLocaleDateString() : (loading ? "Loading..." : "Unknown")}
                  </div>
                </div>
                <div>
                  <label className="text-[13px] font-semibold text-sarathi-muted mb-1 block">Linked Businesses</label>
                  <div className="text-[15px] text-sarathi-ink font-medium bg-sarathi-page px-4 py-3 rounded-[8px] border border-sarathi-line">
                    <Link href="/dashboard" className="text-sarathi-blue hover:underline">
                      View all in Dashboard &rarr;
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
