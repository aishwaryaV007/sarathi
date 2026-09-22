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

const SCHEME_TRANSLATIONS: Record<string, Record<string, any>> = {
  hi: {
    pmegp: { name: "प्रधानमंत्री रोजगार सृजन कार्यक्रम (PMEGP)", dept: "MSME मंत्रालय, भारत सरकार", desc: "नए सूक्ष्म-उद्यमों की स्थापना के माध्यम से रोजगार पैदा करने के लिए क्रेडिट-लिंक्ड सब्सिडी कार्यक्रम।", subsidy: "15% - 35% पूंजीगत सब्सिडी", max: "₹50 लाख (Mfg) / ₹20 लाख (Services)" },
    cgtmse: { name: "सूक्ष्म और लघु उद्यमों के लिए क्रेडिट गारंटी फंड ट्रस्ट (CGTMSE)", dept: "MSME मंत्रालय और SIDBI", desc: "वाणिज्यिक अनुसूचित बैंकों के माध्यम से नए और मौजूदा सूक्ष्म और लघु उद्यमों के लिए ₹5 करोड़ तक की संपार्श्विक-मुक्त ऋण सुविधा।", subsidy: "संपार्श्विक-मुक्त क्रेडिट गारंटी", max: "₹500 लाख तक" },
    standup: { name: "स्टैंड-अप इंडिया योजना", dept: "वित्तीय सेवा विभाग, वित्त मंत्रालय", desc: "हर बैंक शाखा में कम से कम एक SC/ST और एक महिला उद्यमी को ₹10 लाख से ₹1 करोड़ के बीच कम्पोजिट बैंक ऋण।", subsidy: "कम्पोजिट बैंक ऋण (टर्म + WC)", max: "₹10 लाख - ₹100 लाख" },
    tidea: { name: "टी-आइडिया (T-IDEA)", dept: "उद्योग और वाणिज्य विभाग, तेलंगाना सरकार", desc: "तेलंगाना में नए विनिर्माण MSME के लिए राज्य-स्तरीय व्यापक प्रोत्साहन पैकेज।", subsidy: "15% - 35% निवेश सब्सिडी + पावर सब्सिडी", max: "₹30 लाख (सामान्य) / ₹75 लाख (विशेष) तक" },
    mudra: { name: "प्रधानमंत्री मुद्रा योजना (PMMY)", dept: "वित्तीय सेवा विभाग, भारत सरकार", desc: "गैर-कॉर्पोरेट, गैर-कृषि छोटे व्यवसायों के लिए शिशु, किशोर और तरुण के तहत संपार्श्विक-मुक्त ऋण।", subsidy: "रियायती सूक्ष्म ऋण", max: "₹10 लाख तक" },
    sisfs: { name: "स्टार्टअप इंडिया सीड फंड योजना (SISFS)", dept: "DPIIT, वाणिज्य और उद्योग मंत्रालय", desc: "DPIIT-मान्यता प्राप्त स्टार्टअप्स को वित्तीय सहायता।", subsidy: "₹20 लाख तक का अनुदान / ₹50 लाख का कर्ज", max: "₹20 लाख (अनुदान) / ₹50 लाख (परिवर्तनीय ऋण)" }
  },
  te: {
    pmegp: { name: "ప్రధాన మంత్రి ఉపాధి కల్పన కార్యక్రమం (PMEGP)", dept: "MSME మంత్రిత్వ శాఖ, భారత ప్రభుత్వం", desc: "కొత్త సూక్ష్మ సంస్థల స్థాపన ద్వారా ఉపాధి కల్పించడానికి క్రెడిట్-లింక్డ్ సబ్సిడీ కార్యక్రమం.", subsidy: "15% - 35% క్యాపిటల్ సబ్సిడీ", max: "₹50 లక్షలు (Mfg) / ₹20 లక్షలు (Services)" },
    cgtmse: { name: "క్రెడిట్ గ్యారెంటీ ఫండ్ ట్రస్ట్ ఫర్ మైక్రో అండ్ స్మాల్ ఎంటర్‌ప్రైజెస్ (CGTMSE)", dept: "MSME మంత్రిత్వ శాఖ & SIDBI", desc: "వాణిజ్య బ్యాంకుల ద్వారా కొత్త మరియు ప్రస్తుత సూక్ష్మ మరియు చిన్న సంస్థలకు ₹5 కోట్ల వరకు పూచీకత్తు లేని రుణ సదుపాయం.", subsidy: "పూచీకత్తు లేని క్రెడిట్ గ్యారెంటీ", max: "₹500 లక్షల వరకు" },
    standup: { name: "స్టాండ్-అప్ ఇండియా స్కీమ్", dept: "ఆర్థిక సేవల విభాగం, ఆర్థిక మంత్రిత్వ శాఖ", desc: "గ్రీన్‌ఫీల్డ్ సంస్థలను స్థాపించడానికి ప్రతి బ్యాంకు శాఖకు కనీసం ఒక SC/ST మరియు ఒక మహిళా పారిశ్రామికవేత్తకు ₹10 లక్షల నుండి ₹1 కోటి మధ్య రుణ సౌకర్యం.", subsidy: "కాంపోజిట్ బ్యాంక్ లోన్", max: "₹10 లక్షలు - ₹100 లక్షలు" },
    tidea: { name: "టి-ఐడియా (T-IDEA)", dept: "పరిశ్రమలు & వాణిజ్య శాఖ, తెలంగాణ ప్రభుత్వం", desc: "తెలంగాణలోని కొత్త తయారీ MSMEల కోసం రాష్ట్ర స్థాయి సమగ్ర ప్రోత్సాహక ప్యాకేజీ.", subsidy: "15% - 35% పెట్టుబడి సబ్సిడీ + విద్యుత్ సబ్సిడీ", max: "₹30 లక్షల వరకు (జనరల్) / ₹75 లక్షలు (స్పెషల్)" },
    mudra: { name: "ప్రధాన మంత్రి ముద్రా యోజన (PMMY)", dept: "ఆర్థిక సేవల విభాగం, భారత ప్రభుత్వం", desc: "రిటైల్, ట్రేడింగ్ మరియు సేవలలోని చిన్న/సూక్ష్మ వ్యాపారాల కోసం పూచీకత్తు లేని రుణాలు.", subsidy: "రాయితీ మైక్రో-లోన్", max: "₹10 లక్షల వరకు" },
    sisfs: { name: "స్టార్టప్ ఇండియా సీడ్ ఫండ్ స్కీమ్ (SISFS)", dept: "DPIIT, వాణిజ్యం & పరిశ్రమల మంత్రిత్వ శాఖ", desc: "DPIIT-గుర్తింపు పొందిన స్టార్టప్‌లకు ఆర్థిక సహాయం.", subsidy: "₹20 లక్షల వరకు గ్రాంట్ / ₹50 లక్షల అప్పు", max: "₹20 లక్షలు (గ్రాంట్) / ₹50 లక్షలు (అప్పు)" }
  }
};

export default function SchemesPage() {
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [selectedSector, setSelectedSector] = useState<string>("all");
  const [selectedState, setSelectedState] = useState<string>("all");
  const { t, locale } = useLanguage();

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
            
            const localized = SCHEME_TRANSLATIONS[locale]?.[scheme.id];
            const name = localized ? localized.name : scheme.name;
            const department = localized ? localized.dept : scheme.department;
            const description = localized ? localized.desc : scheme.description;
            const subsidy = localized ? localized.subsidy : scheme.subsidy;
            const maxAmount = localized ? localized.max : scheme.maxAmount;

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
                    {name}
                  </h3>

                  <div className="text-[12px] font-semibold text-sarathi-muted mb-3 uppercase tracking-wider">
                    {department}
                  </div>

                  <p className="text-[13.5px] text-sarathi-muted mb-4 line-clamp-3 leading-relaxed">
                    {description}
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
                        {subsidy}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11.5px] text-sarathi-muted mb-0.5">{t("schemes.ceilingLimit")}</div>
                      <div className="font-bold text-sarathi-ink text-[13.5px] leading-tight">
                        {maxAmount}
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
