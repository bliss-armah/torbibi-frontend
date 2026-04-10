import { BuyerLoginForm } from '@/features/auth/components/BuyerLoginForm';
import Link from 'next/link';

interface Props {
  params: { shopSlug: string };
}

export default function BuyerLoginPage({ params }: Props) {
  const { shopSlug } = params;

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground">Sign in to view your orders</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter the phone number you used at checkout
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <BuyerLoginForm redirectTo="/orders/my" />
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          <Link href={`/${shopSlug}`} className="text-primary hover:underline">
            ← Back to shop
          </Link>
        </p>
      </div>
    </main>
  );
}
