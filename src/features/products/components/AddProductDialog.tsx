'use client';

import { useRef, useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ImagePlus, X, Star } from 'lucide-react';
import { productApi } from '@/lib/api/product.api';
import { Product, ProductImage } from '@/types';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
    // Only used in edit mode — ignored in create (publishImmediately used instead)
    status: z.enum(['active', 'draft', 'archived']).optional(),
    publishImmediately: z.boolean().default(false),
  })
  .refine(
    (d) => {
      if (!d.compareAtPriceGhs || String(d.compareAtPriceGhs) === '') return true;
      return Number(d.compareAtPriceGhs) > d.priceGhs;
    },
    {
      message: 'Compare-at price must be higher than the selling price',
      path: ['compareAtPriceGhs'],
    }
  );

type FormValues = z.infer<typeof schema>;

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_IMAGES = 5;
const MAX_IMAGE_BYTES = 1024 * 1024; // 1 MB

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Image state types ────────────────────────────────────────────────────────

/** An existing image on the product — can be marked for removal */
interface ExistingImageItem {
  image: ProductImage;
  kept: boolean;
}

/** A newly selected local file — to be uploaded on submit */
interface NewImageItem {
  file: File;
  previewUrl: string;
  tooLarge: boolean;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface AddProductDialogProps {
  open: boolean;
  shopId: string;
  /** When provided the dialog operates in edit mode; absent = create mode */
  product?: Product;
  onOpenChange: (open: boolean) => void;
  onSuccess: (product: Product) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AddProductDialog({
  open,
  shopId,
  product,
  onOpenChange,
  onSuccess,
}: AddProductDialogProps) {
  const isEditMode = !!product;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [existingItems, setExistingItems] = useState<ExistingImageItem[]>([]);
  const [newImageItems, setNewImageItems] = useState<NewImageItem[]>([]);

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
      status: 'draft',
      publishImmediately: false,
    },
  });

  // Populate form and image state when dialog opens
  useEffect(() => {
    if (open && product) {
      form.reset({
        name: product.name,
        description: product.description ?? '',
        priceGhs: product.price / 100,
        compareAtPriceGhs: product.compareAtPrice ? product.compareAtPrice / 100 : '',
        sku: product.sku ?? '',
        quantity: product.quantity,
        trackInventory: product.trackInventory,
        tags: product.tags.join(', '),
        status: product.status,
        publishImmediately: false,
      });
      setExistingItems(product.images.map((image) => ({ image, kept: true })));
      setNewImageItems([]);
    } else if (open && !product) {
      form.reset({
        name: '',
        description: '',
        priceGhs: '' as unknown as number,
        compareAtPriceGhs: '',
        sku: '',
        quantity: 0,
        trackInventory: false,
        tags: '',
        status: 'draft',
        publishImmediately: false,
      });
      setExistingItems([]);
      setNewImageItems([]);
    }
  }, [open, product, form]);

  function handleOpenChange(next: boolean) {
    if (!next) {
      newImageItems.forEach((img) => URL.revokeObjectURL(img.previewUrl));
      setNewImageItems([]);
      setExistingItems([]);
      form.reset();
    }
    onOpenChange(next);
  }

  const keptCount = existingItems.filter((e) => e.kept).length;
  const totalImageCount = keptCount + newImageItems.length;
  const remainingSlots = MAX_IMAGES - totalImageCount;

  function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const toAdd = files.slice(0, remainingSlots).map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      tooLarge: file.size > MAX_IMAGE_BYTES,
    }));
    setNewImageItems((prev) => [...prev, ...toAdd]);
    e.target.value = '';
  }

  function removeExisting(index: number) {
    setExistingItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, kept: false } : item))
    );
  }

  function restoreExisting(index: number) {
    if (totalImageCount >= MAX_IMAGES) return; // already at limit
    setExistingItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, kept: true } : item))
    );
  }

  function removeNew(index: number) {
    URL.revokeObjectURL(newImageItems[index].previewUrl);
    setNewImageItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function onSubmit(values: FormValues) {
    try {
      // 1. Upload any new files
      let uploaded: Array<{ url: string; publicId: string }> = [];
      const validNew = newImageItems.filter((i) => !i.tooLarge);
      if (validNew.length > 0) {
        uploaded = await productApi.uploadImages(shopId, validNew.map((i) => i.file));
      }

      // 2. Build final images array: kept existing first, then newly uploaded
      const keptImages = existingItems.filter((e) => e.kept).map((e) => e.image);
      const freshImages = uploaded.map((u, i) => ({
        url: u.url,
        publicId: u.publicId,
        alt: values.name,
        isPrimary: keptImages.length === 0 && i === 0,
      }));
      const finalImages: ProductImage[] = [...keptImages, ...freshImages];
      // Ensure the first image is always primary
      if (finalImages.length > 0) {
        finalImages.forEach((img, i) => { img.isPrimary = i === 0; });
      }

      const payload = {
        name: values.name,
        description: values.description || undefined,
        price: Math.round(values.priceGhs * 100),
        compareAtPrice:
          values.compareAtPriceGhs && String(values.compareAtPriceGhs) !== ''
            ? Math.round(Number(values.compareAtPriceGhs) * 100)
            : undefined,
        sku: values.sku || undefined,
        quantity: values.quantity,
        trackInventory: values.trackInventory,
        tags: values.tags
          ? values.tags.split(',').map((t) => t.trim()).filter(Boolean)
          : [],
        images: finalImages,
      };

      if (isEditMode) {
        // 3a. Edit mode: update product then set status if changed
        let updated = await productApi.update(shopId, product!.id, payload);
        if (values.status && values.status !== product!.status) {
          updated = await productApi.updateStatus(shopId, product!.id, values.status);
        }
        handleOpenChange(false);
        onSuccess(updated);
      } else {
        // 3b. Create mode: create then optionally publish
        let created = await productApi.create(shopId, payload);
        if (values.publishImmediately) {
          created = await productApi.updateStatus(shopId, created.id, 'active');
        }
        handleOpenChange(false);
        onSuccess(created);
      }
    } catch (err: unknown) {
      const msg =
        (err as { message?: string })?.message ??
        (isEditMode ? 'Failed to update product.' : 'Failed to create product.');
      form.setError('root', { message: msg });
    }
  }

  const hasOversizedImages = newImageItems.some((i) => i.tooLarge);
  const publishImmediately = form.watch('publishImmediately');

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit product' : 'Add product'}</DialogTitle>
          {!isEditMode && (
            <DialogDescription>
              Prices are in Ghana Cedis (GHS). Images are uploaded to Cloudinary (JPEG, PNG, WebP —
              max 1 MB each, up to 5).
            </DialogDescription>
          )}
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

            {/* ── Images ────────────────────────────────────────────────────── */}
            <div className="space-y-2">
              <Label>Product images</Label>

              <div className="grid grid-cols-3 gap-2">
                {/* Existing images (edit mode) */}
                {existingItems.map((item, idx) => (
                  <div
                    key={`existing-${idx}`}
                    className={cn(
                      'relative aspect-square rounded-md overflow-hidden border bg-muted',
                      !item.kept ? 'opacity-40 border-dashed border-muted-foreground' : 'border-border'
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.image.url}
                      alt={item.image.alt}
                      className="h-full w-full object-cover"
                    />

                    {/* Primary badge */}
                    {item.kept && idx === 0 && existingItems.filter(e => e.kept).indexOf(item) === 0 && (
                      <span className="absolute top-1 left-1 flex items-center gap-0.5 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                        <Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400" />
                        Primary
                      </span>
                    )}

                    {item.kept ? (
                      <button
                        type="button"
                        onClick={() => removeExisting(idx)}
                        className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white hover:bg-black/80 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => restoreExisting(idx)}
                        disabled={totalImageCount >= MAX_IMAGES}
                        className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-foreground bg-background/70 hover:bg-background/90 transition-colors disabled:cursor-not-allowed"
                      >
                        Restore
                      </button>
                    )}
                  </div>
                ))}

                {/* New image previews */}
                {newImageItems.map((img, idx) => (
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
                      alt={`new preview ${idx + 1}`}
                      className={cn('h-full w-full object-cover', img.tooLarge && 'opacity-50')}
                    />

                    {/* Primary badge for first new image when no existing images are kept */}
                    {keptCount === 0 && idx === 0 && !img.tooLarge && (
                      <span className="absolute top-1 left-1 flex items-center gap-0.5 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                        <Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400" />
                        Primary
                      </span>
                    )}

                    <span
                      className={cn(
                        'absolute bottom-1 left-1 rounded px-1.5 py-0.5 text-[10px] font-medium',
                        img.tooLarge ? 'bg-destructive text-white' : 'bg-black/60 text-white'
                      )}
                    >
                      {img.tooLarge ? '⚠ ' : ''}{formatBytes(img.file.size)}
                    </span>

                    <button
                      type="button"
                      onClick={() => removeNew(idx)}
                      className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white hover:bg-black/80 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}

                {/* Add more slot */}
                {remainingSlots > 0 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      'flex aspect-square flex-col items-center justify-center gap-1.5 rounded-md border-2 border-dashed border-border bg-muted/40 text-muted-foreground transition-colors hover:border-primary/50 hover:bg-muted/60',
                      totalImageCount === 0 && 'col-span-3 aspect-auto py-8'
                    )}
                  >
                    <ImagePlus className="h-5 w-5" />
                    <span className="text-xs">
                      {totalImageCount === 0 ? 'Add images' : 'Add more'}
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

              {hasOversizedImages ? (
                <p className="text-xs text-destructive">
                  Some images exceed the 1 MB limit. Remove them before submitting.
                </p>
              ) : totalImageCount > 0 ? (
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
                    <FormDescription>Shown as strikethrough &quot;was&quot; price</FormDescription>
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

            {/* ── Status (edit mode only) ───────────────────────────────────── */}
            {isEditMode && (
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active — visible to buyers</SelectItem>
                        <SelectItem value="draft">Draft — hidden from buyers</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {form.formState.errors.root && (
              <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
            )}

            {/* ── Footer ────────────────────────────────────────────────────── */}
            <DialogFooter className="flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {/* Publish toggle (create mode only) */}
              {!isEditMode && (
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
              )}

              <div className="flex gap-2 sm:ml-auto">
                {isEditMode && (
                  <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                    Cancel
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={form.formState.isSubmitting || hasOversizedImages}
                >
                  {form.formState.isSubmitting
                    ? isEditMode ? 'Saving…' : 'Creating…'
                    : isEditMode
                    ? 'Save changes'
                    : publishImmediately
                    ? 'Create & publish'
                    : 'Create product'}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
