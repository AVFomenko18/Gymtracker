// Register service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}

// localStorage cache — persists across PWA sessions so data shows instantly on reopen
const dataCache = {
  set(key, data) {
    try { localStorage.setItem('dc_' + key, JSON.stringify({ t: Date.now(), d: data })); } catch {}
  },
  get(key, maxAgeMs = 300000) { // 5 min default
    try {
      const raw = localStorage.getItem('dc_' + key);
      if (!raw) return null;
      const { t, d } = JSON.parse(raw);
      if (Date.now() - t > maxAgeMs) return null;
      return d;
    } catch { return null; }
  },
  clear(key) {
    try { localStorage.removeItem('dc_' + key); } catch {}
  },
  clearAll() {
    try {
      Object.keys(localStorage).filter(k => k.startsWith('dc_')).forEach(k => localStorage.removeItem(k));
    } catch {}
  }
};
