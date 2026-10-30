'use client';

import { useSyncExternalStore } from 'react';
import { isDemo, subscribeDemo } from './flag';

export function useDemoMode(): boolean {
  return useSyncExternalStore(subscribeDemo, isDemo, () => false);
}
