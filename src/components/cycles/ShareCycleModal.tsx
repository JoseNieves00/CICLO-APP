'use client';

import React, { useState, useRef } from 'react';
import { X, Share2, Download, MessageCircle, Copy, Check, Sparkles } from 'lucide-react';
import { Cycle, Client, ClassSession } from '@/types/database';
import ScheduleCard from '@/components/cards/ScheduleCard';
import ComplianceCard from '@/components/cards/ComplianceCard';
import { shareOrDownloadImage } from '@/lib/shareService';

interface ShareCycleModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client;
  cycle: Cycle;
  classes: ClassSession[];
  initialTab?: 'schedule' | 'compliance';
}

export default function ShareCycleModal({
  isOpen,
  onClose,
  client,
  cycle,
  classes,
  initialTab = 'schedule',
}: ShareCycleModalProps) {
  const [activeTab, setActiveTab] = useState<'schedule' | 'compliance'>(initialTab);
  const [sharing, setSharing] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const recipient = client.guardian_name || client.student_name;
  const studentMention = client.guardian_name ? ` de ${client.student_name}` : '';

  const suggestedText =
    activeTab === 'schedule'
      ? `¡Hola ${recipient}! 👋 Te comparto la programación de las clases${studentMention} para este ciclo. 📅🎶`
      : `¡Hola ${recipient}! 👋 Te comparto el reporte de cumplimiento y avance de las clases${studentMention} correspondientes a este ciclo. 🎓✨`;

  const handleShare = async () => {
    if (!cardRef.current) return;
    setSharing(true);
    setFeedbackMsg(null);

    const filename =
      activeTab === 'schedule'
        ? `Programacion-${client.student_name.replace(/\s+/g, '_')}.png`
        : `Cumplimiento-${client.student_name.replace(/\s+/g, '_')}.png`;

    const title =
      activeTab === 'schedule'
        ? `Programación de Clases - ${client.student_name}`
        : `Reporte de Cumplimiento - ${client.student_name}`;

    try {
      const result = await shareOrDownloadImage(cardRef.current, {
        filename,
        title,
        text: suggestedText,
      });

      if (result.shared) {
        setFeedbackMsg('¡Compartido con éxito!');
        setTimeout(() => onClose(), 1500);
      } else if (result.downloaded) {
        setFeedbackMsg('Imagen PNG descargada en tu dispositivo.');
      } else if (result.error) {
        setFeedbackMsg(`Aviso: ${result.error}`);
      }
    } catch (err: unknown) {
      setFeedbackMsg(err instanceof Error ? err.message : 'Error al procesar la imagen');
    } finally {
      setSharing(false);
    }
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(suggestedText);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    } catch (err) {
      console.error('Error copying text:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg md:max-w-xl bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 md:p-6 shadow-2xl space-y-4 max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Share2 className="w-4 h-4 text-indigo-400" />
              <span>Compartir Imagen con el Cliente</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Genera una tarjeta PNG optimizada para WhatsApp
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs: Programación vs Cumplimiento */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-950 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setActiveTab('schedule');
              setFeedbackMsg(null);
            }}
            className={`py-2 text-xs font-semibold rounded-xl transition-all ${
              activeTab === 'schedule'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            1. Programación del Ciclo
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('compliance');
              setFeedbackMsg(null);
            }}
            className={`py-2 text-xs font-semibold rounded-xl transition-all ${
              activeTab === 'compliance'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            2. Reporte de Cumplimiento
          </button>
        </div>

        {/* Live Visual Card Preview Container */}
        <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl overflow-x-auto flex justify-center">
          <div ref={cardRef} className="origin-top scale-[0.82] sm:scale-100 my-[-20px] sm:my-0">
            {activeTab === 'schedule' ? (
              <ScheduleCard client={client} cycle={cycle} classes={classes} />
            ) : (
              <ComplianceCard client={client} cycle={cycle} classes={classes} />
            )}
          </div>
        </div>

        {/* Suggested WhatsApp text */}
        <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-1.5 text-xs">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="font-medium">Texto para acompañar la imagen:</span>
            <button
              type="button"
              onClick={handleCopyText}
              className="text-slate-400 hover:text-white inline-flex items-center gap-1 font-semibold"
            >
              {copiedText ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copiar texto</span>
                </>
              )}
            </button>
          </div>
          <p className="text-slate-200 text-xs italic leading-relaxed">
            &ldquo;{suggestedText}&rdquo;
          </p>
        </div>

        {/* Feedback alert if any */}
        {feedbackMsg && (
          <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs text-center font-medium">
            {feedbackMsg}
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-1 flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
          >
            Cerrar
          </button>

          <button
            type="button"
            onClick={handleShare}
            disabled={sharing}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {sharing ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <MessageCircle className="w-4 h-4" />
                <span>Compartir en WhatsApp (Imagen PNG)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

