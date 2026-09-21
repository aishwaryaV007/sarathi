"use client";

import { useLanguage } from "@/lib/i18n/context";

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-sarathi-blue-700 text-[#c4d6ea] py-9 text-[13.5px]">
      <div className="max-w-[1120px] mx-auto px-6 flex justify-between gap-5 flex-wrap items-center">
        <div>
          <div className="font-serif font-bold text-[18px] text-white mb-1.5">{t("footer.brand")}</div>
          <div className="max-w-[52ch] leading-[1.6] text-[#a9c4e0]">
            {t("footer.desc")}
          </div>
        </div>
        <div className="text-right text-[12.5px] text-[#a9c4e0] leading-[1.9]">
          {t("footer.sources")}<br />
          {t("footer.sources2")}<br />
          {t("footer.sources3")}
        </div>
      </div>
    </footer>
  );
}
