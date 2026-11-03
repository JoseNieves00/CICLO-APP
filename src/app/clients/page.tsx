'use client';

import React from 'react';
import Header from '@/components/navigation/Header';
import BottomNav from '@/components/navigation/BottomNav';
import { Users, UserPlus, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function ClientsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header title="Clientes" subtitle="Gestión de alumnos y acudientes" />

      <main className="flex-1 max-w-md mx-auto w-full px-4 py-5 space-y-4 pb-24">
        {/* Top Action */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white">Directorio de Clientes</h2>
            <p className="text-[11px] text-slate-400">Total: 0 registrados</p>
          </div>
          <button
            disabled
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600/30 text-indigo-300 text-xs font-medium cursor-not-allowed opacity-75"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Nuevo Cliente</span>
          </button>
        </div>

        {/* Empty State / Phase 2 Preview */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 text-center space-y-3 my-8">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 mx-auto flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-white">Aún no hay clientes registrados</h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Esta sección se activará en la <strong className="text-indigo-300">Fase 2 (Núcleo)</strong> para crear alumnos, asociar acudientes y teléfonos.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Volver al resumen de Fase 1</span>
            </Link>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
