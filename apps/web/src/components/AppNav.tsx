'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface AppNavProps {
  companyName: string;
  inboxUnread: number;
  pendingApprovals: number;
  syncMinutesAgo: number;
  crmType: string;
}

export function AppNav({
  companyName,
  inboxUnread,
  pendingApprovals,
  syncMinutesAgo,
  crmType,
}: AppNavProps) {
  const pathname = usePathname();

  const navItems = [
    {
      href: '/dashboard',
      label: 'Dashboard',
      icon: '⚡',
      badge: pendingApprovals > 0 ? pendingApprovals : null,
      badgeColor: 'bg-orange-500',
    },
    {
      href: '/inbox',
      label: 'Inbox',
      icon: '📬',
      badge: inboxUnread > 0 ? inboxUnread : null,
      badgeColor: 'bg-blue-500',
    },
    {
      href: '/help',
      label: 'Help',
      icon: '?',
      badge: null,
      badgeColor: '',
    },
  ];

  const syncLabel =
    syncMinutesAgo < 2
      ? '< 1m ago'
      : syncMinutesAgo < 60
      ? `${syncMinutesAgo}m ago`
      : `${Math.round(syncMinutesAgo / 60)}h ago`;

  return (
    <header className="sticky top-0 z-50 bg-[#0a0a0f]/95 backdrop-blur border-b border-[#1e1e2e]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-14">

          {/* Left: logo + company */}
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-2 group">
              <div className="w-7 h-7 rounded-md bg-green-500 flex items-center justify-center group-hover:bg-green-400 transition-colors">
                <span className="text-black font-bold text-xs">FS</span>
              </div>
              <span className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">
                FieldSync
              </span>
            </Link>
            <div className="h-4 w-px bg-[#2a2a3a] hidden sm:block" />
            <span className="text-sm font-medium text-slate-400 hidden sm:block">{companyName}</span>
            <span className="text-xs px-2 py-0.5 bg-blue-500/15 text-blue-300 border border-blue-500/25 rounded-full hidden sm:block">
              {crmType}
            </span>
          </div>

          {/* Center: nav */}
          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    active
                      ? 'bg-[#1a1a24] text-slate-100'
                      : 'text-slate-500 hover:text-slate-300 hover:bg-[#1a1a24]'
                  }`}
                >
                  <span className="text-base leading-none">
                    {item.icon === '?' ? (
                      <span className="w-4 h-4 rounded-full border border-slate-600 text-xs flex items-center justify-center font-bold leading-none">
                        ?
                      </span>
                    ) : (
                      item.icon
                    )}
                  </span>
                  <span>{item.label}</span>
                  {item.badge != null && (
                    <span
                      className={`${item.badgeColor} text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none`}
                    >
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right: sync status + date */}
          <div className="flex items-center gap-4 text-xs text-slate-600">
            <div className="hidden md:flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span>Synced {syncLabel}</span>
            </div>
            <span className="hidden md:block">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
