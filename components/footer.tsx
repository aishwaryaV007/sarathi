export function Footer() {
  return (
    <footer className="bg-sarathi-blue-700 text-[#c4d6ea] py-9 text-[13.5px]">
      <div className="max-w-[1120px] mx-auto px-6 flex justify-between gap-5 flex-wrap items-center">
        <div>
          <div className="font-serif font-bold text-[18px] text-white mb-1.5">Sarathi</div>
          <div className="max-w-[52ch] leading-[1.6] text-[#a9c4e0]">
            A guided assistant for industrial approvals and compliance. Approval names, departments and statutes shown are illustrative; live submission integrates with official department systems.
          </div>
        </div>
        <div className="text-right text-[12.5px] text-[#a9c4e0] leading-[1.9]">
          Sources: India Code · MSME S.O. 1364(E), 2025<br />
          CPCB categorisation · DigiLocker / API Setu<br />
          Model reference: single-window & guided-journey systems
        </div>
      </div>
    </footer>
  );
}
