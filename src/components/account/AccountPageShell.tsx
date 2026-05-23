import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

interface AccountPageShellProps {
  title: string
  description: string
  action?: ReactNode
  children: ReactNode
}

export default function AccountPageShell({
  title,
  description,
  action,
  children,
}: AccountPageShellProps) {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-sans text-3xl font-bold text-slate-900">{title}</h1>
          <p className="mt-2 text-slate-600">{description}</p>
        </div>
        {action}
      </div>
      <div className="mt-8 space-y-6">{children}</div>
      <Link
        to="/"
        className="mt-10 inline-block text-sm font-medium text-[#0ea5b7] no-underline hover:underline"
      >
        ← Về trang chủ
      </Link>
    </main>
  )
}
