"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, FileText, Eye, Upload, Plus, Clock, Loader2 } from "lucide-react";
import { createClient } from "@/lib/db";
import { useLanguage } from "@/lib/i18n/context";

type DocStatus = "Verified" | "Pending";

interface VaultDocument {
  id?: string;
  name: string;
  status: DocStatus;
  source: string;
  file_path?: string;
}

const REQUIRED_DOCS = [
  "PAN Card",
  "Aadhaar Card",
  "Bank Account Proof",
  "Premises Proof",
  "Project report",
  "Site plan"
];

export default function DocumentsPage() {
  const { t } = useLanguage();
  const [documents, setDocuments] = useState<VaultDocument[]>(
    REQUIRED_DOCS.map(name => ({ name, status: "Pending", source: "Upload required" }))
  );
  
  const [isUploading, setIsUploading] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedDocType, setSelectedDocType] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function loadDocuments() {
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("documents")
        .select("*")
        .eq("user_id", user.id);

      if (data) {
        setDocuments(docs => {
          return docs.map(doc => {
            const uploadedDoc = data.find(d => d.doc_type === doc.name);
            if (uploadedDoc) {
              return {
                ...doc,
                id: uploadedDoc.id,
                status: "Verified",
                source: "Uploaded",
                file_path: uploadedDoc.file_path
              };
            }
            return doc;
          });
        });
      }
    }
    loadDocuments();
  }, [supabase]);

  const handleUploadClick = (docName: string) => {
    setSelectedDocType(docName);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedDocType || !supabase) return;
    
    setIsUploading(selectedDocType);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("You must be logged in to upload documents.");
      setIsUploading(null);
      return;
    }

    const filePath = `${user.id}/${Date.now()}_${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file);

    if (uploadError) {
      console.error(uploadError);
      alert("Error uploading file: " + uploadError.message);
      setIsUploading(null);
      return;
    }

    const { error: dbError } = await supabase
      .from('documents')
      .upsert({
        user_id: user.id,
        doc_type: selectedDocType,
        file_path: filePath,
        status: 'verified'
      }, { onConflict: "user_id, doc_type" });

    if (dbError) {
      console.error(dbError);
      alert("Error saving document record: " + dbError.message);
    } else {
      setDocuments(docs => 
        docs.map(doc => 
          doc.name === selectedDocType 
            ? { ...doc, status: "Verified", source: "Uploaded manually", file_path: filePath } 
            : doc
        )
      );
    }
    
    setIsUploading(null);
    setSelectedDocType(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const viewFile = async (filePath?: string) => {
    if (!filePath || !supabase) return;
    const { data, error } = await supabase.storage.from("documents").createSignedUrl(filePath, 60);
    if (error) {
      alert("Could not load file.");
    } else if (data) {
      window.open(data.signedUrl, "_blank");
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] py-11 px-6">
      <div className="max-w-[1120px] mx-auto">
        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          onChange={handleFileChange}
        />
        {/* Header */}
        <div className="mb-9">
          <h1 className="font-serif font-bold text-[32px] text-sarathi-ink tracking-[-0.2px] mb-2">
            {t("documents.title")}
          </h1>
          <p className="text-[16px] text-sarathi-muted">
            {t("documents.subtitle")}
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
                      {t("documents.verified")}
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-[#b85c00] bg-[#fff6ed] px-2.5 py-1 rounded-md">
                      <Clock className="w-3.5 h-3.5" />
                      {t("documents.pending")}
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
                      <button onClick={() => viewFile(doc.file_path)} className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-sarathi-blue hover:underline">
                        <Eye className="w-4 h-4" />
                        {t("documents.viewFile")}
                      </button>
                      <button onClick={() => handleUploadClick(doc.name)} className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-sarathi-muted hover:text-sarathi-ink transition-colors">
                        <Upload className="w-4 h-4" />
                        {t("documents.replace")}
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={() => handleUploadClick(doc.name)}
                      disabled={isUploading === doc.name}
                      className="inline-flex items-center justify-center gap-1.5 bg-sarathi-blue hover:bg-sarathi-blue-700 text-white text-[13.5px] font-semibold px-4 py-2 rounded-md transition-colors w-full disabled:opacity-70"
                    >
                      {isUploading === doc.name ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {t("documents.uploading")}
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          {t("documents.uploadDoc")}
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
              {t("documents.addNew")}
            </h3>
            <p className="text-[13.5px] text-sarathi-muted mt-1.5 max-w-[200px]">
              {t("documents.addNewDesc")}
            </p>
          </button>

        </div>
      </div>
    </div>
  );
}
