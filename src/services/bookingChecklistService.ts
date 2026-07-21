import apiClient from './apiClient';
import type { ApiResponse, PaginatedResponse } from '../types/api';
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
  customer_signature_after?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface BookingReport {
  title: string;
  fullname: string;
  description: string;
  evidence: string[];
  phone: string;
  email: string;
  isConfirm: boolean;
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
  },

  async update(id: string, formData: FormData): Promise<BookingChecklist> {
    const response = await apiClient.put<ApiResponse<BookingChecklist>>(`/booking-checklists/${id}`, formData);
    if (response && response.data) {
      return response.data;
    }
    throw new Error('Không nhận được dữ liệu trả về');
  },

  async getAllReports(params?: {
    page?: number;
    limit?: number;
    isConfirm?: boolean;
    status?: string;
  }): Promise<PaginatedResponse<BookingReport>> {
    const response = await apiClient.get<any>('/booking-checklists/reports', { params });
    if (response) {
      const items = Array.isArray(response.data) ? response.data : [];
      const total = response.pagination?.totalDocs || items.length || 0;
      return { items, total };
    }
    return { items: [], total: 0 };
  },

  async acceptReport(appointmentId: string, payload: any): Promise<any> {
    const response = await apiClient.patch<ApiResponse<any>>(`/booking-checklists/appointment/${appointmentId}/report/accept`, payload);
    if (response && response.data) {
      return response.data;
    }
    throw new Error('Lỗi khi chấp nhận báo cáo');
  },

  async uploadCompensationBill(appointmentId: string, transfer_image: string): Promise<any> {
    const response = await apiClient.patch<ApiResponse<any>>(`/booking-checklists/appointment/${appointmentId}/report/upload-bill`, { transfer_image });
    if (response && response.data) {
      return response.data;
    }
    throw new Error('Lỗi khi tải lên ảnh chuyển khoản');
  },

  async rejectReport(appointmentId: string, payload: { reject_reason: string, admin_signature: string, customer_signature: string }): Promise<any> {
    const response = await apiClient.patch<ApiResponse<any>>(`/booking-checklists/appointment/${appointmentId}/report/reject`, payload);
    if (response && response.data) {
      return response.data;
    }
    throw new Error('Lỗi khi từ chối báo cáo');
  },

  async createReport(appointmentId: string, formData: FormData): Promise<any> {
    const response = await apiClient.post<ApiResponse<any>>(`/booking-checklists/appointment/${appointmentId}/report`, formData);
    if (response && response.data) {
      return response.data;
    }
    throw new Error('Lỗi khi gửi báo cáo');
  },

  async deleteReport(appointmentId: string): Promise<any> {
    const response = await apiClient.delete<ApiResponse<any>>(`/booking-checklists/appointment/${appointmentId}/report`);
    if (response && response.data) {
      return response.data;
    }
    throw new Error('Lỗi khi xoá báo cáo');
  }
};
