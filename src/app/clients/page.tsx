'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/navigation/Header';
import BottomNav from '@/components/navigation/BottomNav';
import NewClientModal from '@/components/clients/NewClientModal';
import PaymentReminderModal from '@/components/cycles/PaymentReminderModal';
import { getClients, getCycles, updateClient } from '@/lib/services/dataService';
import { Client, Cycle } from '@/types/database';
import {
  Users,
  UserPlus,
  Search,
  Phone,
  CalendarPlus,
  CalendarCheck2,
  ChevronRight,
  MessageCircle,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reminderData, setReminderData] = useState<{
    client: Client;
    cycle: Cycle;
  } | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [fetchedClients, fetchedCycles] = await Promise.all([
        getClients(),
        getCycles(),
      ]);
      setClients(fetchedClients);
      setCycles(fetchedCycles);
    } catch (err) {
      console.error('Error loading clients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleClientCreated = (newClient: Client) => {
    setClients((prev) => [newClient, ...prev]);
  };

  const handleUpdatePhone = async (newPhone: string) => {
    if (!reminderData) return;
    const updated = await updateClient(reminderData.client.id, { phone: newPhone });
    setClients((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setReminderData((prev) => (prev ? { ...prev, client: updated } : null));
  };

  const filteredClients = clients.filter(
    (c) =>
      c.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.guardian_name && c.guardian_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.phone && c.phone.includes(searchTerm))
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header title="Clientes" subtitle="Alumnos y ciclos de clases" />

      <main className="flex-1 max-w-md mx-auto w-full px-4 py-4 space-y-4 pb-24">
        {/* Top Controls: Search + Add */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por alumno o acudiente..."
              className="w-full pl-9 pr-3 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-md shadow-indigo-600/20 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Nuevo</span>
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-3" />
            <p className="text-xs text-slate-400">Cargando clientes...</p>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 text-center space-y-3 my-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 mx-auto flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-white">
              {searchTerm ? 'No se encontraron resultados' : 'No tienes clientes registrados aún'}
            </h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              {searchTerm
                ? 'Intenta con otro término de búsqueda.'
                : 'Registra a tu primer alumno y acudiente para programar su ciclo de clases.'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Registrar Primer Cliente</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
              <span>{filteredClients.length} {filteredClients.length === 1 ? 'cliente' : 'clientes'}</span>
              <span>Ciclo Actual</span>
            </div>

            {filteredClients.map((client) => {
              // Buscar ciclo activo para este cliente
              const activeCycle = cycles.find(
                (c) => c.client_id === client.id && (c.status === 'active' || c.status === 'in_reposicion')
              );

              // Formatear WhatsApp URL si tiene teléfono
              const cleanPhone = client.phone ? client.phone.replace(/[^0-9]/g, '') : null;

              return (
                <div
                  key={client.id}
                  className="bg-slate-900/70 border border-slate-800/80 hover:border-slate-700/80 rounded-2xl p-4 transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-white truncate">
                        {client.student_name}
                      </h4>
                      {client.guardian_name && (
                        <p className="text-xs text-slate-400 truncate mt-0.5">
                          {client.guardian_name}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Cobro pendiente WhatsApp button if applicable */}
                      {activeCycle && !activeCycle.is_paid && (
                        <button
                          type="button"
                          onClick={() => setReminderData({ client, cycle: activeCycle })}
                          className="px-2 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25 transition-colors text-[10px] font-semibold flex items-center gap-1"
                          title="Enviar cobro por WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Cobrar</span>
                        </button>
                      )}

                      {/* Regular WhatsApp contact button */}
                      {cleanPhone && (
                        <a
                          href={`https://wa.me/${cleanPhone}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                          title="Escribir por WhatsApp"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Cycle Status or Add Cycle */}
                  <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs">
                    {activeCycle ? (
                      <Link
                        href={`/cycles/${activeCycle.id}`}
                        className="flex-1 flex items-center justify-between group p-1.5 -m-1.5 rounded-lg hover:bg-slate-800/40 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              activeCycle.status === 'in_reposicion'
                                ? 'bg-amber-400 animate-pulse'
                                : 'bg-emerald-400'
                            }`}
                          />
                          <span className="font-medium text-slate-200">
                            Plan {activeCycle.plan_classes} clases ({activeCycle.frequency}x sem)
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-indigo-400 text-[11px] group-hover:translate-x-0.5 transition-transform">
                          <span>Ver ciclo</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </div>
                      </Link>
                    ) : (
                      <div className="w-full flex items-center justify-between">
                        <span className="text-slate-500 text-[11px]">Sin ciclo activo</span>
                        <Link
                          href={`/cycles/new?clientId=${client.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600/15 border border-indigo-500/30 text-indigo-300 text-[11px] font-medium hover:bg-indigo-600/25 transition-colors"
                        >
                          <CalendarPlus className="w-3 h-3" />
                          <span>Abrir Ciclo</span>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <NewClientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onClientCreated={handleClientCreated}
      />

      {reminderData && (
        <PaymentReminderModal
          isOpen={Boolean(reminderData)}
          onClose={() => setReminderData(null)}
          client={reminderData.client}
          cycle={reminderData.cycle}
          onUpdatePhone={handleUpdatePhone}
        />
      )}

      <BottomNav />
    </div>
  );
}
