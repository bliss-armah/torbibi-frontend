'use client';

import { useEffect } from 'react';

export default function StorefrontError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Storefront error]', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-foreground mb-2">Something went wrong</h2>
        <p className="text-sm text-muted-foreground mb-4">{error.message}</p>
        <button
          onClick={reset}
          className="text-sm text-primary hover:underline"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
