'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarDays, Users, PlusCircle, Settings } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Hoy', href: '/', icon: CalendarDays },
    { label: 'Clientes', href: '/clients', icon: Users },
    { label: 'Nuevo Ciclo', href: '/cycles/new', icon: PlusCircle },
    { label: 'Ajustes', href: '/settings', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/90 backdrop-blur-xl border-t border-slate-800/80 px-2 pb-safe md:px-6 md:pb-3">
      <div className="max-w-md md:max-w-lg mx-auto flex items-center justify-around py-2 md:py-2.5 md:bg-slate-950/80 md:border md:border-slate-800/80 md:rounded-2xl md:shadow-2xl">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 py-1 px-2 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'text-indigo-400 font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div
                className={`p-1 rounded-xl transition-all ${
                  isActive ? 'bg-indigo-600/15' : ''
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

