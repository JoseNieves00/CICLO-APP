'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/navigation/Header';
import BottomNav from '@/components/navigation/BottomNav';
import PaymentReminderModal from '@/components/cycles/PaymentReminderModal';
import { useAuth } from '@/context/AuthContext';
import { getClients, getCycles, updateClient } from '@/lib/services/dataService';
import { Client, Cycle } from '@/types/database';
import { formatFriendlyDate } from '@/lib/cycleGenerator';
import { formatCurrency } from '@/lib/whatsappTemplates';
import {
  evaluateCycleReminder,
  getPrudentHoursStatus,
  isCycleInFinalWeek,
  CycleReminderEvaluation,
} from '@/lib/paymentReminderEngine';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  checkAndSendLocalReminderNotification,
} from '@/lib/notificationService';
import {
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
  MessageCircle,
  Bell,
  BellRing,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const { user, isConfigured } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEarlyPayments, setShowEarlyPayments] = useState(false);

  // Browser notification permission state
  const [notificationStatus, setNotificationStatus] = useState<NotificationPermission | 'unsupported'>('default');

  // Prudent hours tracking
  const [prudentStatus, setPrudentStatus] = useState(getPrudentHoursStatus());

  // States for payment reminder modal
  const [reminderModalData, setReminderModalData] = useState<{
    client: Client;
    cycle: Cycle;
  } | null>(null);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [fetchedClients, fetchedCycles] = await Promise.all([
        getClients(),
        getCycles(),
      ]);
      setClients(fetchedClients);
      setCycles(fetchedCycles);

      // Check browser notification support & permission
      if (isNotificationSupported()) {
        const perm = getNotificationPermission();
        setNotificationStatus(perm);
        if (perm === 'granted') {
          checkAndSendLocalReminderNotification(fetchedCycles, fetchedClients);
        }
      } else {
        setNotificationStatus('unsupported');
      }
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();

    // Check prudent hours status every minute
    const interval = setInterval(() => {
      setPrudentStatus(getPrudentHoursStatus());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const handleEnableNotifications = async () => {
    const perm = await requestNotificationPermission();
    setNotificationStatus(perm);
    if (perm === 'granted') {
      checkAndSendLocalReminderNotification(cycles, clients, { force: true });
    }
  };

  const handleUpdatePhone = async (newPhone: string) => {
    if (!reminderModalData) return;
    const updated = await updateClient(reminderModalData.client.id, { phone: newPhone });
    setClients((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setReminderModalData((prev) => (prev ? { ...prev, client: updated } : null));
  };

  const handleReminderSent = (updatedCycle: Cycle) => {
    setCycles((prev) => prev.map((c) => (c.id === updatedCycle.id ? updatedCycle : c)));
  };

  const activeCycles = cycles.filter(
    (c) => c.status === 'active' || c.status === 'in_reposicion'
  );
  const pendingPayments = cycles.filter((c) => !c.is_paid);

  // Clasificación inteligente de cobros:
  // 1. Cobros debidos (ya están en su última semana, reposición o vencidos)
  const dueReminders = pendingPayments.filter((c) => isCycleInFinalWeek(c));
  // 2. Cobros aún en semanas iniciales (semanas 1 a 3)
  const earlyPayments = pendingPayments.filter((c) => !isCycleInFinalWeek(c));

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
                Puedes gestionar clientes, ciclos y enviar cobros por WhatsApp ahora mismo.
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
              <span className="text-[11px] font-medium">Cobros Semana Final</span>
              <DollarSign className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl font-extrabold text-white">{dueReminders.length}</div>
            <p className="text-[10px] text-slate-500 mt-0.5">Listos para recordar</p>
          </div>
        </div>

        {/* Prudent Contact Hours & Notifications Status Bar */}
        <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800/80 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`w-2 h-2 rounded-full flex-shrink-0 ${
                prudentStatus.isPrudent ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <div className="truncate">
              <span className="font-semibold text-slate-200">
                {prudentStatus.isPrudent ? 'Horario moderado (9 AM - 7 PM)' : 'Fuera de horario sugerido'}
              </span>
              <span className="text-[10px] text-slate-400 ml-1.5 hidden sm:inline">
                ({prudentStatus.currentHourStr})
              </span>
            </div>
          </div>

          {notificationStatus === 'default' && (
            <button
              type="button"
              onClick={handleEnableNotifications}
              className="flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-[11px] font-medium transition-colors"
            >
              <Bell className="w-3 h-3" />
              <span>Activar alertas</span>
            </button>
          )}

          {notificationStatus === 'granted' && (
            <span className="flex-shrink-0 inline-flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
              <BellRing className="w-3 h-3" />
              <span>Alertas activas</span>
            </span>
          )}
        </div>

        {/* Recordatorios de Cobro (SEMANA FINAL Y REPOSICIÓN) */}
        {dueReminders.length > 0 ? (
          <div className="bg-gradient-to-br from-amber-950/40 via-slate-900/90 to-slate-900 border border-amber-500/30 rounded-3xl p-4 space-y-3 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Cobros Semana Final ({dueReminders.length})</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold">
                WhatsApp
              </span>
            </div>

            <p className="text-[11px] text-slate-400 leading-tight">
              Alumnos en su última semana de clases o semana de reposición con pago pendiente:
            </p>

            <div className="space-y-2">
              {dueReminders.map((cy) => {
                const client = clients.find((c) => c.id === cy.client_id);
                if (!client) return null;

                const evaluation: CycleReminderEvaluation = evaluateCycleReminder(cy);

                return (
                  <div
                    key={cy.id}
                    className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white truncate">
                          {client.student_name}
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-semibold border ${
                            evaluation.badgeColor === 'rose'
                              ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                              : evaluation.badgeColor === 'amber'
                              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                              : evaluation.badgeColor === 'indigo'
                              ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                        >
                          {evaluation.badgeLabel}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-400 truncate">
                        {client.guardian_name ? `${client.guardian_name} • ` : ''}
                        {evaluation.weekInfo.label} • {cy.price ? formatCurrency(cy.price) : `Plan ${cy.plan_classes} clases`}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setReminderModalData({ client, cycle: cy })}
                      className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 transition-all"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Cobrar</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-3.5 rounded-2xl bg-slate-900/50 border border-slate-800 text-xs text-slate-400 flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>No hay cobros pendientes para hoy. ¡Todo al día!</span>
          </div>
        )}

        {/* Cobros en semanas iniciales (Semanas 1 a 3) - Colapsable */}
        {earlyPayments.length > 0 && (
          <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowEarlyPayments(!showEarlyPayments)}
              className="w-full p-3 flex items-center justify-between text-xs text-slate-400 hover:text-slate-300 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Info className="w-3.5 h-3.5 text-slate-500" />
                <span>Ciclos en semanas iniciales sin cobrar ({earlyPayments.length})</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-500">
                <span>{showEarlyPayments ? 'Ocultar' : 'Ver'}</span>
                {showEarlyPayments ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </div>
            </button>

            {showEarlyPayments && (
              <div className="p-3 pt-0 space-y-2 border-t border-slate-800/40">
                <p className="text-[11px] text-slate-500">
                  Estos ciclos aún van en las semanas 1 a 3. El recordatorio se activará automáticamente al llegar a la Semana 4:
                </p>
                {earlyPayments.map((cy) => {
                  const client = clients.find((c) => c.id === cy.client_id);
                  if (!client) return null;
                  const evalEarly = evaluateCycleReminder(cy);

                  return (
                    <div
                      key={cy.id}
                      className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60 flex items-center justify-between text-xs"
                    >
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-300 truncate">
                          {client.student_name}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {evalEarly.weekInfo.label} • Activa el {formatFriendlyDate(evalEarly.weekInfo.finalWeekStartDate)}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setReminderModalData({ client, cycle: cy })}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium"
                      >
                        Anticipar
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

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
                          {client ? client.student_name : 'Alumn@'}
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

      {/* Modal for sending WhatsApp payment reminder */}
      {reminderModalData && (
        <PaymentReminderModal
          isOpen={Boolean(reminderModalData)}
          onClose={() => setReminderModalData(null)}
          client={reminderModalData.client}
          cycle={reminderModalData.cycle}
          onUpdatePhone={handleUpdatePhone}
          onReminderSent={handleReminderSent}
        />
      )}

      <BottomNav />
    </div>
  );
}
