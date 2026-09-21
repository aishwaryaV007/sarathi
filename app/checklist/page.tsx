"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getLatestProject, getUserDocuments } from "./actions";
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
  const [userDocs, setUserDocs] = useState<string[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    async function fetchChecklist() {
      try {
        let profile;
        const raw = sessionStorage.getItem("sarathi_profile");
        if (raw) {
          profile = JSON.parse(raw);
        } else {
          const projectRes = await getLatestProject();
          if (projectRes.success && projectRes.profile) {
            profile = projectRes.profile;
            sessionStorage.setItem("sarathi_profile", JSON.stringify(profile));
          } else {
            setError("No business profile found. Please start from the discovery questionnaire.");
            setLoading(false);
            return;
          }
        }

        const [res, docRes] = await Promise.all([
          fetch("/api/checklist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ profile }),
          }),
          getUserDocuments().catch(() => ({ authenticated: false, documentTypes: [] })),
        ]);

        if (!res.ok) throw new Error("API error");
        const data = await res.json();
        setResult(data.result);
        setIsAuthenticated(Boolean(docRes?.authenticated));
        setUserDocs(docRes?.documentTypes || []);
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
  const mandatory = result.mandatoryApprovals || applicable.filter((a) => a.level === "mandatory" || !a.level);
  const recommended = result.recommendedApprovals || applicable.filter((a) => a.level === "recommended");
  const potential = result.potentiallyApplicableApprovals || [];
  const notApplicable = result.notApplicableApprovals || [];

  function isDocumentOnFile(docName: string): boolean {
    if (!isAuthenticated || userDocs.length === 0) return false;
    const target = docName.toLowerCase().trim();
    return userDocs.some((d) => {
      const userDoc = d.toLowerCase().trim();
      return userDoc === target || target.includes(userDoc) || userDoc.includes(target);
    });
  }

  function renderApprovalAccordionItem(app: Approval, isMandatory: boolean) {
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
                  {isMandatory ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                      ✓ Mandatory
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                      ★ Recommended
                    </span>
                  )}
                </div>
                <div className="text-[13px] text-sarathi-muted mt-0.5">{app.department}</div>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-[12.5px] font-semibold text-sarathi-muted shrink-0 bg-sarathi-page px-2.5 py-1.5 rounded-md border border-sarathi-line">
              <Clock className="w-3.5 h-3.5" />
              {app.timeline}
            </div>
          </div>
        </AccordionTrigger>

        <AccordionContent className="px-5 pb-5 pt-3 border-t border-sarathi-line">
          {/* Statute Link */}
          {app.sourceUrl ? (
            <a
              href={app.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-sarathi-green bg-sarathi-green-050 border border-[#bbf7d0] px-3 py-1 rounded-full mb-3 hover:bg-green-100 transition-colors"
            >
              <Shield className="w-3.5 h-3.5" />
              Required under {app.statute} <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
            </a>
          ) : (
            <div className="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-sarathi-green bg-sarathi-green-050 border border-[#bbf7d0] px-3 py-1 rounded-full mb-3">
              <Shield className="w-3.5 h-3.5" />
              Required under {app.statute}
            </div>
          )}

          {/* Why it was triggered */}
          <div className="p-3.5 rounded-[8px] bg-slate-50 border border-slate-200 mb-4 text-[13.5px]">
            <div className="font-semibold text-sarathi-ink mb-1 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-sarathi-blue" />
              Why this applies:
            </div>
            <p className="text-sarathi-ink leading-relaxed">{app.reason}</p>
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
            <div className="text-[13px] font-bold text-sarathi-ink mb-2">Documents & Information Required</div>
            <div className="flex flex-wrap gap-2">
              {app.documents.map((doc) => {
                const onFile = isDocumentOnFile(doc);
                return (
                  <div
                    key={doc}
                    className={`inline-flex items-center gap-1.5 text-[12.5px] px-2.5 py-1.5 rounded-md border ${
                      onFile
                        ? "bg-[#f0f9ff] border-[#bae6fd] text-[#0284c7]"
                        : "bg-sarathi-page border-sarathi-line text-sarathi-ink"
                    }`}
                  >
                    {onFile ? (
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-[#0284c7]" />
                    ) : (
                      <FileText className="w-3.5 h-3.5 text-sarathi-faint shrink-0" />
                    )}
                    <span>{doc}</span>
                    {onFile ? (
                      <span className="text-[11px] font-semibold text-[#0284c7] ml-0.5">(on file)</span>
                    ) : (
                      <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded ml-0.5">
                        Required
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
  }

  return (
    <div className="min-h-[calc(100vh-140px)] py-10 px-6 bg-[#fafbfc]">
      <div className="max-w-[1140px] mx-auto">
        {/* Breadcrumbs */}
        <div className="text-[13.5px] text-sarathi-muted mb-6 flex gap-2 items-center">
          <Link href="/" className="hover:text-sarathi-blue transition-colors">
            Home
          </Link>
          <span className="text-sarathi-faint">›</span>
          <Link href="/describe" className="hover:text-sarathi-blue transition-colors">
            Approval Journey
          </Link>
          <span className="text-sarathi-faint">›</span>
          <span className="font-semibold text-sarathi-ink">Rule-Based Checklist</span>
        </div>

        {/* ========================================================================= */}
        {/* YOUR BUSINESS PROFILE SUMMARY BAR */}
        {/* ========================================================================= */}
        <div className="bg-white border border-sarathi-line rounded-[12px] p-5 mb-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-sarathi-line pb-4 mb-4">
            <div>
              <div className="text-[12px] font-bold uppercase tracking-wider text-sarathi-blue mb-1">
                Evaluated Business Profile
              </div>
              <h1 className="font-serif font-bold text-[24px] text-sarathi-ink">{result.businessLabel}</h1>
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
                  {p.jurisdictionType === "ghmc"
                    ? "Metropolitan ULB"
                    : p.jurisdictionType === "panchayat"
                    ? "Gram Panchayat"
                    : "Municipality"}
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
              <div className="font-semibold text-sarathi-ink">{result.msme} MSME</div>
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
        {/* DYNAMIC SUMMARY BAR: "{count} approvals apply to your {activity} in {city}" */}
        {/* ========================================================================= */}
        <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/60 to-blue-50/90 border border-sarathi-blue-200 rounded-[12px] px-5 py-3.5 mb-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-sarathi-blue text-white flex items-center justify-center font-bold text-[15px] shrink-0 shadow-sm">
              {applicable.length}
            </div>
            <div className="text-[14.5px] text-sarathi-ink">
              <span className="font-bold text-sarathi-blue">
                {applicable.length} approval{applicable.length === 1 ? "" : "s"} apply
              </span>{" "}
              to your{" "}
              <span className="font-semibold capitalize">
                {p.businessActivity ? p.businessActivity.replace(/_/g, " ") : result.businessLabel}
              </span>{" "}
              in <span className="font-semibold capitalize">{p.city ? p.city.trim() : "your city"}</span>.
            </div>
          </div>
          <div className="flex items-center gap-2 text-[12px] shrink-0">
            <span className="bg-white border border-emerald-200 text-emerald-800 px-2.5 py-1 rounded-md font-semibold">
              {mandatory.length} Mandatory
            </span>
            <span className="bg-white border border-amber-200 text-amber-800 px-2.5 py-1 rounded-md font-semibold">
              {recommended.length} Recommended
            </span>
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
              <div className="space-y-6">
                {applicable.length === 0 ? (
                  <div className="p-10 text-center bg-white rounded-xl border border-sarathi-line shadow-sm space-y-3">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div className="text-[17px] font-bold text-sarathi-ink">
                      No statutory approvals required for this business configuration
                    </div>
                    <p className="text-[13.5px] text-sarathi-muted max-w-md mx-auto">
                      Based on the answers provided, no mandatory or recommended approvals apply to your business. You can review the &ldquo;Needs Verification&rdquo; tab or modify your answers.
                    </p>
                    <div className="pt-2">
                      <Link
                        href="/describe"
                        className="inline-flex items-center gap-1.5 bg-sarathi-blue hover:bg-sarathi-blue-700 text-white font-semibold text-[13.5px] h-9 px-4 rounded-[7px] transition-colors"
                      >
                        Modify Profile Details
                      </Link>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* SECTION 1: MANDATORY APPROVALS */}
                    {mandatory.length > 0 && (
                      <div className="space-y-3.5">
                        <div className="bg-emerald-50/80 border border-emerald-200 rounded-[10px] p-4 flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                            <Shield className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-[15px] text-emerald-950 flex items-center gap-2">
                              Mandatory for your business
                              <span className="text-[11.5px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                                {mandatory.length} Required
                              </span>
                            </div>
                            <p className="text-[13px] text-emerald-800 mt-0.5 leading-normal">
                              Legally required before commencing operations, occupying physical premises, or hiring employees under statutory acts.
                            </p>
                          </div>
                        </div>

                        <Accordion className="space-y-3" defaultValue={[mandatory[0]?.id]}>
                          {mandatory.map((app: Approval) => renderApprovalAccordionItem(app, true))}
                        </Accordion>
                      </div>
                    )}

                    {/* SECTION 2: RECOMMENDED REGISTRATIONS & BENEFITS */}
                    {recommended.length > 0 && (
                      <div className="space-y-3.5 pt-2">
                        <div className="bg-amber-50/80 border border-amber-200 rounded-[10px] p-4 flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                            <BadgeCheck className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-[15px] text-amber-950 flex items-center gap-2">
                              Recommended for your business
                              <span className="text-[11.5px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full">
                                {recommended.length} Recommended
                              </span>
                            </div>
                            <p className="text-[13px] text-amber-800 mt-0.5 leading-normal">
                              Voluntary registrations unlocking government subsidies, tax benefits (80-IAC), collateral-free credit, and statutory delayed payment protection.
                            </p>
                          </div>
                        </div>

                        <Accordion className="space-y-3" defaultValue={[recommended[0]?.id]}>
                          {recommended.map((app: Approval) => renderApprovalAccordionItem(app, false))}
                        </Accordion>
                      </div>
                    )}
                  </>
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
                                  <div className="text-[13px] text-sarathi-muted mt-0.5">{app.department}</div>
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
                              <div className="font-semibold text-amber-900 mb-1">Applicability Condition:</div>
                              <p className="text-sarathi-ink leading-relaxed">{app.reason}</p>
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
                      <div className="font-bold text-[13.5px] text-sarathi-ink leading-snug">{scheme.name}</div>
                      <div className="text-[12px] font-semibold text-amber-800 flex items-center gap-1.5">
                        <span>💰 {scheme.subsidy}</span>
                        <span className="text-slate-300">|</span>
                        <span>Max {scheme.maxAmount}</span>
                      </div>
                      <p className="text-[12px] text-sarathi-muted leading-normal">{scheme.eligibilityReason}</p>
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
                {isAuthenticated && userDocs.length > 0 ? (
                  <>
                    <p className="text-[12.5px] text-sarathi-muted mb-3.5 leading-relaxed">
                      These verified credentials in your vault automatically sync across all applications:
                    </p>
                    <div className="space-y-2">
                      {userDocs.map((doc) => (
                        <div
                          key={doc}
                          className="flex items-center justify-between text-[13px] py-1 border-b border-slate-50 last:border-0"
                        >
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-sarathi-green shrink-0" />
                            <span className="font-medium text-sarathi-ink">{doc}</span>
                          </div>
                          <span className="text-[11px] text-sarathi-green font-semibold bg-green-50 px-2 py-0.5 rounded">
                            On file
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-2 space-y-2">
                    <p className="text-[12.5px] text-sarathi-muted leading-relaxed">
                      No documents on file in this session. Log in and upload credentials to your vault to automatically reuse them across approvals.
                    </p>
                    <div className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-sarathi-blue bg-blue-50 px-3 py-1.5 rounded-md border border-blue-200">
                      Vault Ready for Uploads
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
