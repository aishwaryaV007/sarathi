"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/db";
import { LogOut, User } from "lucide-react";
import { useRouter } from "next/navigation";

export function Header() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient();
      if (!supabase) {
        setLoading(false);
        return;
      }
      const { data: { user } } = await supabase.auth.getUser();
      setUserEmail(user?.email ?? null);
      setLoading(false);

      // Listen for auth state changes (login/logout)
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUserEmail(session?.user?.email ?? null);
      });

      return () => subscription.unsubscribe();
    }
    checkAuth();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    if (supabase) {
      await supabase.auth.signOut();
      setUserEmail(null);
      router.push("/");
      router.refresh();
    }
  };

  return (
    <>


      {/* Main Header */}
      <header className="bg-white border-b border-sarathi-line sticky top-0 z-40">
        <div className="max-w-[1120px] mx-auto px-6 flex items-center justify-between h-[76px] gap-6">
          <Link href="/" className="flex items-center gap-[13px] hover:opacity-90 transition-opacity">
            <svg className="w-[44px] h-[44px] shrink-0" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <rect x="3" y="3" width="42" height="42" rx="10" fill="#16437e" />
              <path d="M16 24.5l5.2 5.2L33 18" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M24 8.5c5 2.4 9 3 12 3v9c0 8-5.4 13.2-12 16-6.6-2.8-12-8-12-16v-9c3 0 7-.6 12-3z" stroke="#8fb4e0" strokeWidth="1.6" opacity=".7" />
            </svg>
            <div>
              <div className="font-serif font-bold text-[22px] tracking-[-0.2px] text-sarathi-blue leading-none">Sarathi</div>
              <div className="text-[11.5px] text-sarathi-muted mt-[3px] tracking-[0.02em]">Business Approval & Compliance Assistant</div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <Link href="/" className="text-sarathi-blue font-semibold bg-sarathi-blue-050 text-[15px] px-[14px] py-[9px] rounded-[7px]">Home</Link>
            <Link href={userEmail ? "/dashboard" : "/login?returnTo=/dashboard"} className="text-sarathi-ink font-medium text-[15px] px-[14px] py-[9px] rounded-[7px] hover:bg-sarathi-blue-050 hover:text-sarathi-blue transition-colors">Track Applications</Link>
            <Link href="/schemes" className="text-sarathi-ink font-medium text-[15px] px-[14px] py-[9px] rounded-[7px] hover:bg-sarathi-blue-050 hover:text-sarathi-blue transition-colors">Schemes</Link>
            <Link href="/guide" className="text-sarathi-ink font-medium text-[15px] px-[14px] py-[9px] rounded-[7px] hover:bg-sarathi-blue-050 hover:text-sarathi-blue transition-colors">Guide</Link>
          </nav>

          <div className="flex items-center gap-[10px]">
            {loading ? (
              <div className="w-[80px] h-[40px] bg-sarathi-page rounded-[8px] animate-pulse" />
            ) : userEmail ? (
              <>
                <div className="hidden sm:flex items-center gap-2 text-[14px] text-sarathi-ink font-medium bg-sarathi-page border border-sarathi-line px-3 py-2 rounded-[8px]">
                  <User className="w-4 h-4 text-sarathi-blue" />
                  <span className="max-w-[150px] truncate">{userEmail}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center justify-center gap-1.5 border-[1.5px] border-sarathi-line-strong text-sarathi-muted font-semibold px-[14px] py-[10px] rounded-[8px] hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            ) : (
              <Link href="/login" className="hidden sm:inline-flex items-center justify-center border-[1.5px] border-sarathi-line-strong text-sarathi-blue font-semibold px-[18px] py-[10px] rounded-[8px] hover:border-sarathi-blue hover:bg-sarathi-blue-050 transition-colors">
                Login
              </Link>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
