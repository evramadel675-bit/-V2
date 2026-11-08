import { MaintenanceTicket, ServiceCenter, WorkshopSettings } from '../types';

export const DEFAULT_WORKSHOP_SETTINGS: WorkshopSettings = {
  centerName: 'المركز المتقدم لصيانة الإلكترونيات والأنظمة',
  centerSubtitle: 'صيانة اللابتوب، الشاشات، الريسيفرات، وأنظمة المراقبة',
  centerPhone: '01012345678 - 0223456789',
  centerAddress: 'القاهرة - مدينة نصر - شارع عباس العقاد - برج التكنولوجيا الدور الثاني',
  currency: 'ج.م',
  defaultPrintFormat: 'A4',
  receiptTerms: [
    'يعتبر هذا الإيصال المستند الوحيد لاستلام الجهاز ولا يتم تسليم الجهاز إلا بتقديم أصل الإيصال.',
    'المركز غير مسؤول عن الأجهزة التي لا يتم استلامها خلال 30 يوماً من تاريخ إبلاغ العميل بانتهاء الصيانة أو تعذرها.',
    'الضمان يقتصر على العطل الذي تم إصلاحه فقط لمدة 14 يوماً من تاريخ التسليم ولا يشمل الكسر أو سوء الاستخدام أو انقطاع التيار.',
    'المركز غير مسؤول عن أي بيانات مخزنة على وحدات التخزين، وينصح العميل بأخذ نسخة احتياطية مسبقاً.',
  ],
};

export const INITIAL_SERVICE_CENTERS: ServiceCenter[] = [
  {
    id: 'sc-1',
    name: 'تكنو لاب لصيانة الماذربورد - م. أحمد فؤاد',
    specialistName: 'م. أحمد فؤاد',
    phone: '01004455667',
    specialty: 'صيانة ماذربورد لابتوب ودوائر الشحن والشيبات',
    address: 'القاهرة - مول البستان - الدور الرابع',
    notes: 'التسليم والاستلام يومياً من 12 ظهراً حتى 8 مساءً',
  },
  {
    id: 'sc-2',
    name: 'الورشة المركزية للشاشات - م. كريم عادل',
    specialistName: 'م. كريم عادل',
    phone: '01112233445',
    specialty: 'صيانة شاشات سمارت، تغيير مساطر الليد، وإصلاح البانل (COF)',
    address: 'وسط البلد - شارع عبد العزيز',
    notes: 'ضمان 3 أشهر على أطقم الليدات الأصلية',
  },
  {
    id: 'sc-3',
    name: 'المركز الهندسي للأنظمة الأمنية',
    specialistName: 'م. حسام المنيري',
    phone: '01223344556',
    specialty: 'صيانة أجهزة DVR / NVR وكاميرات المراقبة الشبكية',
    address: 'المهندسين - شارع جامعة الدول العربية',
    notes: 'وكيل معتمد لصيانة أجهزة Hikvision و Dahua',
  },
  {
    id: 'sc-4',
    name: 'مركز الجزيرة للريسيفرات - م. هاني',
    specialistName: 'م. هاني سعيد',
    phone: '01099887766',
    specialty: 'شحن فلاشات الريسيفرات وصيانة دوائر الباور والإشارة',
    address: 'باب اللوق - مول الفلكي',
    notes: 'إنجاز سريع في نفس اليوم لأعطال السوفت وير والباور',
  },
  {
    id: 'sc-5',
    name: 'داخلي - م. محمد طارق',
    specialistName: 'م. محمد طارق',
    phone: '01556677889',
    specialty: 'صيانة داخلية بالمركز (تغيير شاشات، مفصلات، هاردات، سوفت وير)',
    address: 'مقر المركز الرئيسي',
    notes: 'فني مقيم بالمركز',
  },
];

export const INITIAL_SAMPLE_TICKETS: MaintenanceTicket[] = [
  {
    id: 'mnt-sample-1',
    ticketCode: 'MNT-1001',
    batchCode: 'CORP-101',
    receivedDate: '2026-11-01',
    customerName: 'شركة النور للمقاولات والتوريدات',
    employeeName: 'أ. أحمد سمير (المحاسبة)',
    phone: '01098765432',
    deviceModel: 'لابتوب Dell Latitude 5520 Core i7',
    serialNumber: 'DL-5520-8941X',
    issueDescription: 'الجهاز يفصل باور فجأة أثناء العمل مع سخونة عالية في دائرة الشحن وعدم استقرار الشاحن.',
    accessories: 'شاحن أصلي 65W + حقيبة سوداء',
    externalCenter: 'تكنو لاب لصيانة الماذربورد - م. أحمد فؤاد',
    sentToCenterDate: '2026-11-02',
    receivedFromCenterDate: '2026-11-05',
    status: 'تم التسليم للعميل',
    actualCost: 650,
    customerPrice: 1200,
    netProfit: 550,
    finalDeliveryDate: '2026-11-06',
    notes: 'تم تغيير آي سي الشحن وتنظيف دائرة التبريد بالكامل مع إضافة معجون حراري احترافي.',
  },
  {
    id: 'mnt-sample-1b',
    ticketCode: 'MNT-1002',
    batchCode: 'CORP-101',
    receivedDate: '2026-11-01',
    customerName: 'شركة النور للمقاولات والتوريدات',
    employeeName: 'م. وائل كمال (المكتب الفني)',
    phone: '01098765432',
    deviceModel: 'لابتوب HP ProBook 450 G8',
    serialNumber: 'HP-450G8-3312M',
    issueDescription: 'توقف لوحة المفاتيح عن العمل في بعض الأزرار مع بطء شديد في إقلاع النظام.',
    accessories: 'شاحن أصلي HP',
    externalCenter: 'داخلي - م. محمد طارق',
    sentToCenterDate: '2026-11-01',
    receivedFromCenterDate: '2026-11-03',
    status: 'تم الإصلاح',
    actualCost: 450,
    customerPrice: 850,
    netProfit: 400,
    finalDeliveryDate: '',
    notes: 'تم استبدال الكيبورد بالكامل وتحديث SSD.',
  },
  {
    id: 'mnt-sample-2',
    ticketCode: 'MNT-1003',
    receivedDate: '2026-11-03',
    customerName: 'أستاذ محمود عبد الرحمن السيد',
    phone: '01123459876',
    deviceModel: 'شاشة سامسونج سمارت 43 بوصة 4K',
    serialNumber: 'SAM-UA43-77210',
    issueDescription: 'يوجد صوت بدون صورة (عطل إضاءة خلفية Backlight) مع وميض خفيف عند التشغيل.',
    accessories: 'ريموت كنترول أصلي + كابل باور',
    externalCenter: 'الورشة المركزية للشاشات - م. كريم عادل',
    sentToCenterDate: '2026-11-04',
    receivedFromCenterDate: '2026-11-07',
    status: 'تم الإصلاح',
    actualCost: 800,
    customerPrice: 1450,
    netProfit: 650,
    finalDeliveryDate: '',
    notes: 'تم تغيير طقم مساطر الليد بالكامل بأصلي مع خفض الفولت لحماية الليدات، وتم إبلاغ العميل للاستلام.',
  },
  {
    id: 'mnt-sample-3',
    ticketCode: 'MNT-1004',
    receivedDate: '2026-11-05',
    customerName: 'معرض الأمل للأدوات المنزلية',
    employeeName: 'جهاز الكاشير الرئيسي',
    phone: '01287654321',
    deviceModel: 'جهاز تسجيل كاميرات Hikvision DVR 16CH',
    serialNumber: 'HIK-DVR16-44109',
    issueDescription: 'الجهاز يصدر صافرة متقطعة ولا يقرأ الهارد ديسك الداخلي مع توقف التسجيل.',
    accessories: 'أدابتور 12V 3A + ماوس سلكي',
    externalCenter: 'المركز الهندسي للأنظمة الأمنية',
    sentToCenterDate: '2026-11-06',
    receivedFromCenterDate: '',
    status: 'تم الإرسال للصيانة',
    actualCost: 350,
    customerPrice: 700,
    netProfit: 350,
    finalDeliveryDate: '',
    notes: 'جاري فحص دائرة تنظيم الجهد 12V/5V الخاصة بتغذية الهارد ديسك.',
  },
  {
    id: 'mnt-sample-4',
    ticketCode: 'MNT-1005',
    receivedDate: '2026-11-07',
    customerName: 'مهندس طارق حسام الدين',
    phone: '01554321987',
    deviceModel: 'لابتوب HP Pavilion Gaming 15',
    serialNumber: 'HP-PAV15-9902A',
    issueDescription: 'كسر في مفصلات الشاشة اليسرى مع قطع في فلاتة الشاشة وظهور خطوط عرضية.',
    accessories: 'بدون ملحقات (الجهاز فقط)',
    externalCenter: 'داخلي - م. محمد طارق',
    sentToCenterDate: '',
    receivedFromCenterDate: '',
    status: 'قيد الفحص',
    actualCost: 450,
    customerPrice: 950,
    netProfit: 500,
    finalDeliveryDate: '',
    notes: 'بانتظار موافقة العميل النهائية على تكلفة تغيير الفلاتة وإعادة بناء قواعد المفصلات.',
  },
  {
    id: 'mnt-sample-5',
    ticketCode: 'MNT-1006',
    receivedDate: '2026-11-04',
    customerName: 'أستاذ سامح فوزي المنشاوي',
    phone: '01065432109',
    deviceModel: 'ريسيفر Tiger T8 Ultra 4K',
    serialNumber: 'TGR-T8U-11054',
    issueDescription: 'الجهاز متوقف على لمبة حمراء (Boot) بعد انقطاع مفاجئ للكهرباء أثناء التحديث.',
    accessories: 'أدابتور + ريموت + عدسة خارجية',
    externalCenter: 'مركز الجزيرة للريسيفرات - م. هاني',
    sentToCenterDate: '2026-11-05',
    receivedFromCenterDate: '2026-11-07',
    status: 'تم الإصلاح',
    actualCost: 150,
    customerPrice: 350,
    netProfit: 200,
    finalDeliveryDate: '',
    notes: 'تم شحن فلاشة السوفت وير عبر المبرمجة وتحديث ملف القنوات.',
  },
  {
    id: 'mnt-sample-6',
    ticketCode: 'MNT-1007',
    receivedDate: '2026-11-02',
    customerName: 'عيادة د. سارة الشامي للأسنان',
    employeeName: 'جهاز الاستقبال',
    phone: '01022334455',
    deviceModel: 'لابتوب Lenovo IdeaPad 3',
    serialNumber: 'LNV-IP3-55301',
    issueDescription: 'انسكاب سائل على لوحة المفاتيح أدى لتوقف الجهاز تماماً عن العمل.',
    accessories: 'شاحن أصلي Lenovo',
    externalCenter: 'تكنو لاب لصيانة الماذربورد - م. أحمد فؤاد',
    sentToCenterDate: '2026-11-03',
    receivedFromCenterDate: '2026-11-06',
    status: 'تعذر الإصلاح',
    actualCost: 0,
    customerPrice: 0,
    netProfit: 0,
    finalDeliveryDate: '',
    notes: 'تلف كامل في المعالج المدمج PCH نتيجة وصول السائل تحت الشيب ولا تتوفر بردة بديلة حالياً.',
  },
];

export function generateNextTicketCode(tickets: MaintenanceTicket[]): string {
  let maxNumber = 1000;
  for (const ticket of tickets) {
    const match = ticket.ticketCode.match(/(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxNumber) {
        maxNumber = num;
      }
    }
  }
  return `MNT-${maxNumber + 1}`;
}

export function generateNextBatchCode(tickets: MaintenanceTicket[]): string {
  let maxNumber = 100;
  for (const ticket of tickets) {
    if (ticket.batchCode) {
      const match = ticket.batchCode.match(/(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNumber) {
          maxNumber = num;
        }
      }
    }
  }
  return `CORP-${maxNumber + 1}`;
}
