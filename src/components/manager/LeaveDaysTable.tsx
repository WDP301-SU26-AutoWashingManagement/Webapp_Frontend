import React, { useState, useEffect } from 'react';
import { Search, Filter, Eye, X, Check, Plus } from 'lucide-react';
import { staffManagerService } from '../../services/staffManagerService';
import type { StaffLeaveRecord } from '../../types/schedule.types';
import { showError, showSuccess } from '../../utils/toast';
import { getErrorMessage } from '../../utils/errors';

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
        const params: any = { limit: 100 };
        if (user?.role !== 'boss' && user?.branch_id) {
          const userBranchId = typeof user.branch_id === 'object' ? (user.branch_id as any)._id : user.branch_id;
          if (userBranchId) {
            params.branch_id = userBranchId;
          }
        }
        const data = await staffManagerService.getAllStaff(params);
        if (data && Array.isArray(data.data)) {
          let mapped = data.data.map((staff: any) => ({
            mongoId: staff._id,
            staffId: staff._id,
            staffCode: staff.staff_code || staff._id,
            staffName: staff.full_name || staff.user_id?.full_name || staff.email || staff.user_id?.email || 'Chưa cập nhật',
            staffEmail: staff.email || staff.user_id?.email || '',
            totalLeaveDays: staff.annual_leave_days ?? 12,
            usedLeaveDays: staff.used_leave_days ?? 0,
            remainingLeaveDays: (staff.annual_leave_days ?? 12) - (staff.used_leave_days ?? 0),
            userId: typeof staff.user_id === 'object' ? staff.user_id._id : staff.user_id,
          }));

          // Nếu không phải manager/admin thì chỉ xem của chính mình
          if (!isManager && user?.user_id) {
            mapped = mapped.filter((r: any) => r.userId === user.user_id);
          } else if (isManager && user?.role !== 'boss' && user?.user_id) {
            // Manager/Admin không xem chính mình (tránh tự duyệt phép)
            mapped = mapped.filter((r: any) => r.userId !== user.user_id);
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

  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [addingLeaveDays, setAddingLeaveDays] = useState(false);
  const [daysToAdd, setDaysToAdd] = useState(0);

  // Lọc theo tên nhân viên
  const filteredRecords = records.filter(record => 
    record.staffName.toLowerCase().includes(searchTerm.toLowerCase()) || record.staffCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenDetail = (staffId: string) => {
    setSelectedStaffId(staffId);
    setDetailModalOpen(true);
    setDaysToAdd(0);
  };

  const handleAddLeaveDays = async () => {
    if (!selectedStaffId || daysToAdd <= 0) {
      showError('Vui lòng nhập số ngày hợp lệ (lớn hơn 0).');
      return;
    }
    setAddingLeaveDays(true);
    try {
      await staffManagerService.addUsedLeaveDays(selectedStaffId, daysToAdd);
      showSuccess(`Đã cộng thêm ${daysToAdd} ngày nghỉ thành công!`);
      // Update local state directly
      setRecords(prev => prev.map(r => {
        if (r.mongoId === selectedStaffId) {
          const updatedUsed = r.usedLeaveDays + daysToAdd;
          return {
            ...r,
            usedLeaveDays: updatedUsed,
            remainingLeaveDays: r.totalLeaveDays - updatedUsed
          };
        }
        return r;
      }));
      setDaysToAdd(0);
    } catch (err) {
      showError(getErrorMessage(err, 'Lỗi khi cập nhật ngày nghỉ'));
    } finally {
      setAddingLeaveDays(false);
    }
  };

  const selectedRecord = records.find(r => r.mongoId === selectedStaffId);

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
                        {record.staffName.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-slate-900">{record.staffName}</div>
                      <div className="text-sm text-slate-500">{(record as any).staffEmail || `Mã: ${record.staffCode}`}</div>
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
                    onClick={() => handleOpenDetail(record.mongoId)}
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

      {detailModalOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800">Chi tiết ngày nghỉ</h3>
              <button 
                onClick={() => setDetailModalOpen(false)}
                className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg shrink-0">
                  {selectedRecord.staffName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">{selectedRecord.staffName}</h4>
                  <p className="text-sm text-slate-500">{(selectedRecord as any).staffEmail || `Mã: ${selectedRecord.staffCode}`}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-50 p-4 rounded-lg text-center">
                  <p className="text-sm text-slate-500 mb-1">Tổng phép</p>
                  <p className="font-bold text-xl text-slate-800">{selectedRecord.totalLeaveDays}</p>
                </div>
                <div className="bg-amber-50 p-4 rounded-lg text-center">
                  <p className="text-sm text-amber-600 mb-1">Đã nghỉ</p>
                  <p className="font-bold text-xl text-amber-700">{selectedRecord.usedLeaveDays}</p>
                </div>
                <div className="bg-emerald-50 p-4 rounded-lg text-center">
                  <p className="text-sm text-emerald-600 mb-1">Còn lại</p>
                  <p className="font-bold text-xl text-emerald-700">{selectedRecord.remainingLeaveDays}</p>
                </div>
              </div>

              {isManager && (
                <div className="border-t border-slate-100 pt-6 mt-4">
                  <h4 className="text-sm font-semibold text-slate-800 mb-3">Cộng thủ công ngày đã nghỉ</h4>
                  <p className="text-xs text-slate-500 mb-3">
                    Nếu nhân viên xin nghỉ không qua hệ thống, bạn có thể cộng thủ công số ngày đã nghỉ tại đây.
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      className="flex-1 border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                      placeholder="Số ngày..."
                      value={daysToAdd || ''}
                      onChange={(e) => setDaysToAdd(parseFloat(e.target.value))}
                    />
                    <button
                      onClick={handleAddLeaveDays}
                      disabled={addingLeaveDays || !daysToAdd}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {addingLeaveDays ? <span className="animate-pulse">Đang lưu...</span> : <><Plus size={16} /> Cộng phép</>}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
