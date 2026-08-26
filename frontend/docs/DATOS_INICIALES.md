# Datos iniciales (seed)

Script para cargar datos de prueba en el API de **Gestión de Citas** ([api-citas](https://github.com/npaniagua26/api-citas)) usando exactamente los mismos endpoints y payloads que consume el frontend.

## Requisitos

1. **Node 18 o superior** (usa `fetch`, `FormData` y `Blob` nativos; no requiere dependencias).
2. El **API corriendo** (por defecto en `http://127.0.0.1:3000`).
3. El **seeder de Prisma del API ya ejecutado** (`npx prisma db seed` en el repo del API). Ese seeder crea los catálogos base que este script necesita:
   - Roles: Administrador, Empleado, Cliente
   - Estados de cita: Pendiente, Confirmada, En proceso, Finalizada, Cancelada
   - Días de la semana y tipos de restricción de horario
   - Especialidad "General"
   - Usuario administrador: `admin@citas.com` / `Admin12345`

## Cómo ejecutarlo

Desde la carpeta `frontend`:

```bash
node scripts/seed.mjs
```

Con otra URL del API:

```bash
SEED_API_URL=http://localhost:3000 node scripts/seed.mjs
```

El script inicia sesión como `admin@citas.com`, usa el token Bearer en todas las llamadas, registra el progreso en español, continúa ante errores puntuales (los marca con ⚠) e imprime un resumen final. Es **idempotente**: antes de crear cada registro consulta el listado correspondiente y omite lo que ya existe (por nombre, correo o código), y no crea citas nuevas si ya hay 13 o más.

## Qué crea

| Recurso | Cantidad | Detalle |
|---|---|---|
| Clientes | 2 | Vía `POST /usuarios/registro` (María Rojas, Carlos Jiménez — clave `Cliente123`) |
| Usuarios de empleados | 3 | Registro público + `PUT /usuarios/:id` para asignarles el rol Empleado (Laura Mora, Diego Castro, Ana Salas — clave `Empleado123`) |
| Servicios | 6 | Cada uno con una imagen PNG mínima subida a `POST /images/upload` (si la subida falla, se crea sin imagen) |
| Servicios adicionales | 8 | `POST /servicios-adicionales` |
| Empleados | 3 | Códigos `EMP-001`…`EMP-003`, cada uno con 3–4 servicios asignados |
| Horarios de atención | 5 | Lunes a viernes 08:00–17:00 vía `POST /horarios-atencion` (se omiten los días que ya tengan horario) |
| Restricciones | 5 | 2 generales (una parcial 12:00–13:00 y una de día completo) y 3 específicas de empleado (2 parciales por horas y 1 de día completo). Cubren las 4 categorías: general, específica, parcial por horas y día completo |
| Citas | 13 | 4 Pendiente, 4 Confirmada, 3 Finalizada y 2 Cancelada, repartidas entre los 3 empleados, en días hábiles futuros dentro del horario de atención, sin traslapes y evitando las fechas con restricciones. Se crean como Pendiente (`POST /citas`) y luego se mueven con `PATCH /citas/:id/estado` o `PATCH /citas/:id/cancelar` |

Total de usuarios resultante: 1 administrador (del seeder del API) + 3 usuarios de empleado + 2 clientes.

## Limitaciones conocidas

- **Especialidades**: el API expone `/especialidades` solo en modo lectura (no existe `POST /especialidades`). El script lo detecta y avisa. Si querés las 3 especialidades extra (Odontología, Dermatología, Fisioterapia) además de la "General" del seeder, agregalas al seeder de Prisma del API o insertalas por SQL antes de ejecutar este script:

  ```sql
  INSERT INTO especialidad (nombre, descripcion, activo) VALUES
    ('Odontología',  'Servicios de salud dental.',            true),
    ('Dermatología', 'Cuidado de la piel, cabello y uñas.',   true),
    ('Fisioterapia', 'Rehabilitación física y terapias.',     true);
  ```

  (Ajustá el nombre de la tabla/columnas al esquema real de Prisma si difiere.)

  Si las especialidades no existen, los servicios se crean igualmente usando la especialidad "General".

- **Orden de ejecución**: si las especialidades extra se insertan después de haber corrido el seed, los servicios ya creados quedarán asociados a "General"; borralos o editálos desde el frontend si querés reasignarlos.

- **Reruns y citas**: la comprobación de idempotencia de citas es por cantidad total (≥13); si borrás algunas y volvés a correr el script, puede crear el lote completo de nuevo.
