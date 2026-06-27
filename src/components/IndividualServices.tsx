import { useEffect, useState } from 'react'
import { Droplet, Sparkles, Flame, ShieldCheck, Compass, Wrench, Shield, Car, Info } from 'lucide-react'
import { adminServiceService } from '../services/adminServiceService'
import type { Service } from '../types/service'
import { getApiErrorMessage } from '../utils/errors'
import ThreeDServiceCarousel from './ui/ThreeDServiceCarousel'

function getServiceIcon(name: string) {
  const normalized = name.toLowerCase()
  if (normalized.includes('rửa') || normalized.includes('wash')) return Droplet
  if (normalized.includes('vệ sinh') || normalized.includes('clean') || normalized.includes('dọn')) return Sparkles
  if (normalized.includes('bóng') || normalized.includes('polish')) return Flame
  if (normalized.includes('phủ') || normalized.includes('ceramic') || normalized.includes('nano') || normalized.includes('coating')) return ShieldCheck
  if (normalized.includes('kính') || normalized.includes('glass')) return Compass
  if (normalized.includes('bảo dưỡng') || normalized.includes('khử') || normalized.includes('lọc')) return Wrench
  if (normalized.includes('khoang máy') || normalized.includes('động cơ') || normalized.includes('máy')) return Shield
  return Car
}

export default function IndividualServices() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadServices() {
      try {
        const res = await adminServiceService.list({ is_active: true, limit: 12 })
        setServices(res.items)
      } catch (err) {
        console.error('Failed to load services', getApiErrorMessage(err))
      } finally {
        setLoading(false)
      }
    }
    void loadServices()
  }, [])

  if (loading) {
    return (
      <section className="marketing-section page-section px-6 md:px-16 bg-slate-50/50 backdrop-blur-md" id="services">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-slate-500 animate-pulse">Đang tải danh sách dịch vụ lẻ...</p>
        </div>
      </section>
    )
  }

  if (services.length === 0) return null

  return (
    <section className="marketing-section page-section px-6 md:px-16 bg-slate-50/50 backdrop-blur-md relative overflow-hidden" id="services">
      <div className="max-w-5xl mx-auto">
        <div className="section-label">Dịch Vụ Lẻ</div>
        <h2 className="section-title">
          <span className="block">Dịch vụ riêng biệt</span>
          <span className="mt-2 block sm:mt-3">Chăm sóc chi tiết xế yêu</span>
        </h2>
        <p className="section-sub">
          Lựa chọn các dịch vụ lẻ phù hợp với nhu cầu phát sinh cụ thể cho chiếc xe của bạn.
        </p>

        <ThreeDServiceCarousel
          services={services}
          itemCount={services.length >= 5 ? 5 : 3}
          autoplay={true}
          delay={4}
          getServiceIcon={getServiceIcon}
        />

        {/* Notice */}
        <div className="flex items-center gap-3 text-sm text-slate-600 bg-cyan-50/50 backdrop-blur-sm border border-cyan-100 rounded-xl px-4 py-3.5 mt-8">
          <Info className="h-5 w-5 text-cyan-600 flex-shrink-0" />
          <span>
            Khách hàng có thể kết hợp nhiều dịch vụ lẻ trong cùng một lần đặt lịch để tiết kiệm thời gian chờ đợi.
          </span>
        </div>
      </div>
    </section>
  )
}
