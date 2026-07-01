import React, { useEffect, useState, useRef } from 'react'
import { Check, Eye, Search, RefreshCw, Camera, Upload, X, AlertCircle, CheckCircle2, Image as ImageIcon } from 'lucide-react'
import { bookingService, type BookingListResult } from '../../services/bookingService'
import type { WashBooking } from '../../types/booking'
import { showError, showSuccess } from '../../utils/toast'
import BookingDetailModal from '../../components/BookingDetailModal'
import PaymentModal from '../../components/PaymentModal'

export default function StaffCheckinPage() {
    const [data, setData] = useState<BookingListResult>({ items: [], total: 0 })
    const [loading, setLoading] = useState(true)
    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean, action: 'checkin' | 'cancel' | '', booking: WashBooking | null }>({
        isOpen: false, action: '', booking: null
    })
    const [detailModal, setDetailModal] = useState<WashBooking | null>(null)
    const [paymentModal, setPaymentModal] = useState<{ isOpen: boolean, booking: WashBooking | null }>({ isOpen: false, booking: null })
    const [searchQuery, setSearchQuery] = useState('')

    // Camera Check-in States & Refs
    const [isScanModalOpen, setIsScanModalOpen] = useState(false)
    const [scanTab, setScanTab] = useState<'camera' | 'upload'>('camera')
    const [capturedFile, setCapturedFile] = useState<File | null>(null)
    const [uploadFile, setUploadFile] = useState<File | null>(null)
    const [isScanning, setIsScanning] = useState(false)
    const [scanResult, setScanResult] = useState<{ success: boolean; message: string; license_plate?: string; appointment_id?: string } | null>(null)

    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const streamRef = useRef<MediaStream | null>(null)

    const fetchBookings = async () => {
        setLoading(true)
        try {
            const res = await bookingService.list({ limit: 50 })
            setData(res)
        } catch (error) {
            showError('Không thể tải danh sách booking')
        } finally {
            setLoading(false)
        }
    }

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            })
            streamRef.current = mediaStream
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream
            }
        } catch (err) {
            console.error('Lỗi truy cập camera:', err)
            showError('Không thể truy cập camera. Vui lòng cấp quyền hoặc sử dụng hình ảnh tải lên.')
            setScanTab('upload')
        }
    }

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop())
            streamRef.current = null
        }
    }

    const openScanModal = () => {
        setIsScanModalOpen(true)
        setScanTab('camera')
        setCapturedFile(null)
        setUploadFile(null)
        setScanResult(null)
        setTimeout(() => {
            startCamera()
        }, 100)
    }

    const closeScanModal = () => {
        stopCamera()
        setIsScanModalOpen(false)
    }

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current
            const canvas = canvasRef.current
            const context = canvas.getContext('2d')
            if (context) {
                canvas.width = video.videoWidth
                canvas.height = video.videoHeight
                context.drawImage(video, 0, 0, canvas.width, canvas.height)
                canvas.toBlob((blob) => {
                    if (blob) {
                        const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' })
                        setCapturedFile(file)
                    }
                }, 'image/jpeg', 0.95)
            }
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setUploadFile(e.target.files[0])
        }
    }

    const submitCheckinImage = async () => {
        const fileToUpload = scanTab === 'camera' ? capturedFile : uploadFile
        if (!fileToUpload) return

        setIsScanning(true)
        try {
            const res = await bookingService.checkinWithCamera(fileToUpload)
            setScanResult(res)
            if (res.success) {
                showSuccess('Điểm danh thành công!')
                fetchBookings()
            } else {
                showError(res.message || 'Không tìm thấy lịch hẹn phù hợp')
            }
        } catch (error: any) {
            console.error('Lỗi checkin qua camera:', error)
            setScanResult({
                success: false,
                message: error.message || 'Lỗi kết nối máy chủ AI hoặc hệ thống.'
            })
            showError(error.message || 'Điểm danh thất bại')
        } finally {
            setIsScanning(false)
        }
    }

    const resetScanModal = () => {
        if (scanResult?.success) {
            closeScanModal()
        } else {
            setScanResult(null)
            setCapturedFile(null)
            setUploadFile(null)
            if (scanTab === 'camera') {
                startCamera()
            }
        }
    }

    useEffect(() => {
        fetchBookings()
        return () => {
            stopCamera()
        }
    }, [])

    const handleCheckin = async () => {
        if (!confirmModal.booking) return;
        try {
            await bookingService.checkin(confirmModal.booking._id || confirmModal.booking.id!)
            showSuccess('Đã nhận xe')
            setConfirmModal({ isOpen: false, action: '', booking: null })
            fetchBookings()
        } catch (error) {
            showError('Lỗi khi nhận xe')
        }
    }

    const getStatusText = (status: string) => {
        switch (status) {
            case 'confirmed': return <span className="text-blue-500 font-medium">Đã xác nhận</span>
            default: return status
        }
    }

    const filteredItems = data.items.filter((b: WashBooking) => {
        if (searchQuery) {
            const q = searchQuery.toLowerCase().trim()
            const plate = b.vehicle?.plate_number?.toLowerCase() || ''
            const id = (b._id ?? b.id!)?.toLowerCase() || ''
            const shortId = id.slice(-6)
            if (!plate.includes(q) && !shortId.includes(q) && !id.includes(q)) return false
        }
        return b.booking_status === 'confirmed'
    });

    return (
        <div className="admin-page">
            <div className="admin-page__header flex justify-between items-end">
                <div>
                    <h1 className="admin-page__title">Checkin xe</h1>
                    <p className="admin-page__subtitle">Xác nhận nhận xe từ khách hàng khi khách mang xe tới.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Tìm mã đơn, biển số xe..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-4 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-cyan-500 bg-white min-w-[220px]"
                        />
                    </div>
                    <button
                        onClick={openScanModal}
                        className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all text-sm font-medium shadow-sm shadow-indigo-100"
                    >
                        <Camera size={14} />
                        Quét biển số (Camera)
                    </button>
                    <button
                        onClick={() => fetchBookings()}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-all text-sm font-medium"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin text-cyan-500' : ''} />
                        Làm mới
                    </button>
                </div>
            </div>

            <div className="admin-card">
                <div className="admin-card__header pb-2">
                    <h2 className="admin-card__title">Xe đợi Checkin</h2>
                </div>

                <div className="admin-table-wrap mt-2">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Mã</th>
                                <th>Thời gian</th>
                                <th>Biển số xe</th>
                                <th>Dịch vụ</th>
                                <th>Trạng thái</th>
                                <th className="text-center">Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr className="admin-table__row">
                                    <td colSpan={6} className="admin-empty-text">Đang tải...</td>
                                </tr>
                            ) : filteredItems.length === 0 ? (
                                <tr className="admin-table__row">
                                    <td colSpan={6} className="admin-empty-text">Không có xe nào đang chờ nhận.</td>
                                </tr>
                            ) : (
                                filteredItems.map((b: WashBooking) => {
                                    const id = (b._id ?? b.id!).slice(-6).toUpperCase()
                                    return (
                                        <tr
                                            key={b._id || b.id}
                                            className="admin-table__row group hover:bg-slate-50 transition-colors"
                                        >
                                            <td><div className="text-sm font-bold text-slate-700 group-hover:text-blue-600 transition-colors">#{id}</div></td>
                                            <td>
                                                <div className="text-sm text-slate-900">{new Date(b.scheduled_at).toLocaleDateString('vi-VN')}</div>
                                                <div className="text-xs text-slate-500">{new Date(b.scheduled_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</div>
                                            </td>
                                            <td><div className="text-sm font-bold text-slate-700">{b.vehicle?.plate_number || 'N/A'}</div></td>
                                            <td><div className="text-sm text-slate-600 truncate max-w-[200px]">{b.service_package?.name || b.service_package?.service_name || 'Dịch vụ lẻ'}</div></td>
                                            <td>{getStatusText(b.booking_status)}</td>
                                            <td>
                                                <div className="flex justify-center gap-2 items-center">
                                                    {b.booking_status === 'confirmed' && (
                                                        <button
                                                            onClick={() => setConfirmModal({ isOpen: true, action: 'checkin', booking: b })}
                                                            className="text-xs font-semibold bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded hover:bg-indigo-100 transition shadow-sm flex items-center gap-1.5"
                                                        >
                                                            <Check size={14} /> Nhận xe
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => setDetailModal(b)}
                                                        className="text-xs font-semibold px-3 py-1.5 rounded bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition shadow-sm flex items-center gap-1.5"
                                                    >
                                                        <Eye size={14} /> Chi tiết
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {confirmModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                        <h2 className="text-xl font-bold text-slate-800 mb-2">Chuyển trạng thái</h2>
                        <p className="text-slate-600 mb-6 text-sm">Bạn có chắc Xe của khách đã tới cửa hàng và muốn <strong className="text-indigo-600">Nhận xe</strong> cho đơn <span className="font-bold">#{(confirmModal.booking?._id || confirmModal.booking?.id)?.slice(-6).toUpperCase()}</span>?</p>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setConfirmModal({ isOpen: false, action: '', booking: null })} className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">Huỷ bỏ</button>
                            <button onClick={handleCheckin} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-1">
                                <Check size={16} /> Chính xác
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <PaymentModal
                isOpen={paymentModal.isOpen}
                onClose={() => setPaymentModal({ isOpen: false, booking: null })}
                booking={paymentModal.booking!}
                onSuccess={() => {
                    setPaymentModal({ isOpen: false, booking: null })
                    fetchBookings()
                }}
            />

            <BookingDetailModal
                booking={detailModal}
                isOpen={!!detailModal}
                onClose={() => setDetailModal(null)}
                onPay={(b) => setPaymentModal({ isOpen: true, booking: b })}
            />

            {/* Camera Check-in Modal */}
            {isScanModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                    <Camera size={18} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-800">Quét biển số xe</h2>
                                    <p className="text-xs text-slate-500">Tự động check-in qua camera AI</p>
                                </div>
                            </div>
                            <button
                                onClick={closeScanModal}
                                className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto p-6 flex flex-col">
                            {!scanResult ? (
                                <>
                                    {/* Tab Headers */}
                                    <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setScanTab('camera')
                                                stopCamera()
                                                startCamera()
                                            }}
                                            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${
                                                scanTab === 'camera'
                                                    ? 'bg-white text-slate-800 shadow-sm'
                                                    : 'text-slate-500 hover:text-slate-800'
                                            }`}
                                        >
                                            <Camera size={16} /> Sử dụng Camera
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setScanTab('upload')
                                                stopCamera()
                                            }}
                                            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${
                                                scanTab === 'upload'
                                                    ? 'bg-white text-slate-800 shadow-sm'
                                                    : 'text-slate-500 hover:text-slate-800'
                                            }`}
                                        >
                                            <Upload size={16} /> Tải ảnh lên
                                        </button>
                                    </div>

                                    {/* Scan Body */}
                                    {scanTab === 'camera' ? (
                                        <div className="relative aspect-video bg-black rounded-xl overflow-hidden flex flex-col justify-center items-center group shadow-inner">
                                            {!capturedFile ? (
                                                <>
                                                    <video
                                                        ref={videoRef}
                                                        autoPlay
                                                        playsInline
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <div className="absolute inset-0 border-2 border-dashed border-indigo-400/40 pointer-events-none m-4 rounded-lg flex items-center justify-center">
                                                        <div className="w-48 h-20 border-2 border-indigo-500 rounded-md relative opacity-60">
                                                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded font-medium tracking-wide">KHUNG BIỂN SỐ XE</div>
                                                        </div>
                                                    </div>
                                                    {/* Capture Trigger */}
                                                    <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                                                        <button
                                                            type="button"
                                                            onClick={capturePhoto}
                                                            className="w-14 h-14 bg-white hover:bg-slate-100 rounded-full border-4 border-indigo-200 flex items-center justify-center shadow-lg transition-transform active:scale-95"
                                                        >
                                                            <div className="w-10 h-10 bg-indigo-600 hover:bg-indigo-700 rounded-full flex items-center justify-center text-white">
                                                                <Camera size={20} />
                                                            </div>
                                                        </button>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="w-full h-full relative flex items-center justify-center bg-slate-900">
                                                    <img
                                                        src={URL.createObjectURL(capturedFile)}
                                                        alt="Captured license plate"
                                                        className="max-w-full max-h-full object-contain"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setCapturedFile(null)}
                                                        className="absolute top-3 right-3 p-1.5 bg-black/60 hover:bg-black/80 rounded-full text-white transition-colors"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex-1 flex flex-col justify-center">
                                            {!uploadFile ? (
                                                <label className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50 hover:bg-indigo-50/10 min-h-[220px]">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={handleFileChange}
                                                    />
                                                    <div className="p-3 bg-white shadow-sm border border-slate-100 rounded-xl text-slate-400 mb-3 hover:text-indigo-500">
                                                        <ImageIcon size={24} />
                                                    </div>
                                                    <span className="text-sm font-semibold text-slate-700">Chọn ảnh biển số xe</span>
                                                    <span className="text-xs text-slate-500 mt-1">Kéo thả hoặc click để chọn ảnh (Hỗ trợ JPG, PNG, WEBP)</span>
                                                </label>
                                            ) : (
                                                <div className="relative aspect-video bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center">
                                                    <img
                                                        src={URL.createObjectURL(uploadFile)}
                                                        alt="Uploaded license plate"
                                                        className="max-w-full max-h-full object-contain"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setUploadFile(null)}
                                                        className="absolute top-3 right-3 p-1.5 bg-black/60 hover:bg-black/80 rounded-full text-white transition-colors"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    {((scanTab === 'camera' && capturedFile) || (scanTab === 'upload' && uploadFile)) && (
                                        <div className="mt-6 flex gap-3">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setCapturedFile(null)
                                                    setUploadFile(null)
                                                }}
                                                className="flex-1 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                                                disabled={isScanning}
                                            >
                                                Chụp lại / Chọn ảnh khác
                                            </button>
                                            <button
                                                type="button"
                                                onClick={submitCheckinImage}
                                                className="flex-1 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-100"
                                                disabled={isScanning}
                                            >
                                                {isScanning ? (
                                                    <>
                                                        <RefreshCw size={16} className="animate-spin" /> Đang quét biển số...
                                                    </>
                                                ) : (
                                                    <>
                                                        Xác nhận & Điểm danh
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    )}
                                </>
                            ) : (
                                /* Result View */
                                <div className="flex flex-col items-center text-center py-6">
                                    {scanResult.success ? (
                                        <>
                                            <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-4 animate-bounce">
                                                <CheckCircle2 size={36} />
                                            </div>
                                            <h3 className="text-xl font-bold text-slate-800 mb-2">Check-in Thành Công!</h3>
                                            <p className="text-sm text-slate-600 max-w-sm mb-6">
                                                {scanResult.message}
                                            </p>

                                            <div className="w-full bg-slate-50 rounded-xl p-4 border border-slate-100 text-left mb-6">
                                                <div className="flex justify-between items-center py-1.5 border-b border-slate-200/60">
                                                    <span className="text-xs text-slate-500">Biển số nhận diện</span>
                                                    <span className="text-sm font-bold text-slate-700">{scanResult.license_plate}</span>
                                                </div>
                                                <div className="flex justify-between items-center py-1.5">
                                                    <span className="text-xs text-slate-500">Mã lịch hẹn</span>
                                                    <span className="text-sm font-semibold text-indigo-600">
                                                        #{scanResult.appointment_id?.slice(-6).toUpperCase()}
                                                    </span>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                                                <AlertCircle size={36} />
                                            </div>
                                            <h3 className="text-xl font-bold text-slate-800 mb-2">Không Thể Check-in</h3>
                                            <p className="text-sm text-slate-600 max-w-sm mb-6">
                                                {scanResult.message}
                                            </p>

                                            {scanResult.license_plate && (
                                                <div className="w-full bg-slate-50 rounded-xl p-4 border border-slate-100 text-left mb-6">
                                                    <div className="flex justify-between items-center py-1.5">
                                                        <span className="text-xs text-slate-500">Biển số quét được</span>
                                                        <span className="text-sm font-bold text-slate-700">{scanResult.license_plate}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}

                                    <div className="flex gap-3 w-full">
                                        <button
                                            type="button"
                                            onClick={resetScanModal}
                                            className="flex-1 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                                        >
                                            {scanResult.success ? 'Đóng' : 'Thử lại'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
        </div>
    )
}
