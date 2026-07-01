'use client';

import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Menu, Plus, PanelLeftOpen } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

interface NavbarProps {
  onMenuClick?: () => void;
  onAddLeadClick?: () => void;
  className?: string;
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

export function Navbar({ onMenuClick, onAddLeadClick, className, isSidebarCollapsed, onToggleSidebar }: NavbarProps) {
  const pathname = usePathname();

  // Determine page title based on path
  const getPageTitle = () => {
    switch (pathname) {
      case '/':
        return 'Dashboard Overview';
      case '/leads':
        return 'Lead Directory';
      case '/analytics':
        return 'Revenue Analytics';
      case '/settings':
        return 'Settings & Preferences';
      default:
        if (pathname.startsWith('/leads/')) return 'Lead Details';
        return 'CRM Admin';
    }
  };

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-30 flex h-16 items-center border-b border-slate-100 dark:border-zinc-900 bg-white/70 dark:bg-zinc-950/70 px-6 backdrop-blur-xl transition-all duration-300 ease-in-out',
        isSidebarCollapsed ? 'left-0' : 'left-0 md:left-64',
        className
      )}
    >
      <div className="max-w-7xl w-full mx-auto flex items-center justify-between">
        {/* Left side: Hamburger (mobile) + Expand Sidebar (desktop) + Page Title */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 md:hidden dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
            title="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          {isSidebarCollapsed && onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="hidden md:inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200/50 hover:bg-slate-100/50 text-slate-500 hover:text-indigo-600 dark:border-zinc-800/50 dark:hover:bg-zinc-900/50 dark:hover:text-indigo-400 transition-colors cursor-pointer bg-white/50 dark:bg-zinc-950/50"
              title="Expand sidebar"
            >
              <PanelLeftOpen className="h-4.5 w-4.5" />
            </button>
          )}

          <div>
            <h2 className="text-base font-bold text-slate-955 dark:text-zinc-50 leading-tight">
              {getPageTitle()}
            </h2>
          </div>
        </div>

        {/* Right side: Current Date + Theme Toggle + Quick Action */}
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-block text-xs font-bold text-slate-500 dark:text-zinc-400 bg-slate-100/50 dark:bg-zinc-900/30 border border-slate-200/30 dark:border-zinc-800/30 rounded-full px-3.5 py-1">
            {todayStr}
          </span>
          <ThemeToggle />
          {onAddLeadClick && (
            <Button
              size="sm"
              onClick={onAddLeadClick}
              className="h-9 gap-1.5 font-bold shadow-md shadow-indigo-500/10 hover:shadow-lg hover:shadow-indigo-500/15 transition-all duration-200 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden xs:inline">Add Lead</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
