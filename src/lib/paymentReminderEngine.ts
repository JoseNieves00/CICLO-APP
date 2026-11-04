import { Cycle } from '@/types/database';
import { addDays, formatFriendlyDate, formatTime12h } from './cycleGenerator';

/**
 * Horario prudente / moderado para contactar al cliente por temas de cobro.
 * Rango estándar respetuoso: 9:00 AM (09:00) a 7:00 PM (19:00).
 */
export const PRUDENT_HOURS_START = 9;  // 9:00 AM
export const PRUDENT_HOURS_END = 19;   // 7:00 PM

/**
 * Frecuencia moderada entre recordatorios: mínimo 3 días (72 horas)
 * para evitar saturar al acudiente o alumno.
 */
export const MODERATE_FREQUENCY_DAYS = 3;

export interface PrudentHoursStatus {
  isPrudent: boolean;
  currentHourStr: string;
  message: string;
  badgeText: string;
}

export interface CycleWeekInfo {
  weekNumber: number; // 1, 2, 3, 4, 5+
  label: string;
  isFinalWeek: boolean;
  isReposicion: boolean;
  isExpired: boolean;
  daysUntilFinalWeek: number;
  finalWeekStartDate: string;
}

export type ReminderActionState =
  | 'paid'           // Ya está pagado
  | 'too_early'       // En semanas 1 a 3 (aún no es semana final)
  | 'ready_first'     // En semana final o reposición, primer recordatorio pendiente
  | 'wait_interval'   // Recordatorio enviado recientemente (< 3 días)
  | 'ready_followup'; // Recordatorio enviado hace 3+ días y sigue pendiente

export interface CycleReminderEvaluation {
  isPaid: boolean;
  weekInfo: CycleWeekInfo;
  state: ReminderActionState;
  title: string;
  description: string;
  badgeLabel: string;
  badgeColor: 'emerald' | 'amber' | 'slate' | 'rose' | 'indigo';
  canSendNow: boolean;
  daysSinceLastReminder: number | null;
  suggestedTemplateId: 'amable_inicio' | 'recordatorio_cordial' | 'cierre_renovacion';
}

/**
 * Obtiene el formato YYYY-MM-DD local de una fecha
 */
export function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Evalúa si la hora actual está dentro del horario moderado/respetuoso (9:00 AM - 7:00 PM).
 */
export function getPrudentHoursStatus(now: Date = new Date()): PrudentHoursStatus {
  const hour = now.getHours();
  const minutes = now.getMinutes();
  const timeFormatted = formatTime12h(`${hour}:${String(minutes).padStart(2, '0')}`);

  const isPrudent = hour >= PRUDENT_HOURS_START && hour < PRUDENT_HOURS_END;

  if (isPrudent) {
    return {
      isPrudent: true,
      currentHourStr: timeFormatted,
      badgeText: 'Horario moderado activo',
      message: `Hora actual (${timeFormatted}): Dentro de la franja sugerida (9:00 AM – 7:00 PM).`,
    };
  }

  const isBefore = hour < PRUDENT_HOURS_START;
  const suggestion = isBefore
    ? 'Te sugerimos esperar hasta las 9:00 AM para escribir al acudiente.'
    : 'Es horario de descanso nocturno. Te sugerimos escribir mañana a partir de las 9:00 AM.';

  return {
    isPrudent: false,
    currentHourStr: timeFormatted,
    badgeText: 'Fuera de horario moderado',
    message: `${timeFormatted}: Fuera de la franja sugerida (9:00 AM – 7:00 PM). ${suggestion}`,
  };
}

/**
 * Calcula la semana en la que se encuentra el ciclo y si ya está en la última semana.
 * Semana 1: Días 0 - 6
 * Semana 2: Días 7 - 13
 * Semana 3: Días 14 - 20
 * Semana 4 (Última semana regular): Días 21 - 27
 * Semana 5 (Semana de reposición): Días 28 - 34
 */
export function getCycleWeekInfo(cycle: Cycle, todayStr?: string): CycleWeekInfo {
  const today = todayStr || getLocalDateString();
  const finalWeekStartDate = addDays(cycle.start_date, 21);

  // Calcular diferencia en días entre la fecha de inicio y hoy
  const [sy, sm, sd] = cycle.start_date.split('-').map(Number);
  const [ty, tm, td] = today.split('-').map(Number);
  const startMs = new Date(sy, sm - 1, sd).getTime();
  const todayMs = new Date(ty, tm - 1, td).getTime();
  const diffDays = Math.floor((todayMs - startMs) / (1000 * 60 * 60 * 24));

  const isReposicion = cycle.status === 'in_reposicion' || (diffDays >= 28 && diffDays <= 34);
  const isExpired = cycle.status === 'expired_pending' || diffDays > 34;

  let weekNumber = 1;
  if (diffDays >= 0) {
    weekNumber = Math.min(5, Math.floor(diffDays / 7) + 1);
  }

  // Se considera última semana si ya transcurrieron 21 días (Semana 4),
  // o si está en reposición, vencido con pendientes o ya completado.
  const isFinalWeek =
    diffDays >= 21 ||
    cycle.status === 'in_reposicion' ||
    cycle.status === 'expired_pending' ||
    cycle.status === 'completed';

  const daysUntilFinalWeek = Math.max(0, 21 - diffDays);

  let label = `Semana ${weekNumber} de 4`;
  if (cycle.status === 'completed') {
    label = 'Ciclo culminado';
  } else if (isReposicion) {
    label = 'Semana 5 (Reposición)';
  } else if (isExpired) {
    label = 'Ciclo vencido con pendientes';
  } else if (diffDays >= 21 && diffDays <= 27) {
    label = 'Semana 4 (Última semana)';
  }

  return {
    weekNumber,
    label,
    isFinalWeek,
    isReposicion,
    isExpired,
    daysUntilFinalWeek,
    finalWeekStartDate,
  };
}

/**
 * Determina si el ciclo ya está en su última semana o fase final de cobro.
 */
export function isCycleInFinalWeek(cycle: Cycle, todayStr?: string): boolean {
  const weekInfo = getCycleWeekInfo(cycle, todayStr);
  return weekInfo.isFinalWeek;
}

/**
 * Realiza una evaluación completa del estado de cobro de un ciclo:
 * - Si está pagado
 * - Si está en la semana final
 * - Frecuencia moderada (si han pasado 3+ días desde el último mensaje)
 * - Plantilla sugerida de WhatsApp
 */
export function evaluateCycleReminder(cycle: Cycle, now: Date = new Date()): CycleReminderEvaluation {
  const isPaid = Boolean(cycle.is_paid);
  const weekInfo = getCycleWeekInfo(cycle, getLocalDateString(now));

  if (isPaid) {
    return {
      isPaid: true,
      weekInfo,
      state: 'paid',
      title: 'Pago al día',
      description: 'El mes ya ha sido registrado como pagado.',
      badgeLabel: 'Pagado',
      badgeColor: 'emerald',
      canSendNow: false,
      daysSinceLastReminder: null,
      suggestedTemplateId: 'amable_inicio',
    };
  }

  // Si aún no está en la semana final (Semanas 1 a 3)
  if (!weekInfo.isFinalWeek) {
    return {
      isPaid: false,
      weekInfo,
      state: 'too_early',
      title: 'Aún en semanas iniciales',
      description: `El ciclo va en la ${weekInfo.label}. El recordatorio se activará en la Semana 4 (${formatFriendlyDate(weekInfo.finalWeekStartDate)}).`,
      badgeLabel: `${weekInfo.label} • Esperar sem. 4`,
      badgeColor: 'slate',
      canSendNow: false,
      daysSinceLastReminder: null,
      suggestedTemplateId: 'amable_inicio',
    };
  }

  // Ya está en la semana final o posterior y NO ha pagado
  let daysSinceLastReminder: number | null = null;
  if (cycle.last_reminder_at) {
    const lastReminderDate = new Date(cycle.last_reminder_at);
    const diffMs = now.getTime() - lastReminderDate.getTime();
    daysSinceLastReminder = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  // Caso: Nunca se le ha enviado recordatorio
  if (daysSinceLastReminder === null) {
    const suggestedTemplate = weekInfo.isReposicion || weekInfo.isExpired || cycle.status === 'completed'
      ? 'cierre_renovacion'
      : 'cierre_renovacion';

    return {
      isPaid: false,
      weekInfo,
      state: 'ready_first',
      title: 'Listo para recordar cobro',
      description: `El ciclo se encuentra en ${weekInfo.label}. Es el momento ideal para recordar el cobro del mes o renovación.`,
      badgeLabel: 'Listo para cobrar',
      badgeColor: 'amber',
      canSendNow: true,
      daysSinceLastReminder: null,
      suggestedTemplateId: suggestedTemplate,
    };
  }

  // Caso: Se envió recientemente (< MODERATE_FREQUENCY_DAYS días)
  if (daysSinceLastReminder < MODERATE_FREQUENCY_DAYS) {
    const daysWait = MODERATE_FREQUENCY_DAYS - daysSinceLastReminder;
    const dayWord = daysWait === 1 ? 'día' : 'días';
    return {
      isPaid: false,
      weekInfo,
      state: 'wait_interval',
      title: 'Recordatorio reciente enviado',
      description: `Mensaje enviado hace ${daysSinceLastReminder === 0 ? 'hoy' : `${daysSinceLastReminder} día(s)`}. Frecuencia moderada: se sugiere esperar ${daysWait} ${dayWord} más para no saturar.`,
      badgeLabel: `Enviado hace ${daysSinceLastReminder === 0 ? 'hoy' : `${daysSinceLastReminder}d`}`,
      badgeColor: 'indigo',
      canSendNow: true, // El usuario aún puede forzar el envío si lo necesita
      daysSinceLastReminder,
      suggestedTemplateId: 'recordatorio_cordial',
    };
  }

  // Caso: Han transcurrido 3 o más días desde el último recordatorio
  return {
    isPaid: false,
    weekInfo,
    state: 'ready_followup',
    title: 'Toca segundo recordatorio',
    description: `Han transcurrido ${daysSinceLastReminder} días desde el último recordatorio y el pago sigue pendiente.`,
    badgeLabel: `Cobro debido (${daysSinceLastReminder}d)`,
    badgeColor: 'rose',
    canSendNow: true,
    daysSinceLastReminder,
    suggestedTemplateId: 'recordatorio_cordial',
  };
}
