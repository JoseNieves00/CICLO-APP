'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/navigation/Header';
import BottomNav from '@/components/navigation/BottomNav';
import { getClients, createCycleWithClasses } from '@/lib/services/dataService';
import { Client } from '@/types/database';
import {
  generateCycleSchedule,
  getCycleLimits,
  DAY_NAMES,
  DAY_SHORT_NAMES,
  formatFriendlyDate,
} from '@/lib/cycleGenerator';
import {
  CalendarPlus,
  Calendar,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  User,
  DollarSign,
  Info,
} from 'lucide-react';
import Link from 'next/link';

function NewCycleForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialClientId = searchParams.get('clientId') || '';

  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);

  // Form states
  const [selectedClientId, setSelectedClientId] = useState(initialClientId);
  const [planClasses, setPlanClasses] = useState<4 | 8>(4);
  const [frequency, setFrequency] = useState<1 | 2>(1);
  const [selectedDays, setSelectedDays] = useState<number[]>([1]); // Default Lunes
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });
  const [scheduleTime, setScheduleTime] = useState('16:00');
  const [price, setPrice] = useState('');
  const [notes, setNotes] = useState('');

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoadingClients(true);
        const data = await getClients();
        setClients(data);
        if (!selectedClientId && data.length > 0) {
          setSelectedClientId(data[0].id);
        }
      } catch (err) {
        console.error('Error fetching clients:', err);
      } finally {
        setLoadingClients(false);
      }
    };
    load();
  }, []);

  // Update frequency when plan changes
  const handlePlanChange = (plan: 4 | 8) => {
    setPlanClasses(plan);
    if (plan === 4) {
      setFrequency(1);
      // Keep only 1 day selected
      setSelectedDays((prev) => (prev.length > 0 ? [prev[0]] : [1]));
    } else {
      setFrequency(2);
      // Ensure 2 days selected
      setSelectedDays((prev) => {
        if (prev.length === 2) return prev;
        if (prev.length === 1) {
          // add another day, e.g. Wednesday or Thursday
          const nextDay = prev[0] <= 3 ? prev[0] + 2 : (prev[0] + 2) % 7 || 1;
          return [prev[0], nextDay].sort((a, b) => a - b);
        }
        return [2, 4]; // Martes y Jueves
      });
    }
  };

  const toggleDay = (day: number) => {
    if (planClasses === 4) {
      // 1 day only
      setSelectedDays([day]);
    } else {
      // 2 days
      if (selectedDays.includes(day)) {
        if (selectedDays.length > 1) {
          setSelectedDays(selectedDays.filter((d) => d !== day));
        }
      } else {
        if (selectedDays.length >= 2) {
          // Replace second day
          setSelectedDays([selectedDays[0], day].sort((a, b) => a - b));
        } else {
          setSelectedDays([...selectedDays, day].sort((a, b) => a - b));
        }
      }
    }
  };

  // Preview generated schedule
  const previewSchedule = useMemo(() => {
    return generateCycleSchedule(startDate, planClasses, frequency, selectedDays);
  }, [startDate, planClasses, frequency, selectedDays]);

  // Limits
  const cycleLimits = useMemo(() => {
    return getCycleLimits(startDate);
  }, [startDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedClientId) {
      setErrorMsg('Selecciona un cliente para el ciclo.');
      return;
    }

    if (planClasses === 8 && selectedDays.length !== 2) {
      setErrorMsg('Para el plan de 8 clases (2 por semana), selecciona 2 días.');
      return;
    }

    if (previewSchedule.length === 0) {
      setErrorMsg('No se pudieron calcular las fechas. Revisa los días y fecha de inicio.');
      return;
    }

    setSaving(true);

    try {
      const cycle = await createCycleWithClasses(
        {
          client_id: selectedClientId,
          plan_classes: planClasses,
          frequency,
          start_date: startDate,
          schedule_days: selectedDays,
          schedule_time: scheduleTime || undefined,
          price: price ? Number(price) : undefined,
          notes: notes || undefined,
        },
        previewSchedule.map((p) => ({
          class_number: p.classNumber,
          scheduled_date: p.scheduledDate,
        }))
      );

      router.push(`/cycles/${cycle.id}`);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al crear el ciclo');
      setSaving(false);
    }
  };

  const daysList = [1, 2, 3, 4, 5, 6, 7];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header title="Nuevo Ciclo" subtitle="Generador automático de clases" />

      <main className="flex-1 max-w-md mx-auto w-full px-4 py-4 space-y-4 pb-24">
        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Cliente */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 space-y-3">
            <label className="block text-xs font-semibold text-slate-200">
              1. Selecciona el Alumno / Cliente
            </label>

            {loadingClients ? (
              <div className="text-xs text-slate-400 py-2">Cargando alumnos...</div>
            ) : clients.length === 0 ? (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-xs text-amber-200 space-y-2">
                <p>No tienes clientes registrados todavía.</p>
                <Link
                  href="/clients"
                  className="inline-flex items-center gap-1 font-semibold text-indigo-400 underline"
                >
                  Registrar un cliente primero &rarr;
                </Link>
              </div>
            ) : (
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                required
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-2xl text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.student_name} {c.guardian_name ? `(${c.guardian_name})` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* 2. Plan y Frecuencia */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 space-y-3">
            <label className="block text-xs font-semibold text-slate-200">
              2. Plan Contratado
            </label>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handlePlanChange(4)}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  planClasses === 4
                    ? 'bg-indigo-600/15 border-indigo-500 text-white shadow-md shadow-indigo-600/20'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="text-base font-bold text-white">4 Clases</div>
                <div className="text-[11px] text-indigo-300 mt-0.5">1 clase / semana</div>
                <div className="text-[10px] text-slate-400 mt-1">4 semanas (1 mes)</div>
              </button>

              <button
                type="button"
                onClick={() => handlePlanChange(8)}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  planClasses === 8
                    ? 'bg-indigo-600/15 border-indigo-500 text-white shadow-md shadow-indigo-600/20'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="text-base font-bold text-white">8 Clases</div>
                <div className="text-[11px] text-indigo-300 mt-0.5">2 clases / semana</div>
                <div className="text-[10px] text-slate-400 mt-1">4 semanas (1 mes)</div>
              </button>
            </div>
          </div>

          {/* 3. Días de la semana */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-200">
                3. Días de la Semana
              </label>
              <span className="text-[11px] text-indigo-400">
                {planClasses === 4 ? 'Elige 1 día' : 'Elige 2 días'}
              </span>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {daysList.map((day) => {
                const isSelected = selectedDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`py-3 rounded-xl text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'bg-slate-950/60 text-slate-400 border border-slate-800/80 hover:text-white'
                    }`}
                  >
                    {DAY_SHORT_NAMES[day]}
                  </button>
                );
              })}
            </div>

            <div className="text-[11px] text-slate-400">
              Día{selectedDays.length > 1 ? 's' : ''} seleccionado{selectedDays.length > 1 ? 's' : ''}:{' '}
              <strong className="text-slate-200">
                {selectedDays.map((d) => DAY_NAMES[d]).join(' y ') || 'Ninguno'}
              </strong>
            </div>
          </div>

          {/* 4. Fechas y Horario */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 space-y-3">
            <label className="block text-xs font-semibold text-slate-200">
              4. Fecha de Inicio y Horario
            </label>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Fecha de Inicio</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Hora Tentativa</label>
                <input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 mb-1">Valor / Precio Pactado (opcional)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <DollarSign className="w-3.5 h-3.5" />
                </div>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Ej. 180000"
                  className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* 5. VISTA PREVIA AUTOMÁTICA DE FECHAS */}
          <div className="bg-gradient-to-b from-slate-900/90 to-slate-900/60 border border-indigo-500/30 rounded-3xl p-4 space-y-3 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>Programación Tentativa Generada</span>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-600/20 text-indigo-300 font-semibold">
                {previewSchedule.length} clases
              </span>
            </div>

            <p className="text-[11px] text-slate-400">
              Fechas tentativas para las 4 semanas del ciclo:
            </p>

            <div className="space-y-2">
              {previewSchedule.map((c) => (
                <div
                  key={c.classNumber}
                  className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-indigo-600/20 text-indigo-300 flex items-center justify-center font-bold text-[11px]">
                      #{c.classNumber}
                    </span>
                    <span className="font-semibold text-slate-200">
                      {formatFriendlyDate(c.scheduledDate)}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Semana {c.weekNumber} {scheduleTime ? `• ${scheduleTime}` : ''}
                  </span>
                </div>
              ))}
            </div>

            {/* Semana 5 Reposición */}
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-200 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-xs text-amber-300">
                <Info className="w-3.5 h-3.5" />
                <span>Semana 5: Reposición</span>
              </div>
              <p className="text-[11px] text-amber-200/90 leading-tight">
                Del {formatFriendlyDate(cycleLimits.startWeek5Reposicion)} al{' '}
                {formatFriendlyDate(cycleLimits.endWeek5Reposicion)}. Solo se usará si se cancela o pospone alguna clase.
              </p>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={saving || clients.length === 0}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <CalendarPlus className="w-4 h-4" />
                <span>Guardar y Abrir Ciclo</span>
              </>
            )}
          </button>
        </form>
      </main>

      <BottomNav />
    </div>
  );
}

export default function NewCyclePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-xs">
          Cargando generador...
        </div>
      }
    >
      <NewCycleForm />
    </Suspense>
  );
}
