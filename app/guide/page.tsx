"use client";

import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, FileText, CheckCircle2, ShieldAlert, Zap } from "lucide-react";
import { useLanguage } from "@/lib/i18n/context";

export default function GuidePage() {
  const { t } = useLanguage();

  const steps = [
    {
      title: t("guide.step1Title"),
      icon: <FileText className="w-6 h-6 text-sarathi-blue" />,
      content: t("guide.step1Content"),
    },
    {
      title: t("guide.step2Title"),
      icon: <ShieldAlert className="w-6 h-6 text-sarathi-blue" />,
      content: t("guide.step2Content"),
    },
    {
      title: t("guide.step3Title"),
      icon: <Zap className="w-6 h-6 text-sarathi-blue" />,
      content: t("guide.step3Content"),
    },
    {
      title: t("guide.step4Title"),
      icon: <CheckCircle2 className="w-6 h-6 text-sarathi-blue" />,
      content: t("guide.step4Content"),
    }
  ];

  const faqs = [
    {
      q: t("guide.faq1Q"),
      a: t("guide.faq1A")
    },
    {
      q: t("guide.faq2Q"),
      a: t("guide.faq2A")
    },
    {
      q: t("guide.faq3Q"),
      a: t("guide.faq3A")
    }
  ];

  return (
    <div className="min-h-[calc(100vh-140px)] py-11 px-6 bg-white">
      <div className="max-w-[800px] mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-sarathi-blue-050 rounded-full flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-8 h-8 text-sarathi-blue" />
          </div>
          <h1 className="font-serif font-bold text-[36px] text-sarathi-ink tracking-[-0.2px] mb-4">
            {t("guide.title")}
          </h1>
          <p className="text-[18px] text-sarathi-muted max-w-[600px] mx-auto leading-relaxed">
            {t("guide.desc")}
          </p>
        </div>

        {/* Timeline Steps */}
        <div className="space-y-6 mb-16">
          <h2 className="font-bold text-[22px] text-sarathi-ink mb-6">{t("guide.phasesTitle")}</h2>
          
          <div className="relative border-l-2 border-sarathi-line-strong pl-8 ml-4 space-y-10">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="absolute -left-[51px] top-0 w-12 h-12 bg-white rounded-full border-2 border-sarathi-line-strong flex items-center justify-center shadow-sm">
                  {step.icon}
                </div>
                <Card className="border-sarathi-line shadow-sm rounded-[14px]">
                  <CardContent className="p-6">
                    <h3 className="font-bold text-[18px] text-sarathi-ink mb-3">{step.title}</h3>
                    <p className="text-[15.5px] text-sarathi-muted leading-relaxed">
                      {step.content}
                    </p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>

        {/* FAQs */}
        <div>
          <h2 className="font-bold text-[22px] text-sarathi-ink mb-6 pt-8 border-t border-sarathi-line">{t("guide.faqTitle")}</h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="border border-sarathi-line rounded-[12px] p-6 bg-[#fafbfc]">
                <h4 className="font-semibold text-[16px] text-sarathi-ink mb-2">{faq.q}</h4>
                <p className="text-[15px] text-sarathi-muted leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
