'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Store, Search } from 'lucide-react';
import { shopApi } from '@/lib/api/shop.api';
import { Shop } from '@/types';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/skeleton';

export default function ShopsPage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    shopApi
      .listPublic({ limit: 100 })
      .then((r) => setShops(r.data))
      .catch(() => setShops([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = search.trim()
    ? shops.filter(
        (s) =>
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          s.description?.toLowerCase().includes(search.toLowerCase())
      )
    : shops;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-1">Shops</h1>
        <p className="text-muted-foreground text-sm">Discover local shops across Ghana</p>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search shops…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-3">
              <Skeleton className="h-24 w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Store className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">
            {search ? 'No shops match your search.' : 'No shops yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((shop) => (
            <Link
              key={shop.id}
              href={`/${shop.slug}`}
              className="group rounded-xl border border-border bg-card overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Banner / placeholder */}
              <div className="relative h-24 bg-muted overflow-hidden">
                {shop.bannerUrl ? (
                  <Image
                    src={shop.bannerUrl}
                    alt={shop.name}
                    fill
                    sizes="(max-width: 640px) 100vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Store className="h-8 w-8 text-muted-foreground/30" />
                  </div>
                )}
                {/* Logo overlay */}
                {shop.logoUrl && (
                  <div className="absolute bottom-2 left-3 h-10 w-10 rounded-full border-2 border-background overflow-hidden bg-background shadow">
                    <Image
                      src={shop.logoUrl}
                      alt={`${shop.name} logo`}
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  </div>
                )}
              </div>

              <div className="p-4">
                <h2 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  {shop.name}
                </h2>
                {shop.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {shop.description}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
