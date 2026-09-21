"use client";

import Link from "next/link";
import { ShieldCheck, ArrowRight, CheckCircle2, ArrowDown, Check, Shield, Minus } from "lucide-react";
import { useLanguage } from "@/lib/i18n/context";

export default function Home() {
  const { t } = useLanguage();

  return (
    <div className="w-full">
      {/* ============ HERO ============ */}
      <div 
        style={{
          background: "radial-gradient(1200px 400px at 85% -10%, #e9f0fa 0%, rgba(233,240,250,0) 60%), linear-gradient(180deg,#fbfcfe 0%, var(--color-sarathi-page) 100%)"
        }} 
        className="border-b border-sarathi-line"
      >
        <div className="max-w-[1120px] mx-auto px-6 py-11 lg:py-16 grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-9 lg:gap-14 items-center">
          <div>
            <span className="inline-flex items-center gap-2 text-sarathi-blue font-semibold text-[13.5px] bg-sarathi-blue-050 border border-sarathi-blue-100 px-3 py-1.5 rounded-full mb-5.5">
              <ShieldCheck className="w-4 h-4" />
              {t("home.badge")}
            </span>
            <h1 className="font-serif font-bold text-[34px] lg:text-[44px] tracking-[-0.5px] leading-[1.08] text-sarathi-ink">
              {t("home.heroTitle1")}<span className="text-sarathi-blue">{t("home.heroHighlight")}</span>{t("home.heroTitle2")}
            </h1>
            <p className="text-[18px] text-sarathi-muted mt-5 max-w-[33em]">
              {t("home.heroDesc")}
            </p>
            <div className="flex flex-wrap gap-3.5 mt-8">
              <Link href="/describe" className="inline-flex items-center justify-center gap-2 bg-sarathi-blue hover:bg-sarathi-blue-700 text-white font-semibold text-base px-6 py-3.5 rounded-lg transition-colors">
                {t("home.cta")}
                <ArrowRight className="w-[18px] h-[18px]" />
              </Link>
              <Link href="#how" className="inline-flex items-center justify-center gap-2 bg-white border-[1.5px] border-sarathi-line-strong text-sarathi-blue font-semibold text-base px-6 py-3.5 rounded-lg hover:border-sarathi-blue hover:bg-sarathi-blue-050 transition-colors">
                {t("home.ctaSecondary")}
              </Link>
            </div>
            <div className="flex flex-wrap gap-6 mt-8.5">
              <div className="flex flex-col">
                <b className="text-[22px] text-sarathi-ink font-extrabold">{t("home.stat1")}</b>
                <span className="text-[13px] text-sarathi-muted">{t("home.stat1Label")}</span>
              </div>
              <div className="flex flex-col">
                <b className="text-[22px] text-sarathi-ink font-extrabold">{t("home.stat2")}</b>
                <span className="text-[13px] text-sarathi-muted">{t("home.stat2Label")}</span>
              </div>
              <div className="flex flex-col">
                <b className="text-[22px] text-sarathi-ink font-extrabold">{t("home.stat3")}</b>
                <span className="text-[13px] text-sarathi-muted">{t("home.stat3Label")}</span>
              </div>
            </div>
          </div>

          {/* concept preview */}
          <div className="bg-white border border-sarathi-line rounded-[14px] shadow-[0_1px_2px_rgba(16,42,79,.06),0_6px_20px_rgba(16,42,79,.06)] overflow-hidden" aria-hidden="true">
            <div className="bg-sarathi-blue-050 border-b border-sarathi-line px-4 py-3 flex items-center gap-2.5 text-[13px] text-sarathi-blue-700 font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              {t("home.previewTitle")}
            </div>
            <div className="p-4 pt-[18px] pb-5">
              <div className="border border-sarathi-line-strong rounded-lg px-[13px] py-[11px] text-[14px] text-sarathi-ink bg-[#fbfcfe] flex items-center gap-[9px]">
                {t("home.previewInput")}
                <span className="w-[1.5px] h-4 bg-sarathi-blue inline-block animate-[blink_1.1s_steps(1)_infinite] opacity-100">
                  <style>{`@keyframes blink { 50% { opacity: 0; } }`}</style>
                </span>
              </div>
              <div className="flex justify-center text-sarathi-faint my-3">
                <ArrowDown className="w-[22px] h-[22px]" />
              </div>
              <div className="flex flex-col gap-2.5">
                <div className="flex items-start gap-2.5 px-3 py-2.5 border border-sarathi-line rounded-lg bg-white">
                  <Check className="w-[18px] h-[18px] text-sarathi-green shrink-0 mt-[1px]" strokeWidth={2.4} />
                  <span className="text-[13.5px]">
                    <b className="block font-semibold text-sarathi-ink">Consent to Establish</b>
                    State Pollution Control Board
                    <span className="text-[11.5px] text-sarathi-green font-semibold mt-0.5 inline-flex items-center gap-1.5">
                      <Shield className="w-3 h-3" /> Water Act, 1974 · Sec 25
                    </span>
                  </span>
                </div>
                <div className="flex items-start gap-2.5 px-3 py-2.5 border border-sarathi-line rounded-lg bg-white">
                  <Check className="w-[18px] h-[18px] text-sarathi-green shrink-0 mt-[1px]" strokeWidth={2.4} />
                  <span className="text-[13.5px]">
                    <b className="block font-semibold text-sarathi-ink">Factory Licence</b>
                    Dept. of Factories & Boilers
                    <span className="text-[11.5px] text-sarathi-green font-semibold mt-0.5 inline-flex items-center gap-1.5">
                      <Shield className="w-3 h-3" /> Factories Act, 1948 · Sec 6
                    </span>
                  </span>
                </div>
                <div className="flex items-start gap-2.5 px-3 py-2.5 border border-sarathi-line rounded-lg bg-white">
                  <Check className="w-[18px] h-[18px] text-sarathi-green shrink-0 mt-[1px]" strokeWidth={2.4} />
                  <span className="text-[13.5px]">
                    <b className="block font-semibold text-sarathi-ink">Udyam (MSME) Registration</b>
                    Ministry of MSME · Micro
                    <span className="text-[11.5px] text-sarathi-green font-semibold mt-0.5 inline-flex items-center gap-1.5">
                      <Shield className="w-3 h-3" /> MSMED Act, 2006
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============ HOW IT WORKS ============ */}
      <section id="how" className="py-16 bg-white border-b border-sarathi-line">
        <div className="max-w-[1120px] mx-auto px-6">
          <div className="max-w-[640px] mb-10">
            <h2 className="font-serif text-[30px] font-bold tracking-[-0.3px]">{t("home.howTitle")}</h2>
            <p className="text-sarathi-muted text-[17px] mt-3">{t("home.howDesc")}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[18px]">
            {[
              { n: 1, t: t("home.step1Title"), d: t("home.step1Desc") },
              { n: 2, t: t("home.step2Title"), d: t("home.step2Desc") },
              { n: 3, t: t("home.step3Title"), d: t("home.step3Desc") },
              { n: 4, t: t("home.step4Title"), d: t("home.step4Desc") }
            ].map((s, i) => (
              <div key={s.n} className="bg-white border border-sarathi-line rounded-[10px] px-5 py-[22px] relative">
                <div className="w-[30px] h-[30px] rounded-full bg-sarathi-blue text-white font-bold text-[14px] flex items-center justify-center mb-3.5">
                  {s.n}
                </div>
                {i < 3 && (
                  <span className="hidden lg:block absolute top-[37px] -right-2.5 text-sarathi-line-strong z-10">
                    <ArrowRight className="w-5 h-5 bg-white" />
                  </span>
                )}
                <h4 className="text-[16.5px] font-bold mb-1.5">{s.t}</h4>
                <p className="text-[14px] text-sarathi-muted">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ COMPARE ============ */}
      <section className="py-16 border-b border-sarathi-line">
        <div className="max-w-[1120px] mx-auto px-6">
          <div className="max-w-[640px] mb-10">
            <h2 className="font-serif text-[30px] font-bold tracking-[-0.3px]">{t("home.compareTitle")}</h2>
            <p className="text-sarathi-muted text-[17px] mt-3">
              {t("home.compareDesc")}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="rounded-[10px] px-6 py-6.5 border border-sarathi-line bg-[#fbfbfc]">
              <h4 className="text-[15px] font-bold tracking-[0.01em] mb-1 text-sarathi-muted">{t("home.existingTitle")}</h4>
              <div className="text-[13px] text-sarathi-faint mb-4.5">{t("home.existingSubtitle")}</div>
              <ul className="flex flex-col gap-[13px]">
                {[
                  t("home.existing1"),
                  t("home.existing2"),
                  t("home.existing3"),
                  t("home.existing4")
                ].map(txt => (
                  <li key={txt} className="flex gap-3 text-[14.5px] items-start text-sarathi-ink">
                    <Minus className="w-[18px] h-[18px] text-sarathi-faint shrink-0 mt-0.5" />
                    {txt}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-[10px] px-6 py-6.5 border border-sarathi-blue-100 bg-sarathi-blue-050">
              <h4 className="text-[15px] font-bold tracking-[0.01em] mb-1 text-sarathi-blue">{t("home.sarathiTitle")}</h4>
              <div className="text-[13px] text-sarathi-faint mb-4.5">{t("home.sarathiSubtitle")}</div>
              <ul className="flex flex-col gap-[13px]">
                <li className="flex gap-3 text-[14.5px] items-start text-sarathi-ink">
                  <Check className="w-[18px] h-[18px] text-sarathi-green shrink-0 mt-0.5" strokeWidth={2.2} />
                  <span><b>{t("home.sarathi1bold")}</b>{t("home.sarathi1")}</span>
                </li>
                <li className="flex gap-3 text-[14.5px] items-start text-sarathi-ink">
                  <Check className="w-[18px] h-[18px] text-sarathi-green shrink-0 mt-0.5" strokeWidth={2.2} />
                  <span><b>{t("home.sarathi2bold")}</b>{t("home.sarathi2")}</span>
                </li>
                <li className="flex gap-3 text-[14.5px] items-start text-sarathi-ink">
                  <Check className="w-[18px] h-[18px] text-sarathi-green shrink-0 mt-0.5" strokeWidth={2.2} />
                  <span><b>{t("home.sarathi3bold")}</b>{t("home.sarathi3")}</span>
                </li>
                <li className="flex gap-3 text-[14.5px] items-start text-sarathi-ink">
                  <Check className="w-[18px] h-[18px] text-sarathi-green shrink-0 mt-0.5" strokeWidth={2.2} />
                  <span><b>{t("home.sarathi4bold")}</b>{t("home.sarathi4")}</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8.5 text-center">
            <Link href="/describe" className="inline-flex items-center justify-center gap-2 bg-sarathi-blue hover:bg-sarathi-blue-700 text-white font-semibold text-base px-6 py-3.5 rounded-lg transition-colors">
              {t("home.tryCta")}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
