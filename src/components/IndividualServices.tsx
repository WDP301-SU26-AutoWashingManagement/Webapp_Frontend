import { useEffect, useState, useMemo } from 'react'
import { Droplet, Sparkles, Flame, ShieldCheck, Compass, Wrench, Shield, Car, Info } from 'lucide-react'
import { adminServiceService } from '../services/adminServiceService'
import { adminServiceGroupService } from '../services/adminServiceGroupService'
import type { Service } from '../types/service'
import type { ServiceGroup } from '../types/serviceGroup'
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
  const [groups, setGroups] = useState<ServiceGroup[]>([])
  const [activeGroupId, setActiveGroupId] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [servicesRes, groupsRes] = await Promise.all([
          adminServiceService.list({ is_active: true, limit: 100 }),
          adminServiceGroupService.list({ is_active: true, limit: 50 })
        ])
        setServices(servicesRes.items)
        setGroups(groupsRes.items)
      } catch (err) {
        console.error('Failed to load services data', getApiErrorMessage(err))
      } finally {
        setLoading(false)
      }
    }
    void loadData()
  }, [])

  const filteredServices = useMemo(() => {
    if (activeGroupId === 'all') return services
    return services.filter(s => s.service_group_id === activeGroupId)
  }, [services, activeGroupId])

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
        <p className="section-sub mb-8">
          Lựa chọn các dịch vụ lẻ phù hợp với nhu cầu phát sinh cụ thể cho chiếc xe của bạn.
        </p>

        {/* Tabs for Service Groups */}
        {groups.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
            <button
              onClick={() => setActiveGroupId('all')}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                activeGroupId === 'all'
                  ? 'bg-[#0ea5b7] text-white shadow-md shadow-cyan-500/20'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-cyan-50 hover:text-cyan-600'
              }`}
            >
              Tất cả
            </button>
            {groups.map((group) => {
              const groupId = group.id || group._id || '';
              return (
                <button
                  key={groupId}
                  onClick={() => setActiveGroupId(groupId)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                    activeGroupId === groupId
                      ? 'bg-[#0ea5b7] text-white shadow-md shadow-cyan-500/20'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-cyan-50 hover:text-cyan-600'
                  }`}
                >
                  {group.group_name}
                </button>
              )
            })}
          </div>
        )}

        {filteredServices.length > 0 ? (
          <ThreeDServiceCarousel
            key={activeGroupId}
            services={filteredServices}
            itemCount={filteredServices.length >= 5 ? 5 : 3}
            autoplay={true}
            delay={4}
            getServiceIcon={getServiceIcon}
          />
        ) : (
          <div className="text-center py-12 text-slate-500">
            Không có dịch vụ nào trong nhóm này.
          </div>
        )}

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
