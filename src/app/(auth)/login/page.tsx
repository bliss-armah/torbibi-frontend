'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { LoginForm } from '@/features/auth/components/LoginForm';

function LoginContent() {
  const searchParams = useSearchParams();
  const from = searchParams.get('from');
  const redirectTo = from && from.startsWith('/') ? from : '/dashboard';

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">Torbibi</h1>
          <p className="mt-2 text-gray-600">Sign in to your account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <LoginForm redirectTo={redirectTo} />
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          New here? Just enter your number — we&apos;ll create your account automatically.
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
