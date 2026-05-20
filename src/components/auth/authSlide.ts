import { useRef } from 'react'
import { useLocation } from 'react-router-dom'

export const AUTH_PATHS = ['/login', '/register'] as const

export const authSlideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? '-100%' : '100%',
    opacity: 0,
  }),
}

export function useAuthSlideDirection(): number {
  const { pathname } = useLocation()
  const prevPath = useRef(pathname)
  const direction = useRef(1)

  if (pathname !== prevPath.current) {
    const from = AUTH_PATHS.indexOf(prevPath.current as (typeof AUTH_PATHS)[number])
    const to = AUTH_PATHS.indexOf(pathname as (typeof AUTH_PATHS)[number])
    if (from >= 0 && to >= 0) {
      direction.current = to > from ? 1 : -1
    }
    prevPath.current = pathname
  }

  return direction.current
}
