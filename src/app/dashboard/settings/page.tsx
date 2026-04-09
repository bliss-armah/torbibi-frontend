'use client';

import { useEffect, useState } from 'react';
import { shopApi } from '@/lib/api/shop.api';
import { paymentApi, RegisterRecipientPayload, MomoNetwork } from '@/lib/api/payment.api';
import { Shop } from '@/types';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export default function SettingsPage() {
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);

  // Shop details form
  const [shopName, setShopName] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [shopSaveState, setShopSaveState] = useState<SaveState>('idle');
  const [shopError, setShopError] = useState('');

  // Payout form
  const [payoutType, setPayoutType] = useState<'mobile_money' | 'ghipss'>('mobile_money');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankCode, setBankCode] = useState<string>('MTN');
  const [payoutSaveState, setPayoutSaveState] = useState<SaveState>('idle');
  const [payoutError, setPayoutError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [shops, recipient] = await Promise.all([
          shopApi.getMyShops(),
          null, // will load after we have shopId
        ]);
        const s = shops[0];
        if (!s) return;
        setShop(s);
        setShopName(s.name);
        setDescription(s.description ?? '');
        setPhone(s.phone);

        // Load payout recipient
        const r = await paymentApi.getRecipient(s.id).catch(() => null);
        if (r) {
          setPayoutType(r.type as 'mobile_money' | 'ghipss');
          setAccountName(r.accountName);
          setAccountNumber(r.accountNumber);
          setBankCode(r.bankCode);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function saveShopDetails() {
    if (!shop) return;
    setShopSaveState('saving');
    setShopError('');
    try {
      const updated = await shopApi.update(shop.id, {
        name: shopName,
        description,
        phone,
      });
      setShop(updated);
      setShopSaveState('saved');
      setTimeout(() => setShopSaveState('idle'), 2500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save';
      setShopError(msg);
      setShopSaveState('error');
    }
  }

  async function savePayoutAccount() {
    if (!shop) return;
    setPayoutSaveState('saving');
    setPayoutError('');
    try {
      const payload: RegisterRecipientPayload =
        payoutType === 'mobile_money'
          ? { type: 'mobile_money', accountName, accountNumber, bankCode: bankCode as MomoNetwork }
          : { type: 'ghipss', accountName, accountNumber, bankCode };

      await paymentApi.registerRecipient(shop.id, payload);
      setPayoutSaveState('saved');
      setTimeout(() => setPayoutSaveState('idle'), 2500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save';
      setPayoutError(msg);
      setPayoutSaveState('error');
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="h-8 w-32 animate-pulse rounded bg-muted mb-6" />
        <div className="max-w-2xl space-y-6">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-6 space-y-4">
              <div className="h-5 w-28 animate-pulse rounded bg-muted" />
              <div className="h-10 animate-pulse rounded bg-muted" />
              <div className="h-10 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Settings</h1>

      <div className="max-w-2xl space-y-6">
        {/* Shop details */}
        <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-foreground">Shop details</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Shop name</label>
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="My Shop"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Description</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell customers about your shop"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Phone number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+233 XX XXX XXXX"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          {shopError && <p className="mt-2 text-sm text-destructive">{shopError}</p>}
          <button
            onClick={saveShopDetails}
            disabled={shopSaveState === 'saving'}
            className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {shopSaveState === 'saving'
              ? 'Saving…'
              : shopSaveState === 'saved'
              ? 'Saved!'
              : 'Save changes'}
          </button>
        </section>

        {/* Payout settings */}
        <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="mb-1 text-base font-semibold text-foreground">Payout account</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Where we send your earnings after each sale. Torbibi retains a small platform commission.
          </p>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Account type</label>
              <select
                value={payoutType}
                onChange={(e) => {
                  setPayoutType(e.target.value as 'mobile_money' | 'ghipss');
                  setBankCode(e.target.value === 'mobile_money' ? 'MTN' : '');
                }}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="mobile_money">Mobile Money</option>
                <option value="ghipss">Bank transfer (GhIPSS)</option>
              </select>
            </div>

            {payoutType === 'mobile_money' && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Network</label>
                <select
                  value={bankCode}
                  onChange={(e) => setBankCode(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="MTN">MTN Mobile Money</option>
                  <option value="ATL">AirtelTigo Money</option>
                  <option value="VOD">Vodafone Cash</option>
                </select>
              </div>
            )}

            {payoutType === 'ghipss' && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Bank code</label>
                <input
                  type="text"
                  value={bankCode}
                  onChange={(e) => setBankCode(e.target.value)}
                  placeholder="e.g. GCB"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                {payoutType === 'mobile_money' ? 'Wallet number' : 'Account number'}
              </label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder={payoutType === 'mobile_money' ? '0XX XXX XXXX' : 'Account number'}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Account name</label>
              <input
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="Full name on account"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          {payoutError && <p className="mt-2 text-sm text-destructive">{payoutError}</p>}
          <button
            onClick={savePayoutAccount}
            disabled={payoutSaveState === 'saving'}
            className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {payoutSaveState === 'saving'
              ? 'Saving…'
              : payoutSaveState === 'saved'
              ? 'Saved!'
              : 'Save payout account'}
          </button>
        </section>

        {/* Danger zone */}
        <section className="rounded-xl border border-destructive/30 bg-card p-6 shadow-sm">
          <h2 className="mb-1 text-base font-semibold text-destructive">Danger zone</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Permanently delete your shop and all its data. This cannot be undone.
          </p>
          <button className="rounded-lg border border-destructive px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10">
            Delete shop
          </button>
        </section>
      </div>
    </div>
  );
}
