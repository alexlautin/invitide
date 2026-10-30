'use client';

import { useSyncExternalStore } from 'react';
import { isDemo, subscribeDemo } from './flag';

/** True when the visitor is in demo mode. Always false during SSR and the first hydration pass. */
export function useDemoMode(): boolean {
  return useSyncExternalStore(subscribeDemo, isDemo, () => false);
}
