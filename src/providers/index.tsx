'use client';

import type { ReactNode } from 'react';
import { QueryProvider } from './QueryProvider';
import { UserProvider } from './UserProvider';
import { DemoBanner } from '@/components/common';

/** All client-side context providers, composed for the root layout. */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <UserProvider>
        {children}
        <DemoBanner />
      </UserProvider>
    </QueryProvider>
  );
}
