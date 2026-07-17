import { useEffect, useState, useMemo, type FormEvent } from 'react'
import { Plus, Search, Pencil, Trash2, ToggleLeft, ToggleRight, Package, Tag, Percent } from 'lucide-react'
import { adminServicePackageService } from '../../services/adminServicePackageService'
import { adminServiceGroupService } from '../../services/adminServiceGroupService'
import { adminServiceService } from '../../services/adminServiceService'
import type { ServicePackage } from '../../types/servicePackage'
import type { ServiceGroup } from '../../types/serviceGroup'
import type { Service } from '../../types/service'
import { showError, showSuccess } from '../../utils/toast'
import { getApiErrorMessage } from '../../utils/errors'

const fmtPrice = (n: number) => n.toLocaleString('vi-VN') + 'đ'

export default function AdminServicePackagesPage() {
  const [packages, setPackages] = useState<ServicePackage[]>([])
  const [groups, setGroups] = useState<ServiceGroup[]>([])
  const [allServices, setAllServices] = useState<Service[]>([])
  
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Form State
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  
  const [formGroup, setFormGroup] = useState('')
  const [formName, setFormName] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formDiscount, setFormDiscount] = useState<number>(10)
  const [formServiceIds, setFormServiceIds] = useState<string[]>([])
  const [isActive, setIsActive] = useState(true)

  const loadData = async () => {
    setLoading(true)
    try {
      const [pkgRes, grpRes, srvRes] = await Promise.all([
        adminServicePackageService.list({ limit: 100 }),
        adminServiceGroupService.list({ limit: 100 }),
        adminServiceService.list({ limit: 100 })
      ])
      setPackages(pkgRes.items)
      setGroups(grpRes.items)
      setAllServices(srvRes.items)
    } catch (err) {
      showError(getApiErrorMessage(err, 'Lỗi tải dữ liệu'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const filteredPackages = useMemo(() => {
    if (!searchTerm) return packages
    const term = searchTerm.toLowerCase()
    return packages.filter(p => p.package_name.toLowerCase().includes(term))
  }, [packages, searchTerm])

  const totalOriginalPrice = useMemo(() => {
    let total = 0
    formServiceIds.forEach(id => {
      const s = allServices.find(srv => (srv._id || srv.id) === id)
      if (s) total += s.service_price
    })
    return total
  }, [formServiceIds, allServices])

  const discountedPrice = useMemo(() => {
    const validDiscount = Math.max(0, Math.min(100, formDiscount))
    return totalOriginalPrice * (1 - validDiscount / 100)
  }, [totalOriginalPrice, formDiscount])

  const handleOpenCreate = () => {
    setEditingId(null)
    setFormGroup(groups[0]?._id ?? groups[0]?.id ?? '')
    setFormName('')
    setFormDesc('')
    setFormDiscount(10)
    setFormServiceIds([])
    setIsActive(true)
    setShowForm(true)
  }

  const handleOpenEdit = async (pkg: ServicePackage) => {
    const id = pkg._id ?? pkg.id ?? ''
    setEditingId(id)
    setFormGroup(pkg.service_group_id)
    setFormName(pkg.package_name)
    setFormDesc(pkg.description)
    setFormDiscount(pkg.package_discount_percentage)
    setIsActive(pkg.is_active)
    
    try {
      const serviceIds = await adminServicePackageService.listServicesByPackage(id)
      setFormServiceIds(serviceIds)
    } catch (error) {
      showError('Không tải được danh sách dịch vụ của gói')
      setFormServiceIds([])
    }
    
    setShowForm(true)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!formGroup || !formName) {
      showError('Vui lòng điền đủ thông tin bắt buộc')
      return
    }
    if (formDiscount < 0 || formDiscount > 100) {
      showError('Phần trăm giảm giá phải nằm trong khoảng từ 0 đến 100')
      return
    }
    if (formServiceIds.length < 2) {
      showError('Một gói Combo phải bao gồm ít nhất 2 dịch vụ lẻ')
      return
    }

    setSaving(true)
    try {
      const payload = {
        service_group_id: formGroup,
        package_name: formName,
        description: formDesc,
        package_discount_percentage: formDiscount,
        service_ids: formServiceIds,
        is_active: isActive
      }

      if (editingId) {
        await adminServicePackageService.update(editingId, payload)
        showSuccess('Cập nhật gói thành công')
      } else {
        await adminServicePackageService.create(payload)
        showSuccess('Tạo gói thành công')
      }
      setShowForm(false)
      await loadData()
    } catch (err) {
      showError(getApiErrorMessage(err, 'Lỗi khi lưu gói'))
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (pkg: ServicePackage) => {
    const id = pkg._id ?? pkg.id ?? ''
    try {
      await adminServicePackageService.toggleActive(id, !pkg.is_active)
      await loadData()
    } catch (err) {
      showError('Lỗi cập nhật trạng thái')
    }
  }

  const handleDelete = async (pkg: ServicePackage) => {
    const id = pkg._id ?? pkg.id ?? ''
    if (!window.confirm(`Xóa gói ${pkg.package_name}?`)) return
    try {
      await adminServicePackageService.remove(id)
      showSuccess('Xóa thành công')
      await loadData()
    } catch (err) {
      showError(getApiErrorMessage(err, 'Không thể xóa gói'))
    }
  }

  const toggleServiceId = (serviceId: string) => {
    setFormServiceIds(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    )
  }

  return (
    <div className="animate-in fade-in duration-300">

      {showForm ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-lg font-semibold text-slate-800">
              {editingId ? 'Chỉnh sửa Gói dịch vụ' : 'Thêm Gói dịch vụ mới'}
            </h2>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Cột trái: Thông tin gói */}
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nhóm dịch vụ</label>
                  <select
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    value={formGroup}
                    onChange={e => {
                      setFormGroup(e.target.value)
                      setFormServiceIds([]) // reset selected services when changing group
                    }}
                    disabled={!!editingId} // không cho đổi nhóm khi sửa
                  >
                    {groups.map(g => (
                      <option key={g._id ?? g.id} value={g._id ?? g.id}>{g.group_name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tên gói (Combo)</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="VD: Combo Rửa & Chăm sóc nội thất"
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả chi tiết</label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="Mô tả cho gói dịch vụ..."
                    value={formDesc}
                    onChange={e => setFormDesc(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phần trăm giảm giá (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min={0}
                      max={100}
                      className="w-full pl-3 pr-10 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      value={formDiscount}
                      onChange={e => {
                        let val = Number(e.target.value);
                        if (val > 100) val = 100;
                        if (val < 0) val = 0;
                        setFormDiscount(val);
                      }}
                    />
                    <Percent size={16} className="absolute right-3 top-2.5 text-slate-400" />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Giảm giá so với mua lẻ từng dịch vụ.</p>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={isActive}
                    onChange={e => setIsActive(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-slate-700">Kích hoạt ngay</label>
                </div>
              </div>

              {/* Cột phải: Chọn dịch vụ & Tính giá */}
              <div className="space-y-5 bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col h-full">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <Package size={18} className="text-blue-600" /> Dịch vụ trong Gói
                  </h3>
                  <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                    Đã chọn {formServiceIds.length}
                  </span>
                </div>
                
                <div className="flex-1 overflow-y-auto pr-2 space-y-6" style={{ maxHeight: '400px' }}>
                  {!formGroup ? (
                    <div className="flex items-center justify-center h-32 text-sm text-slate-500">
                      Vui lòng chọn Nhóm dịch vụ trước.
                    </div>
                  ) : (
                    (() => {
                      const grp = groups.find(g => (g._id ?? g.id) === formGroup)
                      if (!grp) return null
                      
                      const grpServices = allServices.filter(s => 
                        s.service_group_id === formGroup || (s as any).service_group_id?._id === formGroup
                      )
                      
                      if (grpServices.length === 0) {
                        return (
                          <div className="flex items-center justify-center h-32 text-sm text-amber-600 bg-amber-50 rounded-lg">
                            Nhóm này chưa có dịch vụ lẻ nào.
                          </div>
                        )
                      }

                      return (
                        <div className="space-y-2">
                          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider sticky top-0 bg-white py-1 z-10">
                            DỊCH VỤ TRONG NHÓM: {grp.group_name}
                          </h4>
                          <div className="grid grid-cols-1 gap-2">
                            {grpServices.map(srv => {
                              const id = srv._id ?? srv.id ?? ''
                              const checked = formServiceIds.includes(id)
                              return (
                                <label key={id} className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 ${checked ? 'bg-blue-50/50 border-blue-400 shadow-sm' : 'bg-white border-slate-100 hover:border-blue-200 hover:bg-slate-50'}`}>
                                  <div className="flex items-center h-5 mt-0.5">
                                    <input
                                      type="checkbox"
                                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                                      checked={checked}
                                      onChange={() => toggleServiceId(id)}
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-medium truncate ${checked ? 'text-blue-900' : 'text-slate-800'}`}>
                                      {srv.service_name}
                                    </p>
                                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                                      {fmtPrice(srv.service_price)}
                                    </p>
                                  </div>
                                </label>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })()
                  )}
                </div>

                <div className="mt-auto pt-5 border-t border-slate-200 bg-slate-50 -mx-5 -mb-5 p-5 rounded-b-xl">
                  <div className="flex justify-between items-center text-sm mb-3">
                    <span className="text-slate-600 font-medium">Tổng giá gốc mua lẻ:</span>
                    <span className="font-semibold text-slate-400 line-through decoration-slate-400">{fmtPrice(totalOriginalPrice)}</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <span className="block font-bold text-slate-800">Giá ưu đãi Combo</span>
                      <span className="text-xs text-green-600 font-medium bg-green-100 px-2 py-0.5 rounded-full mt-1 inline-block">Tiết kiệm {formDiscount}%</span>
                    </div>
                    <span className="text-2xl font-black text-blue-600">{fmtPrice(discountedPrice)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="admin-btn admin-btn--secondary"
                disabled={saving}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="admin-btn admin-btn--primary"
                disabled={saving}
              >
                {saving ? 'Đang lưu...' : 'Lưu Gói Dịch Vụ'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <>
          <div className="admin-filters">
            <div className="admin-search-wrap">
              <Search className="admin-search-icon" size={15} />
              <input
                type="text"
                className="admin-search-input"
                placeholder="Tìm gói dịch vụ..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="ml-auto flex gap-2">
              <button onClick={handleOpenCreate} className="admin-btn admin-btn--primary">
                <Plus size={15} /> Thêm Gói mới
              </button>
            </div>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Tên Gói</th>
                  <th>Nhóm</th>
                  <th>Giảm giá</th>
                  <th style={{ textAlign: 'center' }}>Trạng thái</th>
                  <th style={{ textAlign: 'center' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="admin-table__empty">Đang tải...</td></tr>
                ) : filteredPackages.length === 0 ? (
                  <tr><td colSpan={5} className="admin-table__empty">Không tìm thấy gói nào</td></tr>
                ) : filteredPackages.map(pkg => {
                  const grp = groups.find(g => (g._id ?? g.id) === pkg.service_group_id)
                  return (
                    <tr key={pkg._id ?? pkg.id} className="admin-table__row">
                      <td>
                        <div className="admin-table__primary">
                          {pkg.package_code && <span className="text-xs bg-slate-100 text-slate-500 px-1 py-0.5 rounded mr-2">{pkg.package_code}</span>}
                          {pkg.package_name}
                        </div>
                        {pkg.description && <div className="admin-table__secondary">{pkg.description}</div>}
                      </td>
                      <td><span className="admin-table__meta">{grp?.group_name || '---'}</span></td>
                      <td>
                        <span className="admin-table__badge bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                          <Tag size={12} className="mr-1" /> Giảm {pkg.package_discount_percentage}%
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <label className="relative inline-flex items-center cursor-pointer" title={pkg.is_active ? "Đang hoạt động" : "Đã tạm ngưng"}>
                          <input type="checkbox" className="sr-only peer" checked={pkg.is_active} onChange={() => handleToggle(pkg)} />
                          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[100%] peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                        </label>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => handleOpenEdit(pkg)} className="admin-action-btn admin-action-btn--edit" title="Chỉnh sửa">
                            <Pencil size={15} />
                          </button>
                          <button onClick={() => handleDelete(pkg)} className="admin-action-btn admin-action-btn--delete" title="Xóa">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
