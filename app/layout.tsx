"use client";

import "./globals.css";
import { Public_Sans, Source_Serif_4 } from "next/font/google";
import { cn } from "@/lib/utils";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { LanguageProvider } from "@/lib/i18n/context";

const publicSans = Public_Sans({ subsets: ["latin"], variable: "--font-public-sans" });
const sourceSerif4 = Source_Serif_4({ subsets: ["latin"], variable: "--font-source-serif-4" });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn(publicSans.variable, sourceSerif4.variable)}>
      <head>
        <title>Sarathi — Business Approval Assistant</title>
        <meta name="description" content="Get every approval to start your business — from one place." />
      </head>
      <body>
        <LanguageProvider>
          <Header />
          {children}
          <Footer />
        </LanguageProvider>
      </body>
    </html>
  );
}
