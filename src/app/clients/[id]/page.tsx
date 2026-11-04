'use client';

import React, { useState, useEffect, use } from 'react';
import Header from '@/components/navigation/Header';
import BottomNav from '@/components/navigation/BottomNav';
import { getClientById, getCycles } from '@/lib/services/dataService';
import { Client, Cycle } from '@/types/database';
import { formatFriendlyDate } from '@/lib/cycleGenerator';
import {
  User,
  Phone,
  Mail,
  CalendarPlus,
  MessageCircle,
  ChevronLeft,
  CalendarCheck2,
  ChevronRight,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';

export default function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const clientId = resolvedParams.id;

  const [client, setClient] = useState<Client | null>(null);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [c, cy] = await Promise.all([
          getClientById(clientId),
          getCycles(clientId),
        ]);
        setClient(c);
        setCycles(cy);
      } catch (err) {
        console.error('Error loading client:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [clientId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-3" />
        <p className="text-xs text-slate-400">Cargando cliente...</p>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
        <h2 className="text-base font-bold text-white mb-2">Cliente no encontrado</h2>
        <Link href="/clients" className="text-indigo-400 text-xs font-semibold">
          &larr; Volver a Clientes
        </Link>
      </div>
    );
  }

  const cleanPhone = client.phone ? client.phone.replace(/[^0-9]/g, '') : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-lg border-b border-slate-800/80 px-4 py-3">
        <div className="max-w-md md:max-w-4xl mx-auto flex items-center justify-between">
          <Link
            href="/clients"
            className="flex items-center gap-1 text-slate-400 hover:text-white text-xs"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Clientes</span>
          </Link>
          <div className="text-xs font-bold text-white">Detalle de Cliente</div>
          <div className="w-8" />
        </div>
      </header>

      <main className="flex-1 max-w-md md:max-w-4xl mx-auto w-full px-4 py-4 md:py-6 space-y-4 md:space-y-6 pb-24 md:pb-28">
        {/* Profile Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider">
                Alumn@
              </span>
              <h2 className="text-xl font-extrabold text-white">{client.student_name}</h2>
              {client.guardian_name && (
                <p className="text-xs text-slate-300 mt-0.5">
                  Acudiente: {client.guardian_name}
                </p>
              )}
            </div>

            {cleanPhone && (
              <a
                href={`https://wa.me/${cleanPhone}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 transition-colors"
                title="Escribir por WhatsApp"
              >
                <MessageCircle className="w-5 h-5" />
              </a>
            )}
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-800 text-xs text-slate-300">
            {client.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-500" />
                <span>{client.phone}</span>
              </div>
            )}
            {client.email && (
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                <span>{client.email}</span>
              </div>
            )}
            {client.notes && (
              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-[11px] text-slate-400 mt-2">
                {client.notes}
              </div>
            )}
          </div>

          <div className="pt-2">
            <Link
              href={`/cycles/new?clientId=${client.id}`}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all"
            >
              <CalendarPlus className="w-4 h-4" />
              <span>Abrir Nuevo Ciclo</span>
            </Link>
          </div>
        </div>

        {/* Cycles History */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Historial de Ciclos ({cycles.length})
            </h3>
          </div>

          {cycles.length === 0 ? (
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 text-center text-xs text-slate-400">
              No tiene ciclos registrados aún.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {cycles.map((cy) => (
                <Link
                  key={cy.id}
                  href={`/cycles/${cy.id}`}
                  className="block p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <span>Plan {cy.plan_classes} clases ({cy.frequency}x sem)</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                            cy.is_paid
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          {cy.is_paid ? 'Pagado' : 'Pago pendiente'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Inicio: {formatFriendlyDate(cy.start_date)}
                      </p>
                    </div>

                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

