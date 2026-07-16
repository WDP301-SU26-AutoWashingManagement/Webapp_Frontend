import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import { washService } from "../../services/staffWashingStatusService";
import { showError, showSuccess } from "../../utils/toast";
import { Play, Car, Droplets, Info, Loader2 } from "lucide-react";
import {
  ActionType,
  type NotificationWashingStatus,
} from "../../services/notificationService";
import { env } from "../../config/env";
import { useSSE } from "../../hooks/useSSE";

export default function StaffWashingStatus() {
  const [plate, setPlate] = useState("");
  const [loading, setLoading] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [detecting, setDetecting] = useState<string>("");

  const [washingStatus, setWashingStatus] =
    useState<NotificationWashingStatus | null>(null);

  const { data } = useSSE<NotificationWashingStatus>(
    `${env.apiBaseUrl}/sse-notifications`,
  );

  const plateRegex = /^\d{2}[A-Z]{1,2}\d{0,1}-\d{4,5}$/;
  const isBusy = loading || stopping;

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

  const handlePlateChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();

    setPlate(value);

    if (plateRegex.test(value)) {
      setDetecting("");
    } else {
      setDetecting("Biển số xe không đúng định dạng");
    }
  };

  const handleWash = async () => {
    if (!plate) {
      showError("Vui lòng nhập biển số xe trước khi kích hoạt!");
      return;
    }
    if (!plateRegex.test(plate)) {
      setDetecting("Biển số xe không đúng định dạng");
      return;
    }

    setLoading(true);
    try {
      const response = await washService.wash({ plate: plate });
      if (response.success) {
        showSuccess(response.message || "Kích hoạt máy bơm nước thành công!");
        setPlate(""); // clear input after success
      } else {
        showError(response.message || "Kích hoạt thất bại.");
      }
    } catch (error: any) {
      showError(error.message || "Đã xảy ra lỗi khi gửi yêu cầu rửa xe.");
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    setStopping(true);
    try {
      const response = await washService.stop();
      if (response.success) {
        showSuccess(response.message || "Đã gửi yêu cầu dừng máy rửa xe!");
      } else {
        showError(response.message || "Dừng máy thất bại.");
      }
    } catch (error: any) {
      showError(error.message || "Đã xảy ra lỗi khi gửi yêu cầu dừng máy.");
    } finally {
      setStopping(false);
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
        {/* Card 1: Trạng thái Bơm */}
        <div className="admin-stat-card md:col-span-6 lg:col-span-3 flex flex-col justify-between">
          <div className="admin-stat-card__header">
            <span className="admin-stat-card__label">Trạng thái Bơm</span>
            <div
              className="admin-stat-card__icon-wrap"
              style={{ background: "#ecfdf5", color: "#10b981" }}
            >
              <Droplets size={20} />
            </div>
          </div>
          <h3
            className="admin-stat-card__value mt-auto"
            style={{
              fontFamily: '"Google Sans", "Plus Jakarta Sans", sans-serif',
              fontWeight: 700,
            }}
          >
            {washingStatus?.action}
          </h3>
          {/* <p className="admin-stat-card__trend-label">Hệ thống áp lực nước ổn định</p> */}
        </div>

        {/* Card 2: Dừng khẩn cấp */}
        <div className="admin-card md:col-span-6 lg:col-span-3 flex flex-col justify-between">
          <div
            className="admin-card__header"
            style={{
              marginBottom: "1.25rem",
              borderBottom: "1px solid #f1f5f9",
              paddingBottom: "0.75rem",
            }}
          >
            <h2
              className="admin-card__title"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                fontSize: "1rem",
              }}
            >
              <Droplets className="text-[#0ea5b7]" size={20} />
              Dừng khẩn cấp
            </h2>
          </div>

          <button
            type="button"
            onClick={handleStop}
            disabled={loading || stopping || detecting !== ""}
            className="admin-btn admin-btn--primary w-full mt-auto"
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

        {/* Card 3: Hướng dẫn an toàn */}
        <div className="admin-card md:col-span-12 lg:col-span-6">
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
    </div>
  );
}
