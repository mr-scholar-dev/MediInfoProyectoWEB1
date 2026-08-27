// Página contenedora para registrar una nueva cita.
import { ArrowLeft } from 'lucide-react'; import { Link } from 'react-router-dom'; import { AppointmentForm } from '../modules/appointments/AppointmentForm'
export function NewAppointmentPage() { return <section className="page-shell"><Link className="back-link" to="/citas"><ArrowLeft size={14}/> Volver a citas</Link><div className="section-heading"><div><p className="eyebrow">Nueva operación</p><h1>Crear cita</h1><p className="lead">Completá los datos y revisá la disponibilidad antes de guardar.</p></div></div><AppointmentForm/></section> }
// Pantalla contenedora para crear una nueva cita.
