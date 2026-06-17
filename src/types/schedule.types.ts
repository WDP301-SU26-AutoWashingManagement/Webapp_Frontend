export interface CronLog {
  id: string;
  timestamp: string;
  message: string;
  status: 'info' | 'success' | 'warning' | 'error';
}

export interface StaffShift {
  staffId: string;
  name: string;
  avatarUrl?: string;
  role: string;
}

export interface ShiftSession {
  id: string;
  date: string; // YYYY-MM-DD format
  type: 'morning' | 'afternoon' | 'evening';
  assignedStaffs: StaffShift[];
}

export interface StaffLeaveRecord {
  staffId: string;
  staffName: string;
  totalLeaveDays: number;
  usedLeaveDays: number;
  remainingLeaveDays: number;
}
