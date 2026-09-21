"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  Shield,
  Clock,
  FileText,
  CheckCircle2,
  ChevronRight,
  FileCheck,
  Building,
  Leaf,
  FileKey,
  ExternalLink,
  Loader2,
  Store,
  Zap,
  BadgeCheck,
  AlertTriangle,
  Info,
  XCircle,
  HelpCircle,
  Landmark,
} from "lucide-react";
import type { ChecklistResult, Approval, BusinessProfile, SchemeMatch } from "@/lib/types";

const ON_FILE_DOCS = ["PAN", "Aadhaar", "Bank account", "Premises proof", "ID proof"];

/** Map the icon string from catalog.json to a Lucide component. */
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  badge: BadgeCheck,
  rupee: FileKey,
  building: Building,
  store: Store,
  file: FileText,
  leaf: Leaf,
  shield: Shield,
  filecheck: FileCheck,
  zap: Zap,
};

function getIcon(iconName: string) {
  return ICON_MAP[iconName] ?? FileText;
}

/** Pollution category color config. */
const POLLUTION_COLORS: Record<string, { dot: string; text: string; bg: string; border: string }> = {
  white: { dot: "#94a3b8", text: "#475569", bg: "#f8fafc", border: "#e2e8f0" },
  green: { dot: "#22c55e", text: "#15803d", bg: "#f0fdf4", border: "#bbf7d0" },
  orange: { dot: "#f59e0b", text: "#b45309", bg: "#fffbeb", border: "#fef3c7" },
  red: { dot: "#ef4444", text: "#b91c1c", bg: "#fef2f2", border: "#fecaca" },
};

export default function ChecklistPage() {
  const [result, setResult] = useState<ChecklistResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"applicable" | "potential" | "not_applicable">("applicable");

  useEffect(() => {
    async function fetchChecklist() {
      try {
        const raw = sessionStorage.getItem("sarathi_profile");
        if (!raw) {
          setError("No business profile found. Please start from the discovery questionnaire.");
          setLoading(false);
          return;
        }
        const profile = JSON.parse(raw);

        const res = await fetch("/api/checklist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profile }),
        });
        if (!res.ok) throw new Error("API error");
        const data = await res.json();
        setResult(data.result);
      } catch (err) {
        console.error("Fetch checklist error:", err);
        setError("Failed to generate your rule-based checklist. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    fetchChecklist();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-140px)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-9 h-9 text-sarathi-blue animate-spin" />
          <div className="text-[15px] font-semibold text-sarathi-muted">
            Evaluating regulatory rules & local statutes…
          </div>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-[calc(100vh-140px)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center max-w-md p-6 bg-white rounded-xl border border-sarathi-line">
          <AlertTriangle className="w-10 h-10 text-amber-500" />
          <div className="text-[15px] text-sarathi-ink">{error || "Something went wrong."}</div>
          <Link
            href="/describe"
            className="inline-flex items-center justify-center bg-sarathi-blue hover:bg-sarathi-blue-700 text-white font-semibold text-[14.5px] h-10 px-5 rounded-[8px] transition-colors"
          >
            Start over
          </Link>
        </div>
      </div>
    );
  }

  const p = result.profileSummary || ({} as BusinessProfile);
  const pollutionColor = POLLUTION_COLORS[result.pollution] || POLLUTION_COLORS.white;

  const applicable = result.applicableApprovals || [];
  const potential = result.potentiallyApplicableApprovals || [];
  const notApplicable = result.notApplicableApprovals || [];

  return (
    <div className="min-h-[calc(100vh-140px)] py-10 px-6 bg-[#fafbfc]">
      <div className="max-w-[1140px] mx-auto">
        {/* Breadcrumbs */}
        <div className="text-[13.5px] text-sarathi-muted mb-6 flex gap-2 items-center">
          <Link href="/" className="hover:text-sarathi-blue transition-colors">Home</Link>
          <span className="text-sarathi-faint">›</span>
          <Link href="/describe" className="hover:text-sarathi-blue transition-colors">Approval Journey</Link>
          <span className="text-sarathi-faint">›</span>
          <span className="font-semibold text-sarathi-ink">Rule-Based Checklist</span>
        </div>

        {/* ========================================================================= */}
        {/* YOUR BUSINESS PROFILE SUMMARY BAR */}
        {/* ========================================================================= */}
        <div className="bg-white border border-sarathi-line rounded-[12px] p-5 mb-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-sarathi-line pb-4 mb-4">
            <div>
              <div className="text-[12px] font-bold uppercase tracking-wider text-sarathi-blue mb-1">
                Evaluated Business Profile
              </div>
              <h1 className="font-serif font-bold text-[24px] text-sarathi-ink">
                {result.businessLabel}
              </h1>
            </div>
            <Link
              href="/describe"
              className="inline-flex items-center gap-1.5 text-sarathi-blue hover:bg-sarathi-blue-050 border border-sarathi-blue-200 px-3.5 py-1.5 rounded-[6px] text-[13px] font-semibold transition-colors self-start md:self-auto"
            >
              Modify Profile Details
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-[13px]">
            <div>
              <div className="text-sarathi-muted text-[11.5px] mb-0.5">Legal Structure</div>
              <div className="font-semibold text-sarathi-ink capitalize">
                {(p.legalStructure || "Sole Proprietorship").replace(/_/g, " ")}
              </div>
            </div>

            <div>
              <div className="text-sarathi-muted text-[11.5px] mb-0.5">Location & Authority</div>
              <div className="font-semibold text-sarathi-ink capitalize">
                {p.city || "Local"}, {p.state || "Telangana"}
                <span className="block text-[11px] text-sarathi-muted font-normal uppercase">
                  {p.jurisdictionType === "ghmc" ? "Metropolitan ULB" : p.jurisdictionType === "panchayat" ? "Gram Panchayat" : "Municipality"}
                </span>
              </div>
            </div>

            <div>
              <div className="text-sarathi-muted text-[11.5px] mb-0.5">Workforce & Labour</div>
              <div className="font-semibold text-sarathi-ink">
                {p.workers || 0} Employee{p.workers === 1 ? "" : "s"}
              </div>
            </div>

            <div>
              <div className="text-sarathi-muted text-[11.5px] mb-0.5">MSME Classification</div>
              <div className="font-semibold text-sarathi-ink">
                {result.msme} MSME
              </div>
            </div>

            <div>
              <div className="text-sarathi-muted text-[11.5px] mb-0.5">Pollution Category</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: pollutionColor.dot }} />
                <span
                  className="font-bold text-[12px] px-2 py-0.5 rounded capitalize leading-none"
                  style={{
                    color: pollutionColor.text,
                    backgroundColor: pollutionColor.bg,
                    border: `1px solid ${pollutionColor.border}`,
                  }}
                >
                  {result.pollution}
                </span>
              </div>
            </div>

            <div>
              <div className="text-sarathi-muted text-[11.5px] mb-0.5">Factories Act, 1948</div>
              <div className="font-semibold text-sarathi-ink">
                {result.factoryApplies ? "Applies (10+ with power)" : "Does not apply"}
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MAIN 2-COLUMN LAYOUT */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_330px] gap-8">
          {/* LEFT: APPROVAL TABS & ACCORDIONS */}
          <div>
            {/* Tab Navigation */}
            <div className="flex items-center gap-2 border-b border-sarathi-line mb-6">
              <button
                onClick={() => setActiveTab("applicable")}
                className={`pb-3 px-3 text-[14.5px] font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === "applicable"
                    ? "border-sarathi-blue text-sarathi-blue"
                    : "border-transparent text-sarathi-muted hover:text-sarathi-ink"
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-sarathi-green" />
                Applicable Approvals
                <span className="bg-sarathi-green-050 text-sarathi-green border border-green-200 text-[11.5px] px-2 py-0.2 rounded-full font-bold">
                  {applicable.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("potential")}
                className={`pb-3 px-3 text-[14.5px] font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === "potential"
                    ? "border-sarathi-blue text-sarathi-blue"
                    : "border-transparent text-sarathi-muted hover:text-sarathi-ink"
                }`}
              >
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Needs Verification
                <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[11.5px] px-2 py-0.2 rounded-full font-bold">
                  {potential.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("not_applicable")}
                className={`pb-3 px-3 text-[14.5px] font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === "not_applicable"
                    ? "border-sarathi-blue text-sarathi-blue"
                    : "border-transparent text-sarathi-muted hover:text-sarathi-ink"
                }`}
              >
                <XCircle className="w-4 h-4 text-slate-400" />
                Not Currently Indicated
                <span className="bg-slate-100 text-slate-600 border border-slate-200 text-[11.5px] px-2 py-0.2 rounded-full font-bold">
                  {notApplicable.length}
                </span>
              </button>
            </div>

            {/* TAB 1: APPLICABLE APPROVALS */}
            {activeTab === "applicable" && (
              <div className="space-y-4">
                <div className="text-[14px] text-sarathi-muted mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-sarathi-green" />
                  These approvals have been confirmed mandatory based on your activity, workforce, and legal profile.
                </div>

                {applicable.length === 0 ? (
                  <div className="p-8 text-center bg-white rounded-xl border border-sarathi-line text-sarathi-muted">
                    No mandatory approvals identified for this combination.
                  </div>
                ) : (
                  <Accordion className="space-y-3" defaultValue={[applicable[0]?.id]}>
                    {applicable.map((app: Approval) => {
                      const IconComp = getIcon(app.icon);
                      return (
                        <AccordionItem
                          value={app.id}
                          key={app.id}
                          className="bg-white border border-sarathi-line rounded-[12px] overflow-hidden data-[state=open]:border-sarathi-blue-600 transition-colors shadow-sm"
                        >
                          <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-sarathi-blue-050 transition-colors [&[data-state=open]]:bg-sarathi-blue-050">
                            <div className="flex items-center justify-between w-full pr-4 text-left">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-[#f4f6f9] border border-sarathi-line flex items-center justify-center shrink-0">
                                  <IconComp className="w-5 h-5 text-sarathi-blue" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-[16px] text-sarathi-ink">{app.name}</span>
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sarathi-green bg-green-50 border border-green-200 px-2 py-0.5 rounded">
                                      ✓ Applicable
                                    </span>
                                  </div>
                                  <div className="text-[13px] text-sarathi-muted mt-0.5">
                                    {app.department}
                                  </div>
                                </div>
                              </div>
                              <div className="hidden sm:flex items-center gap-1.5 text-[12.5px] font-semibold text-sarathi-muted shrink-0 bg-sarathi-page px-2.5 py-1.5 rounded-md border border-sarathi-line">
                                <Clock className="w-3.5 h-3.5" />
                                {app.timeline}
                              </div>
                            </div>
                          </AccordionTrigger>

                          <AccordionContent className="px-5 pb-5 pt-3 border-t border-sarathi-line">
                            {/* Statute & Trigger Reason */}
                            <div className="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-sarathi-green bg-sarathi-green-050 border border-[#bbf7d0] px-3 py-1 rounded-full mb-3">
                              <Shield className="w-3.5 h-3.5" />
                              Required under {app.statute}
                            </div>

                            {/* Why it was triggered */}
                            <div className="p-3.5 rounded-[8px] bg-slate-50 border border-slate-200 mb-4 text-[13.5px]">
                              <div className="font-semibold text-sarathi-ink mb-1 flex items-center gap-1.5">
                                <Info className="w-4 h-4 text-sarathi-blue" />
                                Why this applies:
                              </div>
                              <p className="text-sarathi-ink leading-relaxed">
                                {app.reason}
                              </p>
                              {app.triggeredBy && app.triggeredBy.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-2.5">
                                  {app.triggeredBy.map((trig, idx) => (
                                    <span
                                      key={idx}
                                      className="text-[11.5px] bg-white border border-slate-200 text-slate-700 font-medium px-2 py-0.5 rounded"
                                    >
                                      Rule trigger: {trig}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Missing / Required Documents */}
                            <div className="mb-5">
                              <div className="text-[13px] font-bold text-sarathi-ink mb-2">
                                Documents & Information Required
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {app.documents.map((doc) => {
                                  const isOnFile = ON_FILE_DOCS.includes(doc);
                                  return (
                                    <div
                                      key={doc}
                                      className={`inline-flex items-center gap-1.5 text-[12.5px] px-2.5 py-1.5 rounded-md border ${
                                        isOnFile
                                          ? "bg-[#f0f9ff] border-[#bae6fd] text-[#0284c7]"
                                          : "bg-sarathi-page border-sarathi-line text-sarathi-ink"
                                      }`}
                                    >
                                      {isOnFile ? (
                                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                      ) : (
                                        <FileText className="w-3.5 h-3.5 text-sarathi-faint shrink-0" />
                                      )}
                                      {doc}
                                      {isOnFile && (
                                        <span className="text-[11px] font-semibold opacity-75 ml-0.5">
                                          (on file)
                                        </span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-4 pt-2 border-t border-slate-100">
                              <Link
                                href={`/apply/${app.id}`}
                                className="inline-flex items-center justify-center gap-1.5 bg-sarathi-blue hover:bg-sarathi-blue-700 text-white font-semibold text-[14px] h-9 px-4 rounded-[7px] transition-colors"
                              >
                                Apply Now
                                <ChevronRight className="w-4 h-4" />
                              </Link>
                              {app.portalUrl && (
                                <a
                                  href={app.portalUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-sarathi-blue hover:underline"
                                >
                                  Official Form Portal <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                )}
              </div>
            )}

            {/* TAB 2: NEEDS VERIFICATION (POTENTIALLY APPLICABLE) */}
            {activeTab === "potential" && (
              <div className="space-y-4">
                <div className="text-[14px] text-sarathi-muted mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  These approvals depend on specific threshold tests, physical building area, or local authority discretion.
                </div>

                {potential.length === 0 ? (
                  <div className="p-8 text-center bg-white rounded-xl border border-sarathi-line text-sarathi-muted">
                    No conditional approvals requiring verification.
                  </div>
                ) : (
                  <Accordion className="space-y-3" defaultValue={[potential[0]?.id]}>
                    {potential.map((app: Approval) => {
                      const IconComp = getIcon(app.icon);
                      return (
                        <AccordionItem
                          value={app.id}
                          key={app.id}
                          className="bg-white border border-amber-200 rounded-[12px] overflow-hidden data-[state=open]:border-amber-400 transition-colors shadow-sm"
                        >
                          <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-amber-50/40 transition-colors [&[data-state=open]]:bg-amber-50/50">
                            <div className="flex items-center justify-between w-full pr-4 text-left">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                                  <IconComp className="w-5 h-5 text-amber-700" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-[16px] text-sarathi-ink">{app.name}</span>
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100/80 border border-amber-300 px-2 py-0.5 rounded">
                                      ⚠ Needs Verification
                                    </span>
                                  </div>
                                  <div className="text-[13px] text-sarathi-muted mt-0.5">
                                    {app.department}
                                  </div>
                                </div>
                              </div>
                              <div className="hidden sm:flex items-center gap-1.5 text-[12.5px] font-semibold text-sarathi-muted shrink-0 bg-sarathi-page px-2.5 py-1.5 rounded-md border border-sarathi-line">
                                <Clock className="w-3.5 h-3.5" />
                                {app.timeline}
                              </div>
                            </div>
                          </AccordionTrigger>

                          <AccordionContent className="px-5 pb-5 pt-3 border-t border-amber-100">
                            <div className="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full mb-3">
                              <HelpCircle className="w-3.5 h-3.5" />
                              Statutory Basis: {app.statute}
                            </div>

                            <div className="p-3.5 rounded-[8px] bg-[#fffdfa] border border-amber-200 mb-4 text-[13.5px]">
                              <div className="font-semibold text-amber-900 mb-1">
                                Applicability Condition:
                              </div>
                              <p className="text-sarathi-ink leading-relaxed">
                                {app.reason}
                              </p>
                              {app.verificationConditions && (
                                <div className="mt-3 pt-2.5 border-t border-amber-100 space-y-1">
                                  <div className="text-[12px] font-bold uppercase tracking-wider text-amber-800">
                                    Required Verification Steps:
                                  </div>
                                  {app.verificationConditions.map((cond, idx) => (
                                    <div key={idx} className="text-[13px] text-sarathi-ink flex items-start gap-2">
                                      <span className="text-amber-500 font-bold">•</span>
                                      {cond}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-4 pt-2 border-t border-slate-100">
                              <Link
                                href={`/apply/${app.id}`}
                                className="inline-flex items-center justify-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[14px] h-9 px-4 rounded-[7px] transition-colors"
                              >
                                Check Eligibility Criteria
                                <ChevronRight className="w-4 h-4" />
                              </Link>
                              {app.portalUrl && (
                                <a
                                  href={app.portalUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-sarathi-blue hover:underline"
                                >
                                  Authority Portal <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                )}
              </div>
            )}

            {/* TAB 3: NOT CURRENTLY INDICATED */}
            {activeTab === "not_applicable" && (
              <div className="space-y-4">
                <div className="text-[14px] text-sarathi-muted mb-2 flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-slate-400" />
                  These approvals from the central catalog were evaluated and ruled out for your business profile.
                </div>

                <div className="space-y-2.5">
                  {notApplicable.map((app: Approval) => {
                    const IconComp = getIcon(app.icon);
                    return (
                      <div
                        key={app.id}
                        className="bg-white border border-sarathi-line rounded-[10px] p-4 flex items-start gap-3.5 text-[13.5px]"
                      >
                        <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5 text-slate-500">
                          <IconComp className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div className="font-bold text-sarathi-ink text-[15px]">{app.name}</div>
                            <span className="text-[11.5px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                              Not Indicated
                            </span>
                          </div>
                          <div className="text-[12.5px] text-sarathi-muted mt-0.5 mb-1.5">
                            {app.department} · {app.statute}
                          </div>
                          <p className="text-slate-600 text-[13px] leading-relaxed italic bg-slate-50 p-2.5 rounded border border-slate-100">
                            {app.reason}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* RIGHT SIDEBAR: SCHEMES & DIGILOCKER */}
          {/* ========================================================================= */}
          <div className="space-y-6">
            {/* Dynamic Schemes & Subsidies */}
            <Card className="border-amber-200 shadow-sm rounded-[12px] overflow-hidden bg-[#fffdf9]">
              <div className="bg-[#fef8ed] border-b border-amber-200 px-5 py-3 font-semibold text-amber-900 text-[14.5px] flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-amber-600" />
                  Matched Govt Schemes
                </span>
                <span className="text-[11.5px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                  {result.matchedSchemes?.length || 0} Matches
                </span>
              </div>
              <CardContent className="p-5 space-y-4">
                <p className="text-[12.5px] text-sarathi-muted leading-relaxed">
                  Financial assistance and credit subsidies dynamically matched to your profile:
                </p>

                <div className="space-y-3">
                  {(result.matchedSchemes || []).map((scheme: SchemeMatch) => (
                    <div
                      key={scheme.id}
                      className="p-3 bg-white border border-amber-100 rounded-[8px] space-y-1.5 hover:border-amber-300 transition-colors"
                    >
                      <div className="font-bold text-[13.5px] text-sarathi-ink leading-snug">
                        {scheme.name}
                      </div>
                      <div className="text-[12px] font-semibold text-amber-800 flex items-center gap-1.5">
                        <span>💰 {scheme.subsidy}</span>
                        <span className="text-slate-300">|</span>
                        <span>Max {scheme.maxAmount}</span>
                      </div>
                      <p className="text-[12px] text-sarathi-muted leading-normal">
                        {scheme.eligibilityReason}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="pt-2">
                  <Link
                    href="/schemes"
                    className="inline-flex items-center justify-center w-full gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-semibold text-[13px] py-2 rounded-[7px] transition-colors"
                  >
                    View All Scheme Details &rarr;
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* DigiLocker Documents on file */}
            <Card className="border-sarathi-line shadow-sm rounded-[12px] overflow-hidden bg-white">
              <div className="bg-sarathi-page border-b border-sarathi-line px-5 py-3 font-semibold text-[14px] text-sarathi-ink flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-sarathi-blue" />
                DigiLocker Reusable Vault
              </div>
              <CardContent className="p-5">
                <p className="text-[12.5px] text-sarathi-muted mb-3.5 leading-relaxed">
                  These verified credentials automatically sync across all state and central portal applications.
                </p>
                <div className="space-y-2">
                  {ON_FILE_DOCS.filter((d) => d !== "ID proof").map((doc) => (
                    <div key={doc} className="flex items-center justify-between text-[13px] py-1 border-b border-slate-50 last:border-0">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-sarathi-green shrink-0" />
                        <span className="font-medium text-sarathi-ink">{doc}</span>
                      </div>
                      <span className="text-[11px] text-sarathi-green font-semibold bg-green-50 px-2 py-0.5 rounded">
                        Verified
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
