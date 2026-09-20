import type { Metadata } from "next";
import "./globals.css";
import { Public_Sans, Source_Serif_4 } from "next/font/google";
import { cn } from "@/lib/utils";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

const publicSans = Public_Sans({ subsets: ["latin"], variable: "--font-public-sans" });
const sourceSerif4 = Source_Serif_4({ subsets: ["latin"], variable: "--font-source-serif-4" });

export const metadata: Metadata = {
  title: "Sarathi — Business Approval Assistant",
  description: "Get every approval to start your business — from one place.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn(publicSans.variable, sourceSerif4.variable)}>
      <body>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
