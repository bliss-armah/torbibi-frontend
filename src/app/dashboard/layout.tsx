'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingBag, Package, ClipboardList, Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/features/auth/hooks/useAuth';

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: ShoppingBag },
  { href: '/dashboard/products', label: 'Products', icon: Package },
  { href: '/dashboard/orders', label: 'Orders', icon: ClipboardList },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { signOut } = useAuth();
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Desktop sidebar */}
      <aside className="hidden w-56 flex-col border-r border-border bg-background py-6 px-4 gap-1 md:flex">
        <div className="mb-4 px-2">
          <h1 className="text-xl font-bold text-primary">Torbibi</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">Shop dashboard</p>
        </div>

        <Separator className="mb-3" />

        {navItems.map(({ href, label, icon: Icon }) => {
          const active = href === '/dashboard' ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-primary/10 hover:text-primary'
              }`}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {label}
            </Link>
          );
        })}

        <div className="mt-auto">
          <Separator className="mb-3" />
          <Button
            variant="ghost"
            onClick={signOut}
            className="w-full justify-start gap-3 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex min-h-screen flex-1 flex-col">
        <main className="flex-1 pb-16 md:pb-0">{children}</main>

        {/* Mobile bottom nav */}
        <nav className="fixed bottom-0 left-0 right-0 flex border-t border-border bg-background pb-safe md:hidden">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = href === '/dashboard' ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-1 flex-col items-center gap-1 py-2 transition-colors ${
                  active ? 'text-primary' : 'text-muted-foreground hover:text-primary'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs">{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
