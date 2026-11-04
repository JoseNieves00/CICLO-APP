'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/navigation/Header';
import BottomNav from '@/components/navigation/BottomNav';
import { useAuth } from '@/context/AuthContext';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
} from '@/lib/notificationService';
import {
  getPrudentHoursStatus,
  PRUDENT_HOURS_START,
  PRUDENT_HOURS_END,
  MODERATE_FREQUENCY_DAYS,
} from '@/lib/paymentReminderEngine';
import {
  Settings,
  ShieldCheck,
  Database,
  LogOut,
  CheckCircle2,
  User,
  KeyRound,
  Bell,
  Clock,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
  const { user, isConfigured, signOut } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [prudentInfo, setPrudentInfo] = useState(getPrudentHoursStatus());
  const [testSent, setTestSent] = useState(false);

  useEffect(() => {
    if (isNotificationSupported()) {
      setPermission(getNotificationPermission());
    } else {
      setPermission('unsupported');
    }
  }, []);

  const handleRequestPermission = async () => {
    const res = await requestNotificationPermission();
    setPermission(res);
  };

  const handleSendTestNotification = () => {
    if (permission !== 'granted') return;
    try {
      new Notification('🔔 Prueba de Notificación • Ciclo App', {
        body: '¡Todo listo! Las alertas de cobro funcionarán en tu celular y navegador durante el horario moderado.',
        icon: '/icon-192.png',
      });
      setTestSent(true);
      setTimeout(() => setTestSent(false), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header title="Ajustes" subtitle="Configuración y recordatorios" />

      <main className="flex-1 max-w-md mx-auto w-full px-4 py-5 space-y-4 pb-24">
        {/* User Profile Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <User className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-bold text-white truncate">
                {user ? user.email : 'Usuario no autenticado'}
              </h2>
              <p className="text-[11px] text-slate-400">
                {user ? `ID: ${user.id.substring(0, 8)}...` : 'Sin sesión activa'}
              </p>
            </div>
          </div>

          {user && (
            <button
              onClick={() => signOut()}
              className="w-full py-2.5 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 text-xs font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar Sesión</span>
            </button>
          )}
        </div>

        {/* Politica de Recordatorios de Cobro Inteligentes */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
              <Bell className="w-4 h-4 text-emerald-400" />
              <span>Alertas de Cobro Inteligentes</span>
            </div>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                permission === 'granted'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : permission === 'denied'
                  ? 'bg-rose-500/20 text-rose-300'
                  : 'bg-amber-500/20 text-amber-300'
              }`}
            >
              {permission === 'granted'
                ? 'Activas'
                : permission === 'denied'
                ? 'Bloqueadas'
                : 'Sin activar'}
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            El sistema monitorea tus ciclos de clases y te notifica automáticamente para realizar el cobro al cliente bajo reglas moderadas:
          </p>

          <div className="space-y-2 text-xs">
            <div className="p-2.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-white text-[11px]">Inicio en la Última Semana</span>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Los recordatorios solo se activan a partir de la Semana 4 (o en semana de reposición y ciclos culminados).
                </p>
              </div>
            </div>

            <div className="p-2.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-white text-[11px]">Horario Moderado (9:00 AM – 7:00 PM)</span>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Evita enviar mensajes temprano en la mañana o tarde en la noche. Estado actual: {prudentInfo.badgeText}.
                </p>
              </div>
            </div>

            <div className="p-2.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-white text-[11px]">Frecuencia Moderada ({MODERATE_FREQUENCY_DAYS} días)</span>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Sugiere espaciar los recordatorios al menos 3 días para no saturar al cliente ni a su acudiente.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2">
            {permission !== 'granted' ? (
              <button
                type="button"
                onClick={handleRequestPermission}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-600/20"
              >
                <Bell className="w-4 h-4" />
                <span>Activar Alertas en este Dispositivo</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSendTestNotification}
                className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <span>{testSent ? '¡Notificación enviada!' : 'Enviar Notificación de Prueba'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Database & Cloud Connection Status */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
              <Database className="w-4 h-4 text-indigo-400" />
              <span>Conexión Supabase</span>
            </div>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                isConfigured
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-amber-500/20 text-amber-300'
              }`}
            >
              {isConfigured ? 'Configurado' : 'Pendiente'}
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            {isConfigured
              ? 'Las credenciales de Supabase están configuradas en .env.local.'
              : 'Configura las variables NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local.'}
          </p>

          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 text-[11px] text-slate-400 space-y-1 font-mono">
            <div>URL: {process.env.NEXT_PUBLIC_SUPABASE_URL || '(No establecida)'}</div>
            <div>RLS: Activo en clients, cycles, classes</div>
          </div>
        </div>

        {/* Security & Multi-user isolation */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Aislamiento de Datos (RLS)</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Cada registro está asociado al campo <code className="text-indigo-300 font-mono text-[11px]">owner_id</code>. Si en el futuro ingresan otros profesores, cada uno tendrá su cuenta y base independiente sin compartir datos.
          </p>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
