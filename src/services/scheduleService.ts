import apiClient from './apiClient'
import type { ApiResponse } from '../types/api'

export interface StaffMini {
  _id: string;
  email?: string;
  full_name?: string;
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
    const res = await apiClient.get<ApiResponse<Schedule[]>>('/schedules');
    return res.data || [];
  },

  getScheduleById: async (id: string): Promise<Schedule> => {
    const res = await apiClient.get<ApiResponse<Schedule>>(`/schedules/${id}`);
    return res.data as Schedule;
  }
};
