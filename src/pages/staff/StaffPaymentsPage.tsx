export default function StaffPaymentsPage() {
    return (
        <div className="admin-page">
            <div className="admin-page__header">
                <div>
                    <h1 className="admin-page__title">Thanh toán</h1>
                    <p className="admin-page__subtitle">Xử lý thanh toán tại quầy và hoàn tất đơn hàng.</p>
                </div>
            </div>

            <div className="admin-card">
                <div className="admin-card__header">
                    <h2 className="admin-card__title">Giao diện thanh toán</h2>
                </div>
                <p className="admin-empty-text">Phần form và trạng thái thanh toán sẽ được thêm khi kết nối API.</p>
            </div>
        </div>
    )
}
