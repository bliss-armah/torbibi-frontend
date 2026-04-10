'use client';

import { useState } from 'react';
import { orderApi } from '@/lib/api/order.api';
import { Order } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type NextStatus = 'processing' | 'shipped' | 'delivered' | 'cancelled';

// 'confirmed' is set automatically on payment — not a manual option
const NEXT_STATUSES: Record<string, NextStatus[]> = {
  pending:    ['cancelled'],
  confirmed:  ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped:    ['delivered'],
  delivered:  [],
  cancelled:  [],
  refunded:   [],
};

const STATUS_LABEL: Record<string, string> = {
  processing: 'Processing',
  shipped:    'Shipped',
  delivered:  'Delivered',
  cancelled:  'Cancelled',
};

interface UpdateOrderStatusDialogProps {
  open: boolean;
  shopId: string;
  order: Order;
  onOpenChange: (open: boolean) => void;
  onSuccess: (updated: Order) => void;
}

export function UpdateOrderStatusDialog({
  open,
  shopId,
  order,
  onOpenChange,
  onSuccess,
}: UpdateOrderStatusDialogProps) {
  const nextStatuses = NEXT_STATUSES[order.status] ?? [];
  const [status, setStatus] = useState<NextStatus | ''>('');
  const [cancelReason, setCancelReason] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  function handleOpenChange(next: boolean) {
    if (!next) {
      setStatus('');
      setCancelReason('');
      setDriverPhone('');
      setVehicleNumber('');
      setError('');
    }
    onOpenChange(next);
  }

  const showDeliveryFields = status === 'processing' || status === 'shipped';

  async function handleSubmit() {
    if (!status) { setError('Select a status'); return; }
    if (status === 'cancelled' && !cancelReason.trim()) {
      setError('Cancel reason is required');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const deliveryInfo =
        showDeliveryFields && (driverPhone.trim() || vehicleNumber.trim())
          ? { driverPhone: driverPhone.trim() || undefined, vehicleNumber: vehicleNumber.trim() || undefined }
          : undefined;

      const updated = await orderApi.updateStatus(
        shopId,
        order.id,
        status,
        status === 'cancelled' ? cancelReason.trim() : undefined,
        deliveryInfo,
      );
      handleOpenChange(false);
      onSuccess(updated);
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? 'Failed to update status');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Update order status</DialogTitle>
        </DialogHeader>

        <div className="space-y-1 text-sm text-muted-foreground">
          <p>Order <span className="font-medium text-foreground">#{order.orderNumber}</span></p>
          <p>
            Current:{' '}
            <span className="font-medium capitalize text-foreground">{order.status}</span>
          </p>
        </div>

        {nextStatuses.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">
            This order is <span className="font-medium capitalize">{order.status}</span> and cannot be updated further.
          </p>
        ) : (
          <div className="space-y-4">
            {/* Status select */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">New status</label>
              <Select
                value={status}
                onValueChange={(v) => { setStatus(v as NextStatus); setError(''); }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select new status…" />
                </SelectTrigger>
                <SelectContent>
                  {nextStatuses.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Delivery info (processing / shipped) */}
            {showDeliveryFields && (
              <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Delivery details <span className="normal-case font-normal">(optional)</span>
                </p>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Driver phone</label>
                  <Input
                    type="tel"
                    placeholder="e.g. 0241234567"
                    value={driverPhone}
                    onChange={(e) => setDriverPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Vehicle / plate number</label>
                  <Input
                    placeholder="e.g. GR-1234-24"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Cancel reason */}
            {status === 'cancelled' && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Cancel reason <span className="text-destructive">*</span>
                </label>
                <textarea
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => { setCancelReason(e.target.value); setError(''); }}
                  placeholder="Explain why this order is being cancelled…"
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={submitting}>
            Close
          </Button>
          {nextStatuses.length > 0 && (
            <Button onClick={handleSubmit} disabled={submitting || !status}>
              {submitting ? 'Updating…' : 'Update status'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
