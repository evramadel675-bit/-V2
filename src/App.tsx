import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Plus,
  Search,
  FileUp,
  FileDown,
  Printer,
  Edit3,
  Trash2,
  Wrench,
  Clock,
  CheckCircle2,
  XCircle,
  PackageCheck,
  TrendingUp,
  Building2,
  Filter,
  RotateCcw,
  Eye,
  Copy,
  Check,
  AlertTriangle,
  Download,
  Phone,
  Layers,
  X,
  MonitorDown,
  WifiOff,
  Users,
} from 'lucide-react';
import {
  MaintenanceTicket,
  TICKET_STATUSES,
  TicketStatus,
  WorkshopSettings,
  ServiceCenter,
  ToastMessage,
} from './types';
import {
  DEFAULT_WORKSHOP_SETTINGS,
  INITIAL_SAMPLE_TICKETS,
  INITIAL_SERVICE_CENTERS,
  generateNextTicketCode,
  generateNextBatchCode,
} from './data/sampleData';
import {
  parseExcelFile,
  exportTicketsToExcel,
  downloadExcelTemplate,
  ParsedExcelResult,
} from './utils/excelService';
import { usePWAInstall, useOnlineStatus } from './hooks/usePWAInstall';
import { TicketFormModal } from './components/TicketFormModal';
import { ReceiptPrintModal } from './components/ReceiptPrintModal';
import { SettingsModal } from './components/SettingsModal';
import { ImportModal } from './components/ImportModal';
import { DesktopInstallModal } from './components/DesktopInstallModal';
import { ServiceCentersManager } from './components/ServiceCentersManager';

const STORAGE_KEY_TICKETS = 'mnt_workshop_tickets_v1';
const STORAGE_KEY_CENTERS = 'mnt_workshop_centers_v1';
const STORAGE_KEY_SETTINGS = 'mnt_workshop_settings_v1';

type ActiveSection = 'dashboard' | 'tickets' | 'centers' | 'finance';

export default function App() {
  // 1. Persistent Tickets State (LocalStorage)
  const [tickets, setTickets] = useState<MaintenanceTicket[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TICKETS);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (err) {
      console.error('Failed to read tickets from localStorage:', err);
    }
    return INITIAL_SAMPLE_TICKETS;
  });

  // 2. Persistent Service Centers State (LocalStorage)
  const [serviceCenters, setServiceCenters] = useState<ServiceCenter[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CENTERS);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (err) {
      console.error('Failed to read service centers from localStorage:', err);
    }
    return INITIAL_SERVICE_CENTERS;
  });

  // 3. Persistent Workshop Settings State (LocalStorage)
  const [settings, setSettings] = useState<WorkshopSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved !== null) {
        return { ...DEFAULT_WORKSHOP_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (err) {
      console.error('Failed to read settings from localStorage:', err);
    }
    return DEFAULT_WORKSHOP_SETTINGS;
  });

  // PWA & Connectivity Hooks
  const { isInstallable, isInstalled, triggerInstall } = usePWAInstall();
  const isOnline = useOnlineStatus();

  // Navigation & filter state
  const [activeSection, setActiveSection] = useState<ActiveSection>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'الكل'>('الكل');
  const [centerFilter, setCenterFilter] = useState<string>('الكل');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<MaintenanceTicket | null>(null);
  const [printingTicket, setPrintingTicket] = useState<MaintenanceTicket | null>(null);
  const [printInitialBatchMode, setPrintInitialBatchMode] = useState(false);
  const [viewingTicket, setViewingTicket] = useState<MaintenanceTicket | null>(null);
  const [deletingTicket, setDeletingTicket] = useState<MaintenanceTicket | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDesktopInstallOpen, setIsDesktopInstallOpen] = useState(false);
  const [parsedExcel, setParsedExcel] = useState<ParsedExcelResult | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  // Toast notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Auto-save tickets to LocalStorage immediately on any change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TICKETS, JSON.stringify(tickets));
    } catch (err) {
      console.error('Failed to save tickets to localStorage:', err);
    }
  }, [tickets]);

  // Auto-save service centers to LocalStorage immediately on any change
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY_CENTERS,
        JSON.stringify(serviceCenters)
      );
    } catch (err) {
      console.error('Failed to save centers to localStorage:', err);
    }
  }, [serviceCenters]);

  // Auto-save settings to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch (err) {
      console.error('Failed to save settings to localStorage:', err);
    }
  }, [settings]);

  const addToast = (
    type: ToastMessage['type'],
    title: string,
    description?: string
  ) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, title, description }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Combined list of all service center names
  const existingCenterNames = useMemo(() => {
    const set = new Set<string>();
    serviceCenters.forEach((c) => {
      if (c.name && c.name.trim() !== '') {
        set.add(c.name.trim());
      }
    });
    tickets.forEach((t) => {
      if (t.externalCenter && t.externalCenter.trim() !== '') {
        set.add(t.externalCenter.trim());
      }
    });
    return Array.from(set);
  }, [serviceCenters, tickets]);

  // Dashboard Statistics Calculation
  const stats = useMemo(() => {
    const total = tickets.length;
    const underInspection = tickets.filter(
      (t) => t.status === 'قيد الفحص'
    ).length;
    const atMaintenance = tickets.filter(
      (t) => t.status === 'تم الإرسال للصيانة'
    ).length;
    const readyForDelivery = tickets.filter(
      (t) => t.status === 'تم الإصلاح'
    ).length;
    const delivered = tickets.filter(
      (t) => t.status === 'تم التسليم للعميل'
    ).length;
    const unrepairable = tickets.filter(
      (t) => t.status === 'تعذر الإصلاح'
    ).length;

    const realizedProfit = tickets
      .filter(
        (t) => t.status === 'تم الإصلاح' || t.status === 'تم التسليم للعميل'
      )
      .reduce((sum, t) => sum + (t.customerPrice - t.actualCost), 0);

    const expectedProfit = tickets
      .filter(
        (t) => t.status === 'قيد الفحص' || t.status === 'تم الإرسال للصيانة'
      )
      .reduce((sum, t) => sum + (t.customerPrice - t.actualCost), 0);

    const totalRevenue = tickets
      .filter(
        (t) => t.status === 'تم الإصلاح' || t.status === 'تم التسليم للعميل'
      )
      .reduce((sum, t) => sum + t.customerPrice, 0);

    const totalActualCost = tickets.reduce((sum, t) => sum + t.actualCost, 0);

    return {
      total,
      underInspection,
      atMaintenance,
      readyForDelivery,
      delivered,
      unrepairable,
      realizedProfit,
      expectedProfit,
      totalRevenue,
      totalActualCost,
    };
  }, [tickets]);

  // Filtered tickets based on search query, status filter, and external center filter
  const filteredTickets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return tickets.filter((ticket) => {
      const matchesStatus =
        statusFilter === 'الكل' || ticket.status === statusFilter;
      const matchesCenter =
        centerFilter === 'الكل' ||
        (centerFilter === 'بدون مركز خارجي'
          ? !ticket.externalCenter
          : ticket.externalCenter.trim() === centerFilter.trim());

      if (!matchesStatus || !matchesCenter) return false;
      if (!q) return true;

      return (
        ticket.ticketCode.toLowerCase().includes(q) ||
        (ticket.batchCode && ticket.batchCode.toLowerCase().includes(q)) ||
        ticket.customerName.toLowerCase().includes(q) ||
        (ticket.employeeName && ticket.employeeName.toLowerCase().includes(q)) ||
        ticket.phone.toLowerCase().includes(q) ||
        ticket.deviceModel.toLowerCase().includes(q) ||
        ticket.serialNumber.toLowerCase().includes(q) ||
        ticket.issueDescription.toLowerCase().includes(q) ||
        ticket.externalCenter.toLowerCase().includes(q)
      );
    });
  }, [tickets, searchQuery, statusFilter, centerFilter]);

  // ==================== HANDLERS ====================

  const handleInstallToDesktopClick = async () => {
    if (isInstallable) {
      const outcome = await triggerInstall();
      if (outcome === 'accepted') {
        addToast(
          'success',
          'تم تثبيت البرنامج على الديسكتوب بنجاح',
          'يمكنك الآن تشغيل النظام مباشرة من سطح المكتب كنافذة مستقلة.'
        );
        return;
      }
    }
    setIsDesktopInstallOpen(true);
  };

  const handleOpenAddModal = () => {
    setEditingTicket(null);
    setIsFormOpen(true);
  };

  const handleOpenEditModal = (ticket: MaintenanceTicket) => {
    setEditingTicket(ticket);
    setIsFormOpen(true);
  };

  const registerUnknownCenters = (centerNames: string[]) => {
    const validNames = centerNames
      .map((n) => n.trim())
      .filter((n) => n.length > 0);
    if (validNames.length === 0) return;

    setServiceCenters((prev) => {
      const existingLower = new Set(
        prev.map((c) => c.name.trim().toLowerCase())
      );
      const added: ServiceCenter[] = [];
      validNames.forEach((name) => {
        if (!existingLower.has(name.toLowerCase())) {
          existingLower.add(name.toLowerCase());
          added.push({
            id: `sc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            name,
            specialistName: '',
            phone: '',
            specialty: 'مركز صيانة خارجي',
            address: '',
            notes: 'تمت إضافته تلقائياً عند تسجيل تذكرة صيانة',
          });
        }
      });
      return added.length > 0 ? [...prev, ...added] : prev;
    });
  };

  const handleSaveTicket = (
    savedTicket: MaintenanceTicket,
    printAfterSave = false
  ) => {
    registerUnknownCenters([savedTicket.externalCenter]);

    if (editingTicket) {
      setTickets((prev) =>
        prev.map((t) => (t.id === savedTicket.id ? savedTicket : t))
      );
      addToast(
        'success',
        'تم تحديث بيانات التذكرة بنجاح',
        `تذكرة رقم ${savedTicket.ticketCode} — ${savedTicket.customerName}`
      );
    } else {
      setTickets((prev) => [savedTicket, ...prev]);
      addToast(
        'success',
        'تم تسجيل جهاز الصيانة بنجاح',
        `تم إصدار التذكرة رقم ${savedTicket.ticketCode} للعميل ${savedTicket.customerName}`
      );
    }
    setIsFormOpen(false);
    setEditingTicket(null);

    if (printAfterSave) {
      setPrintInitialBatchMode(false);
      setPrintingTicket(savedTicket);
    }
  };

  const handleSaveBatch = (
    batchTickets: MaintenanceTicket[],
    printConsolidatedAfterSave = false
  ) => {
    if (batchTickets.length === 0) return;

    registerUnknownCenters(batchTickets.map((t) => t.externalCenter));

    setTickets((prev) => [...batchTickets, ...prev]);
    setIsFormOpen(false);
    setEditingTicket(null);

    const company = batchTickets[0].customerName;
    const refCode = batchTickets[0].batchCode || '';
    addToast(
      'success',
      `تم تسجيل (${batchTickets.length}) أجهزة للشركة بنجاح`,
      `الشركة: ${company} ${refCode ? `· مرجع الدفعة: ${refCode}` : ''}`
    );

    if (printConsolidatedAfterSave) {
      setPrintInitialBatchMode(true);
      setPrintingTicket(batchTickets[0]);
    }
  };

  // Confirmed Ticket Delete Handler (onDelete)
  const onDeleteTicket = (ticketId: string) => {
    const target = tickets.find((t) => t.id === ticketId);
    setTickets((prev) => prev.filter((t) => t.id !== ticketId));
    setDeletingTicket(null);
    if (viewingTicket?.id === ticketId) {
      setViewingTicket(null);
    }
    if (target) {
      addToast(
        'info',
        'تم حذف الجهاز من السجل نهائياً',
        `تم حذف جهاز العميل ${target.customerName} - ${target.deviceModel} وتحديث الإحصائيات.`
      );
    }
  };

  // Service Centers CRUD Handlers
  const handleAddServiceCenter = (newCenterData: Omit<ServiceCenter, 'id'>) => {
    const created: ServiceCenter = {
      ...newCenterData,
      id: `sc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    };
    setServiceCenters((prev) => [created, ...prev]);
    addToast(
      'success',
      'تم إضافة مركز الصيانة بنجاح',
      `تم تسجيل «${created.name}» في قائمة المراكز المعتمدة.`
    );
  };

  const handleUpdateServiceCenter = (
    updatedCenter: ServiceCenter,
    oldName: string,
    updateLinkedTickets: boolean
  ) => {
    setServiceCenters((prev) =>
      prev.map((c) => (c.id === updatedCenter.id ? updatedCenter : c))
    );
    if (updateLinkedTickets && oldName.trim() !== updatedCenter.name.trim()) {
      setTickets((prev) =>
        prev.map((t) =>
          t.externalCenter.trim() === oldName.trim()
            ? { ...t, externalCenter: updatedCenter.name.trim() }
            : t
        )
      );
    }
    if (centerFilter === oldName) {
      setCenterFilter(updatedCenter.name);
    }
    addToast(
      'success',
      'تم تحديث بيانات مركز الصيانة',
      `تم حفظ التعديلات الخاصة بـ «${updatedCenter.name}».`
    );
  };

  const handleDeleteServiceCenter = (
    centerId: string,
    centerName: string,
    reassignAction: 'reassign_internal' | 'keep_name'
  ) => {
    setServiceCenters((prev) => prev.filter((c) => c.id !== centerId));

    if (reassignAction === 'reassign_internal') {
      setTickets((prev) =>
        prev.map((t) =>
          t.externalCenter.trim() === centerName.trim()
            ? { ...t, externalCenter: 'صيانة داخلية بالمركز' }
            : t
        )
      );
    }

    if (centerFilter.trim() === centerName.trim()) {
      setCenterFilter('الكل');
    }

    addToast(
      'info',
      'تم حذف مركز الصيانة بنجاح',
      reassignAction === 'reassign_internal'
        ? `تم حذف «${centerName}» وتحويل أجهزته إلى صيانة داخلية بالمركز.`
        : `تم حذف «${centerName}» من قائمة مراكز الصيانة.`
    );
  };

  // Quick Status Change Handler
  const handleQuickStatusChange = (
    ticketId: string,
    newStatus: TicketStatus
  ) => {
    const todayStr = new Date().toISOString().split('T')[0];
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id !== ticketId) return t;
        const updated: MaintenanceTicket = { ...t, status: newStatus };
        if (newStatus === 'تم التسليم للعميل' && !updated.finalDeliveryDate) {
          updated.finalDeliveryDate = todayStr;
        }
        if (newStatus === 'تم الإرسال للصيانة' && !updated.sentToCenterDate) {
          updated.sentToCenterDate = todayStr;
        }
        if (
          (newStatus === 'تم الإصلاح' || newStatus === 'تعذر الإصلاح') &&
          updated.sentToCenterDate &&
          !updated.receivedFromCenterDate
        ) {
          updated.receivedFromCenterDate = todayStr;
        }
        return updated;
      })
    );
    addToast('info', 'تم تحديث حالة الجهاز', `الحالة الجديدة: ${newStatus}`);
  };

  // Excel Import / Export Handlers
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await parseExcelFile(file, tickets);
      if (result.tickets.length === 0) {
        addToast(
          'error',
          'لم يتم العثور على بيانات صالحة',
          'تأكد من احتواء ملف الإكسل على صفوف أجهزة صيانة.'
        );
      } else {
        setParsedExcel(result);
        setIsImportModalOpen(true);
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'حدث خطأ أثناء قراءة ملف الإكسل.';
      addToast('error', 'فشل استيراد ملف الإكسل', msg);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleConfirmImport = (
    importedTickets: MaintenanceTicket[],
    mode: 'append' | 'replace'
  ) => {
    registerUnknownCenters(importedTickets.map((t) => t.externalCenter));

    if (mode === 'replace') {
      setTickets(importedTickets);
      addToast(
        'success',
        'تم استبدال السجلات بنجاح',
        `تم استيراد ${importedTickets.length} جهاز من ملف الإكسل.`
      );
    } else {
      setTickets((prev) => [...importedTickets, ...prev]);
      addToast(
        'success',
        'تمت إضافة الأجهزة بنجاح',
        `تم دمج ${importedTickets.length} جهاز جديد مع سجلاتك الحالية.`
      );
    }
    setIsImportModalOpen(false);
    setParsedExcel(null);
  };

  const handleExportExcel = () => {
    if (filteredTickets.length === 0) {
      addToast(
        'error',
        'لا توجد بيانات للتصدير',
        'الجدول الحالي لا يحتوي على سجلات.'
      );
      return;
    }
    exportTicketsToExcel(filteredTickets, settings.currency);
    addToast(
      'success',
      'تم تصدير ملف الإكسل بنجاح',
      `تم تحميل ${filteredTickets.length} سجل مع حسابات الأرباح باللغة العربية.`
    );
  };

  // Full JSON Backup & Restore
  const handleExportFullBackup = () => {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      tickets,
      serviceCenters,
      settings,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `نسخة_احتياطية_إدارة_الصيانة_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast(
      'success',
      'تم تحميل النسخة الاحتياطية الكاملة',
      'تشمل كافة الأجهزة ومراكز الصيانة والإعدادات.'
    );
  };

  const handleImportFullBackup = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed.tickets)) {
        setTickets(parsed.tickets);
      }
      if (Array.isArray(parsed.serviceCenters)) {
        setServiceCenters(parsed.serviceCenters);
      }
      if (parsed.settings) {
        setSettings({ ...DEFAULT_WORKSHOP_SETTINGS, ...parsed.settings });
      }
      setIsDesktopInstallOpen(false);
      addToast(
        'success',
        'تمت استعادة النسخة الاحتياطية بنجاح',
        'تم تحديث جميع السجلات ومراكز الصيانة والإعدادات.'
      );
    } catch {
      addToast(
        'error',
        'ملف النسخة الاحتياطية غير صالح',
        'تأكد من اختيار ملف .json الصحيح الذي تم تصديره من النظام.'
      );
    }
  };

  const handleCopyTicketCode = (code: string, id: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 1800);
  };

  const handleRestoreSampleData = () => {
    setTickets(INITIAL_SAMPLE_TICKETS);
    setServiceCenters(INITIAL_SERVICE_CENTERS);
    addToast(
      'info',
      'تمت استعادة البيانات التجريبية',
      'تمت إعادة تحميل التذاكر ومراكز الصيانة الافتراضية بنجاح.'
    );
  };

  const getStatusStyle = (status: TicketStatus) => {
    switch (status) {
      case 'قيد الفحص':
        return {
          text: 'text-amber-700',
          border: 'border-amber-300',
          bg: 'bg-amber-50/70',
          icon: <Clock className="w-3 h-3 text-amber-600 shrink-0" />,
        };
      case 'تم الإرسال للصيانة':
        return {
          text: 'text-blue-700',
          border: 'border-blue-300',
          bg: 'bg-blue-50/70',
          icon: <Wrench className="w-3 h-3 text-blue-600 shrink-0" />,
        };
      case 'تم الإصلاح':
        return {
          text: 'text-emerald-700',
          border: 'border-emerald-300',
          bg: 'bg-emerald-50/70',
          icon: <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />,
        };
      case 'تعذر الإصلاح':
        return {
          text: 'text-red-700',
          border: 'border-red-300',
          bg: 'bg-red-50/70',
          icon: <XCircle className="w-3 h-3 text-red-600 shrink-0" />,
        };
      case 'تم التسليم للعميل':
        return {
          text: 'text-slate-700',
          border: 'border-slate-300',
          bg: 'bg-slate-100',
          icon: <PackageCheck className="w-3 h-3 text-slate-600 shrink-0" />,
        };
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* ==================== TOP BAR (Strict 3-Zone Contract) ==================== */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 no-print">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-8">
          {/* Zone 1: Brand Title */}
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setActiveSection('dashboard');
            }}
            className="text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0"
          >
            {settings.centerName}
          </a>

          {/* Zone 2: 5 Concise Single-Line Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
            <button
              type="button"
              onClick={() => setActiveSection('dashboard')}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 cursor-pointer ${
                activeSection === 'dashboard'
                  ? 'text-white border-blue-500 font-bold'
                  : 'border-transparent hover:text-white'
              }`}
            >
              لوحة المتابعة
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('tickets')}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 cursor-pointer ${
                activeSection === 'tickets'
                  ? 'text-white border-blue-500 font-bold'
                  : 'border-transparent hover:text-white'
              }`}
            >
              سجل الأجهزة ({tickets.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('centers')}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 cursor-pointer ${
                activeSection === 'centers'
                  ? 'text-white border-blue-500 font-bold'
                  : 'border-transparent hover:text-white'
              }`}
            >
              إدارة مراكز الصيانة ({serviceCenters.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('finance')}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 cursor-pointer ${
                activeSection === 'finance'
                  ? 'text-white border-blue-500 font-bold'
                  : 'border-transparent hover:text-white'
              }`}
            >
              التقارير والأرباح
            </button>
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="py-1 text-slate-300 hover:text-white transition-colors whitespace-nowrap shrink-0 border-b-2 border-transparent cursor-pointer"
            >
              إعدادات المركز
            </button>
          </nav>

          {/* Zone 3: Install to Desktop CTA */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleInstallToDesktopClick}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              title="تثبيت البرنامج على الديسكتوب كنافذة مستقلة بدون متصفح"
            >
              <MonitorDown className="w-4 h-4" />
              <span>تثبيت البرنامج على الديسكتوب</span>
            </button>
          </div>
        </div>
      </header>

      {/* ==================== MAIN WORKSPACE CONTENT ==================== */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-3 sm:px-6 py-6 space-y-6 no-print">
        {/* Mobile Navigation Strip */}
        <div className="flex md:hidden items-center gap-1.5 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setActiveSection('dashboard')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap shrink-0 ${
              activeSection === 'dashboard'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-700 border border-slate-200'
            }`}
          >
            لوحة المتابعة
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('tickets')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap shrink-0 ${
              activeSection === 'tickets'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-700 border border-slate-200'
            }`}
          >
            سجل الأجهزة ({tickets.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('centers')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap shrink-0 ${
              activeSection === 'centers'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-700 border border-slate-200'
            }`}
          >
            مراكز الصيانة ({serviceCenters.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('finance')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap shrink-0 ${
              activeSection === 'finance'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-700 border border-slate-200'
            }`}
          >
            التقارير والأرباح
          </button>
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white text-slate-700 border border-slate-200 whitespace-nowrap shrink-0"
          >
            الإعدادات
          </button>
        </div>

        {/* ==================== SERVICE CENTERS MANAGEMENT SECTION ==================== */}
        {activeSection === 'centers' && (
          <ServiceCentersManager
            centers={serviceCenters}
            tickets={tickets}
            currency={settings.currency}
            onAddCenter={handleAddServiceCenter}
            onUpdateCenter={handleUpdateServiceCenter}
            onDeleteCenter={handleDeleteServiceCenter}
            onFilterByCenter={(centerName) => {
              setCenterFilter(centerName);
              setActiveSection('dashboard');
            }}
          />
        )}

        {/* ==================== FINANCIAL SUMMARY VIEW ==================== */}
        {activeSection === 'finance' && (
          <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    التقرير المالي وتفاصيل إيرادات وأرباح الصيانة
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    ملخص شامل للتكاليف المدفوعة، المبالغ المحصلة من العملاء، وصافي الأرباح
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleExportExcel}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
              >
                <FileDown className="w-4 h-4" />
                <span>تصدير التقرير المالي (Excel)</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-xs text-slate-500 font-semibold">
                  إجمالي إيرادات الأجهزة المنجزة
                </div>
                <div className="text-xl font-bold font-mono-num text-slate-900 mt-1.5">
                  {stats.totalRevenue.toLocaleString('en-US')}{' '}
                  {settings.currency}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  مجموع المبالغ المطلوبة للأجهزة التي تم إصلاحها أو تسليمها
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-xs text-slate-500 font-semibold">
                  إجمالي التكاليف الفعلية المدفوعة
                </div>
                <div className="text-xl font-bold font-mono-num text-slate-900 mt-1.5">
                  {stats.totalActualCost.toLocaleString('en-US')}{' '}
                  {settings.currency}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  مجموع تكاليف المراكز الخارجية وقطع الغيار
                </div>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200">
                <div className="text-xs text-emerald-800 font-semibold">
                  صافي الربح المحقق الفعلي
                </div>
                <div className="text-xl font-bold font-mono-num text-emerald-700 mt-1.5">
                  {stats.realizedProfit.toLocaleString('en-US')}{' '}
                  {settings.currency}
                </div>
                <div className="text-[11px] text-emerald-700 mt-1">
                  للأجهزة الجاهزة للتسليم والمسلمة للعملاء
                </div>
              </div>

              <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200">
                <div className="text-xs text-blue-800 font-semibold">
                  الأرباح المتوقعة (قيد الفحص والصيانة)
                </div>
                <div className="text-xl font-bold font-mono-num text-blue-700 mt-1.5">
                  {stats.expectedProfit.toLocaleString('en-US')}{' '}
                  {settings.currency}
                </div>
                <div className="text-[11px] text-blue-700 mt-1">
                  تضاف للأرباح المحققة فور إتمام الإصلاح
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ==================== UNIFIED DASHBOARD & TICKETS CONTAINER ==================== */}
        <section
          aria-label="لوحة المتابعة وسجل أجهزة الصيانة"
          className="bg-white border border-slate-200 rounded-xl p-6 space-y-5"
        >
          {/* 1. Unified Inner Header (Matches ServiceCentersManager Style) */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  لوحة متابعة وسجل أجهزة الصيانة ({tickets.length})
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {settings.centerSubtitle || 'إدارة التذاكر الفردية ودفعات الشركات، متابعة المراكز الخارجية، وحساب صافي الأرباح'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setActiveSection(
                    activeSection === 'centers' ? 'dashboard' : 'centers'
                  )
                }
                className={`h-9 px-3.5 text-xs font-bold rounded-lg border transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeSection === 'centers'
                    ? 'bg-blue-50 text-blue-700 border-blue-300'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300'
                }`}
              >
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>إدارة مراكز الصيانة ({serviceCenters.length})</span>
              </button>

              <button
                type="button"
                onClick={handleOpenAddModal}
                className="h-9 px-4 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>استلام جهاز / دفعة شركة جديدة</span>
              </button>
            </div>
          </div>

          {/* 2. Connected Single-Row KPI Strip (Harmonious Clean Light/Slate Style) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x sm:divide-x-reverse divide-slate-200 border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
            {/* KPI 1: Total Devices */}
            <div
              onClick={() => setStatusFilter('الكل')}
              className={`p-4 transition-colors cursor-pointer ${
                statusFilter === 'الكل'
                  ? 'bg-white'
                  : 'hover:bg-white/80'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                <span>إجمالي الأجهزة</span>
                <Layers className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-2xl font-bold font-mono-num text-slate-900 mt-1">
                {stats.total}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                تم تسليم{' '}
                <span className="font-mono-num font-semibold text-slate-700">
                  {stats.delivered}
                </span>{' '}
                · تعذر{' '}
                <span className="font-mono-num font-semibold text-red-600">
                  {stats.unrepairable}
                </span>
              </div>
            </div>

            {/* KPI 2: Under Inspection */}
            <div
              onClick={() =>
                setStatusFilter(
                  statusFilter === 'قيد الفحص' ? 'الكل' : 'قيد الفحص'
                )
              }
              className={`p-4 transition-colors cursor-pointer ${
                statusFilter === 'قيد الفحص'
                  ? 'bg-amber-50/60'
                  : 'hover:bg-white/80'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold text-amber-700">
                <span>أجهزة قيد الفحص</span>
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-bold font-mono-num text-slate-900 mt-1">
                {stats.underInspection}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                بانتظار التشخيص وتحديد التكلفة
              </div>
            </div>

            {/* KPI 3: At Maintenance */}
            <div
              onClick={() =>
                setStatusFilter(
                  statusFilter === 'تم الإرسال للصيانة'
                    ? 'الكل'
                    : 'تم الإرسال للصيانة'
                )
              }
              className={`p-4 transition-colors cursor-pointer ${
                statusFilter === 'تم الإرسال للصيانة'
                  ? 'bg-blue-50/60'
                  : 'hover:bg-white/80'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold text-blue-700">
                <span>أجهزة لدى الصيانة</span>
                <Wrench className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-bold font-mono-num text-slate-900 mt-1">
                {stats.atMaintenance}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                قيد الإصلاح بالمراكز الخارجية
              </div>
            </div>

            {/* KPI 4: Ready for Delivery */}
            <div
              onClick={() =>
                setStatusFilter(
                  statusFilter === 'تم الإصلاح' ? 'الكل' : 'تم الإصلاح'
                )
              }
              className={`p-4 transition-colors cursor-pointer ${
                statusFilter === 'تم الإصلاح'
                  ? 'bg-emerald-50/60'
                  : 'hover:bg-white/80'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold text-emerald-700">
                <span>أجهزة جاهزة للتسليم</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold font-mono-num text-slate-900 mt-1">
                {stats.readyForDelivery}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                تم إصلاحها وبانتظار العميل
              </div>
            </div>

            {/* KPI 5: Realized & Expected Profit (Soft Emerald/Slate Harmonious Card) */}
            <div className="p-4 bg-emerald-50/40">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-800">
                <span>صافي الأرباح المحققة</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold font-mono-num text-emerald-700 mt-1">
                {stats.realizedProfit.toLocaleString('en-US')}{' '}
                <span className="text-xs font-semibold text-emerald-800">
                  {settings.currency}
                </span>
              </div>
              <div className="text-[11px] text-slate-600 mt-1 font-mono-num">
                متوقع قيد التنفيذ: +
                {stats.expectedProfit.toLocaleString('en-US')}{' '}
                {settings.currency}
              </div>
            </div>
          </div>

          {/* 3. Unified Single-Line Toolbar: Search + Status Filter + Center Filter + Excel Buttons */}
          <div className="flex flex-wrap lg:flex-nowrap items-center gap-2.5 bg-slate-50/70 p-2.5 rounded-xl border border-slate-200">
            {/* Search Box */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث بكود التذكرة، الشركة/العميل، الموظف، الهاتف، الموديل، أو السيريال..."
                className="w-full h-9 pr-9 pl-8 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  title="مسح البحث"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Status Filter Select (On the same line) */}
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as TicketStatus | 'الكل')
              }
              aria-label="فلترة حسب حالة الجهاز"
              className="h-9 px-3 text-xs font-semibold bg-white border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 shrink-0 cursor-pointer"
            >
              <option value="الكل">كل الحالات ({tickets.length})</option>
              {TICKET_STATUSES.map((st) => {
                const count = tickets.filter((t) => t.status === st).length;
                return (
                  <option key={st} value={st}>
                    {st} ({count})
                  </option>
                );
              })}
            </select>

            {/* External Center Filter Select (On the same line) */}
            <select
              value={centerFilter}
              onChange={(e) => setCenterFilter(e.target.value)}
              aria-label="فلترة حسب مركز الصيانة"
              className="h-9 px-3 text-xs font-semibold bg-white border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 shrink-0 max-w-[200px] truncate cursor-pointer"
            >
              <option value="الكل">جميع المراكز والفنيين</option>
              {existingCenterNames.map((center) => (
                <option key={center} value={center}>
                  {center}
                </option>
              ))}
              <option value="بدون مركز خارجي">بدون مركز خارجي</option>
            </select>

            {/* Reset Filters Button (Appears inline when active) */}
            {(searchQuery ||
              statusFilter !== 'الكل' ||
              centerFilter !== 'الكل') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('الكل');
                  setCenterFilter('الكل');
                }}
                className="h-9 px-2.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
                title="إعادة تعيين الفلاتر"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>إلغاء الفلتر</span>
              </button>
            )}

            {/* Excel Actions Group (Unified height & borders on the same line) */}
            <div className="flex items-center gap-1.5 shrink-0">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="h-9 px-3 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                title="استيراد بيانات من شيت إكسل (.xlsx أو .xls)"
              >
                <FileUp className="w-3.5 h-3.5 text-blue-600" />
                <span>استيراد Excel</span>
              </button>

              <button
                type="button"
                onClick={handleExportExcel}
                className="h-9 px-3 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                title="تصدير الجدول الحالي إلى ملف إكسل عربي منسق"
              >
                <FileDown className="w-3.5 h-3.5 text-emerald-600" />
                <span>تصدير Excel</span>
              </button>

              <button
                type="button"
                onClick={downloadExcelTemplate}
                className="h-9 px-2.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                title="تحميل نموذج إكسل فارغ جاهز للتعبئة"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>قالب نموذجي</span>
              </button>
            </div>
          </div>

          {/* 4. Tickets Table (Clean Unified Light/Slate Header & Sticky Left Actions) */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            {filteredTickets.length === 0 ? (
              /* Empty State */
              <div className="p-12 text-center bg-slate-50/50 space-y-3">
                <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
                  <Wrench className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-800">
                  لا توجد أجهزة صيانة مسجلة أو مطابقة للبحث الحالي
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  يمكنك إضافة تذكرة صيانة جديدة (جهاز فردي أو دفعة أجهزة لشركة)، أو استيراد شيت إكسل، أو استعادة البيانات التجريبية.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleOpenAddModal}
                    className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة تذكرة / دفعة شركة جديدة</span>
                  </button>
                  {(searchQuery ||
                    statusFilter !== 'الكل' ||
                    centerFilter !== 'الكل') && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setStatusFilter('الكل');
                        setCenterFilter('الكل');
                      }}
                      className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    >
                      عرض كل الأجهزة ({tickets.length})
                    </button>
                  )}
                  {tickets.length === 0 && (
                    <button
                      type="button"
                      onClick={handleRestoreSampleData}
                      className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>استعادة البيانات التجريبية</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse table-auto">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 text-xs border-b border-slate-200">
                      <th className="py-3 px-2.5 font-bold whitespace-nowrap">
                        التذكرة والتاريخ
                      </th>
                      <th className="py-3 px-2.5 font-bold whitespace-nowrap">
                        الشركة / العميل والموظف
                      </th>
                      <th className="py-3 px-2.5 font-bold whitespace-nowrap">
                        الجهاز والعطل والملحقات
                      </th>
                      <th className="py-3 px-2.5 font-bold whitespace-nowrap">
                        مركز الصيانة والتواريخ
                      </th>
                      <th className="py-3 px-2.5 font-bold whitespace-nowrap">
                        حالة الجهاز
                      </th>
                      <th className="py-3 px-2.5 font-bold whitespace-nowrap">
                        المطلوب والتكلفة
                      </th>
                      <th className="py-3 px-2.5 font-bold whitespace-nowrap">
                        صافي الربح
                      </th>
                      {/* Sticky Left Column 8: Actions & Controls (Far Left in RTL) */}
                      <th className="sticky left-0 bg-slate-100 z-10 shadow-[-4px_0_6px_-2px_rgba(15,23,42,0.08)] py-3 px-3 font-bold text-center whitespace-nowrap border-r border-slate-200">
                        الإجراءات والتحكم
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-xs bg-white">
                    {filteredTickets.map((ticket) => {
                      const stStyle = getStatusStyle(ticket.status);
                      return (
                        <tr
                          key={ticket.id}
                          className="group hover:bg-slate-50/90 transition-colors align-top"
                        >
                          {/* 1. التذكرة والتاريخ */}
                          <td className="py-2.5 px-2.5 whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              <span className="font-mono-num font-bold text-blue-700 text-xs">
                                {ticket.ticketCode}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  handleCopyTicketCode(
                                    ticket.ticketCode,
                                    ticket.id
                                  )
                                }
                                className="text-slate-400 hover:text-slate-700 p-0.5 rounded transition-colors cursor-pointer"
                                title="نسخ كود التذكرة"
                              >
                                {copiedCodeId === ticket.id ? (
                                  <Check className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono-num mt-0.5">
                              {ticket.receivedDate}
                            </div>
                            {ticket.batchCode && (
                              <button
                                type="button"
                                onClick={() => {
                                  setPrintInitialBatchMode(true);
                                  setPrintingTicket(ticket);
                                }}
                                className="mt-1 text-[10px] font-mono-num font-semibold text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
                                title="طباعة إيصال مجمع لجميع أجهزة هذه الدفعة"
                              >
                                <Users className="w-2.5 h-2.5" />
                                <span>دفعة: {ticket.batchCode}</span>
                              </button>
                            )}
                          </td>

                          {/* 2. الشركة / العميل والموظف */}
                          <td className="py-2.5 px-2.5 max-w-[200px]">
                            <div className="font-bold text-slate-900 leading-snug">
                              {ticket.customerName}
                              {ticket.employeeName && (
                                <span className="text-blue-700 font-semibold">
                                  {' '}
                                  - {ticket.employeeName}
                                </span>
                              )}
                            </div>
                            {ticket.phone ? (
                              <div className="text-[11px] text-slate-500 font-mono-num mt-0.5 flex items-center gap-1">
                                <Phone className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                                <span dir="ltr">{ticket.phone}</span>
                              </div>
                            ) : (
                              <div className="text-[11px] text-slate-400 mt-0.5">
                                بدون هاتف
                              </div>
                            )}
                          </td>

                          {/* 3. الجهاز والعطل والملحقات */}
                          <td className="py-2.5 px-2.5 max-w-[230px]">
                            <div
                              className="font-bold text-slate-900 truncate"
                              title={ticket.deviceModel}
                            >
                              {ticket.deviceModel}
                            </div>
                            <div
                              className="text-[11px] text-slate-600 mt-0.5 line-clamp-1 leading-relaxed"
                              title={ticket.issueDescription}
                            >
                              {ticket.issueDescription}
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                              {ticket.serialNumber && (
                                <span className="font-mono-num">
                                  S/N: {ticket.serialNumber} ·{' '}
                                </span>
                              )}
                              <span>{ticket.accessories || 'بدون ملحقات'}</span>
                            </div>
                          </td>

                          {/* 4. مركز الصيانة والتواريخ */}
                          <td className="py-2.5 px-2.5 max-w-[170px]">
                            <div
                              className="text-[11px] font-semibold text-slate-800 truncate"
                              title={
                                ticket.externalCenter || 'صيانة داخلية بالمركز'
                              }
                            >
                              {ticket.externalCenter || 'صيانة داخلية بالمركز'}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono-num mt-0.5 space-y-0.5">
                              {ticket.sentToCenterDate && (
                                <div>إرسال: {ticket.sentToCenterDate}</div>
                              )}
                              {ticket.receivedFromCenterDate && (
                                <div>عودة: {ticket.receivedFromCenterDate}</div>
                              )}
                              {ticket.finalDeliveryDate && (
                                <div className="text-emerald-700 font-semibold">
                                  تسليم: {ticket.finalDeliveryDate}
                                </div>
                              )}
                            </div>
                          </td>

                          {/* 5. حالة الجهاز */}
                          <td className="py-2.5 px-2.5 whitespace-nowrap">
                            <div
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border ${stStyle.bg} ${stStyle.border}`}
                            >
                              {stStyle.icon}
                              <select
                                value={ticket.status}
                                onChange={(e) =>
                                  handleQuickStatusChange(
                                    ticket.id,
                                    e.target.value as TicketStatus
                                  )
                                }
                                aria-label={`تغيير حالة الجهاز ${ticket.ticketCode}`}
                                className={`text-[11px] font-bold bg-transparent focus:outline-none cursor-pointer ${stStyle.text}`}
                              >
                                {TICKET_STATUSES.map((st) => (
                                  <option
                                    key={st}
                                    value={st}
                                    className="text-slate-900 bg-white"
                                  >
                                    {st}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </td>

                          {/* 6. المطلوب والتكلفة */}
                          <td className="py-2.5 px-2.5 whitespace-nowrap font-mono-num">
                            <div className="text-[11px] font-bold text-slate-900">
                              مطلوب:{' '}
                              {ticket.customerPrice.toLocaleString('en-US')}{' '}
                              {settings.currency}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              تكلفة:{' '}
                              {ticket.actualCost.toLocaleString('en-US')}{' '}
                              {settings.currency}
                            </div>
                          </td>

                          {/* 7. صافي الربح */}
                          <td className="py-2.5 px-2.5 whitespace-nowrap font-mono-num">
                            <div
                              className={`text-xs font-bold ${
                                ticket.netProfit > 0
                                  ? 'text-emerald-600'
                                  : ticket.netProfit < 0
                                  ? 'text-red-600'
                                  : 'text-slate-600'
                              }`}
                            >
                              {ticket.netProfit > 0 ? '+' : ''}
                              {ticket.netProfit.toLocaleString('en-US')}{' '}
                              {settings.currency}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {ticket.status === 'تم الإصلاح' ||
                              ticket.status === 'تم التسليم للعميل'
                                ? 'ربح محقق'
                                : ticket.status === 'تعذر الإصلاح'
                                ? 'ملغى'
                                : 'ربح متوقع'}
                            </div>
                          </td>

                          {/* 8. الإجراءات والتحكم (في أقصى اليسار - Sticky Left - Clean Light/Slate Style) */}
                          <td className="sticky left-0 bg-white group-hover:bg-slate-50 z-10 shadow-[-4px_0_6px_-2px_rgba(15,23,42,0.08)] py-2.5 px-2.5 whitespace-nowrap border-r border-slate-200 transition-colors">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Receipt Print Button */}
                              <button
                                type="button"
                                onClick={() => {
                                  setPrintInitialBatchMode(false);
                                  setPrintingTicket(ticket);
                                }}
                                className="px-2.5 py-1.5 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                                title="طباعة إيصال استلام رسمي (فردي أو مجمع للشركة)"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                <span>إيصال</span>
                              </button>

                              {/* Edit Button */}
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(ticket)}
                                className="px-2 py-1.5 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                                title="تعديل بيانات الجهاز"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>تعديل</span>
                              </button>

                              {/* Full View Button */}
                              <button
                                type="button"
                                onClick={() => setViewingTicket(ticket)}
                                className="p-1.5 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                                title="عرض كافة تفاصيل التذكرة"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete Button */}
                              <button
                                type="button"
                                onClick={() => setDeletingTicket(ticket)}
                                className="px-2.5 py-1.5 text-[11px] font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                                title="حذف سجل الجهاز"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>حذف</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Table Footer Totals Bar */}
            {filteredTickets.length > 0 && (
              <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
                <div className="text-slate-600 font-semibold">
                  إجمالي السجلات المعروضة:{' '}
                  <span className="font-mono-num font-bold text-slate-900">
                    {filteredTickets.length}
                  </span>{' '}
                  من أصل{' '}
                  <span className="font-mono-num font-bold text-slate-900">
                    {tickets.length}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-4 font-mono-num">
                  <span className="text-slate-600">
                    إجمالي التكاليف المعروضة:{' '}
                    <strong className="text-slate-900">
                      {filteredTickets
                        .reduce((s, t) => s + t.actualCost, 0)
                        .toLocaleString('en-US')}{' '}
                      {settings.currency}
                    </strong>
                  </span>
                  <span aria-hidden="true" className="text-slate-300">
                    ·
                  </span>
                  <span className="text-slate-600">
                    إجمالي المطلوب من العملاء:{' '}
                    <strong className="text-slate-900">
                      {filteredTickets
                        .reduce((s, t) => s + t.customerPrice, 0)
                        .toLocaleString('en-US')}{' '}
                      {settings.currency}
                    </strong>
                  </span>
                  <span aria-hidden="true" className="text-slate-300">
                    ·
                  </span>
                  <span className="text-emerald-700 font-bold">
                    صافي ربح السجلات المعروضة:{' '}
                    {filteredTickets
                      .reduce((s, t) => s + t.netProfit, 0)
                      .toLocaleString('en-US')}{' '}
                    {settings.currency}
                  </span>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* ==================== FOOTER ==================== */}
      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-xs text-slate-500 no-print">
        <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-4">
          <div>
            {settings.centerName} — {settings.centerAddress}
          </div>
          <div className="flex items-center gap-4">
            <span>يتم حفظ كافة التعديلات تلقائياً في LocalStorage</span>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => setIsDesktopInstallOpen(true)}
              className="text-blue-600 hover:underline font-semibold cursor-pointer"
            >
              تثبيت الديسكتوب والنسخ الاحتياطي
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="text-blue-600 hover:underline font-semibold cursor-pointer"
            >
              إعدادات المركز والطباعة
            </button>
          </div>
        </div>
      </footer>

      {/* ==================== MODALS ==================== */}
      <TicketFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingTicket(null);
        }}
        onSave={handleSaveTicket}
        onSaveBatch={handleSaveBatch}
        initialTicket={editingTicket}
        nextTicketCode={generateNextTicketCode(tickets)}
        nextBatchCode={generateNextBatchCode(tickets)}
        allTickets={tickets}
        currency={settings.currency}
        existingCenters={existingCenterNames}
      />

      <ReceiptPrintModal
        ticket={printingTicket}
        allTickets={tickets}
        initialBatchMode={printInitialBatchMode}
        settings={settings}
        onClose={() => {
          setPrintingTicket(null);
          setPrintInitialBatchMode(false);
        }}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={(newSettings) => {
          setSettings(newSettings);
          addToast('success', 'تم حفظ إعدادات المركز بنجاح');
        }}
        onRestoreSampleData={handleRestoreSampleData}
      />

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => {
          setIsImportModalOpen(false);
          setParsedExcel(null);
        }}
        parsedResult={parsedExcel}
        currency={settings.currency}
        onConfirmImport={handleConfirmImport}
      />

      <DesktopInstallModal
        isOpen={isDesktopInstallOpen}
        onClose={() => setIsDesktopInstallOpen(false)}
        isInstallable={isInstallable}
        isInstalled={isInstalled}
        onTriggerNativeInstall={async () => {
          const outcome = await triggerInstall();
          if (outcome === 'accepted') {
            setIsDesktopInstallOpen(false);
            addToast(
              'success',
              'تم تثبيت البرنامج على الديسكتوب بنجاح',
              'يعمل البرنامج الآن كنافذة سطح مكتب مستقلة.'
            );
          }
        }}
        onExportFullBackup={handleExportFullBackup}
        onImportFullBackup={handleImportFullBackup}
      />

      {/* Ticket Full Details Modal */}
      {viewingTicket && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto no-print"
          onClick={() => setViewingTicket(null)}
        >
          <div
            className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-blue-400 font-mono-num font-bold">
                    {viewingTicket.ticketCode}
                  </span>
                  {viewingTicket.batchCode && (
                    <span className="text-xs text-emerald-400 font-mono-num">
                      · دفعة الشركة: {viewingTicket.batchCode}
                    </span>
                  )}
                </div>
                <h3 className="text-base font-bold mt-0.5">
                  {viewingTicket.deviceModel}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingTicket(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div>
                  <span className="text-xs text-slate-500 block">
                    اسم العميل / الشركة
                  </span>
                  <span className="font-bold text-slate-900">
                    {viewingTicket.customerName}
                    {viewingTicket.employeeName
                      ? ` - ${viewingTicket.employeeName}`
                      : ''}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">
                    رقم الهاتف
                  </span>
                  <span
                    className="font-mono-num font-semibold text-slate-900"
                    dir="ltr"
                  >
                    {viewingTicket.phone || 'غير مسجل'}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">
                    الرقم التسلسلي (S/N)
                  </span>
                  <span className="font-mono-num font-semibold text-slate-900">
                    {viewingTicket.serialNumber || 'غير محدد'}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">
                    حالة الجهاز
                  </span>
                  <span className="font-bold text-blue-700">
                    {viewingTicket.status}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-xs font-bold text-slate-600 block mb-1">
                    وصف العطل / المشكلة بالتفصيل:
                  </span>
                  <p className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800">
                    {viewingTicket.issueDescription}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <span className="text-xs font-bold text-slate-600 block mb-1">
                      الملحقات المستلمة:
                    </span>
                    <span className="text-slate-800">
                      {viewingTicket.accessories || 'بدون ملحقات'}
                    </span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <span className="text-xs font-bold text-slate-600 block mb-1">
                      مركز الصيانة الخارجي / الفني:
                    </span>
                    <span className="text-slate-800">
                      {viewingTicket.externalCenter || 'صيانة داخلية بالمركز'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono-num bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <div>
                    <span className="text-slate-500 block font-sans">
                      تاريخ الاستلام
                    </span>
                    <strong className="text-slate-900">
                      {viewingTicket.receivedDate || '-'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block font-sans">
                      تسليم للصيانة
                    </span>
                    <strong className="text-slate-900">
                      {viewingTicket.sentToCenterDate || '-'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block font-sans">
                      عودة من الصيانة
                    </span>
                    <strong className="text-slate-900">
                      {viewingTicket.receivedFromCenterDate || '-'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block font-sans">
                      التسليم للعميل
                    </span>
                    <strong className="text-emerald-700">
                      {viewingTicket.finalDeliveryDate || '-'}
                    </strong>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 bg-slate-900 text-white rounded-lg p-4 font-mono-num">
                  <div>
                    <span className="text-xs text-slate-400 block font-sans">
                      التكلفة الفعلية
                    </span>
                    <span className="text-base font-bold">
                      {viewingTicket.actualCost.toLocaleString('en-US')}{' '}
                      {settings.currency}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block font-sans">
                      المطلوب من العميل
                    </span>
                    <span className="text-base font-bold">
                      {viewingTicket.customerPrice.toLocaleString('en-US')}{' '}
                      {settings.currency}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block font-sans">
                      صافي الربح
                    </span>
                    <span className="text-base font-bold text-emerald-400">
                      {viewingTicket.netProfit.toLocaleString('en-US')}{' '}
                      {settings.currency}
                    </span>
                  </div>
                </div>

                {viewingTicket.notes && (
                  <div>
                    <span className="text-xs font-bold text-slate-600 block mb-1">
                      ملاحظات إضافية:
                    </span>
                    <p className="bg-amber-50/60 border border-amber-200 rounded-lg p-3 text-slate-800 text-xs">
                      {viewingTicket.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  const t = viewingTicket;
                  setViewingTicket(null);
                  setPrintInitialBatchMode(false);
                  setPrintingTicket(t);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة إيصال الاستلام</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const t = viewingTicket;
                    setViewingTicket(null);
                    setDeletingTicket(t);
                  }}
                  className="px-3.5 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg cursor-pointer"
                >
                  حذف الجهاز
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const t = viewingTicket;
                    setViewingTicket(null);
                    handleOpenEditModal(t);
                  }}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  تعديل البيانات
                </button>
                <button
                  type="button"
                  onClick={() => setViewingTicket(null)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== DEVICE DELETE CONFIRMATION MODAL ==================== */}
      {deletingTicket && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 backdrop-blur-xs p-4 no-print"
          onClick={() => setDeletingTicket(null)}
        >
          <div
            className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-md p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  تأكيد حذف سجل الجهاز
                </h3>
                <p className="text-xs text-slate-500">
                  كود التذكرة:{' '}
                  <span className="font-mono-num font-bold text-slate-700">
                    {deletingTicket.ticketCode}
                  </span>
                </p>
              </div>
            </div>

            <p className="text-sm font-semibold text-slate-800 bg-red-50/60 border border-red-200 rounded-lg p-3.5 leading-relaxed">
              هل أنت متأكد من حذف جهاز العميل [
              {deletingTicket.customerName}
              {deletingTicket.employeeName
                ? ` - ${deletingTicket.employeeName}`
                : ''}
              ] - [{deletingTicket.deviceModel}]؟
            </p>

            <p className="text-xs text-slate-500">
              سيتم حذف هذا السجل نهائياً وتحديث إحصائيات لوحة المتابعة وحسابات الأرباح فوراً.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeletingTicket(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => onDeleteTicket(deletingTicket.id)}
                className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>نعم، تأكيد الحذف النهائي</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Offline Connectivity Banner */}
      {!isOnline && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg bg-amber-600 px-3.5 py-2 text-xs font-bold text-white shadow-lg no-print">
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>وضع عدم الاتصال (Offline) — يعمل البرنامج بكفاءة ويحفظ محلياً</span>
        </div>
      )}

      {/* Toast Notifications Container */}
      <div className="fixed bottom-5 left-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none no-print">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto px-4 py-3 rounded-xl shadow-lg border flex items-start gap-3 transition-all ${
              t.type === 'success'
                ? 'bg-slate-900 text-white border-emerald-500/40'
                : t.type === 'error'
                ? 'bg-red-950 text-white border-red-500/40'
                : 'bg-slate-900 text-white border-blue-500/40'
            }`}
          >
            {t.type === 'success' && (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            )}
            {t.type === 'error' && (
              <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            )}
            {t.type === 'info' && (
              <Wrench className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 text-xs">
              <div className="font-bold">{t.title}</div>
              {t.description && (
                <div className="text-slate-300 mt-0.5">{t.description}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
