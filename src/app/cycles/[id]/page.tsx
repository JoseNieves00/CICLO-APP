'use client';

import React, { useState, useEffect, useMemo, use } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/navigation/Header';
import BottomNav from '@/components/navigation/BottomNav';
import MarkClassModal from '@/components/cycles/MarkClassModal';
import PaymentReminderModal from '@/components/cycles/PaymentReminderModal';
import ShareCycleModal from '@/components/cycles/ShareCycleModal';
import {
  getCycleWithDetails,
  updateClassStatus,
  toggleCyclePayment,
  updateCycleStatus,
  updateClient,
  renewCycle,
} from '@/lib/services/dataService';
import { Cycle, Client, ClassSession, ClassStatus, CycleStatus } from '@/types/database';
import {
  formatFriendlyDate,
  calculateDaysDiff,
  formatDaysDiff,
  getCycleLimits,
  DAY_NAMES,
  formatTime12h,
} from '@/lib/cycleGenerator';
import {
  evaluateCycleReminder,
  getPrudentHoursStatus,
} from '@/lib/paymentReminderEngine';
import {
  CalendarCheck2,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MessageCircle,
  ChevronLeft,
  Share2,
  DollarSign,
  Info,
  CalendarClock,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

export default function CycleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const cycleId = resolvedParams.id;
  const router = useRouter();

  const [cycle, setCycle] = useState<Cycle | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<ClassSession | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareTab, setShareTab] = useState<'schedule' | 'compliance'>('schedule');
  const [togglingPayment, setTogglingPayment] = useState(false);
  const [renewing, setRenewing] = useState(false);

  const handleUpdatePhone = async (newPhone: string) => {
    if (!client) return;
    const updated = await updateClient(client.id, { phone: newPhone });
    setClient(updated);
  };

  const handleRenewCycle = async () => {
    if (!cycle || !client) return;
    if (
      !confirm(
        `¿Deseas cerrar este ciclo y generar la renovación para el próximo mes con ${client.student_name}? Se copiará el plan, horario y precio.`
      )
    )
      return;

    try {
      setRenewing(true);
      const newCycle = await renewCycle(cycle.id);
      router.push(`/cycles/${newCycle.id}`);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al renovar ciclo');
    } finally {
      setRenewing(false);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getCycleWithDetails(cycleId);
      if (data) {
        setCycle(data.cycle);
        setClient(data.client);
        setClasses(data.classes);
      }
    } catch (err) {
      console.error('Error loading cycle:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [cycleId]);

  // Calculations
  const stats = useMemo(() => {
    if (!cycle) return { completed: 0, cancelled: 0, pending: 0, remaining: 0, percent: 0 };
    const completed = classes.filter((c) => c.status === 'completed').length;
    const cancelled = classes.filter((c) => c.status === 'cancelled').length;
    const pending = classes.filter((c) => c.status === 'scheduled').length;
    const remaining = Math.max(0, cycle.plan_classes - completed);
    const percent = Math.min(100, Math.round((completed / cycle.plan_classes) * 100));

    return { completed, cancelled, pending, remaining, percent };
  }, [cycle, classes]);

  const reminderEvaluation = useMemo(() => {
    if (!cycle) return null;
    return evaluateCycleReminder(cycle);
  }, [cycle]);

  // Limits
  const limits = useMemo(() => {
    if (!cycle) return { endWeek4: '', startWeek5Reposicion: '', endWeek5Reposicion: '' };
    return getCycleLimits(cycle.start_date);
  }, [cycle]);

  // Automatically check if cycle should be 'completed'
  useEffect(() => {
    if (cycle && stats.completed >= cycle.plan_classes && cycle.status !== 'completed') {
      updateCycleStatus(cycle.id, 'completed').then((updated) => setCycle(updated));
    }
  }, [cycle, stats.completed]);

  const handleSaveClass = async (
    classId: string,
    status: ClassStatus,
    actualDate?: string | null,
    reason?: string | null,
    isMakeup?: boolean,
    notes?: string | null
  ) => {
    const updated = await updateClassStatus(classId, {
      status,
      actual_date: actualDate,
      cancellation_reason: reason,
      is_makeup: isMakeup,
      notes,
    });

    setClasses((prev) => prev.map((c) => (c.id === classId ? updated : c)));
  };

  const handleTogglePayment = async () => {
    if (!cycle || togglingPayment) return;
    try {
      setTogglingPayment(true);
      const updated = await toggleCyclePayment(cycle.id, !cycle.is_paid);
      setCycle(updated);
    } catch (err) {
      console.error('Error toggling payment:', err);
    } finally {
      setTogglingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-3" />
        <p className="text-xs text-slate-400">Cargando ciclo...</p>
      </div>
    );
  }

  if (!cycle || !client) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
        <AlertCircle className="w-10 h-10 text-rose-400 mb-2" />
        <h2 className="text-base font-bold text-white">Ciclo no encontrado</h2>
        <p className="text-xs text-slate-400 mt-1 mb-4">El ciclo solicitado no existe o fue eliminado.</p>
        <Link
          href="/clients"
          className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
        >
          Volver a Clientes
        </Link>
      </div>
    );
  }

  const cleanPhone = client.phone ? client.phone.replace(/[^0-9]/g, '') : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-lg border-b border-slate-800/80 px-4 py-3">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <Link
            href="/clients"
            className="flex items-center gap-1 text-slate-400 hover:text-white text-xs"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Clientes</span>
          </Link>
          <div className="text-xs font-bold text-white truncate max-w-[200px]">
            {client.student_name}
          </div>
          <div className="w-8" />
        </div>
      </header>

      <main className="flex-1 max-w-md mx-auto w-full px-4 py-4 space-y-4 pb-28">
        {/* Client & Cycle Header Card */}
        <div className="bg-gradient-to-br from-indigo-950/60 to-slate-900 border border-indigo-500/30 rounded-3xl p-5 shadow-xl space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[10px] font-semibold tracking-wider uppercase text-indigo-400">
                Ciclo de Clases
              </span>
              <h2 className="text-lg font-extrabold text-white leading-tight">
                {client.student_name}
              </h2>
              {client.guardian_name && (
                <p className="text-xs text-slate-300 mt-0.5">{client.guardian_name}</p>
              )}
            </div>

            {cleanPhone && (
              <a
                href={`https://wa.me/${cleanPhone}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 transition-colors"
                title="Escribir por WhatsApp"
              >
                <MessageCircle className="w-5 h-5" />
              </a>
            )}
          </div>

          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-xl bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 font-medium">
              Plan {cycle.plan_classes} clases ({cycle.frequency}x sem)
              {cycle.schedule_time ? ` • ${formatTime12h(cycle.schedule_time)}` : ''}
            </span>

            {/* Status Badge */}
            <span
              className={`px-2.5 py-1 rounded-xl border text-[11px] font-semibold ${
                cycle.status === 'completed'
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                  : cycle.status === 'in_reposicion'
                  ? 'bg-amber-500/15 border-amber-500/30 text-amber-300 animate-pulse'
                  : 'bg-blue-500/15 border-blue-500/30 text-blue-300'
              }`}
            >
              {cycle.status === 'completed'
                ? 'Cumplido'
                : cycle.status === 'in_reposicion'
                ? 'En Reposición'
                : 'Ciclo Activo'}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">
                Progreso: {stats.completed} de {cycle.plan_classes} dadas
              </span>
              <span className="text-indigo-300 font-bold">{stats.percent}%</span>
            </div>
            <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${stats.percent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
              <span>{stats.remaining} pendiente{stats.remaining !== 1 ? 's' : ''}</span>
              {stats.cancelled > 0 && (
                <span className="text-amber-400 font-medium">
                  {stats.cancelled} para reposición
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Payment Control Switch */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors ${
                  cycle.is_paid
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}
              >
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Pago del Mes</h4>
                <p className="text-[11px] text-slate-400">
                  {cycle.is_paid ? 'Marcado como PAGADO' : 'Pendiente de cobro'}
                </p>
              </div>
            </div>

            <button
              onClick={handleTogglePayment}
              disabled={togglingPayment}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shadow-md ${
                cycle.is_paid
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
            >
              {cycle.is_paid ? 'Pagado ✓' : 'Marcar Pago'}
            </button>
          </div>

          {!cycle.is_paid && reminderEvaluation && (
            <div className="pt-2.5 border-t border-slate-800/80 space-y-2">
              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between gap-2 text-xs">
                <div className="space-y-0.5 min-w-0">
                  <div className="text-[11px] font-semibold text-slate-300 truncate">
                    {reminderEvaluation.title}
                  </div>
                  <div className="text-[10px] text-slate-400 leading-tight">
                    {reminderEvaluation.description}
                  </div>
                </div>
                <span
                  className={`flex-shrink-0 text-[10px] px-2 py-0.5 rounded font-semibold border ${
                    reminderEvaluation.badgeColor === 'rose'
                      ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                      : reminderEvaluation.badgeColor === 'amber'
                      ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                      : reminderEvaluation.badgeColor === 'indigo'
                      ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  {reminderEvaluation.badgeLabel}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(true)}
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                <span>
                  {reminderEvaluation.weekInfo.isFinalWeek
                    ? 'Enviar Recordatorio de Cobro a WhatsApp'
                    : 'Anticipar Recordatorio de Cobro a WhatsApp'}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Classes List */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <CalendarCheck2 className="w-4 h-4 text-indigo-400" />
              <span>Clases del Ciclo</span>
            </h3>
            <span className="text-[11px] text-slate-400">Toca una clase para gestionarla</span>
          </div>

          <div className="space-y-2">
            {classes.map((cls) => {
              const isCompleted = cls.status === 'completed';
              const isCancelled = cls.status === 'cancelled';
              const daysDiff =
                cls.actual_date && cls.scheduled_date
                  ? calculateDaysDiff(cls.scheduled_date, cls.actual_date)
                  : null;

              return (
                <div
                  key={cls.id}
                  onClick={() => {
                    setSelectedClass(cls);
                    setIsModalOpen(true);
                  }}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer select-none space-y-2 ${
                    isCompleted
                      ? 'bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-500/50'
                      : isCancelled
                      ? 'bg-rose-950/20 border-rose-500/30 hover:border-rose-500/50'
                      : 'bg-slate-900/70 border-slate-800/80 hover:border-indigo-500/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs ${
                          isCompleted
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : isCancelled
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-indigo-600/20 text-indigo-300'
                        }`}
                      >
                        #{cls.class_number}
                      </span>
                      <div>
                        <div className="text-xs font-bold text-white">
                          Programada: {formatFriendlyDate(cls.scheduled_date)}
                        </div>
                        {cls.actual_date && (
                          <div className="text-[11px] text-emerald-400 font-medium">
                            Dada: {formatFriendlyDate(cls.actual_date)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-1.5">
                      {isCompleted && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-300 text-[10px] font-semibold border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Dada</span>
                        </span>
                      )}

                      {isCancelled && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-500/15 text-rose-300 text-[10px] font-semibold border border-rose-500/30">
                          <XCircle className="w-3 h-3" />
                          <span>Cancelada</span>
                        </span>
                      )}

                      {!isCompleted && !isCancelled && (
                        <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 text-[10px] font-medium border border-slate-700">
                          Programada
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Details row: Difference in days & Cancellation reason */}
                  {(daysDiff !== null || cls.cancellation_reason || cls.notes) && (
                    <div className="pt-2 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                      {daysDiff !== null && (
                        <span
                          className={`font-semibold ${
                            daysDiff === 0
                              ? 'text-slate-400'
                              : daysDiff > 0
                              ? 'text-amber-400'
                              : 'text-indigo-400'
                          }`}
                        >
                          Diferencia: {formatDaysDiff(daysDiff)}
                        </span>
                      )}

                      {cls.cancellation_reason && (
                        <span className="text-rose-400 font-medium truncate max-w-[200px]">
                          Motivo: {cls.cancellation_reason}
                        </span>
                      )}

                      {cls.notes && !cls.cancellation_reason && (
                        <span className="text-slate-400 truncate max-w-[200px]">
                          {cls.notes}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Semana 5 de Reposición Info Block */}
        <div className="p-4 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
            <CalendarClock className="w-4 h-4" />
            <span>Semana 5 (Reposición)</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Del <strong>{formatFriendlyDate(limits.startWeek5Reposicion)}</strong> al{' '}
            <strong>{formatFriendlyDate(limits.endWeek5Reposicion)}</strong>.
            {stats.cancelled > 0
              ? ` Tienes ${stats.cancelled} clase(s) cancelada(s) que puedes reprogramar en esta semana.`
              : ' No se requiere si todas las clases de las 4 semanas se completan a tiempo.'}
          </p>
        </div>

        {/* Share buttons */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span className="flex items-center gap-1.5">
              <Share2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Compartir con el Cliente (Imágenes WhatsApp)</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
              PNG
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => {
                setShareTab('schedule');
                setIsShareModalOpen(true);
              }}
              className="p-3 rounded-2xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-200 font-semibold text-center transition-all flex items-center justify-center gap-1.5 shadow-sm"
            >
              <span>Compartir Programación</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setShareTab('compliance');
                setIsShareModalOpen(true);
              }}
              className="p-3 rounded-2xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-200 font-semibold text-center transition-all flex items-center justify-center gap-1.5 shadow-sm"
            >
              <span>Compartir Cumplimiento</span>
            </button>
          </div>
        </div>

        {/* Renewal Section (Fase 3: Cierre y Renovación de ciclo con un toque) */}
        <div className="p-4 rounded-3xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-3">
          <div>
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Renovación de Ciclo</span>
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Archiva este ciclo y abre el del siguiente mes copiando plan, días y precio.
            </p>
          </div>
          <button
            type="button"
            onClick={handleRenewCycle}
            disabled={renewing}
            className="px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/25 transition-all flex-shrink-0 disabled:opacity-50"
          >
            {renewing ? 'Renovando...' : 'Renovar Mes ↻'}
          </button>
        </div>
      </main>

      {/* Modal for marking class status */}
      <MarkClassModal
        isOpen={isModalOpen}
        classSession={selectedClass}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveClass}
      />

      {/* Modal for sending WhatsApp payment reminder */}
      <PaymentReminderModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        client={client}
        cycle={cycle}
        onUpdatePhone={handleUpdatePhone}
        onReminderSent={(updated) => setCycle(updated)}
      />

      {/* Modal for generating and sharing images */}
      <ShareCycleModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        client={client}
        cycle={cycle}
        classes={classes}
        initialTab={shareTab}
      />

      <BottomNav />
    </div>
  );
}

