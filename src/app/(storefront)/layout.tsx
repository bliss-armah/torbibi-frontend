'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingCart, Package, LogIn } from 'lucide-react';
import { useAppSelector } from '@/store';
import { selectCartItemCount } from '@/store/slices/cartSlice';
import { CartSheet } from '@/features/cart/components/CartSheet';

// Routes that are NOT shop slugs
const NON_SHOP_SEGMENTS = new Set(['shops', 'checkout', 'orders', 'login']);

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  const [cartOpen, setCartOpen] = useState(false);
  const itemCount = useAppSelector(selectCartItemCount);
  const cartShopSlug = useAppSelector((s) => s.cart.shopSlug);
  const isLoggedIn = useAppSelector((s) => !!s.auth.user);

  const pathname = usePathname();

  // Primary: extract slug from URL path (e.g. /bliss-shop or /bliss-shop/products/xxx)
  const firstSegment = pathname.split('/').filter(Boolean)[0] ?? '';
  const slugFromPath = !NON_SHOP_SEGMENTS.has(firstSegment) ? firstSegment : null;

  // Fallback to cart's stored slug (e.g. when on /checkout)
  const shopSlug = slugFromPath ?? cartShopSlug;
  const homeHref = shopSlug ? `/${shopSlug}` : '/';

  return (
    <div className="min-h-screen bg-background">
      {/* Slim nav bar */}
      <nav className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-5xl mx-auto px-4 h-12 flex items-center justify-between">
          <Link href={homeHref} className="text-sm font-bold text-primary">
            Torbibi
          </Link>

          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <Link
                href={`/orders/my${shopSlug ? `?shop=${shopSlug}` : ''}`}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Package className="h-4 w-4" />
                <span className="hidden sm:inline">My orders</span>
              </Link>
            ) : shopSlug ? (
              <Link
                href={`/${shopSlug}/login`}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline">Login</span>
              </Link>
            ) : null}

            <button
              onClick={() => setCartOpen(true)}
              className="relative flex items-center gap-1.5 text-sm text-foreground hover:text-primary transition-colors"
              aria-label="Open cart"
            >
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      {children}

      <CartSheet open={cartOpen} onOpenChange={setCartOpen} />
    </div>
  );
}
