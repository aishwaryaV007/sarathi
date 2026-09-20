"use client"
import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Shield, CheckCircle2, ArrowLeft, Upload, Loader2, Check } from "lucide-react";

export default function ApplyPage() {
  const [submitState, setSubmitState] = useState<"idle" | "validating" | "success">("idle");

  const handleSubmit = () => {
    setSubmitState("validating");
    setTimeout(() => {
      setSubmitState("success");
    }, 2500); // Simulate network/validation delay
  };

  return (
    <div className="min-h-[calc(100vh-140px)] py-11 px-6">
      <div className="max-w-[720px] mx-auto">
        
        {/* Back Link */}
        <Link href="/checklist" className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-sarathi-muted hover:text-sarathi-blue transition-colors mb-7">
          <ArrowLeft className="w-4 h-4" />
          Back to checklist
        </Link>
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-serif font-bold text-[32px] text-sarathi-ink tracking-[-0.2px] mb-1.5">
            Consent to Establish (CTE)
          </h1>
          <div className="text-[16px] text-sarathi-muted mb-4">
            Telangana State Pollution Control Board
          </div>
          
          <div className="inline-flex items-center gap-1.5 text-[13px] font-bold text-sarathi-green bg-sarathi-green-050 border border-[#bbf7d0] px-3.5 py-1.5 rounded-full">
            <Shield className="w-4 h-4" />
            Required under Water Act 1974, Sec 25
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          
          {/* Card 1: Details */}
          <Card className="border-sarathi-line shadow-sm rounded-[14px]">
            <CardHeader className="pb-4">
              <CardTitle className="text-[18px] font-bold text-sarathi-ink flex items-center justify-between">
                Your details (pre-filled)
              </CardTitle>
              <div className="text-[13.5px] text-sarathi-muted">
                Auto-filled from your profile.
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[14px] font-semibold text-sarathi-ink">Applicant Name</label>
                  <Input 
                    value="Jane Doe" 
                    readOnly 
                    className="bg-[#f8fafc] text-sarathi-muted border-sarathi-line-strong h-[44px] focus-visible:ring-0 shadow-none pointer-events-none" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[14px] font-semibold text-sarathi-ink">Business Name</label>
                  <Input 
                    value="Aquafresh Packaged Water" 
                    readOnly 
                    className="bg-[#f8fafc] text-sarathi-muted border-sarathi-line-strong h-[44px] focus-visible:ring-0 shadow-none pointer-events-none" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[14px] font-semibold text-sarathi-ink">Address</label>
                  <Input 
                    value="Plot 42, IDA Ghatkesar, Telangana" 
                    readOnly 
                    className="bg-[#f8fafc] text-sarathi-muted border-sarathi-line-strong h-[44px] focus-visible:ring-0 shadow-none pointer-events-none" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[14px] font-semibold text-sarathi-ink">PAN</label>
                  <Input 
                    value="ABCDE1234F" 
                    readOnly 
                    className="bg-[#f8fafc] text-sarathi-muted border-sarathi-line-strong h-[44px] focus-visible:ring-0 shadow-none pointer-events-none" 
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Documents */}
          <Card className="border-sarathi-line shadow-sm rounded-[14px]">
            <CardHeader className="pb-4">
              <CardTitle className="text-[18px] font-bold text-sarathi-ink">
                Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: "PAN", status: "on_file" },
                  { name: "Aadhaar", status: "on_file" },
                  { name: "Bank account", status: "on_file" },
                  { name: "Premises proof", status: "on_file" },
                  { name: "Project report", status: "missing" },
                  { name: "Site plan", status: "missing" },
                  { name: "Land document", status: "missing" },
                ].map(doc => (
                  <div key={doc.name} className="flex items-center justify-between p-4 border border-sarathi-line-strong rounded-[10px] bg-white">
                    <div className="font-semibold text-[14.5px] text-sarathi-ink">{doc.name}</div>
                    {doc.status === "on_file" ? (
                      <div className="flex items-center gap-1.5 text-sarathi-green text-[13.5px] font-semibold">
                        <CheckCircle2 className="w-4 h-4" />
                        Reused from your vault
                      </div>
                    ) : (
                      <button className="flex items-center gap-1.5 text-sarathi-blue text-[13px] font-semibold border border-sarathi-blue-100 bg-sarathi-blue-050 px-3.5 py-1.5 rounded-[6px] hover:bg-sarathi-blue-100 transition-colors">
                        <Upload className="w-[15px] h-[15px]" />
                        Upload
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Submission Area */}
          <div className="pt-4 pb-12">
            {submitState === "idle" && (
              <button 
                onClick={handleSubmit} 
                className="inline-flex items-center justify-center bg-sarathi-blue hover:bg-sarathi-blue-700 text-white font-semibold text-[15.5px] h-[48px] px-8 rounded-[8px] transition-colors"
              >
                Submit application
              </button>
            )}
            
            {submitState === "validating" && (
              <div className="flex items-center gap-3 text-sarathi-blue font-semibold text-[15px] h-[48px]">
                <Loader2 className="w-5 h-5 animate-spin" />
                Checking your documents... ✓ All required documents present
              </div>
            )}
            
            {submitState === "success" && (
              <div className="bg-sarathi-green-050 border border-[#bbf7d0] p-8 rounded-[14px] flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-500">
                <div className="w-[52px] h-[52px] bg-sarathi-green text-white rounded-full flex items-center justify-center mb-4">
                  <Check className="w-[26px] h-[26px]" strokeWidth={3} />
                </div>
                <h3 className="font-serif font-bold text-[24px] text-sarathi-ink mb-1.5 tracking-[-0.2px]">
                  Application submitted
                </h3>
                <p className="text-sarathi-muted text-[15px] mb-6 max-w-[340px]">
                  Your CTE application has been successfully routed to the Telangana State Pollution Control Board.
                </p>
                <Link 
                  href="/dashboard" 
                  className="inline-flex items-center justify-center bg-sarathi-blue hover:bg-sarathi-blue-700 text-white font-semibold text-[15px] h-[46px] px-8 rounded-[8px] transition-colors"
                >
                  Go to Dashboard
                </Link>
              </div>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
}
