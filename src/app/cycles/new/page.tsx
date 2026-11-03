'use client';

import React from 'react';
import Header from '@/components/navigation/Header';
import BottomNav from '@/components/navigation/BottomNav';
import { PlusCircle, Calendar, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function NewCyclePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header title="Nuevo Ciclo" subtitle="Generador automático de fechas" />

      <main className="flex-1 max-w-md mx-auto w-full px-4 py-5 space-y-4 pb-24">
        {/* Placeholder Preview */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 text-center space-y-3 my-8">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 mx-auto flex items-center justify-center">
            <PlusCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-white">Generador Automático de Ciclos</h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            En la <strong className="text-indigo-300">Fase 2 (Núcleo)</strong> podrás seleccionar el cliente, plan (4 u 8 clases), frecuencia (1 o 2 por semana), días y fecha de inicio para calcular tentativamente las 4 semanas y la semana 5 de reposición.
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
