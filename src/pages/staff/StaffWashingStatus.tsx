import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import { washService } from "../../services/staffWashingStatusService";
import { showError, showSuccess } from "../../utils/toast";
import { Play, Car, Droplets, Info, Loader2, Siren } from "lucide-react";
import {
  ActionType,
  type NotificationWashingStatus,
} from "../../services/notificationService";
import { env } from "../../config/env";
import { useSSE } from "../../hooks/useSSE";
import StaffWashingBookingCard from "../../components/WashingBookingCard";

export default function StaffWashingStatus() {
  const [loading, setLoading] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [detecting, setDetecting] = useState<string>("");

  const [washingStatus, setWashingStatus] =
    useState<NotificationWashingStatus | null>(null);

  const { data, status } = useSSE<NotificationWashingStatus>(
    `${env.apiBaseUrl}/sse-notifications`,
  );

  useEffect(() => {
    if (data?.type === "washing_status") {
      setWashingStatus(data);
      if (data.action === ActionType.PREPAIRING) {
        setDetecting("Thiết bị chưa được sử dụng");
      }
      if (
        data.action === ActionType.DONE ||
        data.action === ActionType.WASHING
      ) {
        setDetecting("");
      }
    }
  }, [data]);

  const handleStop = async () => {
    setStopping(true);
    try {
      setLoading(true);
      const response = await washService.stop();
      if (response.success) {
        showSuccess(response.message || "Đã gửi yêu cầu dừng máy rửa xe!");
        setStopping(false);
        setLoading(false);
      } else {
        showError(response.message || "Dừng máy thất bại.");
        setStopping(false);
        setLoading(false);
      }
    } catch (error: any) {
      setStopping(false);
      setLoading(false);
      showError(error.message || "Đã xảy ra lỗi khi gửi yêu cầu dừng máy.");
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <div>
          <h1 className="admin-page__title">Hệ thống Điều khiển Rửa xe</h1>
          <p className="admin-page__subtitle">
            Theo dõi trạng thái thiết bị và dừng khẩn cấp.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Card 1: Trạng thái & Điều khiển Bơm */}
        <div className="admin-card md:col-span-6 lg:col-span-5 flex flex-col justify-between">
          {/* Phần trên: Trạng thái Bơm */}
          <div className="flex flex-col border-b border-slate-100">
            <div className="flex items-center gap-2 mb-5">
              <Droplets className="text-[#0ea5b7]" size={20} />
              <span className="admin-stat-card__label" style={{ fontSize: "1rem" }}>
                Trạng thái Bơm
              </span>
            </div>

            <div>
              {washingStatus === null || status === "connecting" ? (
                <div className="flex items-center gap-2 text-slate-500">
                  <Loader2 className="animate-spin text-[#10b981]" size={18} />
                  <span className="text-sm font-semibold">Đang kết nối...</span>
                </div>
              ) : (
                <h3
                  className="admin-stat-card__value"
                  style={{
                    fontFamily: '"Google Sans", "Plus Jakarta Sans", sans-serif',
                    fontWeight: 800,
                  }}
                >
                  {washingStatus.action}
                </h3>
              )}
            </div>
          </div>

          {/* Phần dưới: Dừng khẩn cấp */}
          <div className="flex flex-col gap-4 pt-5 mt-auto">
            <div className="flex items-center gap-2">
              <Siren className="text-[#dc2626]" size={20} />
              <h2 className="admin-card__title" style={{ fontSize: "1rem" }}>
                Dừng khẩn cấp
              </h2>
            </div>

            <button
              type="button"
              onClick={handleStop}
              disabled={loading || stopping || detecting !== ""}
              className="admin-btn admin-btn--primary w-full"
              style={{
                justifyContent: "center",
                padding: "0.75rem",
                fontSize: "0.9rem",
                background: "#dc2626",
                color: "#fff",
                borderColor: "#dc2626",
              }}
            >
              {stopping ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Đang dừng...
                </>
              ) : (
                <>
                  <Info size={18} />
                  Dừng máy
                </>
              )}
            </button>
          </div>
        </div>

        {/* Card 2: Hướng dẫn an toàn */}
        <div className="admin-card md:col-span-6 lg:col-span-7">
          <div
            className="admin-card__header"
            style={{
              marginBottom: "1rem",
              borderBottom: "1px solid #f1f5f9",
              paddingBottom: "0.5rem",
            }}
          >
            <h2
              className="admin-card__title"
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <Info className="text-amber-500" size={18} />
              Hướng dẫn an toàn
            </h2>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
              fontSize: "0.8rem",
              color: "#475569",
              lineHeight: "1.5",
            }}
          >
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  background: "#f1f5f9",
                  fontWeight: "bold",
                  flexShrink: 0,
                }}
              >
                1
              </span>
              <span>
                Đưa xe của khách vào đúng vị trí của băng chuyền rửa xe tự
                động.
              </span>
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  background: "#f1f5f9",
                  fontWeight: "bold",
                  flexShrink: 0,
                }}
              >
                2
              </span>
              <span>
                Yêu cầu khách hàng tắt máy, kéo phanh tay và đóng kín toàn bộ
                cửa kính.
              </span>
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  background: "#f1f5f9",
                  fontWeight: "bold",
                  flexShrink: 0,
                }}
              >
                3
              </span>
              <span>
                Đảm bảo không có người hoặc vật cản đứng gần khu vực vòi phun
                áp lực cao.
              </span>
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  background: "#f1f5f9",
                  fontWeight: "bold",
                  flexShrink: 0,
                }}
              >
                4
              </span>
              <span>
                Nhập biển số xe và bấm nút <strong>Kích hoạt Bơm Nước</strong>{" "}
                để bắt đầu chu trình rửa.
              </span>
            </div>
          </div>
        </div>
      </div>

      <StaffWashingBookingCard/>
    </div>
  );
}
