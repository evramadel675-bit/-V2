import React, { useState, useRef } from 'react';
import {
  MonitorDown,
  X,
  CheckCircle2,
  Terminal,
  HardDriveDownload,
  HardDriveUpload,
  Copy,
  Check,
  Laptop,
  ShieldCheck,
} from 'lucide-react';

interface DesktopInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  isInstallable: boolean;
  isInstalled: boolean;
  onTriggerNativeInstall: () => Promise<void>;
  onExportFullBackup: () => void;
  onImportFullBackup: (file: File) => void;
}

export const DesktopInstallModal: React.FC<DesktopInstallModalProps> = ({
  isOpen,
  onClose,
  isInstallable,
  isInstalled,
  onTriggerNativeInstall,
  onExportFullBackup,
  onImportFullBackup,
}) => {
  const [copiedCmd, setCopiedCmd] = useState(false);
  const backupInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const currentOrigin =
    typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

  const nativefierCmd = `npx nativefier "${currentOrigin}" --name "MaintenanceTracker" --platform windows --arch x64 --single-instance`;

  const handleCopyCommand = () => {
    navigator.clipboard?.writeText(nativefierCmd);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 backdrop-blur-xs p-4 overflow-y-auto no-print"
      onClick={onClose}
    >
      <div
        className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-2xl my-8 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <MonitorDown className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">
                تثبيت البرنامج على الديسكتوب (Desktop PWA & Native .EXE)
              </h2>
              <p className="text-xs text-slate-400">
                تشغيل النظام كنافذة سطح مكتب مستقلة بدون شريط المتصفح مع حفظ محلي دائم
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

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-sm">
          {/* Option 1: Direct Browser PWA Install */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <Laptop className="w-4 h-4 text-blue-600" />
                <span>1. التثبيت المباشر كتطبيق سطح مكتب مستقل (PWA)</span>
              </div>
              {isInstalled ? (
                <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  مثبت ويعمل بوضع مستقل
                </span>
              ) : isInstallable ? (
                <span className="text-xs font-bold text-blue-600">
                  جاهز للتثبيت الفوري
                </span>
              ) : (
                <span className="text-xs text-slate-500">
                  متاح عبر Chrome / Edge
                </span>
              )}
            </div>

            {isInstallable ? (
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <p className="text-xs text-slate-600">
                  المتصفح يدعم التثبيت المباشر الآن. اضغط على الزر لتثبيت البرنامج على سطح المكتب وشريط المهام:
                </p>
                <button
                  type="button"
                  onClick={onTriggerNativeInstall}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <MonitorDown className="w-4 h-4" />
                  <span>تثبيت البرنامج على الديسكتوب الآن</span>
                </button>
              </div>
            ) : (
              <div className="text-xs text-slate-600 space-y-1.5 leading-relaxed">
                <p>
                  لتثبيت البرنامج كنافذة مستقلة على الكمبيوتر (Windows / Mac / Linux):
                </p>
                <ol className="list-decimal list-inside space-y-1 text-slate-700 font-medium">
                  <li>
                    افتح رابط التطبيق في نافذة متصفح <strong>Google Chrome</strong> أو{' '}
                    <strong>Microsoft Edge</strong> كاملة (خارج إطار المعاينة).
                  </li>
                  <li>
                    اضغط على زر <strong>«تثبيت البرنامج على الديسكتوب»</strong> في الهيدر، أو اضغط على أيقونة التثبيت <span className="font-mono-num">[⊕]</span> في يمين شريط العنوان.
                  </li>
                  <li>
                    سيتم إنشاء اختصار للبرنامج على سطح المكتب ويعمل بدون اتصال بالإنترنت (Offline).
                  </li>
                </ol>
              </div>
            )}
          </div>

          {/* Option 2: Nativefier / Electron / Inno Setup (.exe) */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <Terminal className="w-4 h-4 text-blue-600" />
              <span>
                2. تحويل التطبيق إلى ملف تنفيذي مستقل (Windows .EXE)
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              التطبيق مهيأ برمجياً بالكامل للعمل داخل بيئة <strong>Electron</strong> أو{' '}
              <strong>Nativefier</strong> أو <strong>Inno Setup</strong> مع الاحتفاظ الدائم بالبيانات في التخزين المحلي. لتحويله إلى ملف <code>.exe</code> بضغطة واحدة:
            </p>
            <div className="bg-slate-900 text-slate-100 p-3 rounded-lg flex items-center justify-between gap-3 font-mono-num text-xs" dir="ltr">
              <code className="overflow-x-auto whitespace-nowrap">
                {nativefierCmd}
              </code>
              <button
                type="button"
                onClick={handleCopyCommand}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded flex items-center gap-1 shrink-0 transition-colors"
                title="نسخ الأمر"
              >
                {copiedCmd ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="font-sans text-[11px]">تم النسخ</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span className="font-sans text-[11px]">نسخ</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Option 3: Full LocalStorage Database Backup & Restore */}
          <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>
                3. النسخ الاحتياطي الشامل ونقل قاعدة البيانات (LocalStorage Backup)
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              لنقل كافة بياناتك (الأجهزة، مراكز الصيانة، وإعدادات المركز) بين المتصفح ونسخة الديسكتوب <code>.exe</code> بدون فقدان أي سجل:
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={onExportFullBackup}
                className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <HardDriveDownload className="w-4 h-4 text-blue-400" />
                <span>تحميل نسخة احتياطية كاملة (.JSON)</span>
              </button>

              <input
                ref={backupInputRef}
                type="file"
                accept=".json"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    onImportFullBackup(file);
                  }
                  if (backupInputRef.current) backupInputRef.current.value = '';
                }}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => backupInputRef.current?.click()}
                className="px-4 py-2 text-xs font-bold text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <HardDriveUpload className="w-4 h-4 text-emerald-600" />
                <span>استعادة نسخة احتياطية (.JSON)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-lg transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
