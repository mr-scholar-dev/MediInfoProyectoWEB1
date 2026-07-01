function renderSharedUI() {
  const page = document.body.dataset.page || "home";

  const navItems = [
    { href: "index.html", label: "Inicio", key: "home" },
    { href: "buscar.html", label: "Buscar medicamento", key: "buscar" },
    { href: "mis-medicamentos.html", label: "Mis medicamentos", key: "mis" },
    { href: "privacidad-uso.html", label: "Privacidad y uso", key: "privacidad" },
  ];

  const navLinks = navItems
    .map(
      (item) =>
        `<li><a href="${item.href}"${item.key === page ? ' class="active"' : ""}>${item.label}</a></li>`
    )
    .join("");

  // Estado de sesión (simulado con localStorage, ver auth.js).
  const sesionActiva = typeof obtenerSesion === "function" ? obtenerSesion() : null;
  const authBox = sesionActiva
    ? `<div class="nav-auth">
         <span class="nav-auth-saludo">Hola, ${sesionActiva}</span>
         <button type="button" class="nav-auth-logout" onclick="cerrarSesion()">Cerrar sesión</button>
       </div>`
    : `<div class="nav-auth">
         <a href="login.html" class="nav-auth-link">Iniciar sesión</a>
       </div>`;

  const header = document.getElementById("site-header");
  if (header) {
    header.innerHTML = `
      <nav>
        <a href="index.html" class="logo">
          <img src="assets/iconoMediCRcolores.png" alt="MediInfo CR" class="logo-img" />
          MediInfo <span style="color:var(--accent-red)">CR</span>
        </a>
        <ul>${navLinks}</ul>
        ${authBox}
      </nav>
    `;
  }

  const footer = document.getElementById("site-footer");
  if (footer) {
    footer.innerHTML = `
      <footer class="site-footer">
        <div class="footer-inner">

          <div class="footer-top">
            <div class="footer-brand">
              <a href="index.html" class="footer-logo">MediInfo <span style="color:var(--accent-red)">CR</span></a>
              <p>Plataforma educativa para consultar medicamentos comunes, organizar tu lista personal y ubicar centros de salud en Costa Rica.</p>
              <div class="footer-badge">
                <span class="footer-badge-dot"></span>
                Solo uso educativo
              </div>
            </div>

            <div class="footer-links-group">
              <h4>Páginas</h4>
              <a href="index.html">Inicio</a>
              <a href="buscar.html">Buscar medicamento</a>
              <a href="mis-medicamentos.html">Mis medicamentos</a>
              <a href="privacidad-uso.html">Privacidad y uso</a>
              <a href="login.html">${sesionActiva ? "Mi cuenta" : "Iniciar sesión"}</a>
            </div>

            <div class="footer-links-group">
              <h4>Proyecto</h4>
              <span class="footer-info-item">ISW-521 · Amb. Web I</span>
              <span class="footer-info-item">Costa Rica · 2026</span>
              <span class="footer-info-item">Sin cuenta requerida</span>
            </div>
          </div>

          <div class="footer-bottom">
            <span>© 2026 MediInfo CR — Uso exclusivamente educativo</span>
            <span>La información no reemplaza la valoración de un profesional de salud</span>
          </div>

        </div>
      </footer>
    `;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  renderSharedUI();

  const nav = document.querySelector("nav");
  if (!nav) return;

  const onScroll = () => {
    nav.classList.toggle("scrolled", window.scrollY > 20);
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
});
