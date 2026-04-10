'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Home, Loader2 } from 'lucide-react';
import { orderApi } from '@/lib/api/order.api';
import { Order } from '@/types';
import { formatPrice } from '@/lib/utils/format';
import { Button } from '@/components/ui/Button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

const PAYMENT_STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  paid: 'Paid',
  failed: 'Failed',
  refunded: 'Refunded',
};

interface Props {
  params: { orderId: string };
}

function OrderDetail({ orderId }: { orderId: string }) {
  const searchParams = useSearchParams();
  const shopSlug = searchParams.get('shop');

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    orderApi.getOne(orderId)
      .then(setOrder)
      .catch((err) => setError(err?.message ?? 'Could not load order'))
      .finally(() => setLoading(false));
  }, [orderId]);

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      {/* Back */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/orders/my"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          My orders
        </Link>
      </div>

      <h1 className="text-xl font-bold mb-6">
        {order ? `Order #${order.orderNumber}` : 'Order details'}
      </h1>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-5 w-1/2" />
        </div>
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : order ? (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            <Badge variant="secondary">{STATUS_LABEL[order.status] ?? order.status}</Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Payment</span>
            <Badge variant={order.paymentStatus === 'paid' ? 'default' : 'outline'}>
              {PAYMENT_STATUS_LABEL[order.paymentStatus] ?? order.paymentStatus}
            </Badge>
          </div>

          <Separator />

          <div className="space-y-2">
            {order.items.map((item) => (
              <div key={item.productId} className="flex justify-between text-sm">
                <span className="text-foreground truncate flex-1">
                  {item.productName}
                  <span className="text-muted-foreground"> ×{item.quantity}</span>
                </span>
                <span className="font-medium shrink-0">{formatPrice(item.totalPrice)}</span>
              </div>
            ))}
          </div>

          <Separator />

          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            {order.deliveryFee > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery fee</span>
                <span>{formatPrice(order.deliveryFee)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold pt-1">
              <span>Total</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>

          <Separator />

          <div>
            <p className="text-sm font-medium text-foreground mb-1">Delivery to</p>
            <p className="text-sm text-muted-foreground">{order.shippingAddress.recipientName}</p>
            <p className="text-sm text-muted-foreground">{order.shippingAddress.phone}</p>
            <p className="text-sm text-muted-foreground">
              {[order.shippingAddress.area, order.shippingAddress.city, order.shippingAddress.region]
                .filter(Boolean).join(', ')}
            </p>
            {order.shippingAddress.digitalAddress && (
              <p className="text-sm text-muted-foreground">
                GPS: {order.shippingAddress.digitalAddress}
              </p>
            )}
          </div>

          {order.notes && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-medium text-foreground mb-1">Notes</p>
                <p className="text-sm text-muted-foreground">{order.notes}</p>
              </div>
            </>
          )}
        </div>
      ) : null}

      {shopSlug && (
        <Button asChild variant="ghost" className="mt-6 gap-2 w-full">
          <Link href={`/${shopSlug}`}>
            <Home className="h-4 w-4" />
            Back to home
          </Link>
        </Button>
      )}
    </div>
  );
}

export default function OrderDetailPage({ params }: Props) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <OrderDetail orderId={params.orderId} />
    </Suspense>
  );
}
