'use client';

import Link from 'next/link';
import { Minus, Plus, Trash2, ShoppingCart } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store';
import { removeItem, updateQuantity, selectCartTotal, selectCartItemCount } from '@/store/slices/cartSlice';
import { formatPrice } from '@/lib/utils/format';
import { Button } from '@/components/ui/Button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';

interface CartSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CartSheet({ open, onOpenChange }: CartSheetProps) {
  const dispatch = useAppDispatch();
  const items = useAppSelector((s) => s.cart.items);
  const shopSlug = useAppSelector((s) => s.cart.shopSlug);
  const total = useAppSelector(selectCartTotal);
  const itemCount = useAppSelector(selectCartItemCount);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Cart {itemCount > 0 && <span className="text-muted-foreground font-normal">({itemCount})</span>}
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-3">
            <ShoppingCart className="h-12 w-12 text-muted-foreground/40" />
            <p className="text-muted-foreground text-sm">Your cart is empty</p>
          </div>
        ) : (
          <>
            {/* Items list */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {items.map(({ product, quantity }) => {
                const primaryImage = product.images.find((i) => i.isPrimary) ?? product.images[0];
                return (
                  <div key={product.id} className="flex gap-3">
                    {/* Thumbnail */}
                    <div className="h-16 w-16 flex-shrink-0 rounded-md overflow-hidden bg-muted">
                      {primaryImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={primaryImage.url} alt={primaryImage.alt} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">
                          No img
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground line-clamp-2">{product.name}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">{formatPrice(product.price)}</p>

                      {/* Quantity controls */}
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => dispatch(updateQuantity({ productId: product.id, quantity: quantity - 1 }))}
                          disabled={quantity <= 1}
                          className="h-6 w-6 rounded border border-input flex items-center justify-center disabled:opacity-40 hover:bg-muted transition-colors"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-sm w-5 text-center">{quantity}</span>
                        <button
                          onClick={() => dispatch(updateQuantity({ productId: product.id, quantity: quantity + 1 }))}
                          disabled={product.trackInventory && quantity >= product.quantity}
                          className="h-6 w-6 rounded border border-input flex items-center justify-center disabled:opacity-40 hover:bg-muted transition-colors"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => dispatch(removeItem(product.id))}
                          className="ml-auto text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <Separator />

            {/* Footer */}
            <div className="pt-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold text-foreground">{formatPrice(total)}</span>
              </div>
              <p className="text-xs text-muted-foreground">Delivery fee calculated at checkout</p>
              <Button asChild className="w-full" onClick={() => onOpenChange(false)}>
                <Link href={shopSlug ? `/${shopSlug}/checkout` : '#'}>Proceed to checkout</Link>
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
