'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { shopApi } from '@/lib/api/shop.api';
import { orderApi } from '@/lib/api/order.api';
import { Order, Shop } from '@/types';
import { formatPrice } from '@/lib/utils/format';
import { Button } from '@/components/ui/Button';
import { DataTable, TableColumn } from '@/components/ui/DataTable';
import { UpdateOrderStatusDialog } from '@/features/orders/components/UpdateOrderStatusDialog';

type StatusFilter = 'all' | 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

const FILTER_TABS: { label: string; value: StatusFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Processing', value: 'processing' },
  { label: 'Shipped', value: 'shipped' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Cancelled', value: 'cancelled' },
];

const STATUS_STYLES: Record<string, string> = {
  pending:    'bg-yellow-100 text-yellow-800',
  confirmed:  'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  shipped:    'bg-indigo-100 text-indigo-800',
  delivered:  'bg-green-100 text-green-800',
  cancelled:  'bg-red-100 text-red-800',
  refunded:   'bg-gray-100 text-gray-600',
};

const PAYMENT_STYLES: Record<string, string> = {
  pending:  'bg-yellow-50 text-yellow-700',
  paid:     'bg-green-50 text-green-700',
  failed:   'bg-red-50 text-red-700',
  refunded: 'bg-gray-50 text-gray-600',
};

// Orders that can still have their status updated
const TERMINAL_STATUSES = new Set(['delivered', 'cancelled', 'refunded']);

export default function OrdersPage() {
  const router = useRouter();
  const [shop, setShop] = useState<Shop | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusTarget, setStatusTarget] = useState<Order | null>(null);

  useEffect(() => {
    shopApi.getMyShops().then((shops) => {
      if (shops.length === 0) { router.replace('/onboarding'); return; }
      setShop(shops[0]);
    });
  }, [router]);

  const fetchOrders = useCallback(async (shopId: string, status: StatusFilter, p: number) => {
    setLoading(true);
    try {
      const result = await orderApi.listForShop(shopId, {
        page: p,
        status: status === 'all' ? undefined : status,
      });
      setOrders(result.data);
      setTotalPages(result.totalPages);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!shop) return;
    fetchOrders(shop.id, activeFilter, page);
  }, [shop, activeFilter, page, fetchOrders]);

  function handleFilterChange(status: StatusFilter) {
    setActiveFilter(status);
    setPage(1);
  }

  function onOrderUpdated(updated: Order) {
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
  }

  const columns: TableColumn<Order>[] = [
    {
      header: 'Order',
      render: (o) => (
        <span className="font-medium text-foreground">#{o.orderNumber}</span>
      ),
    },
    {
      header: 'Customer',
      render: (o) => (
        <div>
          <div className="text-foreground">{o.shippingAddress.recipientName}</div>
          <div className="text-xs text-muted-foreground">{o.customerPhone}</div>
        </div>
      ),
    },
    {
      header: 'Items',
      className: 'max-w-[200px]',
      render: (o) => (
        <span className="truncate block text-muted-foreground">
          {o.items.map((i) => `${i.productName} ×${i.quantity}`).join(', ')}
        </span>
      ),
    },
    {
      header: 'Total',
      render: (o) => (
        <span className="font-medium text-foreground">{formatPrice(o.total)}</span>
      ),
    },
    {
      header: 'Payment',
      render: (o) => (
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${PAYMENT_STYLES[o.paymentStatus] ?? 'bg-gray-100 text-gray-600'}`}
        >
          {o.paymentStatus}
        </span>
      ),
    },
    {
      header: 'Status',
      render: (o) => (
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[o.status] ?? 'bg-gray-100 text-gray-600'}`}
        >
          {o.status}
        </span>
      ),
    },
    {
      header: 'Actions',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (o) =>
        TERMINAL_STATUSES.has(o.status) ? (
          <span className="text-xs text-muted-foreground">—</span>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={(e) => { e.stopPropagation(); setStatusTarget(o); }}
          >
            Update status
          </Button>
        ),
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Orders</h1>
      </div>

      {/* Filter tabs */}
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {FILTER_TABS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => handleFilterChange(value)}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              activeFilter === value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={orders}
        keyExtractor={(o) => o.id}
        loading={loading}
        skeletonRows={5}
        emptyMessage={
          activeFilter === 'all'
            ? 'No orders yet. Orders will appear here once customers start shopping.'
            : `No ${activeFilter} orders.`
        }
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-md border border-input px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-muted transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-md border border-input px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-muted transition-colors"
          >
            Next
          </button>
        </div>
      )}

      {/* Update status dialog */}
      {shop && statusTarget && (
        <UpdateOrderStatusDialog
          open={!!statusTarget}
          shopId={shop.id}
          order={statusTarget}
          onOpenChange={(o) => { if (!o) setStatusTarget(null); }}
          onSuccess={onOrderUpdated}
        />
      )}
    </div>
  );
}
