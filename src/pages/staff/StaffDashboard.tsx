import { useAuth } from '../../hooks/useAuth'
import { TerminalCronMonitor } from '../../components/manager/TerminalCronMonitor'

export default function StaffDashboard() {
    const { user } = useAuth()
    
    const isManager = user?.role === 'admin' || user?.role === 'boss' || user?.staff_type === 'manager'

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

            <div className="space-y-8 max-w-7xl mx-auto">
                {/* Phần 1: Monitoring Panel (Chỉ Manager/Admin/Boss) */}
                {isManager && (
                    <section>
                        <h2 className="text-lg font-semibold text-slate-800 mb-3">Hệ thống Auto-Scheduling (Node-Cron)</h2>
                        <TerminalCronMonitor />
                    </section>
                )}

                {/* Phần 2: Bảng nhiệm vụ (cho Staff) */}
                {!isManager && (
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
        </div>
    )
}
