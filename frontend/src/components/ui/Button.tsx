import type { ButtonHTMLAttributes, ReactNode } from 'react'; import { cn } from '../../lib/cn'
type Props = ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode; variant?: 'primary' | 'secondary' | 'danger' }
export function Button({ children, variant = 'primary', className, ...props }: Props) { return <button className={cn(variant === 'primary' ? 'primary-button' : variant === 'secondary' ? 'secondary-button' : 'danger-button', className)} {...props}>{children}</button> }
