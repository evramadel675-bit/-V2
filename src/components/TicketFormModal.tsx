import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Wrench,
  User,
  Laptop,
  Building2,
  Calculator,
  Calendar,
  FileText,
  AlertCircle,
  Plus,
  Trash2,
  Users,
  Printer,
  Copy,
} from 'lucide-react';
import { MaintenanceTicket, TICKET_STATUSES, TicketStatus } from '../types';

export interface CorporateDeviceItem {
  tempId: string;
  employeeName: string;
  deviceModel: string;
  serialNumber: string;
  issueDescription: string;
  accessories: string;
  externalCenter: string;
  status: TicketStatus;
  actualCost: string;
  customerPrice: string;
  notes: string;
}

interface TicketFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (ticket: MaintenanceTicket, printAfterSave?: boolean) => void;
  onSaveBatch: (
    tickets: MaintenanceTicket[],
    printConsolidatedAfterSave?: boolean
  ) => void;
  initialTicket: MaintenanceTicket | null;
  nextTicketCode: string;
  nextBatchCode: string;
  allTickets: MaintenanceTicket[];
  currency: string;
  existingCenters: string[];
}

const COMMON_ACCESSORIES = [
  'شاحن أصلي',
  'كابل باور',
  'ريموت كنترول',
  'أدابتور 12V',
  'حقيبة لابتوب',
  'ماوس',
  'بدون ملحقات',
];

function createBlankDeviceItem(defaultCenter = ''): CorporateDeviceItem {
  return {
    tempId: `dev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    employeeName: '',
    deviceModel: '',
    serialNumber: '',
    issueDescription: '',
    accessories: 'بدون ملحقات',
    externalCenter: defaultCenter,
    status: 'قيد الفحص',
    actualCost: '0',
    customerPrice: '0',
    notes: '',
  };
}

export const TicketFormModal: React.FC<TicketFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onSaveBatch,
  initialTicket,
  nextTicketCode,
  nextBatchCode,
  allTickets,
  currency,
  existingCenters,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  // Mode: 'single' vs 'corporate_batch'
  const [entryMode, setEntryMode] = useState<'single' | 'corporate_batch'>('single');

  // Shared / Single Fields
  const [ticketCode, setTicketCode] = useState(nextTicketCode);
  const [batchCode, setBatchCode] = useState('');
  const [receivedDate, setReceivedDate] = useState(todayStr);
  const [customerName, setCustomerName] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [phone, setPhone] = useState('');
  const [deviceModel, setDeviceModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [accessories, setAccessories] = useState('');
  const [externalCenter, setExternalCenter] = useState('');
  const [sentToCenterDate, setSentToCenterDate] = useState('');
  const [receivedFromCenterDate, setReceivedFromCenterDate] = useState('');
  const [status, setStatus] = useState<TicketStatus>('قيد الفحص');
  const [actualCost, setActualCost] = useState<string>('0');
  const [customerPrice, setCustomerPrice] = useState<string>('0');
  const [finalDeliveryDate, setFinalDeliveryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Multi-device corporate batch state
  const [corporateDevices, setCorporateDevices] = useState<CorporateDeviceItem[]>([
    createBlankDeviceItem(),
    createBlankDeviceItem(),
  ]);

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg('');
    if (initialTicket) {
      setEntryMode('single');
      setTicketCode(initialTicket.ticketCode);
      setBatchCode(initialTicket.batchCode || '');
      setReceivedDate(initialTicket.receivedDate || todayStr);
      setCustomerName(initialTicket.customerName);
      setEmployeeName(initialTicket.employeeName || '');
      setPhone(initialTicket.phone);
      setDeviceModel(initialTicket.deviceModel);
      setSerialNumber(initialTicket.serialNumber);
      setIssueDescription(initialTicket.issueDescription);
      setAccessories(initialTicket.accessories);
      setExternalCenter(initialTicket.externalCenter);
      setSentToCenterDate(initialTicket.sentToCenterDate);
      setReceivedFromCenterDate(initialTicket.receivedFromCenterDate);
      setStatus(initialTicket.status);
      setActualCost(String(initialTicket.actualCost));
      setCustomerPrice(String(initialTicket.customerPrice));
      setFinalDeliveryDate(initialTicket.finalDeliveryDate);
      setNotes(initialTicket.notes);
    } else {
      setEntryMode('single');
      setTicketCode(nextTicketCode);
      setBatchCode(nextBatchCode);
      setReceivedDate(todayStr);
      setCustomerName('');
      setEmployeeName('');
      setPhone('');
      setDeviceModel('');
      setSerialNumber('');
      setIssueDescription('');
      setAccessories('بدون ملحقات');
      setExternalCenter('');
      setSentToCenterDate('');
      setReceivedFromCenterDate('');
      setStatus('قيد الفحص');
      setActualCost('0');
      setCustomerPrice('0');
      setFinalDeliveryDate('');
      setNotes('');
      setCorporateDevices([createBlankDeviceItem(), createBlankDeviceItem()]);
    }
  }, [isOpen, initialTicket, nextTicketCode, nextBatchCode, todayStr]);

  if (!isOpen) return null;

  // Single ticket profit math
  const parsedActualCost = parseFloat(actualCost) || 0;
  const parsedCustomerPrice = parseFloat(customerPrice) || 0;
  const calculatedNetProfit = parsedCustomerPrice - parsedActualCost;

  // Corporate batch totals math
  const batchTotals = corporateDevices.reduce(
    (acc, dev) => {
      const c = parseFloat(dev.actualCost) || 0;
      const p = parseFloat(dev.customerPrice) || 0;
      acc.cost += c;
      acc.price += p;
      acc.profit += p - c;
      return acc;
    },
    { cost: 0, price: 0, profit: 0 }
  );

  // Compute starting ticket number for batch preview
  const getStartingTicketNum = (): number => {
    let maxNumber = 1000;
    for (const t of allTickets) {
      const match = t.ticketCode.match(/(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNumber) {
          maxNumber = num;
        }
      }
    }
    return maxNumber + 1;
  };

  const startingNum = getStartingTicketNum();

  const handleStatusChange = (newStatus: TicketStatus) => {
    setStatus(newStatus);
    if (newStatus === 'تم التسليم للعميل' && !finalDeliveryDate) {
      setFinalDeliveryDate(todayStr);
    }
    if (newStatus === 'تم الإرسال للصيانة' && !sentToCenterDate) {
      setSentToCenterDate(todayStr);
    }
    if (
      (newStatus === 'تم الإصلاح' || newStatus === 'تعذر الإصلاح') &&
      sentToCenterDate &&
      !receivedFromCenterDate
    ) {
      setReceivedFromCenterDate(todayStr);
    }
  };

  const handleAccessoryQuickAdd = (item: string) => {
    if (!accessories || accessories === 'بدون ملحقات') {
      setAccessories(item);
      return;
    }
    if (!accessories.includes(item)) {
      setAccessories(`${accessories} + ${item}`);
    }
  };

  const handleUpdateCorporateDevice = (
    index: number,
    field: keyof CorporateDeviceItem,
    value: string
  ) => {
    setCorporateDevices((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleAddCorporateDeviceRow = () => {
    setCorporateDevices((prev) => [
      ...prev,
      createBlankDeviceItem(externalCenter),
    ]);
  };

  const handleDuplicateCorporateDeviceRow = (index: number) => {
    const source = corporateDevices[index];
    setCorporateDevices((prev) => [
      ...prev.slice(0, index + 1),
      {
        ...source,
        tempId: `dev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        serialNumber: '',
      },
      ...prev.slice(index + 1),
    ]);
  };

  const handleRemoveCorporateDeviceRow = (index: number) => {
    if (corporateDevices.length <= 1) return;
    setCorporateDevices((prev) => prev.filter((_, i) => i !== index));
  };

  const submitSingle = (printAfterSave: boolean) => {
    if (!customerName.trim()) {
      setErrorMsg('يرجى إدخال اسم العميل أو الشركة.');
      return;
    }
    if (!deviceModel.trim()) {
      setErrorMsg('يرجى إدخال نوع وموديل الجهاز.');
      return;
    }
    if (!issueDescription.trim()) {
      setErrorMsg('يرجى إدخال وصف العطل أو المشكلة بالتفصيل.');
      return;
    }

    const savedTicket: MaintenanceTicket = {
      id: initialTicket ? initialTicket.id : `mnt-${Date.now()}`,
      ticketCode: ticketCode.trim() || nextTicketCode,
      batchCode: batchCode.trim() || undefined,
      receivedDate: receivedDate || todayStr,
      customerName: customerName.trim(),
      employeeName: employeeName.trim() || undefined,
      phone: phone.trim(),
      deviceModel: deviceModel.trim(),
      serialNumber: serialNumber.trim(),
      issueDescription: issueDescription.trim(),
      accessories: accessories.trim() || 'بدون ملحقات',
      externalCenter: externalCenter.trim(),
      sentToCenterDate,
      receivedFromCenterDate,
      status,
      actualCost: parsedActualCost,
      customerPrice: parsedCustomerPrice,
      netProfit: calculatedNetProfit,
      finalDeliveryDate,
      notes: notes.trim(),
    };

    onSave(savedTicket, printAfterSave);
  };

  const submitCorporateBatch = (printConsolidated: boolean) => {
    if (!customerName.trim()) {
      setErrorMsg('يرجى إدخال اسم الشركة أو الجهة المالكة للأجهزة.');
      return;
    }

    for (let i = 0; i < corporateDevices.length; i++) {
      const dev = corporateDevices[i];
      if (!dev.deviceModel.trim()) {
        setErrorMsg(`يرجى إدخال نوع وموديل الجهاز في الصف رقم (${i + 1}).`);
        return;
      }
      if (!dev.issueDescription.trim()) {
        setErrorMsg(`يرجى إدخال وصف العطل للجهاز في الصف رقم (${i + 1}).`);
        return;
      }
    }

    const effectiveBatchCode = batchCode.trim() || nextBatchCode;
    const baseNum = startingNum;

    const createdTickets: MaintenanceTicket[] = corporateDevices.map(
      (dev, idx) => {
        const cCost = parseFloat(dev.actualCost) || 0;
        const cPrice = parseFloat(dev.customerPrice) || 0;
        const devStatus = dev.status || 'قيد الفحص';

        return {
          id: `mnt-batch-${Date.now()}-${idx}`,
          ticketCode: `MNT-${baseNum + idx}`,
          batchCode: effectiveBatchCode,
          receivedDate: receivedDate || todayStr,
          customerName: customerName.trim(),
          employeeName: dev.employeeName.trim() || `جهاز رقم ${idx + 1}`,
          phone: phone.trim(),
          deviceModel: dev.deviceModel.trim(),
          serialNumber: dev.serialNumber.trim(),
          issueDescription: dev.issueDescription.trim(),
          accessories: dev.accessories.trim() || 'بدون ملحقات',
          externalCenter: dev.externalCenter.trim() || externalCenter.trim(),
          sentToCenterDate:
            devStatus === 'تم الإرسال للصيانة' ? todayStr : '',
          receivedFromCenterDate: '',
          status: devStatus,
          actualCost: cCost,
          customerPrice: cPrice,
          netProfit: cPrice - cCost,
          finalDeliveryDate:
            devStatus === 'تم التسليم للعميل' ? todayStr : '',
          notes: dev.notes.trim() || notes.trim(),
        };
      }
    );

    onSaveBatch(createdTickets, printConsolidated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (entryMode === 'corporate_batch' && !initialTicket) {
      submitCorporateBatch(false);
    } else {
      submitSingle(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto no-print">
      <div
        className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-5xl my-6 overflow-hidden flex flex-col max-h-[94vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                {initialTicket
                  ? 'تعديل بيانات تذكرة الصيانة'
                  : entryMode === 'corporate_batch'
                  ? 'استلام أجهزة متعددة لشركة / جهة واحدة'
                  : 'تسجيل جهاز صيانة جديد'}
              </h2>
              <p className="text-xs text-slate-400">
                {entryMode === 'corporate_batch' && !initialTicket ? (
                  <>
                    الرقم المرجعي الموحد للشركة:{' '}
                    <span className="font-mono-num text-blue-400 font-semibold">
                      {batchCode || nextBatchCode}
                    </span>{' '}
                    · عدد الأجهزة:{' '}
                    <span className="font-mono-num text-emerald-400 font-bold">
                      {corporateDevices.length}
                    </span>
                  </>
                ) : (
                  <>
                    كود التذكرة المرجعي:{' '}
                    <span className="font-mono-num text-blue-400 font-semibold">
                      {ticketCode}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher Bar (Single vs Multi-Device Corporate Batch) */}
        {!initialTicket && (
          <div className="bg-slate-100 px-6 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <span className="text-xs font-bold text-slate-700">
              اختر نمط استلام الأجهزة:
            </span>
            <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-slate-300">
              <button
                type="button"
                onClick={() => {
                  setEntryMode('single');
                  setErrorMsg('');
                }}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-md flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                  entryMode === 'single'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>استلام جهاز فردي (عميل / شركة)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setEntryMode('corporate_batch');
                  setErrorMsg('');
                }}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-md flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                  entryMode === 'corporate_batch'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>استلام أجهزة متعددة لشركة / جهة واحدة</span>
              </button>
            </div>
          </div>
        )}

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          className="overflow-y-auto p-6 space-y-6 flex-1"
        >
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2.5 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {entryMode === 'corporate_batch' && !initialTicket ? (
            /* ==================== CORPORATE MULTI-DEVICE BATCH MODE ==================== */
            <>
              {/* Step 1: Unified Company Info */}
              <div className="bg-blue-50/40 border border-blue-200 rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-blue-200/80 pb-2">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <span>1. البيانات الموحدة للشركة / الجهة (تُدخل مرة واحدة)</span>
                  </div>
                  <span className="text-xs font-mono-num text-blue-700 font-semibold">
                    دفعة رقم: {batchCode || nextBatchCode}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      اسم الشركة / المؤسسة / الجهة <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="مثال: شركة الأمل للمقاولات والتوريدات"
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      رقم هاتف المسؤول / الشركة
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="01012345678"
                      dir="ltr"
                      className="w-full px-3 py-2 text-sm font-mono-num text-right bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      تاريخ الاستلام الموحد
                    </label>
                    <input
                      type="date"
                      value={receivedDate}
                      onChange={(e) => setReceivedDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm font-mono-num bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>
              </div>

              {/* Step 2: Sub-Table of Multiple Devices */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                    <Laptop className="w-4 h-4 text-blue-600" />
                    <span>
                      2. قائمة الأجهزة المسحوبة من الشركة ({corporateDevices.length} أجهزة)
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddCorporateDeviceRow}
                    className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة جهاز آخر للشركة</span>
                  </button>
                </div>

                <datalist id="centers-list-batch">
                  {existingCenters.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>

                <div className="space-y-3">
                  {corporateDevices.map((dev, idx) => {
                    const rowProfit =
                      (parseFloat(dev.customerPrice) || 0) -
                      (parseFloat(dev.actualCost) || 0);
                    const previewCode = `MNT-${startingNum + idx}`;

                    return (
                      <div
                        key={dev.tempId}
                        className="bg-slate-50 border border-slate-300 rounded-xl p-4 space-y-3 transition-all"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 bg-slate-900 text-white rounded text-xs font-bold">
                              جهاز #{idx + 1}
                            </span>
                            <span className="text-xs font-mono-num font-bold text-blue-700">
                              {previewCode}
                            </span>
                            {customerName && (
                              <span className="text-xs text-slate-600">
                                — {customerName}
                                {dev.employeeName ? ` (${dev.employeeName})` : ''}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleDuplicateCorporateDeviceRow(idx)}
                              className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-md flex items-center gap-1 cursor-pointer"
                              title="تكرار بيانات هذا الجهاز لموظف آخر"
                            >
                              <Copy className="w-3 h-3" />
                              <span>تكرار الجهاز</span>
                            </button>

                            {corporateDevices.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveCorporateDeviceRow(idx)}
                                className="px-2.5 py-1 text-[11px] font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md flex items-center gap-1 cursor-pointer"
                                title="حذف هذا الجهاز من الدفعة"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>إزالة</span>
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              اسم الموظف / المستخدم / القسم <span className="text-blue-600">*</span>
                            </label>
                            <input
                              type="text"
                              value={dev.employeeName}
                              onChange={(e) =>
                                handleUpdateCorporateDevice(
                                  idx,
                                  'employeeName',
                                  e.target.value
                                )
                              }
                              placeholder="مثال: أ. أحمد (المحاسبة) / جهاز المدير"
                              className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                            />
                          </div>

                          <div className="lg:col-span-2">
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              نوع وموديل الجهاز <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={dev.deviceModel}
                              onChange={(e) =>
                                handleUpdateCorporateDevice(
                                  idx,
                                  'deviceModel',
                                  e.target.value
                                )
                              }
                              placeholder="مثال: لابتوب Dell Latitude 5520 / طابعة HP"
                              className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              الرقم التسلسلي (S/N)
                            </label>
                            <input
                              type="text"
                              value={dev.serialNumber}
                              onChange={(e) =>
                                handleUpdateCorporateDevice(
                                  idx,
                                  'serialNumber',
                                  e.target.value
                                )
                              }
                              placeholder="SN-12345"
                              className="w-full px-2.5 py-1.5 text-xs font-mono-num bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              وصف العطل الخاص بهذا الجهاز <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={dev.issueDescription}
                              onChange={(e) =>
                                handleUpdateCorporateDevice(
                                  idx,
                                  'issueDescription',
                                  e.target.value
                                )
                              }
                              placeholder="مثال: فصل باور / كسر مفصلات / لا يعمل..."
                              className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              الملحقات المستلمة مع الجهاز
                            </label>
                            <input
                              type="text"
                              value={dev.accessories}
                              onChange={(e) =>
                                handleUpdateCorporateDevice(
                                  idx,
                                  'accessories',
                                  e.target.value
                                )
                              }
                              placeholder="شاحن أصلي + كابل باور..."
                              className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              مركز الصيانة / الفني
                            </label>
                            <input
                              type="text"
                              list="centers-list-batch"
                              value={dev.externalCenter}
                              onChange={(e) =>
                                handleUpdateCorporateDevice(
                                  idx,
                                  'externalCenter',
                                  e.target.value
                                )
                              }
                              placeholder="اختياري..."
                              className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              التكلفة الفعلية ({currency})
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={dev.actualCost}
                              onChange={(e) =>
                                handleUpdateCorporateDevice(
                                  idx,
                                  'actualCost',
                                  e.target.value
                                )
                              }
                              className="w-full px-2.5 py-1.5 text-xs font-mono-num bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              المبلغ المطلوب ({currency})
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={dev.customerPrice}
                              onChange={(e) =>
                                handleUpdateCorporateDevice(
                                  idx,
                                  'customerPrice',
                                  e.target.value
                                )
                              }
                              className="w-full px-2.5 py-1.5 text-xs font-mono-num bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                            />
                          </div>

                          <div className="flex flex-col justify-center bg-white border border-slate-200 rounded-lg px-3 py-1.5">
                            <span className="text-[10px] text-slate-500">
                              صافي ربح الجهاز:
                            </span>
                            <span
                              className={`text-xs font-mono-num font-bold ${
                                rowProfit > 0
                                  ? 'text-emerald-600'
                                  : rowProfit < 0
                                  ? 'text-red-600'
                                  : 'text-slate-700'
                              }`}
                            >
                              {rowProfit.toLocaleString('en-US')} {currency}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Batch Summary Bar */}
                <div className="bg-slate-900 text-white rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
                  <div className="text-xs">
                    <span className="text-slate-400">إجمالي أجهزة الدفعة:</span>{' '}
                    <strong className="font-mono-num text-white text-sm">
                      {corporateDevices.length} أجهزة
                    </strong>
                  </div>

                  <div className="flex flex-wrap items-center gap-5 font-mono-num text-xs">
                    <div>
                      <span className="text-slate-400 font-sans">إجمالي التكلفة: </span>
                      <strong>
                        {batchTotals.cost.toLocaleString('en-US')} {currency}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 font-sans">إجمالي المطلوب: </span>
                      <strong>
                        {batchTotals.price.toLocaleString('en-US')} {currency}
                      </strong>
                    </div>
                    <div className="text-emerald-400 font-bold text-sm">
                      <span className="font-sans">إجمالي صافي الربح: </span>
                      {batchTotals.profit.toLocaleString('en-US')} {currency}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* ==================== SINGLE DEVICE ENTRY / EDIT MODE ==================== */
            <>
              {/* Section 1: بيانات التذكرة والعميل */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-800 border-b border-slate-200 pb-2">
                  <User className="w-4 h-4 text-blue-600" />
                  <span>بيانات الاستلام والعميل / الشركة</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      كود التذكرة (تلقائي)
                    </label>
                    <input
                      type="text"
                      value={ticketCode}
                      onChange={(e) => setTicketCode(e.target.value)}
                      className="w-full px-3 py-2 text-sm font-mono-num font-semibold bg-slate-100 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                      placeholder="MNT-1001"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      تاريخ الاستلام
                    </label>
                    <input
                      type="date"
                      value={receivedDate}
                      onChange={(e) => setReceivedDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm font-mono-num bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      اسم العميل أو الشركة <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="مثال: شركة الأمل / أ. محمود"
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      اسم الموظف / المستخدم (للشركات)
                    </label>
                    <input
                      type="text"
                      value={employeeName}
                      onChange={(e) => setEmployeeName(e.target.value)}
                      placeholder="مثال: أ. أحمد (المحاسبة)"
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      رقم الهاتف
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="01012345678"
                      dir="ltr"
                      className="w-full px-3 py-2 text-sm font-mono-num text-right bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: بيانات الجهاز والعطل والملحقات */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-800 border-b border-slate-200 pb-2">
                  <Laptop className="w-4 h-4 text-blue-600" />
                  <span>بيانات الجهاز والعطل والملحقات</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      نوع وموديل الجهاز (لابتوب، ريسيفر، شاشة، كاميرات...){' '}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={deviceModel}
                      onChange={(e) => setDeviceModel(e.target.value)}
                      placeholder="مثال: لابتوب Dell Latitude 5520 / شاشة LG 43 سمارت"
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      الرقم التسلسلي (S/N)
                    </label>
                    <input
                      type="text"
                      value={serialNumber}
                      onChange={(e) => setSerialNumber(e.target.value)}
                      placeholder="مثال: SN-894120X"
                      className="w-full px-3 py-2 text-sm font-mono-num bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    وصف العطل / المشكلة بالتفصيل{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={issueDescription}
                    onChange={(e) => setIssueDescription(e.target.value)}
                    placeholder="اكتب شكوى العميل وتفاصيل العطل الظاهري عند الاستلام..."
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      الملحقات المستلمة مع الجهاز
                    </label>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] text-slate-500">
                        إضافة سريعة:
                      </span>
                      {COMMON_ACCESSORIES.map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => handleAccessoryQuickAdd(item)}
                          className="text-[11px] px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors whitespace-nowrap cursor-pointer"
                        >
                          + {item}
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    type="text"
                    value={accessories}
                    onChange={(e) => setAccessories(e.target.value)}
                    placeholder="مثال: شاحن أصلي + كابل باور + ريموت..."
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              {/* Section 3: بيانات الصيانة الخارجية والحالة والتواريخ */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-800 border-b border-slate-200 pb-2">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span>حالة الجهاز والمتابعة مع مركز الصيانة / الفني</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      حالة الجهاز الحالية
                    </label>
                    <select
                      value={status}
                      onChange={(e) =>
                        handleStatusChange(e.target.value as TicketStatus)
                      }
                      className="w-full px-3 py-2 text-sm font-semibold bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      {TICKET_STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      مركز الصيانة الخارجي / اسم الفني
                    </label>
                    <input
                      type="text"
                      list="centers-list"
                      value={externalCenter}
                      onChange={(e) => setExternalCenter(e.target.value)}
                      placeholder="مثال: تكنو لاب - م. أحمد فؤاد"
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                    <datalist id="centers-list">
                      {existingCenters.map((c) => (
                        <option key={c} value={c} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      <Calendar className="w-3.5 h-3.5 inline ml-1 text-slate-400" />
                      تاريخ التسليم للصيانة الخارجية
                    </label>
                    <input
                      type="date"
                      value={sentToCenterDate}
                      onChange={(e) => setSentToCenterDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm font-mono-num bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      <Calendar className="w-3.5 h-3.5 inline ml-1 text-slate-400" />
                      تاريخ الاستلام من الصيانة
                    </label>
                    <input
                      type="date"
                      value={receivedFromCenterDate}
                      onChange={(e) =>
                        setReceivedFromCenterDate(e.target.value)
                      }
                      className="w-full px-3 py-2 text-sm font-mono-num bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      <Calendar className="w-3.5 h-3.5 inline ml-1 text-slate-400" />
                      تاريخ التسليم النهائي للعميل
                    </label>
                    <input
                      type="date"
                      value={finalDeliveryDate}
                      onChange={(e) => setFinalDeliveryDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm font-mono-num bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      رقم مرجع دفعة الشركة (اختياري)
                    </label>
                    <input
                      type="text"
                      value={batchCode}
                      onChange={(e) => setBatchCode(e.target.value)}
                      placeholder="مثال: CORP-101"
                      className="w-full px-3 py-2 text-sm font-mono-num bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: الحسابات المالية والأرباح والملاحظات */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-800 border-b border-slate-200 pb-2">
                  <Calculator className="w-4 h-4 text-blue-600" />
                  <span>التكلفة الفعلية والمبلغ المطلوب وصافي الربح</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      التكلفة الفعلية للصيانة ({currency})
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={actualCost}
                      onChange={(e) => setActualCost(e.target.value)}
                      className="w-full px-3 py-2 text-sm font-mono-num font-semibold bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      المبلغ المدفوع لمركز الصيانة أو قطع الغيار
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      المبلغ المطلوب من العميل ({currency})
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={customerPrice}
                      onChange={(e) => setCustomerPrice(e.target.value)}
                      className="w-full px-3 py-2 text-sm font-mono-num font-semibold bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      إجمالي الفاتورة المستحقة على العميل
                    </span>
                  </div>

                  <div className="flex flex-col justify-between bg-white px-4 py-3 rounded-lg border border-slate-200">
                    <span className="text-xs font-semibold text-slate-600">
                      صافي الربح (يحسب تلقائياً)
                    </span>
                    <div
                      className={`text-xl font-bold font-mono-num mt-1 ${
                        calculatedNetProfit > 0
                          ? 'text-emerald-600'
                          : calculatedNetProfit < 0
                          ? 'text-red-600'
                          : 'text-slate-700'
                      }`}
                    >
                      {calculatedNetProfit.toLocaleString('en-US')} {currency}
                    </div>
                    <span className="text-[11px] text-slate-400">
                      المطلوب ({parsedCustomerPrice}) - التكلفة (
                      {parsedActualCost})
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    <FileText className="w-3.5 h-3.5 inline ml-1 text-slate-400" />
                    ملاحظات إضافية / تقرير الفحص والإصلاح
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="أي ملاحظات فنية، تفاصيل قطع الغيار المستبدلة، أو اتفاقات خاصة مع العميل..."
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>
            </>
          )}

          {/* Modal Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              إلغاء
            </button>

            <div className="flex flex-wrap items-center gap-2.5">
              {entryMode === 'corporate_batch' && !initialTicket ? (
                <>
                  <button
                    type="button"
                    onClick={() => submitCorporateBatch(true)}
                    className="px-4 py-2 text-xs sm:text-sm font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>
                      حفظ وطباعة إيصال مجمع للشركة ({corporateDevices.length})
                    </span>
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>
                      حفظ جميع أجهزة الشركة ({corporateDevices.length})
                    </span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => submitSingle(true)}
                    className="px-4 py-2 text-xs sm:text-sm font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>حفظ وطباعة إيصال</span>
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>
                      {initialTicket
                        ? 'حفظ التعديلات'
                        : 'حفظ وتسجيل التذكرة'}
                    </span>
                  </button>
                </>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
