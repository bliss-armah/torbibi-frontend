import type { Metadata } from 'next';
import { LoginForm } from '@/features/auth/components/LoginForm';

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to your Torbibi account',
};

/**
 * Login page — Server Component wrapper around the client LoginForm.
 * Keeping the page itself a Server Component means metadata and any
 * server-side data fetching can happen without shipping extra JS.
 */
export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-brand-600">Torbibi</h1>
          <p className="mt-2 text-gray-600">Sign in to your account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          New here? Just enter your number — we&apos;ll create your account automatically.
        </p>
      </div>
    </main>
  );
}
