# Guía para defender el proyecto — MediInfo (Gestión de Citas)

Apoyo para la presentación. Resume **qué decir**, **qué mostrar** y **dónde está
cada cosa en el código**. Para el detalle técnico ver `ARQUITECTURA.md`.

> Login de demo: **admin@citas.com** / **Admin12345**

---

## 1. Resumen en una frase

FrontEnd en **React + TypeScript** que consume un **API REST externo** para
gestionar citas médicas. Interfaz construida con **Tailwind CSS + shadcn/ui**,
con un tema propio "negro industrial". No inventa datos locales: **todo sale del
API** a través de una capa de servicios.

---

## 2. Stack y aspectos técnicos obligatorios (cómo lo cumplimos)

- **React** (useState, useEffect, props, hooks, componentes) → toda la app.
- **React Router** con **rutas protegidas** por sesión y por rol →
  `src/App.tsx`, `components/auth/`.
- **Servicios para consumir el API** (GET/POST/PUT/PATCH, manejo de errores,
  loading y estados vacíos) → `src/services/api.ts`.
- **Context** para autenticación → `src/context/AuthContext.tsx`.
- **Tailwind + shadcn/ui** con variables de tema, diseño responsive y
  componentes reutilizables → `src/tailwind.css` (puente de tokens) y
  `src/components/ui/`.
- **Layout principal** (sidebar + topbar) → `components/layout/AppLayout.tsx`.
- **Organización modular** → `modules/`, `pages/`, `components/`.

Si preguntan "¿dónde está X?", la respuesta casi siempre es una de esas rutas.

---

## 3. Recorrido sugerido para la demo

1. **Login** → explicar Context, token y rol.
2. **Resumen (dashboard)** → indicadores y colores de estado.
3. **Citas → Nueva cita** → *el módulo estrella* (ver punto 4).
4. **Detalle de cita** → cambio de estado y cancelar (diálogo).
5. **Servicios / Empleados** → formularios, imagen, asignación de servicios.
6. **Detalle de empleado** → intentar **desactivar** con citas activas.
7. **Agenda diaria** → grilla hora × empleado.
8. **Horarios / Restricciones** → catálogos de solo lectura.

---

## 4. Qué decir en cada pantalla

### Login
- El usuario inicia sesión contra el API; se guarda el **token**.
- Se consulta el **perfil** para conocer el **rol**, que decide qué se muestra.
- Código: `pages/LoginPage.tsx`, `context/AuthContext.tsx`.

### Permisos por rol
- Tres roles: **Administrador, Empleado, Cliente**.
- El menú **oculta** lo no permitido; `RoleRoute` **bloquea el acceso directo**
  por URL. El empleado solo ve **sus** citas; el cliente solo ve/cancela **las
  suyas** (y solo cuando el estado lo permite).
- Código: `AppLayout.tsx`, `components/auth/RoleRoute.tsx`,
  `pages/AppointmentsPage.tsx`.

### Servicios
- Listado con **miniatura**, detalle, crear/editar con **carga y vista previa
  de imagen**, activar/desactivar.
- **No se puede desactivar** un servicio con citas pendientes/confirmadas
  (control en el propio FrontEnd, ver punto 5).
- Código: `pages/ServicesPage / ServiceDetailPage / NewServicePage /
  EditServicePage`.

### Servicios adicionales
- CRUD + activar/desactivar. En la cita **suman al costo pero no a la duración**.
- Código: `pages/Additionals*`, `modules/catalog/AdditionalForm.tsx`.

### Empleados
- CRUD, **asignación de servicios en el mismo formulario** (checkboxes), código
  validado (letras, números, guiones y guion bajo), muestra **citas asignadas**
  y **restricciones**.
- Código: `pages/Employee*`, `NewEmployeePage / EditEmployeePage`.

### Citas — proceso principal (lo más importante)
Al crear una cita se muestran **a la vez**:
- cliente, servicio y adicionales → **costo, duración y hora fin automáticos**;
- empleado (solo los que tienen asignado ese servicio);
- **agenda del empleado** para la fecha: Disponible / Cita asignada / Restricción;
- **validación** antes de guardar: fecha no pasada, día activo, dentro del
  horario, restricciones (generales y del empleado) y **traslapes** (las
  canceladas no bloquean). Además se consulta `/citas/disponibilidad` en el API.
- Editar/cancelar/cambiar estado según los **flags del estado** que da el API.
- Código: `modules/appointments/AppointmentForm.tsx`,
  `appointmentUtils.ts` (cálculo), `availability.ts` (reglas),
  `pages/AppointmentDetailPage.tsx` (estado + cancelación con diálogo).

### Agenda diaria del establecimiento (solo Administrador)
- Selector de fecha; grilla **hora × empleado** con estado/cliente/servicio;
  restricciones diferenciadas; clic lleva al detalle de la cita.
- Código: `pages/AgendaPage.tsx`, `modules/agenda/AgendaGrid.tsx`.

### Horarios y Restricciones (solo lectura)
- Listado + detalle. La restricción muestra **ámbito** (establecimiento o
  empleado), **fecha**, **horario**, **motivo** y **estado**.
- Código: `pages/Schedules* / Restrictions*`, `modules/catalog/`.

---

## 5. Reglas de negocio que conviene mencionar

- **Costo/duración**: costo = servicio + adicionales; duración = solo el
  servicio (adicionales no la cambian). → `appointmentUtils.ts`.
- **Disponibilidad**: se considera el intervalo completo inicio→fin; un
  **traslape** es cualquier coincidencia; **canceladas no bloquean**,
  pendientes/confirmadas/en proceso sí. → `availability.ts`.
- **Desactivación bloqueada**: empleados y servicios con citas
  **pendientes/confirmadas** no pueden desactivarse. Lo calculamos en el
  FrontEnd contando solo las citas cuyo estado tiene `bloqueaDisponibilidad`
  (flag del API) y mostramos el motivo en un diálogo, sin depender solo del
  rechazo del backend. → `EmployeeDetailPage.tsx`, `ServiceDetailPage.tsx`.
- **Estados por color**: Pendiente amarillo, Confirmada azul, Finalizada verde,
  Cancelada rojo. → `components/ui/status-badge.tsx`.

---

## 6. Diseño (por si preguntan por Tailwind/shadcn)

- Los componentes son de **shadcn/ui** (Button, Input, Select, Table, Dialog,
  Card, Badge, Checkbox…). Se ven con el tema propio gracias a un **puente de
  tokens** en `tailwind.css`: los nombres de shadcn (`--primary`, `--card`,
  `--border`…) apuntan a nuestras variables de tema (`index.css`).
- Datos numéricos (horas, precios, códigos) en **monoespaciada tabular** para el
  aire de "instrumento de precisión".
- Responsive y con estados de foco/selección/scroll tematizados.

---

## 7. Datos iniciales

`scripts/seed.mjs` carga los datos mínimos del enunciado **llamando al API**
(no toca el backend): empleados, servicios, ≥8 adicionales, horarios,
restricciones y citas en todos los estados. Ver `docs/DATOS_INICIALES.md`.

---

## 8. Preguntas frecuentes del docente (respuestas rápidas)

- **¿Dónde consumen el API?** En `services/api.ts`, único punto de acceso.
- **¿Cómo protegen las rutas?** `ProtectedRoute` (sesión) y `RoleRoute` (rol),
  más el menú que oculta opciones.
- **¿Cómo calculan la hora fin?** `inicio + duración del servicio`
  (`appointmentUtils.addMinutes`).
- **¿Qué pasa si hay traslape?** `validateAppointment` lo detecta y bloquea el
  guardado con un mensaje; el API también lo valida.
- **¿Usan Context?** Sí, para autenticación (`AuthContext`).
- **¿shadcn es de verdad?** Sí, componentes en `components/ui/`; el look propio
  viene del puente de tokens en `tailwind.css`.
