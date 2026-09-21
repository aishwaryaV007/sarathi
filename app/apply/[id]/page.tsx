"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Shield, CheckCircle2, ArrowLeft, Upload, Loader2, Check, X, FileSearch, Fingerprint } from "lucide-react";
import { useLanguage } from "@/lib/i18n/context";
import { getApplyPageData, submitApplication } from "./actions";

type ValidationStep = 
  | "idle"
  | "scanning_vault"
  | "validating_data"
  | "final_check"
  | "verified";

export default function ApplyPage() {
  const params = useParams();
  const approvalId = (params?.id as string) || "trade_licence";

  const [submitState, setSubmitState] = useState<"idle" | "validating" | "success">("idle");
  const [valStep, setValStep] = useState<ValidationStep>("idle");
  const { t } = useLanguage();
  
  // Simulated missing document toggle for demo purposes
  const [demoMissingDoc, setDemoMissingDoc] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [approval, setApproval] = useState<any>({
    id: approvalId,
    name: "Approval Application",
    department: "Competent Regulatory Authority",
    statute: "Applicable Regulatory Act",
    documents: ["Identity & PAN Proof", "Premises Proof", "Bank Account Details"],
  });

  const [userProfile, setUserProfile] = useState<any>({
    fullName: "Business Promoter",
    businessName: "Commercial Enterprise",
    address: "Hyderabad, Telangana",
    pan: "ABCDE1234F",
  });

  const [vaultDocs, setVaultDocs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let clientProfile = null;
    try {
      const raw = sessionStorage.getItem("sarathi_profile");
      if (raw) clientProfile = JSON.parse(raw);
    } catch {}

    getApplyPageData(approvalId, clientProfile)
      .then((res) => {
        if (res.success && res.approval) {
          setApproval(res.approval);
          setUserProfile(res.userProfile);
          setVaultDocs(res.documentsOnFile || []);
        }
      })
      .finally(() => setLoading(false));
  }, [approvalId]);

  const handleSubmit = () => {
    setSubmitState("validating");
    setValStep("scanning_vault");
    setValidationError(null);
  };

  const closeValidationModal = () => {
    setSubmitState("idle");
    setValStep("idle");
  };

  useEffect(() => {
    if (submitState !== "validating") return;

    let timer1: NodeJS.Timeout, timer2: NodeJS.Timeout, timer3: NodeJS.Timeout;

    if (valStep === "scanning_vault") {
      timer1 = setTimeout(() => {
        setValStep("validating_data");
      }, 1500);
    } else if (valStep === "validating_data") {
      timer2 = setTimeout(() => {
        setValStep("final_check");
      }, 1500);
    } else if (valStep === "final_check") {
      timer3 = setTimeout(() => {
        if (demoMissingDoc) {
          setValidationError(`Missing ${approval.documents?.[0] || "Required Document"}. Please upload it to your Vault.`);
        } else {
          setValStep("verified");
          submitApplication(approval.id || approvalId, approval.name, approval.department).then((res) => {
            if (res.error) {
              setValidationError(res.error);
              setValStep("final_check");
            } else {
              setTimeout(() => {
                setSubmitState("success");
              }, 1500);
            }
          });
        }
      }, 1500);
    }

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [valStep, submitState, demoMissingDoc, approval, approvalId]);

  return (
    <div className="min-h-[calc(100vh-140px)] py-11 px-6 relative">
      <div className="max-w-[720px] mx-auto">
        
        {/* Back Link */}
        <Link href="/checklist" className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-sarathi-muted hover:text-sarathi-blue transition-colors mb-7">
          <ArrowLeft className="w-4 h-4" />
          {t("apply.backToChecklist")}
        </Link>
        
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="font-serif font-bold text-[32px] text-sarathi-ink tracking-[-0.2px] mb-1.5">
              {approval.name}
            </h1>
            <div className="text-[16px] text-sarathi-muted mb-4">
              {approval.department}
            </div>
            
            <div className="inline-flex items-center gap-1.5 text-[13px] font-bold text-sarathi-green bg-sarathi-green-050 border border-[#bbf7d0] px-3.5 py-1.5 rounded-full">
              <Shield className="w-4 h-4" />
              Required under {approval.statute}
            </div>
          </div>
          
          {/* Hidden toggle for judges demo */}
          <button 
            onClick={() => setDemoMissingDoc(!demoMissingDoc)}
            className="text-[10px] text-transparent hover:text-gray-300"
            title="Toggle missing document demo"
          >
            {demoMissingDoc ? "DEMO: Missing Doc" : "DEMO: Perfect"}
          </button>
        </div>

        {/* Content */}
        {submitState !== "success" ? (
          <div className="space-y-6">
            
            {/* Card 1: Details */}
            <Card className="border-sarathi-line shadow-sm rounded-[14px]">
              <CardHeader className="pb-4">
                <CardTitle className="text-[18px] font-bold text-sarathi-ink flex items-center justify-between">
                  {t("apply.detailsTitle")}
                </CardTitle>
                <div className="text-[13.5px] text-sarathi-muted">
                  {t("apply.detailsSubtitle")}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-[14px] font-semibold text-sarathi-ink">{t("apply.applicantName")}</label>
                    <Input 
                      value={userProfile.fullName} 
                      readOnly 
                      className="bg-[#f8fafc] text-sarathi-ink font-medium border-sarathi-line-strong h-[44px] focus-visible:ring-0 shadow-none pointer-events-none" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[14px] font-semibold text-sarathi-ink">{t("apply.businessName")}</label>
                    <Input 
                      value={userProfile.businessName} 
                      readOnly 
                      className="bg-[#f8fafc] text-sarathi-ink font-medium border-sarathi-line-strong h-[44px] focus-visible:ring-0 shadow-none pointer-events-none" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[14px] font-semibold text-sarathi-ink">{t("apply.address")}</label>
                    <Input 
                      value={userProfile.address} 
                      readOnly 
                      className="bg-[#f8fafc] text-sarathi-ink font-medium border-sarathi-line-strong h-[44px] focus-visible:ring-0 shadow-none pointer-events-none" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[14px] font-semibold text-sarathi-ink">PAN</label>
                    <Input 
                      value={userProfile.pan} 
                      readOnly 
                      className="bg-[#f8fafc] text-sarathi-ink font-medium border-sarathi-line-strong h-[44px] focus-visible:ring-0 shadow-none pointer-events-none" 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card 2: Documents */}
            <Card className="border-sarathi-line shadow-sm rounded-[14px]">
              <CardHeader className="pb-4">
                <CardTitle className="text-[18px] font-bold text-sarathi-ink">
                  {t("apply.documents")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(approval.documents || []).map((docName: string, index: number) => {
                    const isMissingForDemo = demoMissingDoc && index === 0;
                    const onFile = !isMissingForDemo;
                    return (
                      <div key={docName} className="flex items-center justify-between p-4 border border-sarathi-line-strong rounded-[10px] bg-white">
                        <div className="font-semibold text-[14.5px] text-sarathi-ink">{docName}</div>
                        {onFile ? (
                          <div className="flex items-center gap-1.5 text-sarathi-green text-[13.5px] font-semibold">
                            <CheckCircle2 className="w-4 h-4" />
                            {t("apply.reusedFromVault")}
                          </div>
                        ) : (
                          <button className="flex items-center gap-1.5 text-[#b85c00] text-[13px] font-semibold border border-[#fed7aa] bg-[#fff6ed] px-3.5 py-1.5 rounded-[6px] hover:bg-[#ffedd5] transition-colors">
                            <Upload className="w-[15px] h-[15px]" />
                            {t("apply.uploadRequired")}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Submission Area */}
            <div className="pt-4 pb-12">
              <button 
                onClick={handleSubmit} 
                className="inline-flex items-center justify-center bg-sarathi-blue hover:bg-sarathi-blue-700 text-white font-semibold text-[15.5px] h-[48px] px-8 rounded-[8px] transition-colors shadow-sm cursor-pointer"
              >
                <Shield className="w-4 h-4 mr-2" />
                {t("apply.validateSubmit")}
              </button>
            </div>
            
          </div>
        ) : (
          /* Final Success View */
          <div className="bg-sarathi-green-050 border border-[#bbf7d0] p-10 rounded-[14px] flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-500 mt-8">
            <div className="w-[64px] h-[64px] bg-sarathi-green text-white rounded-full flex items-center justify-center mb-6">
              <Check className="w-[32px] h-[32px]" strokeWidth={3} />
            </div>
            <h3 className="font-serif font-bold text-[28px] text-sarathi-ink mb-2 tracking-[-0.2px]">
              {t("apply.successTitle")}
            </h3>
            <p className="text-sarathi-muted text-[16px] mb-8 max-w-[400px]">
              {t("apply.successDesc")}
            </p>
            <Link 
              href="/dashboard" 
              className="inline-flex items-center justify-center bg-sarathi-blue hover:bg-sarathi-blue-700 text-white font-semibold text-[16px] h-[52px] px-10 rounded-[8px] transition-colors shadow-sm"
            >
              {t("apply.goToDashboard")}
            </Link>
          </div>
        )}
      </div>

      {/* VALIDATION MODAL OVERLAY */}
      {submitState === "validating" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[16px] shadow-xl w-full max-w-[460px] overflow-hidden animate-in zoom-in-95 duration-300">
            
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-sarathi-line flex items-center justify-between bg-[#f8fafc]">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-sarathi-blue" />
                <h3 className="font-bold text-[16px] text-sarathi-ink">{t("apply.preSubmit")}</h3>
              </div>
              {validationError && (
                <button onClick={closeValidationModal} className="text-sarathi-muted hover:text-sarathi-ink transition-colors">
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Modal Body */}
            <div className="p-8">
              
              {!validationError ? (
                <div className="space-y-6">
                  {/* Step 1 */}
                  <div className={`flex items-center gap-4 transition-opacity duration-300 ${valStep === "idle" ? "opacity-30" : "opacity-100"}`}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-sarathi-line-strong bg-white">
                      {valStep === "scanning_vault" ? (
                        <Loader2 className="w-4 h-4 text-sarathi-blue animate-spin" />
                      ) : (
                        <Check className="w-4 h-4 text-sarathi-green" />
                      )}
                    </div>
                    <div>
                      <h4 className={`text-[15px] font-semibold ${valStep === "scanning_vault" ? "text-sarathi-blue" : "text-sarathi-ink"}`}>
                        {t("apply.scanningVault")}
                      </h4>
                      <p className="text-[13px] text-sarathi-muted mt-0.5">{t("apply.scanningVaultDesc")}</p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className={`flex items-center gap-4 transition-opacity duration-300 ${valStep === "idle" || valStep === "scanning_vault" ? "opacity-30" : "opacity-100"}`}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-sarathi-line-strong bg-white">
                      {valStep === "validating_data" ? (
                        <Loader2 className="w-4 h-4 text-sarathi-blue animate-spin" />
                      ) : valStep === "final_check" || valStep === "verified" ? (
                        <Check className="w-4 h-4 text-sarathi-green" />
                      ) : (
                        <Fingerprint className="w-4 h-4 text-sarathi-muted" />
                      )}
                    </div>
                    <div>
                      <h4 className={`text-[15px] font-semibold ${valStep === "validating_data" ? "text-sarathi-blue" : "text-sarathi-ink"}`}>
                        {t("apply.crossChecking")}
                      </h4>
                      <p className="text-[13px] text-sarathi-muted mt-0.5">{t("apply.crossCheckingDesc")}</p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className={`flex items-center gap-4 transition-opacity duration-300 ${valStep === "final_check" || valStep === "verified" ? "opacity-100" : "opacity-30"}`}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-sarathi-line-strong bg-white">
                      {valStep === "final_check" ? (
                        <Loader2 className="w-4 h-4 text-sarathi-blue animate-spin" />
                      ) : valStep === "verified" ? (
                        <Check className="w-4 h-4 text-sarathi-green" />
                      ) : (
                        <FileSearch className="w-4 h-4 text-sarathi-muted" />
                      )}
                    </div>
                    <div>
                      <h4 className={`text-[15px] font-semibold ${valStep === "final_check" ? "text-sarathi-blue" : "text-sarathi-ink"}`}>
                        {t("apply.finalRule")}
                      </h4>
                      <p className="text-[13px] text-sarathi-muted mt-0.5">{t("apply.finalRuleDesc")}</p>
                    </div>
                  </div>

                  {/* Success Banner */}
                  <div className={`mt-6 pt-6 border-t border-sarathi-line transition-all duration-500 overflow-hidden ${valStep === "verified" ? "max-h-[100px] opacity-100" : "max-h-0 opacity-0 pt-0 border-t-0"}`}>
                    <div className="bg-sarathi-green-050 border border-sarathi-green-200 rounded-[8px] p-3 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-sarathi-green" />
                      <span className="text-[14.5px] font-semibold text-sarathi-green">{t("apply.allPassed")}</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Error State */
                <div className="flex flex-col items-center text-center py-4">
                  <div className="w-14 h-14 bg-[#fff6ed] border border-[#fed7aa] rounded-full flex items-center justify-center mb-4">
                    <X className="w-7 h-7 text-[#ea580c]" strokeWidth={2.5} />
                  </div>
                  <h3 className="font-bold text-[18px] text-sarathi-ink mb-2">{t("apply.validationFailed")}</h3>
                  <p className="text-[15px] text-sarathi-muted mb-6">
                    {validationError}
                  </p>
                  <button 
                    onClick={closeValidationModal}
                    className="bg-sarathi-ink hover:bg-black text-white font-semibold text-[15px] h-[44px] px-8 rounded-[8px] transition-colors w-full"
                  >
                    {t("apply.closeFix")}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
