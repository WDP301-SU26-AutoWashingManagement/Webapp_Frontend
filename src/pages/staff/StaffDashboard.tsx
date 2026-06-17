import { useAuth } from '../../hooks/useAuth'
import { TerminalCronMonitor } from '../../components/manager/TerminalCronMonitor'
import { LeaveDaysTable } from '../../components/manager/LeaveDaysTable'

export default function StaffDashboard() {
    const { user } = useAuth()
    
    // Giả sử user.role hoặc user.staff_type lưu thông tin phân quyền
    // Bạn có thể đổi điều kiện này cho khớp với dữ liệu thật trong DB của bạn
    const isManager = true // Tạm thời để true để bạn test UI, sau này đổi thành: user?.role === 'manager' hoặc user?.staff_type === 'manager'

    return (
        <div className="admin-page p-6 space-y-8 bg-slate-50 min-h-screen">
            <div className="admin-page__header">
                <div>
                    <h1 className="admin-page__title">Tổng quan {isManager ? 'Manager' : 'Staff'}</h1>
                    <p className="admin-page__subtitle">
                        {isManager ? 'Bảng điều khiển quản lý và phân ca làm việc.' : 'Bảng điều khiển dành cho nhân viên rửa xe.'}
                    </p>
                </div>
            </div>

            {/* Nếu là Manager thì hiển thị Component vừa tạo */}
            {isManager ? (
                <div className="space-y-8 max-w-7xl mx-auto">
                    {/* Phần 1: Monitoring Panel */}
                    <section>
                        <h2 className="text-lg font-semibold text-slate-800 mb-3">Hệ thống Auto-Scheduling (Node-Cron)</h2>
                        <TerminalCronMonitor />
                    </section>

                    {/* Phần 4: Bảng ngày phép */}
                    <section>
                        <LeaveDaysTable />
                    </section>
                </div>
            ) : (
                <div className="admin-content-grid">
                    <div className="admin-card">
                        <div className="admin-card__header">
                            <h2 className="admin-card__title">Nhiệm vụ hôm nay</h2>
                        </div>
                        <p className="admin-empty-text">Chưa có nhiệm vụ</p>
                    </div>

                    <div className="admin-card">
                        <div className="admin-card__header">
                            <h2 className="admin-card__title">Trạng thái thanh toán</h2>
                        </div>
                        <p className="admin-empty-text">.</p>
                    </div>
                </div>
            )}
        </div>
    )
}
