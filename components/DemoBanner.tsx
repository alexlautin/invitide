'use client';

import { useDemoMode } from '@/lib/demo/useDemoMode';
import { disableDemo } from '@/lib/demo/flag';

export default function DemoBanner() {
  const demo = useDemoMode();
  if (!demo) return null;

  return (
    <div
      role="status"
      className="sticky top-0 z-[1100] flex items-center justify-center gap-3 bg-[#E4DDC4] px-3 py-1 font-mono text-xs text-[#1F1F1F] sm:text-sm"
    >
      <span>Demo mode · sample data</span>
      {/* Full page load on purpose: it also discards the in-memory demo data. */}
      <button
        type="button"
        onClick={() => {
          disableDemo();
          window.location.assign('/');
        }}
        className="underline hover:no-underline"
      >
        Exit demo
      </button>
    </div>
  );
}
