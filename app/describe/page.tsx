"use client";

import { useState, useEffect } from "react";
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
  Sparkles,
} from "lucide-react";
import type { BusinessActivity, LegalStructure, JurisdictionType, Sector } from "@/lib/types";
import { classifyMsme } from "@/lib/rules-engine";

export const ACTIVITY_OPTIONS: {
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

export const JURISDICTION_OPTIONS_BY_STATE: Record<string, { value: JurisdictionType; label: string }[]> = {
  telangana: [
    { value: "ghmc", label: "Greater Hyderabad Municipal Corporation (GHMC)" },
    { value: "municipality", label: "Urban Municipality (CDMA)" },
    { value: "panchayat", label: "Rural Gram Panchayat" },
    { value: "industrial_area", label: "Industrial Area (TSIIC)" },
  ],
  maharashtra: [
    { value: "ghmc", label: "Municipal Corporation (BMC / MCGM / PMC)" },
    { value: "municipality", label: "Urban Municipality / Municipal Council" },
    { value: "panchayat", label: "Rural Gram Panchayat" },
    { value: "industrial_area", label: "Industrial Area (MIDC)" },
  ],
  other: [
    { value: "municipality", label: "Municipal Corporation / Urban Local Body (ULB)" },
    { value: "panchayat", label: "Rural Gram Panchayat" },
    { value: "industrial_area", label: "Industrial Development Area (SIDC)" },
  ],
};

const FIELD_ELEMENT_IDS: Record<string, string> = {
  activity: "activity-section",
  legalStructure: "legalStructure-trigger",
  stateName: "state-trigger",
  city: "city-input",
  jurisdictionType: "jurisdiction-trigger",
  premisesType: "premises-section",
  investment: "investment-input",
  turnover: "turnover-input",
  workers: "workers-input",
  food: "food-section",
  dineIn: "dineIn-section",
  power: "power-section",
  groundwater: "groundwater-section",
  effluents: "effluents-section",
  weighing: "weighing-section",
  drugs: "drugs-section",
  alcohol: "alcohol-section",
  isStartup: "isStartup-section",
};

export function validateStep1Form(values: {
  activity: BusinessActivity | null;
  legalStructure: LegalStructure | "";
  stateName: string;
  city: string;
  jurisdictionType: JurisdictionType | "";
  premisesType: "commercial" | "industrial" | "home_office" | null;
}): Record<string, string> {
  const errs: Record<string, string> = {};
  if (!values.activity) {
    errs.activity = "Please select a primary business activity";
  }
  if (!values.legalStructure) {
    errs.legalStructure = "Please select a legal structure";
  }
  if (!values.stateName) {
    errs.stateName = "Please select a state";
  }
  if (!values.city || values.city.trim().length === 0) {
    errs.city = "Enter your city or area";
  } else if (values.city.trim().length < 2) {
    errs.city = "City or area must be at least 2 characters";
  }
  if (!values.jurisdictionType) {
    errs.jurisdictionType = "Please select a local authority jurisdiction";
  }
  if (!values.premisesType) {
    errs.premisesType = "Please select a premises setup";
  }
  return errs;
}

export function validateStep2Form(values: {
  investment: string;
  turnover: string;
  workers: string;
  activity: BusinessActivity | null;
  food: "yes" | "no" | null;
  dineIn: "yes" | "no" | null;
  power: "yes" | "no" | null;
  groundwater: "yes" | "no" | null;
  effluents: "yes" | "no" | null;
  weighing: "yes" | "no" | null;
  drugs: "yes" | "no" | null;
  alcohol: "yes" | "no" | null;
  isStartup: "yes" | "no" | null;
}): Record<string, string> {
  const errs: Record<string, string> = {};

  const isMfg = values.activity === "manufacturing" || values.activity === "food_processing";
  const isFoodRelated = values.activity === "food_service" || values.activity === "food_processing";
  const isRetail = values.activity === "retail";
  const isPharmacy = values.activity === "pharmacy";

  // Numbers validation
  if (values.investment.trim() === "") {
    errs.investment = "Enter investment in plant/machinery";
  } else if (isNaN(Number(values.investment)) || Number(values.investment) < 0) {
    errs.investment = "Investment must be a valid number (0 or higher)";
  }

  if (values.turnover.trim() === "") {
    errs.turnover = "Enter estimated annual turnover";
  } else if (isNaN(Number(values.turnover)) || Number(values.turnover) < 0) {
    errs.turnover = "Turnover must be a valid number (0 or higher)";
  }

  if (values.workers.trim() === "") {
    errs.workers = "Enter number of employees";
  } else if (isNaN(Number(values.workers)) || Number(values.workers) < 0 || !Number.isInteger(Number(values.workers))) {
    errs.workers = "Employees must be a whole number (0 or higher)";
  }

  // Dynamic compliance questions
  if (isFoodRelated && values.food === null) {
    errs.food = "Please answer whether food items are involved";
  }
  if (values.activity === "food_service" && values.dineIn === null) {
    errs.dineIn = "Please answer whether your premises will offer dine-in seating";
  }
  if (isMfg) {
    if (values.power === null) {
      errs.power = "Please answer whether the factory will use electric power";
    }
    if (values.groundwater === null) {
      errs.groundwater = "Please answer whether groundwater will be extracted";
    }
    if (values.effluents === null) {
      errs.effluents = "Please answer whether manufacturing generates effluents/emissions";
    }
  }
  if (isRetail && values.weighing === null) {
    errs.weighing = "Please answer whether weighing instruments will be used";
  }
  if (isPharmacy && values.drugs === null) {
    errs.drugs = "Please answer whether pharmaceutical medicines will be stocked";
  }

  // Universal questions
  if (values.alcohol === null) {
    errs.alcohol = "Please answer whether alcoholic beverages will be served or sold";
  }
  if (values.isStartup === null) {
    errs.isStartup = "Please answer whether seeking DPIIT Startup India recognition";
  }

  return errs;
}

export default function DescribePage() {
  const [step, setStep] = useState(1);
  const router = useRouter();

  // Step 1: Core Profile (starts empty)
  const [activity, setActivity] = useState<BusinessActivity | null>(null);
  const [legalStructure, setLegalStructure] = useState<LegalStructure | "">("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState<string>("");
  const [jurisdictionType, setJurisdictionType] = useState<JurisdictionType | "">("");
  const [premisesType, setPremisesType] = useState<"commercial" | "industrial" | "home_office" | null>(null);

  // Step 2: Scale & Adaptive Specifics (starts empty)
  const [investment, setInvestment] = useState("");
  const [turnover, setTurnover] = useState("");
  const [workers, setWorkers] = useState("");
  const [premisesOwnership, setPremisesOwnership] = useState<"rented" | "owned">("rented");

  // Adaptive compliance questions (all start null / unanswered)
  const [power, setPower] = useState<"yes" | "no" | null>(null);
  const [food, setFood] = useState<"yes" | "no" | null>(null);
  const [dineIn, setDineIn] = useState<"yes" | "no" | null>(null);
  const [groundwater, setGroundwater] = useState<"yes" | "no" | null>(null);
  const [effluents, setEffluents] = useState<"yes" | "no" | null>(null);
  const [weighing, setWeighing] = useState<"yes" | "no" | null>(null);
  const [drugs, setDrugs] = useState<"yes" | "no" | null>(null);
  const [alcohol, setAlcohol] = useState<"yes" | "no" | null>(null);
  const [isStartup, setIsStartup] = useState<"yes" | "no" | null>(null);

  // Validation state tracking
  const [step1Submitted, setStep1Submitted] = useState(false);
  const [step2Submitted, setStep2Submitted] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isMfg = activity === "manufacturing" || activity === "food_processing";
  const isFoodRelated = activity === "food_service" || activity === "food_processing";
  const isRetail = activity === "retail";
  const isPharmacy = activity === "pharmacy";

  const clearError = (field: string) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const updated = { ...prev };
      delete updated[field];
      return updated;
    });
  };

  const markTouched = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    if (field === "city") {
      if (!city || city.trim().length === 0) {
        setErrors((prev) => ({ ...prev, city: "Enter your city or area" }));
      } else if (city.trim().length < 2) {
        setErrors((prev) => ({ ...prev, city: "City or area must be at least 2 characters" }));
      } else {
        clearError("city");
      }
    } else if (field === "investment") {
      if (investment.trim() === "") {
        setErrors((prev) => ({ ...prev, investment: "Enter investment in plant/machinery" }));
      } else if (isNaN(Number(investment)) || Number(investment) < 0) {
        setErrors((prev) => ({ ...prev, investment: "Investment must be a valid number (0 or higher)" }));
      } else {
        clearError("investment");
      }
    } else if (field === "turnover") {
      if (turnover.trim() === "") {
        setErrors((prev) => ({ ...prev, turnover: "Enter estimated annual turnover" }));
      } else if (isNaN(Number(turnover)) || Number(turnover) < 0) {
        setErrors((prev) => ({ ...prev, turnover: "Turnover must be a valid number (0 or higher)" }));
      } else {
        clearError("turnover");
      }
    } else if (field === "workers") {
      if (workers.trim() === "") {
        setErrors((prev) => ({ ...prev, workers: "Enter number of employees" }));
      } else if (isNaN(Number(workers)) || Number(workers) < 0 || !Number.isInteger(Number(workers))) {
        setErrors((prev) => ({ ...prev, workers: "Employees must be a whole number (0 or higher)" }));
      } else {
        clearError("workers");
      }
    }
  };

  const hasError = (field: string): boolean => {
    if (!errors[field]) return false;
    if (step === 1) {
      return step1Submitted || !!touched[field];
    }
    if (step === 2) {
      return step2Submitted || !!touched[field];
    }
    return false;
  };

  // When activity changes, clear dynamic questions from previous type
  const handleActivitySelect = (act: BusinessActivity) => {
    setActivity(act);
    clearError("activity");

    setFood(null);
    setDineIn(null);
    setPower(null);
    setGroundwater(null);
    setEffluents(null);
    setWeighing(null);
    setDrugs(null);

    setErrors((prev) => {
      const next = { ...prev };
      delete next.activity;
      delete next.food;
      delete next.dineIn;
      delete next.power;
      delete next.groundwater;
      delete next.effluents;
      delete next.weighing;
      delete next.drugs;
      return next;
    });
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

  const handleSubmit = () => {
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
        "alcohol",
        "isStartup",
      ];
      const firstField = order.find((k) => !!errs[k]);
      if (firstField) {
        scrollToAndFocus(firstField);
      }
      return;
    }

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
          <Link href="/" className="hover:text-sarathi-blue transition-colors">Home</Link>
          <span className="text-sarathi-faint">›</span>
          <span>New approval journey</span>
        </div>

        <Card className="border-sarathi-line shadow-[0_1px_2px_rgba(16,42,79,.08)] rounded-[14px] overflow-hidden bg-white">
          {/* Top Progress bar */}
          <div className="bg-sarathi-page border-b border-sarathi-line px-8 py-3.5 flex items-center justify-between text-[13px]">
            <div className="flex items-center gap-2 font-semibold text-sarathi-blue">
              <span className="w-6 h-6 rounded-full bg-sarathi-blue text-white flex items-center justify-center text-[12px] font-bold">
                {step}
              </span>
              Step {step} of 2: {step === 1 ? "Business Constitution & Location" : "Scale & Operational Rules"}
            </div>
            <span className="text-sarathi-muted">Dynamic Rule Evaluator</span>
          </div>

          <CardContent className="p-8 md:p-9">
            {step === 1 ? (
              <div className="space-y-7">
                <div>
                  <h2 className="font-serif text-[26px] font-bold text-sarathi-ink mb-1.5 tracking-[-0.2px]">
                    What type of business are you starting?
                  </h2>
                  <p className="text-[15px] text-sarathi-muted">
                    Approvals in India depend on your business activity, legal structure, and jurisdiction.
                  </p>
                </div>

                {/* 1. Activity Grid */}
                <div id="activity-section" tabIndex={-1} className="outline-none space-y-2.5">
                  <label className="font-semibold text-[14px] text-sarathi-ink block">
                    1. Primary Business Activity <span className="text-red-500" aria-hidden="true">*</span>
                  </label>
                  <div
                    role="radiogroup"
                    aria-required="true"
                    aria-invalid={hasError("activity")}
                    aria-describedby={hasError("activity") ? "activity-error" : undefined}
                    className={`grid grid-cols-1 sm:grid-cols-2 gap-3 p-1 rounded-[12px] transition-all ${
                      hasError("activity") ? "border border-red-500 ring-1 ring-red-500 bg-red-50/20" : ""
                    }`}
                  >
                    {ACTIVITY_OPTIONS.map((opt) => {
                      const Icon = opt.icon;
                      const isSelected = activity === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          onClick={() => handleActivitySelect(opt.id)}
                          className={`p-3.5 rounded-[10px] border-[1.5px] cursor-pointer transition-all flex items-start gap-3 text-left ${
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
                        </button>
                      );
                    })}
                  </div>
                  {hasError("activity") && (
                    <p id="activity-error" role="alert" className="text-[12.5px] text-red-600 font-medium">
                      {errors.activity}
                    </p>
                  )}
                </div>

                {/* 2. Legal Constitution */}
                <div className="space-y-2">
                  <label className="font-semibold text-[14px] text-sarathi-ink block">
                    2. Legal Constitution / Structure <span className="text-red-500" aria-hidden="true">*</span>
                  </label>
                  <Select
                    value={legalStructure || undefined}
                    onValueChange={(v) => {
                      setLegalStructure((v || "") as LegalStructure);
                      clearError("legalStructure");
                    }}
                  >
                    <SelectTrigger
                      id="legalStructure-trigger"
                      aria-required="true"
                      aria-invalid={hasError("legalStructure")}
                      aria-describedby={hasError("legalStructure") ? "legalStructure-error" : undefined}
                      className={`h-[46px] border-[1.5px] rounded-[8px] bg-white px-3.5 text-[15px] focus:ring-0 transition-all ${
                        hasError("legalStructure")
                          ? "border-red-500 focus:border-red-500 ring-1 ring-red-500"
                          : "border-sarathi-line-strong focus:border-sarathi-blue"
                      }`}
                    >
                      <SelectValue placeholder="Select legal structure" />
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
                  {hasError("legalStructure") ? (
                    <p id="legalStructure-error" role="alert" className="text-[12.5px] text-red-600 font-medium">
                      {errors.legalStructure}
                    </p>
                  ) : (
                    <p className="text-[12px] text-sarathi-faint">
                      Determines corporate incorporation (MCA SPICe+), partnership deeds, or individual tax registrations.
                    </p>
                  )}
                </div>

                {/* Location & Jurisdiction */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* State */}
                  <div className="space-y-1.5">
                    <label className="font-semibold text-[13.5px] text-sarathi-ink block">
                      State <span className="text-red-500" aria-hidden="true">*</span>
                    </label>
                    <Select
                      value={stateName || undefined}
                      onValueChange={handleStateChange}
                    >
                      <SelectTrigger
                        id="state-trigger"
                        aria-required="true"
                        aria-invalid={hasError("stateName")}
                        aria-describedby={hasError("stateName") ? "stateName-error" : undefined}
                        className={`h-[44px] border-[1.5px] rounded-[8px] bg-white px-3.5 text-[14px] ${
                          hasError("stateName")
                            ? "border-red-500 ring-1 ring-red-500"
                            : "border-sarathi-line-strong"
                        }`}
                      >
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="telangana">Telangana</SelectItem>
                        <SelectItem value="maharashtra">Maharashtra</SelectItem>
                        <SelectItem value="other">Other State</SelectItem>
                      </SelectContent>
                    </Select>
                    {hasError("stateName") && (
                      <p id="stateName-error" role="alert" className="text-[12.5px] text-red-600 font-medium">
                        {errors.stateName}
                      </p>
                    )}
                  </div>

                  {/* City / Area */}
                  <div className="space-y-1.5">
                    <label className="font-semibold text-[13.5px] text-sarathi-ink block">
                      City / Area <span className="text-red-500" aria-hidden="true">*</span>
                    </label>
                    <Input
                      id="city-input"
                      placeholder="e.g. Hyderabad, Ghatkesar"
                      aria-required="true"
                      aria-invalid={hasError("city")}
                      aria-describedby={hasError("city") ? "city-error" : undefined}
                      className={`h-[44px] border-[1.5px] rounded-[8px] bg-white px-3.5 text-[14px] ${
                        hasError("city")
                          ? "border-red-500 ring-1 ring-red-500 focus:border-red-500"
                          : "border-sarathi-line-strong"
                      }`}
                      value={city}
                      onChange={(e) => {
                        setCity(e.target.value);
                        if (e.target.value.trim().length >= 2) {
                          clearError("city");
                        }
                      }}
                      onBlur={() => markTouched("city")}
                    />
                    {hasError("city") && (
                      <p id="city-error" role="alert" className="text-[12.5px] text-red-600 font-medium">
                        {errors.city}
                      </p>
                    )}
                  </div>

                  {/* Local Authority Jurisdiction */}
                  <div className="space-y-1.5">
                    <label className="font-semibold text-[13.5px] text-sarathi-ink block">
                      Local Authority Jurisdiction <span className="text-red-500" aria-hidden="true">*</span>
                    </label>
                    <Select
                      value={jurisdictionType || undefined}
                      disabled={!stateName}
                      onValueChange={(v) => {
                        setJurisdictionType((v || "") as JurisdictionType);
                        clearError("jurisdictionType");
                      }}
                    >
                      <SelectTrigger
                        id="jurisdiction-trigger"
                        aria-required="true"
                        aria-invalid={hasError("jurisdictionType")}
                        aria-describedby={hasError("jurisdictionType") ? "jurisdictionType-error" : undefined}
                        className={`h-[44px] border-[1.5px] rounded-[8px] bg-white px-3.5 text-[14px] ${
                          hasError("jurisdictionType")
                            ? "border-red-500 ring-1 ring-red-500"
                            : "border-sarathi-line-strong"
                        }`}
                      >
                        <SelectValue placeholder="Select authority" />
                      </SelectTrigger>
                      <SelectContent>
                        {(JURISDICTION_OPTIONS_BY_STATE[stateName] || []).map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {hasError("jurisdictionType") && (
                      <p id="jurisdictionType-error" role="alert" className="text-[12.5px] text-red-600 font-medium">
                        {errors.jurisdictionType}
                      </p>
                    )}
                  </div>
                </div>

                {/* Premises Type */}
                <div id="premises-section" tabIndex={-1} className="outline-none space-y-2">
                  <label className="font-semibold text-[14px] text-sarathi-ink block">
                    Premises Setup <span className="text-red-500" aria-hidden="true">*</span>
                  </label>
                  <div
                    role="radiogroup"
                    aria-required="true"
                    aria-invalid={hasError("premisesType")}
                    aria-describedby={hasError("premisesType") ? "premisesType-error" : undefined}
                    className={`grid grid-cols-1 md:grid-cols-3 gap-3 p-1 rounded-[10px] transition-all ${
                      hasError("premisesType") ? "border border-red-500 ring-1 ring-red-500 bg-red-50/20" : ""
                    }`}
                  >
                    {[
                      { id: "commercial", label: "Commercial Premises", note: "Office, Retail Shop, Restaurant" },
                      { id: "industrial", label: "Industrial Factory / Shed", note: "Manufacturing floor or plant" },
                      { id: "home_office", label: "Home Office / Virtual", note: "Remote digital or consulting" },
                    ].map((p) => {
                      const isSelected = premisesType === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          onClick={() => {
                            setPremisesType(p.id as any);
                            clearError("premisesType");
                          }}
                          className={`p-3 rounded-[8px] border-[1.5px] cursor-pointer transition-all text-left ${
                            isSelected
                              ? "border-sarathi-blue bg-sarathi-blue-050 font-medium"
                              : "border-sarathi-line hover:border-sarathi-line-strong"
                          }`}
                        >
                          <div className="text-[14px] font-semibold text-sarathi-ink">{p.label}</div>
                          <div className="text-[11.5px] text-sarathi-muted mt-0.5">{p.note}</div>
                        </button>
                      );
                    })}
                  </div>
                  {hasError("premisesType") && (
                    <p id="premisesType-error" role="alert" className="text-[12.5px] text-red-600 font-medium">
                      {errors.premisesType}
                    </p>
                  )}
                </div>

                {/* Business Description */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-[14px] text-sarathi-ink block">
                    Business Summary / Name (Optional)
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
                    type="button"
                    onClick={handleStep1Continue}
                    className="inline-flex items-center justify-center gap-2 bg-sarathi-blue hover:bg-sarathi-blue-700 text-white font-semibold text-[15px] h-[46px] px-7 rounded-[8px] transition-colors shadow-sm cursor-pointer"
                  >
                    Continue to Specifics &rarr;
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-7">
                <div>
                  <h2 className="font-serif text-[26px] font-bold text-sarathi-ink mb-1.5 tracking-[-0.2px]">
                    Tailored details for your {ACTIVITY_OPTIONS.find((a) => a.id === activity)?.label || "Business"}
                  </h2>
                  <p className="text-[15px] text-sarathi-muted">
                    We adapt the questionnaire based on your business type to ask only what regulatory statutes require.
                  </p>
                </div>

                {/* Scale: Investment, Turnover & Workers */}
                <div className="p-4 rounded-[10px] bg-slate-50 border border-sarathi-line space-y-4">
                  <div className="font-bold text-[14px] text-sarathi-ink flex items-center justify-between">
                    <span>Business Scale & Workforce</span>
                    {msmeTier ? (
                      <span className="text-[12.5px] font-semibold text-sarathi-blue bg-sarathi-blue-050 border border-sarathi-blue-100 px-2.5 py-0.5 rounded-full">
                        Classified: {msmeTier} MSME
                      </span>
                    ) : (
                      <span className="text-[12.5px] font-medium text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">
                        Enter values to classify
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Investment */}
                    <div className="space-y-1">
                      <label className="text-[13px] font-semibold text-sarathi-ink block">
                        Investment in Plant/Machinery <span className="text-red-500" aria-hidden="true">*</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sarathi-blue">₹</span>
                        <Input
                          id="investment-input"
                          type="number"
                          value={investment}
                          onChange={(e) => {
                            setInvestment(e.target.value);
                            if (e.target.value.trim() !== "" && !isNaN(Number(e.target.value)) && Number(e.target.value) >= 0) {
                              clearError("investment");
                            }
                          }}
                          onBlur={() => markTouched("investment")}
                          aria-required="true"
                          aria-invalid={hasError("investment")}
                          aria-describedby={hasError("investment") ? "investment-error" : undefined}
                          className={`h-[42px] bg-white text-[14px] ${
                            hasError("investment")
                              ? "border-red-500 ring-1 ring-red-500 focus:border-red-500"
                              : "border-sarathi-line-strong"
                          }`}
                          placeholder="e.g. 25"
                        />
                        <span className="text-[12.5px] text-sarathi-muted font-medium">lakh</span>
                      </div>
                      {hasError("investment") && (
                        <p id="investment-error" role="alert" className="text-[12px] text-red-600 font-medium mt-1">
                          {errors.investment}
                        </p>
                      )}
                    </div>

                    {/* Turnover */}
                    <div className="space-y-1">
                      <label className="text-[13px] font-semibold text-sarathi-ink block">
                        Est. Annual Turnover <span className="text-red-500" aria-hidden="true">*</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sarathi-blue">₹</span>
                        <Input
                          id="turnover-input"
                          type="number"
                          value={turnover}
                          onChange={(e) => {
                            setTurnover(e.target.value);
                            if (e.target.value.trim() !== "" && !isNaN(Number(e.target.value)) && Number(e.target.value) >= 0) {
                              clearError("turnover");
                            }
                          }}
                          onBlur={() => markTouched("turnover")}
                          aria-required="true"
                          aria-invalid={hasError("turnover")}
                          aria-describedby={hasError("turnover") ? "turnover-error" : undefined}
                          className={`h-[42px] bg-white text-[14px] ${
                            hasError("turnover")
                              ? "border-red-500 ring-1 ring-red-500 focus:border-red-500"
                              : "border-sarathi-line-strong"
                          }`}
                          placeholder="e.g. 50"
                        />
                        <span className="text-[12.5px] text-sarathi-muted font-medium">lakh</span>
                      </div>
                      {hasError("turnover") && (
                        <p id="turnover-error" role="alert" className="text-[12px] text-red-600 font-medium mt-1">
                          {errors.turnover}
                        </p>
                      )}
                    </div>

                    {/* Employees */}
                    <div className="space-y-1">
                      <label className="text-[13px] font-semibold text-sarathi-ink block">
                        Number of Employees / Workers <span className="text-red-500" aria-hidden="true">*</span>
                      </label>
                      <Input
                        id="workers-input"
                        type="number"
                        value={workers}
                        onChange={(e) => {
                          setWorkers(e.target.value);
                          if (
                            e.target.value.trim() !== "" &&
                            !isNaN(Number(e.target.value)) &&
                            Number(e.target.value) >= 0 &&
                            Number.isInteger(Number(e.target.value))
                          ) {
                            clearError("workers");
                          }
                        }}
                        onBlur={() => markTouched("workers")}
                        aria-required="true"
                        aria-invalid={hasError("workers")}
                        aria-describedby={hasError("workers") ? "workers-error" : undefined}
                        className={`h-[42px] bg-white text-[14px] ${
                          hasError("workers")
                            ? "border-red-500 ring-1 ring-red-500 focus:border-red-500"
                            : "border-sarathi-line-strong"
                        }`}
                        placeholder="e.g. 5"
                      />
                      {hasError("workers") && (
                        <p id="workers-error" role="alert" className="text-[12px] text-red-600 font-medium mt-1">
                          {errors.workers}
                        </p>
                      )}
                    </div>
                  </div>

                  {hasScaleValues && hasValidWorkers ? (
                    <div className="text-[12px] text-sarathi-muted flex flex-wrap gap-4 pt-1">
                      <span>• ESI applies at 10+ employees {workersNum >= 10 && <strong className="text-sarathi-blue font-semibold">(Applies)</strong>}</span>
                      <span>• EPF applies at 20+ employees {workersNum >= 20 && <strong className="text-sarathi-blue font-semibold">(Applies)</strong>}</span>
                      <span>• Factories Act applies at 10+ (with power) {workersNum >= 10 && power === "yes" && <strong className="text-sarathi-blue font-semibold">(Applies)</strong>}</span>
                    </div>
                  ) : (
                    <div className="text-[12px] text-slate-400 italic pt-1">
                      Enter investment, turnover, and employee count to calculate MSME category and statutory thresholds (ESI, EPF, Factories Act).
                    </div>
                  )}
                </div>

                {/* Adaptive Activity Questions */}
                <div className="space-y-5">
                  <div className="font-bold text-[14.5px] text-sarathi-ink border-b border-sarathi-line pb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-sarathi-blue" />
                    Activity-Specific Compliance Triggers
                  </div>

                  {/* Food questions */}
                  {isFoodRelated && (
                    <div
                      id="food-section"
                      tabIndex={-1}
                      className={`space-y-4 p-4 rounded-[10px] bg-white border transition-all ${
                        hasError("food") || (activity === "food_service" && hasError("dineIn"))
                          ? "border-red-500 ring-1 ring-red-500 bg-red-50/10"
                          : "border-sarathi-line"
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-[14px] text-sarathi-ink mb-2">
                          Will you handle, prepare, package, or sell food items? <span className="text-red-500" aria-hidden="true">*</span>
                        </div>
                        <div
                          role="radiogroup"
                          aria-required="true"
                          aria-invalid={hasError("food")}
                          aria-describedby={hasError("food") ? "food-error" : undefined}
                          className="grid grid-cols-2 gap-3"
                        >
                          <button
                            type="button"
                            role="radio"
                            aria-checked={food === "yes"}
                            onClick={() => {
                              setFood("yes");
                              clearError("food");
                            }}
                            className={`py-2 px-3 rounded-[8px] border text-[14px] font-medium transition-all ${
                              food === "yes"
                                ? "bg-sarathi-blue-050 border-sarathi-blue text-sarathi-blue font-bold"
                                : "border-sarathi-line text-sarathi-ink hover:bg-slate-50"
                            }`}
                          >
                            Yes, food items involved (FSSAI)
                          </button>
                          <button
                            type="button"
                            role="radio"
                            aria-checked={food === "no"}
                            onClick={() => {
                              setFood("no");
                              clearError("food");
                            }}
                            className={`py-2 px-3 rounded-[8px] border text-[14px] font-medium transition-all ${
                              food === "no"
                                ? "bg-sarathi-blue-050 border-sarathi-blue text-sarathi-blue font-bold"
                                : "border-sarathi-line text-sarathi-ink hover:bg-slate-50"
                            }`}
                          >
                            No food handling
                          </button>
                        </div>
                        {hasError("food") && (
                          <p id="food-error" role="alert" className="text-[12.5px] text-red-600 mt-1 font-medium">
                            {errors.food}
                          </p>
                        )}
                      </div>

                      {activity === "food_service" && (
                        <div id="dineIn-section" tabIndex={-1} className="pt-3 border-t border-slate-100">
                          <div className="font-semibold text-[13.5px] text-sarathi-ink mb-2">
                            Will your premises offer dine-in seating to customers? <span className="text-red-500" aria-hidden="true">*</span>
                          </div>
                          <div
                            role="radiogroup"
                            aria-required="true"
                            aria-invalid={hasError("dineIn")}
                            aria-describedby={hasError("dineIn") ? "dineIn-error" : undefined}
                            className="grid grid-cols-2 gap-3"
                          >
                            <button
                              type="button"
                              role="radio"
                              aria-checked={dineIn === "yes"}
                              onClick={() => {
                                setDineIn("yes");
                                clearError("dineIn");
                              }}
                              className={`py-2 px-3 rounded-[8px] border text-[13.5px] transition-all ${
                                dineIn === "yes"
                                  ? "bg-sarathi-blue-050 border-sarathi-blue text-sarathi-blue font-bold"
                                  : "border-sarathi-line text-sarathi-ink hover:bg-slate-50"
                              }`}
                            >
                              Yes, Dine-in (Eating House Licence)
                            </button>
                            <button
                              type="button"
                              role="radio"
                              aria-checked={dineIn === "no"}
                              onClick={() => {
                                setDineIn("no");
                                clearError("dineIn");
                              }}
                              className={`py-2 px-3 rounded-[8px] border text-[13.5px] transition-all ${
                                dineIn === "no"
                                  ? "bg-sarathi-blue-050 border-sarathi-blue text-sarathi-blue font-bold"
                                  : "border-sarathi-line text-sarathi-ink hover:bg-slate-50"
                              }`}
                            >
                              Takeaway / Cloud Kitchen only
                            </button>
                          </div>
                          {hasError("dineIn") && (
                            <p id="dineIn-error" role="alert" className="text-[12.5px] text-red-600 mt-1 font-medium">
                              {errors.dineIn}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Manufacturing / Industrial questions */}
                  {isMfg && (
                    <div className="space-y-4 p-4 rounded-[10px] bg-white border border-sarathi-line">
                      <div id="power-section" tabIndex={-1} className={`p-2 rounded-[8px] ${hasError("power") ? "border border-red-500 ring-1 ring-red-500 bg-red-50/10" : ""}`}>
                        <div className="font-semibold text-[14px] text-sarathi-ink mb-2">
                          Will the factory use electric power for machinery? <span className="text-red-500" aria-hidden="true">*</span>
                        </div>
                        <div
                          role="radiogroup"
                          aria-required="true"
                          aria-invalid={hasError("power")}
                          aria-describedby={hasError("power") ? "power-error" : undefined}
                          className="grid grid-cols-2 gap-3"
                        >
                          <button
                            type="button"
                            role="radio"
                            aria-checked={power === "yes"}
                            onClick={() => {
                              setPower("yes");
                              clearError("power");
                            }}
                            className={`py-2 px-3 rounded-[8px] border text-[13.5px] font-medium transition-all ${
                              power === "yes"
                                ? "bg-sarathi-blue-050 border-sarathi-blue text-sarathi-blue font-bold"
                                : "border-sarathi-line hover:bg-slate-50"
                            }`}
                          >
                            Yes, electric power (Factories Act @ 10+)
                          </button>
                          <button
                            type="button"
                            role="radio"
                            aria-checked={power === "no"}
                            onClick={() => {
                              setPower("no");
                              clearError("power");
                            }}
                            className={`py-2 px-3 rounded-[8px] border text-[13.5px] font-medium transition-all ${
                              power === "no"
                                ? "bg-sarathi-blue-050 border-sarathi-blue text-sarathi-blue font-bold"
                                : "border-sarathi-line hover:bg-slate-50"
                            }`}
                          >
                            No power / Manual (Factories Act @ 20+)
                          </button>
                        </div>
                        {hasError("power") && (
                          <p id="power-error" role="alert" className="text-[12.5px] text-red-600 mt-1 font-medium">
                            {errors.power}
                          </p>
                        )}
                      </div>

                      <div id="groundwater-section" tabIndex={-1} className={`p-2 rounded-[8px] ${hasError("groundwater") ? "border border-red-500 ring-1 ring-red-500 bg-red-50/10" : ""}`}>
                        <div className="font-semibold text-[14px] text-sarathi-ink mb-2">
                          Will you extract groundwater from a borewell on the premises? <span className="text-red-500" aria-hidden="true">*</span>
                        </div>
                        <div
                          role="radiogroup"
                          aria-required="true"
                          aria-invalid={hasError("groundwater")}
                          aria-describedby={hasError("groundwater") ? "groundwater-error" : undefined}
                          className="grid grid-cols-2 gap-3"
                        >
                          <button
                            type="button"
                            role="radio"
                            aria-checked={groundwater === "yes"}
                            onClick={() => {
                              setGroundwater("yes");
                              clearError("groundwater");
                            }}
                            className={`py-2 px-3 rounded-[8px] border text-[13.5px] font-medium transition-all ${
                              groundwater === "yes"
                                ? "bg-sarathi-blue-050 border-sarathi-blue text-sarathi-blue font-bold"
                                : "border-sarathi-line hover:bg-slate-50"
                            }`}
                          >
                            Yes, borewell (CGWA / State Ground Water NOC)
                          </button>
                          <button
                            type="button"
                            role="radio"
                            aria-checked={groundwater === "no"}
                            onClick={() => {
                              setGroundwater("no");
                              clearError("groundwater");
                            }}
                            className={`py-2 px-3 rounded-[8px] border text-[13.5px] font-medium transition-all ${
                              groundwater === "no"
                                ? "bg-sarathi-blue-050 border-sarathi-blue text-sarathi-blue font-bold"
                                : "border-sarathi-line hover:bg-slate-50"
                            }`}
                          >
                            No, municipal / tanker water only
                          </button>
                        </div>
                        {hasError("groundwater") && (
                          <p id="groundwater-error" role="alert" className="text-[12.5px] text-red-600 mt-1 font-medium">
                            {errors.groundwater}
                          </p>
                        )}
                      </div>

                      <div id="effluents-section" tabIndex={-1} className={`p-2 rounded-[8px] ${hasError("effluents") ? "border border-red-500 ring-1 ring-red-500 bg-red-50/10" : ""}`}>
                        <div className="font-semibold text-[14px] text-sarathi-ink mb-2">
                          Does your manufacturing generate industrial effluents, emissions, or chemicals? <span className="text-red-500" aria-hidden="true">*</span>
                        </div>
                        <div
                          role="radiogroup"
                          aria-required="true"
                          aria-invalid={hasError("effluents")}
                          aria-describedby={hasError("effluents") ? "effluents-error" : undefined}
                          className="grid grid-cols-2 gap-3"
                        >
                          <button
                            type="button"
                            role="radio"
                            aria-checked={effluents === "yes"}
                            onClick={() => {
                              setEffluents("yes");
                              clearError("effluents");
                            }}
                            className={`py-2 px-3 rounded-[8px] border text-[13.5px] font-medium transition-all ${
                              effluents === "yes"
                                ? "bg-sarathi-blue-050 border-sarathi-blue text-sarathi-blue font-bold"
                                : "border-sarathi-line hover:bg-slate-50"
                            }`}
                          >
                            Yes (Orange / Red Category PCB Consents)
                          </button>
                          <button
                            type="button"
                            role="radio"
                            aria-checked={effluents === "no"}
                            onClick={() => {
                              setEffluents("no");
                              clearError("effluents");
                            }}
                            className={`py-2 px-3 rounded-[8px] border text-[13.5px] font-medium transition-all ${
                              effluents === "no"
                                ? "bg-sarathi-blue-050 border-sarathi-blue text-sarathi-blue font-bold"
                                : "border-sarathi-line hover:bg-slate-50"
                            }`}
                          >
                            No significant discharge (Green / White)
                          </button>
                        </div>
                        {hasError("effluents") && (
                          <p id="effluents-error" role="alert" className="text-[12.5px] text-red-600 mt-1 font-medium">
                            {errors.effluents}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Retail & Pharmacy Questions */}
                  {(isRetail || isPharmacy) && (
                    <div className="space-y-4 p-4 rounded-[10px] bg-white border border-sarathi-line">
                      {isRetail && (
                        <div id="weighing-section" tabIndex={-1} className={`p-2 rounded-[8px] ${hasError("weighing") ? "border border-red-500 ring-1 ring-red-500 bg-red-50/10" : ""}`}>
                          <div className="font-semibold text-[14px] text-sarathi-ink mb-2">
                            Will you sell goods by weight or measurement, or use weighing instruments? <span className="text-red-500" aria-hidden="true">*</span>
                          </div>
                          <div
                            role="radiogroup"
                            aria-required="true"
                            aria-invalid={hasError("weighing")}
                            aria-describedby={hasError("weighing") ? "weighing-error" : undefined}
                            className="grid grid-cols-2 gap-3"
                          >
                            <button
                              type="button"
                              role="radio"
                              aria-checked={weighing === "yes"}
                              onClick={() => {
                                setWeighing("yes");
                                clearError("weighing");
                              }}
                              className={`py-2 px-3 rounded-[8px] border text-[13.5px] font-medium transition-all ${
                                weighing === "yes"
                                  ? "bg-sarathi-blue-050 border-sarathi-blue text-sarathi-blue font-bold"
                                  : "border-sarathi-line hover:bg-slate-50"
                              }`}
                            >
                              Yes (Legal Metrology Stamping)
                            </button>
                            <button
                              type="button"
                              role="radio"
                              aria-checked={weighing === "no"}
                              onClick={() => {
                                setWeighing("no");
                                clearError("weighing");
                              }}
                              className={`py-2 px-3 rounded-[8px] border text-[13.5px] font-medium transition-all ${
                                weighing === "no"
                                  ? "bg-sarathi-blue-050 border-sarathi-blue text-sarathi-blue font-bold"
                                  : "border-sarathi-line hover:bg-slate-50"
                              }`}
                            >
                              No weighing instruments
                            </button>
                          </div>
                          {hasError("weighing") && (
                            <p id="weighing-error" role="alert" className="text-[12.5px] text-red-600 mt-1 font-medium">
                              {errors.weighing}
                            </p>
                          )}
                        </div>
                      )}

                      {isPharmacy && (
                        <div id="drugs-section" tabIndex={-1} className={`p-2 rounded-[8px] ${hasError("drugs") ? "border border-red-500 ring-1 ring-red-500 bg-red-50/10" : ""}`}>
                          <div className="font-semibold text-[14px] text-sarathi-ink mb-2">
                            Will you stock, dispense, or distribute pharmaceutical medicines? <span className="text-red-500" aria-hidden="true">*</span>
                          </div>
                          <div
                            role="radiogroup"
                            aria-required="true"
                            aria-invalid={hasError("drugs")}
                            aria-describedby={hasError("drugs") ? "drugs-error" : undefined}
                            className="grid grid-cols-2 gap-3"
                          >
                            <button
                              type="button"
                              role="radio"
                              aria-checked={drugs === "yes"}
                              onClick={() => {
                                setDrugs("yes");
                                clearError("drugs");
                              }}
                              className={`py-2 px-3 rounded-[8px] border text-[13.5px] font-medium transition-all ${
                                drugs === "yes"
                                  ? "bg-sarathi-blue-050 border-sarathi-blue text-sarathi-blue font-bold"
                                  : "border-sarathi-line hover:bg-slate-50"
                              }`}
                            >
                              Yes, pharmaceuticals (Drug Licence Form 20/21)
                            </button>
                            <button
                              type="button"
                              role="radio"
                              aria-checked={drugs === "no"}
                              onClick={() => {
                                setDrugs("no");
                                clearError("drugs");
                              }}
                              className={`py-2 px-3 rounded-[8px] border text-[13.5px] font-medium transition-all ${
                                drugs === "no"
                                  ? "bg-sarathi-blue-050 border-sarathi-blue text-sarathi-blue font-bold"
                                  : "border-sarathi-line hover:bg-slate-50"
                              }`}
                            >
                              Non-drug items only
                            </button>
                          </div>
                          {hasError("drugs") && (
                            <p id="drugs-error" role="alert" className="text-[12.5px] text-red-600 mt-1 font-medium">
                              {errors.drugs}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Universal questions: Alcohol & Startup */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div
                      id="alcohol-section"
                      tabIndex={-1}
                      className={`p-3.5 rounded-[10px] bg-white border transition-all ${
                        hasError("alcohol") ? "border-red-500 ring-1 ring-red-500 bg-red-50/10" : "border-sarathi-line"
                      }`}
                    >
                      <div className="font-semibold text-[13.5px] text-sarathi-ink mb-2">
                        Will you serve or sell alcoholic beverages? <span className="text-red-500" aria-hidden="true">*</span>
                      </div>
                      <div
                        role="radiogroup"
                        aria-required="true"
                        aria-invalid={hasError("alcohol")}
                        aria-describedby={hasError("alcohol") ? "alcohol-error" : undefined}
                        className="grid grid-cols-2 gap-2"
                      >
                        <button
                          type="button"
                          role="radio"
                          aria-checked={alcohol === "yes"}
                          onClick={() => {
                            setAlcohol("yes");
                            clearError("alcohol");
                          }}
                          className={`py-1.5 px-2 rounded-[6px] border text-[13px] font-medium transition-all ${
                            alcohol === "yes"
                              ? "bg-sarathi-blue-050 border-sarathi-blue text-sarathi-blue font-bold"
                              : "border-sarathi-line hover:bg-slate-50"
                          }`}
                        >
                          Yes (Excise Licence)
                        </button>
                        <button
                          type="button"
                          role="radio"
                          aria-checked={alcohol === "no"}
                          onClick={() => {
                            setAlcohol("no");
                            clearError("alcohol");
                          }}
                          className={`py-1.5 px-2 rounded-[6px] border text-[13px] font-medium transition-all ${
                            alcohol === "no"
                              ? "bg-sarathi-blue-050 border-sarathi-blue text-sarathi-blue font-bold"
                              : "border-sarathi-line hover:bg-slate-50"
                          }`}
                        >
                          No
                        </button>
                      </div>
                      {hasError("alcohol") && (
                        <p id="alcohol-error" role="alert" className="text-[12.5px] text-red-600 mt-1 font-medium">
                          {errors.alcohol}
                        </p>
                      )}
                    </div>

                    <div
                      id="isStartup-section"
                      tabIndex={-1}
                      className={`p-3.5 rounded-[10px] bg-white border transition-all ${
                        hasError("isStartup") ? "border-red-500 ring-1 ring-red-500 bg-red-50/10" : "border-sarathi-line"
                      }`}
                    >
                      <div className="font-semibold text-[13.5px] text-sarathi-ink mb-2">
                        Seeking DPIIT Startup India Recognition? <span className="text-red-500" aria-hidden="true">*</span>
                      </div>
                      <div
                        role="radiogroup"
                        aria-required="true"
                        aria-invalid={hasError("isStartup")}
                        aria-describedby={hasError("isStartup") ? "isStartup-error" : undefined}
                        className="grid grid-cols-2 gap-2"
                      >
                        <button
                          type="button"
                          role="radio"
                          aria-checked={isStartup === "yes"}
                          onClick={() => {
                            setIsStartup("yes");
                            clearError("isStartup");
                          }}
                          className={`py-1.5 px-2 rounded-[6px] border text-[13px] font-medium transition-all ${
                            isStartup === "yes"
                              ? "bg-sarathi-blue-050 border-sarathi-blue text-sarathi-blue font-bold"
                              : "border-sarathi-line hover:bg-slate-50"
                          }`}
                        >
                          Yes (Startup India)
                        </button>
                        <button
                          type="button"
                          role="radio"
                          aria-checked={isStartup === "no"}
                          onClick={() => {
                            setIsStartup("no");
                            clearError("isStartup");
                          }}
                          className={`py-1.5 px-2 rounded-[6px] border text-[13px] font-medium transition-all ${
                            isStartup === "no"
                              ? "bg-sarathi-blue-050 border-sarathi-blue text-sarathi-blue font-bold"
                              : "border-sarathi-line hover:bg-slate-50"
                          }`}
                        >
                          No
                        </button>
                      </div>
                      {hasError("isStartup") && (
                        <p id="isStartup-error" role="alert" className="text-[12.5px] text-red-600 mt-1 font-medium">
                          {errors.isStartup}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div className="pt-5 border-t border-sarathi-line flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="text-sarathi-blue hover:text-sarathi-blue-700 font-semibold px-2 py-2 text-[14.5px] transition-colors cursor-pointer"
                  >
                    &larr; Back to Step 1
                  </button>

                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="inline-flex items-center justify-center gap-2 bg-sarathi-blue hover:bg-sarathi-blue-700 text-white font-semibold text-[15px] h-[48px] px-8 rounded-[8px] transition-colors shadow-sm cursor-pointer"
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
