import { useEffect, useState } from 'react'
import { Droplet, Sparkles, Flame, ShieldCheck, Compass, Wrench, Shield, Car, Info, Clock, ArrowRight } from 'lucide-react'
import { adminServiceService } from '../services/adminServiceService'
import { adminServiceGroupService } from '../services/adminServiceGroupService'
import type { Service } from '../types/service'
import type { ServiceGroup } from '../types/serviceGroup'
import { getApiErrorMessage } from '../utils/errors'
import { useNavigate } from 'react-router-dom'
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
  const navigate = useNavigate()
  const [services, setServices] = useState<Service[]>([])
  const [serviceGroups, setServiceGroups] = useState<ServiceGroup[]>([])
  const [activeGroupId, setActiveGroupId] = useState<string | null>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [servicesRes, groupsRes] = await Promise.all([
          adminServiceService.list({ is_active: true, limit: 100 }),
          adminServiceGroupService.list({ is_active: true, limit: 50 })
        ])
        
        setServices(servicesRes.items)
        setServiceGroups(groupsRes.items)
        setActiveGroupId('all')
      } catch (err) {
        console.error('Failed to load services data', getApiErrorMessage(err))
      } finally {
        setLoading(false)
      }
    }
    void loadData()
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

  if (services.length === 0 || serviceGroups.length === 0) return null

  // Filter services by active group
  const activeServices = activeGroupId === 'all' 
    ? services 
    : services.filter((s) => {
      const groupId = typeof s.service_group_id === 'object' 
        ? (s.service_group_id as any)?._id || (s.service_group_id as any)?.id 
        : s.service_group_id;
      return groupId === activeGroupId;
    })

  return (
    <section className="marketing-section page-section px-6 md:px-16 bg-slate-50/50 backdrop-blur-md relative overflow-hidden" id="services">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <div className="section-label mx-auto">Dịch Vụ Lẻ</div>
          <h2 className="section-title">
            <span className="block">Dịch vụ riêng biệt</span>
            <span className="mt-2 block sm:mt-3">Chăm sóc chi tiết xế yêu</span>
          </h2>
          <p className="section-sub mx-auto mt-4 max-w-2xl">
            Lựa chọn các dịch vụ lẻ phù hợp với nhu cầu phát sinh cụ thể cho chiếc xe của bạn.
          </p>
        </div>

        {/* Tab Groups */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          <button
            onClick={() => setActiveGroupId('all')}
            className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
              activeGroupId === 'all'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-200/50'
                : 'bg-white text-slate-600 hover:bg-cyan-50 hover:text-cyan-700 border border-slate-200 hover:border-cyan-200'
            }`}
          >
            Tất cả
          </button>
          {serviceGroups.map((group) => {
            const id = group._id || group.id
            const isActive = activeGroupId === id
            return (
              <button
                key={id}
                onClick={() => setActiveGroupId(id || null)}
                className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                  isActive
                    ? 'bg-cyan-600 text-white shadow-md shadow-cyan-200/50'
                    : 'bg-white text-slate-600 hover:bg-cyan-50 hover:text-cyan-700 border border-slate-200 hover:border-cyan-200'
                }`}
              >
                {group.group_name}
              </button>
            )
          })}
        </div>

        {/* Services Carousel */}
        <div className="mt-8 mb-6">
          {activeServices.length > 0 ? (
            <ThreeDServiceCarousel
              key={activeGroupId}
              services={activeServices}
              itemCount={activeServices.length >= 5 ? 5 : 3}
              autoplay={true}
              delay={4}
              getServiceIcon={getServiceIcon}
            />
          ) : (
            <div className="text-center py-12 text-slate-500 bg-white/50 rounded-2xl border border-slate-100 border-dashed max-w-3xl mx-auto">
              Chưa có dịch vụ nào trong nhóm này.
            </div>
          )}
        </div>

        {/* Notice */}
        <div className="flex items-center justify-center gap-3 text-sm text-slate-600 bg-cyan-50/50 backdrop-blur-sm border border-cyan-100 rounded-2xl px-6 py-4 mt-8 max-w-3xl mx-auto shadow-sm">
          <Info className="h-5 w-5 text-cyan-600 flex-shrink-0" />
          <span>
            Khách hàng có thể kết hợp nhiều dịch vụ lẻ trong cùng một lần đặt lịch để tiết kiệm thời gian chờ đợi.
          </span>
        </div>
      </div>
    </section>
  )
}
