'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppSelector } from '@/lib/hooks';
import {
  HomeIcon,
  CalendarDaysIcon,
  TicketIcon,
  UsersIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useState } from 'react';

const adminLinks = [
  { href: '/dashboard', label: 'Overview', icon: HomeIcon },
  { href: '/dashboard/events', label: 'Events', icon: CalendarDaysIcon },
  { href: '/dashboard/reservations', label: 'Reservations', icon: TicketIcon },
  { href: '/dashboard/users', label: 'Users', icon: UsersIcon },
];

const participantLinks = [
  { href: '/dashboard', label: 'Overview', icon: HomeIcon },
  { href: '/dashboard/reservations', label: 'My Reservations', icon: TicketIcon },
];

export default function Sidebar() {
  const user = useAppSelector((state) => state.auth.user);
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const links = user?.role === 'admin' ? adminLinks : participantLinks;

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  const nav = (
    <nav className="space-y-1 px-3 py-4">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          onClick={() => setOpen(false)}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            isActive(link.href)
              ? 'bg-accent-muted text-accent'
              : 'text-light-muted hover:bg-border-strong hover:text-light'
          }`}
        >
          <link.icon className="h-5 w-5" />
          {link.label}
        </Link>
      ))}
    </nav>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed top-20 left-4 z-40 p-2 bg-dark-secondary rounded-lg shadow-md border border-border-strong"
      >
        <Bars3Icon className="h-5 w-5 text-light-muted" />
      </button>

      {/* Mobile overlay */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="fixed left-0 top-0 h-full w-64 bg-dark-secondary shadow-xl">
            <div className="flex items-center justify-between px-4 py-4 border-b border-border">
              <span className="font-bold text-accent">Dashboard</span>
              <button onClick={() => setOpen(false)}>
                <XMarkIcon className="h-5 w-5 text-light-muted" />
              </button>
            </div>
            {nav}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 border-r border-border bg-dark-secondary min-h-[calc(100vh-64px)]">
        <div className="px-4 py-4 border-b border-border">
          <span className="font-bold text-accent">Dashboard</span>
        </div>
        {nav}
      </aside>
    </>
  );
}
