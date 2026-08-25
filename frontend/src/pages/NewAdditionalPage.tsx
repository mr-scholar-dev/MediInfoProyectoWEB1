import { Link } from 'react-router-dom'
import { AdditionalForm } from '../modules/catalog/AdditionalForm'

export function NewAdditionalPage() {
  return <section className="page-shell narrow-page"><p className="eyebrow">Catálogo</p><h1>Nuevo servicio adicional</h1><p className="lead">Agregá un extra reutilizable para las citas.</p><AdditionalForm /><Link className="back-link" to="/adicionales">← Volver al catálogo</Link></section>
}
