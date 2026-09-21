"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/lib/i18n/context";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  const { t } = useLanguage();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const supabase = createClient();
    if (!supabase) {
      // Demo mode fallback when Supabase is not configured
      setMessage(t("login.demoMode"));
      setTimeout(() => {
        router.push("/describe");
      }, 700);
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${location.origin}/describe`,
      },
    });

    if (error) {
      setMessage("Error: " + error.message);
    } else {
      // For demo, immediately push them to describe
      setMessage(t("login.checkEmail"));
      setTimeout(() => {
         router.push("/describe");
      }, 1500);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex flex-col items-center justify-center p-6">
      <Card className="w-full max-w-[420px] border-sarathi-line shadow-[0_1px_2px_rgba(16,42,79,.08)] rounded-[14px]">
        <CardHeader className="text-center pt-9 pb-6">
          <div className="flex justify-center mb-7">
            {/* Sarathi Logo */}
            <div className="flex items-center gap-[13px]">
              <svg className="w-[44px] h-[44px] shrink-0" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <rect x="3" y="3" width="42" height="42" rx="10" fill="#16437e" />
                <path d="M16 24.5l5.2 5.2L33 18" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M24 8.5c5 2.4 9 3 12 3v9c0 8-5.4 13.2-12 16-6.6-2.8-12-8-12-16v-9c3 0 7-.6 12-3z" stroke="#8fb4e0" strokeWidth="1.6" opacity=".7" />
              </svg>
              <div className="font-serif font-bold text-[24px] tracking-[-0.2px] text-sarathi-blue leading-none">{t("header.brand")}</div>
            </div>
          </div>
          <CardTitle className="font-serif text-[28px] font-bold text-sarathi-ink mb-1.5 tracking-[-0.3px]">
            {t("login.title")}
          </CardTitle>
          <CardDescription className="text-[15.5px] text-sarathi-muted">
            {t("login.subtitle")}
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-8 px-8">
          <form onSubmit={handleLogin} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2.5">
              <label htmlFor="email" className="font-semibold text-[14.5px] text-sarathi-ink">
                {t("login.emailLabel")}
              </label>
              <Input 
                id="email" 
                type="email" 
                placeholder={t("login.emailPlaceholder")} 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-[46px] border-[1.5px] border-sarathi-line-strong rounded-[8px] bg-white px-3.5 text-[15px] focus-visible:ring-0 focus-visible:border-sarathi-blue focus-visible:shadow-[0_0_0_3px_var(--color-sarathi-blue-050)] transition-all"
              />
            </div>
            
            <button 
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center bg-sarathi-blue hover:bg-sarathi-blue-700 text-white font-semibold text-[16px] h-[48px] w-full rounded-[8px] transition-colors mt-2 disabled:opacity-70"
            >
              {loading ? t("login.sending") : t("login.continue")}
            </button>

            {message && (
              <p className="text-[14px] text-center font-medium text-sarathi-blue mt-2">
                {message}
              </p>
            )}
          </form>

          <div className="flex items-center justify-center space-x-2 my-5">
            <div className="h-[1px] bg-sarathi-line flex-1"></div>
            <span className="text-[13px] font-medium text-sarathi-muted">{t("login.or")}</span>
            <div className="h-[1px] bg-sarathi-line flex-1"></div>
          </div>

          <button 
            type="button"
            onClick={async () => {
              const supabase = createClient();
              if (supabase) {
                await supabase.auth.signInWithOAuth({
                  provider: 'google',
                  options: {
                    redirectTo: `${window.location.origin}/describe`
                  }
                });
              }
            }}
            className="inline-flex items-center justify-center bg-white border-[1.5px] border-sarathi-line hover:bg-gray-50 text-sarathi-ink font-semibold text-[15.5px] h-[48px] w-full rounded-[8px] transition-colors shadow-sm"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              <path d="M1 1h22v22H1z" fill="none"/>
            </svg>
            {t("login.google")}
          </button>
        </CardContent>
        <CardFooter className="flex flex-col gap-2.5 justify-center pb-8 pt-0 px-8">
          <button 
            type="button"
            onClick={() => router.push("/describe")}
            className="text-[13.5px] font-semibold text-sarathi-blue hover:underline cursor-pointer"
          >
            {t("login.skip")}
          </button>
          <p className="text-[13px] text-sarathi-faint text-center">
            {t("login.newHere")}
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
