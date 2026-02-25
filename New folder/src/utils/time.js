/**
 * Returns a human-readable relative time string.
 * @param {number} ts  – Unix timestamp in milliseconds
 * @param {string} lang – 'ar' | 'en'
 */
export const relativeTime = (ts, lang) => {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  const hrs  = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1)   return lang === 'ar' ? 'الآن'             : 'Just now';
  if (mins < 60)  return lang === 'ar' ? `منذ ${mins} د`    : `${mins}m ago`;
  if (hrs  < 24)  return lang === 'ar' ? `منذ ${hrs} ساعة`  : `${hrs}h ago`;
  if (days === 1) return lang === 'ar' ? 'أمس'              : 'Yesterday';
  return lang === 'ar' ? `منذ ${days} أيام` : `${days}d ago`;
};
