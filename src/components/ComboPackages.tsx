import { useEffect, useState } from 'react'
import { Check, Info } from 'lucide-react'
import { adminServicePackageService } from '../services/adminServicePackageService'
import type { ServicePackage } from '../types/servicePackage'
import { getApiErrorMessage } from '../utils/errors'

export interface PackageWithDetails extends ServicePackage {
  services: any[]
  basePrice: number
  finalPrice: number
}

export default function ComboPackages() {
  const [packages, setPackages] = useState<PackageWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadPackages() {
      try {
        const res = await adminServicePackageService.list({ is_active: true, limit: 12 })

        const packagesWithDetails = await Promise.all(
          res.items.map(async (pkg) => {
            const services = await adminServicePackageService.listDetailedServicesByPackage(pkg._id || pkg.id || '')
            const basePrice = services.reduce((sum, s) => sum + (Number(s.service_price) || 0), 0)
            const discount = Number(pkg.package_discount_percentage) || 0
            const finalPrice = basePrice * (1 - discount / 100)
            return {
              ...pkg,
              services,
              basePrice,
              finalPrice,
            }
          })
        )
        setPackages(packagesWithDetails)
      } catch (err) {
        console.error('Failed to load packages', getApiErrorMessage(err))
      } finally {
        setLoading(false)
      }
    }
    void loadPackages()
  }, [])

  if (loading) {
    return (
      <section className="marketing-section page-section px-6 md:px-16 bg-white" id="combos">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-slate-500 animate-pulse">Đang tải các gói dịch vụ...</p>
        </div>
      </section>
    )
  }

  if (packages.length === 0) return null

  return (
    <section className="marketing-section page-section px-6 md:px-16 bg-white/35 backdrop-blur-md" id="combos">
      <div className="max-w-5xl mx-auto">
        <div className="section-label">Gói Dịch Vụ - Combo</div>
        <h2 className="section-title">
          <span className="block">Giải pháp toàn diện</span>
          <span className="mt-2 block sm:mt-3">Cho phương tiện của bạn</span>
        </h2>
        <p className="section-sub">Tiết kiệm thời gian và chi phí với các gói dịch vụ được thiết kế tối ưu.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 mt-12">
          {packages.map((pkg) => (
            <div
              key={pkg.id || pkg._id}
              className="relative flex flex-col rounded-2xl bg-white p-6 transition-all duration-200 hover:-translate-y-1 ring-1 ring-gray-200 shadow-sm hover:shadow-md hover:ring-cyan-500/50"
            >
              {/* Card Header */}
              <div className="mb-4">
                <div className="flex items-start mb-2">
                  <h3 className="text-xl font-bold text-slate-900 line-clamp-2 min-h-[56px] w-full pr-2">
                    {pkg.package_name}
                  </h3>
                </div>
                <p className="text-base text-slate-500 min-h-[40px] line-clamp-2">{pkg.description}</p>
              </div>

              {/* Price & Action */}
              <div className="mb-6 flex flex-col gap-1">
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-black tracking-tight text-[#0ea5b7]">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(pkg.finalPrice)}
                  </span>
                  {pkg.package_discount_percentage > 0 && pkg.basePrice > 0 && (
                    <span className="text-sm text-slate-400 line-through mb-1">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(pkg.basePrice)}
                    </span>
                  )}
                </div>
                {pkg.package_discount_percentage > 0 && pkg.basePrice > 0 && (
                  <div className="mt-1">
                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                      Tiết kiệm {pkg.package_discount_percentage}%
                    </span>
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="border-t border-gray-100 mb-6" />

              {/* Perks placeholder / Services List */}
              <div className="flex-1 flex flex-col gap-3">
                <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#0ea5b7]" />
                  Bao gồm các dịch vụ:
                </h4>
                <ul className="text-sm text-slate-600 leading-relaxed flex flex-col gap-2">
                  {pkg.services.length > 0 ? (
                    pkg.services.map((s, idx) => (
                      <li key={s._id || idx} className="flex items-start gap-2">
                        <span className="text-slate-400 mt-1 flex-shrink-0">•</span>
                        <span>{s.service_name}</span>
                      </li>
                    ))
                  ) : (
                    <li className="italic text-slate-400">Chưa có dịch vụ nào</li>
                  )}
                </ul>
              </div>

              <div className="mt-6 pt-6">
                <a
                  href="/register"
                  className="block w-full rounded-xl bg-[#0ea5b7] px-4 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-[#0c8fa0]"
                >
                  Đăng ký ngay
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Notice */}
        <div className="flex items-center gap-3 text-sm text-slate-600 bg-cyan-50/50 backdrop-blur-sm border border-cyan-100 rounded-xl px-4 py-3.5">
          <Info className="h-5 w-5 text-cyan-600 flex-shrink-0" />
          <span>
            Giá dịch vụ có thể thay đổi tùy thuộc vào loại xe (Sedan, SUV, Bán tải,...) và tình trạng thực tế.
          </span>
        </div>
      </div>
    </section>
  )
}
