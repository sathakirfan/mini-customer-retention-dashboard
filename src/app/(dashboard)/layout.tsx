'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Sidebar } from '@/components/layout/sidebar';
import { Navbar } from '@/components/layout/navbar';
import { Loader2, X, LogOut, Plus } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/layout/logo';

import { LeadFormDialog } from '@/components/leads/lead-form';
import { Footer } from '@/components/layout/footer';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const pathname = usePathname();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50/50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-slate-800 dark:text-zinc-100" />
          <span className="text-sm font-medium text-slate-500 dark:text-zinc-400 animate-pulse">
            Verifying secure session...
          </span>
        </div>
      </div>
    );
  }

  // Prevent render of dashboard content if not authenticated (redirect is handled by AuthProvider)
  if (!isAuthenticated) {
    return null;
  }

  const mobileNavLinks = [
    { name: 'Dashboard', href: '/' },
    { name: 'Leads', href: '/leads' },
    { name: 'Follow-ups', href: '/follow-ups' },
    { name: 'Analytics', href: '/analytics' },
    { name: 'Settings', href: '/settings' },
  ];

  return (
    <div className="min-h-screen">
      {/* Desktop Sidebar */}
      <Sidebar isCollapsed={isSidebarCollapsed} onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />

      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer content */}
          <div className="relative flex w-full max-w-xs flex-1 flex-col bg-white p-6 shadow-2xl dark:bg-zinc-950 transition-transform duration-300">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-4 dark:border-zinc-800">
              <Logo />
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 space-y-3 py-6">
              {mobileNavLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      'block rounded-lg px-4 py-3 text-sm font-semibold transition-colors',
                      isActive
                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-xs dark:from-zinc-100 dark:to-zinc-200 dark:text-zinc-950 font-bold'
                        : 'text-slate-600 hover:bg-slate-50 dark:text-zinc-400 dark:hover:bg-zinc-900 font-medium'
                    )}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-slate-200/60 pt-4 dark:border-zinc-800">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  logout();
                }}
                className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className={cn(
        "flex flex-col min-h-screen pt-16 transition-all duration-300 ease-in-out",
        isSidebarCollapsed ? "md:pl-0" : "md:pl-64"
      )}>
        <Navbar
          onMenuClick={() => setIsMobileMenuOpen(true)}
          onAddLeadClick={() => setIsAddLeadOpen(true)}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto pb-12">
          {children}
        </main>
        <Footer />
      </div>

      {/* Global Lead Form Dialog Container */}
      <LeadFormDialog isOpen={isAddLeadOpen} onClose={() => setIsAddLeadOpen(false)} />

      {/* Floating Action Button (FAB) for registering new leads */}
      <button
        onClick={() => setIsAddLeadOpen(true)}
        className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-950 border-none"
        title="Register New Lead"
      >
        <Plus className="h-6 w-6" />
      </button>
    </div>
  );
}
