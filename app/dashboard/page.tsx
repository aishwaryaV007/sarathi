import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Leaf, Building, FileKey, CalendarClock, ArrowRight, HelpCircle, Plus } from "lucide-react";

const applications = [
  {
    id: "fssai",
    name: "FSSAI Licence",
    dept: "FSSAI",
    status: "Approved",
    statusType: "green",
    text: "Cleared",
    progress: 100,
    icon: FileText
  },
  {
    id: "cte",
    name: "Consent to Establish",
    dept: "TSPCB",
    status: "Under review",
    statusType: "blue",
    text: "9 days left in SLA",
    progress: 55,
    icon: Leaf
  },
  {
    id: "factory",
    name: "Factory Licence",
    dept: "Dept. of Factories",
    status: "Action needed",
    statusType: "amber",
    text: "Upload 1 document",
    progress: 80,
    icon: Building
  },
  {
    id: "gst",
    name: "GST Registration",
    dept: "CBIC",
    status: "Under review",
    statusType: "blue",
    text: "4 days left",
    progress: 40,
    icon: FileKey
  }
];

function getStatusStyles(type: string) {
  if (type === "green") return "bg-sarathi-green-050 text-sarathi-green border border-[#bbf7d0]";
  if (type === "amber") return "bg-sarathi-amber-050 text-[#b45309] border border-[#fcefd8]";
  return "bg-sarathi-blue-050 text-sarathi-blue-600 border border-sarathi-blue-100";
}

function getProgressColor(type: string) {
  if (type === "green") return "bg-sarathi-green";
  if (type === "amber") return "bg-[#f59e0b]";
  return "bg-sarathi-blue";
}

export default function DashboardPage() {
  return (
    <div className="min-h-[calc(100vh-140px)] py-11 px-6">
      <div className="max-w-[1120px] mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-9 border-b border-sarathi-line pb-6">
          <div>
            <h1 className="font-serif font-bold text-[32px] text-sarathi-ink tracking-[-0.2px] mb-1.5">
              Application dashboard
            </h1>
            <p className="text-[16px] text-sarathi-muted">
              All your government applications, timelines and renewals in one place.
            </p>
          </div>
          <Link 
            href="/describe" 
            className="inline-flex items-center gap-1.5 bg-sarathi-blue hover:bg-sarathi-blue-700 text-white font-semibold text-[14.5px] h-[44px] px-6 rounded-[8px] transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            New approval
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
          
          {/* Main List */}
          <div className="space-y-4">
            {applications.map((app) => (
              <Card key={app.id} className="border-sarathi-line shadow-sm rounded-[12px] hover:border-sarathi-line-strong transition-colors">
                <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-5">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-full bg-sarathi-page border border-sarathi-line flex items-center justify-center shrink-0">
                      <app.icon className="w-5 h-5 text-sarathi-blue" />
                    </div>
                    <div>
                      <div className="font-bold text-[16px] text-sarathi-ink">{app.name}</div>
                      <div className="text-[13.5px] text-sarathi-muted mt-0.5">{app.dept}</div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col w-full md:w-[260px] shrink-0">
                    <div className="flex items-center justify-between w-full mb-2">
                      <span className={`text-[12px] font-bold px-2.5 py-0.5 rounded-full ${getStatusStyles(app.statusType)}`}>
                        {app.status}
                      </span>
                      <span className="text-[13px] font-semibold text-sarathi-muted">
                        {app.text}
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full h-2 rounded-full bg-sarathi-page border border-sarathi-line-strong/50 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${getProgressColor(app.statusType)}`}
                        style={{ width: `${app.progress}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            
            {/* Upcoming Renewals Card */}
            <Card className="border-sarathi-line shadow-sm rounded-[12px] overflow-hidden">
              <div className="bg-sarathi-page border-b border-sarathi-line px-5 py-3.5 font-semibold text-[14.5px] text-sarathi-ink flex items-center gap-2">
                <CalendarClock className="w-[18px] h-[18px] text-sarathi-blue" />
                Upcoming renewals
              </div>
              <CardContent className="p-5">
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3 pb-4 border-b border-sarathi-line">
                    <div>
                      <div className="text-[14px] font-semibold text-sarathi-ink">Consent to Operate</div>
                      <div className="text-[12.5px] text-sarathi-muted mt-0.5">TSPCB</div>
                    </div>
                    <div className="text-[12px] font-bold text-sarathi-amber bg-sarathi-amber-050 border border-[#f0dcb8] px-2 py-0.5 rounded text-center shrink-0">
                      8 months
                    </div>
                  </div>
                  
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[14px] font-semibold text-sarathi-ink">Fire NOC</div>
                      <div className="text-[12.5px] text-sarathi-muted mt-0.5">Disaster Response & Fire Dept</div>
                    </div>
                    <div className="text-[12px] font-bold text-sarathi-muted bg-sarathi-page border border-sarathi-line px-2 py-0.5 rounded text-center shrink-0">
                      11 months
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Need Help Card */}
            <Card className="border-sarathi-blue-100 shadow-sm rounded-[12px] overflow-hidden bg-sarathi-blue-050">
              <CardContent className="p-5 flex flex-col items-start">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center mb-4 shadow-sm">
                  <HelpCircle className="w-5 h-5 text-sarathi-blue-600" />
                </div>
                <h3 className="font-bold text-[16px] text-sarathi-ink mb-1.5">Need help?</h3>
                <p className="text-[13.5px] text-sarathi-muted mb-5 leading-relaxed">
                  Stuck on an application? Our government liaison officers can guide you through the process.
                </p>
                <button className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-sarathi-blue-700 bg-white border border-sarathi-blue-100 hover:border-sarathi-blue px-4 py-2 rounded-[8px] transition-colors w-full justify-center shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                  Contact Support
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
}
