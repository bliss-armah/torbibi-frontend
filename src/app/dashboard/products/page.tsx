import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus } from 'lucide-react';

export const metadata: Metadata = { title: 'Products' };

/**
 * Products dashboard page.
 * Product list is rendered client-side (feature component) so it can
 * react to shop selection, filters, and optimistic updates.
 */
export default function ProductsPage() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <Link
          href="/dashboard/products/new"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" />
          Add product
        </Link>
      </div>

      {/* Product list — client component for interactivity */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="p-6 text-center text-gray-500 text-sm">
          Select a shop to manage its products.
        </div>
      </div>
    </div>
  );
}
