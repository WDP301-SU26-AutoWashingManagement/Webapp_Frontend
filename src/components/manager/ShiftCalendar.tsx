import React, { useState } from 'react';
import { Calendar, Users, RefreshCcw, Plus, AlertTriangle } from 'lucide-react';
import type { ShiftSession, StaffShift } from '../../types/schedule.types';

// Giả lập dữ liệu các ca làm việc trong tuần
const MOCK_SHIFTS: ShiftSession[] = [
  {
    id: 'SH-Mon-Morn', date: 'Thứ 2', type: 'morning',
    assignedStaffs: [{ staffId: 'S01', name: 'Nguyễn Văn A', role: 'Technical' }]
  },
  {
    id: 'SH-Tue-Aft', date: 'Thứ 3', type: 'afternoon',
    assignedStaffs: [{ staffId: 'S02', name: 'Trần Thị B', role: 'Technical' }]
  },
  {
    id: 'SH-Wed-Eve', date: 'Thứ 4', type: 'evening',
    assignedStaffs: [{ staffId: 'S03', name: 'Lê Văn C', role: 'Technical' }, { staffId: 'S04', name: 'Phạm Thị D', role: 'Technical' }]
  }
];

export const ShiftCalendar: React.FC = () => {
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [selectedStaffA, setSelectedStaffA] = useState<string>('');
  const [selectedStaffB, setSelectedStaffB] = useState<string>('');

  const handleSwapConfirm = () => {
    if (!selectedStaffA || !selectedStaffB) return;
    alert(`Đã hoán đổi thành công giữa ${selectedStaffA} và ${selectedStaffB}! Email tự động đã được gửi.`);
    setIsSwapModalOpen(false);
  };

  const shiftLabels = { morning: 'Sáng (08:00 - 12:00)', afternoon: 'Chiều (13:00 - 17:00)', evening: 'Tối (18:00 - 22:00)' };

  return (
    <div className="w-full bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Calendar className="text-indigo-600" />
          Lịch làm việc tuần 25
        </h2>
        <button 
          onClick={() => setIsSwapModalOpen(true)}
          className="flex items-center gap-2 bg-amber-100 text-amber-700 hover:bg-amber-200 px-4 py-2 rounded-md font-medium transition-colors"
        >
          <RefreshCcw size={18} />
          Hoán đổi ca
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {MOCK_SHIFTS.map((shift) => (
          <div key={shift.id} className="border border-slate-200 rounded-lg overflow-hidden flex flex-col">
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex justify-between items-center">
              <div>
                <span className="font-bold text-slate-800 block">{shift.date}</span>
                <span className="text-xs text-slate-500 font-medium">{shiftLabels[shift.type]}</span>
              </div>
              <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded-full">
                {shift.assignedStaffs.length} Staff
              </span>
            </div>
            
            <div className="p-4 flex-1 bg-white space-y-3">
              {shift.assignedStaffs.map(staff => (
                <div key={staff.staffId} className="flex items-center gap-3 p-2 rounded bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-100">
                  <div className="w-8 h-8 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-800 font-bold text-xs">
                    {staff.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{staff.name}</p>
                    <p className="text-xs text-slate-500">{staff.role}</p>
                  </div>
                </div>
              ))}
              
              <button className="w-full mt-2 py-2 border border-dashed border-slate-300 text-slate-500 rounded flex justify-center items-center gap-1 hover:bg-slate-50 hover:text-indigo-600 transition-colors text-sm font-medium">
                <Plus size={16} /> Thêm nhân viên
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Switch Shift Modal */}
      {isSwapModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <RefreshCcw className="text-amber-600" size={20} />
                Hoán đổi ca làm việc
              </h3>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Chọn nhân viên 1 (Ca gốc)</label>
                  <select 
                    className="w-full border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={selectedStaffA}
                    onChange={(e) => setSelectedStaffA(e.target.value)}
                  >
                    <option value="">-- Chọn nhân viên --</option>
                    <option value="Nguyễn Văn A (Sáng T2)">Nguyễn Văn A (Sáng T2)</option>
                    <option value="Trần Thị B (Chiều T3)">Trần Thị B (Chiều T3)</option>
                  </select>
                </div>
                
                <div className="flex justify-center -my-2 relative z-10">
                  <div className="bg-white p-2 rounded-full border border-slate-200 shadow-sm">
                    <RefreshCcw size={16} className="text-slate-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Chọn nhân viên 2 (Ca thay thế)</label>
                  <select 
                    className="w-full border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={selectedStaffB}
                    onChange={(e) => setSelectedStaffB(e.target.value)}
                  >
                    <option value="">-- Chọn nhân viên --</option>
                    <option value="Trần Thị B (Chiều T3)">Trần Thị B (Chiều T3)</option>
                    <option value="Lê Văn C (Tối T4)">Lê Văn C (Tối T4)</option>
                  </select>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-3 items-start">
                <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={18} />
                <p className="text-xs text-amber-800">
                  Hành động này sẽ cập nhật trực tiếp vào cơ sở dữ liệu và tự động gửi <strong>Email thông báo</strong> cho cả 2 nhân viên.
                </p>
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button 
                onClick={() => setIsSwapModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-md transition-colors"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={handleSwapConfirm}
                disabled={!selectedStaffA || !selectedStaffB}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Xác nhận đổi ca
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
