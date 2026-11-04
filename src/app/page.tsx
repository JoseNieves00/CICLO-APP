'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/navigation/Header';
import BottomNav from '@/components/navigation/BottomNav';
import MarkClassModal from '@/components/cycles/MarkClassModal';
import { useAuth } from '@/context/AuthContext';
import { getClients, getCycles, getCycleWithDetails, updateClassStatus } from '@/lib/services/dataService';
import { Client, Cycle, ClassSession, ClassStatus } from '@/types/database';
import { formatFriendlyDate } from '@/lib/cycleGenerator';
import {
  CalendarCheck2,
  Users,
  Clock,
  Sparkles,
  ArrowRight,
  Database,
  Calendar,
  AlertTriangle,
  PlusCircle,
  UserPlus,
  ChevronRight,
  CheckCircle2,
  DollarSign,
} from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const { user, isConfigured } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<ClassSession | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [fetchedClients, fetchedCycles] = await Promise.all([
        getClients(),
        getCycles(),
      ]);
      setClients(fetchedClients);
      setCycles(fetchedCycles);
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const activeCycles = cycles.filter(
    (c) => c.status === 'active' || c.status === 'in_reposicion'
  );
  const pendingPayments = cycles.filter((c) => !c.is_paid);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header
        title="Ciclo App"
        subtitle={isConfigured ? (user?.email || 'Conectado a Supabase') : 'Modo Local / Demo'}
      />

      <main className="flex-1 max-w-md mx-auto w-full px-4 py-4 space-y-4 pb-24">
        {/* Banner if local/demo mode */}
        {!isConfigured && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-amber-300">
                <Database className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Modo Demostración / Local Activo</span>
              </div>
              <p className="text-[11px] text-amber-200/90 leading-tight">
                Puedes probar la gestión de clientes, generador y clases ahora mismo. Tus datos se guardan en el navegador.
              </p>
            </div>
            <Link
              href="/settings"
              className="flex-shrink-0 px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-200 font-semibold text-[11px] hover:bg-amber-500/30 transition-colors"
            >
              Configurar
            </Link>
          </div>
        )}

        {/* Quick Action Shortcuts */}
        <div className="grid grid-cols-2 gap-2.5">
          <Link
            href="/clients"
            className="p-3.5 rounded-2xl bg-indigo-600/15 border border-indigo-500/30 hover:bg-indigo-600/25 transition-all flex items-center gap-3 text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Clientes</div>
              <div className="text-[10px] text-indigo-300">
                {clients.length} registrado{clients.length !== 1 ? 's' : ''}
              </div>
            </div>
          </Link>

          <Link
            href="/cycles/new"
            className="p-3.5 rounded-2xl bg-emerald-600/15 border border-emerald-500/30 hover:bg-emerald-600/25 transition-all flex items-center gap-3 text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Nuevo Ciclo</div>
              <div className="text-[10px] text-emerald-300">Generar fechas</div>
            </div>
          </Link>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-3.5">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-medium">Ciclos Activos</span>
              <Calendar className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl font-extrabold text-white">{activeCycles.length}</div>
            <p className="text-[10px] text-slate-500 mt-0.5">En progreso</p>
          </div>

          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-3.5">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-medium">Pagos Pendientes</span>
              <DollarSign className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl font-extrabold text-white">{pendingPayments.length}</div>
            <p className="text-[10px] text-slate-500 mt-0.5">Clientes por pagar</p>
          </div>
        </div>

        {/* Active Cycles Section */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Ciclos en Curso ({activeCycles.length})</span>
            </h3>
            <Link href="/cycles/new" className="text-[11px] text-indigo-400 font-semibold">
              + Abrir ciclo
            </Link>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-500">Cargando ciclos...</div>
          ) : activeCycles.length === 0 ? (
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 text-center space-y-2">
              <Calendar className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400 font-medium">No hay ciclos activos</p>
              <p className="text-[11px] text-slate-500">
                Abre un ciclo para programar las clases de tus alumnos.
              </p>
              <Link
                href="/cycles/new"
                className="inline-flex items-center gap-1 mt-1 text-xs text-indigo-400 font-semibold"
              >
                <span>Generar primer ciclo</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          ) : (
            <div className="space-y-2.5">
              {activeCycles.map((cy) => {
                const client = clients.find((c) => c.id === cy.client_id);
                return (
                  <Link
                    key={cy.id}
                    href={`/cycles/${cy.id}`}
                    className="block p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all space-y-2.5 group"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                          {client ? client.student_name : 'Alumno'}
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Plan {cy.plan_classes} clases ({cy.frequency}x sem) • Inicio:{' '}
                          {formatFriendlyDate(cy.start_date)}
                        </p>
                      </div>

                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-lg font-semibold border ${
                          cy.is_paid
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                        }`}
                      >
                        {cy.is_paid ? 'Pagado' : 'Pago pendiente'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-indigo-400 pt-1 border-t border-slate-800/60">
                      <span className="text-slate-400 text-[11px]">
                        Estado: {cy.status === 'in_reposicion' ? 'En reposición' : 'Activo'}
                      </span>
                      <div className="flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        <span>Gestionar clases</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
