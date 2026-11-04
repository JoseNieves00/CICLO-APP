import { Client, Cycle } from '@/types/database';

export interface PaymentTemplate {
  id: string;
  title: string;
  description: string;
  getText: (client: Client, cycle: Cycle) => string;
}

export function formatCurrency(amount: number | null | undefined): string {
  if (!amount && amount !== 0) return '';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount);
}

export const PAYMENT_TEMPLATES: PaymentTemplate[] = [
  {
    id: 'amable_inicio',
    title: 'Inicio de Ciclo (Bienvenida)',
    description: 'Para enviar al arrancar las clases del mes',
    getText: (client, cycle) => {
      const recipient = client.guardian_name || client.student_name;
      const isGuardian = Boolean(client.guardian_name);
      const studentMention = isGuardian ? ` de ${client.student_name}` : '';
      const priceText = cycle.price ? `\n💰 *Valor:* ${formatCurrency(cycle.price)}` : '';

      return `¡Hola ${recipient}! 👋 Espero que estés muy bien.

Te escribo para saludarte y compartirte la información del ciclo de clases${studentMention} (${cycle.plan_classes} clases programadas).${priceText}

Quedo atento a la confirmación de tu pago para dejarlo registrado en la aplicación. ¡Muchas gracias por tu puntualidad y confianza! 🎶✨`;
    },
  },
  {
    id: 'recordatorio_cordial',
    title: 'Recordatorio Amable',
    description: 'Recordatorio cordial para pagos que llevan días pendientes',
    getText: (client, cycle) => {
      const recipient = client.guardian_name || client.student_name;
      const isGuardian = Boolean(client.guardian_name);
      const studentMention = isGuardian ? ` de ${client.student_name}` : '';
      const priceText = cycle.price ? ` (${formatCurrency(cycle.price)})` : '';

      return `¡Hola ${recipient}! 👋 Espero que tengas un excelente día.

Te escribo con un cariñoso recordatorio del pago correspondiente al ciclo de clases actual${studentMention}${priceText}.

Si ya realizaste la transferencia o pago, por favor compárteme el comprobante por este medio para actualizarlo en el sistema. ¡Muchas gracias por tu apoyo! 🙏`;
    },
  },
  {
    id: 'cierre_renovacion',
    title: 'Cierre y Renovación',
    description: 'Para recordar el pago al culminar el ciclo y asegurar el cupo',
    getText: (client, cycle) => {
      const recipient = client.guardian_name || client.student_name;
      const isGuardian = Boolean(client.guardian_name);
      const studentMention = isGuardian ? ` de ${client.student_name}` : '';
      const priceText = cycle.price ? `\n💰 *Valor:* ${formatCurrency(cycle.price)}` : '';

      return `¡Hola ${recipient}! 👋 

Estamos en la recta final del ciclo de clases${studentMention}. Para asegurar tu horario habitual y continuar el próximo mes sin interrupciones, te recuerdo el valor del siguiente ciclo:${priceText}

Agradezco me avises cuando puedas realizarlo. ¡Un abrazo y gracias por el compromiso! 🚀`;
    },
  },
];

export function buildWhatsAppUrl(phone: string | null | undefined, message: string): string | null {
  if (!phone) return null;
  // Limpiar caracteres no numéricos
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  if (!cleanPhone) return null;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

