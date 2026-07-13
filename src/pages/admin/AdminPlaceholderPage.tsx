import { Construction } from 'lucide-react'

interface PlaceholderPageProps {
  title: string
  description?: string
}

export default function AdminPlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <div>
          <h1 className="admin-page__title">{title}</h1>
          {description && <p className="admin-page__subtitle">{description}</p>}
        </div>
      </div>

      <div className="admin-placeholder">
        <div className="admin-placeholder__icon-wrap">
          <Construction size={40} strokeWidth={1.5} />
        </div>
        <h2 className="admin-placeholder__title">Đang phát triển</h2>
        <p className="admin-placeholder__desc">
          Trang <strong>{title}</strong> đang được xây dựng. Vui lòng quay lại sau.
        </p>
      </div>
    </div>
  )
}
