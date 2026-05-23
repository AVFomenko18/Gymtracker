// Register service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}

// sessionStorage cache helpers
const dataCache = {
  set(key, data) {
    try { sessionStorage.setItem('dc_' + key, JSON.stringify({ t: Date.now(), d: data })); } catch {}
  },
  get(key, maxAgeMs = 300000) { // 5 min default
    try {
      const raw = sessionStorage.getItem('dc_' + key);
      if (!raw) return null;
      const { t, d } = JSON.parse(raw);
      if (Date.now() - t > maxAgeMs) return null;
      return d;
    } catch { return null; }
  },
  clear(key) {
    try { sessionStorage.removeItem('dc_' + key); } catch {}
  }
};
