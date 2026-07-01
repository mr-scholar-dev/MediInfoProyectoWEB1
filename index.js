function buscarEbais() {
  const entrada = document.getElementById("ubicacion-ebais");
  const ubicacion = entrada.value.trim();
  const consulta = ubicacion
    ? `EBAIS cerca de ${ubicacion}`
    : "EBAIS Costa Rica";

  const url = `https://www.google.com/maps/search/${encodeURIComponent(consulta)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

function usarMiUbicacion() {
  if (!navigator.geolocation) {
    alert("Tu navegador no permite usar ubicación.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (posicion) => {
      const { latitude, longitude } = posicion.coords;
      const url = `https://www.google.com/maps/search/EBAIS/@${latitude},${longitude},14z`;
      window.open(url, "_blank", "noopener,noreferrer");
    },
    () => {
      alert("No se pudo obtener tu ubicación. Probá escribiendo tu cantón o distrito.");
    },
    { timeout: 10000 }
  );
}

document.addEventListener("DOMContentLoaded", () => {
  const entrada = document.getElementById("ubicacion-ebais");

  if (entrada) {
    entrada.addEventListener("keydown", (evento) => {
      if (evento.key === "Enter") {
        evento.preventDefault();
        buscarEbais();
      }
    });
  }

  cargarCategoriasDesdeJSON();
});

// Iconos y colores por categoría, iguales a los usados en la página de búsqueda.
const CATEGORIA_CONFIG_HOME = {
  "Dolor y fiebre": { color: "#FF6B6B", icon: "💊" },
  "Antibióticos": { color: "#4ECDC4", icon: "🦠" },
  "Alergias": { color: "#A78BFA", icon: "🌿" },
  "Estómago": { color: "#F59E0B", icon: "🫀" },
  "Diabetes": { color: "#34D399", icon: "🩸" },
  "Piel": { color: "#FB923C", icon: "🩹" },
};

// Carga el archivo JSON real y genera dinámicamente la sección de categorías
// y los contadores de la página de inicio. Nada de esto se escribe a mano en el HTML.
async function cargarCategoriasDesdeJSON() {
  const contenedor = document.getElementById("categorias-dinamicas");
  if (!contenedor) return;

  try {
    const respuesta = await fetch("data/medicamentos.json");
    if (!respuesta.ok) throw new Error("No se pudo leer el archivo JSON.");
    const medicamentos = await respuesta.json();

    // Actualizamos los contadores de la página con el total real de registros.
    document.querySelectorAll("#stat-total-medicamentos, #stat-total-medicamentos-2").forEach((el) => {
      el.textContent = medicamentos.length;
    });

    // Procesamos los datos: contamos cuántos medicamentos hay por categoría.
    const conteoPorCategoria = {};
    medicamentos.forEach((med) => {
      conteoPorCategoria[med.categoria] = (conteoPorCategoria[med.categoria] || 0) + 1;
    });

    contenedor.innerHTML = "";
    Object.entries(conteoPorCategoria).forEach(([categoria, cantidad]) => {
      const cfg = CATEGORIA_CONFIG_HOME[categoria] || { color: "#1D6FEB", icon: "💉" };
      const tarjeta = document.createElement("a");
      tarjeta.href = `buscar.html`;
      tarjeta.className = "categoria-card-home";
      tarjeta.innerHTML = `
        <span class="cat-icon">${cfg.icon}</span>
        <span>
          <span class="cat-nombre">${categoria}</span><br>
          <span class="cat-count">${cantidad} medicamento${cantidad !== 1 ? "s" : ""}</span>
        </span>
      `;
      contenedor.appendChild(tarjeta);
    });
  } catch (error) {
    contenedor.innerHTML = '<p class="sin-resultados">No se pudieron cargar las categorías.</p>';
    console.error(error);
  }
}
