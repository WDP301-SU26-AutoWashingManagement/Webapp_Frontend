import { Clock, Percent, Star } from 'lucide-react'

export const AUTH_PROMO_COPY = {
  badge: 'ƯU ĐÃI THÀNH VIÊN',
  titleLine1: 'Rửa xe sạch hơn,',
  titleLine2: 'tiết kiệm',
  titleHighlight: 'hơn mỗi ngày',
  description:
    'Đăng nhập để xem ưu đãi độc quyền và tích điểm thưởng dành riêng cho bạn.',
}

export const AUTH_OFFERS = [
  {
    icon: Percent,
    title: 'Có chương trình Khách Hàng thân thiết',
    description: 'Áp dụng cho các thành viên Member, Silver, Gold, Platinum.',
    tag: 'Dành cho mọi người',
    tagClass: 'text-lime-200 bg-lime-400/25 border-lime-300/50',
    accent: {
      card: 'border-lime-400/45 bg-gradient-to-br from-lime-500/30 via-green-600/20 to-emerald-900/30 shadow-[0_8px_32px_rgba(74,222,128,0.18)]',
      icon: 'border-lime-300/50 bg-lime-400/30',
      iconColor: 'text-lime-200',
      description: 'text-lime-50/90',
    },
  },
  {
    icon: Star,
    title: 'Tích điểm đổi quà',
    description: 'Mỗi 10.000đ = 1 điểm. Đủ 100 điểm tặng 1 lần rửa miễn phí.',
    tag: 'Thành viên Vàng',
    tagClass: 'text-amber-100 bg-amber-400/30 border-amber-300/55',
    accent: {
      card: 'border-amber-400/45 bg-gradient-to-br from-amber-500/35 via-amber-600/20 to-orange-900/25 shadow-[0_8px_32px_rgba(251,191,36,0.2)]',
      icon: 'border-amber-300/50 bg-amber-400/35',
      iconColor: 'text-amber-200',
      description: 'text-amber-50/90',
    },
  },
  {
    icon: Clock,
    title: 'Ưu tiên đặt lịch giờ cao điểm',
    description: 'Thành viên được đặt trước 7, 10, 12, 14 ngày so với khách thường.',
    tag: 'Độc quyền',
    tagClass: 'text-violet-100 bg-violet-400/30 border-violet-300/55',
    accent: {
      card: 'border-violet-400/45 bg-gradient-to-br from-violet-500/35 via-purple-600/20 to-indigo-900/25 shadow-[0_8px_32px_rgba(167,139,250,0.2)]',
      icon: 'border-violet-300/50 bg-violet-400/35',
      iconColor: 'text-violet-200',
      description: 'text-violet-50/90',
    },
  },
]
