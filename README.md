# Ciclo App 📱

> Aplicativo web móvil (Next.js + Tailwind + Supabase Postgres) para el control integral de ciclos de clases, reposiciones, pagos y generación de imágenes compartibles para clientes.

---

## 🚀 Fase 1: Base y Configuración (Completada)

Esta primera fase establece la base técnica y de seguridad de la aplicación:
1. **Proyecto Next.js (App Router)** configurado con Tailwind CSS y preparado como PWA para agregarse a la pantalla de inicio del celular.
2. **Supabase Client & Auth**: Clientes de navegador y servidor con `@supabase/ssr` y manejo de cookies y sesiones.
3. **Esquema de Base de Datos Postgres (`supabase/schema.sql`)**:
   - `clients`: Alumnos, acudientes y teléfonos.
   - `cycles`: Planes de 4 u 8 clases, frecuencia (1 o 2/semana), fechas, días, control de pago y estados (`active`, `in_reposicion`, `completed`, `expired_pending`, `archived`).
   - `classes`: Clases individuales, fecha programada, fecha dada, estado (`scheduled`, `completed`, `cancelled`, `rescheduled`), horas y reposiciones.
   - **Row Level Security (RLS)**: Reglas de seguridad activadas en cada tabla con aislamiento por `owner_id = auth.uid()`.
   - **Vista calculada `cycle_summary`**: Resume clases dadas, restantes, canceladas y fechas límite de semanas 4 y 5.
4. **Pantalla de Autenticación (`/login`)**:
   - Inicio de sesión y registro de usuario.
   - Diseño mobile-first con modo oscuro optimizado para celular.
5. **Navegación Móvil**: Barra inferior fija (`Hoy`, `Clientes`, `Nuevo Ciclo`, `Ajustes`).

---

## 🛠️ Instrucciones para Conectar Supabase

### 1. Ejecutar el esquema SQL
1. Abre tu proyecto en [Supabase Dashboard](https://app.supabase.com).
2. Ve a la sección **SQL Editor** en la barra lateral.
3. Crea una **New query**.
4. Copia y pega el contenido del archivo [`supabase/schema.sql`](supabase/schema.sql) y haz clic en **Run**.

### 2. Configurar variables de entorno
Crea o edita tu archivo `.env.local` en la raíz del proyecto:
```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-de-supabase
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```
> Encuentras estos valores en Supabase en: **Project Settings -> API**.

---

## 💻 Desarrollo Local

```bash
# Iniciar el servidor de desarrollo
npm run dev

# Compilar para producción
npm run build

# Iniciar servidor de producción
npm run start
```

Abre en tu navegador o celular [http://localhost:3000](http://localhost:3000).

---

## 🗺️ Hoja de Ruta de Fases

- [x] **Fase 1: Base** (Next.js, Supabase, Login, Tablas, RLS, Mobile Shell)
- [ ] **Fase 2: Núcleo** (Gestión de clientes, generador automático de ciclos con días/fechas y marcar clases)
- [ ] **Fase 3: Control** (Gestión de semana de reposición, control de pago mensual, cierre y renovación con 1 toque)
- [ ] **Fase 4: Imágenes y Compartir** (Generación de PNG con `html-to-image` y Web Share API para WhatsApp)
- [ ] **Fase 5: Pulido** (PWA con icono nativo, vista "Hoy" con clases del día, alertas y exportación CSV)
- [ ] **Fase 6: Migración** (Importación inicial desde CSV de Sheets)
