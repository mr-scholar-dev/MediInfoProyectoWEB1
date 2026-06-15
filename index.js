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
});
