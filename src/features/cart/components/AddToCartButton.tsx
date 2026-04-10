'use client';

import { useState } from 'react';
import { Minus, Plus, ShoppingCart, Check } from 'lucide-react';
import { Product } from '@/types';
import { useCart } from '@/features/cart/hooks/useCart';
import { Button } from '@/components/ui/Button';

interface AddToCartButtonProps {
  product: Product;
  shopSlug: string;
  disabled?: boolean;
}

export function AddToCartButton({ product, shopSlug, disabled }: AddToCartButtonProps) {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const { addToCart } = useCart();

  const maxQty = product.trackInventory ? product.quantity : 99;

  function handleAdd() {
    addToCart(product, quantity, shopSlug);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Quantity selector */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Quantity</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1 || disabled}
            className="h-8 w-8 rounded border border-input flex items-center justify-center disabled:opacity-40 hover:bg-muted transition-colors"
          >
            <Minus className="h-3 w-3" />
          </button>
          <span className="w-8 text-center text-sm font-medium">{quantity}</span>
          <button
            onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
            disabled={quantity >= maxQty || disabled}
            className="h-8 w-8 rounded border border-input flex items-center justify-center disabled:opacity-40 hover:bg-muted transition-colors"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Add to cart */}
      <Button
        onClick={handleAdd}
        disabled={disabled || added}
        className="w-full gap-2"
      >
        {added ? (
          <>
            <Check className="h-4 w-4" />
            Added to cart
          </>
        ) : (
          <>
            <ShoppingCart className="h-4 w-4" />
            Add to cart
          </>
        )}
      </Button>
    </div>
  );
}
