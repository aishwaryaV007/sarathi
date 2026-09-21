"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, FileText, Eye, Upload, Plus, Clock, Loader2 } from "lucide-react";

type DocStatus = "Verified" | "Pending";

interface VaultDocument {
  name: string;
  status: DocStatus;
  source: string;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<VaultDocument[]>([
    { name: "PAN Card", status: "Verified", source: "DigiLocker" },
    { name: "Aadhaar Card", status: "Verified", source: "DigiLocker" },
    { name: "Bank Account Proof", status: "Pending", source: "Upload required" },
    { name: "Premises Proof", status: "Pending", source: "Upload required" },
  ]);

  const [isUploading, setIsUploading] = useState<string | null>(null);

  const handleSimulatedUpload = (docName: string) => {
    setIsUploading(docName);
    
    // Simulate network upload delay
    setTimeout(() => {
      setDocuments(docs => 
        docs.map(doc => 
          doc.name === docName 
            ? { ...doc, status: "Verified", source: "Uploaded manually" } 
            : doc
        )
      );
      setIsUploading(null);
    }, 1500);
  };

  return (
    <div className="min-h-[calc(100vh-140px)] py-11 px-6">
      <div className="max-w-[1120px] mx-auto">
        
        {/* Header */}
        <div className="mb-9">
          <h1 className="font-serif font-bold text-[32px] text-sarathi-ink tracking-[-0.2px] mb-2">
            My Documents Vault
          </h1>
          <p className="text-[16px] text-sarathi-muted">
            Upload once — reused across every single government application.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          
          {documents.map((doc) => (
            <Card key={doc.name} className={`border-sarathi-line shadow-sm rounded-[14px] flex flex-col hover:border-sarathi-blue-100 transition-colors group ${doc.status === 'Pending' ? 'bg-[#fafbfc]' : 'bg-white'}`}>
              <CardContent className="p-5 flex-1 flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-full bg-[#f4f6f9] border border-sarathi-line flex items-center justify-center">
                    <FileText className={`w-5 h-5 ${doc.status === 'Verified' ? 'text-sarathi-blue' : 'text-sarathi-muted'}`} />
                  </div>
                  
                  {doc.status === "Verified" ? (
                    <div className="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-sarathi-green bg-sarathi-green-050 px-2.5 py-1 rounded-md">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Verified
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-[#b85c00] bg-[#fff6ed] px-2.5 py-1 rounded-md">
                      <Clock className="w-3.5 h-3.5" />
                      Pending
                    </div>
                  )}
                </div>
                
                <h3 className="font-bold text-[16px] text-sarathi-ink mb-1.5">
                  {doc.name}
                </h3>
                <div className="text-[13px] text-sarathi-faint mb-5">
                  {doc.source}
                </div>
                
                <div className="mt-auto pt-4 border-t border-sarathi-line flex items-center justify-between">
                  {doc.status === "Verified" ? (
                    <>
                      <button className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-sarathi-blue hover:underline">
                        <Eye className="w-4 h-4" />
                        View File
                      </button>
                      <button className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-sarathi-muted hover:text-sarathi-ink transition-colors">
                        <Upload className="w-4 h-4" />
                        Replace
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={() => handleSimulatedUpload(doc.name)}
                      disabled={isUploading === doc.name}
                      className="inline-flex items-center justify-center gap-1.5 bg-sarathi-blue hover:bg-sarathi-blue-700 text-white text-[13.5px] font-semibold px-4 py-2 rounded-md transition-colors w-full disabled:opacity-70"
                    >
                      {isUploading === doc.name ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          Upload Document
                        </>
                      )}
                    </button>
                  )}
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
              Add New Document
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
