'use client';

import React from 'react';

export function LogoIcon({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-600 to-indigo-400 p-1.5 shadow-md shadow-indigo-200/50 dark:shadow-none ${className}`}>
      {/* Outer Pulse rings */}
      <span className="absolute inline-flex h-full w-full rounded-xl bg-indigo-400 opacity-20 animate-ping" />
      
      {/* Custom modern logo SVG */}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-full w-full text-white"
      >
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    </div>
  );
}

export function Logo({ showTagline = true }: { showTagline?: boolean }) {
  return (
    <div className="flex items-center gap-3 select-none">
      <LogoIcon className="h-9 w-9" />
      <div className="flex flex-col">
        <h1 className="font-extrabold text-base tracking-tight text-slate-900 dark:text-zinc-50 leading-none">
          LocalPulse <span className="text-indigo-600 dark:text-indigo-400">CRM</span>
        </h1>
        {showTagline && (
          <span className="text-[10px] text-slate-400 dark:text-zinc-400 font-semibold tracking-wider uppercase mt-0.5">
            Hyperlocal SaaS
          </span>
        )}
      </div>
    </div>
  );
}
