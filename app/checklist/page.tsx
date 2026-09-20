import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Shield, Clock, FileText, CheckCircle2, ChevronRight, FileCheck, Building, Leaf, FileKey, ExternalLink } from "lucide-react";

const ON_FILE_DOCS = ["PAN", "Aadhaar", "Bank account", "Premises proof", "ID proof"];

const approvals = [
  { id: 'bis', name: 'BIS Certification (ISI mark)', dept: 'Bureau of Indian Standards', law: 'BIS Act 2016 + IS 14543', timeline: '30 days', docs: ['Water test report', 'Layout plan', 'Machinery list'], icon: FileCheck },
  { id: 'fssai', name: 'FSSAI Licence', dept: 'Food Safety & Standards Authority of India', law: 'FSS Act 2006', timeline: '30 days', docs: ['Water analysis report', 'ID proof', 'Premises proof'], icon: FileText },
  { id: 'cte', name: 'Consent to Establish (CTE)', dept: 'Telangana State Pollution Control Board', law: 'Water Act 1974 Sec 25 & Air Act 1981', timeline: '14 days', docs: ['Project report', 'Site plan', 'Land document'], icon: Leaf },
  { id: 'cto', name: 'Consent to Operate (CTO)', dept: 'TSPCB', law: 'Water Act 1974 & Air Act 1981', timeline: 'before operations', docs: ['CTE approval', 'Pollution setup proof'], icon: Leaf },
  { id: 'cgwa', name: 'Ground Water NOC', dept: 'CGWA / State Groundwater Dept', law: 'Environment Protection Act 1986', timeline: '30 days', docs: ['Borewell details', 'Land document'], icon: FileText },
  { id: 'factory', name: 'Factory Licence', dept: 'Dept. of Factories, Telangana', law: 'Factories Act 1948 Sec 6', timeline: '15–30 days', docs: ['Building plan', 'Machinery layout'], icon: Building },
  { id: 'gst', name: 'GST Registration', dept: 'CBIC', law: 'CGST Act 2017 Sec 22', timeline: '3–7 days', docs: ['PAN', 'Aadhaar', 'Premises proof', 'Bank account'], icon: FileKey },
  { id: 'udyam', name: 'Udyam (MSME) Registration', dept: 'Ministry of MSME', law: 'MSMED Act 2006', timeline: 'instant', docs: ['PAN', 'Aadhaar', 'Bank account'], icon: FileText },
  { id: 'trade', name: 'Trade Licence', dept: 'Greater Hyderabad Municipal Corporation', law: 'Telangana Municipalities Act 2019', timeline: '7–15 days', docs: ['Premises proof', 'Property tax receipt'], icon: Building }
];

export default function ChecklistPage() {
  return (
    <div className="min-h-[calc(100vh-140px)] py-10 px-6">
      <div className="max-w-[1120px] mx-auto">
        
        {/* Breadcrumbs */}
        <div className="text-[13.5px] text-sarathi-muted mb-7 flex gap-2 items-center">
          <Link href="/" className="hover:text-sarathi-blue transition-colors">Home</Link>
          <span className="text-sarathi-faint">›</span>
          <Link href="/describe" className="hover:text-sarathi-blue transition-colors">New approval journey</Link>
          <span className="text-sarathi-faint">›</span>
          <span className="font-semibold text-sarathi-ink">Your checklist</span>
        </div>

        {/* Top Summary Bar */}
        <div className="mb-9">
          <div className="text-[14px] text-sarathi-muted mb-3 flex items-center gap-2">
            Based on: <b className="text-sarathi-ink">Packaged drinking water plant · Ghatkesar, Telangana</b>
            <Link href="/describe" className="text-sarathi-blue hover:underline ml-2 text-[13px]">Edit</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white border border-sarathi-line rounded-[10px] p-3.5 flex flex-col justify-center">
              <div className="text-[12.5px] text-sarathi-muted mb-1">Approvals identified</div>
              <div className="font-bold text-[18px] text-sarathi-ink leading-none">9</div>
            </div>
            <div className="bg-white border border-sarathi-line rounded-[10px] p-3.5 flex flex-col justify-center">
              <div className="text-[12.5px] text-sarathi-muted mb-1">MSME category</div>
              <div className="font-bold text-[15px] text-sarathi-ink leading-none">Micro</div>
            </div>
            <div className="bg-white border border-sarathi-line rounded-[10px] p-3.5 flex flex-col justify-center">
              <div className="text-[12.5px] text-sarathi-muted mb-1">Pollution category</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-[8px] h-[8px] rounded-full bg-[#f59e0b]"></div>
                <div className="font-bold text-[14px] text-[#b45309] bg-[#fffbeb] border border-[#fef3c7] px-2 py-0.5 rounded-full leading-none">Orange</div>
              </div>
            </div>
            <div className="bg-white border border-sarathi-line rounded-[10px] p-3.5 flex flex-col justify-center">
              <div className="text-[12.5px] text-sarathi-muted mb-1">Factories Act</div>
              <div className="font-bold text-[15px] text-sarathi-ink leading-none">Applies</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
          
          {/* Main List */}
          <div>
            <h1 className="font-serif font-bold text-[26px] text-sarathi-ink tracking-[-0.2px] mb-5">
              Approvals you need
            </h1>
            
            <Accordion className="space-y-3" defaultValue={["bis"]}>
              {approvals.map((app) => (
                <AccordionItem value={app.id} key={app.id} className="bg-white border border-sarathi-line rounded-[12px] overflow-hidden data-[state=open]:border-sarathi-blue-600 transition-colors">
                  <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-sarathi-blue-050 transition-colors [&[data-state=open]]:bg-sarathi-blue-050">
                    <div className="flex items-center justify-between w-full pr-4 text-left">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-[#f4f6f9] border border-sarathi-line flex items-center justify-center shrink-0">
                          <app.icon className="w-5 h-5 text-sarathi-blue" />
                        </div>
                        <div>
                          <div className="font-bold text-[16px] text-sarathi-ink">{app.name}</div>
                          <div className="text-[13.5px] text-sarathi-muted mt-0.5">{app.dept}</div>
                        </div>
                      </div>
                      <div className="hidden sm:flex items-center gap-1.5 text-[13px] font-semibold text-sarathi-muted shrink-0 bg-sarathi-page px-2.5 py-1.5 rounded-md border border-sarathi-line">
                        <Clock className="w-3.5 h-3.5" />
                        {app.timeline}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-5 pb-5 pt-2 border-t border-sarathi-line">
                    <div className="pt-3">
                      <div className="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-sarathi-green bg-sarathi-green-050 border border-[#bbf7d0] px-3 py-1 rounded-full mb-5">
                        <Shield className="w-3.5 h-3.5" />
                        Required under {app.law}
                      </div>
                      
                      <div className="mb-6">
                        <div className="text-[13px] font-bold text-sarathi-ink mb-2">Documents needed</div>
                        <div className="flex flex-wrap gap-2">
                          {app.docs.map(doc => {
                            const isOnFile = ON_FILE_DOCS.includes(doc);
                            return (
                              <div key={doc} className={`inline-flex items-center gap-1.5 text-[13px] px-2.5 py-1.5 rounded-md border ${isOnFile ? 'bg-[#f0f9ff] border-[#bae6fd] text-[#0284c7]' : 'bg-sarathi-page border-sarathi-line text-sarathi-ink'}`}>
                                {isOnFile ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <FileText className="w-3.5 h-3.5 text-sarathi-faint shrink-0" />}
                                {doc}
                                {isOnFile && <span className="text-[11px] font-semibold opacity-70 ml-0.5">(on file)</span>}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <Link href={`/apply/${app.id}`} className="inline-flex items-center justify-center gap-1.5 bg-sarathi-blue hover:bg-sarathi-blue-700 text-white font-semibold text-[14.5px] h-10 px-5 rounded-[8px] transition-colors">
                          Apply now
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                        <button className="inline-flex items-center gap-1.5 text-[14px] font-medium text-sarathi-blue hover:underline">
                          View form <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6 lg:mt-[52px]">
            
            <Card className="border-sarathi-line shadow-sm rounded-[12px] overflow-hidden">
              <div className="bg-sarathi-page border-b border-sarathi-line px-5 py-3 font-semibold text-[14.5px] text-sarathi-ink flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-sarathi-blue" />
                Documents on file
              </div>
              <CardContent className="p-5">
                <p className="text-[13px] text-sarathi-muted mb-4 leading-relaxed">
                  These documents are securely stored in your DigiLocker and will be automatically reused across all forms.
                </p>
                <div className="space-y-2.5">
                  {ON_FILE_DOCS.filter(d => d !== "ID proof").map(doc => (
                    <div key={doc} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-[18px] h-[18px] text-sarathi-green shrink-0 mt-0.5" />
                      <div>
                        <div className="text-[14px] font-semibold text-sarathi-ink">{doc}</div>
                        <div className="text-[12px] text-sarathi-muted">Verified</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-sarathi-amber-050 shadow-sm rounded-[12px] overflow-hidden bg-[#fffdfa]">
              <div className="bg-[#fef9f0] border-b border-[#fcefd8] px-5 py-3 font-semibold text-[#b45309] flex items-center gap-2">
                <span className="text-[16px] leading-none">✨</span>
                Incentives you may qualify for
              </div>
              <CardContent className="p-5">
                <div className="space-y-3.5">
                  {["Capital Investment Subsidy", "Stamp Duty Reimbursement", "Power Cost Reimbursement"].map(inc => (
                    <div key={inc} className="flex items-start gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] shrink-0 mt-1.5" />
                      <div className="text-[14px] font-medium text-sarathi-ink leading-snug">{inc}</div>
                    </div>
                  ))}
                </div>
                <button className="mt-5 text-[13px] font-semibold text-sarathi-blue hover:underline">
                  View T-IDEA scheme details &rarr;
                </button>
              </CardContent>
            </Card>

          </div>
        </div>

      </div>
    </div>
  );
}
