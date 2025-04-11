import { ReactNode } from 'react';
import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const mod = await import('./metadata');
  return mod.generateMetadata({ params });
}

export default function EventLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}