import apiClient from './apiClient';
import type { ApiResponse } from '../types/api';
import { env } from '../config/env';

export interface ChecklistItem {
  label: string;
  checked: boolean;
  _id?: string;
}

export interface BookingChecklist {
  _id: string;
  appointment_id: string;
  checklist_items: ChecklistItem[];
  note: string | null;
  images: string[];
  customer_signature: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export const bookingChecklistService = {
  async getByAppointmentId(appointmentId: string): Promise<BookingChecklist | null> {
    try {
      const response = await apiClient.get<ApiResponse<BookingChecklist>>(`/booking-checklists/appointment/${appointmentId}`);
      if (response && response.data) {
        return response.data;
      }
      return null;
    } catch (error: any) {
      // Nếu lỗi 404 nghĩa là chưa có biên bản, không cần log lỗi
      if (error.response && error.response.status === 404) {
        return null;
      }
      throw error;
    }
  },

  async getPdfDownloadUrl(checklistId: string): Promise<string> {
    return `${env.apiBaseUrl}/booking-checklists/${checklistId}/export-pdf`;
  },

  async create(formData: FormData): Promise<BookingChecklist> {
    const response = await apiClient.post<ApiResponse<BookingChecklist>>('/booking-checklists', formData);
    if (response && response.data) {
      return response.data;
    }
    throw new Error('Không nhận được dữ liệu trả về');
  }
};
