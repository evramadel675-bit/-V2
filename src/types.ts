export type TicketStatus =
  | 'قيد الفحص'
  | 'تم الإرسال للصيانة'
  | 'تم الإصلاح'
  | 'تعذر الإصلاح'
  | 'تم التسليم للعميل';

export const TICKET_STATUSES: TicketStatus[] = [
  'قيد الفحص',
  'تم الإرسال للصيانة',
  'تم الإصلاح',
  'تعذر الإصلاح',
  'تم التسليم للعميل',
];

export interface MaintenanceTicket {
  id: string;
  ticketCode: string; // e.g., MNT-1001
  batchCode?: string; // Unified reference code for multi-device corporate batches (e.g., CORP-101)
  receivedDate: string; // YYYY-MM-DD
  customerName: string; // Company or Customer Name
  employeeName?: string; // Employee / Device User inside the company (e.g., أ. أحمد - المحاسبة)
  phone: string;
  deviceModel: string;
  serialNumber: string;
  issueDescription: string;
  accessories: string;
  externalCenter: string;
  sentToCenterDate: string;
  receivedFromCenterDate: string;
  status: TicketStatus;
  actualCost: number;
  customerPrice: number;
  netProfit: number;
  finalDeliveryDate: string;
  notes: string;
}

export interface ServiceCenter {
  id: string;
  name: string;
  specialistName: string;
  phone: string;
  specialty: string;
  address: string;
  notes: string;
}

export interface WorkshopSettings {
  centerName: string;
  centerSubtitle: string;
  centerPhone: string;
  centerAddress: string;
  currency: string;
  defaultPrintFormat: 'A4' | 'thermal80';
  receiptTerms: string[];
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  description?: string;
}
