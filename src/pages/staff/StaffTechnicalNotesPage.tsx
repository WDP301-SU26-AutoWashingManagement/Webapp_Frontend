export default function StaffTechnicalNotesPage() {
    return (
        <div className="admin-page">
            <div className="admin-page__header">
                <div>
                    <h1 className="admin-page__title">Ghi chú tình trạng xe</h1>
                    <p className="admin-page__subtitle">Ghi chú chi tiết về tình trạng xe và yêu cầu kỹ thuật.</p>
                </div>
            </div>

            <div className="admin-card">
                <div className="admin-card__header">
                    <h2 className="admin-card__title">Tình trạng xe</h2>
                </div>
                <div className="admin-empty-text" style={{ padding: '2rem' }}>
                    Ghi chú tình trạng sẽ hiển thị tại đây khi kết nối dữ liệu.
                </div>
            </div>
        </div>
    )
}
