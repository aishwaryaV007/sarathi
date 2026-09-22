"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage, LOCALE_LABELS, type Locale } from "@/lib/i18n/context";

export function Header() {
  const { locale, setLocale, t } = useLanguage();
  const pathname = usePathname();

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
              <div className="font-serif font-bold text-[22px] tracking-[-0.2px] text-sarathi-blue leading-none">{t("header.brand")}</div>
              <div className="text-[11.5px] text-sarathi-muted mt-[3px] tracking-[0.02em]">{t("header.tagline")}</div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {[
              { href: "/", label: t("header.home") },
              { href: "/dashboard", label: t("header.track") },
              { href: "/schemes", label: t("header.schemes") },
              { href: "/guide", label: t("header.guide") }
            ].map((link) => {
              // Exact match for home, startsWith for others to handle sub-routes like /dashboard/details
              const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
              return (
                <Link 
                  key={link.href} 
                  href={link.href} 
                  className={`text-[15px] px-[14px] py-[9px] rounded-[7px] transition-colors ${
                    isActive 
                      ? "text-sarathi-blue font-semibold bg-sarathi-blue-050" 
                      : "text-sarathi-ink font-medium hover:bg-sarathi-blue-050 hover:text-sarathi-blue"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-[10px]">
            {/* Language Switcher */}
            <div className="flex items-center gap-0.5 bg-[#f1f5f9] rounded-[8px] p-[3px]" aria-label="Language selector">
              {(Object.entries(LOCALE_LABELS) as [Locale, string][]).map(([code, label]) => (
                <button
                  key={code}
                  onClick={() => setLocale(code)}
                  className={`px-[10px] py-[5px] rounded-[6px] text-[13px] font-semibold transition-all ${
                    locale === code
                      ? "bg-sarathi-blue text-white shadow-sm"
                      : "text-sarathi-ink hover:bg-white hover:shadow-sm"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <Link href="/login" className="hidden sm:inline-flex items-center justify-center border-[1.5px] border-sarathi-line-strong text-sarathi-blue font-semibold px-[18px] py-[10px] rounded-[8px] hover:border-sarathi-blue hover:bg-sarathi-blue-050 transition-colors">
              {t("header.login")}
            </Link>
          </div>
        </div>
      </header>
    </>
  );
}
