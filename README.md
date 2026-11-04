# Ciclo App 📱

> Aplicativo web móvil y tablet (Next.js + Tailwind + Supabase Postgres) para el control integral de ciclos de clases, reposiciones, cobros inteligentes y generación de imágenes compartibles para clientes.

---

## 🚀 Estado de la Versión 1.0 (Producción)

Todas las fases esenciales han sido implementadas, verificadas y optimizadas para producción:

- [x] **Fase 1: Base & Seguridad**: Next.js App Router, Supabase Postgres, autenticación, aislamiento multi-usuario con RLS (`owner_id = auth.uid()`).
- [x] **Fase 2: Núcleo**: Gestión de clientes, generador automático de ciclos (Clase 1 en fecha exacta, 4 semanas regulares y Semana 5 de reposición) y marcado de clases con fechas reales y motivos.
- [x] **Fase 3: Control y Cobros**: Reposiciones, control de pago mensual, renovación de ciclo con 1 toque.
- [x] **Fase 4: Imágenes y WhatsApp**: Generación de tarjetas PNG de alta resolución (*Programación* y *Cumplimiento*) con Web Share API, formato accesible en 12 horas AM/PM y plantillas pre-redactadas.
- [x] **Fase 5: Motor Inteligente y PWA**:
  - Alertas automáticas solo a partir de la **Semana 4** del ciclo.
  - Horario moderado (9:00 AM – 7:00 PM) para proteger tiempos de descanso.
  - Frecuencia moderada de 3 días para no saturar al cliente.
  - Web Notifications API en el dispositivo.
  - Respaldo de datos con exportación completa a `.CSV` (Excel).
  - Ícono SVG oficial y manifiesto PWA para instalación en celulares.
  - Optimización completa para pantallas de tablet / iPad (layout responsivo en 2 columnas).

---

## 📌 Próxima Versión (v2.0) - Tareas Planificadas

Las siguientes funcionalidades quedan formalmente programadas como prioritarias para la siguiente iteración:

### 1. Portal Web para el Alumno / Acudiente
- **Objetivo:** Permitir que el acudiente o alumno pueda consultar en vivo el estado de su ciclo, fechas programadas, reposiciones y progreso sin necesidad de reenviarle imágenes cada vez.
- **Alcance previsto:**
  - Enlace único o código PIN seguro por alumno (ej. `/portal/[token]`).
  - Vista de sólo lectura optimizada para móviles con el calendario de clases y clases restantes.
  - Opción de solicitar reprogramación o avisar inasistencia con antelación desde el portal.

### 2. Sincronización con Google Calendar / Apple Calendar
- **Objetivo:** Reflejar automáticamente las clases programadas y reposiciones en la app de calendario nativa del celular del docente y del alumno.
- **Alcance previsto:**
  - Botón de descarga de archivo `.ics` por ciclo o clase individual.
  - Enlace de suscripción webcal (`webcal://...`) para que las clases se actualicen automáticamente en Google Calendar, Apple Calendar u Outlook.
  - Alarmas automáticas 1 hora antes de cada clase.

---

## 💻 Desarrollo Local

```bash
# Iniciar servidor de desarrollo
npm run dev

# Compilar para producción (utiliza webpack para compatibilidad de dependencias)
npm run build

# Iniciar servidor de producción
npm run start
```

---

## 🛠️ Variables de Entorno (Producción)

En Vercel o tu hosting de preferencia, agrega:
```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-de-supabase
NEXT_PUBLIC_SITE_URL=https://tu-dominio.com
```

Desarrollado con arquitectura escalable y mobile-first. 



Hola mundo!