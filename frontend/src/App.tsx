import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { AppLayout } from './components/layout/AppLayout'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { RoleRoute } from './components/auth/RoleRoute'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'
import { ServicesPage } from './pages/ServicesPage'
import { AppointmentsPage } from './pages/AppointmentsPage'
import { NewAppointmentPage } from './pages/NewAppointmentPage'
import { EmployeesPage } from './pages/EmployeesPage'
import { SchedulesPage } from './pages/SchedulesPage'
import { RestrictionsPage } from './pages/RestrictionsPage'
import { AgendaPage } from './pages/AgendaPage'
import { AppointmentDetailPage } from './pages/AppointmentDetailPage'
import { EditAppointmentPage } from './pages/EditAppointmentPage'
import { RegisterPage } from './pages/RegisterPage'
import { ProfilePage } from './pages/ProfilePage'
import { NotFoundPage } from './pages/NotFoundPage'
import { NewServicePage } from './pages/NewServicePage'
import { EditServicePage } from './pages/EditServicePage'
import { ServiceDetailPage } from './pages/ServiceDetailPage'
import { NewEmployeePage } from './pages/NewEmployeePage'
import { EditEmployeePage } from './pages/EditEmployeePage'
import { EmployeeDetailPage } from './pages/EmployeeDetailPage'
import { AdditionalsPage } from './pages/AdditionalsPage'
import { NewAdditionalPage } from './pages/NewAdditionalPage'
import { AdditionalDetailPage } from './pages/AdditionalDetailPage'
import { EditAdditionalPage } from './pages/EditAdditionalPage'
import { ScheduleDetailPage } from './pages/ScheduleDetailPage'
import { RestrictionDetailPage } from './pages/RestrictionDetailPage'
import { RolesPage, SpecialtiesPage, AppointmentStatusesPage } from './pages/ReadOnlyCatalogPages'
import './index.css'

export default function App() {
  return <BrowserRouter><AuthProvider><Routes>
    <Route path="/login" element={<LoginPage />} /><Route path="/registro" element={<RegisterPage />} />
    <Route element={<ProtectedRoute />}><Route element={<AppLayout />}>
      <Route path="/" element={<DashboardPage />} /><Route path="/servicios" element={<ServicesPage />} /><Route path="/servicios/:id" element={<ServiceDetailPage />} /><Route path="/citas" element={<AppointmentsPage />} /><Route path="/citas/:id" element={<AppointmentDetailPage />} /><Route element={<RoleRoute allowed={['Administrador', 'Empleado']} />}><Route path="/citas/nueva" element={<NewAppointmentPage />} /></Route>
<Route path="/perfil" element={<ProfilePage />} /><Route path="/adicionales" element={<AdditionalsPage />} /><Route path="/adicionales/:id" element={<AdditionalDetailPage />} /><Route path="/roles" element={<RolesPage />} /><Route path="/especialidades" element={<SpecialtiesPage />} /><Route path="/estados-cita" element={<AppointmentStatusesPage />} /><Route element={<RoleRoute allowed={['Administrador']} />}><Route path="/servicios/nuevo" element={<NewServicePage />} /><Route path="/empleados/nuevo" element={<NewEmployeePage />} /><Route path="/empleados/:id" element={<EmployeeDetailPage />} /><Route path="/empleados/:id/editar" element={<EditEmployeePage />} /><Route path="/servicios/:id/editar" element={<EditServicePage />} /><Route path="/adicionales/nuevo" element={<NewAdditionalPage />} /><Route path="/adicionales/:id/editar" element={<EditAdditionalPage />} /></Route><Route element={<RoleRoute allowed={['Administrador', 'Empleado']} />}><Route path="/citas/:id/editar" element={<EditAppointmentPage />} /></Route>
      <Route element={<RoleRoute allowed={['Administrador']} />}><Route path="/empleados" element={<EmployeesPage />} /><Route path="/horarios" element={<SchedulesPage />} /><Route path="/horarios/:id" element={<ScheduleDetailPage />} /><Route path="/restricciones" element={<RestrictionsPage />} /><Route path="/restricciones/:id" element={<RestrictionDetailPage />} /><Route path="/agenda" element={<AgendaPage />} /></Route>
    </Route></Route><Route path="*" element={<NotFoundPage />} />
  </Routes></AuthProvider></BrowserRouter>
}
