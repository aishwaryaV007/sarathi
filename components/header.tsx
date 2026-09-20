import Link from "next/link";

export function Header() {
  return (
    <>
      {/* Top Utility Bar */}
      <div className="bg-sarathi-blue-700 text-[#cfe0f2] text-[12.5px]">
        <div className="max-w-[1120px] mx-auto px-6 flex justify-between items-center h-[34px]">
          <span>
            Government of India · Ease of Doing Business initiative <span className="opacity-60">(prototype)</span>
          </span>
          <div className="flex gap-[18px] items-center">
            <Link href="#" className="text-[#dbe9f7] hover:text-white transition-colors">Screen Reader</Link>
            <Link href="#" className="text-[#dbe9f7] hover:text-white transition-colors">Help</Link>
            <div className="flex gap-0.5 items-center" aria-label="language">
              <button className="text-white bg-white/14 font-semibold px-[6px] py-[2px] rounded md">EN</button>
              <button className="text-[#a9c4e0] px-[6px] py-[2px] rounded md hover:text-white transition-colors">हिं</button>
              <button className="text-[#a9c4e0] px-[6px] py-[2px] rounded md hover:text-white transition-colors">తెలుగు</button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="bg-white border-b border-sarathi-line sticky top-0 z-40">
        <div className="max-w-[1120px] mx-auto px-6 flex items-center justify-between h-[76px] gap-6">
          <Link href="/" className="flex items-center gap-[13px] hover:opacity-90 transition-opacity">
            <svg className="w-[44px] h-[44px] shrink-0" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <rect x="3" y="3" width="42" height="42" rx="10" fill="#16437e" />
              <path d="M16 24.5l5.2 5.2L33 18" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M24 8.5c5 2.4 9 3 12 3v9c0 8-5.4 13.2-12 16-6.6-2.8-12-8-12-16v-9c3 0 7-.6 12-3z" stroke="#8fb4e0" strokeWidth="1.6" opacity=".7" />
            </svg>
            <div>
              <div className="font-serif font-bold text-[22px] tracking-[-0.2px] text-sarathi-blue leading-none">Sarathi</div>
              <div className="text-[11.5px] text-sarathi-muted mt-[3px] tracking-[0.02em]">Business Approval & Compliance Assistant</div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <Link href="/" className="text-sarathi-blue font-semibold bg-sarathi-blue-050 text-[15px] px-[14px] py-[9px] rounded-[7px]">Home</Link>
            <Link href="/dashboard" className="text-sarathi-ink font-medium text-[15px] px-[14px] py-[9px] rounded-[7px] hover:bg-sarathi-blue-050 hover:text-sarathi-blue transition-colors">Track Applications</Link>
            <Link href="#" className="text-sarathi-ink font-medium text-[15px] px-[14px] py-[9px] rounded-[7px] hover:bg-sarathi-blue-050 hover:text-sarathi-blue transition-colors">Schemes</Link>
            <Link href="#" className="text-sarathi-ink font-medium text-[15px] px-[14px] py-[9px] rounded-[7px] hover:bg-sarathi-blue-050 hover:text-sarathi-blue transition-colors">Guide</Link>
          </nav>

          <div className="flex items-center gap-[10px]">
            <span className="text-[11px] font-bold text-sarathi-amber bg-sarathi-amber-050 border border-[#f0dcb8] px-[9px] py-[3px] rounded-full tracking-[0.03em]">SIH 2026 · Prototype</span>
            <Link href="/login" className="hidden sm:inline-flex items-center justify-center border-[1.5px] border-sarathi-line-strong text-sarathi-blue font-semibold px-[18px] py-[10px] rounded-[8px] hover:border-sarathi-blue hover:bg-sarathi-blue-050 transition-colors">
              Login
            </Link>
          </div>
        </div>
      </header>
    </>
  );
}
