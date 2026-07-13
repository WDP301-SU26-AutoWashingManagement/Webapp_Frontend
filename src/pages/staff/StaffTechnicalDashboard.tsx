export default function StaffTechnicalDashboard() {
    return (
        <div className="admin-page">
            <div className="admin-page__header">
                <div>
                    <h1 className="admin-page__title">Tổng quan Technical</h1>
                    <p className="admin-page__subtitle">Giao diện quản lý kỹ thuật cho nhân viên technical.</p>
                </div>
            </div>

            <div className="admin-content-grid">
                <div className="admin-card">
                    <div className="admin-card__header">
                        <h2 className="admin-card__title">Booking cần xử lý</h2>
                    </div>
                    <p className="admin-empty-text">Danh sách booking kỹ thuật sẽ hiển thị tại đây.</p>
                </div>
                <div className="admin-card">
                    <div className="admin-card__header">
                        <h2 className="admin-card__title">Xe đang chờ</h2>
                    </div>
                    <p className="admin-empty-text">Thông tin tình trạng xe và ghi chú sẽ hiện ở đây.</p>
                </div>
            </div>
        </div>
    )
}
