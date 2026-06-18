import React, { useState, useEffect } from 'react';
import { Search, Filter, Eye } from 'lucide-react';
import { staffManagerService } from '../../services/staffManagerService';
import type { StaffLeaveRecord } from '../../types/schedule.types';

import { useAuth } from '../../hooks/useAuth';

export const LeaveDaysTable: React.FC = () => {
  const { user } = useAuth();
  const isManager = user?.role === 'admin' || user?.role === 'boss' || user?.staff_type === 'manager';

  const [searchTerm, setSearchTerm] = useState('');
  const [records, setRecords] = useState<StaffLeaveRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStaff = async () => {
      setLoading(true);
      try {
        const data = await staffManagerService.getAllStaff({ limit: 100 });
        if (data && Array.isArray(data.data)) {
          let mapped = data.data.map((staff: any) => ({
            staffId: staff.staff_code || staff._id,
            staffName: staff.user_id?.full_name || staff.user_id?.email || 'Chưa cập nhật',
            totalLeaveDays: staff.annual_leave_days ?? 12,
            usedLeaveDays: staff.used_leave_days ?? 0,
            remainingLeaveDays: (staff.annual_leave_days ?? 12) - (staff.used_leave_days ?? 0),
            userId: typeof staff.user_id === 'object' ? staff.user_id._id : staff.user_id,
          }));

          // Nếu không phải manager/admin thì chỉ xem của chính mình
          if (!isManager && user?.user_id) {
            mapped = mapped.filter((r: any) => r.userId === user.user_id);
          }

          setRecords(mapped);
        }
      } catch (error) {
        console.error("Failed to load staff leave days", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStaff();
  }, [isManager, user?.user_id]);

  // Lọc theo tên nhân viên
  const filteredRecords = records.filter(record => 
    record.staffName.toLowerCase().includes(searchTerm.toLowerCase()) || record.staffId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full bg-white rounded-lg shadow-sm border border-slate-200">
      <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-lg font-semibold text-slate-800">{isManager ? 'Quản lý ngày phép nhân viên' : 'Ngày phép của tôi'}</h2>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Thanh tìm kiếm */}
          <div className="relative flex-1 sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md leading-5 bg-white placeholder-slate-500 focus:outline-none focus:placeholder-slate-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Tìm theo tên hoặc mã..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Nhân viên
              </th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                Tổng phép năm
              </th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                Đã nghỉ
              </th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                Còn lại
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                Hành động
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                  <div className="flex justify-center items-center gap-2">
                    <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    Đang tải dữ liệu...
                  </div>
                </td>
              </tr>
            ) : filteredRecords.map((record) => (
              <tr key={record.staffId} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                        {record.staffName.charAt(0)}
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-slate-900">{record.staffName}</div>
                      <div className="text-sm text-slate-500">Mã: {record.staffId}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 text-center">
                  {record.totalLeaveDays}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${record.usedLeaveDays > 10 ? 'bg-orange-100 text-orange-800' : 'bg-slate-100 text-slate-800'}`}>
                    {record.usedLeaveDays}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${record.remainingLeaveDays === 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                    {record.remainingLeaveDays}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button 
                    onClick={() => alert(`Sẽ mở Modal chi tiết ngày nghỉ của ${record.staffName}`)}
                    className="text-indigo-600 hover:text-indigo-900 flex items-center justify-end w-full gap-1"
                  >
                    <Eye className="h-4 w-4" />
                    Chi tiết
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredRecords.length === 0 && (
          <div className="p-8 text-center text-slate-500">
            Không tìm thấy nhân viên nào phù hợp.
          </div>
        )}
      </div>
    </div>
  );
};
