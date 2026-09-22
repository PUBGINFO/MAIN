const API =
  'https://pubginfo-main-access.pubginfo-kr.workers.dev';

const $ = s => document.querySelector(s);

const login = $('#login');
const app = $('#app');
const page = $('#page');
const title = $('#pageTitle');
const loginMsg = $('#loginMsg');
const adminUser = $('#adminUser');

let current = 'dashboard';
let keysCache = [];


async function api(path, options = {}) {

  const response = await fetch(
    API + path,
    {
      credentials: 'include',
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    }
  );

  let data = {};

  try {
    data = await response.json();
  } catch {}

  if (!response.ok) {
    throw new Error(
      data.message || '요청에 실패했습니다.'
    );
  }

  return data;
}


/* =========================
   로그인 상태
========================= */

async function checkSession() {

  try {

    const data =
      await api('/admin/session');

    if (data.valid) {

      adminUser.textContent =
        data.username;

      login.hidden = true;
      app.hidden = false;

      render();

      return true;
    }

  } catch {}

  login.hidden = false;
  app.hidden = true;

  return false;
}


/* =========================
   로그인
========================= */

$('#loginForm').addEventListener(
  'submit',
  async e => {

    e.preventDefault();

    loginMsg.textContent =
      '로그인 중...';

    const username =
      $('#username').value.trim();

    const password =
      $('#password').value;

    try {

      const data =
        await api(
          '/admin/login',
          {
            method: 'POST',
            body: JSON.stringify({
              username,
              password
            })
          }
        );

      adminUser.textContent =
        data.username;

      $('#password').value = '';

      login.hidden = true;
      app.hidden = false;

      loginMsg.textContent = '';

      render();

    } catch (error) {

      loginMsg.textContent =
        error.message;

    }

  }
);


/* =========================
   로그아웃
========================= */

$('#logout').addEventListener(
  'click',
  async () => {

    try {
      await api(
        '/admin/logout',
        { method: 'POST' }
      );
    } catch {}

    app.hidden = true;
    login.hidden = false;

    $('#password').value = '';

    current = 'dashboard';
  }
);


/* =========================
   페이지 렌더
========================= */

function render() {

  const titles = {
    dashboard: '대시보드',
    keys: '인증키 관리',
    logs: '접속 기록',
    admins: '관리자 관리',
    settings: '설정'
  };

  title.textContent =
    titles[current];

  document
    .querySelectorAll('nav button')
    .forEach(button => {
      button.classList.toggle(
        'active',
        button.dataset.page === current
      );
    });

  if (current === 'dashboard') {
    renderDashboard();
  }

  if (current === 'keys') {
    renderKeys();
  }

  if (current === 'logs') {
    renderLogs();
  }

  if (current === 'admins') {
    renderAdmins();
  }

  if (current === 'settings') {
    renderSettings();
  }
}


/* =========================
   대시보드
========================= */

function renderDashboard() {

  page.innerHTML = `

    <div class="cards">

      <div class="card">
        <small>전체 인증키</small>
        <strong id="totalKeys">—</strong>
      </div>

      <div class="card">
        <small>활성 인증키</small>
        <strong id="activeKeys">—</strong>
      </div>

      <div class="card">
        <small>폐기된 키</small>
        <strong id="revokedKeys">—</strong>
      </div>

      <div class="card">
        <small>관리자 세션</small>
        <strong>1</strong>
      </div>

    </div>

    <div class="grid">

      <div class="panel">

        <h2>최근 활동</h2>

        <div class="row">
          <span>시스템</span>
          <span>관리자 콘솔 연결됨</span>
        </div>

        <div class="row">
          <span>인증키</span>
          <span>기존 D1 연결됨</span>
        </div>

        <div class="row">
          <span>보안</span>
          <span class="badge">보호됨</span>
        </div>

      </div>

      <div class="panel">

        <h2>보안 상태</h2>

        <div class="row">
          <span>관리자 세션</span>
          <span class="badge">보호됨</span>
        </div>

        <div class="row">
          <span>비밀번호</span>
          <span>Cloudflare Secret</span>
        </div>

        <div class="row">
          <span>상세 요청 로그</span>
          <span>저장 안 함</span>
        </div>

      </div>

    </div>
  `;

  loadKeyStats();
}


async function loadKeyStats() {

  try {

    const data =
      await api('/admin/keys');

    const keys =
      data.keys || [];

    const now =
      Math.floor(Date.now() / 1000);

    const active =
      keys.filter(
        k =>
          !k.revoked &&
          (!k.expires_at ||
            k.expires_at > now)
      );

    const revoked =
      keys.filter(
        k => k.revoked
      );

    $('#totalKeys').textContent =
      keys.length;

    $('#activeKeys').textContent =
      active.length;

    $('#revokedKeys').textContent =
      revoked.length;

  } catch {}
}


/* =========================
   인증키
========================= */

async function renderKeys() {

  page.innerHTML = `

    <div class="section-actions">

      <button
        class="primary"
        id="issueKey"
      >
        + 인증키 발급
      </button>

      <input
        class="field"
        id="keySearch"
        placeholder="인증키 검색"
      >

    </div>

    <div
      id="newKeyBox"
      class="panel"
      hidden
    ></div>

    <div class="table-wrap">

      <table class="table">

        <thead>
          <tr>
            <th>인증키</th>
            <th>라벨</th>
            <th>상태</th>
            <th>만료일</th>
            <th>관리</th>
          </tr>
        </thead>

        <tbody id="keysBody">
          <tr>
            <td colspan="5">
              불러오는 중...
            </td>
          </tr>
        </tbody>

      </table>

    </div>
  `;

  $('#issueKey')
    .addEventListener(
      'click',
      issueKey
    );

  $('#keySearch')
    .addEventListener(
      'input',
      renderKeyRows
    );

  await loadKeys();
}


async function loadKeys() {

  try {

    const data =
      await api('/admin/keys');

    keysCache =
      data.keys || [];

    renderKeyRows();

  } catch (error) {

    $('#keysBody').innerHTML = `
      <tr>
        <td colspan="5">
          ${escapeHtml(error.message)}
        </td>
      </tr>
    `;
  }
}


function renderKeyRows() {

  const body =
    $('#keysBody');

  if (!body) return;

  const search =
    (
      $('#keySearch')?.value ||
      ''
    ).toLowerCase();

  const filtered =
    keysCache.filter(k =>
      String(k.label || '')
        .toLowerCase()
        .includes(search) ||
      String(k.key_hash || '')
        .toLowerCase()
        .includes(search)
    );

  if (!filtered.length) {

    body.innerHTML = `
      <tr>
        <td colspan="5">
          등록된 인증키가 없습니다.
        </td>
      </tr>
    `;

    return;
  }

  body.innerHTML =
    filtered.map(k => {

      const expired =
        k.expires_at &&
        k.expires_at <=
        Math.floor(Date.now() / 1000);

      let status = '활성';

      if (k.revoked) {
        status = '폐기';
      } else if (expired) {
        status = '만료';
      }

      const date =
        k.expires_at
          ? new Date(
              k.expires_at * 1000
            ).toLocaleString('ko-KR')
          : '무제한';

      return `
        <tr>

          <td>
            <code>
              ${escapeHtml(
                k.key_hash
                  .slice(0, 16) + '...'
              )}
            </code>
          </td>

          <td>
            ${escapeHtml(
              k.label || '-'
            )}
          </td>

          <td>
            <span class="badge ${
              status === '활성'
                ? ''
                : 'inactive'
            }">
              ${status}
            </span>
          </td>

          <td>
            ${date}
          </td>

          <td>

            ${
              !k.revoked
                ? `
                  <button
                    class="danger-btn"
                    onclick="revokeById(${k.id})"
                  >
                    폐기
                  </button>
                `
                : '—'
            }

          </td>

        </tr>
      `;

    }).join('');
}


async function issueKey() {

  const days =
    prompt(
      '인증키 사용 기간을 입력하세요.',
      '30'
    );

  if (days === null) return;

  const number =
    Number(days);

  if (
    !Number.isInteger(number) ||
    number < 1 ||
    number > 3650
  ) {
    alert(
      '1~3650일 사이로 입력하세요.'
    );
    return;
  }

  try {

    const data =
      await api(
        '/admin/issue',
        {
          method: 'POST',
          body: JSON.stringify({
            days: number,
            label: 'admin'
          })
        }
      );

    const box =
      $('#newKeyBox');

    box.hidden = false;

    box.innerHTML = `

      <h2>인증키가 발급되었습니다.</h2>

      <div class="generated-key">
        ${escapeHtml(data.key)}
      </div>

      <p>
        이 인증키는 다시 표시되지 않을 수 있으므로
        필요한 곳에 즉시 저장하세요.
      </p>

    `;

    await loadKeys();

  } catch (error) {

    alert(error.message);
  }
}


async function revokeById(id) {

  const item =
    keysCache.find(
      k => k.id === id
    );

  if (!item) return;

  const rawKey =
    prompt(
      '폐기할 인증키를 입력하세요.'
    );

  if (!rawKey) return;

  if (
    !confirm(
      '이 인증키를 폐기하시겠습니까?'
    )
  ) {
    return;
  }

  try {

    await api(
      '/admin/revoke',
      {
        method: 'POST',
        body: JSON.stringify({
          key: rawKey
        })
      }
    );

    alert('인증키가 폐기되었습니다.');

    await loadKeys();

  } catch (error) {

    alert(error.message);
  }
}


/* =========================
   접속 기록
========================= */

function renderLogs() {

  page.innerHTML = `

    <div class="panel">

      <h2>접속 기록</h2>

      <p class="muted-text">
        현재 설정에서는 인증키의 모든 요청을
        상세 로그로 저장하지 않습니다.
      </p>

      <div class="empty-state">
        상세 접속 로그 저장 기능은 사용하지 않음
      </div>

    </div>
  `;
}


/* =========================
   관리자
========================= */

function renderAdmins() {

  page.innerHTML = `

    <div class="panel">

      <h2>관리자 계정</h2>

      <div class="row">

        <span id="currentAdmin">
          관리자
        </span>

        <span class="badge">
          최고 관리자
        </span>

      </div>

      <p class="muted-text">
        관리자 계정은 Cloudflare 환경변수로 관리됩니다.
      </p>

      <p class="muted-text">
        마지막 로그인 시간과 관리자 접속 IP는
        저장하지 않습니다.
      </p>

    </div>
  `;
}


/* =========================
   설정
========================= */

function renderSettings() {

  page.innerHTML = `

    <div class="panel">

      <h2>보안 설정</h2>

      <div class="row">
        <span>관리자 세션 만료 시간</span>
        <span>12시간</span>
      </div>

      <div class="row">
        <span>관리자 IP 접근 제한</span>
        <span>미사용</span>
      </div>

      <div class="row">
        <span>접속 기록 보관 기간</span>
        <span>상세 로그 미사용</span>
      </div>

      <div class="row">
        <span>관리자 활동 로그</span>
        <span class="badge">
          최소화
        </span>
      </div>

      <div class="row">

        <span>
          관리자 비밀번호 변경
        </span>

        <span>
          Cloudflare Secret에서 변경
        </span>

      </div>

    </div>
  `;
}


/* =========================
   유틸
========================= */

function escapeHtml(value) {

  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}


/* =========================
   메뉴
========================= */

document
  .querySelectorAll('nav button')
  .forEach(button => {

    button.addEventListener(
      'click',
      () => {

        current =
          button.dataset.page;

        render();
      }
    );

  });


/* =========================
   시작
========================= */

checkSession();
