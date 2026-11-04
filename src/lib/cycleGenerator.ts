/**
 * Generador de fechas de ciclo y utilidades de cálculo de fechas.
 * Días de la semana: 1 = Lunes, 2 = Martes, 3 = Miércoles, 4 = Jueves, 5 = Viernes, 6 = Sábado, 7 = Domingo
 */

export interface GeneratedClassDate {
  classNumber: number;
  scheduledDate: string; // YYYY-MM-DD
  dayName: string;
  weekNumber: number; // 1, 2, 3, 4
}

export const DAY_NAMES: Record<number, string> = {
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sábado',
  7: 'Domingo',
};

export const DAY_SHORT_NAMES: Record<number, string> = {
  1: 'Lun',
  2: 'Mar',
  3: 'Mié',
  4: 'Jue',
  5: 'Vie',
  6: 'Sáb',
  7: 'Dom',
};

/**
 * Convierte un objeto Date o string YYYY-MM-DD al día de la semana ISO (1=Lun, 7=Dom)
 */
export function getIsoDayOfWeek(dateStr: string): number {
  // Parsing YYYY-MM-DD to local date to avoid timezone shift
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  const dayOfWeek = d.getDay(); // 0 is Sunday, 1 is Monday ... 6 is Saturday
  return dayOfWeek === 0 ? 7 : dayOfWeek;
}

/**
 * Formatea una fecha YYYY-MM-DD a formato amigable en español (ej. "Lun 3 Nov")
 */
export function formatFriendlyDate(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const dayOfWeek = d.getDay();
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  return `${dayNames[dayOfWeek]} ${day} ${months[month - 1]}`;
}

/**
 * Formatea fecha completa (ej. "Lunes, 3 de Noviembre de 2026")
 */
export function formatFullDate(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return `${dayNames[d.getDay()]}, ${day} de ${months[month - 1]} de ${year}`;
}

/**
 * Calcula la diferencia en días entre la fecha programada y la fecha real
 * (actual - scheduled)
 */
export function calculateDaysDiff(scheduledDateStr: string, actualDateStr: string): number {
  const [sy, sm, sd] = scheduledDateStr.split('-').map(Number);
  const [ay, am, ad] = actualDateStr.split('-').map(Number);
  const s = new Date(sy, sm - 1, sd).getTime();
  const a = new Date(ay, am - 1, ad).getTime();
  const diffTime = a - s;
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Texto formateado de la diferencia de días
 */
export function formatDaysDiff(diff: number): string {
  if (diff === 0) return 'El mismo día';
  if (diff > 0) return `+${diff} día${diff > 1 ? 's' : ''}`;
  return `${diff} día${Math.abs(diff) > 1 ? 's' : ''}`;
}

/**
 * Suma días a una fecha YYYY-MM-DD
 */
export function addDays(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

/**
 * Generador automático de clases tentativas para las 4 semanas del ciclo
 *
 * @param startDateStr Fecha de inicio (YYYY-MM-DD)
 * @param planClasses 4 u 8 clases
 * @param frequency 1 o 2 clases por semana
 * @param scheduleDays Días de la semana seleccionados (ej: [1] para lunes o [2, 4] para martes y jueves)
 */
export function generateCycleSchedule(
  startDateStr: string,
  planClasses: 4 | 8,
  frequency: 1 | 2,
  scheduleDays: number[]
): GeneratedClassDate[] {
  if (!startDateStr) return [];

  // El día de inicio de la fecha seleccionada siempre es el punto de partida (Clase 1)
  const startDayOfWeek = getIsoDayOfWeek(startDateStr);

  // Asegurar que el día de inicio de startDateStr esté incluido en los días activos
  let activeDays = [...(scheduleDays || [])];
  if (!activeDays.includes(startDayOfWeek)) {
    if (frequency === 1 || planClasses === 4) {
      activeDays = [startDayOfWeek];
    } else {
      activeDays = [startDayOfWeek, ...activeDays.filter((d) => d !== startDayOfWeek)].slice(0, 2);
    }
  }

  // Ordenar días de la semana
  activeDays.sort((a, b) => a - b);
  const results: GeneratedClassDate[] = [];

  const [sy, sm, sd] = startDateStr.split('-').map(Number);
  const currentDate = new Date(sy, sm - 1, sd);

  let classCounter = 1;
  const maxClasses = planClasses;

  // Recorremos día a día hasta completar las clases del ciclo (4 u 8 clases)
  // El offset 0 corresponde exactamente al día de inicio startDateStr (Clase 1)
  for (let offset = 0; offset < 35 && classCounter <= maxClasses; offset++) {
    const checkDate = new Date(currentDate);
    checkDate.setDate(currentDate.getDate() + offset);

    const checkDayOfWeek = checkDate.getDay() === 0 ? 7 : checkDate.getDay();

    if (activeDays.includes(checkDayOfWeek)) {
      const y = checkDate.getFullYear();
      const m = String(checkDate.getMonth() + 1).padStart(2, '0');
      const d = String(checkDate.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;

      // Semana a la que pertenece dentro del ciclo (1, 2, 3 o 4)
      const weekNumber = Math.min(4, Math.floor(offset / 7) + 1);

      results.push({
        classNumber: classCounter,
        scheduledDate: dateStr,
        dayName: DAY_NAMES[checkDayOfWeek] || '',
        weekNumber,
      });

      classCounter++;
    }
  }

  return results;
}

/**
 * Calcula los límites de las semanas del ciclo:
 * - Fin de semana 4: día 28 desde el inicio
 * - Fin de semana 5 (reposición): día 35 desde el inicio
 */
export function getCycleLimits(startDateStr: string) {
  if (!startDateStr) {
    return {
      endWeek4: '',
      startWeek5Reposicion: '',
      endWeek5Reposicion: '',
    };
  }

  const endWeek4 = addDays(startDateStr, 27);
  const startWeek5Reposicion = addDays(startDateStr, 28);
  const endWeek5Reposicion = addDays(startDateStr, 34);

  return {
    endWeek4,
    startWeek5Reposicion,
    endWeek5Reposicion,
  };
}
