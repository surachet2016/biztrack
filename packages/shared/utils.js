/**
 * Format Thai Baht currency
 * @param {number} amount
 * @returns {string}
 */
export function formatBaht(amount) {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format date to Thai locale
 * @param {string|Date} date
 * @returns {string}
 */
export function formatDateTh(date) {
  return new Intl.DateTimeFormat('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

/**
 * Calculate Zakat amount
 * @param {number} totalAssets - Total qualifying assets in THB
 * @param {number} nisabValueTHB - Current nisab value in THB
 * @returns {{ eligible: boolean, amount: number }}
 */
export function calculateZakat(totalAssets, nisabValueTHB) {
  if (totalAssets < nisabValueTHB) {
    return { eligible: false, amount: 0 };
  }
  return { eligible: true, amount: totalAssets * 0.025 };
}

/**
 * Check if a subscription is currently active
 * @param {object|null} subscription
 * @returns {boolean}
 */
export function isSubscriptionActive(subscription) {
  if (!subscription) return false;
  if (subscription.status !== 'active') return false;
  return new Date(subscription.expires_at) > new Date();
}

/**
 * Get plan feature limits
 * @param {string} plan
 * @returns {{ image: boolean, receiptAnalysis: boolean }}
 */
export function getPlanLimits(plan) {
  const limits = {
    // free: text chat + income/expense tracking from text
    free:   { image: false, receiptAnalysis: false, voice: false, textExtract: true },
    // basic: + voice input
    basic:  { image: false, receiptAnalysis: false, voice: true,  textExtract: true },
    // pro: + image/receipt upload + receipt analysis
    pro:    { image: true,  receiptAnalysis: true,  voice: true,  textExtract: true },
    annual: { image: true,  receiptAnalysis: true,  voice: true,  textExtract: true },
  };
  return limits[plan] || limits.free;
}
