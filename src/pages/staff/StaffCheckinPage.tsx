export default function StaffCheckinPage() {
    return (
        <div className="admin-page">
            <div className="admin-page__header">
                <div>
                    <h1 className="admin-page__title">Checkin xe</h1>
                    <p className="admin-page__subtitle">Xác nhận xe đến và bắt đầu quy trình rửa.</p>
                </div>
            </div>

            <div className="admin-card">
                <div className="admin-card__header">
                    <h2 className="admin-card__title">Danh sách xe cần checkin</h2>
                </div>
                <div className="admin-empty-text" style={{ padding: '2rem' }}>

                </div>
            </div>
        </div>
    )
}
