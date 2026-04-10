'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, Package, Home, Loader2 } from 'lucide-react';
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
  params: { shopSlug: string };
}

// Inner component — isolated so useSearchParams() is inside <Suspense>
function ConfirmationContent({ shopSlug }: { shopSlug: string }) {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const orderNumber = searchParams.get('orderNumber');

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) { setLoading(false); return; }
    orderApi.getOne(orderId)
      .then(setOrder)
      .catch(() => setError('Could not load order details.'))
      .finally(() => setLoading(false));
  }, [orderId]);

  if (!orderId) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground text-sm">No order found.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href={`/${shopSlug}`}>Back to home</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      {/* Success header */}
      <div className="text-center mb-8">
        <CheckCircle2 className="h-14 w-14 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-foreground">Order placed!</h1>
        {orderNumber && (
          <p className="text-sm text-muted-foreground mt-1">Order #{orderNumber}</p>
        )}
        <p className="text-sm text-muted-foreground mt-2">
          The seller will confirm your order and contact you about delivery.
        </p>
      </div>

      {/* Order details */}
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-5 w-1/2" />
        </div>
      ) : error ? (
        <p className="text-sm text-muted-foreground text-center">{error}</p>
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

      {/* Actions */}
      <div className="mt-6 flex flex-col gap-3">
        <Button asChild variant="outline" className="gap-2">
          <Link href="/orders/my">
            <Package className="h-4 w-4" />
            View my orders
          </Link>
        </Button>
        <Button asChild variant="ghost" className="gap-2">
          <Link href={`/${shopSlug}`}>
            <Home className="h-4 w-4" />
            Back to home
          </Link>
        </Button>
      </div>
    </div>
  );
}

export default function ConfirmationPage({ params }: Props) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <ConfirmationContent shopSlug={params.shopSlug} />
    </Suspense>
  );
}
