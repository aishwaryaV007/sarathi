"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  BadgeIndianRupee,
  Briefcase,
  Landmark,
  ExternalLink,
  Filter,
  CheckCircle2,
  Sparkles,
  Info,
} from "lucide-react";
import Link from "next/link";
import schemesData from "@/data/schemes/schemes.json";
import { evaluateSchemes, classifyMsme, normalizeProfile } from "@/lib/rules-engine";
import type { BusinessProfile, SchemeMatch } from "@/lib/types";

export default function SchemesPage() {
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [selectedSector, setSelectedSector] = useState<string>("all");
  const [selectedState, setSelectedState] = useState<string>("all");

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
              Dynamic Government Subsidy & Credit Discovery
            </div>
            <h1 className="font-serif font-bold text-[34px] text-sarathi-ink tracking-[-0.2px] mb-2">
              Government Schemes & Subsidies
            </h1>
            <p className="text-[16px] text-sarathi-muted max-w-[650px]">
              Discover capital subsidies, collateral-free credit guarantees, and interest subvention tailored to your business sector, state, and investment scale.
            </p>
          </div>

          {profile && (
            <div className="bg-white border border-sarathi-line rounded-[10px] p-3.5 text-[13px] shadow-sm">
              <div className="text-sarathi-muted text-[11.5px] mb-0.5">Active Profile</div>
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
              <Filter className="w-3.5 h-3.5" /> Sector Filter:
            </span>
            {[
              { id: "all", label: "All Sectors" },
              { id: "manufacturing", label: "Manufacturing" },
              { id: "food", label: "Food & Processing" },
              { id: "retail_trade", label: "Retail / Trading" },
              { id: "it_tech", label: "IT / Tech" },
              { id: "services", label: "Services" },
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
            <span className="text-[13px] font-semibold text-sarathi-muted">State:</span>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="text-[13px] border border-sarathi-line-strong rounded-[6px] px-3 py-1.5 bg-white text-sarathi-ink font-medium"
            >
              <option value="all">All India</option>
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
                    Recommended for Your Business Profile
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
                      <b className="block mb-0.5 text-amber-950 font-bold">Eligibility Match Reason:</b>
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
                      <div className="text-[11.5px] text-sarathi-muted mb-0.5">Benefit Structure</div>
                      <div className="font-bold text-sarathi-ink text-[13.5px] leading-tight">
                        {scheme.subsidy}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11.5px] text-sarathi-muted mb-0.5">Ceiling Limit</div>
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
                      Official Scheme Portal
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ) : (
                    <Link
                      href="/describe"
                      className="inline-flex items-center justify-center w-full gap-2 bg-sarathi-blue hover:bg-sarathi-blue-700 text-white font-semibold px-4 py-2.5 rounded-[8px] text-[13.5px] transition-colors"
                    >
                      Check Eligibility for My Unit
                    </Link>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
