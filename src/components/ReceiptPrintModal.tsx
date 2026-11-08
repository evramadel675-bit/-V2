import React, { useState, useMemo, useEffect } from 'react';
import {
  Printer,
  X,
  FileText,
  Receipt,
  ShieldCheck,
  Wrench,
  Users,
  User,
} from 'lucide-react';
import { MaintenanceTicket, WorkshopSettings } from '../types';

interface ReceiptPrintModalProps {
  ticket: MaintenanceTicket | null;
  allTickets: MaintenanceTicket[];
  initialBatchMode?: boolean;
  settings: WorkshopSettings;
  onClose: () => void;
}

export const ReceiptPrintModal: React.FC<ReceiptPrintModalProps> = ({
  ticket,
  allTickets,
  initialBatchMode = false,
  settings,
  onClose,
}) => {
  const [printFormat, setPrintFormat] = useState<'A4' | 'thermal80'>(
    settings.defaultPrintFormat || 'A4'
  );
  const [receiptScope, setReceiptScope] = useState<'single' | 'company_batch'>(
    initialBatchMode ? 'company_batch' : 'single'
  );

  // Find all devices belonging to the same company batch (by batchCode if present, or same customerName)
  const relatedCompanyTickets = useMemo(() => {
    if (!ticket) return [];
    if (ticket.batchCode) {
      return allTickets.filter((t) => t.batchCode === ticket.batchCode);
    }
    return allTickets.filter(
      (t) =>
        t.customerName.trim().toLowerCase() ===
        ticket.customerName.trim().toLowerCase()
    );
  }, [ticket, allTickets]);

  useEffect(() => {
    if (!ticket) return;
    if (initialBatchMode && relatedCompanyTickets.length > 1) {
      setReceiptScope('company_batch');
    } else {
      setReceiptScope('single');
    }
  }, [ticket, initialBatchMode, relatedCompanyTickets.length]);

  if (!ticket) return null;

  const isMultiDeviceReceipt =
    receiptScope === 'company_batch' && relatedCompanyTickets.length > 1;
  const ticketsToPrint = isMultiDeviceReceipt
    ? relatedCompanyTickets
    : [ticket];

  const totalCustomerPrice = ticketsToPrint.reduce(
    (sum, t) => sum + t.customerPrice,
    0
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto print-only-container">
      <div
        className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-4xl my-6 overflow-hidden flex flex-col max-h-[92vh] print-only-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Action Bar (Hidden when printing) */}
        <div className="bg-slate-900 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 no-print">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">
                {isMultiDeviceReceipt
                  ? `معاينة إيصال استلام مجمع للشركة (${ticketsToPrint.length} أجهزة)`
                  : 'معاينة وطباعة إيصال استلام رسمي'}
              </h2>
              <p className="text-xs text-slate-400">
                {isMultiDeviceReceipt ? (
                  <>
                    الشركة: <span className="text-white font-semibold">{ticket.customerName}</span>
                    {ticket.batchCode && (
                      <>
                        {' '}
                        · مرجع الدفعة:{' '}
                        <span className="font-mono-num text-blue-400">
                          {ticket.batchCode}
                        </span>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    تذكرة رقم{' '}
                    <span className="font-mono-num text-blue-400">
                      {ticket.ticketCode}
                    </span>{' '}
                    — {ticket.customerName}
                    {ticket.employeeName ? ` (${ticket.employeeName})` : ''}
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Scope Switcher: Single Device vs Consolidated Company Receipt */}
            {relatedCompanyTickets.length > 1 && (
              <div className="flex items-center bg-slate-800 p-1 rounded-lg border border-slate-700">
                <button
                  type="button"
                  onClick={() => setReceiptScope('single')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                    receiptScope === 'single'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>إيصال منفصل لهذا الجهاز</span>
                </button>
                <button
                  type="button"
                  onClick={() => setReceiptScope('company_batch')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                    receiptScope === 'company_batch'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>
                    إيصال مجمع للشركة ({relatedCompanyTickets.length} أجهزة)
                  </span>
                </button>
              </div>
            )}

            {/* Format Switcher: A4 vs Thermal 80mm */}
            <div className="flex items-center bg-slate-800 p-1 rounded-lg border border-slate-700">
              <button
                type="button"
                onClick={() => setPrintFormat('A4')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                  printFormat === 'A4'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>A4 رسمي</span>
              </button>
              <button
                type="button"
                onClick={() => setPrintFormat('thermal80')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                  printFormat === 'thermal80'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>حراري 80mm</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة الإيصال الآن</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              aria-label="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Canvas Area */}
        <div className="overflow-y-auto p-6 bg-slate-100 flex-1 flex justify-center print-only-container">
          {printFormat === 'A4' ? (
            /* ==================== A4 OFFICIAL RECEIPT SLIP ==================== */
            <div className="bg-white border border-slate-300 rounded-lg p-8 w-full max-w-[210mm] text-slate-900 shadow-xs print-a4-sheet">
              {/* Header */}
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-5 mb-6">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                    <Wrench className="w-6 h-6" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-slate-900">
                      {settings.centerName}
                    </h1>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {settings.centerSubtitle}
                    </p>
                    <p className="text-xs text-slate-600 mt-1">
                      {settings.centerAddress} · هاتف:{' '}
                      <span className="font-mono-num font-semibold">
                        {settings.centerPhone}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="text-left border border-slate-900 rounded-lg px-4 py-2.5 bg-slate-50">
                  <div className="text-[11px] font-semibold text-slate-500">
                    {isMultiDeviceReceipt
                      ? 'إيصال استلام مجمع للشركات'
                      : 'إيصال استلام جهاز صيانة'}
                  </div>
                  <div className="text-lg font-bold font-mono-num text-slate-900 mt-0.5">
                    {isMultiDeviceReceipt
                      ? ticket.batchCode || `دفعة (${ticketsToPrint.length} أجهزة)`
                      : ticket.ticketCode}
                  </div>
                  <div className="text-xs text-slate-600 font-mono-num">
                    التاريخ: {ticket.receivedDate}
                  </div>
                </div>
              </div>

              {isMultiDeviceReceipt ? (
                /* ---------- MULTI-DEVICE CORPORATE A4 LAYOUT ---------- */
                <>
                  <div className="border border-slate-300 rounded-lg p-4 mb-5 bg-slate-50/60">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-xs text-slate-500 block">
                          اسم الشركة / الجهة:
                        </span>
                        <span className="font-bold text-slate-900">
                          {ticket.customerName}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500 block">
                          رقم الهاتف للتواصل:
                        </span>
                        <span
                          className="font-mono-num font-semibold text-slate-900"
                          dir="ltr"
                        >
                          {ticket.phone || 'غير مسجل'}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500 block">
                          إجمالي الأجهزة المستلمة:
                        </span>
                        <span className="font-mono-num font-bold text-slate-900">
                          {ticketsToPrint.length} أجهزة
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Multi-Device Table */}
                  <div className="border border-slate-300 rounded-lg overflow-hidden mb-6">
                    <table className="w-full text-xs text-right border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-800 border-b border-slate-300">
                          <th className="py-2.5 px-3 font-bold border-l border-slate-300">
                            # / الكود
                          </th>
                          <th className="py-2.5 px-3 font-bold border-l border-slate-300">
                            الموظف / المستخدم
                          </th>
                          <th className="py-2.5 px-3 font-bold border-l border-slate-300">
                            نوع وموديل الجهاز
                          </th>
                          <th className="py-2.5 px-3 font-bold border-l border-slate-300">
                            السيريال S/N
                          </th>
                          <th className="py-2.5 px-3 font-bold border-l border-slate-300">
                            وصف العطل
                          </th>
                          <th className="py-2.5 px-3 font-bold border-l border-slate-300">
                            الملحقات
                          </th>
                          <th className="py-2.5 px-3 font-bold">
                            التكلفة ({settings.currency})
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {ticketsToPrint.map((item, idx) => (
                          <tr key={item.id}>
                            <td className="py-2 px-3 font-mono-num font-bold border-l border-slate-200 whitespace-nowrap">
                              {idx + 1}. {item.ticketCode}
                            </td>
                            <td className="py-2 px-3 font-semibold text-slate-900 border-l border-slate-200">
                              {item.employeeName || '-'}
                            </td>
                            <td className="py-2 px-3 font-bold text-slate-900 border-l border-slate-200">
                              {item.deviceModel}
                            </td>
                            <td className="py-2 px-3 font-mono-num text-slate-700 border-l border-slate-200">
                              {item.serialNumber || '-'}
                            </td>
                            <td className="py-2 px-3 text-slate-800 border-l border-slate-200">
                              {item.issueDescription}
                            </td>
                            <td className="py-2 px-3 text-slate-700 border-l border-slate-200">
                              {item.accessories || 'بدون'}
                            </td>
                            <td className="py-2 px-3 font-mono-num font-bold text-slate-900 whitespace-nowrap">
                              {item.customerPrice > 0
                                ? `${item.customerPrice.toLocaleString('en-US')}`
                                : 'بعد الفحص'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-slate-50 border-t-2 border-slate-300 font-bold text-sm">
                          <td
                            colSpan={6}
                            className="py-2.5 px-4 text-left border-l border-slate-300"
                          >
                            إجمالي المبلغ المطلوب للأجهزة ({ticketsToPrint.length}{' '}
                            أجهزة):
                          </td>
                          <td className="py-2.5 px-3 font-mono-num text-slate-900 whitespace-nowrap">
                            {totalCustomerPrice > 0
                              ? `${totalCustomerPrice.toLocaleString('en-US')} ${settings.currency}`
                              : 'يحدد بعد الفحص'}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </>
              ) : (
                /* ---------- SINGLE DEVICE A4 LAYOUT ---------- */
                <>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="border border-slate-300 rounded-lg p-4">
                      <div className="text-xs font-bold text-slate-500 mb-2 border-b border-slate-200 pb-1.5">
                        بيانات العميل / الجهة
                      </div>
                      <div className="space-y-1.5 text-sm">
                        <div className="flex justify-between gap-2">
                          <span className="text-slate-600">
                            اسم العميل / الشركة:
                          </span>
                          <span className="font-bold text-slate-900">
                            {ticket.customerName}
                          </span>
                        </div>
                        {ticket.employeeName && (
                          <div className="flex justify-between gap-2">
                            <span className="text-slate-600">
                              الموظف / المستخدم:
                            </span>
                            <span className="font-bold text-blue-800">
                              {ticket.employeeName}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between gap-2">
                          <span className="text-slate-600">رقم الهاتف:</span>
                          <span
                            className="font-mono-num font-semibold text-slate-900"
                            dir="ltr"
                          >
                            {ticket.phone || 'غير مسجل'}
                          </span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-slate-600">تاريخ الاستلام:</span>
                          <span className="font-mono-num font-semibold text-slate-900">
                            {ticket.receivedDate}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="border border-slate-300 rounded-lg p-4">
                      <div className="text-xs font-bold text-slate-500 mb-2 border-b border-slate-200 pb-1.5">
                        بيانات الجهاز وحالة الصيانة
                      </div>
                      <div className="space-y-1.5 text-sm">
                        <div className="flex justify-between gap-2">
                          <span className="text-slate-600">
                            نوع وموديل الجهاز:
                          </span>
                          <span className="font-bold text-slate-900">
                            {ticket.deviceModel}
                          </span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-slate-600">
                            الرقم التسلسلي (S/N):
                          </span>
                          <span className="font-mono-num font-semibold text-slate-900">
                            {ticket.serialNumber || 'غير محدد'}
                          </span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-slate-600">
                            حالة الجهاز الحالية:
                          </span>
                          <span className="font-bold text-slate-900">
                            {ticket.status}
                          </span>
                        </div>
                        {ticket.batchCode && (
                          <div className="flex justify-between gap-2">
                            <span className="text-slate-600">مرجع الدفعة:</span>
                            <span className="font-mono-num font-semibold text-slate-900">
                              {ticket.batchCode}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Issue, Accessories, and Financial Box */}
                  <div className="border border-slate-300 rounded-lg overflow-hidden mb-6">
                    <table className="w-full text-sm border-collapse">
                      <tbody>
                        <tr className="border-b border-slate-200">
                          <td className="bg-slate-50 font-bold text-slate-700 px-4 py-2.5 w-44 border-l border-slate-200">
                            وصف العطل / المشكلة
                          </td>
                          <td className="px-4 py-2.5 text-slate-900 font-medium">
                            {ticket.issueDescription}
                          </td>
                        </tr>
                        <tr className="border-b border-slate-200">
                          <td className="bg-slate-50 font-bold text-slate-700 px-4 py-2.5 border-l border-slate-200">
                            الملحقات المستلمة
                          </td>
                          <td className="px-4 py-2.5 text-slate-900">
                            {ticket.accessories || 'بدون ملحقات'}
                          </td>
                        </tr>
                        {ticket.notes && (
                          <tr className="border-b border-slate-200">
                            <td className="bg-slate-50 font-bold text-slate-700 px-4 py-2.5 border-l border-slate-200">
                              ملاحظات الفحص / التقرير
                            </td>
                            <td className="px-4 py-2.5 text-slate-800">
                              {ticket.notes}
                            </td>
                          </tr>
                        )}
                        <tr>
                          <td className="bg-slate-50 font-bold text-slate-700 px-4 py-3 border-l border-slate-200">
                            التكلفة المطلوبة من العميل
                          </td>
                          <td className="px-4 py-3 font-mono-num text-base font-bold text-slate-900">
                            {ticket.customerPrice > 0
                              ? `${ticket.customerPrice.toLocaleString('en-US')} ${settings.currency}`
                              : 'تحدد بعد الفحص الفني'}
                            {ticket.finalDeliveryDate && (
                              <span className="text-xs font-normal text-slate-600 mr-4">
                                · تاريخ التسليم للعميل:{' '}
                                {ticket.finalDeliveryDate}
                              </span>
                            )}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* Terms & Conditions */}
              <div className="bg-slate-50 border border-slate-300 rounded-lg p-4 mb-8">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-2">
                  <ShieldCheck className="w-4 h-4 text-slate-700" />
                  <span>شروط وتعهد استلام الجهاز والضمان:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-xs text-slate-700 leading-relaxed">
                  {settings.receiptTerms.map((term, idx) => (
                    <li key={idx}>{term}</li>
                  ))}
                </ol>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-8 pt-2">
                <div className="text-center">
                  <div className="text-xs font-bold text-slate-700 mb-8">
                    توقيع العميل / مندوب الشركة (مقرّاً بالبيانات والشروط أعلاه)
                  </div>
                  <div className="border-b border-dashed border-slate-400 w-48 mx-auto"></div>
                </div>
                <div className="text-center">
                  <div className="text-xs font-bold text-slate-700 mb-8">
                    توقيع المستلم / ختم المركز
                  </div>
                  <div className="border-b border-dashed border-slate-400 w-48 mx-auto"></div>
                </div>
              </div>
            </div>
          ) : (
            /* ==================== 80MM THERMAL RECEIPT SLIP ==================== */
            <div className="bg-white border border-slate-300 rounded-lg p-5 w-[80mm] text-slate-900 shadow-xs print-thermal-80mm">
              <div className="text-center border-b border-dashed border-slate-400 pb-3 mb-3">
                <h1 className="text-base font-bold text-slate-900">
                  {settings.centerName}
                </h1>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  {settings.centerPhone}
                </p>
                <div className="mt-2 inline-block border border-slate-900 px-3 py-1 rounded font-mono-num text-sm font-bold">
                  {isMultiDeviceReceipt
                    ? ticket.batchCode || `دفعة (${ticketsToPrint.length} أجهزة)`
                    : ticket.ticketCode}
                </div>
                <div className="text-[11px] text-slate-600 font-mono-num mt-1">
                  تاريخ الاستلام: {ticket.receivedDate}
                </div>
              </div>

              {isMultiDeviceReceipt ? (
                <div className="space-y-2 text-xs border-b border-dashed border-slate-400 pb-3 mb-3">
                  <div className="flex justify-between">
                    <span className="text-slate-600">الشركة:</span>
                    <span className="font-bold">{ticket.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">الهاتف:</span>
                    <span className="font-mono-num" dir="ltr">
                      {ticket.phone || '-'}
                    </span>
                  </div>
                  <div className="border-t border-slate-200 pt-2 space-y-2">
                    {ticketsToPrint.map((item, idx) => (
                      <div
                        key={item.id}
                        className="bg-slate-50 p-2 rounded border border-slate-200 space-y-0.5"
                      >
                        <div className="flex justify-between font-bold">
                          <span className="font-mono-num">
                            {idx + 1}. {item.ticketCode}
                          </span>
                          <span>{item.employeeName || ''}</span>
                        </div>
                        <div className="font-semibold text-slate-900">
                          {item.deviceModel}
                        </div>
                        <div className="text-[10px] text-slate-600">
                          العطل: {item.issueDescription}
                        </div>
                        <div className="flex justify-between text-[10px] pt-0.5">
                          <span>الملحقات: {item.accessories}</span>
                          <span className="font-mono-num font-bold">
                            {item.customerPrice > 0
                              ? `${item.customerPrice} ${settings.currency}`
                              : 'بعد الفحص'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-300 font-bold text-sm">
                    <span>الإجمالي ({ticketsToPrint.length} أجهزة):</span>
                    <span className="font-mono-num">
                      {totalCustomerPrice > 0
                        ? `${totalCustomerPrice.toLocaleString('en-US')} ${settings.currency}`
                        : 'يحدد بعد الفحص'}
                    </span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-1.5 text-xs border-b border-dashed border-slate-400 pb-3 mb-3">
                    <div className="flex justify-between">
                      <span className="text-slate-600">العميل/الشركة:</span>
                      <span className="font-bold">{ticket.customerName}</span>
                    </div>
                    {ticket.employeeName && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">الموظف/المستخدم:</span>
                        <span className="font-bold text-blue-800">
                          {ticket.employeeName}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-600">الهاتف:</span>
                      <span className="font-mono-num font-semibold" dir="ltr">
                        {ticket.phone || '-'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">الجهاز:</span>
                      <span className="font-bold text-left">
                        {ticket.deviceModel}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">S/N:</span>
                      <span className="font-mono-num">
                        {ticket.serialNumber || '-'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">الحالة:</span>
                      <span className="font-bold">{ticket.status}</span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs border-b border-dashed border-slate-400 pb-3 mb-3">
                    <div>
                      <span className="font-bold block text-slate-700">
                        العطل:
                      </span>
                      <p className="text-slate-900">
                        {ticket.issueDescription}
                      </p>
                    </div>
                    <div>
                      <span className="font-bold block text-slate-700">
                        الملحقات:
                      </span>
                      <p className="text-slate-900">
                        {ticket.accessories || 'بدون ملحقات'}
                      </p>
                    </div>
                    <div className="flex justify-between items-center pt-1 border-t border-slate-200 font-bold text-sm">
                      <span>المبلغ المطلوب:</span>
                      <span className="font-mono-num">
                        {ticket.customerPrice > 0
                          ? `${ticket.customerPrice.toLocaleString('en-US')} ${settings.currency}`
                          : 'يحدد بعد الفحص'}
                      </span>
                    </div>
                  </div>
                </>
              )}

              <div className="text-[10px] text-slate-600 space-y-1 mb-4 leading-snug">
                {settings.receiptTerms.map((term, idx) => (
                  <p key={idx}>• {term}</p>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4 text-center text-[11px] pt-2 border-t border-dashed border-slate-400">
                <div>
                  <span className="block mb-5 font-semibold">توقيع العميل</span>
                  <div className="border-b border-slate-400"></div>
                </div>
                <div>
                  <span className="block mb-5 font-semibold">
                    توقيع المستلم
                  </span>
                  <div className="border-b border-slate-400"></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
