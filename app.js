/* Kasa – Şifre Yöneticisi
 * Tüm veriler cihazda, AES-256-GCM ile şifrelenmiş olarak IndexedDB'de tutulur.
 * Anahtar, ana şifreden PBKDF2-SHA256 (600.000 tur) ile türetilir. Ağa hiçbir veri gönderilmez.
 */
'use strict';
(() => {
  const VERSION = '1.0.0';
  const ITER = 600000;
  const app = document.getElementById('app');
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const te = new TextEncoder();
  const td = new TextDecoder();
  const DAY = 864e5;

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

  /* ---------------- Icons ---------------- */
  const P = {
    search: '<circle cx="11" cy="11" r="7.5"/><path d="m20.5 20.5-4.2-4.2"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    copy: '<rect x="8.5" y="8.5" width="12" height="12" rx="2.5"/><path d="M15.5 8.5V6a2.5 2.5 0 0 0-2.5-2.5H6A2.5 2.5 0 0 0 3.5 6v7A2.5 2.5 0 0 0 6 15.5h2.5"/>',
    eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    eyeOff: '<path d="M9.9 4.24A9.1 9.1 0 0 1 12 4c6.4 0 10 8 10 8a17.6 17.6 0 0 1-2.16 3.19M6.6 6.6A17.3 17.3 0 0 0 2 12s3.6 8 10 8a9.7 9.7 0 0 0 5.4-1.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/><path d="m2 2 20 20"/>',
    star: '<path d="m12 2.8 2.85 5.78 6.38.93-4.62 4.5 1.09 6.35L12 17.36l-5.7 3 1.09-6.35-4.62-4.5 6.38-.93Z"/>',
    trash: '<path d="M3.5 6h17M9 6V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V6m3 0-.8 13a2 2 0 0 1-2 1.9H8.8a2 2 0 0 1-2-1.9L6 6"/><path d="M10 11v5M14 11v5"/>',
    settings: '<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2.2"/><circle cx="10" cy="17" r="2.2"/>',
    shield: '<path d="M12 21.5s8-3.6 8-10.2V5.6L12 2.5 4 5.6v5.7c0 6.6 8 10.2 8 10.2Z"/>',
    shieldCheck: '<path d="M12 21.5s8-3.6 8-10.2V5.6L12 2.5 4 5.6v5.7c0 6.6 8 10.2 8 10.2Z"/><path d="m8.8 12 2.2 2.2 4.4-4.4"/>',
    lock: '<rect x="4" y="10.5" width="16" height="11" rx="2.5"/><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5"/>',
    key: '<circle cx="8" cy="15" r="5"/><path d="m11.6 11.4 8.9-8.9M17 6l3 3M14.5 8.5l2 2"/>',
    refresh: '<path d="M20 11a8 8 0 0 0-14.3-4.9L4 8"/><path d="M4 3.5V8h4.5"/><path d="M4 13a8 8 0 0 0 14.3 4.9L20 16"/><path d="M20 20.5V16h-4.5"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    chevRight: '<path d="m9 5 7 7-7 7"/>',
    chevDown: '<path d="m6 9 6 6 6-6"/>',
    external: '<path d="M14 3.5h6.5V10M20.5 3.5 11 13"/><path d="M18 14v4.5a2 2 0 0 1-2 2H5.5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2H10"/>',
    download: '<path d="M12 3.5v12M7 10.5l5 5 5-5"/><path d="M4 16.5v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/>',
    upload: '<path d="M12 15.5v-12M7 8.5l5-5 5 5"/><path d="M4 16.5v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/>',
    share: '<path d="M12 3v12M7.5 7.5 12 3l4.5 4.5"/><path d="M8 11H6.5A2.5 2.5 0 0 0 4 13.5v5A2.5 2.5 0 0 0 6.5 21h11a2.5 2.5 0 0 0 2.5-2.5v-5a2.5 2.5 0 0 0-2.5-2.5H16"/>',
    wand: '<path d="m4 20 11.5-11.5M13 6l1.2-1.2a1.4 1.4 0 0 1 2 0l3 3a1.4 1.4 0 0 1 0 2L18 11"/><path d="M5 3v3M3.5 4.5h3M19 14v3M17.5 15.5h3M10 2.5v2M9 3.5h2"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.2 2"/>',
    alert: '<path d="M10.3 3.9 2.6 17.5A2 2 0 0 0 4.3 20.5h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9.5v4M12 17h.01"/>',
    check: '<path d="m4.5 12.5 5 5 10-11"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0"/>',
    sort: '<path d="M7 4v16M3.5 7.5 7 4l3.5 3.5M17 20V4M13.5 16.5 17 20l3.5-3.5"/>',
    file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
    moon: '<path d="M20.5 14.2A8.5 8.5 0 1 1 9.8 3.5a7 7 0 0 0 10.7 10.7Z"/>',
    pencil: '<path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01"/>',
    clipboard: '<rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9 4V3h6v1M9 10h6M9 14h4"/>',
    hint: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1 2V16h5.2v-.2c0-.8.4-1.5 1-2A6 6 0 0 0 12 3Z"/>',
  };
  const ic = (n, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n] || ''}</svg>`;
  const LOGO = `<svg viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8b6cff"/><stop offset="1" stop-color="#3f7dff"/></linearGradient></defs><rect width="64" height="64" rx="16" fill="url(#lg)"/><path d="M32 12.5 47 18v11.6c0 9.8-6.3 17.3-15 21-8.7-3.7-15-11.2-15-21V18Z" fill="rgba(255,255,255,.16)" stroke="#fff" stroke-width="2.6" stroke-linejoin="round"/><circle cx="32" cy="28.5" r="4.8" fill="#fff"/><path d="M29.9 31h4.2l1.3 9h-6.8Z" fill="#fff"/></svg>`;

  /* ---------------- Data ---------------- */
  const CATS = [
    { id: 'genel', name: 'Genel', color: '#8b6cff' },
    { id: 'sosyal', name: 'Sosyal Medya', color: '#ff4f86' },
    { id: 'eposta', name: 'E-posta', color: '#3f8cff' },
    { id: 'finans', name: 'Banka & Finans', color: '#22c06f' },
    { id: 'is', name: 'İş', color: '#f5a524' },
    { id: 'alisveris', name: 'Alışveriş', color: '#ff7440' },
    { id: 'eglence', name: 'Eğlence & Oyun', color: '#b55cff' },
    { id: 'cihaz', name: 'Wi-Fi & Cihaz', color: '#17b5cc' },
    { id: 'diger', name: 'Diğer', color: '#7c7c8e' },
  ];
  const catById = (id) => CATS.find((c) => c.id === id) || CATS[0];
  const CAT_RULES = [
    ['sosyal', /instagram|facebook|twitter|\bx\.com|tiktok|linkedin|snapchat|reddit|pinterest|threads|telegram|whatsapp|discord|tumblr|youtube|eksi/i],
    ['eposta', /gmail|outlook|hotmail|yandex|yahoo|icloud|proton|mail|e-?posta/i],
    ['finans', /bank|banka|garanti|akbank|i[sş]bank|ziraat|yap[ıi] ?kredi|enpara|qnb|deniz|halkbank|vak[ıi]f|kuveyt|papara|paypal|binance|btcturk|paribu|ininal|kart|kredi|borsa|midas|e-?devlet|vergi/i],
    ['alisveris', /trendyol|hepsiburada|amazon|n11|getir|yemeksepeti|sahibinden|aliexpress|ebay|migros|letgo|dolap|ciceksepeti|temu|shein|zara|lcw/i],
    ['eglence', /netflix|spotify|steam|epic|playstation|psn|xbox|nintendo|exxen|blutv|disney|twitch|riot|valorant|prime video|tabii|gain|tod|apple music|youtube premium|origin|ubisoft|battle\.?net/i],
    ['cihaz', /wi-?fi|wifi|modem|router|ağ|kablosuz|kamera|nas\b|tv\b/i],
    ['is', /slack|jira|teams|zoom|office|microsoft|notion|github|gitlab|asana|trello|vpn|şirket|sirket|kurumsal/i],
  ];
  const guessCategory = (title, url) => {
    const s = `${title || ''} ${url || ''}`;
    for (const [id, re] of CAT_RULES) if (re.test(s)) return id;
    return null;
  };

  const DEFAULT_SETTINGS = {
    autoLock: 5, lockOnHide: false, clipClear: 30, sort: 'az', lastBackup: 0,
    gen: { length: 20, upper: true, lower: true, digits: true, symbols: true, noAmbig: true },
  };

  const S = {
    record: null, key: null, vault: null,
    tab: 'vault', query: '', cat: 'all',
    current: null, totpTimer: null, totpCode: '', genPw: '',
    idleTimer: null, lastActive: Date.now(), clipTimer: null, clipDue: 0,
    sheetGuard: null, sheetOnClose: null,
  };

  /* ---------------- Utils ---------------- */
  const b64 = (buf) => {
    const b = new Uint8Array(buf); let s = '';
    for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000));
    return btoa(s);
  };
  const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  const uid = () => [...crypto.getRandomValues(new Uint8Array(12))].map((b) => b.toString(16).padStart(2, '0')).join('');
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const fmtDate = (t) => t ? new Date(t).toLocaleString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
  const relDays = (t) => {
    const d = Math.floor((Date.now() - t) / DAY);
    return d <= 0 ? 'bugün' : d === 1 ? 'dün' : `${d} gün önce`;
  };
  const withScheme = (u) => (/^[a-z][a-z0-9+.-]*:\/\//i.test(u) ? u : `https://${u}`);
  const hostOf = (u) => {
    if (!u) return '';
    try { return new URL(withScheme(u.trim())).hostname.replace(/^www\./, ''); } catch { return u; }
  };
  const safeUrl = (u) => {
    try { const x = new URL(withScheme(u.trim())); return /^https?:$/.test(x.protocol) ? x.href : ''; } catch { return ''; }
  };
  const getEntry = (id) => S.vault?.entries.find((e) => e.id === id);
  const firstChar = (t) => ([...(t || '').trim()][0] || '?').toLocaleUpperCase('tr');

  /* ---------------- Storage (IndexedDB) ---------------- */
  const DB = {
    db: null,
    open() {
      if (this.db) return Promise.resolve(this.db);
      return new Promise((res, rej) => {
        const r = indexedDB.open('kasa', 1);
        r.onupgradeneeded = () => r.result.createObjectStore('kv');
        r.onsuccess = () => { this.db = r.result; res(this.db); };
        r.onerror = () => rej(r.error);
      });
    },
    async get(k) {
      const db = await this.open();
      return new Promise((res, rej) => { const q = db.transaction('kv').objectStore('kv').get(k); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); });
    },
    async set(k, v) {
      const db = await this.open();
      return new Promise((res, rej) => { const tx = db.transaction('kv', 'readwrite'); tx.objectStore('kv').put(v, k); tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); tx.onabort = () => rej(tx.error); });
    },
    async del(k) {
      const db = await this.open();
      return new Promise((res, rej) => { const tx = db.transaction('kv', 'readwrite'); tx.objectStore('kv').delete(k); tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); });
    },
  };

  /* ---------------- Crypto ---------------- */
  async function deriveKey(pw, salt, iter) {
    const base = await crypto.subtle.importKey('raw', te.encode(pw), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: iter, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  }
  async function encryptStr(key, str) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, te.encode(str));
    return { iv: b64(iv), ct: b64(ct) };
  }
  async function decryptStr(key, iv, ct) {
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(iv) }, key, unb64(ct));
    return td.decode(pt);
  }
  async function verifyMaster(pw) {
    try {
      const k = await deriveKey(pw, unb64(S.record.salt), S.record.iter);
      await decryptStr(k, S.record.iv, S.record.ct);
      return true;
    } catch { return false; }
  }

  let saveChain = Promise.resolve();
  function persist() {
    const key = S.key;
    const json = JSON.stringify(S.vault);
    saveChain = saveChain.then(async () => {
      const { iv, ct } = await encryptStr(key, json);
      const rec = { ...S.record, iv, ct, updatedAt: Date.now() };
      await DB.set('vault', rec);
      S.record = rec;
    }).catch((e) => { console.error(e); toast('Kaydedilemedi: ' + (e?.message || e), 'err'); });
    return saveChain;
  }
  let settingsTimer;
  const saveSettingsSoon = () => { clearTimeout(settingsTimer); settingsTimer = setTimeout(() => S.key && persist(), 400); };

  /* ---------------- Password strength & generator ---------------- */
  const COMMON = ['password', 'parola', 'sifre', 'şifre', '123456', '12345', 'qwerty', 'asdf', 'abc123', 'admin', 'iloveyou', 'letmein', '111111', '000000', 'welcome', 'monkey', 'dragon', 'galatasaray', 'fenerbahce', 'fenerbahçe', 'besiktas', 'beşiktaş', 'trabzon', 'istanbul', 'ankara', 'izmir', 'turkiye', 'türkiye', 'seviyorum', 'askim', 'aşkım', 'qwe', 'zxc'];
  function strength(pw) {
    if (!pw) return { score: 0, bits: 0, label: '' };
    let pool = 0;
    if (/[a-zçğıöşü]/.test(pw)) pool += 26;
    if (/[A-ZÇĞİÖŞÜ]/.test(pw)) pool += 26;
    if (/\d/.test(pw)) pool += 10;
    if (/[^a-zA-Z0-9çğıöşüÇĞİÖŞÜ]/.test(pw)) pool += 33;
    let bits = [...pw].length * Math.log2(pool || 1);
    const low = pw.toLocaleLowerCase('tr');
    if (COMMON.some((w) => low.includes(w))) bits *= 0.5;
    if (/(.)\1{2,}/.test(pw)) bits -= 10;
    if (/(0123|1234|2345|3456|4567|5678|6789|9876|8765|7654|abcd|bcde|qwer|wert|asdf|zxcv)/i.test(pw)) bits -= 10;
    if (/^(19|20)\d{2}$/.test(pw.slice(-4)) && pw.length < 12) bits -= 6;
    const uniq = new Set(pw).size;
    if (uniq < pw.length / 2) bits *= 0.75;
    bits = Math.max(0, Math.round(bits));
    const score = bits < 28 ? 0 : bits < 40 ? 1 : bits < 60 ? 2 : bits < 80 ? 3 : 4;
    return { score, bits, label: ['Çok zayıf', 'Zayıf', 'Orta', 'Güçlü', 'Çok güçlü'][score] };
  }
  function crackTime(bits) {
    const s = Math.pow(2, bits) / 2 / 1e10; // saniyede 10 milyar tahmin
    if (s < 1) return 'anında';
    if (s < 60) return `${Math.round(s)} saniye`;
    if (s < 3600) return `${Math.round(s / 60)} dakika`;
    if (s < 86400) return `${Math.round(s / 3600)} saat`;
    if (s < 31536000) return `${Math.round(s / 86400)} gün`;
    if (s < 31536000 * 1000) return `${Math.round(s / 31536000)} yıl`;
    return 'yüzyıllar';
  }
  const SETS = { upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', lower: 'abcdefghijklmnopqrstuvwxyz', digits: '0123456789', symbols: '!@#$%^&*()-_=+[]{};:,.?/~' };
  const AMBIG = /[Il1O0o]/g;
  function randInt(n) {
    const lim = Math.floor(0x100000000 / n) * n; const a = new Uint32Array(1);
    do crypto.getRandomValues(a); while (a[0] >= lim);
    return a[0] % n;
  }
  function generate(o) {
    let sets = ['upper', 'lower', 'digits', 'symbols'].filter((k) => o[k]).map((k) => (o.noAmbig ? SETS[k].replace(AMBIG, '') : SETS[k]));
    if (!sets.length) sets = [SETS.lower];
    const all = sets.join('');
    const len = Math.max(o.length, sets.length);
    const out = sets.map((s) => s[randInt(s.length)]);
    while (out.length < len) out.push(all[randInt(all.length)]);
    for (let i = out.length - 1; i > 0; i--) { const j = randInt(i + 1); [out[i], out[j]] = [out[j], out[i]]; }
    return out.join('');
  }
  function updateMeter(id, pw) {
    const m = document.getElementById(id); if (!m) return;
    const st = strength(pw);
    m.className = `meter s${st.score}${pw ? '' : ' m-none'}` + (m.classList.contains('mini-meter') ? ' mini-meter' : '');
    const l = document.getElementById(id + '-l');
    if (l) { l.textContent = pw ? st.label : ''; l.className = `meter-label s${st.score}`; }
  }

  /* ---------------- TOTP (2FA) ---------------- */
  function base32Decode(str) {
    const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const s = str.toUpperCase().replace(/[\s=-]/g, '');
    let bits = 0, val = 0; const out = [];
    for (const c of s) {
      const i = A.indexOf(c);
      if (i < 0) throw new Error('Geçersiz karakter');
      val = (val << 5) | i; bits += 5;
      if (bits >= 8) { out.push((val >>> (bits - 8)) & 255); bits -= 8; }
    }
    return new Uint8Array(out);
  }
  function parseTotp(input) {
    const raw = (input || '').trim();
    let secret = raw, digits = 6, period = 30, algo = 'SHA-1';
    if (/^otpauth:/i.test(raw)) {
      const u = new URL(raw);
      secret = u.searchParams.get('secret') || '';
      digits = parseInt(u.searchParams.get('digits'), 10) || 6;
      period = parseInt(u.searchParams.get('period'), 10) || 30;
      const a = (u.searchParams.get('algorithm') || 'SHA1').toUpperCase().replace('-', '');
      algo = a === 'SHA256' ? 'SHA-256' : a === 'SHA512' ? 'SHA-512' : 'SHA-1';
    }
    const key = base32Decode(secret);
    if (key.length < 5) throw new Error('Anahtar çok kısa');
    if (digits < 6 || digits > 8) digits = 6;
    return { key, digits, period, algo };
  }
  async function totp(cfg, now = Date.now()) {
    const counter = Math.floor(now / 1000 / cfg.period);
    const buf = new ArrayBuffer(8); const dv = new DataView(buf);
    dv.setUint32(0, Math.floor(counter / 0x100000000)); dv.setUint32(4, counter >>> 0);
    const k = await crypto.subtle.importKey('raw', cfg.key, { name: 'HMAC', hash: cfg.algo }, false, ['sign']);
    const h = new Uint8Array(await crypto.subtle.sign('HMAC', k, buf));
    const o = h[h.length - 1] & 15;
    const bin = ((h[o] & 127) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3];
    return String(bin % Math.pow(10, cfg.digits)).padStart(cfg.digits, '0');
  }
  const totpUri = (e) => {
    if (!e.totp) return '';
    if (/^otpauth:/i.test(e.totp)) return e.totp;
    return `otpauth://totp/${encodeURIComponent(e.title)}?secret=${e.totp}`;
  };

  /* ---------------- UI helpers ---------------- */
  function toast(msg, type = 'ok', action) {
    const t = $('#toast');
    t.innerHTML = `<div class="toast-in ${type}">${ic(type === 'err' ? 'alert' : 'check')}<span>${esc(msg)}</span>${action ? `<button type="button">${esc(action.label)}</button>` : ''}</div>`;
    if (action) t.querySelector('button').addEventListener('click', () => { t.classList.remove('show'); action.fn(); }, { once: true });
    t.classList.add('show');
    clearTimeout(toast.t);
    toast.t = setTimeout(() => t.classList.remove('show'), action ? 4500 : 2300);
  }
  function busy(on, text = 'İşleniyor…') {
    let b = $('#busy');
    if (!on) { b?.remove(); return; }
    if (!b) { b = document.createElement('div'); b.id = 'busy'; document.body.appendChild(b); }
    b.innerHTML = `<div class="busy-card"><div class="spinner"></div><span>${esc(text)}</span></div>`;
  }
  function ask({ title, message = '', ok = 'Tamam', cancel = 'Vazgeç', danger = false, input = null }) {
    return new Promise((resolve) => {
      const d = document.createElement('div');
      d.className = 'dialog';
      d.innerHTML = `<div class="dialog-card" role="alertdialog" aria-modal="true">
        <h3>${esc(title)}</h3>${message ? `<p>${esc(message)}</p>` : ''}
        ${input ? `<input class="dlg-inp" type="${input.type || 'text'}" placeholder="${esc(input.placeholder || '')}" value="${esc(input.value || '')}" maxlength="${input.maxlength || 500}" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false">` : ''}
        <div class="dialog-actions ${cancel ? '' : 'one'}">${cancel ? `<button class="btn ghost" data-r="0">${esc(cancel)}</button>` : ''}<button class="btn ${danger ? 'danger' : 'primary'}" data-r="1">${esc(ok)}</button></div>
      </div>`;
      document.body.appendChild(d);
      requestAnimationFrame(() => d.classList.add('open'));
      const inp = d.querySelector('.dlg-inp');
      if (inp) setTimeout(() => inp.focus(), 60);
      const done = (v) => { d.classList.remove('open'); setTimeout(() => d.remove(), 220); resolve(v); };
      d.addEventListener('click', (e) => {
        const b = e.target.closest('[data-r]'); if (!b) return;
        if (b.dataset.r === '1') done(input ? inp.value : true); else done(input ? null : false);
      });
      inp?.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); done(inp.value); } });
    });
  }
  function openSheet(html, opts = {}) {
    const root = $('#sheet-root');
    const live = root.querySelector('.sheet:not(.closing)');
    if (live) {
      const fn = S.sheetOnClose; S.sheetOnClose = null; fn?.();
      live.querySelector('.sheet-panel').innerHTML = html;
    } else {
      const s = document.createElement('div');
      s.className = 'sheet';
      s.innerHTML = `<div class="sheet-backdrop" data-act="close"></div><div class="sheet-panel" role="dialog" aria-modal="true">${html}</div>`;
      root.appendChild(s);
      requestAnimationFrame(() => requestAnimationFrame(() => s.classList.add('open')));
    }
    S.sheetOnClose = opts.onClose || null;
    S.sheetGuard = opts.guard || null;
  }
  async function closeSheet(force = false) {
    if (!force && S.sheetGuard && !(await S.sheetGuard())) return false;
    const s = $('#sheet-root .sheet:not(.closing)');
    const fn = S.sheetOnClose; S.sheetOnClose = null; S.sheetGuard = null; fn?.();
    if (s) { s.classList.add('closing'); s.classList.remove('open'); setTimeout(() => s.remove(), 340); }
    return true;
  }
  function legacyCopy(t) {
    const ta = document.createElement('textarea');
    ta.value = t; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;top:-1000px;opacity:0';
    document.body.appendChild(ta); ta.select(); ta.setSelectionRange(0, t.length);
    let ok = false; try { ok = document.execCommand('copy'); } catch { /* */ }
    ta.remove(); return ok;
  }
  async function copy(text, label = 'Kopyalandı') {
    if (!text) return;
    let ok = true;
    try { await navigator.clipboard.writeText(text); } catch { ok = legacyCopy(text); }
    if (!ok) { toast('Kopyalanamadı', 'err'); return; }
    toast(label);
    clearTimeout(S.clipTimer); S.clipDue = 0;
    const sec = S.vault?.settings.clipClear || 0;
    if (sec) {
      S.clipTimer = setTimeout(async () => {
        try { await navigator.clipboard.writeText(''); } catch { S.clipDue = Date.now(); }
      }, sec * 1000);
    }
  }
  async function saveFile(name, text, mime) {
    const blob = new Blob([text], { type: mime });
    try {
      const file = new File([blob], name, { type: mime });
      if (isIOS && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: name });
        return true;
      }
    } catch (e) { if (e?.name === 'AbortError') return false; }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
    return true;
  }
  function applyTheme(t) {
    try { localStorage.setItem('kasa-theme', t); } catch { /* */ }
    const dark = t === 'dark' || (t === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    const m = $('meta[name=theme-color]'); if (m) m.content = dark ? '#0a0a0f' : '#f2f2f7';
  }
  const getTheme = () => { try { return localStorage.getItem('kasa-theme') || 'dark'; } catch { return 'dark'; } };
  const avatar = (e, big) => `<div class="avatar${big ? ' big' : ''}" style="--c:${catById(e.category).color}">${esc(firstChar(e.title))}</div>`;
  const installBanner = () => {
    if (!isIOS || isStandalone()) return '';
    return `<div class="callout info install">${ic('info')}<div><b>Önce uygulama olarak kurun</b><br>Safari'de alttaki <b>Paylaş</b> ${ic('share', 'inline-ic')} düğmesine dokunun ve <b>Ana Ekrana Ekle</b>'yi seçin. Sonra Kasa'yı ana ekrandaki simgeden açın. (Safari'de oluşturulan kasa, ana ekran uygulamasında görünmez.)</div></div>`;
  };

  /* ---------------- Failed attempts ---------------- */
  const getFails = () => { try { return JSON.parse(localStorage.getItem('kasa-fail')) || { n: 0, t: 0 }; } catch { return { n: 0, t: 0 }; } };
  const setFails = (f) => { try { localStorage.setItem('kasa-fail', JSON.stringify(f)); } catch { /* */ } };
  const lockoutRemaining = () => {
    const f = getFails(); if (f.n < 5) return 0;
    const wait = Math.min(30000 * Math.pow(2, f.n - 5), 15 * 60000);
    return Math.max(0, f.t + wait - Date.now());
  };

  /* ---------------- Screens: setup / lock ---------------- */
  function renderSetup() {
    app.innerHTML = `
    <div class="auth"><div class="auth-inner">
      ${installBanner()}
      <div class="auth-head">
        <div class="logo">${LOGO}</div>
        <h1>Kasa'ya hoş geldiniz</h1>
        <p>Tüm şifreleriniz tek bir ana şifreyle korunur. Veriler yalnızca bu cihazda, AES-256 ile şifrelenmiş olarak saklanır.</p>
      </div>
      <form id="setup-form" class="auth-form" autocomplete="off" novalidate>
        <label class="inp"><span>Ana şifre</span>
          <div class="inp-box"><input id="s-pw" type="password" data-meter="s-meter" autocomplete="new-password" placeholder="En az 8 karakter" autocapitalize="off" autocorrect="off" spellcheck="false">
          <button type="button" class="icon-btn" data-toggle="s-pw" aria-label="Göster">${ic('eye')}</button></div>
        </label>
        <div class="meter-row"><div class="meter m-none" id="s-meter"><i></i></div><span class="meter-label" id="s-meter-l"></span></div>
        <label class="inp"><span>Ana şifre (tekrar)</span><input id="s-pw2" type="password" autocomplete="new-password" placeholder="Şifreyi tekrar girin" autocapitalize="off" autocorrect="off" spellcheck="false"></label>
        <label class="inp"><span>İpucu (isteğe bağlı)</span><input id="s-hint" type="text" maxlength="80" placeholder="Şifrenin kendisini yazmayın"></label>
        <div class="callout">${ic('alert')}<div><b>Önemli:</b> Ana şifrenizi unutursanız verilerinizi kurtarmanın hiçbir yolu yoktur. Güçlü ama hatırlayabileceğiniz bir şifre seçin.</div></div>
        <button class="btn primary big" type="submit" id="s-btn">Kasayı oluştur</button>
      </form>
      <div class="auth-links"><button class="link muted" data-act="restore">${ic('upload', 'inline-ic')} Yedekten geri yükle</button></div>
    </div></div>`;
  }
  async function doSetup() {
    const pw = $('#s-pw').value, pw2 = $('#s-pw2').value, hint = $('#s-hint').value.trim();
    if (pw.length < 8) return toast('Ana şifre en az 8 karakter olmalı', 'err');
    if (pw !== pw2) return toast('Şifreler eşleşmiyor', 'err');
    if (hint && hint.toLocaleLowerCase('tr').includes(pw.toLocaleLowerCase('tr'))) return toast('İpucu şifrenin kendisini içeremez', 'err');
    if (strength(pw).score < 2) {
      const go = await ask({ title: 'Zayıf ana şifre', message: 'Bu şifre kolay tahmin edilebilir. Daha uzun bir şifre veya birkaç kelimeden oluşan bir cümle öneririz.', ok: 'Yine de devam', cancel: 'Değiştir', danger: true });
      if (!go) return;
    }
    const btn = $('#s-btn'); btn.disabled = true; btn.innerHTML = '<span class="spinner sm"></span> Oluşturuluyor…';
    try {
      const salt = crypto.getRandomValues(new Uint8Array(16));
      S.key = await deriveKey(pw, salt, ITER);
      S.vault = { entries: [], settings: clone(DEFAULT_SETTINGS), createdAt: Date.now() };
      S.record = { app: 'kasa', v: 1, kdf: 'PBKDF2-SHA256', iter: ITER, salt: b64(salt), hint, iv: '', ct: '', createdAt: Date.now() };
      await persist();
      setFails({ n: 0, t: 0 });
      navigator.storage?.persist?.().catch(() => {});
      S.tab = 'vault';
      enterApp();
      toast('Kasanız hazır');
    } catch (e) {
      btn.disabled = false; btn.textContent = 'Kasayı oluştur';
      toast('Oluşturulamadı: ' + e.message, 'err');
    }
  }
  function renderLock() {
    const hint = S.record?.hint;
    app.innerHTML = `
    <div class="auth"><div class="auth-inner" id="lock-card">
      <div class="auth-head">
        <div class="logo">${LOGO}</div>
        <h1>Kasa kilitli</h1>
        <p>Devam etmek için ana şifrenizi girin.</p>
      </div>
      <form id="unlock-form" class="auth-form" autocomplete="off" novalidate>
        <div class="inp-box big"><input id="u-pw" type="password" autocomplete="current-password" placeholder="Ana şifre" autocapitalize="off" autocorrect="off" spellcheck="false" aria-label="Ana şifre">
          <button type="button" class="icon-btn" data-toggle="u-pw" aria-label="Göster">${ic('eye')}</button></div>
        <button class="btn primary big" type="submit" id="u-btn">Kilidi aç</button>
        <div class="err-msg" id="u-err"></div>
      </form>
      <div class="auth-links">
        ${hint ? `<button class="link" data-act="show-hint">${ic('hint', 'inline-ic')} İpucunu göster</button>` : ''}
        <button class="link muted" data-act="forgot">Ana şifremi unuttum</button>
      </div>
    </div></div>`;
    if (!isIOS) setTimeout(() => $('#u-pw')?.focus(), 50);
  }
  async function doUnlock() {
    const inp = $('#u-pw'), err = $('#u-err'), btn = $('#u-btn');
    const rem = lockoutRemaining();
    if (rem > 0) { err.textContent = `Çok fazla hatalı deneme. ${Math.ceil(rem / 1000)} sn sonra tekrar deneyin.`; return; }
    const pw = inp.value;
    if (!pw) { inp.focus(); return; }
    btn.disabled = true; btn.innerHTML = '<span class="spinner sm"></span> Açılıyor…'; err.textContent = '';
    try {
      const key = await deriveKey(pw, unb64(S.record.salt), S.record.iter);
      const vault = JSON.parse(await decryptStr(key, S.record.iv, S.record.ct));
      setFails({ n: 0, t: 0 });
      vault.entries = Array.isArray(vault.entries) ? vault.entries : [];
      vault.settings = { ...clone(DEFAULT_SETTINGS), ...(vault.settings || {}) };
      vault.settings.gen = { ...DEFAULT_SETTINGS.gen, ...(vault.settings.gen || {}) };
      S.key = key; S.vault = vault; S.tab = 'vault'; S.cat = 'all'; S.query = '';
      enterApp();
    } catch {
      const f = getFails(); f.n++; f.t = Date.now(); setFails(f);
      btn.disabled = false; btn.textContent = 'Kilidi aç';
      inp.value = ''; if (!isIOS) inp.focus();
      const card = $('#lock-card'); card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake');
      const r = lockoutRemaining();
      err.textContent = r > 0 ? `Hatalı şifre. Güvenlik için ${Math.ceil(r / 1000)} sn beklemelisiniz.` : `Hatalı ana şifre${f.n >= 3 ? ` (${f.n}. deneme)` : ''}`;
    }
  }
  function lock() {
    S.key = null; S.vault = null; S.genPw = ''; S.totpCode = ''; S.current = null; S.query = '';
    clearInterval(S.idleTimer); clearInterval(S.totpTimer);
    $('#sheet-root').innerHTML = ''; $$('.dialog').forEach((d) => d.remove()); busy(false);
    S.sheetGuard = null; S.sheetOnClose = null;
    $('#toast').classList.remove('show');
    renderLock();
  }
  function enterApp() {
    renderMain();
    S.lastActive = Date.now();
    clearInterval(S.idleTimer);
    S.idleTimer = setInterval(checkIdle, 3000);
  }
  function checkIdle() {
    if (!S.key) return;
    const m = S.vault.settings.autoLock;
    if (m > 0 && Date.now() - S.lastActive > m * 60000) lock();
  }

  /* ---------------- Main ---------------- */
  function renderMain() {
    const tb = (id, icon, label) => `<button data-tab="${id}" class="${S.tab === id ? 'active' : ''}" aria-label="${label}">${ic(icon)}<span>${label}</span></button>`;
    app.innerHTML = `
    <div class="main">
      <main class="content" id="content"></main>
      <nav class="tabbar">${tb('vault', 'key', 'Kasa')}${tb('gen', 'wand', 'Üretici')}${tb('sec', 'shieldCheck', 'Güvenlik')}${tb('set', 'settings', 'Ayarlar')}</nav>
    </div>`;
    renderTab();
  }
  function renderTab() {
    const c = $('#content'); if (!c) return;
    $$('.tabbar button').forEach((b) => b.classList.toggle('active', b.dataset.tab === S.tab));
    ({ vault: renderVault, gen: renderGen, sec: renderSec, set: renderSet })[S.tab](c);
  }
  function refreshBehind() {
    if (!S.vault) return;
    if (S.tab === 'vault' && $('#q') && S.vault.entries.length) { renderChips(); renderList(); $('#vault-count').textContent = `${S.vault.entries.length} kayıt`; }
    else { const c = $('#content'); const y = c?.scrollTop; renderTab(); if (c) c.scrollTop = y; }
  }

  /* ----- Vault tab ----- */
  function renderVault(c) {
    const n = S.vault.entries.length;
    c.innerHTML = `
      <header class="large-head"><div><h1>Kasa</h1><p class="sub" id="vault-count">${n} kayıt</p></div>
        <button class="icon-btn round" data-act="lock" aria-label="Kilitle">${ic('lock')}</button></header>
      ${n ? `<div class="search-wrap"><div class="search">${ic('search')}
        <input id="q" type="search" placeholder="Başlık, kullanıcı adı veya site ara" value="${esc(S.query)}" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" enterkeyhint="search">
        <button class="icon-btn sm" data-act="sort" aria-label="Sırala">${ic('sort')}</button></div></div>
      <div class="chips" id="chips"></div>` : ''}
      <div id="list"></div>
      <button class="fab" data-act="add" aria-label="Yeni kayıt">${ic('plus')}</button>`;
    if (n) renderChips();
    renderList();
  }
  function renderChips() {
    const el = $('#chips'); if (!el) return;
    const es = S.vault.entries;
    const favN = es.filter((e) => e.favorite).length;
    const present = CATS.filter((c) => es.some((e) => e.category === c.id));
    if (S.cat === 'fav' && !favN) S.cat = 'all';
    if (!['all', 'fav'].includes(S.cat) && !present.some((c) => c.id === S.cat)) S.cat = 'all';
    const chip = (id, label, n, color) => `<button class="chip ${S.cat === id ? 'on' : ''}" data-act="cat" data-cat="${id}">${color ? `<i style="background:${color}"></i>` : ''}${esc(label)}<span>${n}</span></button>`;
    el.innerHTML = chip('all', 'Tümü', es.length) + (favN ? chip('fav', '★ Favoriler', favN) : '') + present.map((c) => chip(c.id, c.name, es.filter((e) => e.category === c.id).length, c.color)).join('');
  }
  function filtered() {
    const q = S.query.trim().toLocaleLowerCase('tr');
    const list = S.vault.entries.filter((e) => {
      if (S.cat === 'fav' && !e.favorite) return false;
      if (!['all', 'fav'].includes(S.cat) && e.category !== S.cat) return false;
      if (!q) return true;
      return [e.title, e.username, e.url, e.notes].some((v) => (v || '').toLocaleLowerCase('tr').includes(q));
    });
    if (S.vault.settings.sort === 'recent') list.sort((a, b) => b.updatedAt - a.updatedAt);
    else list.sort((a, b) => a.title.localeCompare(b.title, 'tr', { sensitivity: 'base' }));
    return list;
  }
  const row = (e) => `<div class="row" data-open="${e.id}" role="button" tabindex="0">
      ${avatar(e)}
      <div class="row-main"><div class="row-title"><span>${esc(e.title)}</span>${e.favorite ? ic('star', 'fav') : ''}</div>
      <div class="row-sub">${esc(e.username || hostOf(e.url) || catById(e.category).name)}</div></div>
      ${e.totp ? '<span class="badge">2FA</span>' : ''}
      <button class="icon-btn" data-copy-pw="${e.id}" aria-label="Şifreyi kopyala">${ic('copy')}</button>
    </div>`;
  function renderList() {
    const L = $('#list'); if (!L) return;
    if (!S.vault.entries.length) {
      L.innerHTML = `<div class="empty"><div class="empty-ic">${ic('shieldCheck')}</div><h3>Kasanız boş</h3>
        <p>İlk şifrenizi ekleyin. Tüm kayıtlar bu cihazda şifrelenmiş olarak saklanır.</p>
        <button class="btn primary" data-act="add">${ic('plus')} İlk kaydı ekle</button>
        <button class="btn ghost" data-act="import-csv">${ic('upload')} Başka uygulamadan aktar (CSV)</button></div>`;
      return;
    }
    const list = filtered();
    if (!list.length) {
      L.innerHTML = `<div class="empty small">${ic('search')}<p>${S.query ? `“${esc(S.query)}” için sonuç bulunamadı` : 'Bu filtrede kayıt yok'}</p></div>`;
      return;
    }
    if (S.vault.settings.sort === 'az' && !S.query) {
      const groups = new Map();
      for (const e of list) {
        let k = firstChar(e.title); if (!/\p{L}/u.test(k)) k = '#';
        if (!groups.has(k)) groups.set(k, []);
        groups.get(k).push(e);
      }
      L.innerHTML = [...groups].map(([k, es]) => `<div class="section-letter">${esc(k)}</div><div class="group">${es.map(row).join('')}</div>`).join('');
    } else {
      L.innerHTML = `<div class="section-letter">${S.query ? `${list.length} sonuç` : 'Son değiştirilenler'}</div><div class="group">${list.map(row).join('')}</div>`;
    }
  }

  /* ----- Detail ----- */
  function openDetail(id) {
    const e = getEntry(id); if (!e) return;
    S.current = id;
    const st = strength(e.password);
    const url = safeUrl(e.url || '');
    const cat = catById(e.category);
    openSheet(`
      <div class="sheet-bar"><button class="txt-btn" data-act="close">Kapat</button><div class="sheet-title"></div>
        <button class="txt-btn strong" data-act="edit" data-id="${e.id}">Düzenle</button></div>
      <div class="sheet-body">
        <div class="hero">${avatar(e, true)}<h2>${esc(e.title)}</h2>
          <span class="cat-pill" style="--c:${cat.color}">${esc(cat.name)}</span><br>
          <button class="fav-btn ${e.favorite ? 'on' : ''}" data-act="fav" id="fav-btn">${ic('star')}<span>${e.favorite ? 'Favorilerde' : 'Favorilere ekle'}</span></button>
        </div>
        <div class="group detail-groups">
          ${e.username ? `<div class="field"><div class="f-main"><div class="f-label">Kullanıcı adı</div><div class="val sel">${esc(e.username)}</div></div>
            <button class="icon-btn" data-copy-field="username" aria-label="Kopyala">${ic('copy')}</button></div>` : ''}
          ${e.password ? `<div class="field"><div class="f-main"><div class="f-label">Şifre</div><div class="val mono" id="pw-val">${'•'.repeat(Math.min([...e.password].length, 14))}</div>
              <div class="meter mini-meter s${st.score}"><i></i></div></div>
            <button class="icon-btn" data-act="reveal" id="reveal-btn" aria-label="Göster">${ic('eye')}</button>
            <button class="icon-btn" data-copy-field="password" aria-label="Kopyala">${ic('copy')}</button></div>` : ''}
          ${e.totp ? `<div class="field"><div class="f-main"><div class="f-label">Doğrulama kodu (2FA)</div><div class="val mono totp" id="totp-val">··· ···</div></div>
            <div class="ring" id="totp-ring"><svg viewBox="0 0 36 36"><circle cx="18" cy="18" r="15"/><circle class="p" cx="18" cy="18" r="15"/></svg><span id="totp-sec"></span></div>
            <button class="icon-btn" data-copy-field="totp" aria-label="Kopyala">${ic('copy')}</button></div>` : ''}
          ${e.url ? `<div class="field"><div class="f-main"><div class="f-label">Web sitesi</div><div class="val sel">${esc(hostOf(e.url))}</div></div>
            ${url ? `<a class="icon-btn" href="${esc(url)}" target="_blank" rel="noopener noreferrer" aria-label="Siteyi aç">${ic('external')}</a>` : ''}
            <button class="icon-btn" data-copy-field="url" aria-label="Kopyala">${ic('copy')}</button></div>` : ''}
          ${!e.username && !e.password && !e.url && !e.totp ? '<div class="notes muted">Bu kayıtta giriş bilgisi yok.</div>' : ''}
        </div>
        ${e.notes ? `<div class="group-label">Notlar</div><div class="group"><div class="notes">${esc(e.notes)}</div></div>` : ''}
        ${e.history?.length ? `<div class="group-label">Geçmiş</div><details class="group hist"><summary>Önceki şifreler (${e.history.length})${ic('chevRight')}</summary>
          ${e.history.map((h, i) => `<div class="field"><div class="f-main"><div class="val mono">${'•'.repeat(10)}</div><div class="f-label" style="margin:3px 0 0">${esc(fmtDate(h.changedAt))} tarihine kadar</div></div>
            <button class="icon-btn" data-copy-hist="${i}" aria-label="Kopyala">${ic('copy')}</button></div>`).join('')}</details>` : ''}
        <div class="meta">Oluşturuldu: ${esc(fmtDate(e.createdAt))}<br>Son düzenleme: ${esc(fmtDate(e.updatedAt))}${e.pwChangedAt ? `<br>Şifre son değişiklik: ${esc(relDays(e.pwChangedAt))}` : ''}</div>
        <button class="danger-ghost" data-act="delete" data-id="${e.id}">${ic('trash')} Kaydı sil</button>
      </div>`, { onClose: () => { clearInterval(S.totpTimer); S.totpCode = ''; S.current = null; } });
    startTotp(e);
  }
  function startTotp(e) {
    clearInterval(S.totpTimer);
    if (!e.totp) return;
    let cfg;
    try { cfg = parseTotp(e.totp); } catch { const v = $('#totp-val'); if (v) { v.textContent = 'Geçersiz anahtar'; v.style.fontSize = '16px'; } return; }
    const tick = async () => {
      const el = $('#totp-val'); if (!el) { clearInterval(S.totpTimer); return; }
      const now = Date.now();
      const code = await totp(cfg, now);
      S.totpCode = code;
      const h = Math.ceil(code.length / 2);
      el.textContent = `${code.slice(0, h)} ${code.slice(h)}`;
      const rem = cfg.period - (Math.floor(now / 1000) % cfg.period);
      $('#totp-sec').textContent = rem;
      $('#totp-ring .p').style.strokeDashoffset = String(94.25 * (1 - rem / cfg.period));
      $('#totp-ring').classList.toggle('low', rem <= 5);
    };
    tick();
    S.totpTimer = setInterval(tick, 1000);
  }

  /* ----- Edit ----- */
  const formSnap = (f) => JSON.stringify([...new FormData(f)]) + f.elements.favorite.checked;
  function openEdit(id) {
    const e = id ? getEntry(id) : null;
    const defCat = !['all', 'fav'].includes(S.cat) ? S.cat : 'genel';
    const d = e || { title: '', username: '', password: '', url: '', notes: '', totp: '', category: defCat, favorite: S.cat === 'fav' };
    openSheet(`
      <div class="sheet-bar"><button class="txt-btn" data-act="${e ? 'back-detail' : 'close'}" data-id="${e ? e.id : ''}">Vazgeç</button>
        <div class="sheet-title">${e ? 'Kaydı düzenle' : 'Yeni kayıt'}</div>
        <button class="txt-btn strong" data-act="save">Kaydet</button></div>
      <form class="sheet-body" id="edit-form" data-id="${e ? e.id : ''}" ${e ? 'data-cat-touched="1"' : ''} autocomplete="off" novalidate>
        <div class="group-label" style="padding-top:6px">Giriş bilgileri</div>
        <div class="group">
          <label class="frow"><span>Başlık</span><input name="title" value="${esc(d.title)}" placeholder="ör. Instagram" maxlength="120" autocomplete="off"></label>
          <label class="frow"><span>Kullanıcı adı</span><input name="username" value="${esc(d.username)}" placeholder="E-posta veya kullanıcı adı" autocapitalize="off" autocorrect="off" spellcheck="false" autocomplete="off" inputmode="email"></label>
          <div class="frow"><span>Şifre</span><div class="inp-row">
            <input name="password" id="e-pw" type="password" value="${esc(d.password)}" class="mono" data-meter="e-meter" placeholder="Şifre" autocomplete="new-password" autocapitalize="off" autocorrect="off" spellcheck="false">
            <button type="button" class="icon-btn" data-toggle="e-pw" aria-label="Göster">${ic('eye')}</button>
            <button type="button" class="icon-btn accent" data-act="gen-into" aria-label="Güçlü şifre üret">${ic('wand')}</button></div></div>
          <div class="frow-meter"><div class="meter-row"><div class="meter ${d.password ? 's' + strength(d.password).score : 'm-none'}" id="e-meter"><i></i></div><span class="meter-label s${strength(d.password).score}" id="e-meter-l">${esc(strength(d.password).label)}</span></div></div>
          <label class="frow"><span>Web sitesi</span><input name="url" value="${esc(d.url)}" placeholder="ör. instagram.com" inputmode="url" autocapitalize="off" autocorrect="off" spellcheck="false"></label>
          <label class="frow"><span>Kategori</span><select name="category">${CATS.map((c) => `<option value="${c.id}" ${c.id === d.category ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select>${ic('chevDown', 'chev')}</label>
        </div>
        <div class="group-label">İki adımlı doğrulama (isteğe bağlı)</div>
        <div class="group"><label class="frow"><span>2FA anahtarı</span><input name="totp" value="${esc(d.totp)}" placeholder="Kurulum anahtarı veya otpauth://" autocapitalize="characters" autocorrect="off" spellcheck="false"></label></div>
        <p class="hint">Bir sitede iki adımlı doğrulamayı açarken gösterilen “kurulum anahtarını” buraya girerseniz Kasa 6 haneli kodları sizin için üretir.</p>
        <div class="group-label">Notlar</div>
        <div class="group"><textarea name="notes" rows="4" placeholder="Güvenlik soruları, PIN kodu, ek bilgiler…">${esc(d.notes)}</textarea></div>
        <div class="group" style="margin-top:20px"><label class="trow"><span>Favorilere ekle</span><input type="checkbox" name="favorite" class="switch" ${d.favorite ? 'checked' : ''}></label></div>
      </form>`, {
      guard: async () => {
        const f = $('#edit-form');
        if (!f || formSnap(f) === f.dataset.snap) return true;
        return ask({ title: 'Değişiklikler kaydedilmedi', message: 'Yaptığınız değişiklikler kaybolacak.', ok: 'Kaydetmeden çık', cancel: 'Düzenlemeye dön', danger: true });
      },
    });
    const f = $('#edit-form');
    f.dataset.snap = formSnap(f);
    if (!e && !isIOS) setTimeout(() => f.elements.title.focus(), 350);
  }
  async function saveEdit() {
    const f = $('#edit-form'); if (!f) return;
    const id = f.dataset.id;
    const el = f.elements;
    const data = {
      title: el.title.value.trim(),
      username: el.username.value.trim(),
      password: el.password.value,
      url: el.url.value.trim(),
      totp: el.totp.value.trim(),
      notes: el.notes.value.replace(/\s+$/, ''),
      category: el.category.value,
      favorite: el.favorite.checked,
    };
    if (!data.title) data.title = hostOf(data.url) || data.username;
    if (!data.title) { toast('Lütfen bir başlık girin', 'err'); el.title.focus(); return; }
    if (data.totp) {
      if (!/^otpauth:/i.test(data.totp)) data.totp = data.totp.replace(/[\s-]/g, '').toUpperCase();
      try { parseTotp(data.totp); } catch { toast('2FA anahtarı geçersiz', 'err'); el.totp.focus(); return; }
    }
    const now = Date.now();
    let e;
    if (id) {
      e = getEntry(id); if (!e) return;
      if (e.password !== data.password) {
        if (e.password) e.history = [{ password: e.password, changedAt: now }, ...(e.history || [])].slice(0, 10);
        e.pwChangedAt = now;
      }
      Object.assign(e, data, { updatedAt: now });
    } else {
      e = { id: uid(), ...data, createdAt: now, updatedAt: now, pwChangedAt: now, history: [] };
      S.vault.entries.push(e);
    }
    await persist();
    S.sheetGuard = null;
    toast(id ? 'Değişiklikler kaydedildi' : 'Kayıt eklendi');
    refreshBehind();
    openDetail(e.id);
  }
  async function deleteEntry(id) {
    const e = getEntry(id); if (!e) return;
    const ok = await ask({ title: 'Kayıt silinsin mi?', message: `“${e.title}” kaydı silinecek.`, ok: 'Sil', danger: true });
    if (!ok) return;
    const idx = S.vault.entries.indexOf(e);
    S.vault.entries.splice(idx, 1);
    await persist();
    await closeSheet(true);
    refreshBehind();
    toast('Kayıt silindi', 'ok', {
      label: 'Geri al',
      fn: async () => { if (!S.vault) return; S.vault.entries.splice(idx, 0, e); await persist(); refreshBehind(); toast('Kayıt geri alındı'); },
    });
  }

  /* ----- Generator tab ----- */
  const colorize = (pw) => [...pw].map((ch) => (/\d/.test(ch) ? `<span class="d">${esc(ch)}</span>` : /[a-zA-Z]/.test(ch) ? esc(ch) : `<span class="s">${esc(ch)}</span>`)).join('');
  function renderGen(c) {
    const g = S.vault.settings.gen;
    const tr = (k, label) => `<label class="trow"><span>${label}</span><input type="checkbox" class="switch" data-gen="${k}" ${g[k] ? 'checked' : ''}></label>`;
    c.innerHTML = `
      <header class="large-head"><div><h1>Üretici</h1><p class="sub">Kırılması zor, rastgele şifreler</p></div></header>
      <div class="gen-card">
        <div class="gen-out mono" id="g-out"></div>
        <div class="meter-row"><div class="meter" id="g-meter"><i></i></div><span class="meter-label" id="g-meter-l"></span></div>
        <div class="gen-info"><span id="g-bits"></span><span id="g-crack"></span></div>
        <div class="gen-actions"><button class="btn ghost" data-act="g-regen">${ic('refresh')} Yenile</button><button class="btn primary" data-act="g-copy">${ic('copy')} Kopyala</button></div>
      </div>
      <div class="group-label">Uzunluk</div>
      <div class="group pad"><div class="slider-row"><input type="range" id="g-len" min="8" max="64" step="1" value="${g.length}" aria-label="Uzunluk"><span class="len-val mono" id="g-lenv">${g.length}</span></div></div>
      <div class="group-label">Karakterler</div>
      <div class="group">${tr('upper', 'Büyük harfler (A–Z)')}${tr('lower', 'Küçük harfler (a–z)')}${tr('digits', 'Rakamlar (0–9)')}${tr('symbols', 'Semboller (!@#$…)')}</div>
      <div class="group" style="margin-top:12px">${tr('noAmbig', 'Benzer karakterleri çıkar (l, 1, O, 0)')}</div>
      <p class="hint">Şifreler cihazınızda, kriptografik olarak güvenli rastgele sayı üreteciyle oluşturulur.</p>`;
    regen();
  }
  function regen() {
    if (!S.vault) return;
    S.genPw = generate(S.vault.settings.gen);
    const out = $('#g-out'); if (!out) return;
    out.innerHTML = colorize(S.genPw);
    const st = strength(S.genPw);
    updateMeter('g-meter', S.genPw);
    $('#g-bits').textContent = `~${st.bits} bit entropi`;
    $('#g-crack').textContent = `Kırılma süresi: ${crackTime(st.bits)}`;
  }

  /* ----- Security tab ----- */
  function analyze() {
    const es = S.vault.entries.filter((e) => e.password);
    const counts = new Map();
    es.forEach((e) => counts.set(e.password, (counts.get(e.password) || 0) + 1));
    const weak = es.filter((e) => strength(e.password).score <= 1);
    const reused = es.filter((e) => counts.get(e.password) > 1);
    const old = es.filter((e) => Date.now() - (e.pwChangedAt || e.createdAt) > 365 * DAY);
    const bad = new Set([...weak, ...reused, ...old].map((e) => e.id));
    const score = es.length ? Math.round((100 * (es.length - bad.size)) / es.length) : 0;
    const with2fa = S.vault.entries.filter((e) => e.totp).length;
    return { total: es.length, weak, reused, old, bad: bad.size, score, with2fa };
  }
  function renderSec(c) {
    const a = analyze();
    const circ = 2 * Math.PI * 42;
    const color = a.score >= 80 ? 'var(--ok)' : a.score >= 50 ? 'var(--warn)' : 'var(--danger)';
    const title = !a.total ? 'Henüz şifre yok' : a.score >= 80 ? 'Harika durumdasınız' : a.score >= 50 ? 'İyileştirilebilir' : 'Dikkat gerekiyor';
    const lb = S.vault.settings.lastBackup;
    const backupBad = !lb || Date.now() - lb > 30 * DAY;
    const issue = (t, d, list, col, icon) => `<details class="issue" ${list.length ? '' : 'data-empty'}>
        <summary class="srow"><span class="s-ic" style="--c:${col}">${ic(icon)}</span><span class="s-t">${t}<small>${d}</small></span>
        <span class="count ${list.length ? 'bad' : 'good'}">${list.length || ic('check')}</span></summary>
        ${list.length ? `<div class="issue-list">${list.map(row).join('')}</div>` : ''}</details>`;
    c.innerHTML = `
      <header class="large-head"><div><h1>Güvenlik</h1><p class="sub">Şifre sağlığı raporu</p></div></header>
      <div class="score-card">
        <div class="score-ring"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" class="bg"/>
          <circle cx="50" cy="50" r="42" class="fg" style="stroke:${color};stroke-dasharray:${circ};stroke-dashoffset:${circ * (1 - (a.total ? a.score : 0) / 100)}"/></svg>
          <div><b>${a.total ? a.score : '–'}</b><small>${a.total ? '/100' : ''}</small></div></div>
        <div><div class="score-title">${title}</div><p class="muted">${a.total ? `${a.total} şifre incelendi, ${a.bad ? `${a.bad} kayıtta iyileştirme önerisi var.` : 'sorun bulunmadı.'}` : 'Kayıt ekledikçe şifrelerinizin sağlığı burada görünecek.'}</p></div>
      </div>
      <div class="group">
        ${issue('Zayıf şifreler', 'Kolay tahmin edilebilir', a.weak, '#ff5a6a', 'alert')}
        ${issue('Tekrar kullanılanlar', 'Birden fazla hesapta aynı şifre', a.reused, '#f5a524', 'refresh')}
        ${issue('Eski şifreler', '1 yıldan uzun süredir değişmedi', a.old, '#3f8cff', 'clock')}
      </div>
      <div class="group-label">Ek koruma</div>
      <div class="group">
        <div class="srow"><span class="s-ic" style="--c:#8b6cff">${ic('shieldCheck')}</span><span class="s-t">İki adımlı doğrulama<small>${a.with2fa} kayıtta 2FA kodu tanımlı</small></span></div>
        <div class="srow"><span class="s-ic" style="--c:${backupBad ? '#f5a524' : '#22c06f'}">${ic('download')}</span>
          <span class="s-t">${lb ? `Son yedek: ${relDays(lb)}` : 'Henüz yedek alınmadı'}<small>Telefon kaybolursa yedek verilerinizi kurtarır</small></span>
          <button class="btn ghost sm" data-act="export-backup">Yedekle</button></div>
      </div>
      <p class="hint">Sorunlu bir kayda dokunarak açın, ardından <b>Düzenle</b> › sihirli değnek ile güçlü bir şifre üretin ve sitedeki şifrenizi de değiştirin.</p>`;
  }

  /* ----- Settings tab ----- */
  function renderSet(c) {
    const s = S.vault.settings;
    const theme = getTheme();
    const opts = (arr, cur) => arr.map(([v, l]) => `<option value="${v}" ${+v === +cur ? 'selected' : ''}>${l}</option>`).join('');
    const sIc = (icon, col) => `<span class="s-ic" style="--c:${col}">${ic(icon)}</span>`;
    const nav = (act, icon, col, label, sub = '') => `<button class="srow" data-act="${act}">${sIc(icon, col)}<span class="s-t">${label}${sub ? `<small>${sub}</small>` : ''}</span>${ic('chevRight', 'chev')}</button>`;
    c.innerHTML = `
      <header class="large-head"><div><h1>Ayarlar</h1></div></header>
      ${!isStandalone() && isIOS ? `<div class="callout info" style="margin-bottom:6px">${ic('info')}<div>En iyi deneyim için Safari'de <b>Paylaş › Ana Ekrana Ekle</b> ile kurun.</div></div>` : ''}
      <div class="group-label">Güvenlik</div>
      <div class="group">
        <label class="srow">${sIc('clock', '#8b6cff')}<span class="s-t">Otomatik kilit</span>
          <select data-set="autoLock">${opts([[1, '1 dakika'], [2, '2 dakika'], [5, '5 dakika'], [15, '15 dakika'], [60, '1 saat'], [0, 'Asla']], s.autoLock)}</select></label>
        <label class="srow">${sIc('lock', '#3f8cff')}<span class="s-t">Uygulamadan çıkınca kilitle<small>Başka uygulamaya geçince hemen kilitlenir</small></span>
          <input type="checkbox" class="switch" data-set="lockOnHide" ${s.lockOnHide ? 'checked' : ''}></label>
        <label class="srow">${sIc('clipboard', '#22c06f')}<span class="s-t">Panoyu temizle<small>Kopyalanan şifre bu süre sonra silinir</small></span>
          <select data-set="clipClear">${opts([[15, '15 sn'], [30, '30 sn'], [60, '1 dk'], [120, '2 dk'], [0, 'Kapalı']], s.clipClear)}</select></label>
        ${nav('change-master', 'key', '#f5a524', 'Ana şifreyi değiştir')}
        ${nav('change-hint', 'hint', '#17b5cc', 'Şifre ipucu', S.record.hint ? 'Tanımlı' : 'Tanımlı değil')}
        ${nav('lock', 'lock', '#7c7c8e', 'Şimdi kilitle')}
      </div>
      <div class="group-label">Görünüm</div>
      <div class="group pad"><div class="seg">${[['system', 'Sistem'], ['dark', 'Koyu'], ['light', 'Açık']].map(([v, l]) => `<button data-act="theme" data-v="${v}" class="${theme === v ? 'on' : ''}">${l}</button>`).join('')}</div></div>
      <div class="group-label">Yedekleme ve aktarım</div>
      <div class="group">
        ${nav('export-backup', 'download', '#22c06f', 'Şifreli yedek al', s.lastBackup ? `Son yedek: ${relDays(s.lastBackup)}` : 'Henüz yedek alınmadı')}
        ${nav('import-backup', 'upload', '#3f8cff', 'Yedekten geri yükle', 'Kayıtlar mevcut kasayla birleştirilir')}
        ${nav('import-csv', 'file', '#8b6cff', 'CSV içe aktar', 'iCloud Anahtar Zinciri, Chrome, Bitwarden…')}
        ${nav('export-csv', 'share', '#ff7440', 'CSV dışa aktar', 'Şifresiz – dikkatli kullanın')}
      </div>
      <p class="hint">Şifreli yedek dosyası yalnızca ana şifrenizle açılabilir. Dosyayı iCloud Drive'a veya bilgisayarınıza kaydetmeniz önerilir.</p>
      <div class="group-label">Tehlikeli bölge</div>
      <div class="group"><button class="srow danger" data-act="wipe">${sIc('trash', '#ff5a6a')}<span class="s-t">Tüm verileri sil</span></button></div>
      <div class="about"><div class="logo">${LOGO}</div><b>Kasa</b> · Sürüm ${VERSION}<br>
        Verileriniz yalnızca bu cihazda saklanır ve internete gönderilmez.<br>AES-256-GCM şifreleme · PBKDF2-SHA256 (${ITER.toLocaleString('tr-TR')} tur)<br><span id="persist-state"></span></div>`;
    navigator.storage?.persisted?.().then((p) => { const el = $('#persist-state'); if (el && p) el.textContent = 'Kalıcı depolama etkin'; }).catch(() => {});
  }

  /* ----- Settings actions ----- */
  function openChangeMaster() {
    openSheet(`
      <div class="sheet-bar"><button class="txt-btn" data-act="close">Vazgeç</button><div class="sheet-title">Ana şifreyi değiştir</div>
        <button class="txt-btn strong" data-act="do-change-master">Kaydet</button></div>
      <form class="sheet-body" id="cm-form" autocomplete="off" novalidate>
        <div class="group-label" style="padding-top:6px">Mevcut ana şifre</div>
        <div class="group"><div class="frow"><input type="password" name="cur" placeholder="Mevcut ana şifre" autocomplete="current-password" autocapitalize="off" autocorrect="off" spellcheck="false"></div></div>
        <div class="group-label">Yeni ana şifre</div>
        <div class="group">
          <div class="frow"><input type="password" name="n1" data-meter="cm-meter" placeholder="Yeni şifre (en az 8 karakter)" autocomplete="new-password" autocapitalize="off" autocorrect="off" spellcheck="false"></div>
          <div class="frow"><input type="password" name="n2" placeholder="Yeni şifre (tekrar)" autocomplete="new-password" autocapitalize="off" autocorrect="off" spellcheck="false"></div>
          <div class="frow-meter"><div class="meter-row"><div class="meter m-none" id="cm-meter"><i></i></div><span class="meter-label" id="cm-meter-l"></span></div></div>
        </div>
        <p class="hint">Kasanız yeni şifreyle yeniden şifrelenir. Daha önce aldığınız yedekler eski şifreyle açılmaya devam eder; değişiklikten sonra yeni bir yedek almanız önerilir.</p>
      </form>`);
  }
  async function doChangeMaster() {
    const f = $('#cm-form'); if (!f) return;
    const cur = f.elements.cur.value, n1 = f.elements.n1.value, n2 = f.elements.n2.value;
    if (!cur) return toast('Mevcut şifreyi girin', 'err');
    if (n1.length < 8) return toast('Yeni şifre en az 8 karakter olmalı', 'err');
    if (n1 !== n2) return toast('Yeni şifreler eşleşmiyor', 'err');
    if (strength(n1).score < 2 && !(await ask({ title: 'Zayıf ana şifre', message: 'Yeni şifre kolay tahmin edilebilir. Yine de kullanılsın mı?', ok: 'Kullan', danger: true }))) return;
    busy(true, 'Doğrulanıyor…');
    await saveChain;
    if (!(await verifyMaster(cur))) { busy(false); return toast('Mevcut şifre hatalı', 'err'); }
    busy(true, 'Yeniden şifreleniyor…');
    try {
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const key = await deriveKey(n1, salt, ITER);
      S.key = key;
      S.record = { ...S.record, salt: b64(salt), iter: ITER };
      await persist();
      busy(false);
      await closeSheet(true);
      toast('Ana şifre değiştirildi');
      if (S.tab === 'set') renderTab();
    } catch (e) { busy(false); toast('Hata: ' + e.message, 'err'); }
  }
  async function changeHint() {
    const v = await ask({ title: 'Şifre ipucu', message: 'Kilit ekranında gösterilir ve şifrelenmez. Şifrenin kendisini yazmayın. Silmek için boş bırakın.', input: { value: S.record.hint || '', placeholder: 'İpucu', maxlength: 80 }, ok: 'Kaydet' });
    if (v === null) return;
    await saveChain;
    S.record = { ...S.record, hint: v.trim() };
    await persist();
    toast(v.trim() ? 'İpucu kaydedildi' : 'İpucu kaldırıldı');
    renderTab();
  }
  async function exportBackup() {
    await saveChain;
    const name = `kasa-yedek-${new Date().toISOString().slice(0, 10)}.json`;
    const ok = await saveFile(name, JSON.stringify(S.record), 'application/json');
    if (!ok || !S.vault) return;
    S.vault.settings.lastBackup = Date.now();
    await persist();
    toast('Yedek dosyası hazırlandı');
    if (S.tab !== 'vault') renderTab();
  }
  function normalizeEntry(o) {
    const str = (v, max = 5000) => String(v ?? '').slice(0, max);
    const now = Date.now();
    const num = (v) => (Number.isFinite(+v) && +v > 0 ? +v : now);
    return {
      id: typeof o.id === 'string' && o.id ? o.id.slice(0, 64) : uid(),
      title: str(o.title, 200).trim() || 'Adsız',
      username: str(o.username, 500), password: str(o.password, 2000), url: str(o.url, 2000),
      totp: str(o.totp, 500), notes: str(o.notes, 20000),
      category: CATS.some((c) => c.id === o.category) ? o.category : 'genel',
      favorite: !!o.favorite,
      createdAt: num(o.createdAt), updatedAt: num(o.updatedAt), pwChangedAt: num(o.pwChangedAt || o.createdAt),
      history: Array.isArray(o.history) ? o.history.slice(0, 10).map((h) => ({ password: str(h?.password, 2000), changedAt: num(h?.changedAt) })) : [],
    };
  }
  async function readBackupFile(file) {
    let rec;
    try { rec = JSON.parse(await file.text()); } catch { toast('Dosya okunamadı', 'err'); return null; }
    if (!rec || rec.app !== 'kasa' || !rec.ct || !rec.salt) { toast('Bu dosya bir Kasa yedeği değil', 'err'); return null; }
    const pw = await ask({ title: 'Yedeğin ana şifresi', message: 'Bu yedeği alırken kullandığınız ana şifreyi girin.', input: { type: 'password', placeholder: 'Ana şifre' }, ok: 'Aç' });
    if (!pw) return null;
    busy(true, 'Yedek çözülüyor…');
    try {
      const key = await deriveKey(pw, unb64(rec.salt), rec.iter || ITER);
      const data = JSON.parse(await decryptStr(key, rec.iv, rec.ct));
      busy(false);
      return { rec, key, data };
    } catch { busy(false); toast('Şifre hatalı veya dosya bozuk', 'err'); return null; }
  }
  async function importBackup(file) {
    const r = await readBackupFile(file); if (!r || !S.vault) return;
    let added = 0, updated = 0;
    for (const raw of r.data.entries || []) {
      const e = normalizeEntry(raw);
      const ex = getEntry(e.id);
      if (!ex) { S.vault.entries.push(e); added++; }
      else if (e.updatedAt > ex.updatedAt) { Object.assign(ex, e); updated++; }
    }
    await persist();
    refreshBehind();
    toast(added || updated ? `${added} yeni, ${updated} güncellenmiş kayıt` : 'Yeni kayıt bulunamadı');
  }
  async function restoreFromBackup(file) {
    const r = await readBackupFile(file); if (!r) return;
    const data = r.data;
    data.entries = (data.entries || []).map(normalizeEntry);
    data.settings = { ...clone(DEFAULT_SETTINGS), ...(data.settings || {}) };
    data.settings.gen = { ...DEFAULT_SETTINGS.gen, ...(data.settings.gen || {}) };
    S.key = r.key; S.vault = data;
    S.record = { app: 'kasa', v: 1, kdf: 'PBKDF2-SHA256', iter: r.rec.iter || ITER, salt: r.rec.salt, hint: r.rec.hint || '', iv: '', ct: '', createdAt: r.rec.createdAt || Date.now() };
    await persist();
    navigator.storage?.persist?.().catch(() => {});
    S.tab = 'vault';
    enterApp();
    toast(`${data.entries.length} kayıt geri yüklendi`);
  }
  function parseCSV(text, delim) {
    const rows = []; let rowA = [], f = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (q) {
        if (ch === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += ch;
      } else if (ch === '"') q = true;
      else if (ch === delim) { rowA.push(f); f = ''; }
      else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; rowA.push(f); rows.push(rowA); rowA = []; f = ''; }
      else f += ch;
    }
    if (f !== '' || rowA.length) { rowA.push(f); rows.push(rowA); }
    return rows.filter((r) => r.some((v) => v.trim() !== ''));
  }
  async function importCSV(file) {
    if (!S.vault) return;
    const text = (await file.text()).replace(/^﻿/, '');
    const first = text.split(/\r?\n/)[0] || '';
    const delim = first.split(';').length > first.split(',').length ? ';' : first.includes('\t') && !first.includes(',') ? '\t' : ',';
    const rows = parseCSV(text, delim);
    if (rows.length < 2) return toast('CSV dosyasında kayıt bulunamadı', 'err');
    const head = rows[0].map((h) => h.trim().toLocaleLowerCase('tr'));
    const col = (...names) => { for (const n of names) { const i = head.indexOf(n); if (i >= 0) return i; } return -1; };
    const ci = {
      title: col('title', 'name', 'başlık', 'baslik', 'ad', 'account', 'hesap'),
      url: col('url', 'login_uri', 'website', 'web site', 'site', 'uri', 'web sitesi'),
      user: col('username', 'login_username', 'user name', 'user', 'login', 'email', 'e-mail', 'e-posta', 'kullanıcı adı', 'kullanici adi'),
      pass: col('password', 'login_password', 'şifre', 'sifre', 'parola'),
      notes: col('notes', 'note', 'extra', 'comments', 'notlar', 'not'),
      totp: col('otpauth', 'totp', 'login_totp', 'otp'),
      type: col('type'), fav: col('favorite'), cat: col('category', 'kategori', 'grouping', 'folder'),
    };
    if (ci.pass < 0) return toast('Dosyada “password” sütunu bulunamadı', 'err');
    const seen = new Set(S.vault.entries.map((e) => [e.title, e.username, e.password].join('\u0001')));
    let added = 0, skipped = 0; const now = Date.now();
    for (const r of rows.slice(1)) {
      const g = (i) => (i >= 0 ? (r[i] || '').trim() : '');
      if (ci.type >= 0 && g(ci.type) && g(ci.type).toLowerCase() !== 'login') { skipped++; continue; }
      const password = ci.pass >= 0 ? r[ci.pass] || '' : '';
      const username = g(ci.user), url = g(ci.url);
      const title = g(ci.title) || hostOf(url) || username;
      if (!title || (!password && !username)) { skipped++; continue; }
      const k = [title, username, password].join('\u0001');
      if (seen.has(k)) { skipped++; continue; }
      seen.add(k);
      let totpV = g(ci.totp);
      if (totpV) { try { parseTotp(totpV); } catch { totpV = ''; } }
      S.vault.entries.push(normalizeEntry({
        title, username, password, url, notes: g(ci.notes), totp: totpV,
        category: guessCategory(title, url) || 'genel', favorite: g(ci.fav) === '1' || g(ci.fav).toLowerCase() === 'true',
        createdAt: now, updatedAt: now, pwChangedAt: now,
      }));
      added++;
    }
    await persist();
    refreshBehind();
    toast(`${added} kayıt içe aktarıldı${skipped ? `, ${skipped} atlandı` : ''}`);
    if (added) await ask({ title: 'CSV dosyasını silin', message: 'İçe aktardığınız CSV dosyası şifrelerinizi açık metin olarak içerir. Güvenliğiniz için Dosyalar uygulamasından silmeyi unutmayın.', ok: 'Anladım', cancel: '' });
  }
  async function exportCSV() {
    if (!S.vault.entries.length) return toast('Dışa aktarılacak kayıt yok', 'err');
    const go = await ask({ title: 'Şifresiz dışa aktarım', message: 'CSV dosyası tüm şifrelerinizi AÇIK METİN olarak içerir. Dosyayı kimseyle paylaşmayın ve işiniz bitince silin.', ok: 'Devam et', danger: true });
    if (!go) return;
    const pw = await ask({ title: 'Ana şifrenizi girin', message: 'Güvenliğiniz için ana şifrenizi doğrulayın.', input: { type: 'password', placeholder: 'Ana şifre' }, ok: 'Dışa aktar' });
    if (!pw) return;
    busy(true, 'Doğrulanıyor…');
    const valid = await verifyMaster(pw);
    busy(false);
    if (!valid) return toast('Ana şifre hatalı', 'err');
    const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = [['Title', 'URL', 'Username', 'Password', 'Notes', 'OTPAuth'], ...S.vault.entries.map((e) => [e.title, e.url, e.username, e.password, e.notes, totpUri(e)])].map((r) => r.map(q).join(','));
    await saveFile(`kasa-sifreler-${new Date().toISOString().slice(0, 10)}.csv`, '﻿' + lines.join('\r\n'), 'text/csv');
  }
  async function wipeAll() {
    const ok = await ask({ title: 'Tüm veriler silinsin mi?', message: 'Kasadaki tüm kayıtlar ve ayarlar bu cihazdan kalıcı olarak silinecek. Bu işlem geri alınamaz.', ok: 'Devam et', danger: true });
    if (!ok) return;
    const v = await ask({ title: 'Onaylayın', message: 'Silmek için SİL yazın.', input: { placeholder: 'SİL' }, ok: 'Kalıcı olarak sil', danger: true });
    if (v === null) return;
    if (v.trim().toLocaleUpperCase('tr') !== 'SİL') return toast('Onay metni hatalı, silinmedi', 'err');
    await saveChain;
    await DB.del('vault');
    try { localStorage.removeItem('kasa-fail'); } catch { /* */ }
    S.key = null; S.vault = null; S.record = null; S.tab = 'vault';
    clearInterval(S.idleTimer);
    $('#sheet-root').innerHTML = '';
    renderSetup();
    toast('Tüm veriler silindi');
  }

  /* ---------------- Events ---------------- */
  document.addEventListener('click', async (ev) => {
    if (S.clipDue) { S.clipDue = 0; navigator.clipboard?.writeText('').catch(() => {}); }
    const emptySum = ev.target.closest('details[data-empty] > summary');
    if (emptySum) { ev.preventDefault(); return; }
    const el = ev.target.closest('[data-act],[data-open],[data-copy-pw],[data-tab],[data-toggle],[data-copy-field],[data-copy-hist]');
    if (!el) return;
    const d = el.dataset;
    if (d.toggle) {
      const i = document.getElementById(d.toggle);
      if (i) { const show = i.type === 'password'; i.type = show ? 'text' : 'password'; el.innerHTML = ic(show ? 'eyeOff' : 'eye'); }
      return;
    }
    if (d.act === 'restore') { $('#f-backup').click(); return; }
    if (d.act === 'show-hint') { await ask({ title: 'İpucu', message: S.record?.hint || '', ok: 'Tamam', cancel: '' }); return; }
    if (d.act === 'forgot') {
      const ok = await ask({ title: 'Ana şifremi unuttum', message: 'Ana şifre hiçbir yerde saklanmaz, bu yüzden kurtarılamaz. Kasayı sıfırlayıp yeniden oluşturabilir, ardından elinizde varsa bir yedeği (o yedeğin şifresiyle) geri yükleyebilirsiniz.', ok: 'Kasayı sıfırla', danger: true });
      if (!ok) return;
      const v = await ask({ title: 'Emin misiniz?', message: 'Bu cihazdaki tüm kayıtlar silinecek. Onaylamak için SİL yazın.', input: { placeholder: 'SİL' }, ok: 'Sıfırla', danger: true });
      if (v === null || v.trim().toLocaleUpperCase('tr') !== 'SİL') return;
      await DB.del('vault'); setFails({ n: 0, t: 0 }); S.record = null; renderSetup(); toast('Kasa sıfırlandı');
      return;
    }
    if (!S.key) return;
    if (d.tab) { if (S.tab !== d.tab) { S.tab = d.tab; renderTab(); $('#content').scrollTop = 0; } return; }
    if (d.copyPw) {
      ev.stopPropagation();
      const e = getEntry(d.copyPw);
      if (e?.password) copy(e.password, 'Şifre kopyalandı'); else toast('Bu kayıtta şifre yok', 'err');
      return;
    }
    if (d.open) { openDetail(d.open); return; }
    if (d.copyField) {
      const e = getEntry(S.current); if (!e) return;
      if (d.copyField === 'totp') return copy(S.totpCode, 'Doğrulama kodu kopyalandı');
      const labels = { username: 'Kullanıcı adı kopyalandı', password: 'Şifre kopyalandı', url: 'Adres kopyalandı' };
      return copy(e[d.copyField], labels[d.copyField]);
    }
    if (d.copyHist) { const e = getEntry(S.current); const h = e?.history?.[+d.copyHist]; if (h) copy(h.password, 'Eski şifre kopyalandı'); return; }
    switch (d.act) {
      case 'lock': lock(); break;
      case 'sort':
        S.vault.settings.sort = S.vault.settings.sort === 'az' ? 'recent' : 'az';
        saveSettingsSoon(); renderList();
        toast(S.vault.settings.sort === 'az' ? 'Sıralama: A → Z' : 'Sıralama: Son değiştirilen');
        break;
      case 'cat': S.cat = d.cat; renderChips(); renderList(); break;
      case 'add': openEdit(null); break;
      case 'close': closeSheet(); break;
      case 'edit': openEdit(d.id); break;
      case 'back-detail': if (!S.sheetGuard || (await S.sheetGuard())) { S.sheetGuard = null; openDetail(d.id); } break;
      case 'save': saveEdit(); break;
      case 'delete': deleteEntry(d.id); break;
      case 'fav': {
        const e = getEntry(S.current); if (!e) return;
        e.favorite = !e.favorite; await persist();
        el.classList.toggle('on', e.favorite); el.querySelector('span').textContent = e.favorite ? 'Favorilerde' : 'Favorilere ekle';
        refreshBehind();
        break;
      }
      case 'reveal': {
        const e = getEntry(S.current); const v = $('#pw-val'); if (!e || !v) return;
        const shown = v.dataset.shown === '1';
        v.textContent = shown ? '•'.repeat(Math.min([...e.password].length, 14)) : e.password;
        v.dataset.shown = shown ? '0' : '1';
        el.innerHTML = ic(shown ? 'eye' : 'eyeOff');
        break;
      }
      case 'gen-into': {
        const i = $('#e-pw'); if (!i) return;
        i.value = generate(S.vault.settings.gen); i.type = 'text';
        const t = $('[data-toggle="e-pw"]'); if (t) t.innerHTML = ic('eyeOff');
        updateMeter('e-meter', i.value);
        toast('Güçlü şifre oluşturuldu');
        break;
      }
      case 'g-regen': regen(); break;
      case 'g-copy': copy(S.genPw, 'Şifre kopyalandı'); break;
      case 'theme': applyTheme(d.v); renderTab(); break;
      case 'change-master': openChangeMaster(); break;
      case 'do-change-master': doChangeMaster(); break;
      case 'change-hint': changeHint(); break;
      case 'export-backup': exportBackup(); break;
      case 'import-backup': $('#f-backup').click(); break;
      case 'import-csv': $('#f-csv').click(); break;
      case 'export-csv': exportCSV(); break;
      case 'wipe': wipeAll(); break;
      default: break;
    }
  });
  document.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches?.('.row[data-open]')) { e.preventDefault(); openDetail(e.target.dataset.open); }
    if (e.key === 'Escape' && $('#sheet-root .sheet:not(.closing)') && !$('.dialog')) closeSheet();
  });
  document.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = e.target.id;
    if (id === 'setup-form') doSetup();
    else if (id === 'unlock-form') doUnlock();
    else if (id === 'edit-form') saveEdit();
    else if (id === 'cm-form') doChangeMaster();
  });
  document.addEventListener('input', (e) => {
    const t = e.target;
    if (t.dataset?.meter) updateMeter(t.dataset.meter, t.value);
    if (t.id === 'q') { S.query = t.value; renderList(); }
    if (t.id === 'g-len' && S.vault) { S.vault.settings.gen.length = +t.value; $('#g-lenv').textContent = t.value; regen(); saveSettingsSoon(); }
    if (t.form?.id === 'edit-form' && t.name === 'title' && !t.form.dataset.catTouched) {
      const g = guessCategory(t.value, t.form.elements.url.value);
      t.form.elements.category.value = g || (['all', 'fav'].includes(S.cat) ? 'genel' : S.cat);
    }
  });
  document.addEventListener('change', (e) => {
    const t = e.target;
    if (t.id === 'f-backup' && t.files?.[0]) { const f = t.files[0]; t.value = ''; (S.key ? importBackup(f) : restoreFromBackup(f)); return; }
    if (t.id === 'f-csv' && t.files?.[0]) { const f = t.files[0]; t.value = ''; if (S.key) importCSV(f); return; }
    if (!S.vault) return;
    if (t.form?.id === 'edit-form' && t.name === 'category') t.form.dataset.catTouched = '1';
    if (t.dataset.set) {
      S.vault.settings[t.dataset.set] = t.type === 'checkbox' ? t.checked : Number(t.value);
      persist(); toast('Ayar kaydedildi');
    }
    if (t.dataset.gen) {
      const g = S.vault.settings.gen;
      g[t.dataset.gen] = t.checked;
      if (!g.upper && !g.lower && !g.digits && !g.symbols) { g[t.dataset.gen] = true; t.checked = true; toast('En az bir karakter türü seçili olmalı', 'err'); return; }
      regen(); saveSettingsSoon();
    }
  });
  const markActive = () => { S.lastActive = Date.now(); };
  ['pointerdown', 'keydown', 'input', 'touchstart'].forEach((t) => document.addEventListener(t, markActive, { passive: true, capture: true }));
  document.addEventListener('scroll', markActive, { passive: true, capture: true });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      document.body.classList.add('privacy');
      if (S.key && S.vault?.settings.lockOnHide) lock();
    } else {
      document.body.classList.remove('privacy');
      checkIdle();
    }
  });
  window.addEventListener('pagehide', () => { if (S.key && S.vault?.settings.lockOnHide) lock(); });
  window.addEventListener('pageshow', () => { document.body.classList.remove('privacy'); checkIdle(); });
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => applyTheme(getTheme()));

  /* ---------------- Boot ---------------- */
  async function boot() {
    applyTheme(getTheme());
    if (!window.crypto?.subtle || !window.indexedDB) {
      app.innerHTML = `<div class="fatal"><div class="logo">${LOGO}</div><h2>Güvenli bağlantı gerekli</h2><p>Kasa yalnızca güvenli (https://) bir adresten açıldığında çalışır. Lütfen uygulamayı kurulum rehberindeki adresten açın.</p></div>`;
      return;
    }
    try { S.record = await DB.get('vault'); } catch (e) {
      app.innerHTML = `<div class="fatal"><div class="logo">${LOGO}</div><h2>Depolama açılamadı</h2><p>${esc(e?.message || e)}<br>Özel (gizli) sekmede açıyorsanız normal sekmede deneyin.</p></div>`;
      return;
    }
    if (S.record) renderLock(); else renderSetup();
    if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  }
  // Test için dışa açılan küçük yardımcılar (hassas veri içermez)
  window.__kasa = { totp, parseTotp, strength, generate, parseCSV };
  boot();
})();
