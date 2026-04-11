'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { shopApi } from '@/lib/api/shop.api';
import { paymentApi, MomoNetwork } from '@/lib/api/payment.api';
import { subscriptionApi, SubscriptionStatus, SubscriptionStatusDetails } from '@/lib/api/subscription.api';
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
import { Camera, Upload } from 'lucide-react';

const BRAND_COLOR_PRESETS = [
  '#F59E0B', // amber
  '#F97316', // orange
  '#EF4444', // red
  '#EC4899', // pink
  '#8B5CF6', // violet
  '#3B82F6', // blue
  '#14B8A6', // teal
  '#10B981', // emerald
  '#64748B', // slate
  '#111827', // near-black
];

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

// ─── Subscription card ────────────────────────────────────────────────────────

function SubscriptionCard({
  subscription,
  subscribing,
  onSubscribe,
  onCancel,
}: {
  subscription: SubscriptionStatusDetails | null;
  subscribing: boolean;
  onSubscribe: () => void;
  onCancel: () => void;
}) {
  const status: SubscriptionStatus = subscription?.subscriptionStatus ?? 'trialing';

  const trialDaysLeft = subscription?.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(subscription.trialEndsAt).getTime() - Date.now()) / 86400000))
    : null;

  const nextBilling = subscription?.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString('en-GH', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  if (status === 'active') {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
            Active
          </span>
          {nextBilling && (
            <span className="text-sm text-muted-foreground">Next billing: {nextBilling}</span>
          )}
        </div>
        <button
          onClick={onCancel}
          className="text-sm text-destructive underline-offset-2 hover:underline"
        >
          Cancel subscription
        </button>
      </div>
    );
  }

  if (status === 'trialing') {
    return (
      <div className="space-y-3">
        <div className="rounded-md bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-800">
          {trialDaysLeft !== null && trialDaysLeft > 0
            ? `Free trial — ${trialDaysLeft} day${trialDaysLeft === 1 ? '' : 's'} remaining. Subscribe before your trial ends to keep your shop active.`
            : 'Your free trial has expired. Subscribe to reactivate your storefront.'}
        </div>
        <Button onClick={onSubscribe} disabled={subscribing}>
          {subscribing ? 'Redirecting…' : 'Subscribe — GHS 50/month'}
        </Button>
      </div>
    );
  }

  if (status === 'past_due') {
    return (
      <div className="space-y-3">
        <div className="rounded-md bg-yellow-50 border border-yellow-200 px-4 py-3 text-sm text-yellow-800">
          Your last payment failed. Subscribe again to restore access.
        </div>
        <Button onClick={onSubscribe} disabled={subscribing}>
          {subscribing ? 'Redirecting…' : 'Retry subscription'}
        </Button>
      </div>
    );
  }

  // cancelled
  return (
    <div className="space-y-3">
      <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
        Your subscription is cancelled. Your storefront is suspended.
      </div>
      <Button onClick={onSubscribe} disabled={subscribing}>
        {subscribing ? 'Redirecting…' : 'Reactivate — GHS 50/month'}
      </Button>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [shop, setShop] = useState<Shop | null>(null);
  const [loadingState, setLoadingState] = useState<'loading' | 'ready' | 'no-shop' | 'error'>(
    'loading'
  );
  const [subaccountCode, setSubaccountCode] = useState<string | null>(null);
  const [payoutSaved, setPayoutSaved] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionStatusDetails | null>(null);
  const [subscribing, setSubscribing] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [brandColor, setBrandColor] = useState<string>('#F59E0B');
  const [savingColor, setSavingColor] = useState(false);
  const [colorHex, setColorHex] = useState<string>('F59E0B');
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

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
        const initialColor = s.brandColor ?? '#F59E0B';
        setBrandColor(initialColor);
        setColorHex(initialColor.replace('#', ''));

        const [subaccount, sub] = await Promise.all([
          paymentApi.getSubaccount(s.id).catch(() => null),
          subscriptionApi.getStatus(s.id).catch(() => null),
        ]);

        if (subaccount?.subaccountCode) {
          setSubaccountCode(subaccount.subaccountCode);
          payoutForm.reset({
            type: (subaccount.type as 'mobile_money' | 'ghipss') ?? 'mobile_money',
            accountName: subaccount.accountName ?? '',
            accountNumber: subaccount.accountNumber ?? '',
            bankCode: subaccount.bankCode ?? 'MTN',
          });
        }

        if (sub) setSubscription(sub);

        setLoadingState('ready');
      } catch {
        setLoadingState('error');
      }
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !shop) return;
    setUploadingLogo(true);
    try {
      const result = await shopApi.uploadLogo(shop.id, file);
      setShop((prev) => prev ? { ...prev, logoUrl: result.logoUrl } : prev);
    } catch {
      // upload failure is non-blocking — user can retry
    } finally {
      setUploadingLogo(false);
      e.target.value = '';
    }
  }

  async function handleBannerUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !shop) return;
    setUploadingBanner(true);
    try {
      const result = await shopApi.uploadBanner(shop.id, file);
      setShop((prev) => prev ? { ...prev, bannerUrl: result.bannerUrl } : prev);
    } catch {
      // upload failure is non-blocking — user can retry
    } finally {
      setUploadingBanner(false);
      e.target.value = '';
    }
  }

  async function handleSaveBrandColor() {
    if (!shop) return;
    setSavingColor(true);
    try {
      await shopApi.update(shop.id, { brandColor });
      setShop((prev) => (prev ? { ...prev, brandColor } : prev));
    } catch {
      // silently fail — user can retry
    } finally {
      setSavingColor(false);
    }
  }

  async function onSaveShopDetails(values: ShopDetailsValues) {
    if (!shop) return;
    try {
      const updated = await shopApi.update(shop.id, values);
      setShop(updated);
      shopForm.reset(values);
    } catch (err: unknown) {
      const msg =
        (err as { message?: string })?.message ?? 'Failed to save. Please try again.';
      shopForm.setError('root', { message: msg });
    }
  }

  async function onSavePayout(values: PayoutValues) {
    if (!shop) return;
    try {
      const result = await paymentApi.registerSubaccount(shop.id, {
        type: values.type,
        accountName: values.accountName,
        accountNumber: values.accountNumber,
        bankCode: values.bankCode as MomoNetwork,
      });
      setSubaccountCode(result.subaccountCode);
      setPayoutSaved(true);
      payoutForm.reset(values);
    } catch (err: unknown) {
      const msg =
        (err as { message?: string })?.message ?? 'Failed to save. Please try again.';
      payoutForm.setError('root', { message: msg });
    }
  }

  async function onSubscribe() {
    if (!shop) return;
    setSubscribing(true);
    try {
      const result = await subscriptionApi.subscribe(shop.id);
      window.location.href = result.authorizationUrl;
    } catch {
      setSubscribing(false);
    }
  }

  async function onCancelSubscription() {
    if (!shop || !window.confirm('Cancel your subscription? Your storefront will be suspended.')) return;
    try {
      await subscriptionApi.cancel(shop.id);
      setSubscription((prev) => prev ? { ...prev, subscriptionStatus: 'cancelled' } : prev);
    } catch {
      // silently fail — let user retry
    }
  }

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (loadingState === 'loading') {
    return (
      <div className="p-6">
        <Skeleton className="mb-6 h-8 w-32" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
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
          <div className="space-y-6">
            {[3, 4].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-28" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
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

  // Narrow shop to non-null — at this point loadingState === 'ready' which guarantees shop is set
  if (!shop) return null;

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Settings</h1>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ── Left column: primary forms ──────────────────────────────────── */}
        <div className="space-y-6 lg:col-span-2">
          {/* Shop appearance */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Shop appearance</CardTitle>
              <CardDescription>
                Your logo and banner are shown on your public storefront. The banner fills the top of the page; the logo appears overlapping it.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Banner */}
              <div>
                <p className="mb-2 text-sm font-medium text-foreground">Banner</p>
                <div
                  className="group relative h-28 cursor-pointer overflow-hidden rounded-lg"
                  onClick={() => !uploadingBanner && bannerInputRef.current?.click()}
                >
                  {shop.bannerUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={shop.bannerUrl} alt="Shop banner" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500" />
                  )}
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                    <Upload className="h-5 w-5 text-white" />
                    <span className="text-xs font-medium text-white">
                      {shop.bannerUrl ? 'Change banner' : 'Upload banner'}
                    </span>
                  </div>
                  {uploadingBanner && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <span className="text-sm font-medium text-white">Uploading…</span>
                    </div>
                  )}
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Recommended: 1200 × 400 px. JPEG, PNG or WebP, max 5 MB.
                </p>
              </div>

              {/* Logo */}
              <div>
                <p className="mb-2 text-sm font-medium text-foreground">Logo</p>
                <div className="flex items-center gap-4">
                  <div
                    className="group relative h-16 w-16 flex-shrink-0 cursor-pointer overflow-hidden rounded-full border-2 border-border bg-amber-50"
                    onClick={() => !uploadingLogo && logoInputRef.current?.click()}
                  >
                    {shop.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={shop.logoUrl} alt="Shop logo" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <span className="text-xl font-bold text-amber-600">
                          {shop.name.trim().split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                      {uploadingLogo ? (
                        <span className="text-[10px] font-medium text-white">…</span>
                      ) : (
                        <Camera className="h-4 w-4 text-white" />
                      )}
                    </div>
                  </div>
                  <div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={uploadingLogo}
                      onClick={() => logoInputRef.current?.click()}
                    >
                      {uploadingLogo ? 'Uploading…' : shop.logoUrl ? 'Change logo' : 'Upload logo'}
                    </Button>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Recommended: 400 × 400 px. Displays as a circle.
                    </p>
                  </div>
                </div>
              </div>

              {/* Brand color */}
              <div>
                <p className="mb-1 text-sm font-medium text-foreground">Brand color</p>
                <p className="mb-3 text-xs text-muted-foreground">
                  Used for your storefront banner and accents when no custom banner is uploaded.
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  {BRAND_COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      title={preset}
                      className={cn(
                        'h-7 w-7 rounded-full border-2 transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1',
                        brandColor.toLowerCase() === preset.toLowerCase()
                          ? 'border-foreground scale-110 shadow-sm'
                          : 'border-transparent'
                      )}
                      style={{ backgroundColor: preset }}
                      onClick={() => {
                        setBrandColor(preset);
                        setColorHex(preset.replace('#', ''));
                      }}
                    />
                  ))}
                  {/* Native color picker for any custom color */}
                  <div className="relative">
                    <input
                      type="color"
                      value={brandColor}
                      onChange={(e) => {
                        setBrandColor(e.target.value);
                        setColorHex(e.target.value.replace('#', ''));
                      }}
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                      title="Custom color"
                    />
                    <div
                      className={cn(
                        'flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-2 text-[10px] font-bold',
                        !BRAND_COLOR_PRESETS.map((p) => p.toLowerCase()).includes(brandColor.toLowerCase())
                          ? 'border-foreground scale-110 shadow-sm'
                          : 'border-dashed border-border'
                      )}
                      style={{ backgroundColor: brandColor }}
                      title="Custom color"
                    >
                      <span className="sr-only">Custom</span>
                    </div>
                  </div>
                  {/* Hex input */}
                  <div className="flex items-center gap-0.5 rounded-md border border-input bg-background px-2 py-1">
                    <span className="text-xs text-muted-foreground">#</span>
                    <input
                      type="text"
                      value={colorHex}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^0-9A-Fa-f]/g, '').slice(0, 6);
                        setColorHex(raw);
                        if (raw.length === 6) setBrandColor(`#${raw}`);
                      }}
                      className="w-16 bg-transparent font-mono text-xs focus:outline-none"
                      placeholder="F59E0B"
                      maxLength={6}
                    />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  {/* Preview swatch */}
                  <div
                    className="h-8 w-20 rounded-md border border-border"
                    style={{ backgroundColor: brandColor }}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={savingColor}
                    onClick={handleSaveBrandColor}
                  >
                    {savingColor ? 'Saving…' : 'Save color'}
                  </Button>
                </div>
              </div>

              {/* Hidden file inputs */}
              <input
                ref={logoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={handleLogoUpload}
              />
              <input
                ref={bannerInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={handleBannerUpload}
              />
            </CardContent>
          </Card>

          {/* Shop details */}
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

          {/* Payout account */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payout account</CardTitle>
            </CardHeader>
            <CardContent>
              {payoutSaved && (
                <div className="mb-4 rounded-md bg-green-50 px-4 py-3 text-sm text-green-800 border border-green-200">
                  Payout account updated successfully.
                </div>
              )}
              <Form {...payoutForm}>
                <form
                  onSubmit={payoutForm.handleSubmit(onSavePayout)}
                  className="space-y-4"
                >
                  <div className="grid gap-4 sm:grid-cols-2">
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
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
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
                  </div>

                  <Button type="submit" disabled={payoutForm.formState.isSubmitting}>
                    {payoutForm.formState.isSubmitting
                      ? 'Saving…'
                      : subaccountCode
                      ? 'Update payout account'
                      : 'Register payout account'}
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
        </div>

        {/* ── Right column: status & actions ──────────────────────────────── */}
        <div className="space-y-6">
          {/* Subscription */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Subscription</CardTitle>
              <CardDescription>
                Your monthly platform subscription keeps your storefront active.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SubscriptionCard
                subscription={subscription}
                subscribing={subscribing}
                onSubscribe={onSubscribe}
                onCancel={onCancelSubscription}
              />
            </CardContent>
          </Card>

          {/* Danger zone */}
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
    </div>
  );
}
