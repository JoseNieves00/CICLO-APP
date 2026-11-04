import { Client, Cycle } from '@/types/database';
import {
  evaluateCycleReminder,
  getPrudentHoursStatus,
  getLocalDateString,
} from './paymentReminderEngine';

const STORAGE_LAST_NOTIFICATION_DATE = 'ciclo_last_payment_alert_date';

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return 'denied';
  try {
    const perm = await Notification.requestPermission();
    return perm;
  } catch (err) {
    console.error('Error requesting notification permission:', err);
    return 'denied';
  }
}

/**
 * Revisa si hay ciclos listos para cobro durante el horario moderado y,
 * si no se ha notificado hoy, despacha una notificación al celular/navegador.
 */
export function checkAndSendLocalReminderNotification(
  cycles: Cycle[],
  clients: Client[],
  options: { force?: boolean } = {}
): { notified: boolean; count: number; reason?: string } {
  if (!isNotificationSupported()) {
    return { notified: false, count: 0, reason: 'Navegador no soporta notificaciones' };
  }

  if (Notification.permission !== 'granted') {
    return { notified: false, count: 0, reason: 'Permiso de notificaciones no concedido' };
  }

  // 1. Validar horario moderado (9:00 AM a 7:00 PM)
  const prudentInfo = getPrudentHoursStatus();
  if (!prudentInfo.isPrudent && !options.force) {
    return {
      notified: false,
      count: 0,
      reason: 'Fuera de horario moderado (9:00 AM - 7:00 PM)',
    };
  }

  // 2. Control de frecuencia para no saturar al usuario (máximo 1 notificación diaria, salvo force)
  const todayStr = getLocalDateString();
  const lastAlertDate = localStorage.getItem(STORAGE_LAST_NOTIFICATION_DATE);
  if (lastAlertDate === todayStr && !options.force) {
    return {
      notified: false,
      count: 0,
      reason: 'Ya se envió el recordatorio diario de cobros hoy',
    };
  }

  // 3. Filtrar los ciclos en última semana o reposición pendientes de cobro y listos
  const dueCycles = cycles.filter((cycle) => {
    if (cycle.is_paid) return false;
    const evaluation = evaluateCycleReminder(cycle);
    return evaluation.state === 'ready_first' || evaluation.state === 'ready_followup';
  });

  if (dueCycles.length === 0) {
    return { notified: false, count: 0, reason: 'No hay ciclos pendientes de cobro para hoy' };
  }

  // 4. Preparar el mensaje
  const firstCycle = dueCycles[0];
  const firstClient = clients.find((c) => c.id === firstCycle.client_id);
  const clientName = firstClient ? firstClient.student_name : 'un alumno';
  const guardianPart = firstClient?.guardian_name ? ` (${firstClient.guardian_name})` : '';

  let body = '';
  if (dueCycles.length === 1) {
    body = `Es momento oportuno para cobrar el ciclo de ${clientName}${guardianPart}. Toca para abrir.`;
  } else {
    body = `Tienes ${dueCycles.length} cobros pendientes en semana final (incluye a ${clientName}). Toca para ver.`;
  }

  try {
    const notification = new Notification('🔔 Recordatorio de Cobro • Ciclo App', {
      body,
      icon: '/icon.svg',
      badge: '/icon.svg',
      tag: 'ciclo-payment-reminder',
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    localStorage.setItem(STORAGE_LAST_NOTIFICATION_DATE, todayStr);
    return { notified: true, count: dueCycles.length };
  } catch (err) {
    console.error('Error creating browser notification:', err);
    return { notified: false, count: dueCycles.length, reason: 'Fallo al disparar notificación' };
  }
}

