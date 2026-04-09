'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { shopApi } from '@/lib/api/shop.api';
import { paymentApi, MomoNetwork } from '@/lib/api/payment.api';
import { Shop } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const shopDetailsSchema = z.object({
  name: z.string().min(2, 'Shop name must be at least 2 characters'),
  description: z.string().optional(),
  phone: z
    .string()
    .regex(/^(\+233|0)(2[034567]|5[045679])\d{7}$/, 'Enter a valid Ghanaian phone number'),
});

const payoutSchema = z
  .object({
    type: z.enum(['mobile_money', 'ghipss']),
    accountName: z.string().min(2, 'Account name is required'),
    accountNumber: z.string().min(1, 'Account number is required'),
    bankCode: z.string().min(1, 'Required'),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'mobile_money') {
      if (!/^(\+233|0)(2[034567]|5[045679])\d{7}$/.test(data.accountNumber)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Enter a valid Ghanaian phone number',
          path: ['accountNumber'],
        });
      }
      if (!['MTN', 'ATL', 'VOD'].includes(data.bankCode)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Select a valid network',
          path: ['bankCode'],
        });
      }
    }
  });

type ShopDetailsValues = z.infer<typeof shopDetailsSchema>;
type PayoutValues = z.infer<typeof payoutSchema>;

// ─── Component ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [shop, setShop] = useState<Shop | null>(null);
  const [loadingState, setLoadingState] = useState<'loading' | 'ready' | 'no-shop' | 'error'>(
    'loading'
  );

  // Shop details form
  const shopForm = useForm<ShopDetailsValues>({
    resolver: zodResolver(shopDetailsSchema),
    defaultValues: { name: '', description: '', phone: '' },
  });

  // Payout form
  const payoutForm = useForm<PayoutValues>({
    resolver: zodResolver(payoutSchema),
    defaultValues: { type: 'mobile_money', accountName: '', accountNumber: '', bankCode: 'MTN' },
  });

  const payoutType = payoutForm.watch('type');

  useEffect(() => {
    async function load() {
      try {
        const shops = await shopApi.getMyShops();
        const s = shops[0];
        if (!s) {
          setLoadingState('no-shop');
          return;
        }
        setShop(s);
        shopForm.reset({ name: s.name, description: s.description ?? '', phone: s.phone });

        const recipient = await paymentApi.getRecipient(s.id).catch(() => null);
        if (recipient) {
          payoutForm.reset({
            type: recipient.type as 'mobile_money' | 'ghipss',
            accountName: recipient.accountName,
            accountNumber: recipient.accountNumber,
            bankCode: recipient.bankCode,
          });
        }

        setLoadingState('ready');
      } catch {
        setLoadingState('error');
      }
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSaveShopDetails(values: ShopDetailsValues) {
    if (!shop) return;
    try {
      const updated = await shopApi.update(shop.id, values);
      setShop(updated);
      shopForm.reset(values); // clears isDirty; isSubmitSuccessful stays true briefly
    } catch (err: unknown) {
      const msg =
        (err as { message?: string })?.message ?? 'Failed to save. Please try again.';
      shopForm.setError('root', { message: msg });
    }
  }

  async function onSavePayout(values: PayoutValues) {
    if (!shop) return;
    try {
      await paymentApi.registerRecipient(shop.id, {
        type: values.type,
        accountName: values.accountName,
        accountNumber: values.accountNumber,
        bankCode: values.bankCode as MomoNetwork,
      });
      payoutForm.reset(values);
    } catch (err: unknown) {
      const msg =
        (err as { message?: string })?.message ?? 'Failed to save. Please try again.';
      payoutForm.setError('root', { message: msg });
    }
  }

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (loadingState === 'loading') {
    return (
      <div className="p-6 max-w-2xl space-y-6">
        <Skeleton className="h-8 w-32" />
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-28" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (loadingState === 'no-shop') {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">
          You don&apos;t have a shop yet. Create one to access settings.
        </p>
      </div>
    );
  }

  if (loadingState === 'error') {
    return (
      <div className="p-6">
        <p className="text-destructive">Failed to load settings. Please refresh the page.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Settings</h1>

      <div className="max-w-2xl space-y-6">
        {/* ── Shop details ──────────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Shop details</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...shopForm}>
              <form
                onSubmit={shopForm.handleSubmit(onSaveShopDetails)}
                className="space-y-4"
              >
                <FormField
                  control={shopForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shop name</FormLabel>
                      <FormControl>
                        <Input placeholder="My Shop" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={shopForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <textarea
                          rows={3}
                          placeholder="Tell customers about your shop"
                          className={cn(
                            'flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
                          )}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={shopForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone number</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="0XX XXX XXXX" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={shopForm.formState.isSubmitting}>
                  {shopForm.formState.isSubmitting ? 'Saving…' : 'Save changes'}
                </Button>

                {shopForm.formState.errors.root && (
                  <p className="text-sm text-destructive">
                    {shopForm.formState.errors.root.message}
                  </p>
                )}
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* ── Payout account ────────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payout account</CardTitle>
            <CardDescription>
              Where we send your earnings after each sale. Torbibi retains a small platform
              commission.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...payoutForm}>
              <form
                onSubmit={payoutForm.handleSubmit(onSavePayout)}
                className="space-y-4"
              >
                <FormField
                  control={payoutForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account type</FormLabel>
                      <Select
                        onValueChange={(val) => {
                          field.onChange(val);
                          payoutForm.setValue(
                            'bankCode',
                            val === 'mobile_money' ? 'MTN' : ''
                          );
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="mobile_money">Mobile Money</SelectItem>
                          <SelectItem value="ghipss">Bank transfer (GhIPSS)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {payoutType === 'mobile_money' && (
                  <FormField
                    control={payoutForm.control}
                    name="bankCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Network</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select network" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="MTN">MTN Mobile Money</SelectItem>
                            <SelectItem value="ATL">AirtelTigo Money</SelectItem>
                            <SelectItem value="VOD">Vodafone Cash</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {payoutType === 'ghipss' && (
                  <FormField
                    control={payoutForm.control}
                    name="bankCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bank code</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. GCB" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={payoutForm.control}
                  name="accountNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {payoutType === 'mobile_money' ? 'Wallet number' : 'Account number'}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={
                            payoutType === 'mobile_money' ? '0XX XXX XXXX' : 'Account number'
                          }
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={payoutForm.control}
                  name="accountName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account name</FormLabel>
                      <FormControl>
                        <Input placeholder="Full name on account" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={payoutForm.formState.isSubmitting}>
                  {payoutForm.formState.isSubmitting ? 'Saving…' : 'Save payout account'}
                </Button>

                {payoutForm.formState.errors.root && (
                  <p className="text-sm text-destructive">
                    {payoutForm.formState.errors.root.message}
                  </p>
                )}
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* ── Danger zone ───────────────────────────────────────────────────── */}
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="text-base text-destructive">Danger zone</CardTitle>
            <CardDescription>
              Permanently delete your shop and all its data. This cannot be undone.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive">
              Delete shop
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
