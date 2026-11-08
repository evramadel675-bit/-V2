import React, { useState, useEffect } from 'react';
import { X, Save, Settings, RotateCcw, Plus, Trash2 } from 'lucide-react';
import { WorkshopSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: WorkshopSettings;
  onSaveSettings: (newSettings: WorkshopSettings) => void;
  onRestoreSampleData: () => void;
}

const CURRENCY_OPTIONS = [
  { label: 'الجنيه المصري (ج.م)', value: 'ج.م' },
  { label: 'الريال السعودي (ر.س)', value: 'ر.س' },
  { label: 'الدولار الأمريكي ($)', value: '$' },
  { label: 'الدرهم الإماراتي (د.إ)', value: 'د.إ' },
  { label: 'الدينار الكويتي (د.ك)', value: 'د.ك' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onRestoreSampleData,
}) => {
  const [centerName, setCenterName] = useState(settings.centerName);
  const [centerSubtitle, setCenterSubtitle] = useState(settings.centerSubtitle);
  const [centerPhone, setCenterPhone] = useState(settings.centerPhone);
  const [centerAddress, setCenterAddress] = useState(settings.centerAddress);
  const [currency, setCurrency] = useState(settings.currency);
  const [defaultPrintFormat, setDefaultPrintFormat] = useState<'A4' | 'thermal80'>(
    settings.defaultPrintFormat
  );
  const [receiptTerms, setReceiptTerms] = useState<string[]>(settings.receiptTerms);
  const [newTerm, setNewTerm] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setCenterName(settings.centerName);
    setCenterSubtitle(settings.centerSubtitle);
    setCenterPhone(settings.centerPhone);
    setCenterAddress(settings.centerAddress);
    setCurrency(settings.currency);
    setDefaultPrintFormat(settings.defaultPrintFormat);
    setReceiptTerms(settings.receiptTerms);
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleAddTerm = () => {
    if (!newTerm.trim()) return;
    setReceiptTerms([...receiptTerms, newTerm.trim()]);
    setNewTerm('');
  };

  const handleRemoveTerm = (index: number) => {
    setReceiptTerms(receiptTerms.filter((_, i) => i !== index));
  };

  const handleTermChange = (index: number, val: string) => {
    const updated = [...receiptTerms];
    updated[index] = val;
    setReceiptTerms(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      centerName: centerName.trim() || 'مركز الصيانة المتكامل',
      centerSubtitle: centerSubtitle.trim(),
      centerPhone: centerPhone.trim(),
      centerAddress: centerAddress.trim(),
      currency: currency.trim() || 'ج.م',
      defaultPrintFormat,
      receiptTerms: receiptTerms.filter((t) => t.trim() !== ''),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto no-print">
      <div
        className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-2xl my-8 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">إعدادات المركز وإيصال الطباعة</h2>
              <p className="text-xs text-slate-400">
                تخصيص اسم المركز، العملة الافتراضية، وشروط الضمان في الإيصال المطبوع
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

        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5 flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                اسم المركز / الورشة (يظهر في الهيدر وإيصال الاستلام)
              </label>
              <input
                type="text"
                required
                value={centerName}
                onChange={(e) => setCenterName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                التخصص / الوصف الفرعي تحت اسم المركز
              </label>
              <input
                type="text"
                value={centerSubtitle}
                onChange={(e) => setCenterSubtitle(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                أرقام التواصل وخدمة العملاء
              </label>
              <input
                type="text"
                value={centerPhone}
                onChange={(e) => setCenterPhone(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono-num bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                العملة الافتراضية للحسابات
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 text-sm font-semibold bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                {CURRENCY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                عنوان المركز بالتفصيل
              </label>
              <input
                type="text"
                value={centerAddress}
                onChange={(e) => setCenterAddress(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                المقاس الافتراضي عند فتح معاينة طباعة الإيصال
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDefaultPrintFormat('A4')}
                  className={`px-4 py-2.5 text-xs font-semibold rounded-lg border text-right transition-colors ${
                    defaultPrintFormat === 'A4'
                      ? 'bg-blue-50 border-blue-600 text-blue-800'
                      : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-bold">إيصال رسمي قياسي (A4)</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    مناسب للطابعات المكتبية العادية والليزر
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setDefaultPrintFormat('thermal80')}
                  className={`px-4 py-2.5 text-xs font-semibold rounded-lg border text-right transition-colors ${
                    defaultPrintFormat === 'thermal80'
                      ? 'bg-blue-50 border-blue-600 text-blue-800'
                      : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-bold">إيصال حراري مدمج (80mm)</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    مناسب لطابعات الفواتير والكاشير الحرارية
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Warranty & Receipt Terms */}
          <div className="border-t border-slate-200 pt-4 space-y-3">
            <label className="block text-xs font-bold text-slate-800">
              بنود وشروط الاستلام والضمان المطبوعة في الإيصال:
            </label>

            <div className="space-y-2">
              {receiptTerms.map((term, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-xs font-mono-num text-slate-400 w-5">
                    {idx + 1}.
                  </span>
                  <input
                    type="text"
                    value={term}
                    onChange={(e) => handleTermChange(idx, e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveTerm(idx)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="حذف البند"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={newTerm}
                onChange={(e) => setNewTerm(e.target.value)}
                placeholder="أضف شرط ضمان أو بند استلام جديد..."
                className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <button
                type="button"
                onClick={handleAddTerm}
                className="px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-lg flex items-center gap-1 transition-colors whitespace-nowrap shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة بند</span>
              </button>
            </div>
          </div>

          {/* Restore Sample Data Action */}
          <div className="border-t border-slate-200 pt-4 flex items-center justify-between gap-4 bg-slate-50 p-3.5 rounded-lg">
            <div>
              <div className="text-xs font-bold text-slate-800">
                إعادة ضبط البيانات التجريبية الافتراضية
              </div>
              <div className="text-[11px] text-slate-500">
                استعادة التذاكر التجريبية الـ 6 الافتراضية في حال رغبتك بتجربة النظام من جديد
              </div>
            </div>
            <button
              type="button"
              onClick={onRestoreSampleData}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>استعادة البيانات التجريبية</span>
            </button>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <Save className="w-4 h-4" />
              <span>حفظ الإعدادات</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
