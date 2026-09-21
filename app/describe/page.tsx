"use client"
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function DescribePage() {
  const [step, setStep] = useState(1);
  const router = useRouter();
  
  // State for form data
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  
  const [investment, setInvestment] = useState("");
  const [workers, setWorkers] = useState("");
  const [power, setPower] = useState<"yes" | "no" | null>(null);
  const [food, setFood] = useState<"yes" | "no" | null>(null);
  const [premises, setPremises] = useState<"owned" | "rented" | null>(null);
  const [groundwater, setGroundwater] = useState<"yes" | "no" | null>(null);

  return (
    <div className="min-h-[calc(100vh-140px)] py-11 px-6">
      <div className="max-w-[720px] mx-auto">
        {/* Breadcrumbs */}
        <div className="text-[13.5px] text-sarathi-muted mb-6 flex gap-2 items-center">
          <Link href="/" className="hover:text-sarathi-blue transition-colors">Home</Link>
          <span className="text-sarathi-faint">›</span>
          <span>New approval journey</span>
        </div>
        
        <Card className="border-sarathi-line shadow-[0_1px_2px_rgba(16,42,79,.08)] rounded-[14px]">
          <CardContent className="p-8 md:p-9">
            <div className="text-[12.5px] font-bold text-sarathi-blue tracking-[0.04em] uppercase mb-2">
              Step {step} of 2
            </div>
            
            {step === 1 ? (
              <div>
                <h2 className="font-serif text-[25px] font-bold text-sarathi-ink mb-1.5 tracking-[-0.2px]">
                  Tell us about your business
                </h2>
                <p className="text-[15px] text-sarathi-muted mb-7">
                  Describe it in your own words — we&apos;ll figure out the rest.
                </p>
                
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="font-semibold text-[14.5px] text-sarathi-ink block">
                      Description
                    </label>
                    <Textarea 
                      placeholder="e.g. I want to start a packaged drinking water plant in Ghatkesar with 10 workers"
                      className="min-h-[120px] border-[1.5px] border-sarathi-line-strong rounded-[8px] bg-white px-3.5 py-3 text-[15px] focus-visible:ring-0 focus-visible:border-sarathi-blue focus-visible:shadow-[0_0_0_3px_var(--color-sarathi-blue-050)] transition-all resize-y"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="font-semibold text-[14.5px] text-sarathi-ink block">
                        City / Area
                      </label>
                      <Input 
                        placeholder="e.g. Ghatkesar"
                        className="h-[46px] border-[1.5px] border-sarathi-line-strong rounded-[8px] bg-white px-3.5 text-[15px] focus-visible:ring-0 focus-visible:border-sarathi-blue focus-visible:shadow-[0_0_0_3px_var(--color-sarathi-blue-050)] transition-all"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="font-semibold text-[14.5px] text-sarathi-ink block">
                        State
                      </label>
                      <Select value={stateName} onValueChange={(v) => setStateName(v || "")}>
                        <SelectTrigger className="h-[46px] border-[1.5px] border-sarathi-line-strong rounded-[8px] bg-white px-3.5 text-[15px] focus:ring-0 focus:border-sarathi-blue focus:shadow-[0_0_0_3px_var(--color-sarathi-blue-050)] transition-all data-[state=open]:border-sarathi-blue data-[state=open]:shadow-[0_0_0_3px_var(--color-sarathi-blue-050)]">
                          <SelectValue placeholder="Select a state" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="telangana">Telangana</SelectItem>
                          <SelectItem value="maharashtra">Maharashtra</SelectItem>
                          <SelectItem value="other">Other State</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                
                <div className="mt-9 pt-5 border-t border-sarathi-line flex justify-end">
                  <button 
                    onClick={() => {
                      setStep(2);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="inline-flex items-center justify-center bg-sarathi-blue hover:bg-sarathi-blue-700 text-white font-semibold text-[15px] h-[44px] px-6 rounded-[8px] transition-colors"
                  >
                    Continue &rarr;
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <h2 className="font-serif text-[25px] font-bold text-sarathi-ink mb-1.5 tracking-[-0.2px]">
                  A few details
                </h2>
                <p className="text-[15px] text-sarathi-muted mb-7">
                  Help us narrow down the specific rules for your unit.
                </p>
                
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="font-semibold text-[14.5px] text-sarathi-ink block">
                      Investment in plant & machinery
                    </label>
                    <div className="flex items-center gap-3">
                      <span className="text-[20px] font-bold text-sarathi-blue">₹</span>
                      <Input 
                        type="number"
                        placeholder="0"
                        className="h-[46px] max-w-[180px] border-[1.5px] border-sarathi-line-strong rounded-[8px] bg-white px-3.5 text-[15px] focus-visible:ring-0 focus-visible:border-sarathi-blue focus-visible:shadow-[0_0_0_3px_var(--color-sarathi-blue-050)] transition-all"
                        value={investment}
                        onChange={(e) => setInvestment(e.target.value)}
                      />
                      <span className="text-sarathi-muted font-semibold">lakh</span>
                    </div>
                    <div className="text-[13px] text-sarathi-faint mt-1.5 max-w-md">
                      Micro ≤ ₹2.5 crore · Small ≤ ₹25 crore · Medium ≤ ₹125 crore
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="font-semibold text-[14.5px] text-sarathi-ink block">
                      Number of workers
                    </label>
                    <Input 
                      type="number"
                      placeholder="0"
                      className="h-[46px] max-w-[180px] border-[1.5px] border-sarathi-line-strong rounded-[8px] bg-white px-3.5 text-[15px] focus-visible:ring-0 focus-visible:border-sarathi-blue focus-visible:shadow-[0_0_0_3px_var(--color-sarathi-blue-050)] transition-all"
                      value={workers}
                      onChange={(e) => setWorkers(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <label className="font-semibold text-[14.5px] text-sarathi-ink block">
                      Will the premises use electric power for manufacturing?
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div 
                        onClick={() => setPower("yes")}
                        className={`border-[1.5px] rounded-[9px] px-4 py-3.5 flex gap-3 items-start cursor-pointer transition-colors bg-white hover:bg-sarathi-blue-050 hover:border-sarathi-blue-600 ${power === "yes" ? "border-sarathi-blue bg-sarathi-blue-050 shadow-[0_0_0_3px_var(--color-sarathi-blue-050)]" : "border-sarathi-line-strong"}`}
                      >
                        <div className={`w-[18px] h-[18px] rounded-full border-2 shrink-0 mt-[2px] relative flex items-center justify-center ${power === "yes" ? "border-sarathi-blue" : "border-sarathi-line-strong"}`}>
                          {power === "yes" && <div className="w-[10px] h-[10px] rounded-full bg-sarathi-blue absolute" />}
                        </div>
                        <div>
                          <div className="font-semibold text-[14.5px] text-sarathi-ink">Yes, uses power</div>
                          <div className="text-[12.5px] text-sarathi-muted mt-0.5">Factories Act applies at 10+ workers</div>
                        </div>
                      </div>
                      
                      <div 
                        onClick={() => setPower("no")}
                        className={`border-[1.5px] rounded-[9px] px-4 py-3.5 flex gap-3 items-start cursor-pointer transition-colors bg-white hover:bg-sarathi-blue-050 hover:border-sarathi-blue-600 ${power === "no" ? "border-sarathi-blue bg-sarathi-blue-050 shadow-[0_0_0_3px_var(--color-sarathi-blue-050)]" : "border-sarathi-line-strong"}`}
                      >
                        <div className={`w-[18px] h-[18px] rounded-full border-2 shrink-0 mt-[2px] relative flex items-center justify-center ${power === "no" ? "border-sarathi-blue" : "border-sarathi-line-strong"}`}>
                          {power === "no" && <div className="w-[10px] h-[10px] rounded-full bg-sarathi-blue absolute" />}
                        </div>
                        <div>
                          <div className="font-semibold text-[14.5px] text-sarathi-ink">No power used</div>
                          <div className="text-[12.5px] text-sarathi-muted mt-0.5">Factories Act applies at 20+ workers</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <label className="font-semibold text-[14.5px] text-sarathi-ink block">
                      Will you sell or handle food?
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div 
                        onClick={() => setFood("yes")}
                        className={`border-[1.5px] rounded-[9px] px-4 py-3.5 flex gap-3 items-start cursor-pointer transition-colors bg-white hover:bg-sarathi-blue-050 hover:border-sarathi-blue-600 ${food === "yes" ? "border-sarathi-blue bg-sarathi-blue-050 shadow-[0_0_0_3px_var(--color-sarathi-blue-050)]" : "border-sarathi-line-strong"}`}
                      >
                        <div className={`w-[18px] h-[18px] rounded-full border-2 shrink-0 mt-[2px] relative flex items-center justify-center ${food === "yes" ? "border-sarathi-blue" : "border-sarathi-line-strong"}`}>
                          {food === "yes" && <div className="w-[10px] h-[10px] rounded-full bg-sarathi-blue absolute" />}
                        </div>
                        <div>
                          <div className="font-semibold text-[14.5px] text-sarathi-ink">Yes</div>
                        </div>
                      </div>
                      
                      <div 
                        onClick={() => setFood("no")}
                        className={`border-[1.5px] rounded-[9px] px-4 py-3.5 flex gap-3 items-start cursor-pointer transition-colors bg-white hover:bg-sarathi-blue-050 hover:border-sarathi-blue-600 ${food === "no" ? "border-sarathi-blue bg-sarathi-blue-050 shadow-[0_0_0_3px_var(--color-sarathi-blue-050)]" : "border-sarathi-line-strong"}`}
                      >
                        <div className={`w-[18px] h-[18px] rounded-full border-2 shrink-0 mt-[2px] relative flex items-center justify-center ${food === "no" ? "border-sarathi-blue" : "border-sarathi-line-strong"}`}>
                          {food === "no" && <div className="w-[10px] h-[10px] rounded-full bg-sarathi-blue absolute" />}
                        </div>
                        <div>
                          <div className="font-semibold text-[14.5px] text-sarathi-ink">No</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="font-semibold text-[14.5px] text-sarathi-ink block">
                      Is the premises owned or rented?
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div 
                        onClick={() => setPremises("owned")}
                        className={`border-[1.5px] rounded-[9px] px-4 py-3.5 flex gap-3 items-start cursor-pointer transition-colors bg-white hover:bg-sarathi-blue-050 hover:border-sarathi-blue-600 ${premises === "owned" ? "border-sarathi-blue bg-sarathi-blue-050 shadow-[0_0_0_3px_var(--color-sarathi-blue-050)]" : "border-sarathi-line-strong"}`}
                      >
                        <div className={`w-[18px] h-[18px] rounded-full border-2 shrink-0 mt-[2px] relative flex items-center justify-center ${premises === "owned" ? "border-sarathi-blue" : "border-sarathi-line-strong"}`}>
                          {premises === "owned" && <div className="w-[10px] h-[10px] rounded-full bg-sarathi-blue absolute" />}
                        </div>
                        <div>
                          <div className="font-semibold text-[14.5px] text-sarathi-ink">Owned</div>
                        </div>
                      </div>
                      
                      <div 
                        onClick={() => setPremises("rented")}
                        className={`border-[1.5px] rounded-[9px] px-4 py-3.5 flex gap-3 items-start cursor-pointer transition-colors bg-white hover:bg-sarathi-blue-050 hover:border-sarathi-blue-600 ${premises === "rented" ? "border-sarathi-blue bg-sarathi-blue-050 shadow-[0_0_0_3px_var(--color-sarathi-blue-050)]" : "border-sarathi-line-strong"}`}
                      >
                        <div className={`w-[18px] h-[18px] rounded-full border-2 shrink-0 mt-[2px] relative flex items-center justify-center ${premises === "rented" ? "border-sarathi-blue" : "border-sarathi-line-strong"}`}>
                          {premises === "rented" && <div className="w-[10px] h-[10px] rounded-full bg-sarathi-blue absolute" />}
                        </div>
                        <div>
                          <div className="font-semibold text-[14.5px] text-sarathi-ink">Rented</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="font-semibold text-[14.5px] text-sarathi-ink block">
                      Will you use a borewell or groundwater?
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div 
                        onClick={() => setGroundwater("yes")}
                        className={`border-[1.5px] rounded-[9px] px-4 py-3.5 flex gap-3 items-start cursor-pointer transition-colors bg-white hover:bg-sarathi-blue-050 hover:border-sarathi-blue-600 ${groundwater === "yes" ? "border-sarathi-blue bg-sarathi-blue-050 shadow-[0_0_0_3px_var(--color-sarathi-blue-050)]" : "border-sarathi-line-strong"}`}
                      >
                        <div className={`w-[18px] h-[18px] rounded-full border-2 shrink-0 mt-[2px] relative flex items-center justify-center ${groundwater === "yes" ? "border-sarathi-blue" : "border-sarathi-line-strong"}`}>
                          {groundwater === "yes" && <div className="w-[10px] h-[10px] rounded-full bg-sarathi-blue absolute" />}
                        </div>
                        <div>
                          <div className="font-semibold text-[14.5px] text-sarathi-ink">Yes</div>
                        </div>
                      </div>
                      
                      <div 
                        onClick={() => setGroundwater("no")}
                        className={`border-[1.5px] rounded-[9px] px-4 py-3.5 flex gap-3 items-start cursor-pointer transition-colors bg-white hover:bg-sarathi-blue-050 hover:border-sarathi-blue-600 ${groundwater === "no" ? "border-sarathi-blue bg-sarathi-blue-050 shadow-[0_0_0_3px_var(--color-sarathi-blue-050)]" : "border-sarathi-line-strong"}`}
                      >
                        <div className={`w-[18px] h-[18px] rounded-full border-2 shrink-0 mt-[2px] relative flex items-center justify-center ${groundwater === "no" ? "border-sarathi-blue" : "border-sarathi-line-strong"}`}>
                          {groundwater === "no" && <div className="w-[10px] h-[10px] rounded-full bg-sarathi-blue absolute" />}
                        </div>
                        <div>
                          <div className="font-semibold text-[14.5px] text-sarathi-ink">No</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-9 pt-5 border-t border-sarathi-line flex justify-between items-center">
                  <button 
                    onClick={() => {
                      setStep(1);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="text-sarathi-blue-600 hover:text-sarathi-blue-700 font-semibold px-2 py-2 transition-colors text-[14.5px]"
                  >
                    &larr; Back
                  </button>
                  <button 
                    onClick={() => {
                      // Save profile to sessionStorage so checklist page can read it
                      const profile = {
                        description,
                        businessLabel: "", // resolved server-side by /api/understand
                        pollutionCategory: "white", // resolved server-side
                        isManufacturing: false, // resolved server-side
                        sectorApprovals: [], // resolved server-side
                        state: stateName || "telangana",
                        city: city || "",
                        investmentLakh: Number(investment) || 0,
                        workers: Number(workers) || 0,
                        usesPower: power === "yes",
                        handlesFood: food === "yes",
                        premises: premises || "rented",
                        usesGroundwater: groundwater === "yes",
                        entityType: "notyet" as const,
                        isStartup: false,
                      };
                      sessionStorage.setItem("sarathi_profile", JSON.stringify(profile));
                      router.push("/checklist");
                    }}
                    className="inline-flex items-center justify-center bg-sarathi-blue hover:bg-sarathi-blue-700 text-white font-semibold text-[15px] h-[48px] px-6 rounded-[8px] transition-colors"
                  >
                    Build my checklist &rarr;
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
