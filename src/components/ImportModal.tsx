import React from 'react';
import {
  FileSpreadsheet,
  X,
  CheckCircle2,
  PlusCircle,
  RefreshCw,
  Download,
} from 'lucide-react';
import { MaintenanceTicket } from '../types';
import { ParsedExcelResult, downloadExcelTemplate } from '../utils/excelService';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  parsedResult: ParsedExcelResult | null;
  currency: string;
  onConfirmImport: (tickets: MaintenanceTicket[], mode: 'append' | 'replace') => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  parsedResult,
  currency,
  onConfirmImport,
}) => {
  if (!isOpen || !parsedResult) return null;

  const { tickets, matchedColumns, skippedRows } = parsedResult;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto no-print">
      <div
        className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-3xl my-8 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">
                معاينة وتأكيد استيراد ملف الإكسل (Excel)
              </h2>
              <p className="text-xs text-slate-400">
                تمت مطابقة الأعمدة بذكاء واكتشاف{' '}
                <span className="font-mono-num text-emerald-400 font-bold">
                  {tickets.length}
                </span>{' '}
                جهاز جاهز للإضافة
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Matched Columns Info */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-4">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  الأعمدة التي تم التعرف عليها تلقائياً ({matchedColumns.length}):
                </span>
              </div>
              {skippedRows > 0 && (
                <span className="text-[11px] text-slate-500">
                  تم تخطي {skippedRows} صف فارغ/إجمالي
                </span>
              )}
            </div>
            <p className="text-xs text-emerald-800 leading-relaxed">
              {matchedColumns.length > 0
                ? matchedColumns.join(' · ')
                : 'تم استخلاص الصفوف وتوليد الحقول التلقائية'}
            </p>
          </div>

          {/* Preview Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-700">
                معاينة الأجهزة المستوردة (أول {Math.min(tickets.length, 8)} سجلات):
              </h3>
              <button
                type="button"
                onClick={downloadExcelTemplate}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>تحميل قالب إكسل قياسي</span>
              </button>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-x-auto">
              <table className="w-full text-xs text-right border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                    <th className="py-2.5 px-3 font-bold whitespace-nowrap">كود التذكرة</th>
                    <th className="py-2.5 px-3 font-bold whitespace-nowrap">اسم العميل</th>
                    <th className="py-2.5 px-3 font-bold whitespace-nowrap">الجهاز والموديل</th>
                    <th className="py-2.5 px-3 font-bold whitespace-nowrap">الحالة</th>
                    <th className="py-2.5 px-3 font-bold whitespace-nowrap">التكلفة</th>
                    <th className="py-2.5 px-3 font-bold whitespace-nowrap">المطلوب</th>
                    <th className="py-2.5 px-3 font-bold whitespace-nowrap">صافي الربح</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {tickets.slice(0, 8).map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-mono-num font-semibold text-blue-700 whitespace-nowrap">
                        {t.ticketCode}
                      </td>
                      <td className="py-2 px-3 font-medium text-slate-900">
                        {t.customerName}
                      </td>
                      <td className="py-2 px-3 text-slate-700">{t.deviceModel}</td>
                      <td className="py-2 px-3 text-slate-700 whitespace-nowrap">
                        {t.status}
                      </td>
                      <td className="py-2 px-3 font-mono-num whitespace-nowrap">
                        {t.actualCost.toLocaleString('en-US')} {currency}
                      </td>
                      <td className="py-2 px-3 font-mono-num whitespace-nowrap">
                        {t.customerPrice.toLocaleString('en-US')} {currency}
                      </td>
                      <td className="py-2 px-3 font-mono-num font-bold text-emerald-700 whitespace-nowrap">
                        {t.netProfit.toLocaleString('en-US')} {currency}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap"
          >
            إلغاء الاستيراد
          </button>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => onConfirmImport(tickets, 'replace')}
              className="px-4 py-2 text-xs font-semibold text-slate-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>استبدال الجدول الحالي بالكامل ({tickets.length})</span>
            </button>

            <button
              type="button"
              onClick={() => onConfirmImport(tickets, 'append')}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <PlusCircle className="w-4 h-4" />
              <span>إضافة إلى السجلات الحالية (+{tickets.length})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
