'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { ChevronLeft, ShoppingBag } from 'lucide-react';
import { useCart } from '@/features/cart/hooks/useCart';
import { useAppSelector } from '@/store';
import { selectCartTotal } from '@/store/slices/cartSlice';
import { orderApi } from '@/lib/api/order.api';
import { formatPrice } from '@/lib/utils/format';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

const GHANA_REGIONS = [
  'Ahafo', 'Ashanti', 'Bono', 'Bono East', 'Central', 'Eastern',
  'Greater Accra', 'North East', 'Northern', 'Oti', 'Savannah',
  'Upper East', 'Upper West', 'Volta', 'Western', 'Western North',
];

const shippingSchema = z.object({
  recipientName: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().regex(/^(\+233|0)[2-9]\d{8}$/, 'Enter a valid Ghana phone number'),
  region: z.string().min(1, 'Select a region'),
  city: z.string().min(1, 'City is required'),
  area: z.string().optional(),
  digitalAddress: z.string().optional(),
  notes: z.string().optional(),
});

type ShippingFormValues = z.infer<typeof shippingSchema>;

interface Props {
  params: { shopSlug: string };
}

export default function CheckoutPage({ params }: Props) {
  const { shopSlug } = params;
  const router = useRouter();
  const { items, shopId, clearCart } = useCart();
  const subtotal = useAppSelector(selectCartTotal);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ShippingFormValues>({
    resolver: zodResolver(shippingSchema),
    defaultValues: { recipientName: '', phone: '', region: '', city: '', area: '', digitalAddress: '', notes: '' },
  });

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <ShoppingBag className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
        <h2 className="text-lg font-semibold mb-2">Your cart is empty</h2>
        <p className="text-sm text-muted-foreground mb-6">Add some products before checking out.</p>
        <Button asChild variant="outline">
          <Link href={`/${shopSlug}`}>Back to home</Link>
        </Button>
      </div>
    );
  }

  async function onSubmit(values: ShippingFormValues) {
    if (!shopId) return;
    setSubmitting(true);
    setError(null);

    try {
      const result = await orderApi.create(shopId, {
        items: items.map(({ product, quantity }) => ({ productId: product.id, quantity })),
        shippingAddress: {
          recipientName: values.recipientName,
          phone: values.phone,
          region: values.region,
          city: values.city,
          area: values.area || undefined,
          digitalAddress: values.digitalAddress || undefined,
        },
        notes: values.notes || undefined,
      });

      clearCart();
      router.push(
        `/${shopSlug}/checkout/confirmation?orderId=${result.order.id}&orderNumber=${encodeURIComponent(result.order.orderNumber)}`
      );
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Failed to place order. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <Link
        href={`/${shopSlug}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to home
      </Link>

      <h1 className="text-2xl font-bold mb-6">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Shipping form */}
        <div className="lg:col-span-3">
          <h2 className="text-base font-semibold mb-4">Delivery details</h2>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="recipientName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full name</FormLabel>
                    <FormControl><Input placeholder="Kofi Mensah" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone number</FormLabel>
                    <FormControl><Input placeholder="0244123456" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="region"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Region</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select region" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {GHANA_REGIONS.map((r) => (
                            <SelectItem key={r} value={r}>{r}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City / Town</FormLabel>
                      <FormControl><Input placeholder="Accra" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="area"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Area / Neighbourhood{' '}
                      <span className="text-muted-foreground font-normal">(optional)</span>
                    </FormLabel>
                    <FormControl><Input placeholder="East Legon" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="digitalAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Ghana Post GPS{' '}
                      <span className="text-muted-foreground font-normal">(optional)</span>
                    </FormLabel>
                    <FormControl><Input placeholder="GA-123-4567" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Order notes{' '}
                      <span className="text-muted-foreground font-normal">(optional)</span>
                    </FormLabel>
                    <FormControl>
                      <textarea
                        rows={3}
                        placeholder="Any special instructions for your order..."
                        className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? 'Placing order…' : `Place order · ${formatPrice(subtotal)}`}
              </Button>
            </form>
          </Form>
        </div>

        {/* Order summary */}
        <div className="lg:col-span-2">
          <h2 className="text-base font-semibold mb-4">Order summary</h2>
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            {items.map(({ product, quantity }) => (
              <div key={product.id} className="flex justify-between gap-2 text-sm">
                <span className="text-foreground truncate flex-1">
                  {product.name}
                  <span className="text-muted-foreground"> ×{quantity}</span>
                </span>
                <span className="font-medium shrink-0">{formatPrice(product.price * quantity)}</span>
              </div>
            ))}

            <Separator />

            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Delivery fee</span>
              <span className="text-muted-foreground">To be confirmed</span>
            </div>

            <Separator />

            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <p className="text-xs text-muted-foreground">Delivery fee will be confirmed by the seller</p>
          </div>
        </div>
      </div>
    </div>
  );
}
