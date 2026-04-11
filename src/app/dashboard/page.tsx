'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { shopApi } from '@/lib/api/shop.api';
import { orderApi } from '@/lib/api/order.api';
import { productApi } from '@/lib/api/product.api';
import { Order } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice, formatDate } from '@/lib/utils/format';

interface Stats {
  ordersToday: number;
  revenueToday: number;
  totalProducts: number;
  pendingOrders: number;
}

const STATUS_COLORS: Record<string, string> = {
  pending:    'bg-yellow-100 text-yellow-700',
  confirmed:  'bg-blue-100 text-blue-700',
  processing: 'bg-purple-100 text-purple-700',
  shipped:    'bg-indigo-100 text-indigo-700',
  delivered:  'bg-green-100 text-green-700',
  cancelled:  'bg-red-100 text-red-700',
  refunded:   'bg-gray-100 text-gray-600',
};

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({ ordersToday: 0, revenueToday: 0, totalProducts: 0, pendingOrders: 0 });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const shops = await shopApi.getMyShops();
        if (shops.length === 0) {
          router.replace('/onboarding');
          return;
        }

        const shop = shops[0];
        const today = new Date().toDateString();

        const [ordersResult, pendingResult, productsResult] = await Promise.all([
          orderApi.listForShop(shop.id, { limit: 100 }),
          orderApi.listForShop(shop.id, { status: 'pending', limit: 1 }),
          productApi.listDashboard(shop.id, { limit: 1 }),
        ]);

        const orders = ordersResult.data;

        const todayOrders = orders.filter(
          (o) => o.createdAt && new Date(o.createdAt).toDateString() === today
        );

        const revenueToday = todayOrders
          .filter((o) => o.paymentStatus === 'paid')
          .reduce((sum, o) => sum + o.total, 0);

        setStats({
          ordersToday: todayOrders.length,
          revenueToday,
          totalProducts: productsResult.total,
          pendingOrders: pendingResult.total,
        });

        setRecentOrders(orders.slice(0, 5));
      } catch {
        // keep default zeroes — don't block the page
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [router]);

  if (loading) {
    return (
      <div className="p-6">
        <Skeleton className="h-8 w-36 mb-6" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-card rounded-xl border border-border p-4 shadow-sm">
              <Skeleton className="h-4 w-28 mb-3" />
              <Skeleton className="h-7 w-16" />
            </div>
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  const statCards = [
    { label: 'Orders today',   value: String(stats.ordersToday) },
    { label: 'Revenue today',  value: formatPrice(stats.revenueToday) },
    { label: 'Total products', value: String(stats.totalProducts) },
    { label: 'Pending orders', value: String(stats.pendingOrders) },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-foreground mb-6">Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => (
          <div key={card.label} className="bg-card rounded-xl border border-border p-4 shadow-sm">
            <p className="text-sm text-muted-foreground">{card.label}</p>
            <p className="text-2xl font-bold text-foreground mt-1">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Recent orders */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Recent orders</h2>
        </div>

        {recentOrders.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-muted-foreground">No orders yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {recentOrders.map((order) => (
              <div key={order.id} className="px-6 py-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{order.orderNumber}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {order.customerPhone} &middot; {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                    {order.createdAt ? ` · ${formatDate(order.createdAt)}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-600'}`}
                  >
                    {order.status}
                  </span>
                  <span className="text-sm font-semibold text-foreground tabular-nums">
                    {formatPrice(order.total)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
