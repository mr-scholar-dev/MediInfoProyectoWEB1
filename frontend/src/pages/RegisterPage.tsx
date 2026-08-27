import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ nombre: '', primerApellido: '', segundoApellido: '', correo: '', telefono: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const update = (key: string, value: string) => setForm(current => ({ ...current, [key]: value }))

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    if (!form.nombre || !form.primerApellido || !form.correo || !form.password) return setError('Completá todos los campos obligatorios.')
    if (form.password.length < 8 || !/[A-Z]/.test(form.password) || !/[a-z]/.test(form.password) || !/[0-9]/.test(form.password)) return setError('La contraseña debe tener 8 caracteres, mayúscula, minúscula y número.')
    if (form.password !== form.confirm) return setError('Las contraseñas no coinciden.')
    setSaving(true)
    try {
      await api.create('/usuarios/registro', { nombre: form.nombre, primerApellido: form.primerApellido, segundoApellido: form.segundoApellido || null, correo: form.correo, telefono: form.telefono || null, password: form.password })
      navigate('/login')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const field = (key: keyof typeof form, label: string, opts: { type?: string; required?: boolean } = {}) => (
    <div className="grid gap-2">
      <Label htmlFor={key}>{label}{opts.required && ' *'}</Label>
      <Input id={key} type={opts.type ?? 'text'} value={form[key]} onChange={e => update(key, e.target.value)} />
    </div>
  )

  return (
    <main className="auth-page">
      <div className="auth-brand">
        <img className="auth-logo" src="/iconoMediCRcolores.png" alt="MediInfo" />
        <strong>MediInfo</strong>
      </div>
      <Card className="w-full max-w-[480px] gap-0 p-2">
        <CardHeader className="gap-1.5 px-6 pt-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Registro público</p>
          <h1 className="font-display text-3xl font-bold tracking-tight">Crear cuenta</h1>
          <p className="text-sm text-muted-foreground">El registro público crea únicamente usuarios con rol Cliente.</p>
        </CardHeader>
        <CardContent className="px-6 pb-6 pt-4">
          <form onSubmit={submit} className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {field('nombre', 'Nombre', { required: true })}
              {field('primerApellido', 'Primer apellido', { required: true })}
            </div>
            {field('segundoApellido', 'Segundo apellido')}
            {field('correo', 'Correo electrónico', { type: 'email', required: true })}
            {field('telefono', 'Teléfono')}
            <div className="grid gap-4 sm:grid-cols-2">
              {field('password', 'Contraseña', { type: 'password', required: true })}
              {field('confirm', 'Confirmar', { type: 'password', required: true })}
            </div>
            {error && <div className="form-error">{error}</div>}
            <Button type="submit" disabled={saving} className="mt-1 w-full">
              {saving ? 'Registrando...' : 'Crear cuenta'}
            </Button>
          </form>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            <Link to="/login" className="text-primary hover:text-brand-bright">Ya tengo una cuenta</Link>
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
// Formulario público para registrar nuevos clientes.
