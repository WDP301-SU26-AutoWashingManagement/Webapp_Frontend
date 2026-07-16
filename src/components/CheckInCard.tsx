import React, { useEffect, useState, useRef } from "react";
import {
  bookingService,
  type BookingListResult,
} from "../services/bookingService";
import type { WashBooking } from "../types/booking";
import { showError, showSuccess } from "../utils/toast";
import { bookingChecklistService } from "../services/bookingChecklistService";
import {
  AlertCircle,
  Camera,
  Check,
  CheckCircle,
  CheckCircle2,
  ChevronDown,
  Clock,
  CreditCard,
  Eye,
  FileText,
  Filter,
  ImageIcon,
  Play,
  RefreshCw,
  Search,
  X,
  XCircle,
} from "lucide-react";
import PaymentModal from "./PaymentModal";
import BookingDetailModal from "./BookingDetailModal";
import CreateChecklistModal from "./CreateChecklistModal";

const STEPS = [
  { id: "pending", label: "Chờ xác nhận" },
  { id: "confirmed", label: "Chờ Check-in" },
  { id: "checked_in", label: "Chờ rửa" },
  { id: "in_progress", label: "Rửa xong" },
  { id: "washed", label: "Thanh toán" },
];

export default function StaffBookingListPage() {
  const [data, setData] = useState<BookingListResult>({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);

  // Modal states
  const [paymentModal, setPaymentModal] = useState<{
    isOpen: boolean;
    booking: WashBooking | null;
  }>({ isOpen: false, booking: null });
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    action: "confirm" | "start" | "checkin_manual" | "washed" | "";
    booking: WashBooking | null;
  }>({ isOpen: false, action: "", booking: null });
  const [detailModal, setDetailModal] = useState<WashBooking | null>(null);

  const [createChecklistModalBooking, setCreateChecklistModalBooking] =
    useState<WashBooking | null>(null);
  const [checkinMethodModal, setCheckinMethodModal] =
    useState<WashBooking | null>(null);
  const [missingChecklistIds, setMissingChecklistIds] = useState<Set<string>>(
    new Set(),
  );
  const [loadingChecklists, setLoadingChecklists] = useState<Set<string>>(
    new Set(),
  );

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState(() => {
    const today = new Date();
    const tzOffset = today.getTimezoneOffset() * 60000;
    const localISOTime = new Date(today.getTime() - tzOffset)
      .toISOString()
      .split("T")[0];
    return { startDate: localISOTime, endDate: localISOTime };
  });

  // Camera Check-in States & Refs
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [scanTab, setScanTab] = useState<"camera" | "upload">("camera");
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{
    success: boolean;
    message: string;
    license_plate?: string;
    appointment_id?: string;
  } | null>(null);
  const [manualPlate, setManualPlate] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params: any = { limit: 100 };
      if (statusFilter !== "all") params.booking_status = statusFilter;

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
      const confirmedBookings = res.items.filter(
        (b: WashBooking) => b.booking_status === "confirmed",
      );
      if (confirmedBookings.length > 0) {
        const confirmedIds = confirmedBookings.map(
          (b: WashBooking) => b._id || b.id!,
        );
        setLoadingChecklists((prev) => new Set([...prev, ...confirmedIds]));

        Promise.all(
          confirmedBookings.map((b: WashBooking) => {
            const id = b._id || b.id!;
            return bookingChecklistService
              .getByAppointmentId(id)
              .then((checklist) => ({ id, hasChecklist: !!checklist }))
              .catch(() => ({ id, hasChecklist: false }));
          }),
        ).then((results) => {
          setMissingChecklistIds((prev) => {
            const newSet = new Set(prev);
            results.forEach((r) => {
              if (!r.hasChecklist) newSet.add(r.id);
              else newSet.delete(r.id);
            });
            return newSet;
          });
          setLoadingChecklists((prev) => {
            const newSet = new Set(prev);
            results.forEach((r) => newSet.delete(r.id));
            return newSet;
          });
        });
      }
    } catch (error) {
      showError("Không thể tải danh sách booking");
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
      if (confirmModal.action === "confirm") await bookingService.confirm(id);
      if (confirmModal.action === "start") {
        await bookingService.start(id);
      }
      if (confirmModal.action === "checkin_manual") {
        await bookingService.checkin(id);
      }
      if (confirmModal.action === "washed") await bookingService.washed(id);

      showSuccess("Cập nhật trạng thái thành công");
      fetchBookings();
      setConfirmModal({ isOpen: false, action: "", booking: null });
    } catch (error: any) {
      showError(
        error?.response?.data?.message ||
          error?.message ||
          "Lỗi khi cập nhật trạng thái",
      );
    }
  };

  // --- CAMERA LOGIC ---
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = mediaStream;
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
    } catch (err) {
      showError(
        "Không thể truy cập camera. Vui lòng cấp quyền hoặc sử dụng tải ảnh lên.",
      );
      setScanTab("upload");
    }
  };
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };
  const openScanModal = () => {
    setIsScanModalOpen(true);
    setScanTab("camera");
    setCapturedFile(null);
    setUploadFile(null);
    setScanResult(null);
    setTimeout(() => startCamera(), 100);
  };
  const closeScanModal = () => {
    stopCamera();
    setIsScanModalOpen(false);
    setManualPlate("");
  };
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            if (blob)
              setCapturedFile(
                new File([blob], "camera-capture.jpg", { type: "image/jpeg" }),
              );
          },
          "image/jpeg",
          0.95,
        );
      }
    }
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setUploadFile(e.target.files[0]);
  };
  const submitCheckinImage = async () => {
    const fileToUpload = scanTab === "camera" ? capturedFile : uploadFile;
    if (!fileToUpload) return;
    setIsScanning(true);
    try {
      const res = await bookingService.checkinWithCamera(fileToUpload);
      setScanResult(res);
      if (res.success) {
        if (res.license_plate) {
          await bookingService.activateWaterPump(res.license_plate);
        }
        showSuccess("Check-in xe thành công và máy bơm đã được kích hoạt!");
        fetchBookings();
      } else {
        setManualPlate(res.license_plate || "");
        showError(res.message || "Không tìm thấy lịch hẹn phù hợp");
      }
    } catch (error: any) {
      const fallbackPlate = error.data?.license_plate || "";
      setScanResult({
        success: false,
        message: error.message || "Lỗi nhận diện.",
        license_plate: fallbackPlate,
      });
      setManualPlate(fallbackPlate);
      showError(error.message || "Check-in thất bại");
    } finally {
      setIsScanning(false);
    }
  };
  const handleManualCheckin = async () => {
    if (!manualPlate.trim()) return showError("Vui lòng nhập biển số xe");
    setIsScanning(true);
    try {
      const plateToSearch = manualPlate.trim().toLowerCase();
      const foundBooking = data.items.find(
        (b: WashBooking) =>
          b.booking_status === "confirmed" &&
          b.vehicle?.plate_number?.toLowerCase() === plateToSearch,
      );
      if (foundBooking) {
        if (foundBooking.vehicle?.plate_number) {
          await bookingService.activateWaterPump(
            foundBooking.vehicle.plate_number,
          );
          showSuccess(
            "Check-in thủ công thành công và máy bơm đã được kích hoạt!",
          );
        } else {
          await bookingService.checkin(foundBooking._id || foundBooking.id!);
          showSuccess("Check-in thủ công thành công!");
        }
        setScanResult({
          success: true,
          message: "Check-in thành công qua biển số nhập tay",
          license_plate: foundBooking.vehicle?.plate_number,
        });
        fetchBookings();
      } else {
        showError("Không tìm thấy xe đang chờ nhận với biển số này");
      }
    } catch (error: any) {
      showError(
        error?.response?.data?.message ||
          error?.message ||
          "Lỗi khi check-in thủ công",
      );
    } finally {
      setIsScanning(false);
    }
  };

  // --- RENDER HELPERS ---
  const getStepIndex = (status: string) =>
    STEPS.findIndex((s) => s.id === status);

  const renderStepper = (currentStatus: string) => {
    if (currentStatus === "cancelled") {
      return (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow">
          <XCircle className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow" />{" "}
          Đơn đã bị hủy
        </div>
      );
    }

    const displayIndex = getStepIndex(currentStatus);

    return (
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow">
        {STEPS.map((step, index) => {
          const isCompleted =
            index < displayIndex || currentStatus === "completed";
          const isCurrent = index === displayIndex;
          const isPending =
            index > displayIndex && currentStatus !== "completed";

          return (
            <div
              key={step.id}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow"
            >
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow">
                {isCompleted ? (
                  <Check className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow" />
                ) : (
                  index + 1
                )}
              </div>
              <span className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow">
                {step.label}
              </span>
              {index < STEPS.length - 1 && (
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow"></div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderActionButtons = (booking: WashBooking) => {
    switch (booking.booking_status) {
      case "pending":
        return (
          <button
            onClick={() =>
              setConfirmModal({ isOpen: true, action: "confirm", booking })
            }
            className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow"
          >
            <CheckCircle className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow" />{" "}
            Xác nhận
          </button>
        );
      case "confirmed": {
        const id = booking._id || booking.id!;
        const needsChecklist = missingChecklistIds.has(id);
        const isLoadingStatus = loadingChecklists.has(id);

        if (isLoadingStatus) {
          return (
            <button
              disabled
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow"
            >
              <RefreshCw className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow" />{" "}
              Đang tải...
            </button>
          );
        }

        if (needsChecklist) {
          return (
            <button
              onClick={() => setCreateChecklistModalBooking(booking)}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow"
            >
              <FileText className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow" />{" "}
              Tạo biên bản
            </button>
          );
        }

        return (
          <button
            onClick={() => setCheckinMethodModal(booking)}
            className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow"
          >
            <CheckCircle className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow" />{" "}
            Check-in
          </button>
        );
      }
      case "checked_in":
        return (
          <button
            onClick={() =>
              setConfirmModal({ isOpen: true, action: "start", booking })
            }
            className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow"
          >
            <Play className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow" />{" "}
            Bắt đầu rửa
          </button>
        );
      case "in_progress":
        return (
          <button
            onClick={() =>
              setConfirmModal({ isOpen: true, action: "washed", booking })
            }
            className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow"
          >
            <CheckCircle className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow" />{" "}
            Báo rửa xong
          </button>
        );
      case "washed":
        return (
          <button
            onClick={() => setPaymentModal({ isOpen: true, booking })}
            className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow"
          >
            <CreditCard className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow" />{" "}
            Thanh Toán
          </button>
        );
      case "completed":
        return (
          <span className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow">
            <CheckCircle className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow" />{" "}
            Đã xong
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
      const plate = b.vehicle?.plate_number?.toLowerCase() || "";
      const id = (b._id ?? b.id!)?.toLowerCase() || "";
      const shortId = id.slice(-6);
      if (!plate.includes(q) && !shortId.includes(q) && !id.includes(q))
        return false;
    }
    return true;
  });

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow">
          <div>
            <h1 className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow">
              Lịch hẹn{" "}
            </h1>
            <p className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow">
              {" "}
              Quản lý lịch hẹn của khách hàng.
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow">
            {/* Search */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow">
              <Search
                className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow"
                size={16}
              />
              <input
                type="text"
                placeholder="Tìm mã đơn, biển số xe..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow"
              />
            </div>

            {/* Filter */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow">
                <Filter size={16} />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow"
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
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow">
                <ChevronDown size={14} />
              </div>
            </div>

            {/* Date Range */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow">
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) =>
                  setDateRange((prev) => ({
                    ...prev,
                    startDate: e.target.value,
                  }))
                }
                className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow"
              />
              <span className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow">
                →
              </span>
              <input
                type="date"
                min={dateRange.startDate}
                value={dateRange.endDate}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, endDate: e.target.value }))
                }
                className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow"
              />
            </div>

            <button
              onClick={fetchBookings}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow"
            >
              <RefreshCw
                size={16}
                className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow"
              />
            </button>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow">
          {loading ? (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow">
              <RefreshCw
                className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow"
                size={30}
              />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow">
              Không tìm thấy đơn hàng nào phù hợp với bộ lọc.
            </div>
          ) : (
            filteredItems.map((booking: WashBooking) => {
              const id = (booking._id ?? booking.id!).slice(-6).toUpperCase();
              const date = new Date(booking.scheduled_at);

              return (
                <div
                  key={booking._id}
                  className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow"
                >
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow">
                    {/* Info */}
                    <div>
                      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow">
                        <h2 className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow">
                          {booking.vehicle?.plate_number || "N/A"}
                        </h2>
                        <span className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow">
                          #{id}
                        </span>
                        <span className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow">
                          {booking.service_package?.name ||
                            booking.service_package?.service_name ||
                            "Dịch vụ lẻ"}
                        </span>
                      </div>
                      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow">
                        <Clock className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow" />
                        <span>
                          {date.toLocaleTimeString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          ({date.toLocaleDateString("vi-VN")}) • Khách:{" "}
                          <span className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow">
                            {booking.customer?.full_name || "Khách vãng lai"}
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Action */}
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow">
                      <button
                        onClick={() => setDetailModal(booking)}
                        className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow"
                      >
                        <Eye className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow" />{" "}
                        Chi tiết
                      </button>
                      {renderActionButtons(booking)}
                    </div>
                  </div>

                  {/* Stepper */}
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow">
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
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow">
            <h2 className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow">
              Chuyển trạng thái
            </h2>
            <p className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow">
              Bạn có chắc chắn{" "}
              {confirmModal.action === "checkin_manual"
                ? "Check-in thủ công"
                : confirmModal.action === "start"
                  ? "bắt đầu rửa"
                  : confirmModal.action === "washed"
                    ? "đánh dấu đã rửa xong"
                    : "chuyển tiếp trạng thái"}{" "}
              cho đơn
              <span className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow">
                #
                {(confirmModal.booking?._id || confirmModal.booking?.id)
                  ?.slice(-6)
                  .toUpperCase()}
              </span>
              ?
            </p>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow">
              <button
                onClick={() =>
                  setConfirmModal({ isOpen: false, action: "", booking: null })
                }
                className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow"
              >
                Huỷ bỏ
              </button>
              <button
                onClick={() => handleProceedAction()}
                className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow"
              >
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
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow">
            <h2 className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow">
              Phương thức Check-in
            </h2>
            <p className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow">
              Đơn{" "}
              <span className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow">
                #
                {(checkinMethodModal._id || checkinMethodModal.id!)
                  ?.slice(-6)
                  .toUpperCase()}
              </span>{" "}
              đã có biên bản kiểm tra. Vui lòng chọn cách check-in:
            </p>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow">
              <button
                onClick={() => {
                  setCheckinMethodModal(null);
                  openScanModal();
                }}
                className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow"
              >
                <Camera size={18} /> Quét bằng Camera AI
              </button>
              <button
                onClick={() => {
                  const booking = checkinMethodModal;
                  setCheckinMethodModal(null);
                  setConfirmModal({
                    isOpen: true,
                    action: "checkin_manual",
                    booking,
                  });
                }}
                className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow"
              >
                <CheckCircle size={18} /> Check-in thủ công
              </button>
              <button
                onClick={() => setCheckinMethodModal(null)}
                className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow"
              >
                Huỷ bỏ
              </button>
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
            setMissingChecklistIds((prev) => {
              const newSet = new Set(prev);
              newSet.delete(id);
              return newSet;
            });
          }
        }}
      />

      {/* CAMERA SCAN MODAL (Nhúng trực tiếp từ StaffCheckinPage) */}
      {isScanModalOpen && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow">
                <Camera
                  size={18}
                  className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow"
                />
                <h2 className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow">
                  Quét biển số xe (Check-in)
                </h2>
              </div>
              <button
                onClick={closeScanModal}
                className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow"
              >
                <X size={18} />
              </button>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow">
              {!scanResult ? (
                <>
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow">
                    <button
                      onClick={() => {
                        setScanTab("camera");
                        startCamera();
                      }}
                      className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow"
                    >
                      <Camera size={16} /> Camera
                    </button>
                    <button
                      onClick={() => {
                        setScanTab("upload");
                        stopCamera();
                      }}
                      className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow"
                    >
                      <ImageIcon size={16} /> Tải ảnh
                    </button>
                  </div>

                  {scanTab === "camera" ? (
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow">
                      {!capturedFile ? (
                        <>
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow"
                          />
                          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow"></div>
                          <button
                            onClick={capturePhoto}
                            className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow"
                          >
                            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow">
                              <Camera size={20} />
                            </div>
                          </button>
                        </>
                      ) : (
                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow">
                          <img
                            src={URL.createObjectURL(capturedFile)}
                            className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow"
                            alt="Captured"
                          />
                          <button
                            onClick={() => setCapturedFile(null)}
                            className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <label className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow">
                      <input
                        type="file"
                        accept="image/*"
                        className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow"
                        onChange={handleFileChange}
                      />
                      {uploadFile ? (
                        <span className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow">
                          {uploadFile.name}
                        </span>
                      ) : (
                        <span>Chọn ảnh biển số xe</span>
                      )}
                    </label>
                  )}

                  {((scanTab === "camera" && capturedFile) ||
                    (scanTab === "upload" && uploadFile)) && (
                    <button
                      onClick={submitCheckinImage}
                      disabled={isScanning}
                      className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow"
                    >
                      {isScanning ? (
                        <>
                          <RefreshCw
                            size={16}
                            className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow"
                          />{" "}
                          Đang quét...
                        </>
                      ) : (
                        "Xác nhận AI Check-in"
                      )}
                    </button>
                  )}
                </>
              ) : (
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow">
                  {scanResult.success ? (
                    <>
                      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow">
                        <CheckCircle2 size={40} />
                      </div>
                      <h3 className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow">
                        Check-in thành công
                      </h3>
                      <p className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow">
                        Biển số nhận diện:{" "}
                        <span className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow">
                          {scanResult.license_plate}
                        </span>
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow">
                        <AlertCircle size={40} />
                      </div>
                      <h3 className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow">
                        Thất bại
                      </h3>
                      <p className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow">
                        {scanResult.message}
                      </p>
                      <input
                        value={manualPlate}
                        onChange={(e) => setManualPlate(e.target.value)}
                        placeholder="Nhập lại biển số bằng tay"
                        className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow"
                      />
                      <button
                        onClick={handleManualCheckin}
                        disabled={isScanning}
                        className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow"
                      >
                        Check-in{" "}
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => {
                      setScanResult(null);
                      closeScanModal();
                    }}
                    className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow"
                  >
                    Đóng
                  </button>
                </div>
              )}
            </div>

            <canvas
              ref={canvasRef}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow"
            />
          </div>
        </div>
      )}
    </div>
  );
}
