// Lista completa de medicamentos cargados desde el JSON.
let todosMedicamentos = [];

// Aquí guardamos el medicamento que el usuario abrió en la ficha.
let medicamentoSeleccionado = null;

// Atajo para escribir menos: busca un elemento por su id en el HTML.
const get = (id) => document.getElementById(id);

// Cuando el HTML termina de cargarse, mostramos los medicamentos.
document.addEventListener("DOMContentLoaded", cargarMedicamentos);

// Carga los datos reales desde el archivo JSON y muestra todo en pantalla.
async function cargarMedicamentos() {
  const contenedor = get("lista-medicamentos");
  try {
    todosMedicamentos = await obtenerMedicamentos();
    mostrarMedicamentos(todosMedicamentos);
  } catch (error) {
    contenedor.innerHTML =
      '<p class="sin-resultados">No se pudieron cargar los medicamentos.</p>';
    console.error(error);
  }
}

// Carga el catálogo base sin importar si el sitio corre con servidor o como archivo local.
async function obtenerMedicamentos() {
  if (Array.isArray(window.MEDICAMENTOS_DATA)) return window.MEDICAMENTOS_DATA;

  const respuesta = await fetch("data/medicamentos.json");
  if (!respuesta.ok) throw new Error("No se pudo leer el archivo JSON.");
  return respuesta.json();
}

// Filtra por nombre, por categoría y por estado (venta libre / requiere receta) al mismo tiempo.
function filtrarMedicamentos() {
  // Tomamos lo que escribió el usuario y lo pasamos a minúsculas.
  const textoBusqueda = get("buscador").value.toLowerCase();

  // Tomamos la categoría elegida en el select.
  const categoriaSeleccionada = get("filtro-categoria").value;

  // Tomamos el estado elegido (venta_libre / requiere_receta).
  const estadoSeleccionado = get("filtro-estado") ? get("filtro-estado").value : "";

  // Recorremos la lista completa y nos quedamos solo con los que coinciden.
  const resultados = todosMedicamentos.filter((med) => {
    // Comprueba si el nombre contiene el texto escrito.
    const coincideNombre = med.nombre.toLowerCase().includes(textoBusqueda);

    // Si no hay categoría elegida, aceptamos todas.
    // Si sí hay una, debe coincidir exactamente.
    const coincideCategoria =
      categoriaSeleccionada === "" || med.categoria === categoriaSeleccionada;

    // Igual que la categoría, pero para el campo estado.
    const coincideEstado =
      estadoSeleccionado === "" || med.estado === estadoSeleccionado;

    return coincideNombre && coincideCategoria && coincideEstado;
  });

  // Mostramos los medicamentos que sí cumplieron el filtro.
  mostrarMedicamentos(resultados);

  // Si había una ficha abierta, la cerramos para no mostrar datos viejos.
  cerrarFicha();
}

// Dibuja las tarjetas de medicamentos dentro del contenedor principal.
function mostrarMedicamentos(lista) {
  const contenedor = get("lista-medicamentos");
  const contador = get("contador-resultados");

  // Procesamiento de datos: contamos cuántos resultados hay para informar al usuario.
  if (contador) {
    contador.textContent =
      lista.length === 0
        ? ""
        : `${lista.length} medicamento${lista.length !== 1 ? "s" : ""} encontrado${lista.length !== 1 ? "s" : ""}`;
  }

  // Si no hay resultados, mostramos un mensaje en lugar de dejar vacío.
  if (lista.length === 0) {
    contenedor.innerHTML =
      '<p class="sin-resultados">No se encontraron medicamentos con esos criterios.</p>';
    return;
  }

  // Limpiamos el contenedor antes de volver a dibujar las tarjetas.
  contenedor.innerHTML = "";

  // Creamos una tarjeta por cada medicamento de la lista.
  lista.forEach((med) => contenedor.appendChild(crearTarjetaMedicamento(med)));
}

const CATEGORIA_CONFIG = {
  "Dolor y fiebre":  { color: "#FF6B6B" },
  "Antibióticos":    { color: "#4ECDC4" },
  "Alergias":        { color: "#A78BFA" },
  "Estómago":        { color: "#F59E0B" },
  "Diabetes":        { color: "#34D399" },
  "Piel":            { color: "#FB923C" },
};

function crearTarjetaMedicamento(med) {
  const tarjeta = document.createElement("div");
  tarjeta.className = "card-medicamento";
  const resumenUso = recortarTexto(med.uso_general, 90);
  const cfg = CATEGORIA_CONFIG[med.categoria] || { color: "#1D6FEB" };
  const etiquetaEstado = med.estado === "requiere_receta" ? "Requiere receta" : "Venta libre";
  const presentacion = med.presentaciones_comunes?.[0] || "Presentaciones variadas";
  const poblacion = med.poblacion || "Niños y adultos";

  tarjeta.style.setProperty("--cat-color", cfg.color);

  tarjeta.innerHTML = `
    <div class="card-med-top">
      <span class="categoria-badge" style="background:${cfg.color}12;color:${cfg.color};border-color:${cfg.color}24">${med.categoria}</span>
      <span class="uso-badge ${poblacion === "Adultos" ? "uso-badge-adultos" : "uso-badge-mixto"}">${poblacion}</span>
      <span class="estado-badge">${etiquetaEstado}</span>
    </div>
    <h3 class="card-med-nombre">${med.nombre}</h3>
    <p class="card-med-generico">${med.nombre_generico}</p>
    <p class="card-med-uso">${resumenUso}</p>
    <div class="card-med-divider"></div>
    <p class="card-med-extra"><span>${presentacion}</span></p>
    <span class="card-med-link">Ver detalles →</span>
  `;

  tarjeta.addEventListener("click", () => mostrarFicha(med));
  return tarjeta;
}

// Llena la ficha de detalle con toda la información del medicamento.
function mostrarFicha(med) {
  // Guardamos el medicamento actual por si el usuario quiere guardarlo.
  medicamentoSeleccionado = med;

  // Estos campos van en texto simple dentro de la ficha.
  get("ficha-nombre").textContent = med.nombre;
  get("ficha-generico").textContent = `Nombre genérico: ${med.nombre_generico}`;
  get("ficha-categoria").textContent = med.categoria;
  get("ficha-poblacion").textContent = med.poblacion || "Niños y adultos";
  get("ficha-uso").textContent = med.uso_general;
  get("ficha-edad").textContent = med.edad_orientativa || "No especificado";
  get("ficha-apto").textContent = med.apto_para || "No especificado";
  get("ficha-presentaciones").textContent = med.presentaciones_comunes.join(", ");
  get("ficha-receta").textContent = med.requiere_receta;
  get("ficha-uso-seguro").textContent = med.uso_seguro;
  get("ficha-nota").textContent = med.nota_importante;

  // Las listas se llenan con <li> usando la función reutilizable llenarLista().
  llenarLista("ficha-advertencias", med.advertencias);
  llenarLista("ficha-efectos-comunes", med.efectos_secundarios_comunes);
  llenarLista("ficha-efectos-graves", med.efectos_secundarios_graves);
  llenarLista("ficha-contraindicaciones", med.contraindicaciones_generales);
  llenarLista("ficha-interacciones", med.interacciones_generales);

  // Ocultamos el mensaje de guardado por si estaba visible antes.
  get("mensaje-guardado").style.display = "none";

  // Mostramos la ficha y hacemos scroll para que el usuario la vea.
  const ficha = get("ficha-detalle");
  ficha.style.display = "block";
  ficha.scrollIntoView({ behavior: "smooth" });
}

// Limpia una lista y vuelve a llenarla con los elementos recibidos.
function llenarLista(idElemento, arreglo) {
  const lista = get(idElemento);
  lista.innerHTML = "";

  // Recorremos el arreglo y creamos un <li> por cada texto.
  arreglo.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    lista.appendChild(li);
  });
}

// Oculta la ficha completa y deja de considerar un medicamento seleccionado.
function cerrarFicha() {
  get("ficha-detalle").style.display = "none";
  medicamentoSeleccionado = null;
}

// Guarda el medicamento abierto en la lista personal del usuario.
function guardarDesdeBusqueda() {
  // Si no hay un medicamento abierto, no tiene sentido guardar nada.
  if (!medicamentoSeleccionado) {
    alert("Por favor seleccioná un medicamento primero.");
    return;
  }

  // Guardamos siempre dentro de una sesión real para evitar que se vaya a "invitado".
  if (!requerirSesion("login.html")) return;

  // Traemos la lista que ya estaba guardada en el navegador.
  const listaGuardada = JSON.parse(localStorage.getItem(claveMisMedicamentos()) || "[]");

  // Evitamos duplicados comparando por nombre.
  const yaExiste = listaGuardada.some(
    (m) => m.nombre === medicamentoSeleccionado.nombre
  );

  if (yaExiste) {
    alert("Este medicamento ya está en tu lista personal.");
    return;
  }

  // Creamos el objeto mínimo que necesita la página de "Mis medicamentos".
  listaGuardada.push({
    id: Date.now(),
    nombre: medicamentoSeleccionado.nombre,
    motivo: "Guardado desde búsqueda",
    fechaInicio: "",
    horario: "",
    nota: medicamentoSeleccionado.uso_general,
    estado: "activo"
  });

  // Guardamos la lista actualizada y enviamos al usuario a la otra página.
  localStorage.setItem(claveMisMedicamentos(), JSON.stringify(listaGuardada));
  alert("Medicamento guardado. Te llevamos a tu lista.");
  window.location.href = "mis-medicamentos.html";
}

function seleccionarChip(chip, categoria) {
  document.querySelectorAll(".chip").forEach(c => c.classList.remove("chip-active"));
  chip.classList.add("chip-active");
  document.getElementById("filtro-categoria").value = categoria;
  filtrarMedicamentos();
}

function recortarTexto(texto, maximo) {
  if (!texto) return "";
  if (texto.length <= maximo) return texto;
  return `${texto.slice(0, maximo).trimEnd()}...`;
}
