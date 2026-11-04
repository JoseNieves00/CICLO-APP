'use client';

import React from 'react';
import { Cycle, Client, ClassSession } from '@/types/database';
import { formatFriendlyDate, getCycleLimits, DAY_NAMES } from '@/lib/cycleGenerator';

interface ScheduleCardProps {
  client: Client;
  cycle: Cycle;
  classes: ClassSession[];
}

export default function ScheduleCard({ client, cycle, classes }: ScheduleCardProps) {
  const limits = getCycleLimits(cycle.start_date);

  // Agrupar clases por semana
  const week1Classes = classes.filter((c, i) => i < (cycle.plan_classes === 8 ? 2 : 1));
  const week2Classes = classes.filter((c, i) =>
    cycle.plan_classes === 8 ? i >= 2 && i < 4 : i === 1
  );
  const week3Classes = classes.filter((c, i) =>
    cycle.plan_classes === 8 ? i >= 4 && i < 6 : i === 2
  );
  const week4Classes = classes.filter((c, i) =>
    cycle.plan_classes === 8 ? i >= 6 && i < 8 : i === 3
  );

  const weeks = [
    { num: 1, name: 'Semana 1', items: week1Classes },
    { num: 2, name: 'Semana 2', items: week2Classes },
    { num: 3, name: 'Semana 3', items: week3Classes },
    { num: 4, name: 'Semana 4', items: week4Classes },
  ];

  return (
    <div
      id="schedule-card-image"
      style={{
        width: '460px',
        backgroundColor: '#090d16',
        color: '#f8fafc',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
      className="p-6 rounded-3xl border border-indigo-500/30 shadow-2xl space-y-4"
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <span className="text-[10px] font-bold tracking-widest uppercase text-indigo-400">
            CICLO APP • CONTROL DE CLASES
          </span>
          <h2 className="text-xl font-extrabold text-white tracking-tight">
            Programación de Clases
          </h2>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-sm">
          📅
        </div>
      </div>

      {/* Student / Client Info */}
      <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400 font-medium">Alumno:</span>
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
          <span className="font-semibold text-indigo-300">
            {cycle.plan_classes} clases ({cycle.frequency}x semana)
          </span>
        </div>
        {cycle.schedule_time && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Horario habitual:</span>
            <span className="text-slate-200">{cycle.schedule_time}</span>
          </div>
        )}
      </div>

      {/* 4 Regular Weeks */}
      <div className="space-y-2">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
          Fechas Tentativas (4 Semanas)
        </div>

        <div className="space-y-1.5">
          {weeks.map((w) => (
            <div
              key={w.num}
              className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-indigo-600/20 text-indigo-300 flex items-center justify-center font-bold text-[10px]">
                  S{w.num}
                </span>
                <span className="font-semibold text-slate-200">{w.name}</span>
              </div>

              <div className="flex items-center gap-2">
                {w.items.map((c) => (
                  <span
                    key={c.id}
                    className="px-2 py-0.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-slate-200 font-medium text-[11px]"
                  >
                    #{c.class_number} • {formatFriendlyDate(c.scheduled_date)}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Week 5 Reposición */}
      <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 space-y-1">
        <div className="flex items-center justify-between text-xs font-bold text-amber-300">
          <span>🛡️ Semana 5: Reposición</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
            Si se requiere
          </span>
        </div>
        <p className="text-[11px] text-amber-200/90 leading-relaxed pt-0.5">
          Del <strong>{formatFriendlyDate(limits.startWeek5Reposicion)}</strong> al{' '}
          <strong>{formatFriendlyDate(limits.endWeek5Reposicion)}</strong>. Reservada para reponer clases canceladas con previo aviso.
        </p>
      </div>

      {/* Footer Note */}
      <div className="pt-2 border-t border-slate-800/80 text-center">
        <p className="text-[10px] text-slate-400">
          En caso de requerir cancelación, favor avisar con anticipación para coordinar la reposición.
        </p>
      </div>
    </div>
  );
}
