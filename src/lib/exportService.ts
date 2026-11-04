import { getClients, getCycles, getClasses } from './services/dataService';
import { formatFriendlyDate } from './cycleGenerator';

/**
 * Genera un archivo CSV con el respaldo completo de clientes, ciclos y estados
 * y dispara la descarga directa en el navegador.
 */
export async function downloadDataBackupCsv(): Promise<void> {
  const [clients, cycles, classes] = await Promise.all([
    getClients(),
    getCycles(),
    getClasses(),
  ]);

  const headers = [
    'ID Alumno',
    'Nombre del Alumno',
    'Acudiente',
    'Teléfono',
    'Plan Contratado',
    'Frecuencia Semanal',
    'Fecha de Inicio',
    'Estado Ciclo',
    'Pagado',
    'Fecha de Pago',
    'Precio',
    'Clases Dadas',
    'Clases Canceladas',
    'Clases Pendientes',
    'Fecha Último Recordatorio',
  ];

  const rows = cycles.map((cy) => {
    const client = clients.find((c) => c.id === cy.client_id);
    const cycleClasses = classes.filter((cl) => cl.cycle_id === cy.id);

    const completed = cycleClasses.filter((cl) => cl.status === 'completed').length;
    const cancelled = cycleClasses.filter((cl) => cl.status === 'cancelled').length;
    const pending = cycleClasses.filter((cl) => cl.status === 'scheduled').length;

    const statusLabel =
      cy.status === 'active'
        ? 'Activo'
        : cy.status === 'in_reposicion'
        ? 'En reposición'
        : cy.status === 'completed'
        ? 'Cumplido'
        : cy.status === 'expired_pending'
        ? 'Vencido con pendientes'
        : 'Archivado';

    return [
      client?.id || cy.client_id,
      `"${(client?.student_name || '').replace(/"/g, '""')}"`,
      `"${(client?.guardian_name || '').replace(/"/g, '""')}"`,
      `"${(client?.phone || '').replace(/"/g, '""')}"`,
      `Plan ${cy.plan_classes} clases`,
      `${cy.frequency}x semana`,
      cy.start_date,
      statusLabel,
      cy.is_paid ? 'Sí' : 'No',
      cy.paid_at ? cy.paid_at.split('T')[0] : '',
      cy.price ? String(cy.price) : '',
      String(completed),
      String(cancelled),
      String(pending),
      cy.last_reminder_at ? cy.last_reminder_at.split('T')[0] : '',
    ];
  });

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

  // Agregar BOM para compatibilidad con Excel (acentos y caracteres en español)
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const nowStr = new Date().toISOString().split('T')[0];
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `respaldo_ciclo_app_${nowStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

