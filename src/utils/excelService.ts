import * as XLSX from 'xlsx';
import { MaintenanceTicket, TICKET_STATUSES, TicketStatus } from '../types';
import { generateNextTicketCode } from '../data/sampleData';

// Smart dictionary mapping Arabic and English column headers to MaintenanceTicket fields
const COLUMN_ALIASES: Record<keyof Omit<MaintenanceTicket, 'id'>, string[]> = {
  ticketCode: [
    'كود التذكرة',
    'رقم التذكرة',
    'كود الجهاز',
    'رقم الإيصال',
    'الكود',
    'ticket code',
    'ticket_code',
    'ticket id',
    'code',
    'id',
  ],
  batchCode: [
    'رقم الدفعة',
    'كود الدفعة',
    'مرجع الشركة',
    'الرقم المرجعي للشركة',
    'batch code',
    'batch_code',
    'batch',
    'corporate ref',
  ],
  receivedDate: [
    'تاريخ الاستلام من العميل',
    'تاريخ الاستلام',
    'تاريخ الدخول',
    'تاريخ التسجيل',
    'received date',
    'received_date',
    'date received',
    'entry date',
    'date',
  ],
  customerName: [
    'اسم العميل أو الشركة',
    'اسم العميل',
    'اسم الشركة',
    'العميل',
    'الشركة',
    'الاسم',
    'customer name',
    'customer_name',
    'company name',
    'customer',
    'client',
    'client name',
    'name',
  ],
  employeeName: [
    'اسم الموظف / المستخدم',
    'اسم الموظف',
    'الموظف',
    'المستخدم',
    'القسم',
    'صاحب الجهاز',
    'employee name',
    'employee_name',
    'employee',
    'user',
    'department',
  ],
  phone: [
    'رقم الهاتف',
    'الهاتف',
    'الموبايل',
    'رقم الموبايل',
    'الجوال',
    'التليفون',
    'phone',
    'mobile',
    'phone number',
    'telephone',
    'tel',
  ],
  deviceModel: [
    'نوع وموديل الجهاز',
    'موديل الجهاز',
    'نوع الجهاز',
    'الجهاز',
    'الموديل',
    'device model',
    'device_model',
    'device',
    'model',
    'item',
  ],
  serialNumber: [
    'الرقم التسلسلي (s/n)',
    'الرقم التسلسلي',
    'السيريال',
    'سيريال',
    'رقم السيريال',
    's/n',
    'sn',
    'serial number',
    'serial_number',
    'serial',
  ],
  issueDescription: [
    'وصف العطل / المشكلة بالتفصيل',
    'وصف العطل',
    'العطل',
    'المشكلة',
    'الشكوى',
    'تفاصيل العطل',
    'issue description',
    'issue_description',
    'issue',
    'problem',
    'fault',
    'defect',
  ],
  accessories: [
    'الملحقات المستلمة',
    'الملحقات',
    'المشتملات',
    'المرفقات',
    'accessories',
    'attachments',
    'included items',
  ],
  externalCenter: [
    'مركز الصيانة الخارجي / اسم الفني',
    'مركز الصيانة الخارجي',
    'مركز الصيانة',
    'اسم الفني',
    'الفني',
    'الورشة الخارجية',
    'external center',
    'external_center',
    'service center',
    'technician',
    'vendor',
  ],
  sentToCenterDate: [
    'تاريخ التسليم للصيانة الخارجية',
    'تاريخ الإرسال للصيانة',
    'تاريخ التسليم للصيانة',
    'sent to center date',
    'sent_to_center_date',
    'sent date',
    'dispatch date',
  ],
  receivedFromCenterDate: [
    'تاريخ الاستلام من الصيانة',
    'تاريخ العودة من الصيانة',
    'تاريخ رجوع الجهاز',
    'received from center date',
    'received_from_center_date',
    'return date',
  ],
  status: [
    'حالة الجهاز',
    'الحالة',
    'حالة الصيانة',
    'status',
    'device status',
    'state',
  ],
  actualCost: [
    'التكلفة الفعلية للصيانة',
    'التكلفة الفعلية',
    'تكلفة الصيانة',
    'التكلفة',
    'المبلغ المدفوع للصيانة',
    'actual cost',
    'actual_cost',
    'cost',
    'repair cost',
  ],
  customerPrice: [
    'المبلغ المطلوب من العميل',
    'المبلغ المطلوب',
    'سعر العميل',
    'الإجمالي للعميل',
    'التحصيل',
    'المطلوب',
    'customer price',
    'customer_price',
    'price',
    'charged amount',
    'total price',
  ],
  netProfit: [
    'صافي الربح',
    'الربح',
    'المكسب',
    'net profit',
    'net_profit',
    'profit',
  ],
  finalDeliveryDate: [
    'تاريخ التسليم النهائي للعميل',
    'تاريخ التسليم للعميل',
    'تاريخ التسليم النهائي',
    'تاريخ التسليم',
    'final delivery date',
    'final_delivery_date',
    'delivery date',
    'delivered date',
  ],
  notes: [
    'ملاحظات إضافية',
    'ملاحظات',
    'التقرير الفني',
    'بيان الإصلاح',
    'notes',
    'remarks',
    'comments',
  ],
};

function normalizeHeader(header: string): string {
  return String(header || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function normalizeStatus(rawStatus: string): TicketStatus {
  const cleaned = String(rawStatus || '').trim();
  if ((TICKET_STATUSES as string[]).includes(cleaned)) {
    return cleaned as TicketStatus;
  }

  const lower = cleaned.toLowerCase();
  if (lower.includes('فحص') || lower.includes('inspect') || lower.includes('pending')) {
    return 'قيد الفحص';
  }
  if (lower.includes('إرسال') || lower.includes('ارسال') || lower.includes('خارجي') || lower.includes('sent')) {
    return 'تم الإرسال للصيانة';
  }
  if (lower.includes('تعذر') || lower.includes('مرفوض') || lower.includes('غير قابل') || lower.includes('unrepairable') || lower.includes('failed')) {
    return 'تعذر الإصلاح';
  }
  if (lower.includes('تسليم') || lower.includes('استلم') || lower.includes('delivered') || lower.includes('completed')) {
    return 'تم التسليم للعميل';
  }
  if (lower.includes('إصلاح') || lower.includes('اصلاح') || lower.includes('جاهز') || lower.includes('repaired') || lower.includes('fixed')) {
    return 'تم الإصلاح';
  }

  return 'قيد الفحص';
}

function parseExcelDate(val: unknown): string {
  if (!val) return '';
  if (typeof val === 'number') {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const date = new Date(excelEpoch.getTime() + val * 86400000);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  }
  const str = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }
  const dmyMatch = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }
  return str;
}

function parseNumber(val: unknown): number {
  if (typeof val === 'number' && !isNaN(val)) return val;
  if (!val) return 0;
  const arabicDigits = '٠١٢٣٤٥٦٧٨٩';
  const normalized = String(val)
    .replace(/[٠-٩]/g, (d) => String(arabicDigits.indexOf(d)))
    .replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? 0 : parsed;
}

export interface ParsedExcelResult {
  tickets: MaintenanceTicket[];
  matchedColumns: string[];
  skippedRows: number;
}

export async function parseExcelFile(
  file: File,
  existingTickets: MaintenanceTicket[]
): Promise<ParsedExcelResult> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('ملف الإكسل فارغ أو لا يحتوي على أوراق عمل.');
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    defval: '',
  });

  if (rawRows.length === 0) {
    throw new Error('لم يتم العثور على أي صفوف بيانات داخل ملف الإكسل.');
  }

  const sampleKeys = Object.keys(rawRows[0]);
  const keyToFieldMap: Record<string, keyof Omit<MaintenanceTicket, 'id'>> = {};
  const matchedColumns: string[] = [];

  for (const rawKey of sampleKeys) {
    const normKey = normalizeHeader(rawKey);
    for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
      if (
        aliases.some(
          (alias) =>
            normKey === alias.toLowerCase() ||
            normKey.includes(alias.toLowerCase())
        )
      ) {
        keyToFieldMap[rawKey] = field as keyof Omit<MaintenanceTicket, 'id'>;
        matchedColumns.push(rawKey);
        break;
      }
    }
  }

  const workingList: MaintenanceTicket[] = [...existingTickets];
  const importedTickets: MaintenanceTicket[] = [];
  let skippedRows = 0;
  const todayStr = new Date().toISOString().split('T')[0];

  rawRows.forEach((row, index) => {
    const partial: Partial<Omit<MaintenanceTicket, 'id'>> = {};
    for (const [rawKey, value] of Object.entries(row)) {
      const targetField = keyToFieldMap[rawKey];
      if (!targetField) continue;

      if (
        targetField === 'receivedDate' ||
        targetField === 'sentToCenterDate' ||
        targetField === 'receivedFromCenterDate' ||
        targetField === 'finalDeliveryDate'
      ) {
        partial[targetField] = parseExcelDate(value);
      } else if (
        targetField === 'actualCost' ||
        targetField === 'customerPrice' ||
        targetField === 'netProfit'
      ) {
        partial[targetField] = parseNumber(value);
      } else if (targetField === 'status') {
        partial.status = normalizeStatus(String(value));
      } else {
        partial[targetField] = String(value ?? '').trim();
      }
    }

    const hasCustomer = Boolean(
      partial.customerName &&
        partial.customerName !== 'الإجمالي' &&
        !partial.customerName.startsWith('عدد الأجهزة')
    );
    const hasDevice = Boolean(partial.deviceModel);
    if (!hasCustomer && !hasDevice) {
      skippedRows++;
      return;
    }

    const ticketCode =
      partial.ticketCode && partial.ticketCode.trim() !== ''
        ? partial.ticketCode.trim()
        : generateNextTicketCode(workingList);

    const actualCost = partial.actualCost ?? 0;
    const customerPrice = partial.customerPrice ?? 0;
    const netProfit = customerPrice - actualCost;

    const newTicket: MaintenanceTicket = {
      id: `mnt-imp-${Date.now()}-${index}`,
      ticketCode,
      batchCode: partial.batchCode || undefined,
      receivedDate: partial.receivedDate || todayStr,
      customerName: partial.customerName || 'عميل غير محدد',
      employeeName: partial.employeeName || undefined,
      phone: partial.phone || '',
      deviceModel: partial.deviceModel || 'جهاز غير محدد',
      serialNumber: partial.serialNumber || '',
      issueDescription: partial.issueDescription || '',
      accessories: partial.accessories || 'بدون ملحقات',
      externalCenter: partial.externalCenter || '',
      sentToCenterDate: partial.sentToCenterDate || '',
      receivedFromCenterDate: partial.receivedFromCenterDate || '',
      status: partial.status || 'قيد الفحص',
      actualCost,
      customerPrice,
      netProfit,
      finalDeliveryDate: partial.finalDeliveryDate || '',
      notes: partial.notes || '',
    };

    workingList.push(newTicket);
    importedTickets.push(newTicket);
  });

  return {
    tickets: importedTickets,
    matchedColumns,
    skippedRows,
  };
}

export function exportTicketsToExcel(
  tickets: MaintenanceTicket[],
  currency: string
): void {
  const rows: Record<string, string | number>[] = tickets.map((t) => ({
    'كود التذكرة': t.ticketCode,
    'رقم الدفعة / مرجع الشركة': t.batchCode || '',
    'تاريخ الاستلام من العميل': t.receivedDate,
    'اسم العميل أو الشركة': t.customerName,
    'اسم الموظف / المستخدم': t.employeeName || '',
    'رقم الهاتف': t.phone,
    'نوع وموديل الجهاز': t.deviceModel,
    'الرقم التسلسلي (S/N)': t.serialNumber,
    'وصف العطل / المشكلة بالتفصيل': t.issueDescription,
    'الملحقات المستلمة': t.accessories,
    'مركز الصيانة الخارجي / اسم الفني': t.externalCenter,
    'تاريخ التسليم للصيانة الخارجية': t.sentToCenterDate,
    'تاريخ الاستلام من الصيانة': t.receivedFromCenterDate,
    'حالة الجهاز': t.status,
    [`التكلفة الفعلية للصيانة (${currency})`]: t.actualCost,
    [`المبلغ المطلوب من العميل (${currency})`]: t.customerPrice,
    [`صافي الربح (${currency})`]: t.netProfit,
    'تاريخ التسليم النهائي للعميل': t.finalDeliveryDate,
    'ملاحظات إضافية': t.notes,
  }));

  const totalActualCost = tickets.reduce((acc, t) => acc + t.actualCost, 0);
  const totalCustomerPrice = tickets.reduce((acc, t) => acc + t.customerPrice, 0);
  const totalNetProfit = tickets.reduce((acc, t) => acc + t.netProfit, 0);

  rows.push({
    'كود التذكرة': 'الإجمالي العام',
    'رقم الدفعة / مرجع الشركة': '',
    'تاريخ الاستلام من العميل': '',
    'اسم العميل أو الشركة': `عدد الأجهزة: ${tickets.length}`,
    'اسم الموظف / المستخدم': '',
    'رقم الهاتف': '',
    'نوع وموديل الجهاز': '',
    'الرقم التسلسلي (S/N)': '',
    'وصف العطل / المشكلة بالتفصيل': '',
    'الملحقات المستلمة': '',
    'مركز الصيانة الخارجي / اسم الفني': '',
    'تاريخ التسليم للصيانة الخارجية': '',
    'تاريخ الاستلام من الصيانة': '',
    'حالة الجهاز': '',
    [`التكلفة الفعلية للصيانة (${currency})`]: totalActualCost,
    [`المبلغ المطلوب من العميل (${currency})`]: totalCustomerPrice,
    [`صافي الربح (${currency})`]: totalNetProfit,
    'تاريخ التسليم النهائي للعميل': '',
    'ملاحظات إضافية': '',
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);

  worksheet['!cols'] = [
    { wch: 14 }, // كود التذكرة
    { wch: 16 }, // رقم الدفعة
    { wch: 16 }, // تاريخ الاستلام
    { wch: 26 }, // اسم العميل أو الشركة
    { wch: 22 }, // اسم الموظف / المستخدم
    { wch: 16 }, // رقم الهاتف
    { wch: 28 }, // نوع وموديل الجهاز
    { wch: 18 }, // السيريال
    { wch: 36 }, // وصف العطل
    { wch: 22 }, // الملحقات
    { wch: 28 }, // مركز الصيانة الخارجي
    { wch: 18 }, // تاريخ التسليم للصيانة
    { wch: 18 }, // تاريخ الاستلام من الصيانة
    { wch: 18 }, // حالة الجهاز
    { wch: 16 }, // التكلفة الفعلية
    { wch: 16 }, // المبلغ المطلوب
    { wch: 16 }, // صافي الربح
    { wch: 18 }, // تاريخ التسليم النهائي
    { wch: 32 }, // ملاحظات
  ];

  const workbook = XLSX.utils.book_new();
  if (!workbook.Workbook) workbook.Workbook = {};
  workbook.Workbook.Views = [{ RTL: true }];

  XLSX.utils.book_append_sheet(workbook, worksheet, 'سجل أجهزة الصيانة');

  const dateStamp = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `سجل_أجهزة_الصيانة_${dateStamp}.xlsx`);
}

export function downloadExcelTemplate(): void {
  const sampleTemplate = [
    {
      'كود التذكرة': 'MNT-2001',
      'رقم الدفعة / مرجع الشركة': 'CORP-105',
      'تاريخ الاستلام من العميل': '2026-11-08',
      'اسم العميل أو الشركة': 'شركة الفتح للتجارة',
      'اسم الموظف / المستخدم': 'أ. محمد عادل (الحسابات)',
      'رقم الهاتف': '01011223344',
      'نوع وموديل الجهاز': 'لابتوب Dell Inspiron 15',
      'الرقم التسلسلي (S/N)': 'DL-3511-901',
      'وصف العطل / المشكلة بالتفصيل': 'تغيير شاشة مكسورة + تنظيف مروحة التبريد',
      'الملحقات المستلمة': 'شاحن أصلي',
      'مركز الصيانة الخارجي / اسم الفني': 'المركز الهندسي',
      'تاريخ التسليم للصيانة الخارجية': '2026-11-08',
      'تاريخ الاستلام من الصيانة': '2026-11-09',
      'حالة الجهاز': 'تم الإصلاح',
      'التكلفة الفعلية للصيانة': 1800,
      'المبلغ المطلوب من العميل': 2300,
      'صافي الربح': 500,
      'تاريخ التسليم النهائي للعميل': '',
      'ملاحظات إضافية': 'ضمان 14 يوم على الشاشة',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleTemplate);
  worksheet['!cols'] = Object.keys(sampleTemplate[0]).map(() => ({ wch: 22 }));
  const workbook = XLSX.utils.book_new();
  if (!workbook.Workbook) workbook.Workbook = {};
  workbook.Workbook.Views = [{ RTL: true }];
  XLSX.utils.book_append_sheet(workbook, worksheet, 'قالب_الاستيراد');
  XLSX.writeFile(workbook, 'قالب_استيراد_أجهزة_الصيانة.xlsx');
}
