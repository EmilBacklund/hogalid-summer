'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="sv">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
        <h2 className="text-hogalid-yellow text-2xl font-bold">Något gick fel</h2>
        <p className="text-hogalid-sky">Försök ladda om sidan.</p>
      </body>
    </html>
  );
}
