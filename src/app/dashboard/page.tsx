import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Dashboard' };

/**
 * Shop owner dashboard — server component shell.
 * The actual stats and charts are loaded client-side via feature hooks
 * to avoid blocking the initial render on heavy data queries.
 */
export default function DashboardPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Orders today', value: '—' },
          { label: 'Revenue today', value: '—' },
          { label: 'Total products', value: '—' },
          { label: 'Pending orders', value: '—' },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Recent orders placeholder */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent orders</h2>
        <p className="text-gray-500 text-sm">Select a shop to view orders.</p>
      </div>
    </div>
  );
}
