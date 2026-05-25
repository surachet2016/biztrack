// Subscription Packages
export const PACKAGES = {
  basic: {
    id: 'basic',
    name: 'Basic',
    nameTh: 'แพ็กเกจพื้นฐาน',
    price: 99,
    period: 'month',
    periodTh: 'เดือน',
    features: [
      'แชทด้วยข้อความ (Text Chat)',
      'แชทด้วยเสียง (Voice Chat)',
      'ประวัติแชท 30 วัน',
    ],
    limits: { image: false, receiptAnalysis: false },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    nameTh: 'แพ็กเกจโปร',
    price: 299,
    period: 'month',
    periodTh: 'เดือน',
    features: [
      'แชทด้วยข้อความ (Text Chat)',
      'แชทด้วยเสียง (Voice Chat)',
      'อัปโหลดรูปใบเสร็จ/ใบแจ้งหนี้',
      'วิเคราะห์รายรับ-รายจ่ายอัตโนมัติ',
      'รายงานสรุปรายเดือน',
      'ประวัติแชท 1 ปี',
    ],
    limits: { image: true, receiptAnalysis: true },
    popular: true,
  },
  annual: {
    id: 'annual',
    name: 'Annual',
    nameTh: 'แพ็กเกจรายปี',
    price: 2990,
    period: 'year',
    periodTh: 'ปี',
    features: [
      'ทุกฟีเจอร์ของแพ็กเกจโปร',
      'ประหยัดกว่ารายเดือน ~17%',
      'รายงานสรุปรายปี',
      'ประวัติแชทไม่จำกัด',
      'สนับสนุนลำดับความสำคัญ',
    ],
    limits: { image: true, receiptAnalysis: true },
  },
};

// Zakat
export const ZAKAT_NISAB_GOLD_GRAM = 85; // กรัมทอง (85g = Nisab มาตรฐาน)
export const ZAKAT_RATE = 0.025; // 2.5%

// Slow-moving product threshold (days without a sale)
export const SLOW_MOVING_DAYS = 30;

// User roles
export const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
};

// Subscription statuses
export const SUB_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  EXPIRED: 'expired',
};

// Payment slip statuses
export const SLIP_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

// Transaction types
export const TX_TYPE = {
  INCOME: 'income',
  EXPENSE: 'expense',
};
