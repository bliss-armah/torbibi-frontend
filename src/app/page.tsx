import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Torbibi — Shop Local, Shop Ghana',
  description: 'Discover the best local shops in Ghana. Order online and get delivered to your door.',
};

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background flex flex-col">
      {/* Nav */}
      <nav className="border-b border-border">
        <div className="container flex h-16 items-center justify-between">
          <span className="text-xl font-bold text-primary">Torbibi</span>
          <Link
            href="/login"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Sign in
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="container flex flex-1 flex-col items-center justify-center gap-6 py-24 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
          Shop Local,{' '}
          <span className="text-primary">Shop Ghana</span>
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          Discover the best local shops across Ghana. Support small businesses and get your
          favourite products delivered right to your door.
        </p>
        <div className="flex gap-4">
          <Link
            href="/login"
            className="rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow transition-opacity hover:opacity-90"
          >
            Get started
          </Link>
          <Link
            href="/dashboard"
            className="rounded-md border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-muted"
          >
            Open your shop
          </Link>
        </div>
      </section>

      {/* Feature grid */}
      <section className="border-t border-border bg-muted/40">
        <div className="container grid gap-8 py-16 sm:grid-cols-3">
          {[
            {
              title: 'Local shops',
              description: 'Browse hundreds of verified Ghanaian businesses in one place.',
            },
            {
              title: 'Secure payments',
              description: 'Pay safely with Mobile Money or card via Paystack.',
            },
            {
              title: 'Fast delivery',
              description: 'Get your orders delivered quickly by trusted riders.',
            },
          ].map((feature) => (
            <div key={feature.title} className="rounded-xl bg-card border border-border p-6 shadow-sm">
              <h3 className="font-semibold text-foreground">{feature.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-6">
        <div className="container text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Torbibi. All rights reserved.
        </div>
      </footer>
    </main>
  );
}
