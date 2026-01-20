import zhTW from '../locales/zh-TW.json';
import enUS from '../locales/en-US.json';

const RESOURCES = {
  'zh-TW': zhTW,
  'en-US': enUS,
};

function normalizeLanguage(lang) {
  const raw = String(lang || '').trim().toLowerCase();
  if (!raw) return 'en-US';
  if (raw.startsWith('zh')) return 'zh-TW';
  return 'en-US';
}

export function getCurrentLanguage() {
  if (typeof window === 'undefined') return 'en-US';
  const stored = window.localStorage.getItem('lang');
  return normalizeLanguage(stored || window.navigator.language);
}

function getByPath(obj, keyPath) {
  const parts = String(keyPath || '').split('.').filter(Boolean);
  let cur = obj;
  for (const k of parts) {
    if (cur && Object.prototype.hasOwnProperty.call(cur, k)) {
      cur = cur[k];
    } else {
      return undefined;
    }
  }
  return cur;
}

/**
 * Minimal i18n (no dependency) to prevent label hardcoding debt.
 * - Uses localStorage `lang` when present, else navigator.language
 * - Falls back to en-US, then to provided fallback, then to key
 */
export function t(key, fallback) {
  const lang = getCurrentLanguage();
  const dict = RESOURCES[lang] || RESOURCES['en-US'];
  const val = getByPath(dict, key);
  if (typeof val === 'string') return val;

  const enVal = getByPath(RESOURCES['en-US'], key);
  if (typeof enVal === 'string') return enVal;

  return fallback ?? String(key);
}

