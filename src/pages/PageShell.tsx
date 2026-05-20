import type { ReactNode } from 'react'

interface PageShellProps {
  children: ReactNode
}

export default function PageShell({ children }: PageShellProps) {
  return <main className="page-section">{children}</main>
}
