'use client';

import React, { useState, useEffect } from 'react';
import { X, MessageCircle, Copy, Check, Sparkles, Phone, AlertCircle, Clock, Calendar } from 'lucide-react';
import { Client, Cycle } from '@/types/database';
import { PAYMENT_TEMPLATES, buildWhatsAppUrl, formatCurrency } from '@/lib/whatsappTemplates';
import {
  evaluateCycleReminder,
  getPrudentHoursStatus,
} from '@/lib/paymentReminderEngine';
import { recordReminderSent } from '@/lib/services/dataService';

interface PaymentReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client;
  cycle: Cycle;
  onUpdatePhone?: (newPhone: string) => Promise<void>;
  onReminderSent?: (updatedCycle: Cycle) => void;
}

export default function PaymentReminderModal({
  isOpen,
  onClose,
  client,
  cycle,
  onUpdatePhone,
  onReminderSent,
}: PaymentReminderModalProps) {
  const reminderEvaluation = evaluateCycleReminder(cycle);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    reminderEvaluation.suggestedTemplateId || PAYMENT_TEMPLATES[1].id
  );
  const [customText, setCustomText] = useState('');
  const [copied, setCopied] = useState(false);
  const [phoneInput, setPhoneInput] = useState(client.phone || '');
  const [savingPhone, setSavingPhone] = useState(false);
  const [sending, setSending] = useState(false);

  const prudentStatus = getPrudentHoursStatus();

  // Reset selected template when cycle changes or modal opens
  useEffect(() => {
    if (isOpen) {
      const evaluation = evaluateCycleReminder(cycle);
      setSelectedTemplateId(evaluation.suggestedTemplateId || PAYMENT_TEMPLATES[1].id);
    }
  }, [isOpen, cycle]);

  // Update text when template changes
  useEffect(() => {
    const tpl = PAYMENT_TEMPLATES.find((t) => t.id === selectedTemplateId);
    if (tpl) {
      setCustomText(tpl.getText(client, cycle));
    }
  }, [selectedTemplateId, client, cycle]);

  useEffect(() => {
    setPhoneInput(client.phone || '');
  }, [client.phone]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(customText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error copying to clipboard:', err);
    }
  };

  const handleSendWhatsApp = async () => {
    const activePhone = phoneInput.trim() || client.phone;
    if (!activePhone) {
      alert('Por favor ingresa un número de teléfono para enviar el WhatsApp.');
      return;
    }

    try {
      setSending(true);

      // Save phone if modified
      if (onUpdatePhone && phoneInput.trim() && phoneInput.trim() !== client.phone) {
        await onUpdatePhone(phoneInput.trim());
      }

      // Record timestamp in DB & localStorage
      const updatedCycle = await recordReminderSent(cycle.id);
      if (onReminderSent) {
        onReminderSent(updatedCycle);
      }

      const url = buildWhatsAppUrl(activePhone, customText);
      if (url) {
        window.open(url, '_blank');
        onClose();
      }
    } catch (err) {
      console.error('Error sending reminder:', err);
      // Even if update failed, allow sending
      const url = buildWhatsAppUrl(activePhone, customText);
      if (url) {
        window.open(url, '_blank');
        onClose();
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md md:max-w-xl bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 md:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white leading-tight">
                Recordatorio de Cobro WhatsApp
              </h3>
              <p className="text-[11px] text-slate-400">
                {client.student_name} {client.guardian_name ? `• ${client.guardian_name}` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Prudent Hours Banner */}
        <div
          className={`p-3 rounded-2xl border text-xs flex items-start gap-2.5 ${
            prudentStatus.isPrudent
              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
              : 'bg-amber-950/40 border-amber-500/30 text-amber-300'
          }`}
        >
          <Clock className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <div className="font-semibold text-[11px] uppercase tracking-wider flex items-center gap-1.5">
              <span>{prudentStatus.badgeText}</span>
              <span className="text-[10px] opacity-75">({prudentStatus.currentHourStr})</span>
            </div>
            <p className="text-[11px] leading-relaxed opacity-90">
              {prudentStatus.message}
            </p>
          </div>
        </div>

        {/* Amount & Cycle info badge */}
        <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between text-xs">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
              <Calendar className="w-3 h-3 text-indigo-400" />
              <span>{reminderEvaluation.weekInfo.label}</span>
            </div>
            <div className="font-bold text-white text-sm">
              {cycle.price ? formatCurrency(cycle.price) : 'Valor a convenir'}
            </div>
          </div>
          <div className="text-right">
            <span
              className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold border ${
                reminderEvaluation.badgeColor === 'rose'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                  : reminderEvaluation.badgeColor === 'amber'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : reminderEvaluation.badgeColor === 'indigo'
                  ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              {reminderEvaluation.badgeLabel}
            </span>
          </div>
        </div>

        {/* Phone input check if client has no phone */}
        {!client.phone && (
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Cliente sin número de WhatsApp registrado</span>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Phone className="w-3.5 h-3.5" />
              </div>
              <input
                type="tel"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder="Ej. +57 300 123 4567"
                className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        )}

        {/* Template Selector */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-indigo-400" />
            <span>Selecciona una Plantilla</span>
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {PAYMENT_TEMPLATES.map((tpl) => {
              const isSelected = selectedTemplateId === tpl.id;
              const isSuggested = reminderEvaluation.suggestedTemplateId === tpl.id;
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => setSelectedTemplateId(tpl.id)}
                  className={`p-2 rounded-xl text-[11px] font-medium text-center border transition-all relative ${
                    isSelected
                      ? 'bg-emerald-600/20 border-emerald-500/60 text-emerald-300 shadow-sm'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="truncate font-semibold">{tpl.title}</div>
                  {isSuggested && (
                    <span className="block text-[9px] text-amber-400 font-bold mt-0.5">
                      Sugerida
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Message Textarea */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-medium">Mensaje listo para enviar (editable):</span>
            <button
              type="button"
              onClick={handleCopy}
              className="text-slate-400 hover:text-white inline-flex items-center gap-1"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copiar</span>
                </>
              )}
            </button>
          </div>
          <textarea
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            rows={7}
            className="w-full p-3 bg-slate-950/80 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 leading-relaxed font-sans resize-none"
          />
        </div>

        {/* Footer Actions */}
        <div className="pt-2 flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSendWhatsApp}
            disabled={savingPhone || sending}
            className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{sending ? 'Abriendo...' : 'Enviar a WhatsApp'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
