'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { BarChart3, LayoutDashboard, LogOut, Users, Loader2, Database, ChevronLeft, Settings, CalendarCheck } from 'lucide-react';
import { seedDatabase } from '@/services/leadService';
import { toast } from 'sonner';
import { Logo } from './logo';

interface SidebarProps {
  className?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Sidebar({ className, isCollapsed, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const [isSeeding, setIsSeeding] = useState(false);

  const handleSeed = async () => {
    setIsSeeding(true);
    const toastId = toast.loading('Resetting database with sample data...');
    try {
      await seedDatabase(true);
      toast.success('Successfully loaded sample leads!', { id: toastId });
    } catch (err) {
      toast.error('Failed to reset database.', { id: toastId });
      console.error(err);
    } finally {
      setIsSeeding(false);
    }
  };

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Leads', href: '/leads', icon: Users },
    { name: 'Follow-ups', href: '/follow-ups', icon: CalendarCheck },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <aside
      className={cn(
        'hidden md:flex h-screen w-64 flex-col fixed left-0 top-0 border-r border-slate-100 dark:border-zinc-900/60 bg-white/70 dark:bg-zinc-950/65 backdrop-blur-2xl z-20 transition-transform duration-300 ease-in-out',
        isCollapsed ? '-translate-x-full' : 'translate-x-0',
        className
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-6 border-b border-slate-100 dark:border-zinc-900/60">
        <Logo />
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="h-7 w-7 rounded-lg flex items-center justify-center border border-slate-200/40 hover:bg-slate-100/50 hover:border-slate-300 text-slate-400 hover:text-slate-800 dark:border-zinc-800/40 dark:hover:bg-zinc-900/50 dark:hover:text-zinc-100 transition-all duration-200 cursor-pointer"
            title="Collapse sidebar"
          >
            <ChevronLeft className="h-4.5 w-4.5" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-2.5 px-3 py-6">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group flex items-center gap-3.5 px-4.5 py-3 text-sm font-semibold transition-all duration-300 cursor-pointer relative overflow-hidden rounded-xl border border-transparent',
                isActive
                  ? 'bg-indigo-50/60 border-l-4 border-l-indigo-600 border-y-slate-100/20 border-r-slate-100/20 text-indigo-600 dark:bg-indigo-950/30 dark:border-l-4 dark:border-l-indigo-500 dark:border-y-zinc-900/30 dark:border-r-zinc-900/30 dark:text-indigo-400 font-bold shadow-xs'
                  : 'text-slate-500 hover:bg-slate-100/50 hover:text-slate-900 hover:border-slate-150/40 dark:text-zinc-400 dark:hover:bg-zinc-900/40 dark:hover:text-zinc-100 font-medium'
              )}
            >
              <item.icon
                className={cn(
                  'h-4.5 w-4.5 shrink-0 transition-all duration-355 group-hover:scale-115',
                  isActive
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-400 group-hover:text-indigo-500 dark:text-zinc-500 dark:group-hover:text-indigo-400'
                )}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Profile / Action */}
      <div className="border-t border-slate-100 dark:border-zinc-900/60 p-4 space-y-3.5">
        <button
          onClick={handleSeed}
          disabled={isSeeding}
          className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200/50 hover:border-indigo-500/30 bg-slate-50/50 hover:bg-indigo-500/5 text-slate-600 hover:text-indigo-600 px-3 py-2.5 text-xs font-bold dark:border-zinc-800/50 dark:bg-zinc-900/20 dark:hover:bg-indigo-950/20 dark:text-zinc-300 dark:hover:text-indigo-400 transition-all duration-200 cursor-pointer"
        >
          {isSeeding ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Database className="h-3.5 w-3.5 text-indigo-500 transition-transform duration-300 group-hover:rotate-12" />
          )}
          Reset/Seed Demo Data
        </button>

        <div className="flex items-center justify-between rounded-xl p-3 bg-white/70 border border-slate-200/60 shadow-xs dark:bg-zinc-950/50 dark:border-zinc-900/50">
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-xs font-bold text-slate-800 dark:text-zinc-200">
                Owner Account
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            </div>
            <span className="truncate text-[10px] font-semibold text-slate-400 dark:text-zinc-400 pt-0.5">
              admin@hyperlocal.com
            </span>
          </div>
          <button
            onClick={() => logout()}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-rose-600 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-rose-400 transition-all cursor-pointer hover:scale-105"
            title="Log out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
