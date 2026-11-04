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
  MODERATE_FREQUENCY_DAYS,
} from '@/lib/paymentReminderEngine';
import { downloadDataBackupCsv } from '@/lib/exportService';
import {
  LogOut,
  CheckCircle2,
  User,
  Bell,
  Clock,
  Sparkles,
  Download,
  Smartphone,
  Share2,
  Check,
} from 'lucide-react';

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [prudentInfo, setPrudentInfo] = useState(getPrudentHoursStatus());
  const [testSent, setTestSent] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

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
        body: '¡Todo listo! Las alertas de cobro funcionarán en tu celular durante el horario moderado.',
        icon: '/icon.svg',
      });
      setTestSent(true);
      setTimeout(() => setTestSent(false), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleExportBackup = async () => {
    try {
      setExporting(true);
      await downloadDataBackupCsv();
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (err) {
      console.error('Error al exportar datos:', err);
      alert('Hubo un inconveniente al generar el archivo. Por favor intenta de nuevo.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header title="Ajustes" subtitle="Preferencias y respaldo" />

      <main className="flex-1 max-w-md md:max-w-4xl mx-auto w-full px-4 py-5 md:py-6 space-y-4 md:space-y-6 pb-24 md:pb-28">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 items-start">
          {/* Left Column: User & Notifications */}
          <div className="space-y-4">
            {/* User Profile Card */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 flex-shrink-0">
              <User className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-bold text-white truncate">
                {user ? user.email : 'Usuario'}
              </h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <p className="text-[11px] text-slate-400">Sesión iniciada</p>
              </div>
            </div>
          </div>

          {user && (
            <button
              onClick={() => signOut()}
              className="w-full py-2.5 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar Sesión</span>
            </button>
          )}
        </div>

        {/* Notificaciones de Cobro */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <Bell className="w-4 h-4 text-emerald-400" />
              <span>Alertas de Cobro</span>
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

          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-white text-[11px]">Inicio en Semana 4</span>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                  Solo se activa en la última semana regular o en la semana de reposición.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-white text-[11px]">Horario Moderado (9:00 AM – 7:00 PM)</span>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                  Evita mensajes fuera de horario. Estado actual: {prudentInfo.badgeText}.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-white text-[11px]">Frecuencia Moderada ({MODERATE_FREQUENCY_DAYS} días)</span>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                  Sugiere esperar 3 días entre recordatorios para no saturar al acudiente.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-1">
            {permission !== 'granted' ? (
              <button
                type="button"
                onClick={handleRequestPermission}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-600/20"
              >
                <Bell className="w-4 h-4" />
                <span>Activar Alertas en este Celular</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSendTestNotification}
                className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <span>{testSent ? '¡Notificación enviada con éxito!' : 'Probar Notificación de Alerta'}</span>
              </button>
            )}
          </div>
        </div>
        </div>

        {/* Right Column: Respaldo, PWA & Versión */}
        <div className="space-y-4">
        {/* Respaldo de Datos (Exportar a Excel / CSV) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <Download className="w-4 h-4 text-indigo-400" />
              <span>Respaldo de Datos</span>
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300">
              CSV / Excel
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Descarga una copia completa con todos tus alumnos, ciclos contratados, pagos y estado de clases en un archivo compatible con Excel o Google Sheets.
          </p>

          <button
            type="button"
            onClick={handleExportBackup}
            disabled={exporting}
            className="w-full py-2.5 px-4 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {exportSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-300">¡Respaldo descargado!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>{exporting ? 'Generando archivo...' : 'Descargar Respaldo (.CSV)'}</span>
              </>
            )}
          </button>
        </div>

        {/* Instalación en Celular (PWA) */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-white">
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span>Instalar como App en tu Celular</span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Puedes abrir la aplicación directamente desde la pantalla de inicio de tu teléfono sin abrir el navegador:
          </p>

          <div className="space-y-2 text-[11px] text-slate-300">
            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60">
              <strong className="text-white block mb-0.5">En iPhone (Safari):</strong>
              Toca el botón <span className="text-indigo-300 font-semibold">Compartir</span> (icono con flecha hacia arriba) y elige <span className="text-indigo-300 font-semibold">&ldquo;Agregar a Inicio&rdquo;</span>.
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60">
              <strong className="text-white block mb-0.5">En Android (Chrome):</strong>
              Toca los <span className="text-indigo-300 font-semibold">tres puntos ⋮</span> en la esquina superior y selecciona <span className="text-indigo-300 font-semibold">&ldquo;Instalar aplicación&rdquo;</span>.
            </div>
          </div>
        </div>

        {/* Versión de la Aplicación */}
        <div className="text-center pt-2 pb-4 space-y-1">
          <p className="text-[11px] font-semibold text-slate-500">
            Ciclo App • Versión 1.0.0
          </p>
          <p className="text-[10px] text-slate-600">
            Sistema listo para producción
          </p>
        </div>
        </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
