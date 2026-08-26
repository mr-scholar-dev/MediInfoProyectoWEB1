#!/usr/bin/env node
/**
 * Seed de datos iniciales para el proyecto "Gestión de Citas".
 *
 * Uso:  node scripts/seed.mjs
 * Requiere: Node 18+, el API (https://github.com/npaniagua26/api-citas)
 * corriendo con su seeder de Prisma ya ejecutado (roles, estados de cita,
 * días de semana, tipos de restricción, especialidad "General" y el usuario
 * admin@citas.com / Admin12345).
 *
 * La URL del API se toma de SEED_API_URL (por defecto http://127.0.0.1:3000).
 */

const API_URL = process.env.SEED_API_URL || 'http://127.0.0.1:3000'
const ADMIN = { correo: 'admin@citas.com', password: 'Admin12345' }

let token = null
const summary = { creados: [], omitidos: [], errores: [] }

function log(message) { console.log(message) }
function ok(message) { console.log(`  ✔ ${message}`); summary.creados.push(message) }
function skip(message) { console.log(`  ↷ ${message} (ya existe, se omite)`); summary.omitidos.push(message) }
function warn(message) { console.warn(`  ⚠ ${message}`); summary.errores.push(message) }

function unwrap(value) { return value && typeof value === 'object' && 'data' in value ? value.data : value }

async function request(path, options = {}) {
  const isForm = options.body instanceof FormData
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(isForm ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  })
  const body = response.status === 204 ? '' : await response.text()
  if (!response.ok) {
    let message = body || `La solicitud falló (${response.status}).`
    try {
      const parsed = JSON.parse(body)
      message = parsed.validationErrors?.map(e => e.message).join(' ') || parsed.message || message
    } catch { /* respuesta no JSON */ }
    throw new Error(`${options.method || 'GET'} ${path} → ${message}`)
  }
  return body ? JSON.parse(body) : undefined
}

const api = {
  list: async path => unwrap(await request(path)) || [],
  get: async path => unwrap(await request(path)),
  create: async (path, body) => unwrap(await request(path, { method: 'POST', body: body instanceof FormData ? body : JSON.stringify(body) })),
  patch: async (path, body) => unwrap(await request(path, { method: 'PATCH', body: JSON.stringify(body) })),
  update: async (path, body) => unwrap(await request(path, { method: 'PUT', body: JSON.stringify(body) })),
}

// PNG mínimo válido de 1x1 píxel (para /images/upload, que exige jpg/png/webp).
const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
)

function addDays(base, days) { const d = new Date(base); d.setDate(d.getDate() + days); return d }
function toISODate(d) { return d.toISOString().slice(0, 10) }
function addMinutes(hhmm, minutes) {
  const [h, m] = hhmm.split(':').map(Number)
  const total = h * 60 + m + minutes
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}
// Días hábiles (lunes a viernes) futuros, excluyendo fechas restringidas.
function* businessDays(startOffset, excluded) {
  let d = addDays(new Date(), startOffset)
  while (true) {
    const day = d.getDay()
    const iso = toISODate(d)
    if (day !== 0 && day !== 6 && !excluded.has(iso)) yield iso
    d = addDays(d, 1)
  }
}

async function login() {
  log(`\n== Autenticación (${API_URL}) ==`)
  const data = unwrap(await request('/usuarios/login', { method: 'POST', body: JSON.stringify(ADMIN) }))
  token = data.token
  const perfil = unwrap(await request('/usuarios/perfil'))
  ok(`Sesión iniciada como ${perfil.correo} (id ${perfil.id})`)
  return perfil
}

async function checkEspecialidades() {
  log('\n== Especialidades ==')
  const existentes = await api.list('/especialidades')
  const deseadas = ['Odontología', 'Dermatología', 'Fisioterapia']
  const faltantes = deseadas.filter(n => !existentes.some(e => e.nombre === n))
  if (!faltantes.length) { existentes.forEach(e => skip(`Especialidad "${e.nombre}"`)); return existentes }
  warn(`El API no expone POST /especialidades (catálogo de solo lectura). Faltan: ${faltantes.join(', ')}. Insertalas en la base o en el seeder del API (ver docs/DATOS_INICIALES.md).`)
  return existentes
}

async function registrarUsuario(usuario, usuariosExistentes) {
  const existente = usuariosExistentes.find(u => u.correo === usuario.correo)
  if (existente) { skip(`Usuario ${usuario.correo}`); return existente }
  await api.create('/usuarios/registro', {
    nombre: usuario.nombre,
    primerApellido: usuario.primerApellido,
    segundoApellido: usuario.segundoApellido ?? null,
    correo: usuario.correo,
    telefono: usuario.telefono ?? null,
    password: usuario.password,
  })
  ok(`Usuario ${usuario.correo}`)
  const actualizados = await api.list('/usuarios')
  return actualizados.find(u => u.correo === usuario.correo)
}

async function seedUsuarios(roles) {
  log('\n== Usuarios (clientes y usuarios de empleados) ==')
  const usuarios = await api.list('/usuarios')
  const rolEmpleado = roles.find(r => r.nombre === 'Empleado')

  const clientes = []
  for (const cliente of [
    { nombre: 'María', primerApellido: 'Rojas', segundoApellido: 'Vargas', correo: 'maria.rojas@correo.com', telefono: '8888-1111', password: 'Cliente123' },
    { nombre: 'Carlos', primerApellido: 'Jiménez', segundoApellido: null, correo: 'carlos.jimenez@correo.com', telefono: '8888-2222', password: 'Cliente123' },
  ]) {
    try { const creado = await registrarUsuario(cliente, usuarios); if (creado) clientes.push(creado) }
    catch (e) { warn(`Cliente ${cliente.correo}: ${e.message}`) }
  }

  const empleadosUsuarios = []
  for (const empleado of [
    { nombre: 'Laura', primerApellido: 'Mora', segundoApellido: 'Solís', correo: 'laura.mora@citas.com', telefono: '8888-3333', password: 'Empleado123' },
    { nombre: 'Diego', primerApellido: 'Castro', segundoApellido: null, correo: 'diego.castro@citas.com', telefono: '8888-4444', password: 'Empleado123' },
    { nombre: 'Ana', primerApellido: 'Salas', segundoApellido: 'Brenes', correo: 'ana.salas@citas.com', telefono: '8888-5555', password: 'Empleado123' },
  ]) {
    try {
      const usuario = await registrarUsuario(empleado, usuarios)
      if (!usuario) continue
      // El registro público siempre crea rol Cliente; se cambia a Empleado con PUT /usuarios/:id.
      if (usuario.rol?.nombre !== 'Empleado' && usuario.rolId !== rolEmpleado?.id) {
        await api.update(`/usuarios/${usuario.id}`, {
          nombre: usuario.nombre,
          primerApellido: usuario.primerApellido,
          segundoApellido: usuario.segundoApellido ?? null,
          correo: usuario.correo,
          telefono: usuario.telefono ?? null,
          rolId: rolEmpleado.id,
        })
        ok(`Rol Empleado asignado a ${usuario.correo}`)
      }
      empleadosUsuarios.push(usuario)
    } catch (e) { warn(`Usuario de empleado ${empleado.correo}: ${e.message}`) }
  }
  return { clientes, empleadosUsuarios }
}

async function subirImagen(nombre) {
  const form = new FormData()
  form.append('image', new Blob([TINY_PNG], { type: 'image/png' }), `${nombre}.png`)
  const upload = unwrap(await request('/images/upload', { method: 'POST', body: form }))
  return upload.fileName
}

async function seedServicios(especialidades) {
  log('\n== Servicios ==')
  const existentes = await api.list('/servicios')
  const especialidadPorNombre = nombre => especialidades.find(e => e.nombre === nombre) || especialidades.find(e => e.nombre === 'General') || especialidades[0]
  const definiciones = [
    { nombre: 'Consulta general', descripcion: 'Consulta médica general de valoración inicial.', precioBase: 15000, duracionMinutos: 30, especialidad: 'General' },
    { nombre: 'Limpieza dental', descripcion: 'Limpieza dental profunda con ultrasonido y pulido.', precioBase: 25000, duracionMinutos: 45, especialidad: 'Odontología' },
    { nombre: 'Blanqueamiento dental', descripcion: 'Blanqueamiento dental profesional en consultorio.', precioBase: 60000, duracionMinutos: 60, especialidad: 'Odontología' },
    { nombre: 'Consulta dermatológica', descripcion: 'Valoración de piel, cabello y uñas por especialista.', precioBase: 30000, duracionMinutos: 30, especialidad: 'Dermatología' },
    { nombre: 'Terapia física', descripcion: 'Sesión de fisioterapia para rehabilitación muscular.', precioBase: 20000, duracionMinutos: 60, especialidad: 'Fisioterapia' },
    { nombre: 'Masaje terapéutico', descripcion: 'Masaje descontracturante de espalda y cuello.', precioBase: 18000, duracionMinutos: 45, especialidad: 'Fisioterapia' },
  ]
  const servicios = []
  for (const def of definiciones) {
    const existente = existentes.find(s => s.nombre === def.nombre)
    if (existente) { skip(`Servicio "${def.nombre}"`); servicios.push(existente); continue }
    try {
      let imagen = null
      try { imagen = await subirImagen(def.nombre.toLowerCase().replace(/[^a-z0-9]+/g, '-')) }
      catch (e) { warn(`Imagen para "${def.nombre}": ${e.message} (se crea sin imagen)`) }
      const creado = await api.create('/servicios', {
        nombre: def.nombre,
        descripcion: def.descripcion,
        precioBase: def.precioBase,
        duracionMinutos: def.duracionMinutos,
        especialidadId: especialidadPorNombre(def.especialidad).id,
        imagen,
      })
      ok(`Servicio "${def.nombre}"`)
      servicios.push(creado)
    } catch (e) { warn(`Servicio "${def.nombre}": ${e.message}`) }
  }
  return servicios
}

async function seedAdicionales() {
  log('\n== Servicios adicionales ==')
  const existentes = await api.list('/servicios-adicionales')
  const definiciones = [
    { nombre: 'Aplicación de flúor', descripcion: 'Aplicación tópica de flúor posterior a la limpieza.', precio: 5000 },
    { nombre: 'Radiografía', descripcion: 'Radiografía diagnóstica simple de la zona tratada.', precio: 8000 },
    { nombre: 'Kit de cuidado en casa', descripcion: 'Kit con productos recomendados para el hogar.', precio: 12000 },
    { nombre: 'Vendaje deportivo', descripcion: 'Vendaje funcional posterior a la terapia.', precio: 4000 },
    { nombre: 'Crema dermatológica', descripcion: 'Crema medicada aplicada durante la consulta.', precio: 6500 },
    { nombre: 'Electroterapia', descripcion: 'Sesión corta de electroestimulación complementaria.', precio: 7000 },
    { nombre: 'Mascarilla facial', descripcion: 'Mascarilla hidratante posterior al tratamiento.', precio: 5500 },
    { nombre: 'Control de seguimiento', descripcion: 'Cita corta de control incluida como adicional.', precio: 9000 },
  ]
  const adicionales = []
  for (const def of definiciones) {
    const existente = existentes.find(a => a.nombre === def.nombre)
    if (existente) { skip(`Adicional "${def.nombre}"`); adicionales.push(existente); continue }
    try { adicionales.push(await api.create('/servicios-adicionales', def)); ok(`Adicional "${def.nombre}"`) }
    catch (e) { warn(`Adicional "${def.nombre}": ${e.message}`) }
  }
  return adicionales
}

async function seedEmpleados(empleadosUsuarios, servicios, especialidades) {
  log('\n== Empleados ==')
  const existentes = await api.list('/empleados')
  const general = especialidades.find(e => e.nombre === 'General') || especialidades[0]
  const porNombre = nombre => especialidades.find(e => e.nombre === nombre) || general
  const servicioIds = nombres => nombres.map(n => servicios.find(s => s.nombre === n)?.id).filter(Boolean)
  const definiciones = [
    { codigo: 'EMP-001', correo: 'laura.mora@citas.com', especialidad: 'Odontología', descripcion: 'Odontóloga con 8 años de experiencia.', servicios: ['Consulta general', 'Limpieza dental', 'Blanqueamiento dental'] },
    { codigo: 'EMP-002', correo: 'diego.castro@citas.com', especialidad: 'Fisioterapia', descripcion: 'Fisioterapeuta especializado en rehabilitación.', servicios: ['Consulta general', 'Terapia física', 'Masaje terapéutico', 'Consulta dermatológica'] },
    { codigo: 'EMP-003', correo: 'ana.salas@citas.com', especialidad: 'Dermatología', descripcion: 'Dermatóloga clínica y estética.', servicios: ['Consulta general', 'Consulta dermatológica', 'Masaje terapéutico'] },
  ]
  const empleados = []
  for (const def of definiciones) {
    const existente = existentes.find(e => (e.codigo || e.codigoEmpleado) === def.codigo)
    if (existente) { skip(`Empleado ${def.codigo}`); empleados.push(existente); continue }
    const usuario = empleadosUsuarios.find(u => u.correo === def.correo)
    if (!usuario) { warn(`Empleado ${def.codigo}: no se encontró el usuario ${def.correo}`); continue }
    const ids = servicioIds(def.servicios)
    if (!ids.length) { warn(`Empleado ${def.codigo}: no hay servicios disponibles para asignar`); continue }
    try {
      const creado = await api.create('/empleados', {
        usuarioId: usuario.id,
        especialidadId: porNombre(def.especialidad).id,
        codigoEmpleado: def.codigo,
        descripcion: def.descripcion,
        servicioIds: ids,
      })
      ok(`Empleado ${def.codigo} (${def.correo}) con ${ids.length} servicios`)
      empleados.push(creado)
    } catch (e) { warn(`Empleado ${def.codigo}: ${e.message}`) }
  }
  return empleados
}

async function seedHorarios(diasSemana) {
  log('\n== Horarios de atención ==')
  const existentes = await api.list('/horarios-atencion')
  for (const nombreDia of ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']) {
    const dia = diasSemana.find(d => d.nombre === nombreDia)
    if (!dia) { warn(`No existe el día "${nombreDia}" en el catálogo`); continue }
    if (existentes.some(h => h.diaSemanaId === dia.id || h.diaSemana?.id === dia.id)) { skip(`Horario de ${nombreDia}`); continue }
    try {
      await api.create('/horarios-atencion', { diaSemanaId: dia.id, horaInicio: '08:00', horaFin: '17:00' })
      ok(`Horario ${nombreDia} 08:00-17:00`)
    } catch (e) { warn(`Horario ${nombreDia}: ${e.message}`) }
  }
}

async function seedRestricciones(tipos, empleados, fechas) {
  log('\n== Restricciones de horario ==')
  const existentes = await api.list('/restricciones-horario')
  const tipoId = nombre => tipos.find(t => t.nombre === nombre)?.id
  const [emp1, emp2, emp3] = empleados
  const definiciones = [
    // 2 generales (una de ellas también parcial por horas y otra de día completo)
    { tipo: 'General del establecimiento', empleadoId: null, fecha: fechas.restriccionParcial, horaInicio: '12:00', horaFin: '13:00', todoElDia: false, motivo: 'Reunión general del personal' },
    { tipo: 'Día completo', empleadoId: null, fecha: fechas.restriccionDiaCompleto, horaInicio: null, horaFin: null, todoElDia: true, motivo: 'Feriado interno del establecimiento' },
    // 3 específicas de empleado (dos parciales por horas y una de día completo)
    { tipo: 'Específica de empleado', empleadoId: emp1?.id, fecha: fechas.restriccionParcial, horaInicio: '15:00', horaFin: '17:00', todoElDia: false, motivo: 'Capacitación externa del empleado' },
    { tipo: 'Específica de empleado', empleadoId: emp2?.id, fecha: fechas.restriccionEmpleado, horaInicio: '08:00', horaFin: '10:00', todoElDia: false, motivo: 'Cita médica personal del empleado' },
    { tipo: 'Específica de empleado', empleadoId: emp3?.id, fecha: fechas.restriccionEmpleado, horaInicio: null, horaFin: null, todoElDia: true, motivo: 'Día libre autorizado del empleado' },
  ]
  for (const def of definiciones) {
    if (def.empleadoId === undefined) { warn(`Restricción "${def.motivo}": empleado no disponible`); continue }
    const id = tipoId(def.tipo)
    if (!id) { warn(`Restricción "${def.motivo}": no existe el tipo "${def.tipo}"`); continue }
    if (existentes.some(r => r.motivo === def.motivo && String(r.fecha).slice(0, 10) === def.fecha)) { skip(`Restricción "${def.motivo}"`); continue }
    try {
      await api.create('/restricciones-horario', {
        tipoRestriccionId: id,
        empleadoId: def.empleadoId,
        fecha: def.fecha,
        horaInicio: def.horaInicio,
        horaFin: def.horaFin,
        todoElDia: def.todoElDia,
        motivo: def.motivo,
      })
      ok(`Restricción "${def.motivo}" (${def.fecha})`)
    } catch (e) { warn(`Restricción "${def.motivo}": ${e.message}`) }
  }
}

async function seedCitas(estados, empleados, clientes, servicios, adicionales, adminId, fechasRestringidas) {
  log('\n== Citas ==')
  const estadoId = nombre => estados.find(e => e.nombre === nombre)?.id
  const existentes = await api.list('/citas')
  if (existentes.length >= 13) { skip(`Ya existen ${existentes.length} citas; no se crean más`); return }
  if (!empleados.length || !clientes.length || !servicios.length) { warn('Faltan empleados, clientes o servicios; no se pueden crear citas'); return }

  // Servicios asignados a cada empleado (consultando el detalle para reruns).
  const serviciosPorEmpleado = new Map()
  for (const empleado of empleados) {
    try {
      const detalle = await api.get(`/empleados/${empleado.id}`)
      const asignados = (detalle.servicios || []).map(s => servicios.find(x => x.id === s.id)).filter(Boolean)
      serviciosPorEmpleado.set(empleado.id, asignados.length ? asignados : servicios)
    } catch { serviciosPorEmpleado.set(empleado.id, servicios) }
  }

  // 13 citas: 4 Pendiente, 4 Confirmada, 3 Finalizada, 2 Cancelada.
  const estadosFinales = ['Pendiente', 'Pendiente', 'Pendiente', 'Pendiente', 'Confirmada', 'Confirmada', 'Confirmada', 'Confirmada', 'Finalizada', 'Finalizada', 'Finalizada', 'Cancelada', 'Cancelada']
  const horas = ['08:30', '10:00', '11:30', '14:00']
  const generadorFechas = businessDays(2, fechasRestringidas)
  const fechas = [generadorFechas.next().value, generadorFechas.next().value, generadorFechas.next().value, generadorFechas.next().value]

  let index = 0
  const conteo = { Pendiente: 0, Confirmada: 0, Finalizada: 0, Cancelada: 0 }
  for (const estadoFinal of estadosFinales) {
    const empleado = empleados[index % empleados.length]
    const cliente = clientes[index % clientes.length]
    const opciones = serviciosPorEmpleado.get(empleado.id)
    const servicio = opciones[index % opciones.length]
    const fecha = fechas[Math.floor(index / 4) % fechas.length]
    const horaInicio = horas[index % horas.length]
    const horaFin = addMinutes(horaInicio, servicio.duracionMinutos)
    const extra = index % 3 === 0 ? adicionales[index % Math.max(adicionales.length, 1)] : null
    const precioServicio = Number(servicio.precioBase)
    const costoAdicionales = extra ? Number(extra.precio) : 0
    index += 1
    try {
      const cita = await api.create('/citas', {
        clienteId: cliente.id,
        empleadoId: empleado.id,
        servicioId: servicio.id,
        fecha,
        horaInicio,
        horaFin,
        duracionMinutos: servicio.duracionMinutos,
        precioServicio,
        costoAdicionales,
        costoTotal: precioServicio + costoAdicionales,
        observaciones: null,
        adicionalIds: extra ? [extra.id] : [],
        estadoCitaId: estadoId('Pendiente'),
        creadoPorUsuarioId: adminId,
      })
      if (estadoFinal === 'Cancelada') {
        await api.patch(`/citas/${cita.id}/cancelar`, { motivoCancelacion: 'Cancelada por el cliente durante la carga inicial' })
      } else if (estadoFinal !== 'Pendiente') {
        await api.patch(`/citas/${cita.id}/estado`, { estadoCitaId: estadoId(estadoFinal) })
      }
      conteo[estadoFinal] += 1
      ok(`Cita #${cita.id} ${fecha} ${horaInicio}-${horaFin} (${servicio.nombre}, ${estadoFinal})`)
    } catch (e) { warn(`Cita ${fecha} ${horaInicio} (${estadoFinal}): ${e.message}`) }
  }
  log(`  Resumen de citas: ${Object.entries(conteo).map(([k, v]) => `${v} ${k}`).join(', ')}`)
}

async function main() {
  console.log('Seed de datos iniciales — Gestión de Citas')
  const perfil = await login()

  const [roles, estados, diasSemana, tipos] = await Promise.all([
    api.list('/roles'),
    api.list('/estados-cita'),
    api.list('/dias-semana'),
    api.list('/tipos-restriccion-horario'),
  ])

  const especialidades = await checkEspecialidades()
  const { clientes, empleadosUsuarios } = await seedUsuarios(roles)
  const servicios = await seedServicios(especialidades)
  const adicionales = await seedAdicionales()
  await seedHorarios(diasSemana)
  const empleados = await seedEmpleados(empleadosUsuarios, servicios, especialidades)

  // Fechas dedicadas a restricciones (días hábiles lejanos, sin citas encima).
  const gen = businessDays(21, new Set())
  const fechasRestriccion = { restriccionParcial: gen.next().value, restriccionDiaCompleto: gen.next().value, restriccionEmpleado: gen.next().value }
  await seedRestricciones(tipos, empleados, fechasRestriccion)

  // Las citas evitan las fechas con restricciones para no chocar con la validación de disponibilidad.
  const fechasRestringidas = new Set(Object.values(fechasRestriccion))
  await seedCitas(estados, empleados, clientes, servicios, adicionales, perfil.id, fechasRestringidas)

  console.log('\n================= RESUMEN =================')
  console.log(`Creados:  ${summary.creados.length}`)
  console.log(`Omitidos: ${summary.omitidos.length}`)
  console.log(`Errores:  ${summary.errores.length}`)
  if (summary.errores.length) { console.log('\nDetalle de errores/avisos:'); summary.errores.forEach(e => console.log(`  - ${e}`)) }
  console.log('===========================================')
}

main().catch(e => { console.error(`\nError fatal: ${e.message}`); process.exit(1) })
