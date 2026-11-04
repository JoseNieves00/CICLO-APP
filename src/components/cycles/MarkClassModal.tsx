'use client';

import React, { useState } from 'react';
import { X, CheckCircle2, XCircle, RotateCcw, Calendar, FileText } from 'lucide-react';
import { ClassSession, ClassStatus } from '@/types/database';
import { formatFriendlyDate } from '@/lib/cycleGenerator';

interface MarkClassModalProps {
  isOpen: boolean;
  classSession: ClassSession | null;
  onClose: () => void;
  onSave: (
    classId: string,
    status: ClassStatus,
    actualDate?: string | null,
    reason?: string | null,
    isMakeup?: boolean,
    notes?: string | null
  ) => Promise<void>;
}

export default function MarkClassModal({
  isOpen,
  classSession,
  onClose,
  onSave,
}: MarkClassModalProps) {
  if (!isOpen || !classSession) return null;

  const todayStr = (() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  })();

  const [mode, setMode] = useState<'completed' | 'cancelled' | 'reset'>(
    classSession.status === 'cancelled'
      ? 'cancelled'
      : classSession.status === 'completed'
      ? 'completed'
      : 'completed'
  );

  const [actualDate, setActualDate] = useState(classSession.actual_date || todayStr);
  const [cancellationReason, setCancellationReason] = useState(
    classSession.cancellation_reason || 'Avisó con anticipación'
  );
  const [customReason, setCustomReason] = useState('');
  const [notes, setNotes] = useState(classSession.notes || '');
  const [loading, setLoading] = useState(false);

  const quickReasons = [
    'Avisó con anticipación',
    'Enfermedad / Salud',
    'Calamidad doméstica',
    'Lluvia / Transporte',
    'Cancelada sin previo aviso',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'completed') {
        await onSave(
          classSession.id,
          'completed',
          actualDate,
          null,
          classSession.is_makeup,
          notes || null
        );
      } else if (mode === 'cancelled') {
        const finalReason = customReason.trim() ? customReason : cancellationReason;
        await onSave(
          classSession.id,
          'cancelled',
          null,
          finalReason,
          false,
          notes || null
        );
      } else {
        // Reset to scheduled
        await onSave(
          classSession.id,
          'scheduled',
          null,
          null,
          false,
          null
        );
      }
      onClose();
    } catch (err) {
      console.error('Error saving class state:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md md:max-w-lg bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white">
              Clase #{classSession.class_number}
            </h3>
            <p className="text-xs text-slate-400">
              Programada originalmente: {formatFriendlyDate(classSession.scheduled_date)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Toggle */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-950 rounded-2xl border border-slate-800/80">
          <button
            type="button"
            onClick={() => setMode('completed')}
            className={`py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              mode === 'completed'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Dada</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('cancelled')}
            className={`py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              mode === 'cancelled'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Cancelar</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('reset')}
            className={`py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              mode === 'reset'
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Pendiente</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'completed' && (
            <div className="space-y-3 p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Fecha en que se dio la clase
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <input
                    type="date"
                    value={actualDate}
                    onChange={(e) => setActualDate(e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Por defecto la fecha de hoy, pero puedes ajustarla si la diste otro día.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Nota breve (opcional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej. Tema visto, tarea pendiente..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          {mode === 'cancelled' && (
            <div className="space-y-3 p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
              <label className="block text-xs font-medium text-slate-300">
                Motivo de la cancelación
              </label>

              <div className="space-y-1.5">
                {quickReasons.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setCancellationReason(r);
                      setCustomReason('');
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors border ${
                      cancellationReason === r && !customReason
                        ? 'bg-rose-500/15 border-rose-500/40 text-rose-300 font-medium'
                        : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:text-white'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>

              <div>
                <input
                  type="text"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Otro motivo..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-[11px] leading-relaxed">
                Esta clase quedará disponible para reprogramarse en la <strong>Semana 5 de Reposición</strong>.
              </div>
            </div>
          )}

          {mode === 'reset' && (
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 text-center">
              La clase volverá al estado <strong>Programada (Tentativa)</strong>, eliminando fecha real y motivos de cancelación.
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
            >
              Cerrar
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 py-2.5 px-4 rounded-xl font-medium text-xs text-white transition-all shadow-lg flex items-center justify-center gap-1.5 ${
                mode === 'completed'
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                  : mode === 'cancelled'
                  ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                  : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30'
              }`}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span>Confirmar Cambio</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

