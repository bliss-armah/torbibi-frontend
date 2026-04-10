'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Package, Pencil } from 'lucide-react';
import { shopApi } from '@/lib/api/shop.api';
import { productApi } from '@/lib/api/product.api';
import { Product, Shop } from '@/types';
import { Button } from '@/components/ui/Button';
import { DataTable, TableColumn } from '@/components/ui/DataTable';
import { AddProductDialog } from '@/features/products/components/AddProductDialog';

function priceFmt(pesewas: number) {
  return `₵${(pesewas / 100).toFixed(2)}`;
}

const STATUS_STYLES: Record<Product['status'], string> = {
  active:   'bg-green-100 text-green-700',
  draft:    'bg-yellow-100 text-yellow-700',
  archived: 'bg-gray-100 text-gray-500',
};

export default function ProductsPage() {
  const router = useRouter();
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Product | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const shops = await shopApi.getMyShops();
        if (shops.length === 0) { router.replace('/onboarding'); return; }
        const s = shops[0];
        setShop(s);
        const result = await productApi.listDashboard(s.id, { limit: 50 });
        setProducts(result.data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  function onProductAdded(product: Product) {
    setProducts((prev) => [product, ...prev]);
  }

  function onProductUpdated(updated: Product) {
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  }

  const columns: TableColumn<Product>[] = [
    {
      header: 'Product',
      render: (p) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
            {p.images[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.images[0].url} alt={p.images[0].alt} className="h-full w-full object-cover" />
            ) : (
              <Package className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
            {p.sku && <p className="text-xs text-muted-foreground">SKU: {p.sku}</p>}
          </div>
        </div>
      ),
    },
    {
      header: 'Price',
      render: (p) => (
        <div>
          <span className="font-medium text-foreground">{priceFmt(p.price)}</span>
          {p.compareAtPrice && (
            <span className="ml-2 text-xs line-through text-muted-foreground">
              {priceFmt(p.compareAtPrice)}
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Stock',
      render: (p) => (
        <span className="text-foreground">
          {p.trackInventory ? p.quantity : '—'}
        </span>
      ),
    },
    {
      header: 'Status',
      render: (p) => (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize ${STATUS_STYLES[p.status]}`}
        >
          {p.status}
        </span>
      ),
    },
    {
      header: 'Actions',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (p) => (
        <Button
          size="sm"
          variant="ghost"
          className="gap-1.5 h-8"
          onClick={(e) => { e.stopPropagation(); setEditTarget(p); }}
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </Button>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Products</h1>
        <Button onClick={() => setAddOpen(true)} disabled={!shop} className="gap-2">
          <Plus className="h-4 w-4" />
          Add product
        </Button>
      </div>

      {products.length === 0 && !loading ? (
        <div className="rounded-xl border border-border bg-card shadow-sm flex flex-col items-center justify-center py-16 text-center">
          <Package className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-base font-medium text-foreground">No products yet</p>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Add your first product to start selling
          </p>
          <Button onClick={() => setAddOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add product
          </Button>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={products}
          keyExtractor={(p) => p.id}
          loading={loading}
          skeletonRows={5}
          emptyMessage="No products yet."
        />
      )}

      {shop && (
        <>
          <AddProductDialog
            open={addOpen}
            shopId={shop.id}
            onOpenChange={setAddOpen}
            onSuccess={onProductAdded}
          />
          {editTarget && (
            <AddProductDialog
              open={!!editTarget}
              shopId={shop.id}
              product={editTarget}
              onOpenChange={(o) => { if (!o) setEditTarget(null); }}
              onSuccess={onProductUpdated}
            />
          )}
        </>
      )}
    </div>
  );
}
