// Đường dẫn: src/components/PublicPromotions.tsx
import { useEffect, useState } from 'react'
import { Tag, Calendar, Scissors, Sparkles } from 'lucide-react'
import { adminPromotionService } from '../services/adminPromotionService'
import type { Promotion } from '../types/promotion'
import { BorderBeam } from './ui/BorderBeam'

export default function PublicPromotions() {
    const [promotions, setPromotions] = useState<Promotion[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Chỉ lấy các mã Đang hoạt động (is_active: true)
        adminPromotionService.list({ page: 1, limit: 10, is_active: true })
            .then(res => setPromotions(res.items))
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    if (loading || promotions.length === 0) return null

    return (
        <section className="py-16 bg-slate-50 relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 relative z-10">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4 flex items-center justify-center gap-3">
                        <Sparkles className="text-cyan-500" size={32} />
                        Ưu Đãi Đặc Biệt
                        <Sparkles className="text-cyan-500" size={32} />
                    </h2>
                    <p className="text-slate-500">Lưu ngay mã giảm giá để nhận ưu đãi hấp dẫn khi đặt lịch</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {promotions.map(promo => (
                        <div key={promo._id || promo.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col hover:shadow-md transition-shadow relative overflow-hidden group">
                            {/* Trang trí góc */}
                            <div className="absolute -right-6 -top-6 w-24 h-24 bg-cyan-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500" />

                            {promo.type === 'bonus_service' ? (
                                <BorderBeam size={240} duration={8} colorFrom="#3b82f6" colorTo="#0ea5b7" borderWidth={1.5} />
                            ) : (
                                <BorderBeam size={240} duration={8} colorFrom="#a855f7" colorTo="#ec4899" borderWidth={1.5} />
                            )}

                            <div className="relative z-10 flex-1">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="inline-flex items-center gap-2 bg-cyan-100 text-cyan-700 px-3 py-1.5 rounded-lg font-bold tracking-wide">
                                        <Tag size={16} />
                                        {promo.code}
                                    </div>
                                    {promo.type === 'bonus_service' ? (
                                        <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-1 rounded-full flex items-center gap-1">
                                            <Sparkles size={12} /> Tặng dịch vụ
                                        </span>
                                    ) : (
                                        <span className="text-xs font-medium bg-purple-100 text-purple-700 px-2 py-1 rounded-full flex items-center gap-1">
                                            <Scissors size={12} /> Giảm {promo.discount_percentage}%
                                        </span>
                                    )}
                                </div>

                                <h3 className="text-xl font-bold text-slate-800 mb-2">{promo.promotion_name}</h3>
                                <p className="text-slate-500 text-sm mb-6">{promo.description}</p>
                            </div>

                            <div className="relative z-10 mt-auto pt-4 border-t border-slate-100">
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <Calendar size={14} />
                                        <span>HSD: {new Date(promo.end_date).toLocaleDateString('vi-VN')}</span>
                                    </div>
                                    <div className="font-semibold text-slate-700">
                                        Đơn từ {(promo.min_order_amount || 0).toLocaleString('vi-VN')}đ
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
