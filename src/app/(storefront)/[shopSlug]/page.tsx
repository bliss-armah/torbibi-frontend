import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Package } from 'lucide-react';
import { productApi } from '@/lib/api/product.api';
import { shopApi } from '@/lib/api/shop.api';
import { ProductCard } from '@/features/products/components/ProductCard';

interface Props {
  params: { shopSlug: string };
  searchParams: { page?: string; search?: string; category?: string };
}

// Revalidate storefront pages every 5 minutes
export const revalidate = 300;

export async function generateMetadata({ params }: Props): Promise<Metadata> {

  try {
    const shop = await shopApi.getBySlug(params.shopSlug);
    console.log(shop)
    return {
      title: shop.name,
      description: shop.description ?? `Shop at ${shop.name} on Torbibi`,
      openGraph: {
        title: shop.name,
        description: shop.description ?? '',
        images: shop.bannerUrl ? [shop.bannerUrl] : [],
      },
    };
  } catch {
    return { title: 'Shop not found' };
  }
}

/**
 * Shop storefront page — Server Component.
 * Products are fetched server-side for fast initial load and SEO.
 */
export default async function ShopStorefrontPage({ params, searchParams }: Props) {
  let shop, products;
  let isSuspended = false;

  try {
    [shop, products] = await Promise.all([
      shopApi.getBySlug(params.shopSlug),
      productApi.listStorefront(params.shopSlug, {
        page: searchParams.page ? parseInt(searchParams.page, 10) : 1,
        search: searchParams.search,
        categoryId: searchParams.category,
      }),
    ]);
  } catch (err: unknown) {
    // Backend returns 403 SHOP_SUSPENDED when the subscription/trial has lapsed.
    // Show a proper in-layout message instead of falling through to the 404 page.
    const code = (err as { code?: string })?.code;
    if (code === 'SHOP_SUSPENDED') {
      isSuspended = true;
    } else {
      notFound();
    }
  }

  if (isSuspended || !shop || !products || shop.status !== 'active') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
            <Package className="h-7 w-7 text-gray-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-800">Shop unavailable</h2>
          <p className="mt-1 text-sm text-gray-500">This shop is temporarily unavailable. Please check back later.</p>
        </div>
      </div>
    );
  }

  // Shop initials for the logo avatar fallback
  const initials = shop.name
    .trim()
    .split(/\s+/)
    .map((w: string) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Shop header */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        {/* Banner — real image or amber gradient placeholder */}
        <div className="relative h-36 sm:h-52 overflow-hidden">
          {shop.bannerUrl ? (
            <Image
              src={shop.bannerUrl}
              alt={`${shop.name} banner`}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500" />
          )}
        </div>

        {/* Identity row — logo overlaps the banner */}
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-end gap-4 pb-5">
            {/* Logo / initials avatar */}
            <div className="relative h-16 w-16 flex-shrink-0 rounded-full overflow-hidden border-4 border-white shadow-md -mt-8 bg-white">
              {shop.logoUrl ? (
                <Image src={shop.logoUrl} alt={shop.name} fill className="object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-amber-50">
                  <span className="text-lg font-bold text-amber-600">{initials}</span>
                </div>
              )}
            </div>

            <div className="min-w-0 pb-1">
              <h1 className="text-xl font-bold text-gray-900 leading-tight">{shop.name}</h1>
              {shop.description && (
                <p className="mt-0.5 text-sm text-gray-500 leading-snug">{shop.description}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Products */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {products.data.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-20 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-50">
              <Package className="h-7 w-7 text-gray-300" />
            </div>
            <p className="text-base font-semibold text-gray-700">No products available yet</p>
            <p className="mt-1 text-sm text-gray-400">Check back soon — more items are on the way!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {products.data.map((product) => (
              <ProductCard key={product.id} product={product} shopSlug={params.shopSlug} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
