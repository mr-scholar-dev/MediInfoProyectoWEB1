import { Compass } from 'lucide-react'; import { Link } from 'react-router-dom'
export function NotFoundPage() { return <main className="auth-page"><section className="auth-card not-found-card"><div className="not-found-icon"><Compass size={30}/></div><p className="eyebrow">Error 404</p><h1>Página no encontrada</h1><p className="auth-subtitle">La ruta que intentaste abrir no existe o ya no está disponible.</p><Link className="primary-button full" to="/">Volver al inicio</Link></section></main> }
// Pantalla mostrada cuando la ruta solicitada no existe.
