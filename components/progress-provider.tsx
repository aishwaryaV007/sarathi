"use client";

import { AppProgressBar as ProgressBar } from 'next-nprogress-bar';

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ProgressBar
        height="3px"
        color="#16437e"
        options={{ showSpinner: false }}
        shallowRouting
      />
    </>
  );
}
