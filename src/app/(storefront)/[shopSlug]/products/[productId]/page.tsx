import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { productApi } from '@/lib/api/product.api';
import { shopApi } from '@/lib/api/shop.api';
import { formatPrice } from '@/lib/utils/format';
import { Badge } from '@/components/ui/badge';
import { AddToCartButton } from '@/features/cart/components/AddToCartButton';

interface Props {
  params: { shopSlug: string; productId: string };
}

export const revalidate = 300;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const product = await productApi.getStorefrontProduct(params.shopSlug, params.productId);
    return {
      title: product.name,
      description: product.description ?? `Buy ${product.name} on Torbibi`,
      openGraph: {
        title: product.name,
        images: product.images[0] ? [product.images[0].url] : [],
      },
    };
  } catch {
    return { title: 'Product not found' };
  }
}

export default async function ProductDetailPage({ params }: Props) {
  let product, shop;

  try {
    [product, shop] = await Promise.all([
      productApi.getStorefrontProduct(params.shopSlug, params.productId),
      shopApi.getBySlug(params.shopSlug),
    ]);
  } catch {
    notFound();
  }

  if (product.status !== 'active') notFound();

  const primaryImage = product.images.find((i) => i.isPrimary) ?? product.images[0];
  const otherImages = product.images.filter((i) => i !== primaryImage);
  const isOnSale = product.compareAtPrice !== null && product.compareAtPrice > product.price;
  const isOutOfStock = product.trackInventory && product.quantity === 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Back link */}
      <Link
        href={`/${params.shopSlug}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to {shop.name}
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* ── Images ─────────────────────────────────────────────────────── */}
        <div className="space-y-3">
          {/* Primary image */}
          <div className="relative aspect-square rounded-xl overflow-hidden bg-muted">
            {primaryImage ? (
              <Image
                src={primaryImage.url}
                alt={primaryImage.alt || product.name}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
                No image
              </div>
            )}
            {isOnSale && (
              <div className="absolute left-3 top-3">
                <Badge variant="destructive">Sale</Badge>
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {otherImages.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {otherImages.map((img, idx) => (
                <div key={idx} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                  <Image
                    src={img.url}
                    alt={img.alt || `${product.name} ${idx + 2}`}
                    fill
                    sizes="25vw"
                    className="object-cover"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Details ────────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{product.name}</h1>
            {product.sku && (
              <p className="text-xs text-muted-foreground mt-1">SKU: {product.sku}</p>
            )}
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="text-2xl font-bold text-foreground">{formatPrice(product.price)}</span>
            {isOnSale && product.compareAtPrice && (
              <span className="text-base text-muted-foreground line-through">
                {formatPrice(product.compareAtPrice)}
              </span>
            )}
          </div>

          {/* Stock status */}
          {isOutOfStock ? (
            <p className="text-sm font-medium text-destructive">Out of stock</p>
          ) : product.trackInventory ? (
            <p className="text-sm text-muted-foreground">
              {product.quantity} in stock
            </p>
          ) : null}

          {/* Description */}
          {product.description && (
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {product.description}
            </p>
          )}

          {/* Tags */}
          {product.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {product.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Add to cart */}
          <AddToCartButton product={product} disabled={isOutOfStock} />

          {/* Shop info */}
          <div className="mt-auto pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Sold by{' '}
              <Link href={`/${params.shopSlug}`} className="font-medium text-foreground hover:text-primary">
                {shop.name}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
