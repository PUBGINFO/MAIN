const $ = s => document.querySelector(s);
const login = $('#login'), app = $('#app'), page = $('#page'), title = $('#pageTitle');
let current = 'dashboard';
function render() {
title.textContent = {
dashboard: '대시보드',
keys: '인증키 관리',
logs: '접속 기록',
admins: '관리자 관리',
settings: '설정'
}[current];
document.querySelectorAll('nav button').forEach(b => b.classList.toggle('active', b.dataset.page === current));
const views = {
dashboard: ⁠<div class="cards"> <div class="card"><small>전체 인증키</small><strong>—</strong></div> <div class="card"><small>활성 인증키</small><strong>—</strong></div> <div class="card"><small>오늘 접속</small><strong>—</strong></div> <div class="card"><small>폐기된 키</small><strong>—</strong></div> </div> <div class="grid"> <div class="panel"> <h2>최근 활동</h2> <div class="row"><span>시스템</span><span>관리자 대시보드 정상 로드됨</span></div> <div class="row"><span>보안</span><span>관리자 전용 세션 보호 활성화</span></div> </div> <div class="panel"> <h2>보안 상태</h2> <div class="row"><span>관리자 세션 쿠키</span><span class="badge">보호됨</span></div> <div class="row"><span>IP 공개 범위</span><span>관리자만 조회 가능</span></div> </div> </div>⁠,
keys: ⁠<div class="section-actions"> <button class="primary" onclick="alert('백엔드 연동 후 인증키 발급이 가능합니다.')">+ 인증키 발급</button> <input class="field" placeholder="인증키 검색"> </div> <div class="table-wrap"> <table class="table"> <tr><th>인증키</th><th>상태</th><th>만료일</th><th>마지막 접속</th><th>관리</th></tr> <tr><td>백엔드 API 연결 대기 중</td><td>—</td><td>—</td><td>—</td><td>—</td></tr> </table> </div>⁠,
logs: ⁠<div class="section-actions"> <input class="field" placeholder="IP 주소 / 인증키 검색"> <input class="field" type="date"> </div> <div class="table-wrap"> <table class="table"> <tr><th>시간</th><th>IP 주소 (관리자 전용)</th><th>접속 경로</th><th>결과</th><th>기기 환경</th></tr> <tr><td>—</td><td>관리자 권한 확인됨</td><td>—</td><td>—</td><td>—</td></tr> </table> </div>⁠,
admins: ⁠<div class="panel"> <h2>관리자 계정 목록</h2> <div class="row"><span>admin</span><span class="badge">최고 관리자</span></div> <p style="color:var(--muted);font-size:13px;margin-top:14px">추가 관리자 계정 생성 및 권한 설정은 Cloudflare 환경변수 또는 DB에서 제어됩니다.</p> </div>⁠,
settings: ⁠<div class="panel"> <h2>보안 설정</h2> <div class="row"><span>관리자 세션 만료 시간</span><span>12시간 (기본)</span></div> <div class="row"><span>관리자 IP 접근 제한</span><span class="badge">선택 기능</span></div> <div class="row"><span>접속 기록 보관 기간</span><span>30일</span></div> <div class="row"><span>관리자 활동 로그</span><span class="badge">사용 중</span></div> <div class="row"><span>관리자 비밀번호 변경</span><button class="field" onclick="alert('Cloudflare Secret 설정을 통해 변경할 수 있습니다.')">비밀번호 변경</button></div> </div>⁠
};
page.innerHTML = views[current];
}
$('#loginForm').addEventListener('submit', e => {
e.preventDefault();
const user = $('#username').value.trim();
const pass = $('#password').value;
if (user === 'admin' && pass) {
// 실제 운영 시에는 백엔드 /admin/login 등을 통해 검증합니다.
login.hidden = true;
app.hidden = false;
render();
} else {
$('#loginMsg').textContent = '아이디 또는 비밀번호를 확인하세요.';
}
});
document.querySelectorAll('nav button').forEach(b => b.addEventListener('click', () => {
current = b.dataset.page;
render();
}));
$('#logout').addEventListener('click', () => {
app.hidden = true;
login.hidden = false;
$('#password').value = '';
});
render();
