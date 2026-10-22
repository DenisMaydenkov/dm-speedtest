import SpeedTest from 'https://cdn.jsdelivr.net/npm/@cloudflare/speedtest@1.14.1/+esm';
import { drawCard } from './share.js';

const I18N = {
  ru: {
    start: 'Начать тест', stop: 'Остановить', again: 'Ещё раз', share: 'Поделиться', ok: 'Понятно',
    speed: 'Скорость', approx: '~30 секунд', ping: 'Пинг', download: 'Загрузка', upload: 'Отдача', jitter: 'Джиттер',
    mbps: 'Мбит/с', ms: 'мс', scale: 'шкала', error: 'Ошибка замера',
    checking: 'Проверка…', vpnClean: 'VPN чистый', vpnLeak: 'Утечка WebRTC', noVpn: 'Без VPN', netUnknown: 'Сеть',
    node: 'узел Cloudflare',
    foot: 'Замер идёт до ближайшего узла Cloudflare. Не храним IP и результаты.',
    warnRu: 'В России Cloudflare бывает замедлен — без VPN результат может быть ниже реального.',
    errorToast: 'Не удалось провести замер. Проверь соединение и попробуй ещё раз.',
    copied: 'Картинка скопирована', saved: 'Картинка сохранена',
    langSwitch: 'Switch to English', theme_auto: 'Тема: как в системе', theme_light: 'Тема: светлая', theme_dark: 'Тема: тёмная',
    tClean: 'VPN работает чисто', lClean: 'Реальный IP не виден, утечек не найдено.',
    tLeak: 'Браузер выдаёт тебя', lLeak: 'VPN работает, но через WebRTC сайты видят твой настоящий адрес.',
    tNoVpn: 'Ты без VPN', lNoVpn: 'Сайты видят твой адрес и провайдера. Это нормально, если ты не пользуешься VPN.',
    tWait: 'Проверяем подключение', lWait: 'Это займёт пару секунд.',
    tFail: 'Не удалось определить сеть', lFail: 'Сервис определения адреса недоступен. Замер скорости при этом работает.',
    rIp: 'IP', rPlace: 'Где', rIsp: 'Провайдер', rNode: 'Узел теста', rVpn: 'VPN', rRtc: 'WebRTC',
    vpnYes: 'Похоже, включён', vpnNo: 'Не обнаружен', rtcOk: 'IP не виден', rtcOff: 'Отключён', rtcNa: 'Не проверяется без VPN',
    fixTitle: 'Как исправить',
    fixText: 'Включи защиту от утечки WebRTC в настройках VPN-клиента. Если её нет — запрети WebRTC в браузере или поставь расширение, которое его блокирует.',
  },
  en: {
    start: 'Start test', stop: 'Stop', again: 'Run again', share: 'Share', ok: 'Got it',
    speed: 'Speed', approx: '~30 seconds', ping: 'Ping', download: 'Download', upload: 'Upload', jitter: 'Jitter',
    mbps: 'Mbps', ms: 'ms', scale: 'scale', error: 'Test failed',
    checking: 'Checking…', vpnClean: 'VPN clean', vpnLeak: 'WebRTC leak', noVpn: 'No VPN', netUnknown: 'Network',
    node: 'Cloudflare node',
    foot: 'Measured to the nearest Cloudflare node. We don’t store your IP or results.',
    warnRu: 'Cloudflare is often throttled in Russia — without a VPN the result may be lower than your real speed.',
    errorToast: 'The test could not run. Check your connection and try again.',
    copied: 'Image copied', saved: 'Image saved',
    langSwitch: 'Переключить на русский', theme_auto: 'Theme: system', theme_light: 'Theme: light', theme_dark: 'Theme: dark',
    tClean: 'Your VPN is clean', lClean: 'Your real IP is hidden and nothing leaks.',
    tLeak: 'Your browser gives you away', lLeak: 'The VPN works, but sites can see your real address through WebRTC.',
    tNoVpn: 'You’re not on a VPN', lNoVpn: 'Sites see your address and provider. That’s expected if you don’t use a VPN.',
    tWait: 'Checking your connection', lWait: 'This takes a couple of seconds.',
    tFail: 'Couldn’t identify your network', lFail: 'The address lookup service is unavailable. The speed test still works.',
    rIp: 'IP', rPlace: 'Location', rIsp: 'Provider', rNode: 'Test node', rVpn: 'VPN', rRtc: 'WebRTC',
    vpnYes: 'Looks on', vpnNo: 'Not detected', rtcOk: 'IP hidden', rtcOff: 'Disabled', rtcNa: 'Checked only with a VPN',
    fixTitle: 'How to fix it',
    fixText: 'Turn on WebRTC leak protection in your VPN app. If it has none, disable WebRTC in the browser or install an extension that blocks it.',
  },
};

// Hosting and VPN providers: an address from one of these is almost never a home connection.
const HOSTING = ['m247', 'digitalocean', 'hetzner', 'ovh', 'amazon', 'aws', 'google cloud', 'google llc', 'microsoft', 'azure',
  'linode', 'akamai', 'vultr', 'choopa', 'contabo', 'leaseweb', 'datacamp', 'cdn77', 'g-core', 'gcore', 'scaleway', 'ionos',
  'hostinger', 'aeza', 'timeweb', 'selectel', 'netcup', 'oracle', 'alibaba', 'tencent', 'hostkey', 'servers.com', 'servers tech',
  'vdsina', 'psychz', 'quadranet', 'colocrossing', 'zenlayer', 'mullvad', 'proton', 'nordvpn', 'packethub', 'tefincom', 'clouvider',
  'frantech', 'buyvm', 'stark industries', 'pq hosting', 'worldstream', 'xtom', 'kamatera', 'racknerd', 'datapacket', 'tzulo',
  'hosting', 'vps', 'server', 'data center', 'datacenter', 'cloud'];

const MEASUREMENTS = [
  { type: 'latency', numPackets: 1 },
  { type: 'download', bytes: 1e5, count: 1, bypassMinDuration: true },
  { type: 'latency', numPackets: 12 },
  { type: 'download', bytes: 1e5, count: 9 },
  { type: 'download', bytes: 1e6, count: 8 },
  { type: 'download', bytes: 1e7, count: 6 },
  { type: 'download', bytes: 2.5e7, count: 4 },
  { type: 'download', bytes: 1e8, count: 3 },
  { type: 'download', bytes: 2.5e8, count: 2 },
  { type: 'upload', bytes: 1e5, count: 8 },
  { type: 'upload', bytes: 1e6, count: 6 },
  { type: 'upload', bytes: 1e7, count: 4 },
  { type: 'upload', bytes: 2.5e7, count: 4 },
  { type: 'upload', bytes: 5e7, count: 3 },
];
const DL_FROM = 3, UL_FROM = 9;
const SCALES = [10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000];

const $ = id => document.getElementById(id);
const root = document.documentElement;
const app = $('app');

const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} },
};

let lang = root.lang === 'en' ? 'en' : 'ru';
const t = k => I18N[lang][k] ?? k;

const S = {
  phase: 'idle', step: 0,
  ping: null, jitter: null, dl: null, ul: null,
  target: 0, shown: 0, scale: 0,
  net: null, netFailed: false, rtc: null,
  card: null,
};
let engine = null;
let raf = 0;

/* ---------- formatting ---------- */

const fmt = mbps => (mbps >= 10 ? Math.round(mbps) : mbps >= 1 ? mbps.toFixed(1) : mbps.toFixed(2)).toString();
const fmtMs = ms => (ms < 10 ? ms.toFixed(1) : Math.round(ms)).toString();
const scaleFor = v => SCALES.find(s => s >= v * 1.05) || SCALES.at(-1);

/* ---------- theme ---------- */

const THEME_ICONS = {
  auto: '<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor"/>',
  light: '<circle cx="12" cy="12" r="4.5"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  dark: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
};
let themeMode = ['auto', 'light', 'dark'].includes(store.get('theme')) ? store.get('theme') : 'auto';
const darkMq = matchMedia('(prefers-color-scheme: dark)');

function applyTheme() {
  const dark = themeMode === 'dark' || (themeMode === 'auto' && darkMq.matches);
  const next = dark ? 'dark' : 'light';
  if (root.dataset.theme !== next) S.card = null;
  root.dataset.theme = next;
  $('themeIcon').innerHTML = THEME_ICONS[themeMode];
  $('themeBtn').setAttribute('aria-label', t('theme_' + themeMode));
  $('themeBtn').title = t('theme_' + themeMode);
}
darkMq.addEventListener('change', applyTheme);
$('themeBtn').addEventListener('click', () => {
  themeMode = { auto: 'light', light: 'dark', dark: 'auto' }[themeMode];
  store.set('theme', themeMode);
  applyTheme();
});

/* ---------- language ---------- */

function applyLang() {
  root.lang = lang;
  document.querySelectorAll('[data-t]').forEach(el => { el.textContent = t(el.dataset.t); });
  $('langBtn').textContent = lang === 'ru' ? 'EN' : 'RU';
  $('langBtn').setAttribute('aria-label', t('langSwitch'));
  $('langBtn').title = t('langSwitch');
  applyTheme();
  S.card = null;
  render();
}
$('langBtn').addEventListener('click', () => {
  lang = lang === 'ru' ? 'en' : 'ru';
  store.set('lang', lang);
  applyLang();
  loadNet();
  if ($('sheet').open) fillSheet();
});

/* ---------- network: who sees us, and is it a VPN ---------- */

async function loadNet() {
  const [trace, who] = await Promise.allSettled([
    fetch('https://speed.cloudflare.com/cdn-cgi/trace').then(r => r.text()),
    fetch(`https://ipwho.is/?lang=${lang}`).then(r => r.json()),
  ]);
  const tr = {};
  if (trace.status === 'fulfilled') trace.value.trim().split('\n').forEach(l => { const i = l.indexOf('='); tr[l.slice(0, i)] = l.slice(i + 1); });
  const w = who.status === 'fulfilled' && who.value.success ? who.value : null;
  if (!w && !tr.ip) { S.netFailed = true; render(); return; }

  const conn = w?.connection || {};
  const org = conn.org || conn.isp || '';
  const haystack = `${org} ${conn.isp || ''} ${conn.domain || ''}`.toLowerCase();
  const browserOffset = -new Date().getTimezoneOffset();
  const ipOffset = w?.timezone?.offset != null ? w.timezone.offset / 60 : null;

  const reasons = {
    warp: tr.warp === 'on' || tr.warp === 'plus',
    hosting: HOSTING.some(k => haystack.includes(k)),
    timezone: ipOffset != null && Math.abs(ipOffset - browserOffset) >= 60,
  };
  S.net = {
    ip: w?.ip || tr.ip, country: w?.country || tr.loc || '', cc: w?.country_code || tr.loc || '', city: w?.city || '',
    asn: conn.asn || '', org, colo: tr.colo || '',
    vpn: reasons.warp || reasons.hosting || reasons.timezone,
  };
  S.netFailed = false;
  S.card = null;
  render();
  if (S.rtc === null) checkRtc();
}

function isPublicIp(ip) {
  if (ip.includes(':')) return !/^(fe80|fc|fd|::1$)/i.test(ip);
  const [a, b] = ip.split('.').map(Number);
  return !(a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 192 && b === 168) ||
    (a === 172 && b >= 16 && b <= 31) || (a === 100 && b >= 64 && b <= 127));
}

// Asks STUN servers which address they see; a browser that bypasses the VPN here reveals the real IP.
async function checkRtc() {
  S.rtc = 'pending';
  if (!window.RTCPeerConnection) { S.rtc = { ips: [], off: true }; render(); return; }
  const ips = new Set();
  let pc;
  try {
    pc = new RTCPeerConnection({ iceServers: [{ urls: ['stun:stun.cloudflare.com:3478', 'stun:stun.l.google.com:19302'] }] });
    pc.createDataChannel('probe');
    pc.onicecandidate = e => {
      const ip = e.candidate?.candidate?.split(' ')[4];
      if (ip && !ip.endsWith('.local') && isPublicIp(ip)) ips.add(ip.toLowerCase());
    };
    await pc.setLocalDescription(await pc.createOffer());
    await new Promise(done => {
      setTimeout(done, 3000);
      pc.onicegatheringstatechange = () => { if (pc.iceGatheringState === 'complete') done(); };
    });
    S.rtc = { ips: [...ips] };
  } catch {
    S.rtc = { ips: [], off: true };
  } finally {
    pc?.close();
  }
  S.card = null;
  render();
}

function verdict() {
  const n = S.net;
  if (!n) return S.netFailed ? 'fail' : 'wait';
  if (!n.vpn) return 'novpn';
  if (S.rtc === null || S.rtc === 'pending') return 'wait';
  const me = (n.ip || '').toLowerCase();
  return S.rtc.ips.some(ip => ip !== me) ? 'leak' : 'clean';
}
const leakedIps = () => (S.rtc?.ips || []).filter(ip => ip !== (S.net?.ip || '').toLowerCase());

/* ---------- speed test ---------- */

const phaseOf = step => (step < DL_FROM ? 'latency' : step < UL_FROM ? 'download' : 'upload');

function start() {
  engine?.pause();
  Object.assign(S, { phase: 'latency', step: 0, ping: null, jitter: null, dl: null, ul: null, target: 0, shown: 0, scale: 0, card: null });
  const e = new SpeedTest({
    autoStart: false,
    measurements: MEASUREMENTS,
    logAimApiUrl: null,
    measureDownloadLoadedLatency: false,
    measureUploadLoadedLatency: false,
  });
  engine = e;
  e.onPhaseChange = ({ measurementId }) => {
    if (engine !== e) return;
    const next = phaseOf(measurementId);
    if (next !== S.phase) Object.assign(S, { target: 0, shown: 0, scale: 0 });
    S.phase = next;
    S.step = measurementId;
    render();
  };
  e.onResultsChange = () => {
    if (engine !== e) return;
    const r = e.results;
    S.ping = r.getUnloadedLatency() ?? S.ping;
    S.jitter = r.getUnloadedJitter() ?? S.jitter;
    if (S.phase === 'latency' && S.ping != null) S.target = S.ping;
    if (S.phase === 'download') {
      const v = r.getDownloadBandwidth() ?? r.getDownloadBandwidthPoints().at(-1)?.bps;
      if (v) S.target = v / 1e6;
    }
    if (S.phase === 'upload') {
      const v = r.getUploadBandwidth() ?? r.getUploadBandwidthPoints().at(-1)?.bps;
      if (v) S.target = v / 1e6;
      S.dl = (r.getDownloadBandwidth() ?? 0) / 1e6 || S.dl;
    }
  };
  e.onFinish = r => {
    if (engine !== e) return;
    const s = r.getSummary();
    Object.assign(S, {
      phase: 'done', ping: s.latency ?? S.ping, jitter: s.jitter ?? S.jitter,
      dl: (s.download ?? 0) / 1e6, ul: (s.upload ?? 0) / 1e6,
    });
    engine = null;
    render();
    prepareCard();
  };
  e.onError = msg => {
    if (engine !== e) return;
    console.warn('speedtest:', msg);
    e.pause();
    engine = null;
    S.phase = 'error';
    toast(t('errorToast'));
    render();
  };
  e.play();
  render();
  tick();
}

function stop() {
  engine?.pause();
  engine = null;
  Object.assign(S, { phase: 'idle', ping: null, jitter: null, dl: null, ul: null, target: 0, shown: 0, scale: 0 });
  render();
}

// Eases the big number toward the latest measurement so it rolls instead of jumping.
function tick() {
  cancelAnimationFrame(raf);
  const step = () => {
    if (!engine) return;
    S.shown += (S.target - S.shown) * 0.12;
    renderBox();
    raf = requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step);
}

$('goBtn').addEventListener('click', () => (engine ? stop() : start()));

/* ---------- rendering ---------- */

function setBig(text, unit) {
  const big = $('big');
  big.textContent = text;
  big.style.setProperty('--len', Math.max(2, text.length));
  $('unit').textContent = unit;
}

function renderBox() {
  const box = $('box');
  let label = t('speed'), right = '', p = 0;
  switch (S.phase) {
    case 'idle':
      setBig('0', t('mbps'));
      right = t('approx');
      break;
    case 'latency':
      label = t('ping');
      setBig(S.shown > 0 ? fmtMs(S.shown) : '—', t('ms'));
      break;
    case 'download':
    case 'upload': {
      label = t(S.phase);
      S.scale = Math.max(S.scale, scaleFor(S.shown));
      p = S.shown / S.scale;
      setBig(fmt(S.shown), t('mbps'));
      right = `${t('scale')} ${S.scale}`;
      break;
    }
    case 'done': {
      label = t('download');
      const sc = scaleFor(S.dl);
      p = S.dl / sc;
      setBig(fmt(S.dl), t('mbps'));
      right = `${t('scale')} ${sc}`;
      break;
    }
    case 'error':
      label = t('error');
      setBig('—', t('mbps'));
      break;
  }
  $('phase').textContent = label;
  $('scale').textContent = right;
  box.style.setProperty('--p', Math.min(1, p).toFixed(4));
}

function setTile(id, value, unit) {
  const el = $(id);
  el.classList.toggle('empty', value == null);
  el.textContent = value ?? '—';
  if (value != null && unit) {
    const u = document.createElement('small');
    u.textContent = ' ' + unit;
    el.append(u);
  }
}

function renderSteps() {
  const order = ['latency', 'download', 'upload'];
  const bounds = { latency: [0, DL_FROM], download: [DL_FROM, UL_FROM], upload: [UL_FROM, MEASUREMENTS.length] };
  const cur = order.indexOf(S.phase);
  document.querySelectorAll('#steps > div').forEach(div => {
    const name = div.dataset.step;
    const i = order.indexOf(name);
    const [a, b] = bounds[name];
    const frac = S.phase === 'done' || i < cur ? 1 : i > cur ? 0 : Math.min(1, (S.step - a + 0.5) / (b - a));
    div.classList.toggle('on', i === cur);
    div.querySelector('i').style.width = (frac * 100).toFixed(1) + '%';
  });
}

function renderNet() {
  const v = verdict();
  const pill = $('vpnPill');
  pill.className = 'pill ' + ({ clean: 'ok', leak: 'bad', wait: 'wait', fail: 'wait', novpn: '' }[v]);
  $('vpnText').textContent = t({ clean: 'vpnClean', leak: 'vpnLeak', wait: 'checking', fail: 'netUnknown', novpn: 'noVpn' }[v]);

  const n = S.net;
  if (!n) {
    $('connMain').textContent = S.netFailed ? '—' : t('checking');
    $('connSub').textContent = '';
  } else {
    const place = [n.country, n.city].filter(Boolean).join(', ');
    const node = n.colo ? `${t('node')} ${n.colo}` : '';
    $('connMain').textContent = n.vpn ? place : [n.org, n.city].filter(Boolean).join(' · ');
    $('connSub').textContent = [n.ip, n.vpn ? n.org : (n.asn ? 'AS' + n.asn : ''), node].filter(Boolean).join(' · ');
  }
  $('warn').hidden = !(n && n.cc === 'RU' && !n.vpn);
}

function render() {
  const running = !!engine;
  app.classList.toggle('running', running);
  app.classList.toggle('idle', S.phase === 'idle');
  $('goBtn').textContent = running ? t('stop') : S.phase === 'idle' ? t('start') : t('again');
  $('shareBtn').hidden = S.phase !== 'done';
  renderBox();
  renderSteps();
  const liveUp = S.phase === 'upload' && S.shown > 0 ? S.shown : null;
  setTile('vUp', S.ul != null ? fmt(S.ul) : liveUp != null ? fmt(liveUp) : null, t('mbps'));
  setTile('vPing', S.ping != null ? fmtMs(S.ping) : null, t('ms'));
  setTile('vJit', S.jitter != null ? fmtMs(S.jitter) : null, t('ms'));
  renderNet();
}

/* ---------- details sheet ---------- */

function fillSheet() {
  const v = verdict();
  const key = { clean: 'Clean', leak: 'Leak', novpn: 'NoVpn', wait: 'Wait', fail: 'Fail' }[v];
  $('sTitle').textContent = t('t' + key);
  $('sLead').textContent = t('l' + key);
  $('sFix').hidden = v !== 'leak';

  const rows = $('sRows');
  rows.replaceChildren();
  const add = (k, val, tone) => {
    const row = document.createElement('div');
    row.className = 'row';
    const a = document.createElement('span');
    a.textContent = k;
    const b = document.createElement('span');
    b.textContent = val;
    if (tone) b.className = tone;
    row.append(a, b);
    rows.append(row);
  };
  const n = S.net;
  if (n) {
    add(t('rIp'), n.ip);
    add(t('rPlace'), [n.country, n.city].filter(Boolean).join(', ') || '—');
    add(t('rIsp'), [n.asn ? 'AS' + n.asn : '', n.org].filter(Boolean).join(' ') || '—');
    if (n.colo) add(t('rNode'), 'Cloudflare ' + n.colo);
    add(t('rVpn'), n.vpn ? t('vpnYes') : t('vpnNo'), n.vpn ? 'ok' : '');
    if (!n.vpn) add(t('rRtc'), t('rtcNa'));
    else if (v === 'leak') add(t('rRtc'), leakedIps().join(', '), 'bad');
    else if (v === 'clean') add(t('rRtc'), S.rtc.off ? t('rtcOff') : t('rtcOk'), 'ok');
    else add(t('rRtc'), t('checking'));
  }
  rows.hidden = !n;
}

function openSheet() {
  fillSheet();
  $('sheet').showModal();
}
$('vpnPill').addEventListener('click', openSheet);
$('connBtn').addEventListener('click', openSheet);
$('sClose').addEventListener('click', () => $('sheet').close());
$('sheet').addEventListener('click', e => { if (e.target === $('sheet')) $('sheet').close(); });

/* ---------- share ---------- */

function cardData() {
  const n = S.net;
  const v = verdict();
  const status = v === 'clean' ? { text: t('vpnClean'), tone: 'ok' }
    : v === 'leak' ? { text: t('vpnLeak'), tone: 'bad' }
    : { text: n ? t('noVpn') : t('speed'), tone: 'plain' };
  // The card never carries the IP: people post it in chats.
  const place = n ? (n.vpn ? [n.country, n.org] : [n.city || n.country, n.org]).filter(Boolean).join(' · ') : '';
  return {
    theme: root.dataset.theme,
    date: new Date().toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-GB'),
    label: t('download'), unit: t('mbps'), big: fmt(S.dl), fill: S.dl / scaleFor(S.dl),
    tiles: [
      { k: t('upload'), v: fmt(S.ul), u: t('mbps') },
      { k: t('ping'), v: fmtMs(S.ping ?? 0), u: t('ms') },
      { k: t('jitter'), v: fmtMs(S.jitter ?? 0), u: t('ms') },
    ],
    status, place,
    domain: location.hostname && location.hostname !== 'localhost' ? location.hostname : 'dmworks',
  };
}

// Drawn ahead of time so the tap goes straight to the share sheet, which browsers only open right after a gesture.
function prepareCard() {
  const p = drawCard(cardData());
  S.card = { blob: p, file: null };
  p.then(b => { if (S.card?.blob === p) S.card.file = new File([b], 'speedtest-dmworks.png', { type: 'image/png' }); });
}

$('shareBtn').addEventListener('click', async () => {
  if (S.phase !== 'done') return;
  if (!S.card) prepareCard();
  const card = S.card;
  const touch = matchMedia('(pointer: coarse)').matches;

  if (touch && navigator.canShare) {
    const file = card.file || new File([await card.blob], 'speedtest-dmworks.png', { type: 'image/png' });
    if (navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file] }); return; } catch (e) { if (e.name === 'AbortError') return; }
    }
  }
  if (navigator.clipboard?.write && window.ClipboardItem) {
    try {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': card.blob })]);
      toast(t('copied'));
      return;
    } catch {}
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(await card.blob);
  a.download = 'speedtest-dmworks.png';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  toast(t('saved'));
});

let toastTimer = 0;
function toast(msg) {
  const el = $('toast');
  el.textContent = msg;
  el.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('on'), 2400);
}

applyLang();
loadNet();
