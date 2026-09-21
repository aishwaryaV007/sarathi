import { Card, CardContent } from "@/components/ui/card";
import { BadgeIndianRupee, Briefcase, Landmark, ExternalLink, Filter } from "lucide-react";
import Link from "next/link";

export default function SchemesPage() {
  const schemes = [
    {
      id: "pmegp",
      name: "Prime Minister's Employment Generation Programme (PMEGP)",
      department: "Ministry of MSME",
      description: "Credit-linked subsidy program to generate employment opportunities through establishment of micro-enterprises.",
      subsidy: "Up to 35% subsidy",
      maxAmount: "₹50 Lakhs",
      icon: <Briefcase className="w-5 h-5 text-sarathi-blue" />,
      tags: ["Manufacturing", "Services"]
    },
    {
      id: "cgtmse",
      name: "Credit Guarantee Fund Trust for Micro and Small Enterprises",
      department: "Ministry of MSME & SIDBI",
      description: "Collateral-free credit to the micro and small enterprise sector for both term loans and working capital.",
      subsidy: "Credit Guarantee",
      maxAmount: "₹500 Lakhs",
      icon: <Landmark className="w-5 h-5 text-sarathi-blue" />,
      tags: ["All Sectors", "Collateral-Free"]
    },
    {
      id: "standup",
      name: "Stand-Up India Scheme",
      department: "Department of Financial Services",
      description: "Facilitates bank loans for setting up a greenfield enterprise by SC/ST and/or women entrepreneurs.",
      subsidy: "Bank Loan",
      maxAmount: "₹10 Lakhs - ₹1 Crore",
      icon: <BadgeIndianRupee className="w-5 h-5 text-sarathi-blue" />,
      tags: ["Women", "SC/ST", "Greenfield"]
    }
  ];

  return (
    <div className="min-h-[calc(100vh-140px)] py-11 px-6 bg-[#fafbfc]">
      <div className="max-w-[1120px] mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <h1 className="font-serif font-bold text-[36px] text-sarathi-ink tracking-[-0.2px] mb-2">
              Government Schemes & Subsidies
            </h1>
            <p className="text-[17px] text-sarathi-muted max-w-[600px]">
              Discover financial assistance, credit guarantees, and subsidies applicable to your business profile.
            </p>
          </div>
          <button className="inline-flex items-center gap-2 bg-white border border-sarathi-line-strong hover:bg-gray-50 text-sarathi-ink font-semibold px-4 py-2.5 rounded-[8px] transition-colors shadow-sm">
            <Filter className="w-4 h-4" />
            Filter by Sector
          </button>
        </div>

        {/* Schemes Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {schemes.map((scheme) => (
            <Card key={scheme.id} className="border-sarathi-line shadow-sm rounded-[14px] flex flex-col hover:border-sarathi-blue-100 transition-all hover:shadow-md group bg-white">
              <CardContent className="p-6 flex-1 flex flex-col">
                <div className="w-12 h-12 rounded-[10px] bg-sarathi-blue-050 border border-sarathi-blue-100 flex items-center justify-center mb-5">
                  {scheme.icon}
                </div>
                
                <h3 className="font-bold text-[18px] text-sarathi-ink mb-1.5 leading-[1.3] group-hover:text-sarathi-blue transition-colors">
                  {scheme.name}
                </h3>
                <div className="text-[13px] font-semibold text-sarathi-muted mb-4 uppercase tracking-wider">
                  {scheme.department}
                </div>
                
                <p className="text-[14.5px] text-sarathi-faint mb-6 line-clamp-3">
                  {scheme.description}
                </p>

                <div className="flex flex-wrap gap-2 mb-6">
                  {scheme.tags.map(tag => (
                    <span key={tag} className="bg-[#f1f5f9] text-[#475569] text-[12.5px] font-medium px-2.5 py-1 rounded-md">
                      {tag}
                    </span>
                  ))}
                </div>
                
                <div className="mt-auto pt-5 border-t border-sarathi-line grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <div className="text-[12.5px] text-sarathi-muted mb-1">Benefit</div>
                    <div className="font-semibold text-sarathi-ink text-[14.5px]">{scheme.subsidy}</div>
                  </div>
                  <div>
                    <div className="text-[12.5px] text-sarathi-muted mb-1">Max Amount</div>
                    <div className="font-semibold text-sarathi-ink text-[14.5px]">{scheme.maxAmount}</div>
                  </div>
                </div>

                <Link 
                  href="#"
                  className="inline-flex items-center justify-center w-full gap-2 bg-white border-[1.5px] border-sarathi-line-strong hover:border-sarathi-blue hover:text-sarathi-blue text-sarathi-ink font-semibold px-4 py-2.5 rounded-[8px] transition-colors"
                >
                  Check Eligibility
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

      </div>
    </div>
  );
}
