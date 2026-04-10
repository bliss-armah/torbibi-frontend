'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { useAppSelector } from '@/store';
import { selectCartItemCount } from '@/store/slices/cartSlice';
import { CartSheet } from '@/features/cart/components/CartSheet';

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  const [cartOpen, setCartOpen] = useState(false);
  const itemCount = useAppSelector(selectCartItemCount);

  return (
    <div className="min-h-screen bg-background">
      {/* Slim nav bar */}
      <nav className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-5xl mx-auto px-4 h-12 flex items-center justify-between">
          <Link href="/" className="text-sm font-bold text-primary">
            Torbibi
          </Link>

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
      </nav>

      {children}

      <CartSheet open={cartOpen} onOpenChange={setCartOpen} />
    </div>
  );
}
