import React, { useEffect, useState, useRef } from 'react';
import { Camera, CreditCard, Play, CheckCircle, XCircle, Clock, Check, RefreshCw, X, Image as ImageIcon, CheckCircle2, AlertCircle, Search, Filter, ChevronDown, Eye, FileText } from 'lucide-react';
import { bookingService, type BookingListResult } from '../../services/bookingService';
import type { WashBooking } from '../../types/booking';
import { showError, showSuccess } from '../../utils/toast';
import PaymentModal from '../../components/PaymentModal';
import BookingDetailModal from '../../components/BookingDetailModal';
import CreateChecklistModal from '../../components/CreateChecklistModal';
import { bookingChecklistService } from '../../services/bookingChecklistService';
import { washService } from '../../services/staffWashingStatusService';

const STEPS = [
  { id: 'pending', label: 'Đã xác nhận' },
  { id: 'confirmed', label: 'Đã check-in ' },
  { id: 'checked_in', label: 'Đang rửa' },
  { id: 'in_progress', label: 'Đang rửa' },
  { id: 'washed', label: 'Chờ thanh toán' }
];

export default function StaffBookingListPage() {
  const [data, setData] = useState<BookingListResult>({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);

  // Modal states
  const [paymentModal, setPaymentModal] = useState<{ isOpen: boolean, booking: WashBooking | null }>({ isOpen: false, booking: null });
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean, action: 'confirm' | 'start' | 'start_iot' | 'checkin_manual' | 'washed' | '', booking: WashBooking | null }>({ isOpen: false, action: '', booking: null });
  const [detailModal, setDetailModal] = useState<WashBooking | null>(null);

  const [createChecklistModalBooking, setCreateChecklistModalBooking] = useState<WashBooking | null>(null);
  const [checkinMethodModal, setCheckinMethodModal] = useState<WashBooking | null>(null);
  const [startWashMethodModal, setStartWashMethodModal] = useState<WashBooking | null>(null);
  const [missingChecklistIds, setMissingChecklistIds] = useState<Set<string>>(new Set());
  const [loadingChecklists, setLoadingChecklists] = useState<Set<string>>(new Set());

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'code' | 'plate'>('code');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState(() => {
    const today = new Date();
    const tzOffset = today.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(today.getTime() - tzOffset)).toISOString().split('T')[0];
    return { startDate: localISOTime, endDate: localISOTime };
  });

  // Camera Check-in States & Refs
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [scanTab, setScanTab] = useState<'camera' | 'upload'>('camera');
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{ success: boolean; message: string; license_plate?: string; appointment_id?: string } | null>(null);
  const [manualPlate, setManualPlate] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params: any = { limit: 100 };
      if (statusFilter !== 'all') params.booking_status = statusFilter;

      if (dateRange.startDate) {
        const start = new Date(dateRange.startDate);
        start.setHours(0, 0, 0, 0);
        params.from_date = start.toISOString();
      }
      if (dateRange.endDate) {
        const end = new Date(dateRange.endDate);
        end.setHours(23, 59, 59, 999);
        params.to_date = end.toISOString();
      }

      const res = await bookingService.list(params);
      setData(res);

      // Check checklist status for 'confirmed' bookings
      const confirmedBookings = res.items.filter((b: WashBooking) => b.booking_status === 'confirmed');
      if (confirmedBookings.length > 0) {
        const confirmedIds = confirmedBookings.map((b: WashBooking) => b._id || b.id!);
        setLoadingChecklists(prev => new Set([...prev, ...confirmedIds]));

        Promise.all(
          confirmedBookings.map((b: WashBooking) => {
            const id = b._id || b.id!;
            return bookingChecklistService.getByAppointmentId(id)
              .then(checklist => ({ id, hasChecklist: !!checklist }))
              .catch(() => ({ id, hasChecklist: false }));
          })
        ).then(results => {
          setMissingChecklistIds(prev => {
            const newSet = new Set(prev);
            results.forEach(r => {
              if (!r.hasChecklist) newSet.add(r.id);
              else newSet.delete(r.id);
            });
            return newSet;
          });
          setLoadingChecklists(prev => {
            const newSet = new Set(prev);
            results.forEach(r => newSet.delete(r.id));
            return newSet;
          });
        });
      }

    } catch (error) {
      showError('Không thể tải danh sách booking');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, dateRange]);

  const handleProceedAction = async (activatePump = false) => {
    if (!confirmModal.booking) return;
    const booking = confirmModal.booking;
    const id = booking._id || booking.id!;
    try {
      if (confirmModal.action === 'confirm') await bookingService.confirm(id);
      if (confirmModal.action === 'start') {
        await bookingService.start(id);
      }
      if (confirmModal.action === 'start_iot') {
        const plateNumber = booking.vehicle?.plate_number;
        if (plateNumber) {
          const response = await washService.wash({ plate: plateNumber });
          if (!response.success) {
            throw new Error(response.message || 'Kích hoạt máy bơm thất bại');
          }
        } else {
          throw new Error('Không tìm thấy biển số xe để kích hoạt IoT');
        }
      }
      if (confirmModal.action === 'checkin_manual') {
        await bookingService.checkin(id);
      }
      if (confirmModal.action === 'washed') await bookingService.washed(id);

      showSuccess('Cập nhật trạng thái thành công');
      fetchBookings();
      setConfirmModal({ isOpen: false, action: '', booking: null });
    } catch (error: any) {
      showError(error?.response?.data?.message || error?.message || 'Lỗi khi cập nhật trạng thái');
    }
  };

  // --- CAMERA LOGIC ---
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = mediaStream;
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
    } catch (err) {
      showError('Không thể truy cập camera. Vui lòng cấp quyền hoặc sử dụng tải ảnh lên.');
      setScanTab('upload');
    }
  };
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };
  const openScanModal = () => {
    setIsScanModalOpen(true);
    setScanTab('camera');
    setCapturedFile(null);
    setUploadFile(null);
    setScanResult(null);
    setTimeout(() => startCamera(), 100);
  };
  const closeScanModal = () => {
    stopCamera();
    setIsScanModalOpen(false);
    setManualPlate('');
  };
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (context) {
        const videoWidth = video.videoWidth;
        const videoHeight = video.videoHeight;

        // Crop 90% width and 75% height in the center
        const cropRatioW = 0.9;
        const cropRatioH = 0.75;

        const cropWidth = videoWidth * cropRatioW;
        const cropHeight = videoHeight * cropRatioH;

        const cropX = (videoWidth - cropWidth) / 2;
        const cropY = (videoHeight - cropHeight) / 2;

        canvas.width = cropWidth;
        canvas.height = cropHeight;

        context.drawImage(
          video,
          cropX, cropY, cropWidth, cropHeight,
          0, 0, cropWidth, cropHeight
        );

        canvas.toBlob((blob) => {
          if (blob) setCapturedFile(new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' }));
        }, 'image/jpeg', 0.95);
      }
    }
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setUploadFile(e.target.files[0]);
  };
  const submitCheckinImage = async () => {
    const fileToUpload = scanTab === 'camera' ? capturedFile : uploadFile;
    if (!fileToUpload) return;
    setIsScanning(true);
    try {
      const res = await bookingService.checkinWithCamera(fileToUpload);
      setScanResult(res);
      if (res.success) {
        showSuccess('Check-in xe thành công!');
        fetchBookings();
      } else {
        setManualPlate(res.license_plate || '');
        showError(res.message || 'Không tìm thấy lịch hẹn phù hợp');
      }
    } catch (error: any) {
      const fallbackPlate = error.data?.license_plate || '';
      setScanResult({ success: false, message: error.message || 'Lỗi nhận diện.', license_plate: fallbackPlate });
      setManualPlate(fallbackPlate);
      showError(error.message || 'Check-in thất bại');
    } finally {
      setIsScanning(false);
    }
  };
  const handleManualCheckin = async () => {
    if (!manualPlate.trim()) return showError('Vui lòng nhập biển số xe');
    setIsScanning(true);
    try {
      const plateToSearch = manualPlate.trim().toLowerCase();
      const foundBooking = data.items.find((b: WashBooking) =>
        b.booking_status === 'confirmed' && b.vehicle?.plate_number?.toLowerCase() === plateToSearch
      );
      if (foundBooking) {
        await bookingService.checkin(foundBooking._id || foundBooking.id!);
        showSuccess('Check-in thủ công thành công!');
        setScanResult({ success: true, message: 'Check-in thành công qua biển số nhập tay', license_plate: foundBooking.vehicle?.plate_number });
        fetchBookings();
      } else {
        showError('Không tìm thấy xe đang chờ nhận với biển số này');
      }
    } catch (error: any) {
      showError(error?.response?.data?.message || error?.message || 'Lỗi khi check-in thủ công');
    } finally {
      setIsScanning(false);
    }
  };

  // --- RENDER HELPERS ---
  const getStepIndex = (status: string) => STEPS.findIndex(s => s.id === status);

  const renderStepper = (currentStatus: string) => {
    if (currentStatus === 'cancelled') {
      return (
        <div className="flex items-center text-red-500 font-medium bg-red-50 p-3 rounded-lg border border-red-100">
          <XCircle className="w-5 h-5 mr-2" /> Đơn đã bị hủy
        </div>
      );
    }

    const displayIndex = getStepIndex(currentStatus);

    return (
      <div className="flex items-center w-full overflow-x-auto pb-2 pt-2">
        {STEPS.map((step, index) => {
          const isCompleted = index < displayIndex || currentStatus === 'completed';
          const isCurrent = index === displayIndex;
          const isPending = index > displayIndex && currentStatus !== 'completed';

          return (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 font-semibold text-sm shrink-0 transition-colors duration-300
                ${isCompleted ? 'bg-[#0ea5b7] border-[#0ea5b7] text-white' : ''}
                ${isCurrent && currentStatus !== 'completed' ? 'bg-white border-[#0ea5b7] text-[#0ea5b7] ring-4 ring-cyan-50 shadow-md' : ''}
                ${isPending ? 'bg-gray-50 border-gray-300 text-gray-400' : ''}
              `}>
                {isCompleted ? <Check className="w-4 h-4" /> : index + 1}
              </div>
              <span className={`ml-2 text-sm font-medium whitespace-nowrap hidden sm:block
                ${isCompleted || isCurrent ? 'text-slate-800' : 'text-gray-400'}
              `}>
                {step.label}
              </span>
              {index < STEPS.length - 1 && (
                <div className={`w-6 sm:w-12 h-1 mx-2 rounded-full transition-colors duration-300
                  ${index < displayIndex || currentStatus === 'completed' ? 'bg-[#0ea5b7]' : 'bg-gray-200'}
                `}></div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderActionButtons = (booking: WashBooking) => {
    switch (booking.booking_status) {
      case 'pending':
        return (
          <button onClick={() => setConfirmModal({ isOpen: true, action: 'confirm', booking })} className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors shadow-sm font-medium">
            <CheckCircle className="w-4 h-4 mr-2" /> Xác nhận
          </button>
        );
      case 'confirmed': {
        const id = booking._id || booking.id!;
        const needsChecklist = missingChecklistIds.has(id);
        const isLoadingStatus = loadingChecklists.has(id);

        if (isLoadingStatus) {
          return (
            <button disabled className="flex items-center px-4 py-2 bg-slate-200 text-slate-500 rounded-lg shadow-sm font-medium">
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Đang tải...
            </button>
          );
        }

        if (needsChecklist) {
          return (
            <button
              onClick={() => setCreateChecklistModalBooking(booking)}
              className="flex items-center px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors shadow-sm font-medium"
            >
              <FileText className="w-4 h-4 mr-2" /> Tạo biên bản
            </button>
          );
        }

        return (
          <button
            onClick={() => setCheckinMethodModal(booking)}
            className="flex items-center px-4 py-2 bg-[#0ea5b7] text-white rounded-lg hover:bg-[#0b8fa0] transition-colors shadow-sm font-medium"
          >
            <CheckCircle className="w-4 h-4 mr-2" /> Check-in
          </button>
        );
      }
      case 'checked_in':
        return (
          <button onClick={() => setStartWashMethodModal(booking)} className="flex items-center px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors shadow-sm font-medium">
            <Play className="w-4 h-4 mr-2" /> Bắt đầu rửa
          </button>
        );
      case 'in_progress':
        return (
          <button onClick={() => setConfirmModal({ isOpen: true, action: 'washed', booking })} className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-sm font-medium">
            <CheckCircle className="w-4 h-4 mr-2" /> Báo rửa xong
          </button>
        );
      case 'washed':
        return (
          <button onClick={() => setPaymentModal({ isOpen: true, booking })} className="flex items-center px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors shadow-sm font-medium">
            <CreditCard className="w-4 h-4 mr-2" /> Thanh Toán
          </button>
        );
      case 'completed':
        return (
          <span className="text-green-600 font-semibold flex items-center bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">
            <CheckCircle className="w-5 h-5 mr-1" /> Đã xong
          </span>
        );
      default:
        return null;
    }
  };

  // Client-side search filtering
  const filteredItems = data.items.filter((b: WashBooking) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      const plate = b.vehicle?.plate_number?.toLowerCase() || '';
      const displayId = (b.appointment_code || '').toLowerCase();
      
      const matchPlate = plate.includes(q);
      const matchCode = displayId.includes(q);

      if (searchType === 'code' && !matchCode) return false;
      if (searchType === 'plate' && !matchPlate) return false;
    }
    return true;
  });

  return (
    <div className="p-6 bg-slate-50 min-h-[calc(100vh-80px)] pb-20">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Lịch hẹn </h1>
            <p className="text-slate-500 text-sm mt-1"> Quản lý lịch hẹn của khách hàng.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder={searchType === 'code' ? "Tìm mã đơn..." : "Tìm biển số xe..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 border border-slate-200 rounded-l-lg text-sm text-slate-700 outline-none focus:border-cyan-500 bg-white min-w-[200px]"
              />
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value as any)}
                className="px-2 py-2 border-y border-r border-slate-200 rounded-r-lg text-sm text-slate-700 outline-none focus:border-cyan-500 bg-white cursor-pointer"
              >
                <option value="code">Mã đơn</option>
                <option value="plate">Biển số</option>
              </select>
            </div>

            {/* Filter */}
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"><Filter size={16} /></div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-9 pr-8 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-cyan-500 bg-white appearance-none cursor-pointer"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="pending">Chờ duyệt</option>
                <option value="confirmed">Chờ Check-in</option>
                <option value="checked_in">Đã nhận xe</option>
                <option value="in_progress">Đang rửa</option>
                <option value="washed">Chờ thanh toán</option>
                <option value="completed">Đã hoàn thành</option>
                <option value="cancelled">Đã hủy</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"><ChevronDown size={14} /></div>
            </div>

            {/* Date Range */}
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-sm">
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="text-sm text-slate-700 outline-none bg-transparent cursor-pointer font-medium"
              />
              <span className="text-slate-400 text-xs font-bold">→</span>
              <input
                type="date"
                min={dateRange.startDate}
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="text-sm text-slate-700 outline-none bg-transparent cursor-pointer font-medium"
              />
            </div>

            <button onClick={fetchBookings} className="flex items-center justify-center p-2.5 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-all shadow-sm">
              <RefreshCw size={16} className={loading ? 'animate-spin text-[#0ea5b7]' : ''} />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-10"><RefreshCw className="animate-spin text-cyan-500 mx-auto" size={30} /></div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-10 text-slate-500 bg-white rounded-xl border border-slate-200 font-medium">Không tìm thấy đơn hàng nào phù hợp với bộ lọc.</div>
          ) : (
            filteredItems.map((booking: WashBooking) => {
              const id = booking.appointment_code || 'N/A';
              const date = new Date(booking.scheduled_at);

              return (
                <div key={booking._id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-5">
                    {/* Info */}
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h2 className="text-xl font-extrabold text-slate-900">{booking.vehicle?.plate_number || 'N/A'}</h2>
                        <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 font-bold rounded text-xs border border-slate-200 shadow-sm">
                          #{id}
                        </span>
                        <span className="px-2.5 py-0.5 bg-cyan-50 text-cyan-700 border border-cyan-200 text-xs font-semibold rounded-full truncate max-w-[200px]">
                          {booking.service_package?.name || booking.service_package?.service_name || 'Dịch vụ lẻ'}
                        </span>
                      </div>
                      <div className="flex items-center text-slate-500 text-sm mt-2 font-medium">
                        <Clock className="w-4 h-4 mr-1.5 text-slate-400" />
                        <span>{date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ({date.toLocaleDateString('vi-VN')}) • Khách: <span className="text-slate-700 font-semibold">{booking.customer?.full_name || 'Khách vãng lai'}</span></span>
                      </div>
                    </div>

                    {/* Action */}
                    <div className="shrink-0 flex items-center gap-3">
                      <button
                        onClick={() => setDetailModal(booking)}
                        className="flex items-center px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors shadow-sm font-semibold text-sm"
                      >
                        <Eye className="w-4 h-4 mr-1.5" /> Chi tiết
                      </button>
                      {renderActionButtons(booking)}
                    </div>
                  </div>

                  {/* Stepper */}
                  <div className="pt-5 border-t border-slate-100">
                    {renderStepper(booking.booking_status)}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* MODAL XÁC NHẬN CHUYỂN TRẠNG THÁI (Dùng chung cho confirm / start / checkin_manual) */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-bold text-slate-800 mb-2">
              {confirmModal.action === 'confirm' ? 'Xác nhận đơn' : 'Chuyển trạng thái'}
            </h2>
            <p className="text-slate-600 mb-6 text-sm">
              {confirmModal.action === 'confirm' ? (
                <>
                  Bạn có muốn xác nhận cho đơn 
                  <span className="font-bold ml-1 mr-1">#{confirmModal.booking?.appointment_code || 'N/A'}</span> 
                  hay không?
                </>
              ) : (
                <>
                  Bạn có chắc chắn {confirmModal.action === 'checkin_manual' ? 'Check-in thủ công' : (confirmModal.action === 'start' ? 'bắt đầu rửa xe ' : (confirmModal.action === 'start_iot' ? 'kích hoạt máy bơm' : (confirmModal.action === 'washed' ? 'đánh dấu đã rửa xong' : 'chuyển tiếp trạng thái')))} cho đơn
                  <span className="font-bold ml-1">#{confirmModal.booking?.appointment_code || 'N/A'}</span>?
                </>
              )}
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmModal({ isOpen: false, action: '', booking: null })} className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">Huỷ bỏ</button>
              <button onClick={() => handleProceedAction()} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-1 transition-colors">
                <Check size={16} /> Đồng ý
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL THANH TOÁN */}
      <PaymentModal
        isOpen={paymentModal.isOpen}
        onClose={() => setPaymentModal({ isOpen: false, booking: null })}
        booking={paymentModal.booking!}
        onSuccess={() => {
          setPaymentModal({ isOpen: false, booking: null });
          fetchBookings();
        }}
      />

      {/* MODAL CHI TIẾT ĐƠN HÀNG */}
      <BookingDetailModal
        booking={detailModal}
        isOpen={!!detailModal}
        onClose={() => setDetailModal(null)}
        onPay={(b) => setPaymentModal({ isOpen: true, booking: b })}
      />

      {/* CHỌN PHƯƠNG THỨC CHECK-IN MODAL */}
      {checkinMethodModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-bold text-slate-800 mb-2">Phương thức Check-in</h2>
            <p className="text-slate-600 mb-6 text-sm">
              Đơn <span className="font-bold">#{checkinMethodModal.appointment_code || 'N/A'}</span> đã có biên bản kiểm tra. Vui lòng chọn cách check-in:
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  setCheckinMethodModal(null);
                  openScanModal();
                }}
                className="w-full px-4 py-3 text-sm font-medium text-white bg-[#0ea5b7] hover:bg-[#0b8fa0] rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <Camera size={18} /> Quét bằng Camera AI
              </button>
              <button
                onClick={() => {
                  const booking = checkinMethodModal;
                  setCheckinMethodModal(null);
                  setConfirmModal({ isOpen: true, action: 'checkin_manual', booking });
                }}
                className="w-full px-4 py-3 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <CheckCircle size={18} /> Check-in thủ công
              </button>
              <button onClick={() => setCheckinMethodModal(null)} className="mt-2 text-sm text-slate-500 hover:text-slate-700 underline underline-offset-2">Huỷ bỏ</button>
            </div>
          </div>
        </div>
      )}

      {/* CHỌN PHƯƠNG THỨC BẮT ĐẦU RỬA MODAL */}
      {startWashMethodModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-bold text-slate-800 mb-2">Phương thức Bắt đầu</h2>
            <p className="text-slate-600 mb-6 text-sm">
              Chọn phương thức bắt đầu rửa cho đơn <span className="font-bold">#{startWashMethodModal.appointment_code || 'N/A'}</span>:
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  const booking = startWashMethodModal;
                  setStartWashMethodModal(null);
                  setConfirmModal({ isOpen: true, action: 'start_iot', booking });
                }}
                className="w-full px-4 py-3 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <Play size={18} /> Kích hoạt máy bơm
              </button>
              <button
                onClick={() => {
                  const booking = startWashMethodModal;
                  setStartWashMethodModal(null);
                  setConfirmModal({ isOpen: true, action: 'start', booking });
                }}
                className="w-full px-4 py-3 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <CheckCircle size={18} /> Rửa thủ công
              </button>
              <button onClick={() => setStartWashMethodModal(null)} className="mt-2 text-sm text-slate-500 hover:text-slate-700 underline underline-offset-2">Huỷ bỏ</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TẠO BIÊN BẢN (NẾU CHƯA CÓ) */}
      <CreateChecklistModal
        booking={createChecklistModalBooking}
        isOpen={!!createChecklistModalBooking}
        onClose={() => setCreateChecklistModalBooking(null)}
        onSuccess={() => {
          const booking = createChecklistModalBooking;
          setCreateChecklistModalBooking(null);
          if (booking) {
            const id = booking._id || booking.id!;
            setMissingChecklistIds(prev => {
              const newSet = new Set(prev);
              newSet.delete(id);
              return newSet;
            });
          }
        }}
      />

      {/* CAMERA SCAN MODAL (Nhúng trực tiếp từ StaffCheckinPage) */}
      {isScanModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Camera size={18} className="text-[#0ea5b7]" />
                <h2 className="text-lg font-bold text-slate-800">Quét biển số xe (Check-in)</h2>
              </div>
              <button onClick={closeScanModal} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col">
              {!scanResult ? (
                <>
                  <div className="flex bg-slate-100 p-1 rounded-xl mb-4">
                    <button onClick={() => { setScanTab('camera'); startCamera(); }} className={`flex-1 py-2 text-sm font-medium rounded-lg flex justify-center gap-2 ${scanTab === 'camera' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}><Camera size={16} /> Camera</button>
                    <button onClick={() => { setScanTab('upload'); stopCamera(); }} className={`flex-1 py-2 text-sm font-medium rounded-lg flex justify-center gap-2 ${scanTab === 'upload' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}><ImageIcon size={16} /> Tải ảnh</button>
                  </div>

                  {scanTab === 'camera' ? (
                    <div className="relative aspect-video bg-black rounded-xl overflow-hidden shadow-inner">
                      {!capturedFile ? (
                        <>
                          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-[90%] h-[75%] border-2 border-dashed border-cyan-400 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]"></div>
                          </div>
                          <button onClick={capturePhoto} className="absolute bottom-4 left-1/2 -translate-x-1/2 w-14 h-14 bg-white rounded-full border-4 border-cyan-200 flex items-center justify-center hover:scale-105 transition-transform">
                            <div className="w-10 h-10 bg-cyan-600 rounded-full flex items-center justify-center text-white"><Camera size={20} /></div>
                          </button>
                        </>
                      ) : (
                        <div className="w-full h-full relative flex items-center justify-center bg-slate-900">
                          <img src={URL.createObjectURL(capturedFile)} className="max-h-full object-contain" alt="Captured" />
                          <button onClick={() => setCapturedFile(null)} className="absolute top-3 right-3 p-1.5 bg-black/60 rounded-full text-white"><X size={16} /></button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-slate-200 hover:border-cyan-400 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer bg-slate-50 min-h-[220px]">
                      <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                      {uploadFile ? <span className="font-semibold text-cyan-600">{uploadFile.name}</span> : <span>Chọn ảnh biển số xe</span>}
                    </label>
                  )}

                  {((scanTab === 'camera' && capturedFile) || (scanTab === 'upload' && uploadFile)) && (
                    <button onClick={submitCheckinImage} disabled={isScanning} className="w-full mt-4 py-2.5 bg-cyan-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-cyan-700 transition-colors">
                      {isScanning ? <><RefreshCw size={16} className="animate-spin" /> Đang quét...</> : 'Xác nhận AI Check-in'}
                    </button>
                  )}
                </>
              ) : (
                <div className="text-center">
                  {scanResult.success ? (
                    <>
                      <div className="text-green-500 mb-2 flex justify-center"><CheckCircle2 size={40} /></div>
                      <h3 className="text-xl font-bold mb-2">Check-in thành công</h3>
                      <p className="text-sm font-semibold text-slate-700 mt-4 border p-2 bg-slate-50">Biển số nhận diện: <span className="text-indigo-600">{scanResult.license_plate}</span></p>
                    </>
                  ) : (
                    <>
                      <div className="text-red-500 mb-2 flex justify-center"><AlertCircle size={40} /></div>
                      <h3 className="text-xl font-bold mb-2">Thất bại</h3>
                      <p className="text-sm text-slate-600">{scanResult.message}</p>
                      <input value={manualPlate} onChange={e => setManualPlate(e.target.value)} placeholder="Nhập lại biển số bằng tay" className="w-full p-2 border border-slate-300 rounded-lg mt-4 outline-none focus:border-cyan-500 font-bold uppercase" />
                      <button onClick={handleManualCheckin} disabled={isScanning} className="w-full mt-2 bg-slate-800 hover:bg-slate-900 transition-colors text-white py-2 rounded-lg font-medium">Check-in </button>
                    </>
                  )}
                  <button onClick={() => { setScanResult(null); closeScanModal(); }} className="w-full mt-4 py-2.5 bg-slate-100 hover:bg-slate-200 transition-colors rounded-lg font-medium">Đóng</button>
                </div>
              )}
            </div>

            <canvas ref={canvasRef} className="hidden" />
          </div>
        </div>
      )}
    </div>
  );
}
