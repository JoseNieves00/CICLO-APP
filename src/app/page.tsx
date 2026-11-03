'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/navigation/Header';
import BottomNav from '@/components/navigation/BottomNav';
import {
  CalendarCheck2,
  Users,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  Database,
  Calendar,
  AlertTriangle,
  FileCode2,
} from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const router = useRouter();
  const { user, isLoading, isConfigured } = useAuth();

  useEffect(() => {
    // Si Supabase está configurado pero el usuario no ha iniciado sesión, ir al login
    if (!isLoading && isConfigured && !user) {
      router.push('/login');
    }
  }, [isLoading, isConfigured, user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4" />
        <p className="text-xs text-slate-400">Cargando Ciclo App...</p>
      </div>
    );
  }

  // Si Supabase no está configurado aún con credenciales reales
  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <Header title="Ciclo App" subtitle="Fase 1: Base y Configuración" />

        <main className="flex-1 max-w-md mx-auto w-full px-4 py-6 space-y-5 pb-24">
          {/* Card de Estado de Fase 1 */}
          <div className="bg-gradient-to-br from-indigo-950/60 to-slate-900/90 border border-indigo-500/30 rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-3">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Fase 1: Base Inicial Lista</span>
            </div>

            <h2 className="text-xl font-bold text-white mb-2">
              Next.js + Supabase + RLS
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              El proyecto base, los esquemas de base de datos con reglas de seguridad por usuario (RLS) y la interfaz para celular están preparados.
            </p>

            <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span>Stack: Next.js + Tailwind v4 + Postgres</span>
              <span className="font-semibold text-indigo-300">100% Mobile First</span>
            </div>
          </div>

          {/* Guía de Conexión a Supabase */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-4">
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
              <Database className="w-4 h-4" />
              <span>Paso requerido para sincronizar con Supabase</span>
            </div>

            <p className="text-xs text-slate-300">
              Para probar el login y almacenar los clientes y ciclos en la nube, realiza estos 2 sencillos pasos:
            </p>

            <div className="space-y-3">
              <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-3.5 text-xs space-y-2">
                <div className="flex items-center gap-2 font-medium text-slate-200">
                  <span className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-400 flex items-center justify-center text-[11px] font-bold">1</span>
                  <span>Ejecutar el esquema SQL en Supabase</span>
                </div>
                <p className="text-slate-400 text-[11px] pl-7">
                  Copia el contenido de <code className="text-indigo-300 font-mono">supabase/schema.sql</code> y pégalo en el SQL Editor de tu proyecto en Supabase. Creará las tablas <code className="text-slate-300">clients</code>, <code className="text-slate-300">cycles</code>, <code className="text-slate-300">classes</code> y las reglas de seguridad RLS.
                </p>
              </div>

              <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-3.5 text-xs space-y-2">
                <div className="flex items-center gap-2 font-medium text-slate-200">
                  <span className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-400 flex items-center justify-center text-[11px] font-bold">2</span>
                  <span>Colocar las credenciales en <code className="font-mono text-indigo-300">.env.local</code></span>
                </div>
                <div className="bg-slate-900 p-2.5 rounded-xl font-mono text-[10px] text-slate-300 border border-slate-800/80 overflow-x-auto pl-3">
                  NEXT_PUBLIC_SUPABASE_URL=https://tu-id.supabase.co<br />
                  NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/login"
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all"
              >
                <span>Ver pantalla de Login / Acceso</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Resumen de Tablas y Seguridad */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 space-y-3">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Modelo de Datos y Seguridad Preparados</span>
            </h3>

            <div className="grid grid-cols-1 gap-2.5 text-xs">
              <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/60 flex items-start gap-3">
                <Users className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-slate-200">clients</p>
                  <p className="text-[11px] text-slate-400">
                    Acudiente, alumno, teléfono, notas y RLS por <code className="font-mono text-indigo-300">owner_id</code>.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/60 flex items-start gap-3">
                <Calendar className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-slate-200">cycles</p>
                  <p className="text-[11px] text-slate-400">
                    Plan (4 u 8), frecuencia, días, estado (activo, reposición, cumplido) y control de pago.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/60 flex items-start gap-3">
                <FileCode2 className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-slate-200">classes</p>
                  <p className="text-[11px] text-slate-400">
                    Número de clase, fecha programada, fecha dada, reposición, motivo de cancelación.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Dashboard cuando el usuario está autenticado
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header />

      <main className="flex-1 max-w-md mx-auto w-full px-4 py-5 space-y-5 pb-24">
        {/* Welcome Card */}
        <div className="bg-gradient-to-r from-indigo-900/60 via-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-3xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-indigo-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Panel de Control
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-medium">
              Conectado
            </span>
          </div>
          <h2 className="text-lg font-bold text-white">¡Hola!</h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Bienvenido a tu app de control de ciclos de clases.
          </p>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Usuario: {user?.email}</span>
            <span className="text-indigo-400">RLS Activo</span>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs">Clases Hoy</span>
              <CalendarCheck2 className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-white">0</div>
            <p className="text-[10px] text-slate-500 mt-1">Sin clases programadas hoy</p>
          </div>

          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs">Ciclos Activos</span>
              <Calendar className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white">0</div>
            <p className="text-[10px] text-slate-500 mt-1">Esperando datos de Fase 2</p>
          </div>

          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs">Reposiciones</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-white">0</div>
            <p className="text-[10px] text-slate-500 mt-1">Semana 5 sin pendientes</p>
          </div>

          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs">Pagos Pendientes</span>
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-bold text-white">0</div>
            <p className="text-[10px] text-slate-500 mt-1">Al día con clientes</p>
          </div>
        </div>

        {/* Phase 1 Completion Status */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Estado de Implementación
            </h3>
            <span className="text-[11px] font-medium text-emerald-400">Fase 1 Completada</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-950/40 text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Proyecto Next.js + Tailwind configurado para celular</span>
            </div>
            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-950/40 text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Esquema SQL con RLS (<code className="text-indigo-300 font-mono text-[11px]">clients, cycles, classes</code>)</span>
            </div>
            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-950/40 text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Autenticación por usuario y aislamiento por <code className="text-indigo-300 font-mono text-[11px]">owner_id</code></span>
            </div>
          </div>
        </div>

        {/* Next step prompt */}
        <div className="bg-indigo-950/30 border border-indigo-500/20 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-indigo-300">Siguiente: Fase 2</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Gestión de clientes, generador automático de fechas y marcar clases dadas o canceladas.
            </p>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
