# Arquitectura del FrontEnd — MediInfo (Gestión de Citas)

Documento técnico de referencia. Explica **cómo está construido** el FrontEnd,
qué decisiones se tomaron y dónde está cada cosa. El Backend/API es externo y
no se modifica: la app solo lo **consume**.

---

## 1. Stack

| Capa | Tecnología |
|---|---|
| Framework | **React 19** + **TypeScript** |
| Build / dev | **Vite** |
| Ruteo | **React Router 7** |
| Estilos | **Tailwind CSS v4** (`@tailwindcss/vite`) |
| Componentes | **shadcn/ui** (sobre Radix UI) |
| Iconos | lucide-react |
| Estado global | **Context API** (autenticación) |
| Datos | **API REST externo** (sin datos locales simulados) |

Fuentes: **Saira** / **Saira SemiCondensed** (interfaz y títulos) y
**JetBrains Mono** (datos: horas, precios, fechas, códigos).

---

## 2. Estructura de carpetas

```
frontend/
├── components.json            # Config de shadcn/ui
├── vite.config.ts             # Plugins + alias "@/" -> src/
├── src/
│   ├── main.tsx               # Punto de entrada (monta <App/>)
│   ├── App.tsx                # Define TODAS las rutas (React Router)
│   ├── tailwind.css           # Tailwind + PUENTE DE TOKENS shadcn↔tema
│   ├── index.css              # Tema "negro industrial": variables y layout
│   ├── services/
│   │   └── api.ts             # Capa de servicios: único acceso al API
│   ├── context/
│   │   ├── AuthContext.tsx    # Provider de autenticación (login/logout)
│   │   ├── auth-context.ts    # createContext + tipos (Role, AuthUser)
│   │   └── useAuth.ts         # Hook para consumir el contexto
│   ├── components/
│   │   ├── auth/              # ProtectedRoute, RoleRoute (guards)
│   │   ├── layout/AppLayout   # Sidebar + topbar + <Outlet/>
│   │   └── ui/                # Componentes shadcn (button, input, table,
│   │                          #   select, dialog, card, badge, checkbox…)
│   │                          #   + status-badge (etiqueta de estado propia)
│   ├── modules/
│   │   ├── appointments/      # Proceso principal (citas)
│   │   │   ├── AppointmentForm.tsx     # Crear/editar cita
│   │   │   ├── appointmentUtils.ts     # Cálculo de costo/duración
│   │   │   └── availability.ts         # Reglas de disponibilidad/agenda
│   │   ├── agenda/            # Agenda diaria del establecimiento
│   │   └── catalog/           # CatalogPage (listado genérico reutilizable),
│   │                          #   AdditionalForm, ReadOnlyDetailPage
│   ├── pages/                 # Una página por pantalla del enunciado
│   └── lib/                   # utils (cn), date (formatos)
├── scripts/seed.mjs           # Datos iniciales (llama al API público)
└── docs/                      # Esta doc + guía de defensa
```

**Organización modular**: cada dominio (citas, agenda, catálogos) vive en su
carpeta; las pantallas (`pages/`) componen módulos y componentes reutilizables.

---

## 3. Consumo del API (capa de servicios)

Archivo: `src/services/api.ts`. **Es el único punto que habla con el backend.**

- `apiRequest()` adjunta el **token JWT** (de `sessionStorage`), usa JSON o
  `FormData` (subida de imágenes) y traduce los **errores de validación** del
  backend a un mensaje legible.
- Fachada por verbo HTTP: `api.list` (GET colección), `api.get` (GET registro,
  desempaca el sobre `{ data }`), `api.create` (POST), `api.update` (PUT),
  `api.patch` (PATCH, para cambios de estado).
- Estados manejados en las páginas: **carga** (spinner), **error** (mensaje) y
  **vacío** (empty state).

---

## 4. Autenticación y permisos por rol

- **Context** (`AuthContext`): guarda usuario + token en `sessionStorage`,
  expone `login()`/`logout()`. Al iniciar sesión consulta `/usuarios/perfil`
  para conocer el **rol real** (Administrador / Empleado / Cliente).
- **`ProtectedRoute`**: exige sesión; sin ella redirige a `/login`.
- **`RoleRoute`**: exige un rol concreto; bloquea el acceso **por navegación
  directa** (p. ej. `/empleados`, `/agenda` son solo de Administrador).
- **`AppLayout`**: el menú lateral **oculta** las opciones no permitidas según
  el rol. Así, la matriz de permisos del enunciado se aplica en dos niveles:
  el menú (lo que se ve) y las rutas (lo que se puede abrir).

---

## 5. Proceso principal: gestión de citas

`modules/appointments/` concentra la lógica de mayor peso:

- **`appointmentUtils.calculateAppointment`** — cálculo automático:
  `costo = servicio + adicionales`; `duración = solo el servicio` (los
  adicionales **no** cambian la duración); `hora fin = inicio + duración`.
- **`availability.ts`** — reglas de disponibilidad:
  - `buildDaySegments()` arma la **agenda del empleado** (Disponible / Cita
    asignada / Restricción) en orden cronológico.
  - `validateAppointment()` valida **antes de guardar**: fecha no pasada, día
    activo, dentro del horario, restricciones generales y del empleado, y
    **traslapes** (las citas canceladas no bloquean).
- **`AppointmentForm`** integra todo: cliente, servicio, adicionales, empleado
  (filtrado por servicio asignado), fecha/hora, agenda visible, validación
  local **y** consulta a `/citas/disponibilidad` en el API. Solo permite
  guardar cuando todo es válido. En el detalle, las acciones dependen de los
  **flags del estado** que da el API (`permiteEdicion`,
  `permiteCancelacionCliente`).

---

## 6. Diseño: tema "negro industrial" + puente de tokens

El punto técnico más importante de la capa visual:

- `index.css` define el **tema** con variables CSS: superficies grafito, acento
  ámbar (`--brand`), colores de estado (verde/azul/ámbar/rojo), tipografías.
- `tailwind.css` contiene el **puente de tokens**: mapea los nombres que espera
  shadcn (`--primary`, `--card`, `--border`, `--ring`, `--muted`…) a las
  variables del tema. Resultado: **los componentes de shadcn se renderizan con
  el look negro industrial sin tocarlos**, y hay utilidades de Tailwind para
  marca y estado (`bg-brand`, `text-ok`, `bg-danger-bg`…).
- Etiquetas de estado: `components/ui/status-badge.tsx` traduce el estado del
  API a color según el enunciado (Pendiente amarillo, Confirmada azul,
  Finalizada verde, Cancelada rojo).

---

## 7. Componentes reutilizables (shadcn/ui)

Usados en toda la app: **Button, Input, Label, Textarea, Select, Checkbox,
Table, Card, Dialog, Badge** + `StatusBadge` propio. Además, componentes de
dominio reutilizables: `CatalogPage` (alimenta ~7 listados: roles,
especialidades, estados, empleados, horarios, restricciones, adicionales),
`AppLayout`, `ReadOnlyDetailPage`, `AgendaGrid`.

---

## 8. Datos iniciales

`scripts/seed.mjs` inserta los datos mínimos del enunciado **llamando al API
público** (no modifica el backend ni la base de datos): empleados, servicios,
adicionales, horarios, restricciones y citas de ejemplo en todos los estados.

---

## 9. Cómo correr

```bash
cd frontend
npm install
npm run dev        # servidor de desarrollo (Vite)
npm run build      # tsc + build de producción
```

Variable de entorno: `VITE_API_URL` (URL del API; por defecto
`http://127.0.0.1:3000`). El API debe estar corriendo.
