"use client";

import { useLanguage } from "@/lib/i18n/context";
import { CheckCircle2, Zap, Landmark, BellRing, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function PricingPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-[#fafbfc] py-16 px-6">
      <div className="max-w-[1140px] mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-1.5 text-[13px] font-bold text-sarathi-blue bg-sarathi-blue-050 border border-sarathi-blue-100 px-3 py-1 rounded-full mb-4">
            <Zap className="w-4 h-4 fill-sarathi-blue" />
            {t("pricing.transparent")}
          </div>
          <h1 className="font-serif font-bold text-[42px] text-sarathi-ink tracking-[-0.5px] mb-4">
            {t("pricing.title")}
          </h1>
          <p className="text-[17px] text-sarathi-muted max-w-[700px] mx-auto leading-relaxed">
            {t("pricing.desc")}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-[1000px] mx-auto">
          {/* Free Tier */}
          <div className="bg-white rounded-[16px] p-8 border border-sarathi-line shadow-sm relative flex flex-col">
            <h3 className="font-bold text-[22px] text-sarathi-ink mb-2">{t("pricing.basic")}</h3>
            <div className="text-sarathi-muted text-[14px] mb-6">{t("pricing.basicDesc")}</div>
            <div className="mb-6">
              <span className="text-[36px] font-bold text-sarathi-ink">₹0</span>
              <span className="text-sarathi-muted">{t("pricing.forever")}</span>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              {[
                t("pricing.basicF1"),
                t("pricing.basicF2"),
                t("pricing.basicF3"),
                t("pricing.basicF4")
              ].map((feature, i) => (
                <li key={i} className="flex items-start gap-3 text-[14px] text-sarathi-ink">
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <Link href="/describe" className="block text-center w-full py-3 rounded-[8px] bg-slate-100 text-sarathi-ink font-semibold hover:bg-slate-200 transition-colors">
              {t("pricing.getStarted")}
            </Link>
          </div>

          {/* Pro Tier */}
          <div className="bg-white rounded-[16px] p-8 border-2 border-sarathi-blue shadow-md relative flex flex-col transform md:-translate-y-4">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-sarathi-blue text-white text-[12px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              {t("pricing.mostPopular")}
            </div>
            <h3 className="font-bold text-[22px] text-sarathi-ink mb-2">{t("pricing.pro")}</h3>
            <div className="text-sarathi-muted text-[14px] mb-6">{t("pricing.proDesc")}</div>
            <div className="mb-6">
              <span className="text-[36px] font-bold text-sarathi-ink">₹999</span>
              <span className="text-sarathi-muted">{t("pricing.year")}</span>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              {[
                t("pricing.proF1"),
                t("pricing.proF2"),
                t("pricing.proF3"),
                t("pricing.proF4"),
                t("pricing.proF5")
              ].map((feature, i) => (
                <li key={i} className="flex items-start gap-3 text-[14px] text-sarathi-ink">
                  <CheckCircle2 className="w-5 h-5 text-sarathi-blue shrink-0" />
                  <span className={i === 0 ? "font-semibold" : ""}>{feature}</span>
                </li>
              ))}
            </ul>
            <button className="block text-center w-full py-3 rounded-[8px] bg-sarathi-blue text-white font-semibold hover:bg-blue-700 transition-colors shadow-sm">
              {t("pricing.upgrade")}
            </button>
          </div>

          {/* Enterprise Tier */}
          <div className="bg-gradient-to-b from-[#f8fafc] to-[#f1f5f9] rounded-[16px] p-8 border border-sarathi-line relative flex flex-col">
            <h3 className="font-bold text-[22px] text-sarathi-ink mb-2">{t("pricing.enterprise")}</h3>
            <div className="text-sarathi-muted text-[14px] mb-6">{t("pricing.enterpriseDesc")}</div>
            <div className="mb-6">
              <span className="text-[36px] font-bold text-sarathi-ink">₹4,999</span>
              <span className="text-sarathi-muted">{t("pricing.year")}</span>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              {[
                t("pricing.entF1"),
                t("pricing.entF2"),
                t("pricing.entF3"),
                t("pricing.entF4")
              ].map((feature, i) => (
                <li key={i} className="flex items-start gap-3 text-[14px] text-sarathi-ink">
                  <CheckCircle2 className="w-5 h-5 text-slate-700 shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <button className="block text-center w-full py-3 rounded-[8px] bg-white border border-slate-300 text-sarathi-ink font-semibold hover:border-slate-400 transition-colors shadow-sm">
              {t("pricing.contactSales")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
