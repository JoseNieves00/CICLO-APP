'use client';

import React from 'react';
import { Cycle, Client, ClassSession } from '@/types/database';
import { formatFriendlyDate, calculateDaysDiff, formatDaysDiff, formatTime12h } from '@/lib/cycleGenerator';

interface ComplianceCardProps {
  client: Client;
  cycle: Cycle;
  classes: ClassSession[];
}

export default function ComplianceCard({ client, cycle, classes }: ComplianceCardProps) {
  const completedCount = classes.filter((c) => c.status === 'completed').length;
  const cancelledCount = classes.filter((c) => c.status === 'cancelled').length;
  const rescheduledCount = classes.filter((c) => c.status === 'rescheduled' || c.is_makeup).length;
  const pendingCount = classes.filter((c) => c.status === 'scheduled').length;
  const percent = Math.min(100, Math.round((completedCount / cycle.plan_classes) * 100));

  const isCompletedCycle = completedCount >= cycle.plan_classes;

  return (
    <div
      id="compliance-card-image"
      style={{
        width: '460px',
        backgroundColor: '#090d16',
        color: '#f8fafc',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
      className="p-6 rounded-3xl border border-emerald-500/30 shadow-2xl space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <span className="text-[10px] font-bold tracking-widest uppercase text-emerald-400">
            CONTROL DE CLASES
          </span>
          <h2 className="text-xl font-extrabold text-white tracking-tight">
            Reporte de Cumplimiento
          </h2>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-sm">
          🎓
        </div>
      </div>

      {/* Student / Client Info */}
      <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400 font-medium">Alumn@:</span>
          <span className="text-sm font-bold text-white">{client.student_name}</span>
        </div>
        {client.guardian_name && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Acudiente:</span>
            <span className="text-slate-200">{client.guardian_name}</span>
          </div>
        )}
        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
          <span className="text-slate-400 font-medium">Plan contratado:</span>
          <span className="font-semibold text-slate-200">
            {cycle.plan_classes} clases ({cycle.frequency}x semana)
          </span>
        </div>
        {cycle.schedule_time && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Horario habitual:</span>
            <span className="text-slate-200 font-semibold">{formatTime12h(cycle.schedule_time)}</span>
          </div>
        )}
      </div>

      {/* Progress Metric Box */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 to-slate-900 border border-emerald-500/25 space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-emerald-300">
            Progreso del Ciclo
          </div>
          <span className="text-sm font-extrabold text-emerald-400">{percent}%</span>
        </div>

        {/* Bar */}
        <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full"
            style={{ width: `${percent}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-300 pt-0.5 font-medium">
          <span>{completedCount} de {cycle.plan_classes} clases completadas</span>
          <span>
            {isCompletedCycle
              ? '¡Ciclo Cumplido! 🎉'
              : `${cycle.plan_classes - completedCount} pendiente(s)`}
          </span>
        </div>
      </div>

      {/* Class by Class Breakdown */}
      <div className="space-y-1.5">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
          Detalle de Clases Dadas vs. Programadas
        </div>

        <div className="space-y-1.5">
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
                className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-[10px] ${
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
                    <div className="font-semibold text-white">
                      {cls.actual_date
                        ? `Dada: ${formatFriendlyDate(cls.actual_date)}`
                        : `Programada: ${formatFriendlyDate(cls.scheduled_date)}`}
                    </div>
                    {daysDiff !== null && (
                      <div className="text-[10px] text-slate-400">
                        Prog: {formatFriendlyDate(cls.scheduled_date)} • {formatDaysDiff(daysDiff)}
                      </div>
                    )}
                    {cls.cancellation_reason && (
                      <div className="text-[10px] text-rose-400 truncate max-w-[200px]">
                        Cancelada: {cls.cancellation_reason}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  {isCompleted && (
                    <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                      Dada ✓
                    </span>
                  )}
                  {isCancelled && (
                    <span className="px-2 py-0.5 rounded-lg bg-rose-500/20 text-rose-300 text-[10px] font-bold border border-rose-500/30">
                      Cancelada
                    </span>
                  )}
                  {!isCompleted && !isCancelled && (
                    <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-400 text-[10px] font-medium border border-slate-700">
                      Pendiente
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Motivational / Final Footer */}
      <div className="pt-2 border-t border-slate-800/80 text-center">
        <p className="text-[11px] text-emerald-400 font-semibold">
          {isCompletedCycle
            ? '¡Felicitaciones por completar todas las clases de este ciclo!'
            : 'Seguimos avanzando en el aprendizaje con constancia y dedicación.'}
        </p>
      </div>
    </div>
  );
}

