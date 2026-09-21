import { cookies } from "next/headers";
import { type Locale, LOCALE_LABELS } from "@/lib/i18n/context";
import "./globals.css";
import { Public_Sans, Source_Serif_4 } from "next/font/google";
import { cn } from "@/lib/utils";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { LanguageProvider } from "@/lib/i18n/context";

const publicSans = Public_Sans({ subsets: ["latin"], variable: "--font-public-sans" });
const sourceSerif4 = Source_Serif_4({ subsets: ["latin"], variable: "--font-source-serif-4" });

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const savedLocale = cookieStore.get("sarathi_locale")?.value as Locale | undefined;
  const initialLocale = savedLocale && LOCALE_LABELS[savedLocale] ? savedLocale : "en";

  return (
    <html lang={initialLocale} className={cn(publicSans.variable, sourceSerif4.variable)}>
      <head>
        <title>Sarathi — Business Approval Assistant</title>
        <meta name="description" content="Get every approval to start your business — from one place." />
      </head>
      <body>
        <LanguageProvider initialLocale={initialLocale}>
          <Header />
          {children}
          <Footer />
        </LanguageProvider>
      </body>
    </html>
  );
}
