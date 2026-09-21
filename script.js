// =======================
// 인증키 게이트
// =======================
const AUTH_API = ''; // Same-origin Worker route


const authGate = document.getElementById('auth-gate');
const siteContent = document.getElementById('site-content');
const authForm = document.getElementById('auth-form');
const authInput = document.getElementById('access-key');
const authMessage = document.getElementById('auth-message');

function showSite() {
  document.body.classList.remove('auth-locked');
  authGate.hidden = true;
  siteContent.hidden = false;
}

function showAuthMessage(message, error = true) {
  authMessage.textContent = message;
  authMessage.dataset.state = error ? 'error' : 'success';
}

async function verifyKey(key) {
  const response = await fetch(`${AUTH_API}/auth/verify`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.valid) {
    throw new Error(data.message || '인증키가 유효하지 않습니다.');
  }
  return true;
}

async function restoreSession() {
  try {
    const response = await fetch(`${AUTH_API}/auth/session`, { credentials: 'include' });
    const data = await response.json().catch(() => ({}));
    if (response.ok && data.valid) {
      showSite();
      return true;
    }
  } catch (_) {}
  return false;
}

authForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const key = authInput.value.trim();
  if (!key) return;
  const submitButton = authForm.querySelector('button');
  submitButton.disabled = true;
  showAuthMessage('인증 중...', false);
  try {
    await verifyKey(key);
    showSite();
  } catch (error) {
    showAuthMessage(error.message || '인증에 실패했습니다.');
  } finally {
    submitButton.disabled = false;
  }
});

restoreSession().then((restored) => {
  if (!restored) authGate.hidden = false;
});

// =======================
// 테마 (시스템 감지 + 수동 토글)
// =======================
const root   = document.documentElement;
const toggle = document.getElementById('theme-toggle');
const sun    = document.getElementById('icon-sun');
const moon   = document.getElementById('icon-moon');

function applyTheme(theme) {
  root.setAttribute('data-theme', theme);
  if (theme === 'dark') {
    sun.style.display  = 'block';
    moon.style.display = 'none';
  } else {
    sun.style.display  = 'none';
    moon.style.display = 'block';
  }
}

const saved = localStorage.getItem('pubg-theme');
if (saved) {
  applyTheme(saved);
} else {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(prefersDark ? 'dark' : 'light');
}

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
  if (!localStorage.getItem('pubg-theme')) applyTheme(e.matches ? 'dark' : 'light');
});

toggle?.addEventListener('click', () => {
  const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  localStorage.setItem('pubg-theme', next);
  applyTheme(next);
});

// =======================
// 실시간 시계
// =======================
function updateClock() {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const fmt = (y, mo, d, h, m, s) =>
    `${y}.${pad(mo)}.${pad(d)} ${pad(h)}:${pad(m)}:${pad(s)}`;

  const utcEl = document.getElementById('utc-time');
  const kstEl = document.getElementById('kst-time');

  if (utcEl) utcEl.textContent = fmt(
    now.getUTCFullYear(), now.getUTCMonth()+1, now.getUTCDate(),
    now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds()
  );
  if (kstEl) kstEl.textContent = fmt(
    now.getFullYear(), now.getMonth()+1, now.getDate(),
    now.getHours(), now.getMinutes(), now.getSeconds()
  );
}
setInterval(updateClock, 1000);
updateClock();

// =======================
// 공지 날짜 (전날 기준)
// =======================
const dateEl = document.getElementById('notice-date');
if (dateEl && !dateEl.textContent.trim()) {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const pad = n => String(n).padStart(2, '0');
  dateEl.textContent =
    `${yesterday.getFullYear()}.${pad(yesterday.getMonth()+1)}.${pad(yesterday.getDate())} 기준`;
}
