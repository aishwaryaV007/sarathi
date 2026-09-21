import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, FileText, CheckCircle2, ShieldAlert, Zap } from "lucide-react";

export default function GuidePage() {
  const steps = [
    {
      title: "1. Business Registration",
      icon: <FileText className="w-6 h-6 text-sarathi-blue" />,
      content: "Before applying for any operational licenses, you must register your business entity. This includes getting a PAN, registering as a Proprietorship, Partnership, LLP, or Private Limited Company, and securing Udyam (MSME) registration.",
    },
    {
      title: "2. Site & Premises Approvals",
      icon: <ShieldAlert className="w-6 h-6 text-sarathi-blue" />,
      content: "Ensure your commercial space is legally compliant. This step involves securing a Trade Licence from the local municipality, Fire Safety NOC, and Shop & Establishment Act registration.",
    },
    {
      title: "3. Environmental & Utilities",
      icon: <Zap className="w-6 h-6 text-sarathi-blue" />,
      content: "If you are manufacturing or processing goods, you must apply for Consent to Establish (CTE) and Consent to Operate (CTO) from the State Pollution Control Board, along with commercial water and electricity connections.",
    },
    {
      title: "4. Sector-Specific Licences",
      icon: <CheckCircle2 className="w-6 h-6 text-sarathi-blue" />,
      content: "Depending on your product, apply for specialized approvals like FSSAI (Food), BIS ISI mark (Quality), Drug Licence (Pharma), or Excise (Liquor).",
    }
  ];

  const faqs = [
    {
      q: "Do I need an agent to file these forms?",
      a: "No. Sarathi is designed to guide you step-by-step through direct government portals, saving you time and agent fees."
    },
    {
      q: "What is the difference between CTE and CTO?",
      a: "Consent to Establish (CTE) is required before you start building your facility. Consent to Operate (CTO) is required after construction but before you actually begin production."
    },
    {
      q: "Are my documents secure?",
      a: "Yes. Documents uploaded to the Sarathi Vault are stored securely and never shared with third parties. They are only used to pre-fill your government applications."
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
            Compliance Guide
          </h1>
          <p className="text-[18px] text-sarathi-muted max-w-[600px] mx-auto leading-relaxed">
            A plain-English guide to understanding how business approvals work in India, from day one to launch.
          </p>
        </div>

        {/* Timeline Steps */}
        <div className="space-y-6 mb-16">
          <h2 className="font-bold text-[22px] text-sarathi-ink mb-6">The 4 Phases of Compliance</h2>
          
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
          <h2 className="font-bold text-[22px] text-sarathi-ink mb-6 pt-8 border-t border-sarathi-line">Frequently Asked Questions</h2>
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
