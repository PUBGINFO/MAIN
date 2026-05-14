// =======================
// 실시간 시계
// =======================
function updateClock() {
    try {
        const now = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        const format = (y, mo, d, h, m, s) =>
            `${y}.${pad(mo)}.${pad(d)} ${pad(h)}:${pad(m)}:${pad(s)}`;

        // KST = 로컬 시간 (한국 기준)
        const kstStr = format(
            now.getFullYear(), now.getMonth() + 1, now.getDate(),
            now.getHours(), now.getMinutes(), now.getSeconds()
        );

        // UTC = getUTC*() 메서드로 정확하게
        const utcStr = format(
            now.getUTCFullYear(), now.getUTCMonth() + 1, now.getUTCDate(),
            now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds()
        );

        const utcEl = document.getElementById('utc-time');
        const kstEl = document.getElementById('kst-time');
        if (utcEl) utcEl.textContent = utcStr;
        if (kstEl) kstEl.textContent = kstStr;
    } catch (e) {
        console.error("시계 오류:", e);
    }
}

setInterval(updateClock, 1000);
updateClock();

// =======================
// 공지 날짜 표시
// =======================
const noticeDateEl = document.getElementById('notice-date');
if (noticeDateEl) {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    noticeDateEl.textContent =
        `${now.getFullYear()}.${pad(now.getMonth() + 1)}.${pad(now.getDate())} 기준`;
}

// =======================
// 확률 계산기 버튼
// =======================
const probBtn = document.getElementById('btn-probability');
if (probBtn) {
    probBtn.onclick = () => {
        const url = probBtn.getAttribute('data-url');
        if (url) window.open(url, '_blank', 'noopener,noreferrer');
    };
}

// =======================
// 다크 / 라이트 토글
// =======================
const themeToggle = document.getElementById('theme-toggle');
const root = document.documentElement;

// 저장된 테마 불러오기
const savedTheme = localStorage.getItem('pubg-theme') || 'dark';
root.setAttribute('data-theme', savedTheme);
updateToggleUI(savedTheme);

themeToggle.addEventListener('click', () => {
    const current = root.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    localStorage.setItem('pubg-theme', next);
    updateToggleUI(next);
});

function updateToggleUI(theme) {
    const icon = themeToggle.querySelector('.toggle-icon');
    const label = themeToggle.querySelector('.toggle-label');
    if (theme === 'dark') {
        icon.textContent = '☀️';
        label.textContent = 'LIGHT';
    } else {
        icon.textContent = '🌙';
        label.textContent = 'DARK';
    }
}
