export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type CycleStatus =
  | 'active'          // Activo (semanas 1 a 4)
  | 'in_reposicion'   // En reposición (semana 5, si quedaron clases pendientes)
  | 'completed'       // Cumplido (todas las clases dadas)
  | 'expired_pending' // Vencido con pendientes (terminó semana 5 sin completarse)
  | 'archived';       // Archivado

export type ClassStatus =
  | 'scheduled'    // Programada (tentativa)
  | 'completed'    // Dada
  | 'cancelled'    // Cancelada
  | 'rescheduled'; // Repuesta

export interface Client {
  id: string;
  owner_id: string;
  guardian_name: string | null;
  student_name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Cycle {
  id: string;
  owner_id: string;
  client_id: string;
  plan_classes: 4 | 8;
  frequency: 1 | 2;
  start_date: string;
  schedule_days: number[]; // 1=Lunes, 2=Martes, ..., 7=Domingo
  schedule_time: string | null;
  status: CycleStatus;
  is_paid: boolean;
  paid_at: string | null;
  price: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  client?: Client;
  classes?: ClassSession[];
}

export interface ClassSession {
  id: string;
  owner_id: string;
  cycle_id: string;
  class_number: number;
  scheduled_date: string;
  actual_date: string | null;
  status: ClassStatus;
  cancellation_reason: string | null;
  is_makeup: boolean;
  makeup_date: string | null;
  hours: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CycleSummary {
  cycle_id: string;
  owner_id: string;
  client_id: string;
  student_name: string;
  guardian_name: string | null;
  phone: string | null;
  plan_classes: number;
  frequency: number;
  start_date: string;
  end_week_4: string;
  end_week_5_reposicion: string;
  status: CycleStatus;
  is_paid: boolean;
  paid_at: string | null;
  schedule_days: number[];
  schedule_time: string | null;
  total_generated_classes: number;
  classes_completed: number;
  classes_cancelled: number;
  classes_rescheduled: number;
  classes_pending: number;
  classes_remaining: number;
}

export interface Database {
  public: {
    Tables: {
      clients: {
        Row: Client;
        Insert: {
          id?: string;
          owner_id?: string;
          guardian_name?: string | null;
          student_name: string;
          phone?: string | null;
          email?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          guardian_name?: string | null;
          student_name?: string;
          phone?: string | null;
          email?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      cycles: {
        Row: Cycle;
        Insert: {
          id?: string;
          owner_id?: string;
          client_id: string;
          plan_classes: 4 | 8;
          frequency: 1 | 2;
          start_date: string;
          schedule_days: number[];
          schedule_time?: string | null;
          status?: CycleStatus;
          is_paid?: boolean;
          paid_at?: string | null;
          price?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          client_id?: string;
          plan_classes?: 4 | 8;
          frequency?: 1 | 2;
          start_date?: string;
          schedule_days?: number[];
          schedule_time?: string | null;
          status?: CycleStatus;
          is_paid?: boolean;
          paid_at?: string | null;
          price?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      classes: {
        Row: ClassSession;
        Insert: {
          id?: string;
          owner_id?: string;
          cycle_id: string;
          class_number: number;
          scheduled_date: string;
          actual_date?: string | null;
          status?: ClassStatus;
          cancellation_reason?: string | null;
          is_makeup?: boolean;
          makeup_date?: string | null;
          hours?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          cycle_id?: string;
          class_number?: number;
          scheduled_date?: string;
          actual_date?: string | null;
          status?: ClassStatus;
          cancellation_reason?: string | null;
          is_makeup?: boolean;
          makeup_date?: string | null;
          hours?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      cycle_summary: {
        Row: CycleSummary;
      };
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
