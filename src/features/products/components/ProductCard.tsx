import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/types';
import { formatPrice, truncate } from '@/lib/utils/format';
import { Badge } from '@/components/ui/badge';

interface ProductCardProps {
  product: Product;
  shopSlug: string;
}

export function ProductCard({ product, shopSlug }: ProductCardProps) {
  const primaryImage = product.images.find((img) => img.isPrimary) ?? product.images[0];
  const isOnSale = product.compareAtPrice !== null && product.compareAtPrice > product.price;

  return (
    <Link
    href={`/${shopSlug}/products/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow duration-200 hover:shadow-md"
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        {primaryImage ? (
          <Image
            src={primaryImage.url}
            alt={primaryImage.alt}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm text-muted-foreground">No image</span>
          </div>
        )}
        {isOnSale && (
          <div className="absolute left-2 top-2">
            <Badge variant="destructive">Sale</Badge>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1.5 p-3">
        <h3 className="text-sm font-medium leading-snug text-card-foreground">
          {truncate(product.name, 40)}
        </h3>

        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-foreground">{formatPrice(product.price)}</span>
          {isOnSale && product.compareAtPrice && (
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(product.compareAtPrice)}
            </span>
          )}
        </div>

        {product.trackInventory && product.quantity === 0 && (
          <span className="text-xs text-destructive">Out of stock</span>
        )}
      </div>
    </Link>
  );
}
