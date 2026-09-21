"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Utensils,
  Factory,
  ShoppingBag,
  Laptop,
  Pill,
  Cog,
  Building2,
  CheckCircle2,
  HelpCircle,
  Sparkles,
} from "lucide-react";
import type { BusinessActivity, LegalStructure, JurisdictionType, Sector } from "@/lib/types";
import { useLanguage } from "@/lib/i18n/context";

const ACTIVITY_OPTIONS: {
  id: BusinessActivity;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  defaultSector: Sector;
}[] = [
  {
    id: "food_service",
    label: "Restaurant / Cafe",
    desc: "Dining, cloud kitchen, food court, bakery",
    icon: Utensils,
    defaultSector: "food",
  },
  {
    id: "food_processing",
    label: "Food Processing",
    desc: "Food packaging, rice mill, drinking water plant",
    icon: Factory,
    defaultSector: "food",
  },
  {
    id: "retail",
    label: "Retail Shop / Store",
    desc: "Clothing, groceries, electronics, general merchandise",
    icon: ShoppingBag,
    defaultSector: "retail_trade",
  },
  {
    id: "it_services",
    label: "Software / IT Services",
    desc: "SaaS, tech consulting, web & mobile development",
    icon: Laptop,
    defaultSector: "it_tech",
  },
  {
    id: "pharmacy",
    label: "Pharmacy / Medical",
    desc: "Retail medical store, wholesale drug distribution",
    icon: Pill,
    defaultSector: "healthcare_pharma",
  },
  {
    id: "manufacturing",
    label: "Manufacturing / Engineering",
    desc: "Fabrication, plastics, chemicals, machinery",
    icon: Cog,
    defaultSector: "manufacturing",
  },
  {
    id: "services",
    label: "Commercial Services",
    desc: "Consulting, logistics, education, agency",
    icon: Building2,
    defaultSector: "services",
  },
];

export default function DescribePage() {
  const [step, setStep] = useState(1);
  const router = useRouter();
  const { t } = useLanguage();

  // Step 1: Core Profile
  const [activity, setActivity] = useState<BusinessActivity>("food_service");
  const [legalStructure, setLegalStructure] = useState<LegalStructure>("sole_proprietorship");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("telangana");
  const [jurisdictionType, setJurisdictionType] = useState<JurisdictionType>("ghmc");
  const [premisesType, setPremisesType] = useState<"commercial" | "industrial" | "home_office">("commercial");

  // Step 2: Scale & Adaptive Specifics
  const [investment, setInvestment] = useState("25");
  const [turnover, setTurnover] = useState("50");
  const [workers, setWorkers] = useState("5");
  const [premisesOwnership, setPremisesOwnership] = useState<"rented" | "owned">("rented");

  // Adaptive flags
  const [power, setPower] = useState<"yes" | "no">("yes");
  const [food, setFood] = useState<"yes" | "no">("yes");
  const [dineIn, setDineIn] = useState<"yes" | "no">("yes");
  const [groundwater, setGroundwater] = useState<"yes" | "no">("no");
  const [effluents, setEffluents] = useState<"yes" | "no">("no");
  const [weighing, setWeighing] = useState<"yes" | "no">("no");
  const [drugs, setDrugs] = useState<"yes" | "no">("no");
  const [alcohol, setAlcohol] = useState<"yes" | "no">("no");
  const [isStartup, setIsStartup] = useState<"yes" | "no">("no");

  const isMfg = activity === "manufacturing" || activity === "food_processing";
  const isFoodRelated = activity === "food_service" || activity === "food_processing";
  const isRetail = activity === "retail";
  const isPharmacy = activity === "pharmacy";

  // Auto-sync initial state when activity changes
  const handleActivitySelect = (act: BusinessActivity) => {
    setActivity(act);
    if (act === "food_service" || act === "food_processing") {
      setFood("yes");
    } else {
      setFood("no");
    }
    if (act === "pharmacy") {
      setDrugs("yes");
    } else {
      setDrugs("no");
    }
    if (act === "manufacturing" || act === "food_processing") {
      setPremisesType("industrial");
      setPower("yes");
    } else if (act === "it_services") {
      setPremisesType("home_office");
      setPower("no");
    } else {
      setPremisesType("commercial");
      setPower("no");
    }
    if (act === "retail") {
      setWeighing("yes");
    }
  };

  // Changing State resets City and Local Authority jurisdiction
  const handleStateChange = (val: string | null) => {
    setStateName(val || "");
    setCity("");
    setJurisdictionType("" as any);
    clearError("stateName");
    clearError("city");
    clearError("jurisdictionType");
  };

  const scrollToAndFocus = (fieldKey: string) => {
    const id = FIELD_ELEMENT_IDS[fieldKey] || fieldKey;
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      if (el instanceof HTMLInputElement || el instanceof HTMLButtonElement || el instanceof HTMLTextAreaElement) {
        el.focus();
      } else {
        const focusable = el.querySelector<HTMLElement>("button, input, select, textarea, [tabindex]:not([tabindex='-1'])");
        if (focusable) {
          focusable.focus();
        } else {
          el.focus();
        }
      }
    }
  };

  const validateStep1 = () =>
    validateStep1Form({
      activity,
      legalStructure,
      stateName,
      city,
      jurisdictionType,
      premisesType,
    });

  const validateStep2 = () =>
    validateStep2Form({
      investment,
      turnover,
      workers,
      activity,
      legalStructure,
      food,
      dineIn,
      power,
      groundwater,
      effluents,
      weighing,
      drugs,
      alcohol,
      isStartup,
    });

  const isStep1Complete = (): boolean => {
    return (
      !!activity &&
      !!legalStructure &&
      !!stateName &&
      !!city &&
      city.trim().length >= 2 &&
      !!jurisdictionType &&
      !!premisesType
    );
  };

  // Guard Step 2 from being accessed unless Step 1 is valid
  useEffect(() => {
    if (step === 2 && !isStep1Complete()) {
      setStep(1);
    }
  }, [step, activity, legalStructure, stateName, city, jurisdictionType, premisesType]);

  const handleStep1Continue = () => {
    setStep1Submitted(true);
    const errs = validateStep1();
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      const order = ["activity", "legalStructure", "stateName", "city", "jurisdictionType", "premisesType"];
      const firstField = order.find((k) => !!errs[k]);
      if (firstField) {
        scrollToAndFocus(firstField);
      }
      return;
    }
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    setStep2Submitted(true);
    const s1Errs = validateStep1();
    if (Object.keys(s1Errs).length > 0) {
      setStep(1);
      setErrors(s1Errs);
      return;
    }

    const errs = validateStep2();
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      const order = [
        "investment",
        "turnover",
        "workers",
        "food",
        "dineIn",
        "power",
        "groundwater",
        "effluents",
        "weighing",
        "drugs",
        ...(showAlcohol ? ["alcohol"] : []),
        ...(showStartup ? ["isStartup"] : []),
      ];
      const firstField = order.find((k) => !!errs[k]);
      if (firstField) {
        scrollToAndFocus(firstField);
      }
      return;
    }

    setIsSubmitting(true);
    const selectedActivityDef = ACTIVITY_OPTIONS.find((a) => a.id === activity);
    const profile = {
      description: description.trim() || selectedActivityDef?.label || "Commercial Enterprise",
      businessLabel: selectedActivityDef?.label || "Commercial Enterprise",
      legalStructure,
      businessActivity: activity,
      sector: selectedActivityDef?.defaultSector || "services",
      state: stateName,
      city: city.trim(),
      jurisdictionType,
      premisesType,
      hasPhysicalPremises: premisesType !== "home_office",
      premises: premisesOwnership,
      investmentLakh: Number(investment),
      annualTurnoverLakh: Number(turnover),
      workers: Number(workers),
      usesPower: power === "yes",
      handlesFood: food === "yes",
      dineIn: activity === "food_service" ? dineIn === "yes" : false,
      servesAlcohol: showAlcohol && alcohol === "yes",
      handlesDrugs: drugs === "yes",
      usesWeighingInstruments: weighing === "yes",
      usesGroundwater: groundwater === "yes",
      waterEffluentDischarge: effluents === "yes",
      isStartup: showStartup && isStartup === "yes",
      // Backward compatibility aliases
      entityType:
        legalStructure === "private_limited" || legalStructure === "public_limited" || legalStructure === "opc"
          ? "company"
          : legalStructure === "partnership" || legalStructure === "llp"
          ? "partnership"
          : "proprietor",
      isManufacturing: isMfg,
    };

    sessionStorage.setItem("sarathi_profile", JSON.stringify(profile));
    
    const res = await saveProject(profile);
    if (res.success && res.projectId) {
      sessionStorage.setItem("sarathi_project_id", res.projectId);
    }
    
    router.push("/checklist");
  };

  // Live preview of MSME classification
  const invNum = Number(investment);
  const turnNum = Number(turnover);
  const hasScaleValues =
    investment.trim() !== "" &&
    turnover.trim() !== "" &&
    !isNaN(invNum) &&
    !isNaN(turnNum) &&
    invNum >= 0 &&
    turnNum >= 0;

  const msmeTier = hasScaleValues ? classifyMsme(invNum, turnNum) : null;
  const workersNum = Number(workers);
  const hasValidWorkers = workers.trim() !== "" && !isNaN(workersNum) && workersNum >= 0 && Number.isInteger(workersNum);


  return (
    <div className="min-h-[calc(100vh-140px)] py-11 px-6">
      <div className="max-w-[760px] mx-auto">
        {/* Breadcrumbs */}
        <div className="text-[13.5px] text-sarathi-muted mb-6 flex gap-2 items-center">
          <Link href="/" className="hover:text-sarathi-blue transition-colors">{t("describe.breadcrumbHome")}</Link>
          <span className="text-sarathi-faint">›</span>
          <span>{t("describe.breadcrumbNew")}</span>
        </div>

        <Card className="border-sarathi-line shadow-[0_1px_2px_rgba(16,42,79,.08)] rounded-[14px] overflow-hidden bg-white">
          {/* Top Progress bar */}
          <div className="bg-sarathi-page border-b border-sarathi-line px-8 py-3.5 flex items-center justify-between text-[13px]">
            <div className="flex items-center gap-2 font-semibold text-sarathi-blue">
              <span className="w-6 h-6 rounded-full bg-sarathi-blue text-white flex items-center justify-center text-[12px] font-bold">
                {step}
              </span>
              Step {step} of 2: {step === 1 ? t("describe.step1Name") : t("describe.step2Name")}
            </div>
            <span className="text-sarathi-muted">{t("describe.ruleEvaluator")}</span>
          </div>

          <CardContent className="p-8 md:p-9">
            {step === 1 ? (
              <div className="space-y-7">
                <div>
                  <h2 className="font-serif text-[26px] font-bold text-sarathi-ink mb-1.5 tracking-[-0.2px]">
                    {t("describe.step1Title")}
                  </h2>
                  <p className="text-[15px] text-sarathi-muted">
                    {t("describe.step1Desc")}
                  </p>
                </div>

                {/* Activity Grid */}
                <div className="space-y-2.5">
                  <label className="font-semibold text-[14px] text-sarathi-ink block">
                    {t("describe.activityLabel")}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {ACTIVITY_OPTIONS.map((opt) => {
                      const Icon = opt.icon;
                      const isSelected = activity === opt.id;
                      return (
                        <div
                          key={opt.id}
                          onClick={() => handleActivitySelect(opt.id)}
                          className={`p-3.5 rounded-[10px] border-[1.5px] cursor-pointer transition-all flex items-start gap-3 ${
                            isSelected
                              ? "border-sarathi-blue bg-sarathi-blue-050 shadow-[0_0_0_2px_var(--color-sarathi-blue-050)]"
                              : "border-sarathi-line hover:border-sarathi-blue-200 hover:bg-slate-50"
                          }`}
                        >
                          <div
                            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                              isSelected
                                ? "bg-sarathi-blue text-white"
                                : "bg-[#f1f5f9] text-sarathi-ink"
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-semibold text-[14.5px] text-sarathi-ink leading-snug">
                              {opt.label}
                            </div>
                            <div className="text-[12px] text-sarathi-muted mt-0.5 leading-tight">
                              {opt.desc}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Legal Constitution */}
                <div className="space-y-2">
                  <label className="font-semibold text-[14px] text-sarathi-ink block">
                    {t("describe.legalLabel")}
                  </label>
                  <Select
                    value={legalStructure}
                    onValueChange={(v) => setLegalStructure(v as LegalStructure)}
                  >
                    <SelectTrigger className="h-[46px] border-[1.5px] border-sarathi-line-strong rounded-[8px] bg-white px-3.5 text-[15px] focus:ring-0 focus:border-sarathi-blue transition-all">
                      <SelectValue placeholder={t("describe.legalPlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sole_proprietorship">Sole Proprietorship (Individual / Sole Trader)</SelectItem>
                      <SelectItem value="partnership">Partnership Firm (Indian Partnership Act, 1932)</SelectItem>
                      <SelectItem value="llp">Limited Liability Partnership (LLP)</SelectItem>
                      <SelectItem value="private_limited">Private Limited Company (Pvt Ltd — MCA SPICe+)</SelectItem>
                      <SelectItem value="opc">One Person Company (OPC)</SelectItem>
                      <SelectItem value="public_limited">Public Limited Company</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[12px] text-sarathi-faint">
                    Determines corporate incorporation (MCA SPICe+), partnership deeds, or individual tax registrations.
                  </p>
                </div>

                {/* Location & Jurisdiction */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-[13.5px] text-sarathi-ink block">
                      {t("describe.stateLabel")}
                    </label>
                    <Select value={stateName} onValueChange={(v) => setStateName(v || "telangana")}>
                      <SelectTrigger className="h-[44px] border-[1.5px] border-sarathi-line-strong rounded-[8px] bg-white px-3.5 text-[14px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="telangana">Telangana</SelectItem>
                        <SelectItem value="maharashtra">Maharashtra</SelectItem>
                        <SelectItem value="other">Other State</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-[13.5px] text-sarathi-ink block">
                      {t("describe.cityLabel")}
                    </label>
                    <Input
                      placeholder="e.g. Hyderabad, Ghatkesar"
                      className="h-[44px] border-[1.5px] border-sarathi-line-strong rounded-[8px] bg-white px-3.5 text-[14px]"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-[13.5px] text-sarathi-ink block">
                      Local Authority Jurisdiction
                    </label>
                    <Select
                      value={jurisdictionType}
                      onValueChange={(v) => setJurisdictionType(v as JurisdictionType)}
                    >
                      <SelectTrigger className="h-[44px] border-[1.5px] border-sarathi-line-strong rounded-[8px] bg-white px-3.5 text-[14px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ghmc">Municipal Corporation (GHMC / BMC)</SelectItem>
                        <SelectItem value="municipality">Urban Municipality (CDMA)</SelectItem>
                        <SelectItem value="panchayat">Rural Gram Panchayat</SelectItem>
                        <SelectItem value="industrial_area">Industrial Area (TSIIC / MIDC)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Premises Type */}
                <div className="space-y-2">
                  <label className="font-semibold text-[14px] text-sarathi-ink block">
                    {t("describe.premisesLabel")}
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                      { id: "commercial", label: t("describe.premCommercial"), note: t("describe.premCommercialNote") },
                      { id: "industrial", label: t("describe.premIndustrial"), note: t("describe.premIndustrialNote") },
                      { id: "home_office", label: t("describe.premHome"), note: t("describe.premHomeNote") },
                    ].map((p) => (
                      <div
                        key={p.id}
                        onClick={() => setPremisesType(p.id as any)}
                        className={`p-3 rounded-[8px] border-[1.5px] cursor-pointer transition-all ${
                          premisesType === p.id
                            ? "border-sarathi-blue bg-sarathi-blue-050 font-medium"
                            : "border-sarathi-line hover:border-sarathi-line-strong"
                        }`}
                      >
                        <div className="text-[14px] font-semibold text-sarathi-ink">{p.label}</div>
                        <div className="text-[11.5px] text-sarathi-muted mt-0.5">{p.note}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Business Description */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-[14px] text-sarathi-ink block">
                    {t("describe.descLabel")}
                  </label>
                  <Textarea
                    placeholder="e.g. Setting up an automated snacks processing plant with cold storage"
                    className="min-h-[80px] border-[1.5px] border-sarathi-line-strong rounded-[8px] bg-white px-3.5 py-2.5 text-[14.5px]"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                {/* Step 1 Actions */}
                <div className="pt-4 border-t border-sarathi-line flex justify-end">
                  <button
                    onClick={() => {
                      setStep(2);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="inline-flex items-center justify-center gap-2 bg-sarathi-blue hover:bg-sarathi-blue-700 text-white font-semibold text-[15px] h-[46px] px-7 rounded-[8px] transition-colors shadow-sm"
                  >
                    {t("describe.continueBtn")}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-7">
                <div>
                  <h2 className="font-serif text-[26px] font-bold text-sarathi-ink mb-1.5 tracking-[-0.2px]">
                    {t("describe.step2Title")}{ACTIVITY_OPTIONS.find((a) => a.id === activity)?.label}
                  </h2>
                  <p className="text-[15px] text-sarathi-muted">
                    {t("describe.step2Desc")}
                  </p>
                </div>

                {/* Scale: Investment, Turnover & Workers */}
                <div className="p-4 rounded-[10px] bg-slate-50 border border-sarathi-line space-y-4">
                  <div className="font-bold text-[14px] text-sarathi-ink flex items-center justify-between">
                    <span>{t("describe.scaleLabel")}</span>
                    <span className="text-[12.5px] font-semibold text-sarathi-blue bg-sarathi-blue-050 border border-sarathi-blue-100 px-2.5 py-0.5 rounded-full">
                      {t("describe.classified")}{msmeTier}{t("describe.msme")}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[13px] font-semibold text-sarathi-ink block">
                        Investment in Plant/Machinery
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sarathi-blue">₹</span>
                        <Input
                          type="number"
                          value={investment}
                          onChange={(e) => setInvestment(e.target.value)}
                          className="h-[42px] bg-white border-sarathi-line-strong text-[14px]"
                          placeholder="e.g. 25"
                        />
                        <span className="text-[12.5px] text-sarathi-muted font-medium">lakh</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[13px] font-semibold text-sarathi-ink block">
                        {t("describe.turnoverLabel")}
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sarathi-blue">₹</span>
                        <Input
                          type="number"
                          value={turnover}
                          onChange={(e) => setTurnover(e.target.value)}
                          className="h-[42px] bg-white border-sarathi-line-strong text-[14px]"
                          placeholder="e.g. 50"
                        />
                        <span className="text-[12.5px] text-sarathi-muted font-medium">lakh</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[13px] font-semibold text-sarathi-ink block">
                        {t("describe.workersLabel")}
                      </label>
                      <Input
                        type="number"
                        value={workers}
                        onChange={(e) => setWorkers(e.target.value)}
                        className="h-[42px] bg-white border-sarathi-line-strong text-[14px]"
                        placeholder="e.g. 5"
                      />
                    </div>
                  </div>

                  <div className="text-[12px] text-sarathi-muted flex flex-wrap gap-4 pt-1">
                    <span>{t("describe.esiNote")}</span>
                    <span>{t("describe.epfNote")}</span>
                    <span>{t("describe.factoriesNote")}</span>
                  </div>
                </div>

                {/* Adaptive Activity Questions */}
                <div className="space-y-5">
                  <div className="font-bold text-[14.5px] text-sarathi-ink border-b border-sarathi-line pb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-sarathi-blue" />
                    {t("describe.triggersLabel")}
                  </div>

                  {/* Food questions */}
                  {isFoodRelated && (
                    <div className="space-y-3 p-4 rounded-[10px] bg-white border border-sarathi-line">
                      <div className="font-semibold text-[14px] text-sarathi-ink">
                        {t("describe.foodQ")}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setFood("yes")}
                          className={`py-2 px-3 rounded-[8px] border text-[14px] font-medium transition-all ${
                            food === "yes"
                              ? "bg-sarathi-blue-050 border-sarathi-blue text-sarathi-blue font-bold"
                              : "border-sarathi-line text-sarathi-ink hover:bg-slate-50"
                          }`}
                        >
                          {t("describe.foodYes")}
                        </button>
                        <button
                          type="button"
                          onClick={() => setFood("no")}
                          className={`py-2 px-3 rounded-[8px] border text-[14px] font-medium transition-all ${
                            food === "no"
                              ? "bg-sarathi-blue-050 border-sarathi-blue text-sarathi-blue font-bold"
                              : "border-sarathi-line text-sarathi-ink hover:bg-slate-50"
                          }`}
                        >
                          {t("describe.foodNo")}
                        </button>
                      </div>

                      {activity === "food_service" && (
                        <div className="pt-2 border-t border-slate-100">
                          <div className="font-medium text-[13.5px] text-sarathi-ink mb-2">
                            Will your premises offer dine-in seating to customers?
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              type="button"
                              onClick={() => setDineIn("yes")}
                              className={`py-2 px-3 rounded-[8px] border text-[13.5px] transition-all ${
                                dineIn === "yes"
                                  ? "bg-sarathi-blue-050 border-sarathi-blue text-sarathi-blue font-bold"
                                  : "border-sarathi-line text-sarathi-ink"
                              }`}
                            >
                              Yes, Dine-in (Eating House Licence)
                            </button>
                            <button
                              type="button"
                              onClick={() => setDineIn("no")}
                              className={`py-2 px-3 rounded-[8px] border text-[13.5px] transition-all ${
                                dineIn === "no"
                                  ? "bg-sarathi-blue-050 border-sarathi-blue text-sarathi-blue font-bold"
                                  : "border-sarathi-line text-sarathi-ink"
                              }`}
                            >
                              Takeaway / Cloud Kitchen only
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Manufacturing / Industrial questions */}
                  {isMfg && (
                    <div className="space-y-4 p-4 rounded-[10px] bg-white border border-sarathi-line">
                      <div>
                        <div className="font-semibold text-[14px] text-sarathi-ink mb-2">
                          Will the factory use electric power for machinery?
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setPower("yes")}
                            className={`py-2 px-3 rounded-[8px] border text-[13.5px] font-medium ${
                              power === "yes"
                                ? "bg-sarathi-blue-050 border-sarathi-blue text-sarathi-blue font-bold"
                                : "border-sarathi-line"
                            }`}
                          >
                            Yes, electric power (Factories Act @ 10+)
                          </button>
                          <button
                            type="button"
                            onClick={() => setPower("no")}
                            className={`py-2 px-3 rounded-[8px] border text-[13.5px] font-medium ${
                              power === "no"
                                ? "bg-sarathi-blue-050 border-sarathi-blue text-sarathi-blue font-bold"
                                : "border-sarathi-line"
                            }`}
                          >
                            No power / Manual (Factories Act @ 20+)
                          </button>
                        </div>
                      </div>

                      <div>
                        <div className="font-semibold text-[14px] text-sarathi-ink mb-2">
                          Will you extract groundwater from a borewell on the premises?
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setGroundwater("yes")}
                            className={`py-2 px-3 rounded-[8px] border text-[13.5px] font-medium ${
                              groundwater === "yes"
                                ? "bg-sarathi-blue-050 border-sarathi-blue text-sarathi-blue font-bold"
                                : "border-sarathi-line"
                            }`}
                          >
                            Yes, borewell (CGWA / State Ground Water NOC)
                          </button>
                          <button
                            type="button"
                            onClick={() => setGroundwater("no")}
                            className={`py-2 px-3 rounded-[8px] border text-[13.5px] font-medium ${
                              groundwater === "no"
                                ? "bg-sarathi-blue-050 border-sarathi-blue text-sarathi-blue font-bold"
                                : "border-sarathi-line"
                            }`}
                          >
                            No, municipal / tanker water only
                          </button>
                        </div>
                      </div>

                      <div>
                        <div className="font-semibold text-[14px] text-sarathi-ink mb-2">
                          Does your manufacturing generate industrial effluents, emissions, or chemicals?
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setEffluents("yes")}
                            className={`py-2 px-3 rounded-[8px] border text-[13.5px] font-medium ${
                              effluents === "yes"
                                ? "bg-sarathi-blue-050 border-sarathi-blue text-sarathi-blue font-bold"
                                : "border-sarathi-line"
                            }`}
                          >
                            Yes (Orange / Red Category PCB Consents)
                          </button>
                          <button
                            type="button"
                            onClick={() => setEffluents("no")}
                            className={`py-2 px-3 rounded-[8px] border text-[13.5px] font-medium ${
                              effluents === "no"
                                ? "bg-sarathi-blue-050 border-sarathi-blue text-sarathi-blue font-bold"
                                : "border-sarathi-line"
                            }`}
                          >
                            No significant discharge (Green / White)
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Retail & Pharmacy Questions */}
                  {(isRetail || isPharmacy) && (
                    <div className="space-y-4 p-4 rounded-[10px] bg-white border border-sarathi-line">
                      {isRetail && (
                        <div>
                          <div className="font-semibold text-[14px] text-sarathi-ink mb-2">
                            Will you sell goods by weight or measurement, or use weighing instruments?
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              type="button"
                              onClick={() => setWeighing("yes")}
                              className={`py-2 px-3 rounded-[8px] border text-[13.5px] font-medium ${
                                weighing === "yes"
                                  ? "bg-sarathi-blue-050 border-sarathi-blue text-sarathi-blue font-bold"
                                  : "border-sarathi-line"
                              }`}
                            >
                              Yes (Legal Metrology Stamping)
                            </button>
                            <button
                              type="button"
                              onClick={() => setWeighing("no")}
                              className={`py-2 px-3 rounded-[8px] border text-[13.5px] font-medium ${
                                weighing === "no"
                                  ? "bg-sarathi-blue-050 border-sarathi-blue text-sarathi-blue font-bold"
                                  : "border-sarathi-line"
                              }`}
                            >
                              No weighing instruments
                            </button>
                          </div>
                        </div>
                      )}

                      {isPharmacy && (
                        <div>
                          <div className="font-semibold text-[14px] text-sarathi-ink mb-2">
                            Will you stock, dispense, or distribute pharmaceutical medicines?
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              type="button"
                              onClick={() => setDrugs("yes")}
                              className={`py-2 px-3 rounded-[8px] border text-[13.5px] font-medium ${
                                drugs === "yes"
                                  ? "bg-sarathi-blue-050 border-sarathi-blue text-sarathi-blue font-bold"
                                  : "border-sarathi-line"
                              }`}
                            >
                              Yes, pharmaceuticals (Drug Licence Form 20/21)
                            </button>
                            <button
                              type="button"
                              onClick={() => setDrugs("no")}
                              className={`py-2 px-3 rounded-[8px] border text-[13.5px] font-medium ${
                                drugs === "no"
                                  ? "bg-sarathi-blue-050 border-sarathi-blue text-sarathi-blue font-bold"
                                  : "border-sarathi-line"
                              }`}
                            >
                              Non-drug items only
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Special universal questions */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-[10px] bg-white border border-sarathi-line">
                      <div className="font-semibold text-[13.5px] text-sarathi-ink mb-2">
                        Will you serve or sell alcoholic beverages?
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setAlcohol("yes")}
                          className={`py-1.5 px-2 rounded-[6px] border text-[13px] ${
                            alcohol === "yes"
                              ? "bg-sarathi-blue-050 border-sarathi-blue text-sarathi-blue font-bold"
                              : "border-sarathi-line"
                          }`}
                        >
                          Yes (Excise Licence)
                        </button>
                        <button
                          type="button"
                          onClick={() => setAlcohol("no")}
                          className={`py-1.5 px-2 rounded-[6px] border text-[13px] ${
                            alcohol === "no"
                              ? "bg-sarathi-blue-050 border-sarathi-blue text-sarathi-blue font-bold"
                              : "border-sarathi-line"
                          }`}
                        >
                          No
                        </button>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-[10px] bg-white border border-sarathi-line">
                      <div className="font-semibold text-[13.5px] text-sarathi-ink mb-2">
                        Seeking DPIIT Startup India Recognition?
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setIsStartup("yes")}
                          className={`py-1.5 px-2 rounded-[6px] border text-[13px] ${
                            isStartup === "yes"
                              ? "bg-sarathi-blue-050 border-sarathi-blue text-sarathi-blue font-bold"
                              : "border-sarathi-line"
                          }`}
                        >
                          Yes (Startup India)
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsStartup("no")}
                          className={`py-1.5 px-2 rounded-[6px] border text-[13px] ${
                            isStartup === "no"
                              ? "bg-sarathi-blue-050 border-sarathi-blue text-sarathi-blue font-bold"
                              : "border-sarathi-line"
                          }`}
                        >
                          No
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div className="pt-5 border-t border-sarathi-line flex justify-between items-center">
                  <button
                    onClick={() => {
                      setStep(1);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="text-sarathi-blue hover:text-sarathi-blue-700 font-semibold px-2 py-2 text-[14.5px] transition-colors"
                  >
                    &larr; Back to Step 1
                  </button>

                  <button
                    onClick={() => {
                      const selectedActivityDef = ACTIVITY_OPTIONS.find((a) => a.id === activity);
                      const profile = {
                        description: description || selectedActivityDef?.label || "Commercial Enterprise",
                        businessLabel: selectedActivityDef?.label || "Commercial Enterprise",
                        legalStructure,
                        businessActivity: activity,
                        sector: selectedActivityDef?.defaultSector || "services",
                        state: stateName,
                        city: city || "Hyderabad",
                        jurisdictionType,
                        premisesType,
                        hasPhysicalPremises: premisesType !== "home_office",
                        premises: premisesOwnership,
                        investmentLakh: Number(investment) || 0,
                        annualTurnoverLakh: Number(turnover) || 0,
                        workers: Number(workers) || 0,
                        usesPower: power === "yes",
                        handlesFood: food === "yes",
                        servesAlcohol: alcohol === "yes",
                        handlesDrugs: drugs === "yes",
                        usesWeighingInstruments: weighing === "yes",
                        usesGroundwater: groundwater === "yes",
                        waterEffluentDischarge: effluents === "yes",
                        isStartup: isStartup === "yes",
                        // Backward compatibility aliases
                        entityType:
                          legalStructure === "private_limited" || legalStructure === "public_limited" || legalStructure === "opc"
                            ? "company"
                            : legalStructure === "partnership" || legalStructure === "llp"
                            ? "partnership"
                            : "proprietor",
                        isManufacturing: isMfg,
                      };

                      sessionStorage.setItem("sarathi_profile", JSON.stringify(profile));
                      router.push("/checklist");
                    }}
                    className="inline-flex items-center justify-center gap-2 bg-sarathi-blue hover:bg-sarathi-blue-700 text-white font-semibold text-[15px] h-[48px] px-8 rounded-[8px] transition-colors shadow-sm"
                  >
                    Generate Dynamic Checklist &rarr;
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
