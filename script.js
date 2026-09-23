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
