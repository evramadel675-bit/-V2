import React, { useState } from 'react';
import {
  Building2,
  Plus,
  Edit3,
  Trash2,
  Phone,
  MapPin,
  UserCheck,
  AlertTriangle,
  Save,
  X,
  Wrench,
  Filter,
} from 'lucide-react';
import { MaintenanceTicket, ServiceCenter } from '../types';

interface ServiceCentersManagerProps {
  centers: ServiceCenter[];
  tickets: MaintenanceTicket[];
  currency: string;
  onAddCenter: (center: Omit<ServiceCenter, 'id'>) => void;
  onUpdateCenter: (
    updated: ServiceCenter,
    oldName: string,
    updateLinkedTickets: boolean
  ) => void;
  onDeleteCenter: (
    centerId: string,
    centerName: string,
    reassignAction: 'reassign_internal' | 'keep_name'
  ) => void;
  onFilterByCenter: (centerName: string) => void;
}

export const ServiceCentersManager: React.FC<ServiceCentersManagerProps> = ({
  centers,
  tickets,
  currency,
  onAddCenter,
  onUpdateCenter,
  onDeleteCenter,
  onFilterByCenter,
}) => {
  // Form state for adding / editing a center
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCenter, setEditingCenter] = useState<ServiceCenter | null>(null);
  const [name, setName] = useState('');
  const [specialistName, setSpecialistName] = useState('');
  const [phone, setPhone] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [updateTicketsOnRename, setUpdateTicketsOnRename] = useState(true);
  const [formError, setFormError] = useState('');

  // Delete confirmation state
  const [centerToDelete, setCenterToDelete] = useState<{
    center: ServiceCenter;
    linkedTicketsCount: number;
  } | null>(null);

  const openAddForm = () => {
    setEditingCenter(null);
    setName('');
    setSpecialistName('');
    setPhone('');
    setSpecialty('');
    setAddress('');
    setNotes('');
    setFormError('');
    setIsFormOpen(true);
  };

  const openEditForm = (center: ServiceCenter) => {
    setEditingCenter(center);
    setName(center.name);
    setSpecialistName(center.specialistName);
    setPhone(center.phone);
    setSpecialty(center.specialty);
    setAddress(center.address);
    setNotes(center.notes);
    setUpdateTicketsOnRename(true);
    setFormError('');
    setIsFormOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setFormError('يرجى إدخال اسم مركز الصيانة أو الفني.');
      return;
    }

    const duplicate = centers.some(
      (c) =>
        c.name.trim().toLowerCase() === trimmedName.toLowerCase() &&
        c.id !== editingCenter?.id
    );
    if (duplicate) {
      setFormError('يوجد مركز صيانة مسجل بهذا الاسم بالفعل.');
      return;
    }

    if (editingCenter) {
      onUpdateCenter(
        {
          id: editingCenter.id,
          name: trimmedName,
          specialistName: specialistName.trim(),
          phone: phone.trim(),
          specialty: specialty.trim(),
          address: address.trim(),
          notes: notes.trim(),
        },
        editingCenter.name,
        updateTicketsOnRename
      );
    } else {
      onAddCenter({
        name: trimmedName,
        specialistName: specialistName.trim(),
        phone: phone.trim(),
        specialty: specialty.trim(),
        address: address.trim(),
        notes: notes.trim(),
      });
    }

    setIsFormOpen(false);
    setEditingCenter(null);
  };

  const initiateDeleteCenter = (center: ServiceCenter) => {
    const linkedCount = tickets.filter(
      (t) => t.externalCenter.trim() === center.name.trim()
    ).length;
    setCenterToDelete({ center, linkedTicketsCount: linkedCount });
  };

  return (
    <div className="space-y-6">
      {/* Header & Add New Center Button */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                إدارة مراكز الصيانة والفنيين الخارجيين ({centers.length})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                إضافة وتعديل وحذف المراكز المعتمدة، ومتابعة الأجهزة والتكاليف المسجلة لكل مركز
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={openAddForm}
            className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة مركز صيانة / فني جديد</span>
          </button>
        </div>

        {/* Add / Edit Inline Form */}
        {isFormOpen && (
          <form
            onSubmit={handleSave}
            className="mt-5 bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <h3 className="text-sm font-bold text-slate-900">
                {editingCenter
                  ? `تعديل بيانات المركز: ${editingCenter.name}`
                  : 'تسجيل مركز صيانة أو فني خارجي جديد'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsFormOpen(false);
                  setEditingCenter(null);
                }}
                className="text-slate-400 hover:text-slate-700 p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs font-semibold">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  اسم مركز الصيانة / الورشة <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: تكنو لاب لصيانة الماذربورد"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  اسم المهندس / الفني المسؤول
                </label>
                <input
                  type="text"
                  value={specialistName}
                  onChange={(e) => setSpecialistName(e.target.value)}
                  placeholder="مثال: م. أحمد فؤاد"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  رقم الهاتف / التواصل
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01012345678"
                  dir="ltr"
                  className="w-full px-3 py-2 text-xs font-mono-num text-right bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  التخصص الفني الدقيق
                </label>
                <input
                  type="text"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  placeholder="مثال: صيانة شاشات، لابتوب، ريسيفر، DVR..."
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  العنوان / المقر
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="مثال: مول البستان - الدور الرابع"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ملاحظات التعامل / المواعيد
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="مثال: ضمان 3 أشهر على الإصلاح"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            {editingCenter && editingCenter.name !== name.trim() && (
              <label className="flex items-center gap-2 text-xs text-slate-700 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={updateTicketsOnRename}
                  onChange={(e) => setUpdateTicketsOnRename(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>
                  تحديث اسم هذا المركز تلقائياً في كافة الأجهزة المسجلة باسمه حالياً
                </span>
              </label>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsFormOpen(false);
                  setEditingCenter(null);
                }}
                className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{editingCenter ? 'حفظ التعديلات' : 'إضافة المركز'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Service Centers Table */}
        <div className="mt-5 overflow-x-auto">
          {centers.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <Building2 className="w-8 h-8 text-slate-400 mx-auto" />
              <div className="text-sm font-bold text-slate-700">
                لا توجد مراكز صيانة مسجلة حالياً
              </div>
              <p className="text-xs text-slate-500">
                اضغط على «إضافة مركز صيانة / فني جديد» لإضافة أول مركز صيانة معتمد.
              </p>
            </div>
          ) : (
            <table className="w-full text-sm text-right border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 text-xs border-b border-slate-200">
                  <th className="py-3 px-4 font-bold whitespace-nowrap">
                    اسم مركز الصيانة / الورشة
                  </th>
                  <th className="py-3 px-4 font-bold whitespace-nowrap">
                    المهندس والهاتف
                  </th>
                  <th className="py-3 px-4 font-bold whitespace-nowrap">
                    التخصص والعنوان
                  </th>
                  <th className="py-3 px-4 font-bold whitespace-nowrap">
                    الأجهزة المسجلة
                  </th>
                  <th className="py-3 px-4 font-bold whitespace-nowrap">
                    إجمالي التكاليف
                  </th>
                  <th className="py-3 px-4 font-bold whitespace-nowrap">
                    صافي الربح
                  </th>
                  <th className="py-3 px-4 font-bold text-center whitespace-nowrap">
                    الإجراءات (تعديل / حذف)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {centers.map((center) => {
                  const centerTickets = tickets.filter(
                    (t) => t.externalCenter.trim() === center.name.trim()
                  );
                  const activeCount = centerTickets.filter(
                    (t) =>
                      t.status === 'قيد الفحص' || t.status === 'تم الإرسال للصيانة'
                  ).length;
                  const totalCost = centerTickets.reduce(
                    (sum, t) => sum + t.actualCost,
                    0
                  );
                  const totalProfit = centerTickets.reduce(
                    (sum, t) => sum + t.netProfit,
                    0
                  );

                  return (
                    <tr
                      key={center.id}
                      className="hover:bg-slate-50/90 transition-colors align-top"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          <Wrench className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>{center.name}</span>
                        </div>
                        {center.notes && (
                          <div className="text-xs text-slate-500 mt-1">
                            {center.notes}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                          <span>{center.specialistName || 'غير محدد'}</span>
                        </div>
                        {center.phone && (
                          <div className="text-xs text-slate-500 font-mono-num mt-1 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span dir="ltr">{center.phone}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="text-xs text-slate-800 font-medium">
                          {center.specialty || 'صيانة عامة'}
                        </div>
                        {center.address && (
                          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{center.address}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap font-mono-num">
                        <div className="text-xs font-bold text-slate-900">
                          {centerTickets.length} جهاز
                        </div>
                        <div className="text-[11px] text-blue-600 mt-0.5">
                          {activeCount > 0
                            ? `${activeCount} قيد الصيانة حالياً`
                            : 'لا توجد أجهزة معلقة'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap font-mono-num text-xs font-semibold text-slate-800">
                        {totalCost.toLocaleString('en-US')} {currency}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap font-mono-num text-xs font-bold text-emerald-600">
                        {totalProfit.toLocaleString('en-US')} {currency}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onFilterByCenter(center.name)}
                            className="px-2.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                            title="عرض الأجهزة المسجلة لدى هذا المركز"
                          >
                            <Filter className="w-3.5 h-3.5" />
                            <span>الأجهزة ({centerTickets.length})</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => openEditForm(center)}
                            className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                            title="تعديل بيانات المركز"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>تعديل</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => initiateDeleteCenter(center)}
                            className="px-2.5 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                            title="حذف مركز الصيانة"
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
          )}
        </div>
      </div>

      {/* Delete Service Center Confirmation Modal */}
      {centerToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 backdrop-blur-xs p-4 no-print"
          onClick={() => setCenterToDelete(null)}
        >
          <div
            className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-lg p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  تأكيد حذف مركز الصيانة
                </h3>
                <p className="text-xs text-slate-500">
                  {centerToDelete.center.name}
                </p>
              </div>
            </div>

            {centerToDelete.linkedTicketsCount > 0 ? (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5 text-xs text-amber-900 space-y-2 leading-relaxed">
                <div className="font-bold text-amber-950">
                  تنبيه هام: يوجد ({centerToDelete.linkedTicketsCount}) جهاز مسجل حالياً باسم هذا المركز!
                </div>
                <p>
                  يرجى اختيار كيفية التعامل مع الأجهزة المرتبطة بهذا المركز لمنع أي تعارض في السجلات:
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-600 leading-relaxed">
                هل أنت متأكد من حذف مركز الصيانة{' '}
                <strong className="text-slate-900">
                  «{centerToDelete.center.name}»
                </strong>
                ؟ لا توجد أي أجهزة مرتبطة بهذا المركز حالياً.
              </p>
            )}

            <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCenterToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                إلغاء
              </button>

              {centerToDelete.linkedTicketsCount > 0 ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteCenter(
                        centerToDelete.center.id,
                        centerToDelete.center.name,
                        'keep_name'
                      );
                      setCenterToDelete(null);
                    }}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg transition-colors cursor-pointer"
                  >
                    حذف من القائمة مع إبقاء الاسم بالتذاكر القديمة
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteCenter(
                        centerToDelete.center.id,
                        centerToDelete.center.name,
                        'reassign_internal'
                      );
                      setCenterToDelete(null);
                    }}
                    className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors cursor-pointer"
                  >
                    حذف المركز وتحويل أجهزته لصيانة داخلية
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onDeleteCenter(
                      centerToDelete.center.id,
                      centerToDelete.center.name,
                      'keep_name'
                    );
                    setCenterToDelete(null);
                  }}
                  className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors cursor-pointer"
                >
                  تأكيد حذف المركز
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
