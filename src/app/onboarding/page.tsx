'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { shopApi } from '@/lib/api/shop.api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { cn } from '@/lib/utils';

const createShopSchema = z.object({
  name: z.string().min(2, 'Shop name must be at least 2 characters').max(100),
  description: z.string().max(500).optional(),
  phone: z
    .string()
    .regex(/^(\+233|0)(2[034567]|5[045679])\d{7}$/, 'Enter a valid Ghanaian phone number'),
  email: z.string().email('Enter a valid email address').optional().or(z.literal('')),
});

type CreateShopValues = z.infer<typeof createShopSchema>;

export default function OnboardingPage() {
  const router = useRouter();

  const form = useForm<CreateShopValues>({
    resolver: zodResolver(createShopSchema),
    defaultValues: { name: '', description: '', phone: '', email: '' },
  });

  async function onSubmit(values: CreateShopValues) {
    try {
      await shopApi.create({
        name: values.name,
        description: values.description || undefined,
        phone: values.phone,
        email: values.email || undefined,
      });
      router.replace('/dashboard');
    } catch (err: unknown) {
      const msg =
        (err as { message?: string })?.message ?? 'Failed to create shop. Please try again.';
      form.setError('root', { message: msg });
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary">Torbibi</h1>
          <p className="mt-1 text-sm text-muted-foreground">Set up your shop to get started</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create your shop</CardTitle>
            <CardDescription>
              This is your storefront — customers will browse your products here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shop name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Kofi Prints" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Description{' '}
                        <span className="text-muted-foreground font-normal">(optional)</span>
                      </FormLabel>
                      <FormControl>
                        <textarea
                          rows={3}
                          placeholder="Tell customers what you sell"
                          className={cn(
                            'flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
                          )}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone number</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="0XX XXX XXXX" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Email{' '}
                        <span className="text-muted-foreground font-normal">(optional)</span>
                      </FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="shop@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.formState.errors.root && (
                  <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? 'Creating shop…' : 'Create shop'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
