export default function StaffDashboard() {
    return (
        <div className="admin-page">
            <div className="admin-page__header">
                <div>
                    <h1 className="admin-page__title">Tổng quan Staff</h1>
                    <p className="admin-page__subtitle">Bảng điều khiển dành cho nhân viên rửa xe thể chất.</p>
                </div>
            </div>

            <div className="admin-content-grid">
                <div className="admin-card">
                    <div className="admin-card__header">
                        <h2 className="admin-card__title">Nhiệm vụ hôm nay</h2>
                    </div>
                    <p className="admin-empty-text">Danh sách booking và checkin sẽ hiển thị ở đây khi dữ liệu được kết nối.</p>
                </div>

                <div className="admin-card">
                    <div className="admin-card__header">
                        <h2 className="admin-card__title">Trạng thái thanh toán</h2>
                    </div>
                    <p className="admin-empty-text">Thông tin thanh toán và số liệu sẽ xuất hiện ở đây.</p>
                </div>
            </div>
        </div>
    )
}
