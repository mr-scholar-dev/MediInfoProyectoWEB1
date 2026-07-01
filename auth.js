// auth.js
// Sistema de "login" SIMULADO para MediInfo CR.
//
// IMPORTANTE (léase en la defensa técnica):
// Este proyecto es un sitio 100% estático (HTML + CSS + JS, sin backend,
// publicado en GitHub Pages). No existe servidor que pueda validar
// credenciales de forma segura. Por eso este login:
//   - Guarda usuarios y contraseñas en localStorage, EN TEXTO PLANO.
//   - Es visible e inspeccionable desde las herramientas de desarrollador.
//   - No debe usarse con contraseñas reales de otros servicios.
// Su único propósito es simular el flujo de registro / inicio de sesión
// y personalizar la experiencia (saludo, lista de medicamentos por usuario),
// no proteger información sensible.

const CLAVE_USUARIOS = "mediinfo_usuarios";
const CLAVE_SESION = "mediinfo_sesion";

function obtenerUsuarios() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_USUARIOS) || "[]");
  } catch {
    return [];
  }
}

function guardarUsuarios(lista) {
  localStorage.setItem(CLAVE_USUARIOS, JSON.stringify(lista));
}

// Devuelve el nombre de usuario con sesión activa, o null si no hay nadie logueado.
function obtenerSesion() {
  return localStorage.getItem(CLAVE_SESION);
}

function iniciarSesionLocal(usuario) {
  localStorage.setItem(CLAVE_SESION, usuario);
}

function cerrarSesion() {
  localStorage.removeItem(CLAVE_SESION);
  window.location.href = "index.html";
}

// Crea una cuenta nueva. Devuelve { ok: boolean, mensaje: string }.
function registrarUsuario(usuario, clave) {
  usuario = usuario.trim();

  if (usuario.length < 3) {
    return { ok: false, mensaje: "El usuario debe tener al menos 3 caracteres." };
  }
  if (clave.length < 4) {
    return { ok: false, mensaje: "La contraseña debe tener al menos 4 caracteres." };
  }

  const usuarios = obtenerUsuarios();
  const yaExiste = usuarios.some(
    (u) => u.usuario.toLowerCase() === usuario.toLowerCase()
  );
  if (yaExiste) {
    return { ok: false, mensaje: "Ese nombre de usuario ya existe. Elegí otro." };
  }

  usuarios.push({ usuario, clave });
  guardarUsuarios(usuarios);
  iniciarSesionLocal(usuario);

  return { ok: true, mensaje: "Cuenta creada correctamente." };
}

// Clave de localStorage para "Mis medicamentos", separada por usuario.
// Así cada cuenta ve solo su propia lista. Sin sesión, se usa una lista de "invitado".
function claveMisMedicamentos() {
  const usuario = obtenerSesion();
  return usuario ? `mediinfo_mis_medicamentos_${usuario}` : "mediinfo_mis_medicamentos_invitado";
}

// Valida credenciales contra los usuarios guardados. Devuelve { ok, mensaje }.
function iniciarSesion(usuario, clave) {
  usuario = usuario.trim();
  const usuarios = obtenerUsuarios();
  const encontrado = usuarios.find(
    (u) => u.usuario.toLowerCase() === usuario.toLowerCase()
  );

  if (!encontrado || encontrado.clave !== clave) {
    return { ok: false, mensaje: "Usuario o contraseña incorrectos." };
  }

  iniciarSesionLocal(encontrado.usuario);
  return { ok: true, mensaje: `Bienvenido, ${encontrado.usuario}.` };
}

// Crea una cuenta de demostración (isaac / 1234) la primera vez que alguien
// visita el sitio en un navegador nuevo, para que el login se pueda probar
// de inmediato sin tener que registrarse primero (útil para la defensa técnica).
(function sembrarUsuarioDemo() {
  const usuarios = obtenerUsuarios();
  const yaExiste = usuarios.some((u) => u.usuario.toLowerCase() === "isaac");
  if (!yaExiste) {
    usuarios.push({ usuario: "isaac", clave: "1234" });
    guardarUsuarios(usuarios);
  }
})();
