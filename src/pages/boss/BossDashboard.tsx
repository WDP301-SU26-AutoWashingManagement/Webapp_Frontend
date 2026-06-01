export default function BossDashboard() {
  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <h1 className="admin-page__title">Tổng quan Boss</h1>
        <p className="admin-page__subtitle">Chào mừng bạn trở lại, hệ thống đang hoạt động tốt.</p>
      </div>
      <div className="admin-page__content">
        <div style={{ padding: '2rem', background: '#fff', borderRadius: '8px', border: '1px solid #eee' }}>
          <h3>Biểu đồ và số liệu sẽ hiển thị ở đây</h3>
          <p style={{ color: '#666', marginTop: '0.5rem' }}>Boss có quyền xem toàn bộ dữ liệu của hệ thống.</p>
        </div>
      </div>
    </div>
  )
}
