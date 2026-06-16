import apiClient from './apiClient';

export interface CreateInvoiceOptions {
  discount_amount?: number;
  promotion_id?: string;
  customer_voucher_id?: string;
  vat_requested?: boolean;
  tax_code?: string;
}

export interface Invoice {
  _id: string;
  appointment_id: any;
  customer_id: any;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total: number;
  invoice_status: 'draft' | 'pending' | 'paid' | 'cancelled';
  payment_method?: 'cash' | 'bank';
  checkout_url?: string;
  qr_code?: string;
  order_code?: number;
  [key: string]: any;
}

export const invoiceService = {
  // 1. Tạo Invoice nháp từ Appointment
  createInvoice: async (appointmentId: string, options: CreateInvoiceOptions = {}): Promise<Invoice> => {
    const res = await apiClient.post<any>(`/invoices`, {
      appointment_id: appointmentId,
      ...options,
    });
    return res.data;
  },

  // 2. Xác nhận thanh toán tiền mặt
  confirmCash: async (invoiceId: string, staffId: string): Promise<Invoice> => {
    const res = await apiClient.patch<any>(`/invoices/${invoiceId}/confirm-cash`, {
      staff_id: staffId,
    });
    return res.data;
  },

  // 3. Tạo link thanh toán PayOS (QR)
  createPaymentLink: async (invoiceId: string): Promise<Invoice> => {
    await apiClient.post<any>(`/invoices/${invoiceId}/payment-link`);
    // Backend controller for this endpoint only returns a partial object,
    // so we fetch the full invoice to ensure the UI has all data (like .total)
    const res = await apiClient.get<any>(`/invoices/${invoiceId}`);
    return res.data;
  },

  // 4. Đồng bộ trạng thái thanh toán từ PayOS
  syncPaymentStatus: async (invoiceId: string): Promise<Invoice> => {
    const res = await apiClient.get<any>(`/invoices/${invoiceId}/sync`);
    return res.data;
  },

  // 5. Huỷ link thanh toán PayOS
  cancelPaymentLink: async (invoiceId: string, reason?: string): Promise<Invoice> => {
    const res = await apiClient.patch<any>(`/invoices/${invoiceId}/cancel-payment`, { reason });
    return res.data;
  },
};
