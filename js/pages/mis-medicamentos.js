const get = (id) => document.getElementById(id);
let editandoId = null;

document.addEventListener("DOMContentLoaded", () => {
  if (!requerirSesion()) return;
  mostrarSaludoUsuario();
  mostrarMedicamentosGuardados();
  verificarPermisoNotificacion();
  iniciarCheckerAlarmas();
  activarValidacionEnTiempoReal();
});

// Si hay sesión activa, personalizamos el encabezado con el nombre del usuario.
function mostrarSaludoUsuario() {
  const kicker = document.querySelector(".page-hero .page-kicker");
  if (!kicker) return;

  const usuario = obtenerSesion();
  kicker.textContent = usuario ? `Hola, ${usuario}` : "Tu espacio personal (invitado)";
}

/* ── Validación en tiempo real ───────────────────── */

// Mientras el usuario escribe, avisamos si el campo obligatorio está vacío.
function activarValidacionEnTiempoReal() {
  get("nombre").addEventListener("input", () => validarCampoObligatorio("nombre", "error-nombre"));
  get("motivo").addEventListener("input", () => validarCampoObligatorio("motivo", "error-motivo"));
}

// Marca visualmente si un campo obligatorio quedó vacío.
function validarCampoObligatorio(idCampo, idError) {
  const campo = get(idCampo);
  const error = get(idError);
  const esValido = campo.value.trim().length > 0;

  campo.classList.toggle("invalid", !esValido);
  error.classList.toggle("visible", !esValido);

  return esValido;
}

/* ── Notificaciones ─────────────────────────────── */

function verificarPermisoNotificacion() {
  if (!("Notification" in window)) return;
  const banner = get("notif-banner");
  if (!banner) return;
  if (Notification.permission === "default") {
    banner.classList.add("visible");
  }
}

// Pide permiso al navegador para poder enviar alertas cuando toque una alarma.
function pedirPermisoNotificacion() {
  if (!("Notification" in window)) return;
  Notification.requestPermission().then((perm) => {
    if (perm === "granted") {
      get("notif-banner").classList.remove("visible");
      new Notification("MediInfo CR", {
        body: "Las notificaciones están activadas. Te avisaremos cuando sea hora de tu medicamento.",
        icon: "assets/iconoMediCRcolores.png",
      });
    }
  });
}

function dispararNotificacion(nombre, hora) {
  if (Notification.permission !== "granted") return;
  new Notification(`💊 Hora de tu medicamento`, {
    body: `Hora de tomar ${nombre} — ${hora}`,
    icon: "assets/iconoMediCRcolores.png",
    badge: "assets/iconoMediCRcolores.png",
  });
}

/* Revisa cada 30 segundos si alguna alarma coincide con HH:MM actual */
function iniciarCheckerAlarmas() {
  const fired = new Set();

  setInterval(() => {
    const ahora = new Date();
    const hhmm = `${String(ahora.getHours()).padStart(2, "0")}:${String(ahora.getMinutes()).padStart(2, "0")}`;

    obtenerLista()
      .filter((m) => m.estado === "activo" && m.alarmas?.length)
      .forEach((med) => {
        med.alarmas.forEach((hora) => {
          const key = `${med.id}-${hora}-${hhmm}`;
          if (hora === hhmm && !fired.has(key)) {
            fired.add(key);
            dispararNotificacion(med.nombre, hora);
          }
        });
      });
  }, 30000);
}

/* ── Alarmas en formulario ──────────────────────── */

// Agrega otro campo de hora, hasta un máximo de tres alarmas.
function agregarAlarma() {
  const slots = get("alarm-slots");
  if (slots.children.length >= 3) return;
  const div = document.createElement("div");
  div.className = "alarm-slot";
  div.innerHTML = `
    <input type="time" class="alarm-time" />
    <button type="button" class="alarm-remove-btn" onclick="quitarAlarma(this)" title="Quitar">×</button>
  `;
  slots.appendChild(div);
}

function quitarAlarma(btn) {
  const slots = get("alarm-slots");
  if (slots.children.length <= 1) {
    btn.previousElementSibling.value = "";
    return;
  }
  btn.parentElement.remove();
}

// Junta todas las horas escritas en el formulario antes de guardar.
function obtenerAlarmasFormulario() {
  return Array.from(document.querySelectorAll(".alarm-time"))
    .map((i) => i.value.trim())
    .filter(Boolean);
}

// Deja el formulario de alarmas en su estado inicial.
function limpiarAlarmasFormulario() {
  const slots = get("alarm-slots");
  slots.innerHTML = `
    <div class="alarm-slot">
      <input type="time" class="alarm-time" />
      <button type="button" class="alarm-remove-btn" onclick="quitarAlarma(this)" title="Quitar">×</button>
    </div>`;
}

/* ── CRUD ───────────────────────────────────────── */

// Guarda un medicamento nuevo o actualiza uno que ya estaba editándose.
function guardarMedicamento(evento) {
  evento.preventDefault();

  const nombreValido = validarCampoObligatorio("nombre", "error-nombre");
  const motivoValido = validarCampoObligatorio("motivo", "error-motivo");

  if (!nombreValido || !motivoValido) {
    (nombreValido ? get("motivo") : get("nombre")).focus();
    return;
  }

  const nombre = get("nombre").value.trim();
  const motivo = get("motivo").value.trim();

  const estado = document.querySelector('input[name="estado"]:checked')?.value || "activo";
  const datos = {
    nombre,
    motivo,
    fechaInicio: get("fecha-inicio").value,
    horario: get("horario").value.trim(),
    nota: get("nota").value.trim(),
    estado,
    alarmas: obtenerAlarmasFormulario(),
  };

  let lista = obtenerLista();

  if (editandoId !== null) {
    lista = lista.map((med) => med.id === editandoId ? { ...med, ...datos } : med);
    editandoId = null;
    get("edit-banner").style.display = "none";
    get("form-medicamento").querySelector(".btn-guardar").textContent = "Guardar medicamento";
  } else {
    lista.unshift({ id: Date.now(), ...datos });
  }

  guardarLista(lista);
  get("form-medicamento").reset();
  document.getElementById("estado-activo").checked = true;
  limpiarAlarmasFormulario();

  const msg = get("mensaje-guardado");
  msg.style.display = "flex";
  setTimeout(() => (msg.style.display = "none"), 3000);

  mostrarMedicamentosGuardados();
}

// Carga un medicamento en el formulario para poder modificarlo.
function editarMedicamento(id) {
  const med = obtenerLista().find((m) => m.id === id);
  if (!med) return;

  editandoId = id;

  get("nombre").value = med.nombre;
  get("motivo").value = med.motivo;
  get("fecha-inicio").value = med.fechaInicio || "";
  get("horario").value = med.horario || "";
  get("nota").value = med.nota || "";

  const estadoInput = document.querySelector(`input[name="estado"][value="${med.estado}"]`);
  if (estadoInput) estadoInput.checked = true;

  limpiarAlarmasFormulario();
  (med.alarmas || []).forEach((hora, i) => {
    if (i === 0) {
      document.querySelector(".alarm-time").value = hora;
    } else {
      agregarAlarma();
      const inputs = document.querySelectorAll(".alarm-time");
      inputs[inputs.length - 1].value = hora;
    }
  });

  get("edit-banner").style.display = "flex";
  get("form-medicamento").querySelector(".btn-guardar").textContent = "Guardar cambios";
  document.querySelector(".mismeds-form-panel").scrollIntoView({ behavior: "smooth" });
}

// Cancela la edición y devuelve el formulario a modo "nuevo".
function cancelarEdicion() {
  editandoId = null;
  get("form-medicamento").reset();
  document.getElementById("estado-activo").checked = true;
  limpiarAlarmasFormulario();
  get("edit-banner").style.display = "none";
  get("form-medicamento").querySelector(".btn-guardar").textContent = "Guardar medicamento";
}

// Lee la lista personal guardada para el usuario actual.
function obtenerLista() {
  try {
    return JSON.parse(localStorage.getItem(claveMisMedicamentos()) || "[]");
  } catch {
    return [];
  }
}

// Vuelve a guardar la lista del usuario en localStorage.
function guardarLista(lista) {
  localStorage.setItem(claveMisMedicamentos(), JSON.stringify(lista));
}

// Pinta el diario con tarjetas, contadores y acciones.
function mostrarMedicamentosGuardados() {
  const contenedor = get("lista-guardados");
  const lista = obtenerLista();

  const countEl = get("diary-count");
  if (countEl) countEl.textContent = `${lista.length} registro${lista.length !== 1 ? "s" : ""}`;

  if (lista.length === 0) {
    contenedor.innerHTML = `
      <div class="diary-empty">
        <div class="diary-empty-icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg></div>
        <h3>Sin registros aún</h3>
        <p>Agregá tu primer medicamento usando el formulario.</p>
      </div>`;
    return;
  }

  contenedor.innerHTML = "";
  lista.forEach((med) => contenedor.appendChild(crearDiaryCard(med)));
}

// Construye una tarjeta individual para cada medicamento guardado.
function crearDiaryCard(med) {
  const card = document.createElement("div");
  card.className = `diary-card${med.estado === "finalizado" ? " finalizado" : ""}`;

  const esActivo = med.estado === "activo";
  const toggleLabel = esActivo ? "Marcar finalizado" : "Reactivar";

  const alarmasPills = (med.alarmas || [])
    .map((h) => `<span class="diary-alarm-pill"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg> ${h}</span>`)
    .join("");

  card.innerHTML = `
    <div>
      <div class="diary-card-name">${med.nombre}</div>
      <div class="diary-card-badges">
        <span class="diary-pill ${esActivo ? "diary-pill-activo" : "diary-pill-finalizado"}">
          ${esActivo ? "Activo" : "Finalizado"}
        </span>
        ${med.fechaInicio ? `<span class="diary-pill">${formatearFecha(med.fechaInicio)}</span>` : ""}
        ${med.horario ? `<span class="diary-pill">${med.horario}</span>` : ""}
      </div>
      <div class="diary-info-row">
        <div class="diary-info-item">
          <span>Motivo</span>
          <span>${med.motivo}</span>
        </div>
        ${med.nota ? `
        <div class="diary-info-item">
          <span>Nota</span>
          <span>${med.nota}</span>
        </div>` : ""}
      </div>
      ${alarmasPills ? `<div class="diary-alarms">${alarmasPills}</div>` : ""}
    </div>
    <div class="diary-actions">
      <button class="btn-toggle-estado" onclick="editarMedicamento(${med.id})">Editar</button>
      <button class="btn-toggle-estado" onclick="toggleEstado(${med.id})">${toggleLabel}</button>
      <button class="btn-eliminar" onclick="eliminarMedicamento(${med.id})">Eliminar</button>
    </div>
  `;

  return card;
}

// Cambia el estado entre activo y finalizado.
function toggleEstado(id) {
  const lista = obtenerLista().map((med) => {
    if (med.id === id) med.estado = med.estado === "activo" ? "finalizado" : "activo";
    return med;
  });
  guardarLista(lista);
  mostrarMedicamentosGuardados();
}

// Elimina un medicamento concreto del diario.
function eliminarMedicamento(id) {
  if (!confirm("¿Seguro que querés eliminar este medicamento?")) return;
  guardarLista(obtenerLista().filter((med) => med.id !== id));
  mostrarMedicamentosGuardados();
}

// Limpieza controlada: borra todos los registros guardados, con confirmación previa.
function vaciarRegistros() {
  if (obtenerLista().length === 0) return;

  if (!confirm("¿Seguro que querés eliminar TODOS los medicamentos guardados? Esta acción no se puede deshacer.")) {
    return;
  }

  guardarLista([]);
  mostrarMedicamentosGuardados();
  alert("Se eliminaron todos los registros.");
}

// Convierte YYYY-MM-DD a DD/MM/YYYY para que sea más legible.
function formatearFecha(fechaStr) {
  const [anio, mes, dia] = fechaStr.split("-");
  return `${dia}/${mes}/${anio}`;
}
