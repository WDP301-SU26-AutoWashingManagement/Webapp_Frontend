import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function AccountPage() {
  const { user } = useAuth()

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-sans text-3xl font-bold text-slate-900">Tài khoản</h1>
      <p className="mt-2 text-slate-600">Thông tin đăng nhập của bạn</p>

      <div className="mt-8 rounded-xl border border-cyan-500/15 bg-white p-6 shadow-sm">
        <dl className="space-y-4 text-sm">
          <div>
            <dt className="font-medium text-slate-500">Họ tên</dt>
            <dd className="mt-1 text-slate-900">{user?.full_name ?? '—'}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-500">Email</dt>
            <dd className="mt-1 text-slate-900">{user?.email ?? '—'}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-500">Vai trò</dt>
            <dd className="mt-1 capitalize text-slate-900">{user?.role ?? 'customer'}</dd>
          </div>
        </dl>
      </div>

      <Link
        to="/"
        className="mt-8 inline-block text-sm font-medium text-[#0ea5b7] no-underline hover:underline"
      >
        ← Về trang chủ
      </Link>
    </main>
  )
}
