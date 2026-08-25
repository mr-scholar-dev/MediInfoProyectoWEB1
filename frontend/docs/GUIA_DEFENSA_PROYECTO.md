# Guía rápida para defender el proyecto

Este documento sirve como apoyo para explicar el proyecto antes de la presentación.

## 1. Qué es el proyecto

Es una aplicación web para gestión de citas médicas hecha en React.

La interfaz consume un API ya existente para manejar:

- usuarios
- servicios
- servicios adicionales
- empleados
- horarios
- restricciones
- citas
- agenda diaria

## 2. Idea general de la arquitectura

La arquitectura está separada en dos partes:

- Frontend: la interfaz hecha con React
- Backend: API ya provista por el proyecto original

El frontend no inventa datos locales para trabajar.
Todo se consulta desde el API.

## 3. Qué hace el frontend

El frontend se encarga de:

- iniciar sesión
- registrar clientes
- mostrar el perfil del usuario
- listar y administrar servicios
- listar y administrar servicios adicionales
- listar y administrar empleados
- consultar horarios
- consultar restricciones
- crear, editar, cancelar y cambiar el estado de citas
- mostrar la agenda diaria

## 4. Qué se puede mostrar en la defensa

### Login

Podés explicar que:

- el usuario inicia sesión con el API
- el sistema guarda el token
- según el rol, la interfaz muestra solo lo permitido

### Servicios

Podés explicar que:

- se listan servicios activos e inactivos
- se puede ver el detalle
- se puede crear y editar
- cada servicio tiene imagen representativa
- la imagen se puede reemplazar en edición

### Servicios adicionales

Podés explicar que:

- se administran extras que aumentan el costo de una cita
- no cambian la duración
- se pueden activar o desactivar

### Empleados

Podés explicar que:

- cada empleado está asociado a un usuario
- cada empleado tiene una especialidad
- se le asignan servicios desde el mismo formulario
- se puede revisar su detalle y agenda

### Citas

Podés explicar que:

- la cita necesita cliente, empleado y servicio
- se calcula duración y costo total
- el sistema consulta disponibilidad antes de guardar
- se respetan horarios, restricciones y traslapes
- se puede cambiar estado o cancelar

### Agenda diaria

Podés explicar que:

- muestra horarios disponibles
- muestra horarios ocupados
- muestra restricciones
- permite ver la distribución por empleado y por fecha

## 5. Qué datos iniciales se cargaron

Se cargaron datos de demostración para cumplir la rúbrica:

- 1 administrador inicial
- 2 clientes
- 3 empleados
- 4 especialidades
- 9 servicios
- 8 servicios adicionales
- 7 horarios de atención
- 8 restricciones
- 13 citas

Distribución de citas:

- 4 pendientes
- 4 confirmadas
- 3 finalizadas
- 2 canceladas

## 6. Qué decir sobre el backend

Podés decir algo como:

> El backend no lo desarrollamos nosotros. Fue entregado como API del proyecto. Nosotros solo consumimos sus endpoints desde React y no cambiamos su lógica principal.

Si te preguntan por el seed:

> El seed se usó solo para cargar datos de prueba y poder demostrar los módulos con información real durante la defensa.

## 7. Puntos técnicos importantes

### Manejo del API

- se usa `fetch` encapsulado en un servicio
- se centralizan errores
- se manejan respuestas vacías
- se usan mensajes claros al usuario

### Rutas protegidas

- hay rutas privadas
- hay rutas por rol
- si un rol no tiene permiso, no ve la opción ni puede entrar directo por URL

### Validaciones

Se validan cosas como:

- campos obligatorios
- formatos de datos
- fechas válidas
- horario disponible
- servicios activos
- empleados activos
- restricciones y traslapes

## 8. Rúbrica: qué ya está cubierto

Ya está bastante cubierto:

- autenticación
- registro de clientes
- perfil
- catálogos de solo lectura
- servicios
- servicios adicionales
- empleados
- horarios
- restricciones
- citas
- adicionales de la cita
- agenda diaria
- validaciones visibles
- navegación y 404

## 9. Qué podrías mencionar como mejoras futuras

Si te preguntan qué mejorarías, podés decir:

- más pruebas automáticas
- mejor manejo visual de algunos estados
- más refinamiento en la agenda
- más feedback visual en formularios

## 10. Guion corto para hablar

Podés resumir el proyecto así:

> Desarrollamos el frontend de un sistema de gestión de citas. La app consume un API ya existente, respeta roles, valida disponibilidad de horarios, administra servicios y empleados, y permite gestionar citas con reglas de negocio reales como restricciones, traslapes y estados.

## 11. Comandos útiles

Frontend:

```bash
cd /Users/isaacsaidserrano/Desktop/webMiniProyecto/frontend
npm run dev
```

Backend:

```bash
cd /Users/isaacsaidserrano/Desktop/api-citas/api
npm run server
```

Seed de demo:

```bash
cd /Users/isaacsaidserrano/Desktop/api-citas/api
npm run seed:demo
```

