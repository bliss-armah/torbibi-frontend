'use client';

import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ImagePlus, X, Star } from 'lucide-react';
import { productApi } from '@/lib/api/product.api';
import { Product } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { cn } from '@/lib/utils';

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z
  .object({
    name: z.string().min(2, 'At least 2 characters').max(200, 'Max 200 characters'),
    description: z.string().max(2000, 'Max 2000 characters').optional(),
    priceGhs: z.coerce
      .number({ invalid_type_error: 'Enter a valid price' })
      .positive('Price must be greater than 0'),
    compareAtPriceGhs: z.coerce
      .number({ invalid_type_error: 'Enter a valid price' })
      .positive()
      .optional()
      .or(z.literal(0))
      .or(z.literal('')),
    sku: z.string().max(100).optional(),
    quantity: z.coerce
      .number()
      .int('Must be a whole number')
      .min(0, 'Cannot be negative')
      .default(0),
    trackInventory: z.boolean().default(false),
    tags: z.string().optional(),
    publishImmediately: z.boolean().default(false),
  })
  .refine(
    (d) => {
      if (!d.compareAtPriceGhs || d.compareAtPriceGhs === '') return true;
      return Number(d.compareAtPriceGhs) > d.priceGhs;
    },
    {
      message: 'Compare-at price must be higher than the selling price',
      path: ['compareAtPriceGhs'],
    }
  );

type FormValues = z.infer<typeof schema>;

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_IMAGE_BYTES = 1024 * 1024; // 1 MB — matches backend MAX_IMAGE_SIZE_BYTES

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Image item ───────────────────────────────────────────────────────────────

interface ImageItem {
  file: File;
  previewUrl: string;
  tooLarge: boolean;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface AddProductDialogProps {
  open: boolean;
  shopId: string;
  onOpenChange: (open: boolean) => void;
  onSuccess: (product: Product) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AddProductDialog({ open, shopId, onOpenChange, onSuccess }: AddProductDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageItems, setImageItems] = useState<ImageItem[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      description: '',
      priceGhs: '' as unknown as number,
      compareAtPriceGhs: '',
      sku: '',
      quantity: 0,
      trackInventory: false,
      tags: '',
      publishImmediately: false,
    },
  });

  function handleOpenChange(next: boolean) {
    if (!next) {
      imageItems.forEach((img) => URL.revokeObjectURL(img.previewUrl));
      setImageItems([]);
      form.reset();
    }
    onOpenChange(next);
  }

  function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const remaining = 5 - imageItems.length;
    const toAdd = files.slice(0, remaining).map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      tooLarge: file.size > MAX_IMAGE_BYTES,
    }));
    setImageItems((prev) => [...prev, ...toAdd]);
    e.target.value = '';
  }

  function removeImage(index: number) {
    URL.revokeObjectURL(imageItems[index].previewUrl);
    setImageItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function onSubmit(values: FormValues) {
    try {
      // 1. Upload images if any
      let images: Array<{ url: string; alt: string; isPrimary: boolean }> = [];
      if (imageItems.length > 0) {
        const uploaded = await productApi.uploadImages(
          shopId,
          imageItems.map((i) => i.file)
        );
        images = uploaded.map((u, idx) => ({
          url: u.url,
          alt: values.name,
          isPrimary: idx === 0,
        }));
      }

      // 2. Create product
      let product = await productApi.create(shopId, {
        name: values.name,
        description: values.description || undefined,
        price: Math.round(values.priceGhs * 100),
        compareAtPrice:
          values.compareAtPriceGhs && values.compareAtPriceGhs !== ''
            ? Math.round(Number(values.compareAtPriceGhs) * 100)
            : undefined,
        sku: values.sku || undefined,
        quantity: values.quantity,
        trackInventory: values.trackInventory,
        tags: values.tags
          ? values.tags
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
        images,
      });

      // 3. Publish if requested
      if (values.publishImmediately) {
        product = await productApi.updateStatus(shopId, product.id, 'active');
      }

      handleOpenChange(false);
      onSuccess(product);
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? 'Failed to create product.';
      form.setError('root', { message: msg });
    }
  }

  const publishImmediately = form.watch('publishImmediately');
  const hasOversizedImages = imageItems.some((i) => i.tooLarge);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add product</DialogTitle>
          <DialogDescription>
            Prices are in Ghana Cedis (GHS). Images are uploaded to Cloudinary (JPEG, PNG, WebP —
            max 1 MB each, up to 5).
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

            {/* ── Images ────────────────────────────────────────────────────── */}
            <div className="space-y-2">
              <Label>Product images</Label>

              <div className="grid grid-cols-3 gap-2">
                {imageItems.map((img, idx) => (
                  <div
                    key={img.previewUrl}
                    className={cn(
                      'relative aspect-square rounded-md overflow-hidden border bg-muted',
                      img.tooLarge ? 'border-destructive' : 'border-border'
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.previewUrl}
                      alt={`preview ${idx + 1}`}
                      className={cn('h-full w-full object-cover', img.tooLarge && 'opacity-50')}
                    />

                    {/* File size badge */}
                    <span
                      className={cn(
                        'absolute bottom-1 left-1 rounded px-1.5 py-0.5 text-[10px] font-medium',
                        img.tooLarge
                          ? 'bg-destructive text-white'
                          : 'bg-black/60 text-white'
                      )}
                    >
                      {img.tooLarge ? '⚠ ' : ''}{formatBytes(img.file.size)}
                    </span>

                    {/* Primary badge */}
                    {idx === 0 && !img.tooLarge && (
                      <span className="absolute top-1 left-1 flex items-center gap-0.5 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                        <Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400" />
                        Primary
                      </span>
                    )}

                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white hover:bg-black/80 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}

                {/* Add more slot */}
                {imageItems.length < 5 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      'flex aspect-square flex-col items-center justify-center gap-1.5 rounded-md border-2 border-dashed border-border bg-muted/40 text-muted-foreground transition-colors hover:border-primary/50 hover:bg-muted/60',
                      imageItems.length === 0 && 'col-span-3 aspect-auto py-8'
                    )}
                  >
                    <ImagePlus className="h-5 w-5" />
                    <span className="text-xs">
                      {imageItems.length === 0 ? 'Add images' : 'Add more'}
                    </span>
                  </button>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={handleFilesSelected}
              />

              {imageItems.some((i) => i.tooLarge) ? (
                <p className="text-xs text-destructive">
                  Some images exceed the 1 MB limit. Remove them before submitting.
                </p>
              ) : imageItems.length > 0 ? (
                <p className="text-xs text-muted-foreground">
                  First image is the primary thumbnail. Max 1 MB per image.
                </p>
              ) : null}
            </div>

            {/* ── Name ──────────────────────────────────────────────────────── */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Product name <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Kente fabric – large" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ── Description ───────────────────────────────────────────────── */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <textarea
                      rows={3}
                      placeholder="Describe your product…"
                      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ── Price + Compare-at ────────────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="priceGhs"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Price (GHS) <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          ₵
                        </span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          className="pl-7"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="compareAtPriceGhs"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Compare-at price</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          ₵
                        </span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          className="pl-7"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>Shown as strikethrough "was" price</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* ── SKU + Quantity ────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. KNT-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock quantity</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="1" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* ── Track inventory ───────────────────────────────────────────── */}
            <FormField
              control={form.control}
              name="trackInventory"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-3">
                    <input
                      id="trackInventory"
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="h-4 w-4 rounded border-input accent-primary cursor-pointer"
                    />
                    <div>
                      <Label htmlFor="trackInventory" className="cursor-pointer font-medium">
                        Track inventory
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Automatically reduce stock when orders are placed
                      </p>
                    </div>
                  </div>
                </FormItem>
              )}
            />

            {/* ── Tags ──────────────────────────────────────────────────────── */}
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. kente, fabric, handmade" {...field} />
                  </FormControl>
                  <FormDescription>Separate tags with commas</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.formState.errors.root && (
              <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
            )}

            {/* ── Footer ────────────────────────────────────────────────────── */}
            <DialogFooter className="flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {/* Publish toggle */}
              <FormField
                control={form.control}
                name="publishImmediately"
                render={({ field }) => (
                  <div className="flex items-center gap-2">
                    <input
                      id="publishImmediately"
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="h-4 w-4 rounded border-input accent-primary cursor-pointer"
                    />
                    <Label htmlFor="publishImmediately" className="cursor-pointer text-sm font-normal">
                      Publish immediately
                    </Label>
                  </div>
                )}
              />

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  disabled={form.formState.isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting || hasOversizedImages}>
                  {form.formState.isSubmitting
                    ? publishImmediately
                      ? 'Publishing…'
                      : 'Adding…'
                    : publishImmediately
                    ? 'Add & publish'
                    : 'Add as draft'}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
