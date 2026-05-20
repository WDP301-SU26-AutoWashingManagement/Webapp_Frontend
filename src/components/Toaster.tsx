import { useLocation } from 'react-router-dom'
import { Toaster as SonnerToaster } from 'sonner'

const AUTH_PATHS = ['/login', '/register', '/forgot-password']

export default function Toaster() {
  const { pathname } = useLocation()
  const hasNav = !AUTH_PATHS.includes(pathname)

  const offset = hasNav
    ? { top: 'calc(var(--nav-height) + 0.5rem)', right: '1.5rem' }
    : { top: '1rem', right: '1rem' }

  const mobileOffset = hasNav
    ? { top: 'calc(var(--nav-height-mobile) + 0.5rem)', right: '1rem' }
    : { top: '0.75rem', right: '0.75rem' }

  return (
    <SonnerToaster
      position="top-right"
      richColors
      expand={false}
      offset={offset}
      mobileOffset={mobileOffset}
      toastOptions={{
        classNames: {
          toast: 'font-sans text-sm shadow-lg border',
          title: 'font-medium',
          description: 'text-slate-600',
        },
      }}
    />
  )
}
