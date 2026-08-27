// StrictMode ayuda a detectar problemas comunes durante el desarrollo.
import { StrictMode } from 'react'
// createRoot monta la aplicación React en el elemento #root del HTML.
import { createRoot } from 'react-dom/client'
// Tailwind contiene las utilidades de diseño y los estilos globales complementarios.
import './tailwind.css'
import './index.css'
// App contiene las rutas, proveedores y páginas principales de la aplicación.
import App from './App.tsx'

// Busca el contenedor principal definido en index.html y renderiza la aplicación.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* Toda la interfaz comienza desde este componente raíz. */}
    <App />
  </StrictMode>,
)
