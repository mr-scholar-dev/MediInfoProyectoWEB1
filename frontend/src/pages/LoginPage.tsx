import { LockKeyhole, Mail } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export function LoginPage() {
  const { login, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [correo, setCorreo] = useState('admin@citas.com')
  const [clave, setClave] = useState('Admin12345')
  const [error, setError] = useState('')

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!correo || !clave) return setError('Completá todos los campos obligatorios.')
    try {
      await login(correo, clave)
      navigate((location.state as { from?: string })?.from || '/')
    } catch {
      setError('No se pudo iniciar sesión.')
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-brand">
        <img className="auth-logo" src="/iconoMediCRcolores.png" alt="MediInfo" />
        <strong>MediInfo</strong>
      </div>
      <Card className="w-full max-w-[432px] gap-0 p-2">
        <CardHeader className="gap-1.5 px-6 pt-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Gestión de citas</p>
          <h1 className="font-display text-3xl font-bold tracking-tight">Bienvenido de vuelta</h1>
          <p className="text-sm text-muted-foreground">Ingresá al espacio de trabajo de tu establecimiento.</p>
        </CardHeader>
        <CardContent className="px-6 pb-6 pt-4">
          <form onSubmit={submit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="correo">Correo electrónico</Label>
              <div className="relative">
                <Mail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input id="correo" type="email" value={correo} onChange={e => setCorreo(e.target.value)} placeholder="admin@citas.com" className="pl-9" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="clave">Contraseña</Label>
              <div className="relative">
                <LockKeyhole size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input id="clave" type="password" value={clave} onChange={e => setClave(e.target.value)} className="pl-9" />
              </div>
            </div>
            {error && <div className="form-error">{error}</div>}
            <Button type="submit" disabled={loading} className="mt-1 w-full">
              {loading ? 'Ingresando...' : 'Iniciar sesión'}
            </Button>
          </form>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            ¿Sos cliente nuevo? <Link to="/registro" className="text-primary hover:text-brand-bright">Crear cuenta</Link>
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
