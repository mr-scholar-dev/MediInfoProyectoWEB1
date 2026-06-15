// ===== mis-medicamentos.js =====
// Este archivo maneja la página de gestión personal.
// Guarda, recupera y elimina medicamentos usando localStorage.

// La clave que uso para guardar la lista en localStorage
// Es como un "nombre" para identificar los datos
const CLAVE_STORAGE = "mediinfo_mis_medicamentos";

// Cuando la página carga, leo lo que hay en localStorage y lo muestro
window.onload = function () {
  // Verifico si llegó un medicamento precargado desde la página de búsqueda
  let precargado = localStorage.getItem("medicamento_precargado");
  if (precargado) {
    // Si hay uno, lo pongo en el campo del formulario
    document.getElementById("nombre").value = precargado;
    // Lo elimino para que no aparezca la próxima vez
    localStorage.removeItem("medicamento_precargado");
  }

  // Muestro los medicamentos que ya estaban guardados
  mostrarMedicamentosGuardados();
};

// Esta función se llama cuando el usuario envía el formulario
// El parámetro "evento" es necesario para evitar que la página se recargue
function guardarMedicamento(evento) {
  // Prevengo el comportamiento por defecto del formulario (que recargaría la página)
  evento.preventDefault();

  // Leo los valores de cada campo del formulario
  let nombre = document.getElementById("nombre").value.trim();
  let motivo = document.getElementById("motivo").value.trim();
  let fechaInicio = document.getElementById("fecha-inicio").value;
  let horario = document.getElementById("horario").value.trim();
  let nota = document.getElementById("nota").value.trim();
  let estado = document.getElementById("estado").value;

  // Creo un objeto con todos los datos del medicamento
  // También le agrego un id único usando Date.now() para poder eliminarlo después
  let nuevoMedicamento = {
    id: Date.now(),
    nombre: nombre,
    motivo: motivo,
    fechaInicio: fechaInicio,
    horario: horario,
    nota: nota,
    estado: estado
  };

  // Traigo la lista que ya estaba guardada (o un arreglo vacío si no hay nada)
  let lista = obtenerLista();

  // Agrego el nuevo medicamento al final de la lista
  lista.push(nuevoMedicamento);

  // Guardo la lista actualizada en localStorage
  // Uso JSON.stringify para convertir el arreglo a texto (localStorage solo guarda texto)
  localStorage.setItem(CLAVE_STORAGE, JSON.stringify(lista));

  // Limpio el formulario después de guardar
  document.getElementById("form-medicamento").reset();

  // Muestro el mensaje de confirmación
  let mensaje = document.getElementById("mensaje-guardado");
  mensaje.style.display = "block";

  // Lo oculto después de 3 segundos
  setTimeout(function () {
    mensaje.style.display = "none";
  }, 3000);

  // Actualizo la lista en pantalla
  mostrarMedicamentosGuardados();
}

// Recupera la lista desde localStorage y la devuelve como arreglo
function obtenerLista() {
  // Intento leer el valor guardado con la clave
  let datos = localStorage.getItem(CLAVE_STORAGE);

  // Si no hay nada guardado, devuelvo un arreglo vacío
  if (datos === null) {
    return [];
  }

  // Convierto el texto JSON de vuelta a un arreglo de objetos con JSON.parse
  return JSON.parse(datos);
}

// Lee la lista del localStorage y genera las tarjetas en pantalla
function mostrarMedicamentosGuardados() {
  let contenedor = document.getElementById("lista-guardados");
  let lista = obtenerLista();

  // Si la lista está vacía, muestro un mensaje al usuario
  if (lista.length === 0) {
    contenedor.innerHTML =
      '<p class="sin-guardados">No tenés medicamentos guardados todavía.</p>';
    return;
  }

  // Limpio el contenedor antes de volver a pintarlo
  contenedor.innerHTML = "";

  // Recorro la lista y creo una tarjeta por cada medicamento guardado
  lista.forEach(function (med) {
    let item = document.createElement("div");

    // Si el estado es "finalizado", le agrego una clase extra para estilizarlo diferente
    item.className = "item-guardado" + (med.estado === "finalizado" ? " finalizado" : "");

    // Construyo el badge de estado
    let badgeClase = med.estado === "activo" ? "estado-activo" : "estado-finalizado";
    let badgeTexto = med.estado === "activo" ? "Activo" : "Finalizado";

    // Genero el HTML de la tarjeta con los datos del medicamento
    item.innerHTML = `
      <div class="item-guardado-info">
        <h3>${med.nombre}</h3>
        <span class="estado-badge ${badgeClase}">${badgeTexto}</span>
        <p><strong>Motivo:</strong> ${med.motivo}</p>
        ${med.fechaInicio ? `<p><strong>Inicio:</strong> ${formatearFecha(med.fechaInicio)}</p>` : ""}
        ${med.horario ? `<p><strong>Horario:</strong> ${med.horario}</p>` : ""}
        ${med.nota ? `<p><strong>Nota:</strong> ${med.nota}</p>` : ""}
      </div>
      <div>
        <button class="btn btn-peligro" onclick="eliminarMedicamento(${med.id})">
          🗑 Eliminar
        </button>
      </div>
    `;

    contenedor.appendChild(item);
  });
}

// Elimina un medicamento de la lista usando su id único
function eliminarMedicamento(id) {
  // Pido confirmación antes de borrar
  let confirmar = confirm("¿Seguro que querés eliminar este medicamento?");
  if (!confirmar) return;

  // Traigo la lista actual
  let lista = obtenerLista();

  // Filtro la lista para quedarme con todos excepto el que tiene ese id
  let listaActualizada = lista.filter(function (med) {
    return med.id !== id;
  });

  // Guardo la lista sin ese medicamento
  localStorage.setItem(CLAVE_STORAGE, JSON.stringify(listaActualizada));

  // Actualizo la pantalla para reflejar el cambio
  mostrarMedicamentosGuardados();
}

// Formatea la fecha del input (viene como "2026-05-20") a un formato más legible
function formatearFecha(fechaStr) {
  // Separo el año, mes y día
  let partes = fechaStr.split("-");
  // Devuelvo en formato dd/mm/yyyy
  return partes[2] + "/" + partes[1] + "/" + partes[0];
}
