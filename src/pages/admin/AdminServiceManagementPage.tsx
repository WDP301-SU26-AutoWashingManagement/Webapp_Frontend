import { useState } from 'react'
import AdminServicesPage from './AdminServicesPage'
import AdminServiceGroupsPage from './AdminServiceGroupsPage'
import AdminServicePackagesPage from './AdminServicePackagesPage'

export default function AdminServiceManagementPage() {
  const [activeTab, setActiveTab] = useState<'services' | 'groups' | 'packages'>('services')

  return (
    <div className="admin-page">
      <div className="admin-page__header pb-0 border-b-0">
        <div>
          <h1 className="admin-page__title">Quản lý dịch vụ</h1>
          <p className="admin-page__subtitle">Cấu hình các dịch vụ lẻ, nhóm dịch vụ và gói combo</p>
        </div>
      </div>

      <div className="admin-filters !pt-0 !border-b border-slate-200 !rounded-none !bg-transparent !shadow-none mb-4">
        <div className="admin-filter-tabs">
          <button
            className={`admin-filter-tab ${activeTab === 'services' ? 'admin-filter-tab--active' : ''}`}
            onClick={() => setActiveTab('services')}
          >
            Dịch vụ lẻ
          </button>
          <button
            className={`admin-filter-tab ${activeTab === 'groups' ? 'admin-filter-tab--active' : ''}`}
            onClick={() => setActiveTab('groups')}
          >
            Nhóm dịch vụ
          </button>
          <button
            className={`admin-filter-tab ${activeTab === 'packages' ? 'admin-filter-tab--active' : ''}`}
            onClick={() => setActiveTab('packages')}
          >
            Gói dịch vụ (Combo)
          </button>
        </div>
      </div>

      <div>
        {activeTab === 'services' && <AdminServicesPage />}
        {activeTab === 'groups' && <AdminServiceGroupsPage />}
        {activeTab === 'packages' && <AdminServicePackagesPage />}
      </div>
    </div>
  )
}
