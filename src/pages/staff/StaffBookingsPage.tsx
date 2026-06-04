export default function StaffBookingsPage() {
    return (
        <div className="admin-page">
            <div className="admin-page__header">
                <div>
                    <h1 className="admin-page__title">Quản lý booking</h1>
                    <p className="admin-page__subtitle">Xem danh sách booking và chuẩn bị xe cho khách.</p>
                </div>
            </div>

            <div className="admin-card">
                <div className="admin-card__header">
                    <h2 className="admin-card__title">Danh sách booking</h2>
                </div>
                <div className="admin-table-wrap">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Thời gian</th>
                                <th>Khách hàng</th>
                                <th>Xe</th>
                                <th>Trạng thái</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="admin-table__row">
                                <td colSpan={5} className="admin-empty-text">
                                    Chưa có dữ liệu booking. Kết nối API sẽ hiển thị dữ liệu ở đây.
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
