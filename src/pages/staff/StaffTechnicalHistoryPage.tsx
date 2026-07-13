export default function StaffTechnicalHistoryPage() {
    return (
        <div className="admin-page">
            <div className="admin-page__header">
                <div>
                    <h1 className="admin-page__title">Lịch sử xe</h1>
                    <p className="admin-page__subtitle">Xem lịch sử xử lý và trạng thái xe đã từng phục vụ.</p>
                </div>
            </div>

            <div className="admin-card">
                <div className="admin-card__header">
                    <h2 className="admin-card__title">Lịch sử dịch vụ</h2>
                </div>
                <div className="admin-table-wrap">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Xe</th>
                                <th>Ngày</th>
                                <th>Dịch vụ</th>
                                <th>Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="admin-table__row">
                                <td colSpan={4} className="admin-empty-text">
                                    Lịch sử xe sẽ hiển thị ở đây khi có dữ liệu.
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
