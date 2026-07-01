const get = (id) => document.getElementById(id);

document.addEventListener("DOMContentLoaded", () => {
  // Si ya hay una sesión activa, no tiene sentido mostrar el login de nuevo.
  if (obtenerSesion()) {
    window.location.href = "mis-medicamentos.html";
    return;
  }

  get("form-login").addEventListener("submit", manejarLogin);
  get("form-registro").addEventListener("submit", manejarRegistro);

  // Validación en tiempo real mientras el usuario escribe.
  get("login-usuario").addEventListener("input", () => validarNoVacio("login-usuario", "error-login-usuario"));
  get("login-clave").addEventListener("input", () => validarNoVacio("login-clave", "error-login-clave"));

  get("registro-usuario").addEventListener("input", validarRegistroUsuario);
  get("registro-clave").addEventListener("input", validarRegistroClaves);
  get("registro-clave-confirmar").addEventListener("input", validarRegistroClaves);
});

// Cambia entre el formulario de inicio de sesión y el de registro.
function mostrarTab(tab) {
  const esLogin = tab === "login";

  get("tab-login").classList.toggle("chip-active", esLogin);
  get("tab-registro").classList.toggle("chip-active", !esLogin);

  get("form-login").style.display = esLogin ? "block" : "none";
  get("form-registro").style.display = esLogin ? "none" : "block";
}

function validarNoVacio(idCampo, idError) {
  const valido = get(idCampo).value.trim().length > 0;
  get(idCampo).classList.toggle("invalid", !valido);
  get(idError).classList.toggle("visible", !valido);
  return valido;
}

function validarRegistroUsuario() {
  const valido = get("registro-usuario").value.trim().length >= 3;
  get("registro-usuario").classList.toggle("invalid", !valido);
  get("error-registro-usuario").classList.toggle("visible", !valido);
  return valido;
}

function validarRegistroClaves() {
  const clave = get("registro-clave").value;
  const confirmar = get("registro-clave-confirmar").value;

  const claveValida = clave.length >= 4;
  get("registro-clave").classList.toggle("invalid", !claveValida);
  get("error-registro-clave").classList.toggle("visible", !claveValida);

  const coinciden = confirmar.length > 0 && confirmar === clave;
  get("registro-clave-confirmar").classList.toggle("invalid", confirmar.length > 0 && !coinciden);
  get("error-registro-clave-confirmar").classList.toggle("visible", confirmar.length > 0 && !coinciden);

  return claveValida && coinciden;
}

function manejarLogin(evento) {
  evento.preventDefault();

  const usuarioValido = validarNoVacio("login-usuario", "error-login-usuario");
  const claveValida = validarNoVacio("login-clave", "error-login-clave");
  if (!usuarioValido || !claveValida) return;

  const resultado = iniciarSesion(get("login-usuario").value, get("login-clave").value);
  const mensajeError = get("login-mensaje-error");
  const mensajeExito = get("login-mensaje-exito");

  if (!resultado.ok) {
    mensajeError.textContent = resultado.mensaje;
    mensajeError.classList.add("visible");
    mensajeExito.style.display = "none";
    return;
  }

  mensajeError.classList.remove("visible");
  mensajeExito.style.display = "flex";
  mensajeExito.textContent = resultado.mensaje;

  setTimeout(() => {
    window.location.href = "mis-medicamentos.html";
  }, 900);
}

function manejarRegistro(evento) {
  evento.preventDefault();

  const usuarioValido = validarRegistroUsuario();
  const clavesValidas = validarRegistroClaves();
  if (!usuarioValido || !clavesValidas) return;

  const resultado = registrarUsuario(get("registro-usuario").value, get("registro-clave").value);
  const mensajeError = get("registro-mensaje-error");
  const mensajeExito = get("registro-mensaje-exito");

  if (!resultado.ok) {
    mensajeError.textContent = resultado.mensaje;
    mensajeError.classList.add("visible");
    mensajeExito.style.display = "none";
    return;
  }

  mensajeError.classList.remove("visible");
  mensajeExito.style.display = "flex";
  mensajeExito.textContent = resultado.mensaje;

  setTimeout(() => {
    window.location.href = "mis-medicamentos.html";
  }, 900);
}
