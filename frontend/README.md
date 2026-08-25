# MediInfo - Frontend de gestión de citas

Frontend React para el proyecto de gestión de citas. Consume el API existente y mantiene la lógica de presentación separada de la integración HTTP.

## Ejecución

```bash
npm install
npm run dev
```

El API se configura con `VITE_API_URL`. Por defecto se usa `http://localhost:3000`.

## Arquitectura

```text
src/
  components/   Componentes reutilizables y guards de autenticación
  context/      Estado global de sesión
  lib/          Utilidades pequeñas, como composición de clases
  modules/      Componentes y reglas agrupadas por dominio
  pages/        Pantallas asociadas a rutas
  services/     Cliente HTTP y acceso al API
```

## Mapa de la rúbrica

| Requisito | Implementación |
| --- | --- |
| Usuarios | Login, registro de clientes y perfil |
| Roles | `RoleRoute` y navegación por permisos |
| Servicios | Listado, búsqueda, detalle, alta, edición, activación y carga/preview de imagen |
| Adicionales | Listado, búsqueda, detalle, alta, edición y activación |
| Empleados | Listado, búsqueda, detalle, alta, edición, asignación de servicios y activación |
| Horarios | Listado y detalle de consulta |
| Restricciones | Listado y detalle; se reflejan en la agenda y disponibilidad |
| Citas | Listado por rol, búsqueda, creación, detalle, edición, estados y cancelación |
| Disponibilidad | Consulta real del API más utilidades de traslape en `modules/appointments/availability.ts` |
| Agenda diaria | Endpoint `/citas/agenda-diaria`, citas y restricciones reales en `modules/agenda/AgendaGrid.tsx` |
| React Router | Rutas protegidas y página 404 |
| Tailwind / UI | Tailwind v4 y componentes UI reutilizables |

## Verificación

```bash
npm run build
npm run lint
```

## Organización por módulos

- `services/api.ts`: cliente HTTP, sesión, `FormData` y errores normalizados.
- `context/`: sesión global y permisos por rol.
- `modules/catalog/`: tablas, búsqueda y detalles reutilizables.
- `modules/appointments/`: cálculo y validación de disponibilidad.
- `modules/agenda/`: representación de agenda y restricciones.
- `pages/`: composición de pantallas y navegación.
