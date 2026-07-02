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
  iniciarParticulasHero();
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
    const medicamentos = await obtenerMedicamentos();

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

// Obtiene el catálogo desde el respaldo local o desde el JSON, según exista.
async function obtenerMedicamentos() {
  if (Array.isArray(window.MEDICAMENTOS_DATA)) return window.MEDICAMENTOS_DATA;

  const respuesta = await fetch("data/medicamentos.json");
  if (!respuesta.ok) throw new Error("No se pudo leer el archivo JSON.");
  return respuesta.json();
}

// Dibuja partículas muy suaves solo en la hero principal de la home.
function iniciarParticulasHero() {
  const canvas = document.getElementById("particle-canvas");
  const hero = document.querySelector(".hero-tesla");
  if (!canvas || !hero) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (window.innerWidth < 768) return;

  const ctx = canvas.getContext("2d");
  const particles = [];
  const total = 28;
  let rafId = null;
  let mouseX = 0;
  let mouseY = 0;
  let hasMouse = false;
  let running = false;

  // Ajusta el canvas al tamaño real del bloque para evitar deformaciones.
  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const rect = hero.getBoundingClientRect();
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const rand = (min, max) => Math.random() * (max - min) + min;

  // Cada partícula guarda posición, velocidad y brillo propios.
  const createParticle = () => ({
    x: rand(0, hero.clientWidth),
    y: rand(0, hero.clientHeight),
    r: rand(1.2, 3.0),
    vx: rand(-0.14, 0.14),
    vy: rand(-0.14, 0.1),
    alpha: rand(0.16, 0.42),
    hue: rand(206, 223),
  });

  // Cuando una partícula sale del área, la reubicamos para seguir animando.
  const resetParticle = (p) => {
    p.x = rand(0, hero.clientWidth);
    p.y = hero.clientHeight + rand(10, 90);
    p.r = rand(1.2, 3.0);
    p.vx = rand(-0.14, 0.14);
    p.vy = rand(-0.14, 0.1);
    p.alpha = rand(0.16, 0.42);
    p.hue = rand(206, 223);
  };

  // Render principal de la animación.
  const draw = () => {
    if (!running) return;
    ctx.clearRect(0, 0, hero.clientWidth, hero.clientHeight);
    ctx.globalCompositeOperation = "lighter";

    for (const p of particles) {
      if (hasMouse) {
        const dx = p.x - mouseX;
        const dy = p.y - mouseY;
        const dist = Math.hypot(dx, dy);
        if (dist < 180) {
          const push = (180 - dist) / 180;
          p.x += dx * push * 0.005;
          p.y += dy * push * 0.005;
        }
      }

      p.x += p.vx;
      p.y += p.vy;

      if (p.y < -20) resetParticle(p);
      if (p.x < -20) p.x = hero.clientWidth + 20;
      if (p.x > hero.clientWidth + 20) p.x = -20;

      ctx.beginPath();
      ctx.fillStyle = `hsla(${p.hue}, 95%, 74%, ${p.alpha})`;
      ctx.shadowColor = `hsla(${p.hue}, 95%, 68%, ${p.alpha})`;
      ctx.shadowBlur = 8;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.shadowBlur = 0;
    rafId = requestAnimationFrame(draw);
  };

  for (let i = 0; i < total; i++) particles.push(createParticle());
  resize();

  // El mouse empuja las partículas un poco para dar sensación de vida.
  const handleMove = (event) => {
    const rect = hero.getBoundingClientRect();
    mouseX = event.clientX - rect.left;
    mouseY = event.clientY - rect.top;
    hasMouse = true;
  };

  const handleLeave = () => {
    hasMouse = false;
  };

  // Encendemos o apagamos la animación según si la hero está visible.
  const start = () => {
    if (running) return;
    running = true;
    rafId = requestAnimationFrame(draw);
  };

  const stop = () => {
    running = false;
    cancelAnimationFrame(rafId);
  };

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) start();
      else stop();
    },
    { threshold: 0.15 }
  );

  window.addEventListener("resize", resize, { passive: true });
  hero.addEventListener("mousemove", handleMove, { passive: true });
  hero.addEventListener("mouseleave", handleLeave);
  observer.observe(hero);
  start();

  const cleanup = () => {
    stop();
    window.removeEventListener("resize", resize);
    hero.removeEventListener("mousemove", handleMove);
    hero.removeEventListener("mouseleave", handleLeave);
    observer.disconnect();
  };

  window.addEventListener("beforeunload", cleanup, { once: true });
}
