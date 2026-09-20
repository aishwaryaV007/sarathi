import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  return (
    <div className="min-h-[calc(100vh-140px)] flex flex-col items-center justify-center p-6">
      <Card className="w-full max-w-[420px] border-sarathi-line shadow-[0_1px_2px_rgba(16,42,79,.08)] rounded-[14px]">
        <CardHeader className="text-center pt-9 pb-6">
          <div className="flex justify-center mb-7">
            {/* Sarathi Logo */}
            <div className="flex items-center gap-[13px]">
              <svg className="w-[44px] h-[44px] shrink-0" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <rect x="3" y="3" width="42" height="42" rx="10" fill="#16437e" />
                <path d="M16 24.5l5.2 5.2L33 18" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M24 8.5c5 2.4 9 3 12 3v9c0 8-5.4 13.2-12 16-6.6-2.8-12-8-12-16v-9c3 0 7-.6 12-3z" stroke="#8fb4e0" strokeWidth="1.6" opacity=".7" />
              </svg>
              <div className="font-serif font-bold text-[24px] tracking-[-0.2px] text-sarathi-blue leading-none">Sarathi</div>
            </div>
          </div>
          <CardTitle className="font-serif text-[28px] font-bold text-sarathi-ink mb-1.5 tracking-[-0.3px]">
            Sign in to Sarathi
          </CardTitle>
          <CardDescription className="text-[15.5px] text-sarathi-muted">
            Your guide through government approvals
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-8 px-8">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2.5">
              <label htmlFor="email" className="font-semibold text-[14.5px] text-sarathi-ink">
                Email address
              </label>
              <Input 
                id="email" 
                type="email" 
                placeholder="name@company.com" 
                className="h-[46px] border-[1.5px] border-sarathi-line-strong rounded-[8px] bg-white px-3.5 text-[15px] focus-visible:ring-0 focus-visible:border-sarathi-blue focus-visible:shadow-[0_0_0_3px_var(--color-sarathi-blue-050)] transition-all"
              />
            </div>
            
            <Link 
              href="/describe" 
              className="inline-flex items-center justify-center bg-sarathi-blue hover:bg-sarathi-blue-700 text-white font-semibold text-[16px] h-[48px] w-full rounded-[8px] transition-colors mt-2"
            >
              Continue
            </Link>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center pb-8 pt-0 px-8">
          <p className="text-[13.5px] text-sarathi-faint text-center">
            New here? You&apos;ll set up your profile after signing in.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
