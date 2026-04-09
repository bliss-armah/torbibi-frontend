'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { shopApi } from '@/lib/api/shop.api';

const STAT_CARDS = [
  { label: 'Orders today', value: '—' },
  { label: 'Revenue today', value: '—' },
  { label: 'Total products', value: '—' },
  { label: 'Pending orders', value: '—' },
];

export default function DashboardPage() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    shopApi
      .getMyShops()
      .then((shops) => {
        if (shops.length === 0) {
          router.replace('/onboarding');
        } else {
          setChecked(true);
        }
      })
      .catch(() => setChecked(true)); // on error, show dashboard (don't loop)
  }, [router]);

  if (!checked) return null; // brief flash before redirect or render

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-foreground mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {STAT_CARDS.map((card) => (
          <div
            key={card.label}
            className="bg-card rounded-xl border border-border p-4 shadow-sm"
          >
            <p className="text-sm text-muted-foreground">{card.label}</p>
            <p className="text-2xl font-bold text-foreground mt-1">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground mb-4">Recent orders</h2>
        <p className="text-muted-foreground text-sm">No orders yet.</p>
      </div>
    </div>
  );
}
