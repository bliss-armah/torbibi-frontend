'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Package } from 'lucide-react';
import { shopApi } from '@/lib/api/shop.api';
import { productApi } from '@/lib/api/product.api';
import { Product, Shop } from '@/types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AddProductDialog } from '@/features/products/components/AddProductDialog';

function priceFmt(pesewas: number) {
  return `₵${(pesewas / 100).toFixed(2)}`;
}

const STATUS_STYLES: Record<Product['status'], string> = {
  active: 'bg-green-100 text-green-700',
  draft: 'bg-yellow-100 text-yellow-700',
  archived: 'bg-gray-100 text-gray-500',
};

export default function ProductsPage() {
  const router = useRouter();
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const shops = await shopApi.getMyShops();
        if (shops.length === 0) {
          router.replace('/onboarding');
          return;
        }
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

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Products</h1>
        <Button
          onClick={() => setDialogOpen(true)}
          disabled={!shop}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add product
        </Button>
      </div>

      {/* Product list */}
      {loading ? (
        <div className="rounded-xl border border-border bg-card shadow-sm divide-y divide-border">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <Skeleton className="h-12 w-12 rounded-md flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-xl border border-border bg-card shadow-sm flex flex-col items-center justify-center py-16 text-center">
          <Package className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-base font-medium text-foreground">No products yet</p>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Add your first product to start selling
          </p>
          <Button onClick={() => setDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add product
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-sm divide-y divide-border">
          {products.map((product) => (
            <div key={product.id} className="flex items-center gap-4 p-4">
              {/* Image or placeholder */}
              <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                {product.images[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.images[0].url}
                    alt={product.images[0].alt}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Package className="h-5 w-5 text-muted-foreground" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {priceFmt(product.price)}
                  {product.compareAtPrice && (
                    <span className="line-through ml-2 text-muted-foreground/60">
                      {priceFmt(product.compareAtPrice)}
                    </span>
                  )}
                  {product.trackInventory && (
                    <span className="ml-3">{product.quantity} in stock</span>
                  )}
                </p>
              </div>

              {/* Status badge */}
              <span
                className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${STATUS_STYLES[product.status]}`}
              >
                {product.status}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Add product dialog */}
      {shop && (
        <AddProductDialog
          open={dialogOpen}
          shopId={shop.id}
          onOpenChange={setDialogOpen}
          onSuccess={onProductAdded}
        />
      )}
    </div>
  );
}
