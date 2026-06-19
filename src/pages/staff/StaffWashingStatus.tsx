import { useState } from "react";
import type { ChangeEvent } from "react";
import { washService } from "../../services/staffWashingStatusService"
import { showError, showSuccess } from "../../utils/toast"
import { Play, Car, Droplets, Info, Loader2, Cpu, CheckCircle } from "lucide-react"

export default function StaffWashingStatus() {
    const [plate, setPlate] = useState('');
    const [loading, setLoading] = useState(false);

    const handlePlateChange = (e: ChangeEvent<HTMLInputElement>) => {
        setPlate(e.target.value);
    };

    const handleWash = async () => {
        const cleanedPlate = plate.trim();
        if (!cleanedPlate) {
            showError('Vui lòng nhập biển số xe trước khi kích hoạt!');
            return;
        }

        setLoading(true);
        try {
            const response = await washService.wash({ plate: cleanedPlate });
            if (response.success) {
                showSuccess(response.message || 'Kích hoạt máy bơm nước thành công!');
                setPlate(''); // clear input after success
            } else {
                showError(response.message || 'Kích hoạt thất bại.');
            }
        } catch (error: any) {
            showError(error.message || 'Đã xảy ra lỗi khi gửi yêu cầu rửa xe.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-page">
            <div className="admin-page__header">
                <div>
                    <h1 className="admin-page__title">Hệ thống Điều khiển Rửa xe</h1>
                    <p className="admin-page__subtitle">Kích hoạt vòi phun nước tự động và theo dõi trạng thái thiết bị.</p>
                </div>
            </div>

            {/* Stat Summary Panel */}
            <div className="admin-stat-grid">
                <div className="admin-stat-card">
                    <div className="admin-stat-card__header">
                        <span className="admin-stat-card__label">Trạng thái Bơm</span>
                        <div className="admin-stat-card__icon-wrap" style={{ background: '#ecfdf5', color: '#10b981' }}>
                            <Droplets size={20} />
                        </div>
                    </div>
                    <h3 className="admin-stat-card__value">Sẵn sàng</h3>
                    <p className="admin-stat-card__trend-label">Hệ thống áp lực nước ổn định</p>
                </div>

                <div className="admin-stat-card">
                    <div className="admin-stat-card__header">
                        <span className="admin-stat-card__label">Hệ thống Auto-Wash</span>
                        <div className="admin-stat-card__icon-wrap" style={{ background: '#eff6ff', color: '#3b82f6' }}>
                            <Cpu size={20} />
                        </div>
                    </div>
                    <h3 className="admin-stat-card__value">Trực tuyến</h3>
                    <p className="admin-stat-card__trend-label">Kết nối phần cứng ổn định</p>
                </div>

                <div className="admin-stat-card">
                    <div className="admin-stat-card__header">
                        <span className="admin-stat-card__label">Cảm biến Vị trí</span>
                        <div className="admin-stat-card__icon-wrap" style={{ background: '#fef3c7', color: '#d97706' }}>
                            <Car size={20} />
                        </div>
                    </div>
                    <h3 className="admin-stat-card__value">Đang chờ</h3>
                    <p className="admin-stat-card__trend-label">Đang chờ xe vào đúng làn</p>
                </div>
            </div>

            <div className="admin-content-grid">
                {/* Cột chính: Điều khiển */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="admin-card">
                        <div className="admin-card__header" style={{ marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                            <h2 className="admin-card__title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
                                <Droplets className="text-[#0ea5b7]" size={20} />
                                Kích hoạt chu kỳ rửa
                            </h2>
                        </div>

                        <div className="admin-form-group" style={{ marginBottom: '1.25rem' }}>
                            <label className="admin-form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                Biển số xe cần rửa
                            </label>
                            <div className="admin-search-wrap" style={{ maxWidth: '100%' }}>
                                <Car className="admin-search-icon" size={16} />
                                <input
                                    type="text"
                                    value={plate}
                                    onChange={handlePlateChange}
                                    className="admin-search-input"
                                    placeholder="Nhập biển số xe (VD: 29A-12345)"
                                    style={{ paddingLeft: '2.5rem', textTransform: 'uppercase' }}
                                    disabled={loading}
                                />
                            </div>
                            <span className="admin-form-hint">Vui lòng kiểm tra kỹ biển số xe trước khi kích hoạt máy bơm.</span>
                        </div>

                        <button
                            className="admin-btn admin-btn--primary"
                            onClick={handleWash}
                            disabled={loading || !plate.trim()}
                            style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', fontSize: '0.9rem' }}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin" size={18} />
                                    Đang kích hoạt...
                                </>
                            ) : (
                                <>
                                    <Play size={18} />
                                    Kích hoạt Bơm Nước
                                </>
                            )}
                        </button>
                    </div>

                    {/* Card tình trạng xe */}
                    <div className="admin-card">
                        <div className="admin-card__header pb-2" style={{ borderBottom: '1px solid #f1f5f9', marginBottom: '0.75rem' }}>
                            <h2 className="admin-card__title">Nhật ký hoạt động rửa xe gần đây</h2>
                        </div>
                        <div className="admin-empty-text" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                            <CheckCircle size={32} className="text-[#94a3b8]" />
                            <span>Tình trạng rửa xe sẽ hiển thị tại đây khi kết nối dữ liệu thời gian thực.</span>
                        </div>
                    </div>
                </div>

                {/* Cột phụ: Hướng dẫn an toàn & quy trình */}
                <div className="admin-card" style={{ height: 'fit-content' }}>
                    <div className="admin-card__header" style={{ marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                        <h2 className="admin-card__title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Info className="text-amber-500" size={18} />
                            Hướng dẫn an toàn
                        </h2>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.8rem', color: '#475569', lineHeight: '1.5' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', borderRadius: '50%', background: '#f1f5f9', fontWeight: 'bold', flexShrink: 0 }}>1</span>
                            <span>Đưa xe của khách vào đúng vị trí của băng chuyền rửa xe tự động.</span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', borderRadius: '50%', background: '#f1f5f9', fontWeight: 'bold', flexShrink: 0 }}>2</span>
                            <span>Yêu cầu khách hàng tắt máy, kéo phanh tay và đóng kín toàn bộ cửa kính.</span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', borderRadius: '50%', background: '#f1f5f9', fontWeight: 'bold', flexShrink: 0 }}>3</span>
                            <span>Đảm bảo không có người hoặc vật cản đứng gần khu vực vòi phun áp lực cao.</span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', borderRadius: '50%', background: '#f1f5f9', fontWeight: 'bold', flexShrink: 0 }}>4</span>
                            <span>Nhập biển số xe và bấm nút <strong>Kích hoạt Bơm Nước</strong> để bắt đầu chu trình rửa.</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}   