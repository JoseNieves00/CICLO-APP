-- ==============================================================================
-- CICLO APP: ESQUEMA DE BASE DE DATOS SUPABASE Y REGLAS DE SEGURIDAD (RLS)
-- ==============================================================================
-- Este script crea las tablas, índices, vistas, funciones y políticas de seguridad RLS
-- para el control de ciclos de clases, clientes, reposiciones y pagos.
-- Ejecutar en el SQL Editor de tu proyecto Supabase (https://app.supabase.com).

-- Habilitar extensión UUID
create extension if not exists "uuid-ossp";

-- ==============================================================================
-- 1. TABLA: clients (Clientes / Alumnos)
-- ==============================================================================
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade not null default auth.uid(),
  guardian_name text,                -- Nombre del acudiente / cliente que contrata
  student_name text not null,        -- Nombre del alumno
  phone text,                        -- Teléfono de contacto (WhatsApp)
  email text,                        -- Correo opcional
  notes text,                        -- Notas breves
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Índices para optimizar búsquedas por usuario y nombre
create index if not exists idx_clients_owner_id on public.clients(owner_id);
create index if not exists idx_clients_student_name on public.clients(student_name);

-- ==============================================================================
-- 2. TABLA: cycles (Ciclos de Clases)
-- ==============================================================================
-- Regla de ciclo:
-- - Plan de 4 clases (1 clase/semana) u 8 clases (2 clases/semana).
-- - Dura 4 semanas calendario (Semanas 1 a 4).
-- - Semana 5 de reposición si quedan clases pendientes.
-- - Estados:
--     'active'           -> Activo (semanas 1 a 4)
--     'in_reposicion'    -> En reposición (semana 5, si hubo canceladas/pendientes)
--     'completed'        -> Cumplido (todas las clases dadas)
--     'expired_pending'  -> Vencido con pendientes (terminó semana 5 sin completarse)
--     'archived'         -> Archivado tras renovación
create table if not exists public.cycles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade not null default auth.uid(),
  client_id uuid references public.clients(id) on delete cascade not null,
  plan_classes integer not null check (plan_classes in (4, 8)),
  frequency integer not null check (frequency in (1, 2)),
  start_date date not null,
  schedule_days integer[] not null default '{}', -- [1=Lunes, 2=Martes, ..., 7=Domingo]
  schedule_time text,                           -- e.g. "16:00"
  status text not null check (
    status in ('active', 'in_reposicion', 'completed', 'expired_pending', 'archived')
  ) default 'active',
  is_paid boolean not null default false,
  paid_at timestamptz,
  last_reminder_at timestamptz,                 -- Registro del último recordatorio de cobro enviado
  price numeric(10, 2),                         -- Valor pagado o pactado
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_cycles_owner_id on public.cycles(owner_id);
create index if not exists idx_cycles_client_id on public.cycles(client_id);
create index if not exists idx_cycles_status on public.cycles(status);
create index if not exists idx_cycles_start_date on public.cycles(start_date);

-- ==============================================================================
-- 3. TABLA: classes (Clases individuales del ciclo)
-- ==============================================================================
-- Estados:
--   'scheduled'    -> Programada (tentativa o confirmada)
--   'completed'    -> Dada (efectuada)
--   'cancelled'    -> Cancelada
--   'rescheduled'  -> Repuesta (reprogramada en reposición)
create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade not null default auth.uid(),
  cycle_id uuid references public.cycles(id) on delete cascade not null,
  class_number integer not null,                -- 1, 2, 3... hasta plan_classes
  scheduled_date date not null,                -- Fecha tentativa o programada
  actual_date date,                            -- Fecha real en que se dio
  status text not null check (
    status in ('scheduled', 'completed', 'cancelled', 'rescheduled')
  ) default 'scheduled',
  cancellation_reason text,                    -- Motivo si fue cancelada
  is_makeup boolean not null default false,    -- Indica si es de la semana de reposición
  makeup_date date,                            -- Fecha propuesta de reposición si aplica
  hours numeric(3, 1) not null default 1.0,     -- Duración en horas (por defecto 1h)
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_classes_owner_id on public.classes(owner_id);
create index if not exists idx_classes_cycle_id on public.classes(cycle_id);
create index if not exists idx_classes_scheduled_date on public.classes(scheduled_date);
create index if not exists idx_classes_status on public.classes(status);

-- ==============================================================================
-- 4. FUNCIÓN Y TRIGGERS PARA ACTUALIZAR updated_at
-- ==============================================================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger tr_clients_updated_at
  before update on public.clients
  for each row execute function public.handle_updated_at();

create trigger tr_cycles_updated_at
  before update on public.cycles
  for each row execute function public.handle_updated_at();

create trigger tr_classes_updated_at
  before update on public.classes
  for each row execute function public.handle_updated_at();

-- ==============================================================================
-- 5. ROW LEVEL SECURITY (RLS) - SEGURIDAD POR USUARIO / PROFESOR
-- ==============================================================================
-- Cada profesor solo puede ver, crear, modificar y eliminar sus propios registros.
-- Si en el futuro ingresan más profesores, la información queda 100% aislada.

alter table public.clients enable row level security;
alter table public.cycles enable row level security;
alter table public.classes enable row level security;

-- Políticas para clients
create policy "Usuarios gestionan sus propios clientes"
  on public.clients
  for all
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- Políticas para cycles
create policy "Usuarios gestionan sus propios ciclos"
  on public.cycles
  for all
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- Políticas para classes
create policy "Usuarios gestionan sus propias clases"
  on public.classes
  for all
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- ==============================================================================
-- 6. VISTA CALCULADA: cycle_summary (Progreso y resumen de cada ciclo)
-- ==============================================================================
-- Proporciona en una sola consulta:
-- - Clases contratadas, dadas, canceladas, pendientes.
-- - Fecha fin de semana 4 y fecha fin semana 5 (reposición).
create or replace view public.cycle_summary as
select 
  c.id as cycle_id,
  c.owner_id,
  c.client_id,
  cl.student_name,
  cl.guardian_name,
  cl.phone,
  c.plan_classes,
  c.frequency,
  c.start_date,
  (c.start_date + interval '27 days')::date as end_week_4,
  (c.start_date + interval '34 days')::date as end_week_5_reposicion,
  c.status,
  c.is_paid,
  c.paid_at,
  c.schedule_days,
  c.schedule_time,
  count(cls.id) as total_generated_classes,
  count(cls.id) filter (where cls.status = 'completed') as classes_completed,
  count(cls.id) filter (where cls.status = 'cancelled') as classes_cancelled,
  count(cls.id) filter (where cls.status = 'rescheduled') as classes_rescheduled,
  count(cls.id) filter (where cls.status = 'scheduled') as classes_pending,
  (c.plan_classes - count(cls.id) filter (where cls.status = 'completed')) as classes_remaining
from public.cycles c
join public.clients cl on c.client_id = cl.id
left join public.classes cls on c.id = cls.cycle_id
group by c.id, cl.id;

-- ==============================================================================
-- MIGRACIÓN / ACTUALIZACIÓN: Recordatorios de cobro
-- ==============================================================================
-- Ejecutar si la tabla cycles ya existía previamente:
alter table public.cycles add column if not exists last_reminder_at timestamptz;


