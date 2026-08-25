import { LoaderCircle } from 'lucide-react'
export function LoadingState({ label = 'Cargando información...' }: { label?: string }) { return <div className="empty-state"><LoaderCircle size={24} className="spin" /><p>{label}</p></div> }
