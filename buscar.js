// Clave de localStorage donde guardamos la lista personal del usuario.
const KEY_MIS_MEDICAMENTOS = "mediinfo_mis_medicamentos";

// Lista completa de medicamentos cargados desde datos.js.
let todosMedicamentos = [];

// Aquí guardamos el medicamento que el usuario abrió en la ficha.
let medicamentoSeleccionado = null;

// Atajo para escribir menos: busca un elemento por su id en el HTML.
const get = (id) => document.getElementById(id);

// Cuando el HTML termina de cargarse, mostramos los medicamentos.
document.addEventListener("DOMContentLoaded", cargarMedicamentos);

// Carga los datos del archivo datos.js y muestra todo en pantalla.
function cargarMedicamentos() {
  todosMedicamentos = medicamentosData;
  mostrarMedicamentos(todosMedicamentos);
}

// Filtra por nombre y por categoría al mismo tiempo.
function filtrarMedicamentos() {
  // Tomamos lo que escribió el usuario y lo pasamos a minúsculas.
  const textoBusqueda = get("buscador").value.toLowerCase();

  // Tomamos la categoría elegida en el select.
  const categoriaSeleccionada = get("filtro-categoria").value;

  // Recorremos la lista completa y nos quedamos solo con los que coinciden.
  const resultados = todosMedicamentos.filter((med) => {
    // Comprueba si el nombre contiene el texto escrito.
    const coincideNombre = med.nombre.toLowerCase().includes(textoBusqueda);

    // Si no hay categoría elegida, aceptamos todas.
    // Si sí hay una, debe coincidir exactamente.
    const coincideCategoria =
      categoriaSeleccionada === "" || med.categoria === categoriaSeleccionada;

    return coincideNombre && coincideCategoria;
  });

  // Mostramos los medicamentos que sí cumplieron el filtro.
  mostrarMedicamentos(resultados);

  // Si había una ficha abierta, la cerramos para no mostrar datos viejos.
  cerrarFicha();
}

// Dibuja las tarjetas de medicamentos dentro del contenedor principal.
function mostrarMedicamentos(lista) {
  const contenedor = get("lista-medicamentos");

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

// Crea una tarjeta visual con la información resumida del medicamento.
function crearTarjetaMedicamento(med) {
  const tarjeta = document.createElement("div");
  tarjeta.className = "card-medicamento";

  // Mostramos solo un resumen para que la lista no se vea muy larga.
  tarjeta.innerHTML = `
    <span class="categoria-badge">${med.categoria}</span>
    <h3>${med.nombre}</h3>
    <p><em>${med.nombre_generico}</em></p>
    <p>${med.uso_general.substring(0, 80)}...</p>
    <br/>
    <small style="color: #1a6eb5;">Clic para ver detalles →</small>
  `;

  // Al hacer clic, abrimos la ficha completa de ese medicamento.
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
  get("ficha-uso").textContent = med.uso_general;
  get("ficha-presentaciones").textContent = med.presentaciones_comunes.join(", ");
  get("ficha-receta").textContent = med.requiere_receta;
  get("ficha-uso-seguro").textContent = med.uso_seguro;
  get("ficha-nota").textContent = `⚠️ ${med.nota_importante}`;

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

  // Traemos la lista que ya estaba guardada en el navegador.
  const listaGuardada = JSON.parse(localStorage.getItem(KEY_MIS_MEDICAMENTOS) || "[]");

  // Evitamos duplicados comparando por nombre.
  const yaExiste = listaGuardada.some(
    (m) => m.nombre === medicamentoSeleccionado.nombre
  );

  if (yaExiste) {
    alert("⚠️ Este medicamento ya está en tu lista personal.");
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
  localStorage.setItem(KEY_MIS_MEDICAMENTOS, JSON.stringify(listaGuardada));
  alert("✅ Medicamento guardado. Te llevamos a tu lista.");
  window.location.href = "mis-medicamentos.html";
}
