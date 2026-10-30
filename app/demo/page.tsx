'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { enableDemo } from '@/lib/demo/flag';

export default function DemoEntry() {
  const router = useRouter();

  useEffect(() => {
    enableDemo();
    router.replace('/my-events');
  }, [router]);

  return (
    <main className="min-h-screen flex items-center justify-center text-[#E4DDC4] font-mono text-2xl">
      Loading demo...
    </main>
  );
}
