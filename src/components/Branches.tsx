import { useState, useEffect } from 'react'
import { MapPin, Phone, Clock, Car } from 'lucide-react'
import { branchService } from '../services/branchService'
import type { Branch } from '../services/branchService'
import { CursorCardsContainer, CursorCard } from './ui/cursor-cards'

export default function Branches() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadBranches() {
      try {
        const data = await branchService.list()
        setBranches(data)
      } catch (error) {
        console.error('Lỗi khi tải danh sách chi nhánh', error)
      } finally {
        setLoading(false)
      }
    }
    void loadBranches()
  }, [])

  if (loading || branches.length === 0) return null

  return (
    <section className="marketing-section page-section px-6 md:px-16" id="locations">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="section-label">Hệ thống</div>
          <h2 className="section-title">Hệ thống chi nhánh AutoWash</h2>
          <p className="section-sub mx-auto max-w-2xl mt-4">
            Với mạng lưới chi nhánh rộng khắp, AutoWash luôn sẵn sàng phục vụ và chăm sóc xế yêu của bạn một cách nhanh chóng và chuyên nghiệp nhất.
          </p>
        </div>

        <CursorCardsContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {branches.map(branch => {
            const id = branch._id || branch.id
            const address = branch.branch_address
            const hasGeo = branch.geo?.latitude && branch.geo?.longitude
            const mapSrc = hasGeo
              ? `https://maps.google.com/maps?q=${branch.geo?.latitude},${branch.geo?.longitude}&hl=vi&z=15&output=embed`
              : ''

            return (
              <CursorCard
                key={id}
                borderColor="rgba(120, 4, 240, 0.15)"
                primaryHue="#50017a"
                secondaryHue="#7506e3"
                illuminationColor="rgba(117, 6, 227, 0.15)"
                illuminationOpacity={0.6}
                className="h-full w-full rounded-3xl overflow-hidden flex flex-col transition-transform hover:-translate-y-1 hover:shadow-md"
              >
                {/* Map embed */}
                <div className="h-48 w-full bg-slate-100 relative">
                  {/* Trạng thái Mở/Đóng cửa */}
                  <div className="absolute top-4 right-4 z-10 pointer-events-none">
                    {branch.is_active !== false ? (
                      <span className="px-3 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full shadow-md">Mở cửa</span>
                    ) : (
                      <span className="px-3 py-1 bg-rose-500 text-white text-xs font-bold rounded-full shadow-md">Đã đóng cửa</span>
                    )}
                  </div>
                  
                  {hasGeo ? (
                    <iframe
                      src={mapSrc}
                      width="100%"
                      height="100%"
                      className="pointer-events-none"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title={`Bản đồ chi nhánh ${address?.street}`}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                      Chưa cập nhật bản đồ
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-start gap-2">
                    <MapPin className="text-[#0ea5b7] shrink-0 mt-1" size={18} />
                    <span>{address?.street}, {address?.ward}, {address?.district}, {address?.city}</span>
                  </h3>

                  <div className="space-y-3 mb-6 flex-1">
                    {branch.branch_phone && (
                      <div className="flex items-center gap-3 text-sm text-slate-600">
                        <Phone size={16} className="text-slate-400 shrink-0" />
                        <span>{branch.branch_phone}</span>
                      </div>
                    )}
                    <div className="flex items-start gap-3 text-sm text-slate-600">
                      <Clock size={16} className="text-slate-400 shrink-0 mt-0.5" />
                      <div>
                        <div>T2 - T6: {branch.operating_time?.default_open} - {branch.operating_time?.default_close}</div>
                        <div className="text-slate-500 mt-1">T7 - CN: {branch.operating_time?.weekend_open} - {branch.operating_time?.weekend_close}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <Car size={16} className="text-slate-400 shrink-0" />
                      <span>{branch.bay_counts} làn phục vụ cùng lúc</span>
                    </div>
                  </div>

                  {hasGeo && (
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${branch.geo?.latitude},${branch.geo?.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-auto block text-center rounded-xl bg-cyan-50 py-2.5 text-sm font-semibold text-[#0ea5b7] hover:bg-cyan-100 transition-colors"
                    >
                      Chỉ đường tới đây
                    </a>
                  )}
                </div>
              </CursorCard>
            )
          })}
        </CursorCardsContainer>
      </div>
    </section>
  )
}
