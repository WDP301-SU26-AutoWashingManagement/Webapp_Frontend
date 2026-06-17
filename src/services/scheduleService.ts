import apiClient from './apiClient'
import type { ApiResponse } from '../types/api'

export interface StaffMini {
  _id: string;
  email?: string;
  full_name?: string;
  user_id?: {
    _id: string;
    full_name: string;
    email: string;
  };
}

export interface Schedule {
  _id: string;
  branch_id: string;
  shift_date: string; // ISO String from backend
  start_time: string;
  end_time: string;
  shift_status: string;
  max_staff: number;
  algorithm?: string;
  shift_minutes?: number;
  assigned_staff: string[] | StaffMini[];
  createdAt?: string;
  updatedAt?: string;
}

export const scheduleService = {
  getAllSchedules: async (): Promise<Schedule[]> => {
    const res = await apiClient.get<ApiResponse<Schedule[]>>('/schedule');
    return res.data || [];
  },

  getScheduleById: async (id: string): Promise<Schedule> => {
    const res = await apiClient.get<ApiResponse<Schedule>>(`/schedule/${id}`);
    return res.data as Schedule;
  },

  switchStaff: async (
    schedule_id_1: string,
    staff_id_1: string,
    schedule_id_2: string,
    staff_id_2: string
  ): Promise<any> => {
    const res = await apiClient.post<ApiResponse<any>>('/schedule/switch-staff', {
      schedule_id_1,
      staff_id_1,
      schedule_id_2,
      staff_id_2
    });
    return res.data;
  },

  addStaffToSchedule: async (scheduleId: string, staff_id: string): Promise<any> => {
    const res = await apiClient.post<ApiResponse<any>>(`/schedule/${scheduleId}/add-staff`, { staff_id });
    return res.data;
  },

  getCronLogs: async (): Promise<any[]> => {
    const res = await apiClient.get<ApiResponse<any[]>>('/schedule/cron-logs');
    return res.data || [];
  }
};
