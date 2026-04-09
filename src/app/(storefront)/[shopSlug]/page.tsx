import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
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
 * Low-bandwidth users get content without waiting for JS hydration.
 */
export default async function ShopStorefrontPage({ params, searchParams }: Props) {
  let shop, products;

  try {
    [shop, products] = await Promise.all([
      shopApi.getBySlug(params.shopSlug),
      productApi.listStorefront(params.shopSlug, {
        page: searchParams.page ? parseInt(searchParams.page, 10) : 1,
        search: searchParams.search,
        categoryId: searchParams.category,
      }),
    ]);
  } catch {
    notFound();
  }

  if (!shop.status || shop.status !== 'active') {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        This shop is currently unavailable.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Shop header */}
      <header className="bg-white shadow-sm">
        {shop.bannerUrl && (
          <div className="relative h-40 sm:h-56 bg-gray-200">
            <Image src={shop.bannerUrl} alt={`${shop.name} banner`} fill className="object-cover" priority />
          </div>
        )}
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
          {shop.logoUrl && (
            <div className="relative h-16 w-16 rounded-full overflow-hidden border-2 border-white shadow flex-shrink-0">
              <Image src={shop.logoUrl} alt={shop.name} fill className="object-cover" />
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold text-gray-900">{shop.name}</h1>
            {shop.description && (
              <p className="text-sm text-gray-500 mt-0.5">{shop.description}</p>
            )}
          </div>
        </div>
      </header>

      {/* Products grid */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        {products.data.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p className="text-lg font-medium">No products available yet</p>
            <p className="text-sm mt-1">Check back soon!</p>
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
