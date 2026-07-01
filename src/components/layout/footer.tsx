'use client';

import * as React from 'react';
import { ShieldCheck, Heart, Layers } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-slate-100 dark:border-zinc-900 bg-white/40 dark:bg-zinc-950/20 backdrop-blur-md px-6 py-6 transition-colors duration-300">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left Side: Brand and description */}
        <div className="flex flex-col items-center md:items-start gap-1 text-center md:text-left">
          <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-zinc-200">
            <Layers className="h-3.5 w-3.5 text-indigo-500" />
            LocalPulse <span className="text-indigo-600 dark:text-indigo-400">CRM</span>
          </div>
          <span className="text-[10px] font-medium text-slate-400 dark:text-zinc-400">
            Hyperlocal Customer Retention & Analytics Panel
          </span>
        </div>

        {/* Middle: Heart / Build detail */}
        <div className="flex items-center gap-1 text-xs text-slate-400 dark:text-zinc-400 font-medium">
          <span>Crafted with</span>
          <Heart className="h-3 w-3 text-rose-500 fill-rose-500 animate-pulse" />
          <span>for Single Business Owners</span>
        </div>

        {/* Right Side: Copyright and Status */}
        <div className="flex flex-col md:flex-row items-center gap-3 md:gap-5">
          <span className="text-[11px] font-semibold text-slate-400 dark:text-zinc-400">
            &copy; {currentYear} LocalPulse CRM. All rights reserved.
          </span>
          
          <div className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
            <ShieldCheck className="h-3 w-3" />
            Active Secure
          </div>
        </div>
      </div>
    </footer>
  );
}
