'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { CalendarCheck2, LogOut, User } from 'lucide-react';

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export default function Header({ title = 'Ciclo App', subtitle }: HeaderProps) {
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-lg border-b border-slate-800/80 px-4 py-3">
      <div className="max-w-md mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <CalendarCheck2 className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight leading-tight">
              {title}
            </h1>
            {subtitle ? (
              <p className="text-[11px] text-slate-400 leading-none mt-0.5">{subtitle}</p>
            ) : user?.email ? (
              <p className="text-[11px] text-slate-400 leading-none mt-0.5 truncate max-w-[180px]">
                {user.email}
              </p>
            ) : null}
          </div>
        </div>

        {user && (
          <button
            onClick={() => signOut()}
            title="Cerrar sesión"
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
}

