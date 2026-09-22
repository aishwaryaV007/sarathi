"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Landmark,
  ExternalLink,
  Filter,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import schemesData from "@/data/schemes/schemes.json";
import { evaluateSchemes, classifyMsme, normalizeProfile } from "@/lib/rules-engine";
import type { BusinessProfile } from "@/lib/types";
import { useLanguage } from "@/lib/i18n/context";

export default function SchemesPage() {
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [selectedSector, setSelectedSector] = useState<string>("all");
  const [selectedState, setSelectedState] = useState<string>("all");
  const { t } = useLanguage();

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("sarathi_profile");
      if (raw) {
        const parsed = JSON.parse(raw);
        setProfile(normalizeProfile(parsed));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const msmeTier = profile ? classifyMsme(profile.investmentLakh) : "Micro";
  const dynamicMatches = profile ? evaluateSchemes(profile, msmeTier) : [];
  const matchedIds = new Set(dynamicMatches.map((m) => m.id));

  // Filter schemes
  const filteredSchemes = schemesData.filter((scheme: any) => {
    if (selectedState !== "all" && scheme.eligibleStates && !scheme.eligibleStates.includes(selectedState)) {
      return false;
    }
    if (selectedSector !== "all" && scheme.eligibleSectors && !scheme.eligibleSectors.includes("all")) {
      if (!scheme.eligibleSectors.includes(selectedSector)) return false;
    }
    return true;
  });

  return (
    <div className="min-h-[calc(100vh-140px)] py-11 px-6 bg-[#fafbfc]">
      <div className="max-w-[1140px] mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-sarathi-blue bg-sarathi-blue-050 border border-sarathi-blue-100 px-3 py-1 rounded-full mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              {t("schemes.badge")}
            </div>
            <h1 className="font-serif font-bold text-[34px] text-sarathi-ink tracking-[-0.2px] mb-2">
              {t("schemes.title")}
            </h1>
            <p className="text-[16px] text-sarathi-muted max-w-[650px]">
              {t("schemes.desc")}
            </p>
          </div>

          {profile && (
            <div className="bg-white border border-sarathi-line rounded-[10px] p-3.5 text-[13px] shadow-sm">
              <div className="text-sarathi-muted text-[11.5px] mb-0.5">{t("schemes.activeProfile")}</div>
              <div className="font-bold text-sarathi-ink">{profile.businessLabel}</div>
              <div className="text-[12px] text-sarathi-blue font-semibold">
                {msmeTier} MSME · {profile.city || "Local"}, {profile.state}
              </div>
            </div>
          )}
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-[12px] bg-white border border-sarathi-line mb-8 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[13px] font-semibold text-sarathi-muted flex items-center gap-1.5 mr-2">
              <Filter className="w-3.5 h-3.5" /> {t("schemes.sectorFilter")}
            </span>
            {[
              { id: "all", label: t("schemes.allSectors") },
              { id: "manufacturing", label: t("schemes.manufacturing") },
              { id: "food", label: t("schemes.foodProcessing") },
              { id: "retail_trade", label: t("schemes.retail") },
              { id: "it_tech", label: t("schemes.itTech") },
              { id: "services", label: t("schemes.services") },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedSector(f.id)}
                className={`text-[12.5px] font-semibold px-3 py-1.5 rounded-[6px] transition-colors ${
                  selectedSector === f.id
                    ? "bg-sarathi-blue text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold text-sarathi-muted">{t("schemes.stateLabel")}</span>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="text-[13px] border border-sarathi-line-strong rounded-[6px] px-3 py-1.5 bg-white text-sarathi-ink font-medium"
            >
              <option value="all">{t("schemes.allIndia")}</option>
              <option value="telangana">Telangana</option>
              <option value="maharashtra">Maharashtra</option>
            </select>
          </div>
        </div>

        {/* Schemes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSchemes.map((scheme: any) => {
            const isMatched = matchedIds.has(scheme.id);
            const matchInfo = dynamicMatches.find((m) => m.id === scheme.id);

            return (
              <Card
                key={scheme.id}
                className={`border rounded-[14px] flex flex-col hover:shadow-md transition-all group bg-white overflow-hidden ${
                  isMatched ? "border-amber-300 ring-1 ring-amber-200 shadow-sm" : "border-sarathi-line"
                }`}
              >
                {isMatched && (
                  <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-[12px] font-bold text-amber-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    {t("schemes.recommended")}
                  </div>
                )}

                <CardContent className="p-6 flex-1 flex flex-col">
                  <div className="w-12 h-12 rounded-[10px] bg-sarathi-blue-050 border border-sarathi-blue-100 flex items-center justify-center mb-4 text-sarathi-blue">
                    <Landmark className="w-6 h-6" />
                  </div>

                  <h3 className="font-bold text-[17.5px] text-sarathi-ink mb-1 leading-snug group-hover:text-sarathi-blue transition-colors">
                    {scheme.name}
                  </h3>

                  <div className="text-[12px] font-semibold text-sarathi-muted mb-3 uppercase tracking-wider">
                    {scheme.department}
                  </div>

                  <p className="text-[13.5px] text-sarathi-muted mb-4 line-clamp-3 leading-relaxed">
                    {scheme.description}
                  </p>

                  {/* Match rationale if available */}
                  {matchInfo && (
                    <div className="mb-4 p-2.5 bg-[#fefcf8] border border-amber-200 rounded-[8px] text-[12px] text-amber-900 leading-normal">
                      <b className="block mb-0.5 text-amber-950 font-bold">{t("schemes.matchReason")}</b>
                      {matchInfo.eligibilityReason}
                    </div>
                  )}

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {scheme.tags.map((tag: string) => (
                      <span
                        key={tag}
                        className="bg-[#f1f5f9] text-[#475569] text-[11.5px] font-medium px-2 py-0.5 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Benefit highlights */}
                  <div className="mt-auto pt-4 border-t border-sarathi-line grid grid-cols-2 gap-3 mb-5">
                    <div>
                      <div className="text-[11.5px] text-sarathi-muted mb-0.5">{t("schemes.benefitStructure")}</div>
                      <div className="font-bold text-sarathi-ink text-[13.5px] leading-tight">
                        {scheme.subsidy}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11.5px] text-sarathi-muted mb-0.5">{t("schemes.ceilingLimit")}</div>
                      <div className="font-bold text-sarathi-ink text-[13.5px] leading-tight">
                        {scheme.maxAmount}
                      </div>
                    </div>
                  </div>

                  {/* Action Link */}
                  {scheme.portalUrl ? (
                    <a
                      href={scheme.portalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center w-full gap-2 bg-white border-[1.5px] border-sarathi-line-strong hover:border-sarathi-blue hover:text-sarathi-blue text-sarathi-ink font-semibold px-4 py-2.5 rounded-[8px] text-[13.5px] transition-colors"
                    >
                      {t("schemes.portalLink")}
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ) : (
                    <Link
                      href="/describe"
                      className="inline-flex items-center justify-center w-full gap-2 bg-sarathi-blue hover:bg-sarathi-blue-700 text-white font-semibold px-4 py-2.5 rounded-[8px] text-[13.5px] transition-colors"
                    >
                      {t("schemes.checkEligibility")}
                    </Link>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Pro Upsell Banner */}
        <div className="mt-12 bg-gradient-to-r from-sarathi-blue-050 to-[#eef2f6] border border-sarathi-blue-100 rounded-[14px] p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="flex-1">
            <div className="inline-flex items-center gap-1.5 text-[12px] font-bold text-sarathi-blue bg-white px-2.5 py-1 rounded-full mb-3 shadow-sm border border-sarathi-blue-100">
              <Sparkles className="w-3.5 h-3.5" />
              Sarathi Pro
            </div>
            <h3 className="font-bold text-[22px] text-sarathi-ink mb-2">Never miss free capital.</h3>
            <p className="text-[14.5px] text-sarathi-muted max-w-[600px]">
              Government schemes open and close constantly. Upgrade to Sarathi Pro to get instant WhatsApp alerts the moment a new subsidy drops for your sector in {selectedState === "all" ? "India" : selectedState}.
            </p>
          </div>
          <Link href="/pricing" className="shrink-0 bg-sarathi-blue text-white font-semibold px-6 py-3 rounded-[8px] hover:bg-blue-700 transition-colors shadow-sm">
            Upgrade to Pro
          </Link>
        </div>
      </div>
    </div>
  );
}
