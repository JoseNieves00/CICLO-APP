import { createClient as createBrowserSupabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { Client, Cycle, ClassSession, CycleStatus, ClassStatus } from '@/types/database';
import { getCycleLimits, addDays, generateCycleSchedule } from '@/lib/cycleGenerator';

const DEMO_STORAGE_KEY = 'ciclo_app_demo_data_v1';

interface StoredData {
  clients: Client[];
  cycles: Cycle[];
  classes: ClassSession[];
}

// Datos iniciales de demostración para explorar la app inmediatamente
const INITIAL_DEMO_DATA: StoredData = {
  clients: [
    {
      id: 'demo-client-1',
      owner_id: 'demo-user',
      student_name: 'Mateo Gómez',
      guardian_name: 'Camila Gómez (Mamá)',
      phone: '+57 300 123 4567',
      email: 'camila.gomez@ejemplo.com',
      notes: 'Clases de guitarra los lunes a las 4pm',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'demo-client-2',
      owner_id: 'demo-user',
      student_name: 'Sofía Martínez',
      guardian_name: 'Roberto Martínez (Papá)',
      phone: '+57 310 987 6543',
      email: null,
      notes: 'Plan 8 clases, martes y jueves',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  cycles: [
    {
      id: 'demo-cycle-1',
      owner_id: 'demo-user',
      client_id: 'demo-client-1',
      plan_classes: 4,
      frequency: 1,
      start_date: '2026-11-02',
      schedule_days: [1], // Lunes
      schedule_time: '16:00',
      status: 'active',
      is_paid: true,
      paid_at: '2026-11-01T15:00:00Z',
      last_reminder_at: null,
      price: 180000,
      notes: 'Ciclo de Noviembre',
      created_at: '2026-11-01T10:00:00Z',
      updated_at: '2026-11-01T10:00:00Z',
    },
  ],
  classes: [
    {
      id: 'demo-class-1',
      owner_id: 'demo-user',
      cycle_id: 'demo-cycle-1',
      class_number: 1,
      scheduled_date: '2026-11-02',
      actual_date: '2026-11-02',
      status: 'completed',
      cancellation_reason: null,
      is_makeup: false,
      makeup_date: null,
      hours: 1,
      notes: 'Excelente avance con acordes básicos',
      created_at: '2026-11-01T10:00:00Z',
      updated_at: '2026-11-02T17:00:00Z',
    },
    {
      id: 'demo-class-2',
      owner_id: 'demo-user',
      cycle_id: 'demo-cycle-1',
      class_number: 2,
      scheduled_date: '2026-11-09',
      actual_date: null,
      status: 'scheduled',
      cancellation_reason: null,
      is_makeup: false,
      makeup_date: null,
      hours: 1,
      notes: null,
      created_at: '2026-11-01T10:00:00Z',
      updated_at: '2026-11-01T10:00:00Z',
    },
    {
      id: 'demo-class-3',
      owner_id: 'demo-user',
      cycle_id: 'demo-cycle-1',
      class_number: 3,
      scheduled_date: '2026-11-16',
      actual_date: null,
      status: 'scheduled',
      cancellation_reason: null,
      is_makeup: false,
      makeup_date: null,
      hours: 1,
      notes: null,
      created_at: '2026-11-01T10:00:00Z',
      updated_at: '2026-11-01T10:00:00Z',
    },
    {
      id: 'demo-class-4',
      owner_id: 'demo-user',
      cycle_id: 'demo-cycle-1',
      class_number: 4,
      scheduled_date: '2026-11-23',
      actual_date: null,
      status: 'scheduled',
      cancellation_reason: null,
      is_makeup: false,
      makeup_date: null,
      hours: 1,
      notes: null,
      created_at: '2026-11-01T10:00:00Z',
      updated_at: '2026-11-01T10:00:00Z',
    },
  ],
};

function getLocalData(): StoredData {
  if (typeof window === 'undefined') return INITIAL_DEMO_DATA;
  const raw = localStorage.getItem(DEMO_STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(INITIAL_DEMO_DATA));
    return INITIAL_DEMO_DATA;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return INITIAL_DEMO_DATA;
  }
}

function saveLocalData(data: StoredData): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(data));
}

// ==============================================================================
// CLIENTS SERVICE
// ==============================================================================
export async function getClients(): Promise<Client[]> {
  if (isSupabaseConfigured()) {
    const supabase = createBrowserSupabase();
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('student_name', { ascending: true });
    if (error) throw error;
    return (data as Client[]) || [];
  }

  const local = getLocalData();
  return [...local.clients].sort((a, b) => a.student_name.localeCompare(b.student_name));
}

export async function getClientById(id: string): Promise<Client | null> {
  if (isSupabaseConfigured()) {
    const supabase = createBrowserSupabase();
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return null;
    return data as Client;
  }

  const local = getLocalData();
  return local.clients.find((c) => c.id === id) || null;
}

export async function createClient(clientData: {
  student_name: string;
  guardian_name?: string;
  phone?: string;
  email?: string;
  notes?: string;
}): Promise<Client> {
  if (isSupabaseConfigured()) {
    const supabase = createBrowserSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('clients')
      .insert({
        student_name: clientData.student_name.trim(),
        guardian_name: clientData.guardian_name?.trim() || null,
        phone: clientData.phone?.trim() || null,
        email: clientData.email?.trim() || null,
        notes: clientData.notes?.trim() || null,
        owner_id: user?.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data as Client;
  }

  const local = getLocalData();
  const newClient: Client = {
    id: `client-${Date.now()}`,
    owner_id: 'demo-user',
    student_name: clientData.student_name.trim(),
    guardian_name: clientData.guardian_name?.trim() || null,
    phone: clientData.phone?.trim() || null,
    email: clientData.email?.trim() || null,
    notes: clientData.notes?.trim() || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  local.clients.push(newClient);
  saveLocalData(local);
  return newClient;
}

export async function updateClient(
  id: string,
  updates: Partial<Omit<Client, 'id' | 'owner_id' | 'created_at'>>
): Promise<Client> {
  if (isSupabaseConfigured()) {
    const supabase = createBrowserSupabase();
    const { data, error } = await supabase
      .from('clients')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Client;
  }

  const local = getLocalData();
  const index = local.clients.findIndex((c) => c.id === id);
  if (index === -1) throw new Error('Cliente no encontrado');

  local.clients[index] = {
    ...local.clients[index],
    ...updates,
    updated_at: new Date().toISOString(),
  };
  saveLocalData(local);
  return local.clients[index];
}

export async function deleteClient(id: string): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = createBrowserSupabase();
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (error) throw error;
    return;
  }

  const local = getLocalData();
  local.clients = local.clients.filter((c) => c.id !== id);
  local.cycles = local.cycles.filter((cy) => cy.client_id !== id);
  saveLocalData(local);
}

// ==============================================================================
// CYCLES SERVICE
// ==============================================================================
export async function getCycles(clientId?: string): Promise<Cycle[]> {
  if (isSupabaseConfigured()) {
    const supabase = createBrowserSupabase();
    let query = supabase.from('cycles').select('*, client:clients(*)').order('created_at', { ascending: false });
    if (clientId) {
      query = query.eq('client_id', clientId);
    }
    const { data, error } = await query;
    if (error) throw error;
    return (data as Cycle[]) || [];
  }

  const local = getLocalData();
  let list = local.cycles.map((cycle) => ({
    ...cycle,
    client: local.clients.find((c) => c.id === cycle.client_id),
  }));

  if (clientId) {
    list = list.filter((c) => c.client_id === clientId);
  }

  return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function getCycleWithDetails(
  cycleId: string
): Promise<{ cycle: Cycle; client: Client; classes: ClassSession[] } | null> {
  if (isSupabaseConfigured()) {
    const supabase = createBrowserSupabase();
    const { data: cycle, error: cycleErr } = await supabase
      .from('cycles')
      .select('*')
      .eq('id', cycleId)
      .single();
    if (cycleErr || !cycle) return null;

    const { data: client } = await supabase
      .from('clients')
      .select('*')
      .eq('id', (cycle as Cycle).client_id)
      .single();
    if (!client) return null;

    const { data: classes } = await supabase
      .from('classes')
      .select('*')
      .eq('cycle_id', cycleId)
      .order('class_number', { ascending: true });

    return {
      cycle: cycle as Cycle,
      client: client as Client,
      classes: (classes as ClassSession[]) || [],
    };
  }

  const local = getLocalData();
  const cycle = local.cycles.find((c) => c.id === cycleId);
  if (!cycle) return null;

  const client = local.clients.find((c) => c.id === cycle.client_id);
  if (!client) return null;

  const classes = local.classes
    .filter((cl) => cl.cycle_id === cycleId)
    .sort((a, b) => a.class_number - b.class_number);

  return { cycle, client, classes };
}

export async function getClasses(cycleId?: string): Promise<ClassSession[]> {
  if (isSupabaseConfigured()) {
    const supabase = createBrowserSupabase();
    let query = supabase.from('classes').select('*').order('scheduled_date', { ascending: true });
    if (cycleId) {
      query = query.eq('cycle_id', cycleId);
    }
    const { data, error } = await query;
    if (error) throw error;
    return (data as ClassSession[]) || [];
  }

  const local = getLocalData();
  let list = [...local.classes];
  if (cycleId) {
    list = list.filter((cl) => cl.cycle_id === cycleId);
  }
  return list.sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date));
}

export async function createCycleWithClasses(
  cycleData: {
    client_id: string;
    plan_classes: 4 | 8;
    frequency: 1 | 2;
    start_date: string;
    schedule_days: number[];
    schedule_time?: string;
    price?: number;
    notes?: string;
  },
  classesList: {
    class_number: number;
    scheduled_date: string;
  }[]
): Promise<Cycle> {
  if (isSupabaseConfigured()) {
    const supabase = createBrowserSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 1. Crear el ciclo
    const { data: cycle, error: cycleErr } = await supabase
      .from('cycles')
      .insert({
        client_id: cycleData.client_id,
        plan_classes: cycleData.plan_classes,
        frequency: cycleData.frequency,
        start_date: cycleData.start_date,
        schedule_days: cycleData.schedule_days,
        schedule_time: cycleData.schedule_time || null,
        price: cycleData.price || null,
        notes: cycleData.notes || null,
        status: 'active',
        is_paid: false,
        owner_id: user?.id,
      })
      .select()
      .single();

    if (cycleErr) throw cycleErr;

    // 2. Crear las clases vinculadas
    const classesToInsert = classesList.map((c) => ({
      cycle_id: cycle.id,
      class_number: c.class_number,
      scheduled_date: c.scheduled_date,
      status: 'scheduled',
      is_makeup: false,
      hours: 1.0,
      owner_id: user?.id,
    }));

    const { error: classesErr } = await supabase.from('classes').insert(classesToInsert);
    if (classesErr) throw classesErr;

    return cycle as Cycle;
  }

  // Local fallback
  const local = getLocalData();
  const newCycleId = `cycle-${Date.now()}`;
  const newCycle: Cycle = {
    id: newCycleId,
    owner_id: 'demo-user',
    client_id: cycleData.client_id,
    plan_classes: cycleData.plan_classes,
    frequency: cycleData.frequency,
    start_date: cycleData.start_date,
    schedule_days: cycleData.schedule_days,
    schedule_time: cycleData.schedule_time || null,
    price: cycleData.price || null,
    notes: cycleData.notes || null,
    status: 'active',
    is_paid: false,
    paid_at: null,
    last_reminder_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const newClasses: ClassSession[] = classesList.map((c, i) => ({
    id: `class-${Date.now()}-${i + 1}`,
    owner_id: 'demo-user',
    cycle_id: newCycleId,
    class_number: c.class_number,
    scheduled_date: c.scheduled_date,
    actual_date: null,
    status: 'scheduled',
    cancellation_reason: null,
    is_makeup: false,
    makeup_date: null,
    hours: 1,
    notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));

  local.cycles.push(newCycle);
  local.classes.push(...newClasses);
  saveLocalData(local);

  return newCycle;
}

// ==============================================================================
// CLASSES & STATUS TRACKING
// ==============================================================================
export async function updateClassStatus(
  classId: string,
  params: {
    status: ClassStatus;
    actual_date?: string | null;
    cancellation_reason?: string | null;
    is_makeup?: boolean;
    makeup_date?: string | null;
    notes?: string | null;
  }
): Promise<ClassSession> {
  if (isSupabaseConfigured()) {
    const supabase = createBrowserSupabase();
    const { data, error } = await supabase
      .from('classes')
      .update({
        status: params.status,
        actual_date: params.actual_date ?? null,
        cancellation_reason: params.cancellation_reason ?? null,
        is_makeup: params.is_makeup ?? false,
        makeup_date: params.makeup_date ?? null,
        notes: params.notes ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', classId)
      .select()
      .single();

    if (error) throw error;
    return data as ClassSession;
  }

  const local = getLocalData();
  const index = local.classes.findIndex((cl) => cl.id === classId);
  if (index === -1) throw new Error('Clase no encontrada');

  local.classes[index] = {
    ...local.classes[index],
    status: params.status,
    actual_date: params.actual_date ?? (params.status === 'completed' ? new Date().toISOString().split('T')[0] : null),
    cancellation_reason: params.cancellation_reason ?? null,
    is_makeup: params.is_makeup ?? local.classes[index].is_makeup,
    makeup_date: params.makeup_date ?? local.classes[index].makeup_date,
    notes: params.notes !== undefined ? params.notes : local.classes[index].notes,
    updated_at: new Date().toISOString(),
  };

  saveLocalData(local);
  return local.classes[index];
}

export async function toggleCyclePayment(cycleId: string, isPaid: boolean): Promise<Cycle> {
  const paidAt = isPaid ? new Date().toISOString() : null;

  if (isSupabaseConfigured()) {
    const supabase = createBrowserSupabase();
    const { data, error } = await supabase
      .from('cycles')
      .update({
        is_paid: isPaid,
        paid_at: paidAt,
        updated_at: new Date().toISOString(),
      })
      .eq('id', cycleId)
      .select()
      .single();
    if (error) throw error;
    return data as Cycle;
  }

  const local = getLocalData();
  const index = local.cycles.findIndex((c) => c.id === cycleId);
  if (index === -1) throw new Error('Ciclo no encontrado');

  local.cycles[index] = {
    ...local.cycles[index],
    is_paid: isPaid,
    paid_at: paidAt,
    updated_at: new Date().toISOString(),
  };

  saveLocalData(local);
  return local.cycles[index];
}

export async function recordReminderSent(cycleId: string): Promise<Cycle> {
  const sentAt = new Date().toISOString();

  if (isSupabaseConfigured()) {
    const supabase = createBrowserSupabase();
    const { data, error } = await supabase
      .from('cycles')
      .update({
        last_reminder_at: sentAt,
        updated_at: sentAt,
      })
      .eq('id', cycleId)
      .select()
      .single();
    if (error) throw error;
    return data as Cycle;
  }

  const local = getLocalData();
  const index = local.cycles.findIndex((c) => c.id === cycleId);
  if (index === -1) throw new Error('Ciclo no encontrado');

  local.cycles[index] = {
    ...local.cycles[index],
    last_reminder_at: sentAt,
    updated_at: sentAt,
  };

  saveLocalData(local);
  return local.cycles[index];
}

export async function updateCycleStatus(cycleId: string, status: CycleStatus): Promise<Cycle> {
  if (isSupabaseConfigured()) {
    const supabase = createBrowserSupabase();
    const { data, error } = await supabase
      .from('cycles')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', cycleId)
      .select()
      .single();
    if (error) throw error;
    return data as Cycle;
  }

  const local = getLocalData();
  const index = local.cycles.findIndex((c) => c.id === cycleId);
  if (index === -1) throw new Error('Ciclo no encontrado');

  local.cycles[index] = {
    ...local.cycles[index],
    status,
    updated_at: new Date().toISOString(),
  };

  saveLocalData(local);
  return local.cycles[index];
}

export async function renewCycle(oldCycleId: string): Promise<Cycle> {
  const details = await getCycleWithDetails(oldCycleId);
  if (!details) throw new Error('Ciclo original no encontrado');

  const { cycle } = details;

  // Marcar ciclo anterior como archivado
  await updateCycleStatus(oldCycleId, 'archived');

  // Calcular la fecha de inicio del nuevo ciclo (semana 5 / día 28 tras el inicio anterior)
  const newStartDate = addDays(cycle.start_date, 28);

  // Generar las nuevas clases
  const newSchedule = generateCycleSchedule(
    newStartDate,
    cycle.plan_classes,
    cycle.frequency,
    cycle.schedule_days
  );

  return await createCycleWithClasses(
    {
      client_id: cycle.client_id,
      plan_classes: cycle.plan_classes,
      frequency: cycle.frequency,
      start_date: newStartDate,
      schedule_days: cycle.schedule_days,
      schedule_time: cycle.schedule_time || undefined,
      price: cycle.price || undefined,
      notes: `Renovación de ciclo anterior (${cycle.start_date})`,
    },
    newSchedule.map((c) => ({
      class_number: c.classNumber,
      scheduled_date: c.scheduledDate,
    }))
  );
}
