import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, FileText, Eye, Upload, Plus } from "lucide-react";

export default function DocumentsPage() {
  const documents = [
    { name: "PAN Card", status: "Verified" },
    { name: "Aadhaar Card", status: "Verified" },
    { name: "Bank Account Proof", status: "Verified" },
    { name: "Premises Proof", status: "Verified" },
    { name: "Passport Photo", status: "Verified" },
  ];

  return (
    <div className="min-h-[calc(100vh-140px)] py-11 px-6">
      <div className="max-w-[1120px] mx-auto">
        
        {/* Header */}
        <div className="mb-9">
          <h1 className="font-serif font-bold text-[32px] text-sarathi-ink tracking-[-0.2px] mb-2">
            My Documents
          </h1>
          <p className="text-[16px] text-sarathi-muted">
            Upload once — reused across every application.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          
          {/* Uploaded Documents */}
          {documents.map((doc) => (
            <Card key={doc.name} className="border-sarathi-line shadow-sm rounded-[14px] flex flex-col hover:border-sarathi-blue-100 transition-colors group">
              <CardContent className="p-5 flex-1 flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-full bg-[#f4f6f9] border border-sarathi-line flex items-center justify-center">
                    <FileText className="w-5 h-5 text-sarathi-blue" />
                  </div>
                  <div className="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-sarathi-green bg-sarathi-green-050 px-2.5 py-1 rounded-md">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {doc.status}
                  </div>
                </div>
                
                <h3 className="font-bold text-[16px] text-sarathi-ink mb-1.5">
                  {doc.name}
                </h3>
                <div className="text-[13px] text-sarathi-faint mb-5">
                  Stored securely in DigiLocker
                </div>
                
                <div className="mt-auto pt-4 border-t border-sarathi-line flex items-center justify-between">
                  <button className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-sarathi-blue hover:underline">
                    <Eye className="w-4 h-4" />
                    View
                  </button>
                  <button className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-sarathi-muted hover:text-sarathi-ink transition-colors">
                    <Upload className="w-4 h-4" />
                    Replace
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Add Document Card */}
          <button className="border-[1.5px] border-dashed border-sarathi-line-strong hover:border-sarathi-blue hover:bg-sarathi-blue-050 rounded-[14px] flex flex-col items-center justify-center p-8 text-center transition-all group min-h-[200px]">
            <div className="w-12 h-12 rounded-full bg-sarathi-page border border-sarathi-line flex items-center justify-center mb-4 group-hover:bg-white group-hover:border-sarathi-blue-100 transition-colors">
              <Plus className="w-6 h-6 text-sarathi-blue" />
            </div>
            <h3 className="font-bold text-[16px] text-sarathi-ink group-hover:text-sarathi-blue transition-colors">
              Add document
            </h3>
            <p className="text-[13.5px] text-sarathi-muted mt-1.5 max-w-[200px]">
              Upload additional proofs to your secure vault
            </p>
          </button>

        </div>
      </div>
    </div>
  );
}
