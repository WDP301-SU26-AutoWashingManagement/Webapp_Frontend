import { useEffect, useId, useRef, useState } from 'react'
import { Bell, Tag, Calendar, Scissors, Sparkles, Copy } from 'lucide-react'
import { adminPromotionService } from '../services/adminPromotionService'
import type { Promotion } from '../types/promotion'
import { BorderBeam } from './ui/BorderBeam'
import { showSuccess } from '../utils/toast'

export default function PromotionNotifications() {
    const [promotions, setPromotions] = useState<Promotion[]>([])
    const [loading, setLoading] = useState(true)
    const [open, setOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const menuId = useId()

    useEffect(() => {
        adminPromotionService.list({ page: 1, limit: 10, is_active: true })
            .then(res => setPromotions(res.items))
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    useEffect(() => {
        if (!open) return

        const handlePointerDown = (e: MouseEvent) => {
            if (!containerRef.current?.contains(e.target as Node)) {
                setOpen(false)
            }
        }

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(false)
        }

        document.addEventListener('mousedown', handlePointerDown)
        document.addEventListener('keydown', handleEscape)
        return () => {
            document.removeEventListener('mousedown', handlePointerDown)
            document.removeEventListener('keydown', handleEscape)
        }
    }, [open])

    const handleCopy = (code: string, e: React.MouseEvent) => {
        e.stopPropagation()
        navigator.clipboard.writeText(code)
            .then(() => {
                showSuccess(`Đã copy mã ưu đãi: ${code}`)
            })
            .catch(err => {
                console.error('Không thể copy mã: ', err)
            })
    }

    return (
        <div ref={containerRef} className="relative">
            <button
                type="button"
                aria-expanded={open}
                aria-haspopup="menu"
                aria-controls={menuId}
                title="Ưu đãi của bạn"
                onClick={() => setOpen((v) => !v)}
                className="relative flex items-center justify-center h-9 w-9 rounded-full text-slate-600 transition hover:bg-slate-100 hover:text-cyan-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50"
            >
                <Bell size={20} />
                {!loading && promotions.length > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white animate-pulse">
                        {promotions.length}
                    </span>
                )}
            </button>

            {open && (
                <div
                    id={menuId}
                    role="menu"
                    aria-label="Thông báo ưu đãi"
                    className="absolute right-0 top-full z-[60] mt-2 w-80 md:w-96 overflow-hidden rounded-2xl border border-cyan-500/15 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.12)] flex flex-col max-h-[500px]"
                >
                    <div className="border-b border-slate-100 px-4 py-3 bg-slate-50/50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Sparkles className="text-cyan-500" size={16} />
                            <h4 className="text-sm font-bold text-slate-800">Ưu Đãi Đặc Biệt</h4>
                        </div>
                        {!loading && promotions.length > 0 && (
                            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                {promotions.length} ưu đãi
                            </span>
                        )}
                    </div>

                    <div className="overflow-y-auto p-4 flex flex-col gap-3 max-h-[380px] custom-scrollbar">
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
                            </div>
                        ) : promotions.length === 0 ? (
                            <div className="text-center py-8 text-slate-400 text-xs">
                                Hiện tại không có mã giảm giá nào hoạt động.
                            </div>
                        ) : (
                            promotions.map((promo) => (
                                <div
                                    key={promo._id || promo.id}
                                    onClick={(e) => handleCopy(promo.code, e)}
                                    className="bg-white rounded-xl border border-slate-100 p-3.5 flex flex-col hover:border-cyan-200 transition-colors relative overflow-hidden group cursor-pointer shadow-sm hover:shadow-md"
                                >
                                    {/* Trang trí góc */}
                                    <div className="absolute -right-6 -top-6 w-16 h-16 bg-cyan-50/50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500" />

                                    {promo.type === 'bonus_service' ? (
                                        <BorderBeam size={120} duration={8} colorFrom="#3b82f6" colorTo="#0ea5b7" borderWidth={1.2} />
                                    ) : (
                                        <BorderBeam size={120} duration={8} colorFrom="#a855f7" colorTo="#ec4899" borderWidth={1.2} />
                                    )}

                                    <div className="relative z-10 flex-1">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="inline-flex items-center gap-1.5 bg-cyan-50 text-[#0ea5b7] px-2.5 py-1 rounded-lg font-mono text-xs font-bold tracking-wider border border-cyan-100/50">
                                                <Tag size={12} />
                                                {promo.code}
                                            </div>
                                            {promo.type === 'bonus_service' ? (
                                                <span className="text-[10px] font-medium bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                                                    <Sparkles size={10} /> Tặng dịch vụ
                                                </span>
                                            ) : (
                                                <span className="text-[10px] font-medium bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                                                    <Scissors size={10} /> Giảm {promo.discount_percentage}%
                                                </span>
                                            )}
                                        </div>

                                        <h5 className="text-sm font-bold text-slate-800 mb-1 group-hover:text-cyan-600 transition-colors">
                                            {promo.promotion_name}
                                        </h5>
                                        <p className="text-slate-500 text-xs mb-3 line-clamp-2">
                                            {promo.description}
                                        </p>
                                    </div>

                                    <div className="relative z-10 mt-auto pt-2.5 border-t border-slate-100/80 flex items-center justify-between text-[11px]">
                                        <div className="flex items-center gap-1 text-slate-400">
                                            <Calendar size={12} />
                                            <span>HSD: {new Date(promo.end_date).toLocaleDateString('vi-VN')}</span>
                                        </div>
                                        <div className="font-semibold text-slate-600">
                                            Đơn từ {(promo.min_order_amount || 0).toLocaleString('vi-VN')}đ
                                        </div>
                                    </div>

                                    {/* Copy Badge Overlay on Hover */}
                                    <div className="absolute inset-0 bg-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                        <span className="bg-white/95 text-cyan-600 text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm border border-cyan-100 flex items-center gap-1">
                                            <Copy size={10} /> Click để copy mã
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
