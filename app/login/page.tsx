'use client';

import { Suspense } from 'react';
import LoginContent from './LoginContent';

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-[#E4DDC4] text-xl text-center mt-20">Loading login...</div>}>
      <LoginContent />
    </Suspense>
  );
}