// ────────────────────────────────────────────────────────────
// 카카오 SDK 초기화 (앱 키를 아래에 입력하세요)
// ────────────────────────────────────────────────────────────
const KAKAO_APP_KEY = 'b80f2d95ba7e522d696f884635837c5c';
if (typeof Kakao !== 'undefined' && !Kakao.isInitialized()) {
    Kakao.init(KAKAO_APP_KEY);
}

let platform = 'ios', mode = 'price';

// ── 패키지 데이터 ─────────────────────────────────────────────
// baseUC  : 누적 충전 이벤트 달성 기준 UC (보너스 제외 기본 지급 UC)
// bonusUC : 패키지 자체 보너스 UC
// totalUC : baseUC + bonusUC (실제 지급량)
// label   : 인게임 공식 상품명과 동일하게 표기
const data = {
    ios: [
        { price:1100,   baseUC:60,   bonusUC:0,    totalUC:60,   label:'60 UC' },
        { price:4400,   baseUC:180,  bonusUC:10,   totalUC:190,  label:'180 UC + 10 UC 보너스' },
        { price:14000,  baseUC:600,  bonusUC:60,   totalUC:660,  label:'600 UC + 60 UC 보너스' },
        { price:33000,  baseUC:1500, bonusUC:300,  totalUC:1800, label:'1,500 UC + 300 UC 보너스' },
        { price:66000,  baseUC:2950, bonusUC:900,  totalUC:3850, label:'2,950 UC + 900 UC 보너스' },
        { price:149000, baseUC:5900, bonusUC:2200, totalUC:8100, label:'5,900 UC + 2,200 UC 보너스' }
    ],
    android: [
        { price:1100,   baseUC:60,   bonusUC:0,    totalUC:60,   label:'60 UC' },
        { price:3300,   baseUC:180,  bonusUC:10,   totalUC:190,  label:'180 UC + 10 UC 보너스' },
        { price:11000,  baseUC:600,  bonusUC:60,   totalUC:660,  label:'600 UC + 60 UC 보너스' },
        { price:27500,  baseUC:1500, bonusUC:300,  totalUC:1800, label:'1,500 UC + 300 UC 보너스' },
        { price:55000,  baseUC:2950, bonusUC:900,  totalUC:3850, label:'2,950 UC + 900 UC 보너스' },
        { price:110000, baseUC:5900, bonusUC:2200, totalUC:8100, label:'5,900 UC + 2,200 UC 보너스' }
    ],
    midasbuy: [
        { price:1100,   baseUC:60,   bonusUC:0,    totalUC:60,   label:'60 UC' },
        { price:3300,   baseUC:180,  bonusUC:15,   totalUC:195,  label:'180 UC + 15 UC 보너스' },
        { price:11000,  baseUC:600,  bonusUC:80,   totalUC:680,  label:'600 UC + 80 UC 보너스' },
        { price:27500,  baseUC:1500, bonusUC:350,  totalUC:1850, label:'1,500 UC + 350 UC 보너스' },
        { price:55000,  baseUC:2950, bonusUC:1000, totalUC:3950, label:'2,950 UC + 1,000 UC 보너스' },
        { price:110000, baseUC:5900, bonusUC:2400, totalUC:8300, label:'5,900 UC + 2,400 UC 보너스' }
    ]
};

// ── iOS 누적 충전 보너스 (baseUC 합계 기준) ──────────────────
function getBonus(baseUC, on) {
    if (!on) return 0;
    let b = 0;
    if (baseUC >= 1000) b += 450;
    if (baseUC >= 2000) b += 450;
    if (baseUC >= 3000) b += 450;
    for (let i = 5000; i <= 39000; i += 2000) {
        if (baseUC >= i) b += 900; else break;
    }
    return b;
}

// ── DP 빌더: baseUC 기준 인덱싱, Fix1(동가격→더많은UC) 적용 ──
function buildMinCostDP(pkgs, maxBaseUC) {
    const dp      = new Array(maxBaseUC + 1).fill(Infinity);
    const dpTotal = new Array(maxBaseUC + 1).fill(0);
    const ch      = new Array(maxBaseUC + 1).fill(-1);
    dp[0] = 0; dpTotal[0] = 0;

    for (let i = 0; i < pkgs.length; i++) {
        for (let j = pkgs[i].baseUC; j <= maxBaseUC; j++) {
            const prev = dp[j - pkgs[i].baseUC];
            if (prev === Infinity) continue;
            const newCost  = prev + pkgs[i].price;
            const newTotal = dpTotal[j - pkgs[i].baseUC] + pkgs[i].totalUC;
            if (newCost < dp[j] || (newCost === dp[j] && newTotal > dpTotal[j])) {
                dp[j]      = newCost;
                dpTotal[j] = newTotal;
                ch[j]      = i;
            }
        }
    }
    return { dp, dpTotal, ch };
}

// ── 역추적 ────────────────────────────────────────────────────
function traceback(ch, pkgs, startValue, key = 'baseUC') {
    const counts = new Array(pkgs.length).fill(0);
    let tmp = startValue;
    while (tmp > 0 && ch[tmp] !== -1) {
        const idx = ch[tmp];
        counts[idx]++;
        tmp -= pkgs[idx][key];
    }
    return counts;
}

// ── 패키지 목록 텍스트 ───────────────────────────────────────
function pkgListText(counts, pkgs) {
    return counts.map((c, i) => c > 0 ? `${pkgs[i].label} × ${c}` : '').filter(Boolean).join('\n');
}

// ── 클립보드 복사 ─────────────────────────────────────────────
function copyResult(text) {
    navigator.clipboard.writeText(text).then(() => {
        const btn = document.getElementById('copyBtn');
        if (!btn) return;
        btn.textContent = '✓ 복사됨!';
        btn.style.background = '#22c55e';
        setTimeout(() => { btn.textContent = '텍스트 복사'; btn.style.background = ''; }, 2000);
    }).catch(() => {
        const ta = document.createElement('textarea');
        ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        alert('클립보드에 복사되었습니다!');
    });
}

// ── 카카오 공유 ───────────────────────────────────────────────
function shareKakao(title, desc) {
    // 1. 버튼을 누른 시점에 카카오 SDK가 있는지, 초기화가 안 되어 있다면 여기서 초기화 진행
    if (typeof Kakao !== 'undefined') {
        if (!Kakao.isInitialized()) {
            const KAKAO_APP_KEY = 'b80f2d95ba7e522d696f884635837c5c'; // 여기에 JavaScript 키 유지
            Kakao.init(KAKAO_APP_KEY);
            console.log("카카오 SDK가 버튼 클릭 시점에 성공적으로 초기화되었습니다:", Kakao.isInitialized());
        }
    } else {
        alert('카카오 SDK 라이브러리가 아직 로드되지 않았습니다. 잠시 후 다시 시도해 주세요.');
        return;
    }

    // 2. 초기화 확인 후 공유하기 실행
    if (!Kakao.isInitialized()) {
        alert('카카오 앱 키 인증에 실패했습니다. 키를 다시 확인해 주세요.');
        return;
    }

    Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
            title: title,
            description: desc,
            imageUrl: 'https://github.com/user-attachments/assets/08890d07-42a2-4c4a-a8b7-06d15a9a7c33',
            link: { mobileWebUrl: 'https://pubginfo.site', webUrl: 'https://pubginfo.site' }
        },
        buttons: [{ title: '계산기 바로가기', link: { mobileWebUrl: 'https://pubginfo.site', webUrl: 'https://pubginfo.site' } }]
    });
}

// ── 공유 버튼 HTML 생성 ───────────────────────────────────────
function shareButtonsHTML(copyText, kakaoTitle, kakaoDesc) {
    return `<div class="share-buttons">
        <button class="btn-share btn-kakao" onclick='shareKakao(${JSON.stringify(kakaoTitle)}, ${JSON.stringify(kakaoDesc)})'>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3C6.477 3 2 6.477 2 11c0 2.757 1.428 5.185 3.6 6.713L4.5 21l4.2-2.1A10.5 10.5 0 0 0 12 19c5.523 0 10-3.477 10-8S17.523 3 12 3z"/></svg>
            카카오톡 공유
        </button>
        <button class="btn-share btn-copy" id="copyBtn" onclick='copyResult(${JSON.stringify(copyText)})'>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            텍스트 복사
        </button>
    </div>`;
}

// ── 페이지 전환 ───────────────────────────────────────────────
function showPage(showId, hideId, animClass) {
    const s = document.getElementById(showId);
    const h = document.getElementById(hideId);
    if (h) h.classList.add('hidden');
    if (s) {
        s.classList.remove('hidden', 'anim-up', 'anim-down');
        void s.offsetWidth;
        s.classList.add(animClass);
    }
}

function selectOS(os) {
    platform = os; mode = 'price';
    resetResult();
    document.getElementById('useBonus').checked = true;
    document.getElementById('tabPrice').classList.add('active');
    document.getElementById('tabUC').classList.remove('active');
    document.getElementById('inputLabel').textContent = '필요한 UC를 입력하세요';
    document.getElementById('mainInput').placeholder = '예: 12000';
    document.getElementById('ownedUC').value = '';
    document.getElementById('mainTitle').innerHTML = 'UC 최저가 계산기 <span class="title-badge">BETA</span>';

    const bonusRow = document.getElementById('bonusRow');
    if (bonusRow) bonusRow.style.display = os === 'ios' ? 'flex' : 'none';

    // 보유UC 입력 표시: 최저가 모드에서만
    document.getElementById('ownedUCGroup').style.display = mode === 'price' ? 'block' : 'none';

    const verMap = { ios: 'v4.0 (iOS)', android: 'v4.0 (Android)', midasbuy: 'v4.0 (MidasBuy)' };
    document.getElementById('versionTag').textContent = verMap[os];
    document.body.className = platform + ' mode-' + mode;

    showPage('calcPage', 'welcomePage', 'anim-up');
    setTimeout(() => updateMSlider(), 300);
    setTimeout(() => document.getElementById('mainInput').focus(), 480);
}

function goBack() {
    document.body.className = '';
    document.getElementById('versionTag').textContent = 'v4.0';
    showPage('welcomePage', 'calcPage', 'anim-down');
}

function updateMSlider() {
    const s = document.getElementById('mSlider');
    const t = document.getElementById(mode === 'price' ? 'tabPrice' : 'tabUC');
    if (s && t && t.offsetWidth > 0) {
        s.style.left  = (t.offsetLeft - 4) + 'px';
        s.style.width = t.offsetWidth + 'px';
    }
}

function setMode(m) {
    if (mode === m) return;
    mode = m; resetResult();
    document.body.className = platform + ' mode-' + mode;
    document.getElementById('tabPrice').classList.toggle('active', m === 'price');
    document.getElementById('tabUC').classList.toggle('active', m === 'uc');
    document.getElementById('inputLabel').textContent = m === 'price' ? '필요한 UC를 입력하세요' : '보유 예산을 입력하세요 (원)';
    document.getElementById('mainInput').placeholder  = m === 'price' ? '예: 12000' : '예: 50000';
    document.getElementById('mainTitle').innerHTML    = (m === 'price' ? 'UC 최저가 계산기' : 'UC 예산 계산기') + ' <span class="title-badge">BETA</span>';
    // 보유UC 입력: 최저가 모드에서만 표시
    document.getElementById('ownedUCGroup').style.display = m === 'price' ? 'block' : 'none';
    setTimeout(updateMSlider, 10);
    document.getElementById('mainInput').focus();
}

function resetResult() {
    const r = document.getElementById('result');
    if (r) { r.classList.remove('show'); r.innerHTML = ''; }
    const inp = document.getElementById('mainInput');
    if (inp) inp.value = '';
}

function handleEnterKey(e) { if (e.key === 'Enter') calculate(); }
function calculate() { mode === 'price' ? calcMinPrice() : calcMaxUC(); }

// ════════════════════════════════════════════════════════════
// 모드 A: UC 입력 → 최저가
// ════════════════════════════════════════════════════════════
function calcMinPrice() {
    const resultDiv = document.getElementById('result');
    const btn       = document.getElementById('calculateBtn');
    const bonusOn   = platform === 'ios' && document.getElementById('useBonus').checked;

    const targetUCRaw = parseInt(document.getElementById('mainInput').value) || 0;
    const ownedUC     = parseInt(document.getElementById('ownedUC').value)   || 0;
    const targetUC    = targetUCRaw - ownedUC;

    if (targetUCRaw <= 0) return;

    // 보유 UC가 이미 충분한 경우
    if (targetUC <= 0) {
        resultDiv.innerHTML = `<div class="already-enough">
            ✅ 이미 충분한 UC를 보유하고 있습니다.<br>
            <span style="font-size:0.82rem;color:#9ca3af;">보유 UC: ${ownedUC.toLocaleString()} / 목표 UC: ${targetUCRaw.toLocaleString()}</span>
        </div>`;
        resultDiv.classList.add('show');
        return;
    }

    btn.innerHTML = '<span class="loading"></span> 계산중...'; btn.disabled = true;

    setTimeout(() => {
        const pkgs    = data[platform];
        const maxBase = Math.max(...pkgs.map(p => p.baseUC));
        // 올림 추천을 위해 15% 더 넓게 탐색
        const searchMax = Math.ceil(targetUC * 1.15) + maxBase * 2;

        const { dp, dpTotal, ch } = buildMinCostDP(pkgs, searchMax);

        // ── 메인 최저가 탐색 ─────────────────────────────────
        let bestPrice = Infinity, bestBaseUC = 0, bestEffective = 0;
        for (let b = 0; b <= searchMax; b++) {
            if (dp[b] === Infinity) continue;
            const eff = dpTotal[b] + (bonusOn ? getBonus(b, true) : 0);
            if (eff < targetUC) continue;
            if (dp[b] < bestPrice || (dp[b] === bestPrice && eff > bestEffective)) {
                bestPrice     = dp[b];
                bestBaseUC    = b;
                bestEffective = eff;
            }
        }

        if (bestPrice === Infinity) {
            resultDiv.innerHTML = '<p style="color:#f87171;text-align:center;padding:12px;">계산 가능한 조합을 찾지 못했습니다.</p>';
            resultDiv.classList.add('show');
            btn.innerHTML = '계산하기'; btn.disabled = false;
            return;
        }

        const bestCounts  = traceback(ch, pkgs, bestBaseUC, 'baseUC');
        const bestPkgUC   = dpTotal[bestBaseUC];
        const bestBonus   = bonusOn ? getBonus(bestBaseUC, true) : 0;
        const bestFinalUC = bestPkgUC + bestBonus;

        // ── 올림 가성비 추천 탐색 ────────────────────────────
        // 기준: 추가비용 ≤ max(5000, bestPrice*8%) 이내에서
        //        UC가 300 이상 더 많은 조합 탐색
        const extraCostLimit = Math.max(5000, Math.round(bestPrice * 0.08));
        let recoPrice = Infinity, recoBaseUC = 0, recoEffective = 0;

        for (let b = bestBaseUC + 1; b <= searchMax; b++) {
            if (dp[b] === Infinity) continue;
            const eff      = dpTotal[b] + (bonusOn ? getBonus(b, true) : 0);
            const extraCost = dp[b] - bestPrice;
            const extraUC   = eff - bestFinalUC;
            if (extraCost > extraCostLimit) continue;
            if (extraUC < 300) continue; // 의미 있는 차이만
            if (dp[b] < recoPrice || (dp[b] === recoPrice && eff > recoEffective)) {
                recoPrice     = dp[b];
                recoBaseUC    = b;
                recoEffective = eff;
            }
        }

        const hasReco = recoPrice !== Infinity && recoPrice !== bestPrice;

        // ── 결과 HTML 빌드 ───────────────────────────────────
        const bonusLine = bonusOn
            ? `<span style="font-size:0.78rem;">(기본 ${bestBaseUC.toLocaleString()} + 패키지보너스 ${(bestPkgUC - bestBaseUC).toLocaleString()} + 누적보너스 ${bestBonus.toLocaleString()})</span>`
            : `<span style="font-size:0.78rem;">패키지 보너스 포함</span>`;

        // 보유 UC 표시
        const ownedLine = ownedUC > 0
            ? `<div class="owned-deduct">보유 UC ${ownedUC.toLocaleString()} 차감 후 ${targetUC.toLocaleString()} UC 필요</div>`
            : '';

        let pkgRows = '';
        bestCounts.forEach((c, i) => {
            if (c > 0) pkgRows += `<div class="package-item">
                <span>${pkgs[i].price.toLocaleString()}원 · ${pkgs[i].label}</span>
                <span class="pkg-count">× ${c}</span>
            </div>`;
        });

        // 클립보드 / 카카오 텍스트
        const copyText  = `[PUBG MOBILE UC 계산 결과]\n총 결제 금액: ${bestPrice.toLocaleString()}원\n추천 조합:\n${pkgListText(bestCounts, pkgs)}\n총 획득 UC: ${bestFinalUC.toLocaleString()} UC\n\npubginfo.site`;
        const kakaoTitle = `PUBG UC 최저가: ${bestPrice.toLocaleString()}원`;
        const kakaoDesc  = `총 ${bestFinalUC.toLocaleString()} UC 획득 · pubginfo.site`;

        let html = `<h3>최적 구매 방법</h3>
            ${ownedLine}
            <div class="price-highlight">${bestPrice.toLocaleString()}원</div>
            <div class="sub-info">획득 UC: <strong>${bestFinalUC.toLocaleString()}</strong><br>${bonusLine}</div>
            ${pkgRows}`;

        // 추천 카드
        if (hasReco) {
            const recoCounts  = traceback(ch, pkgs, recoBaseUC, 'baseUC');
            const recoPkgUC   = dpTotal[recoBaseUC];
            const recoBonus   = bonusOn ? getBonus(recoBaseUC, true) : 0;
            const recoFinalUC = recoPkgUC + recoBonus;
            const extraCost   = recoPrice - bestPrice;
            const extraUC     = recoFinalUC - bestFinalUC;

            let recoPkgRows = '';
            recoCounts.forEach((c, i) => {
                if (c > 0) recoPkgRows += `<div class="package-item reco-pkg">
                    <span>${pkgs[i].price.toLocaleString()}원 · ${pkgs[i].label}</span>
                    <span class="pkg-count">× ${c}</span>
                </div>`;
            });

            const recoCopyText = `[PUBG MOBILE UC 추천 조합]\n총 결제 금액: ${recoPrice.toLocaleString()}원\n추천 조합:\n${pkgListText(recoCounts, pkgs)}\n총 획득 UC: ${recoFinalUC.toLocaleString()} UC\n\npubginfo.site`;

            html += `<div class="recommend-card">
                <div class="recommend-header">
                    💡 기왕 살 거면 이 조합이 훨씬 이득!
                </div>
                <div class="recommend-body">
                    <span class="reco-tag">+${extraCost.toLocaleString()}원만 더 보태면</span>
                    <strong>+${extraUC.toLocaleString()} UC</strong>를 추가로 받을 수 있어요
                </div>
                <div class="recommend-price">${recoPrice.toLocaleString()}원 → <strong>${recoFinalUC.toLocaleString()} UC</strong></div>
                ${recoPkgRows}
                ${shareButtonsHTML(recoCopyText, `PUBG UC 추천: ${recoPrice.toLocaleString()}원`, `총 ${recoFinalUC.toLocaleString()} UC 획득 · pubginfo.site`)}
            </div>`;
        }

        html += shareButtonsHTML(copyText, kakaoTitle, kakaoDesc);

        resultDiv.innerHTML = html;
        resultDiv.classList.add('show');
        btn.innerHTML = '계산하기'; btn.disabled = false;
    }, 300);
}

// ════════════════════════════════════════════════════════════
// 모드 B: 예산 입력 → 최대 UC
// ════════════════════════════════════════════════════════════
function calcMaxUC() {
    const resultDiv = document.getElementById('result');
    const btn       = document.getElementById('calculateBtn');
    const bonusOn   = platform === 'ios' && document.getElementById('useBonus').checked;
    const budget    = parseInt(document.getElementById('mainInput').value);
    if (isNaN(budget) || budget <= 0) return;

    btn.innerHTML = '<span class="loading"></span> 계산중...'; btn.disabled = true;

    setTimeout(() => {
        const pkgs = data[platform];

        const dp     = new Array(budget + 1).fill(-1);
        const dpBase = new Array(budget + 1).fill(0);
        const ch     = new Array(budget + 1).fill(-1);
        dp[0] = 0;

        for (let i = 0; i < pkgs.length; i++) {
            for (let j = pkgs[i].price; j <= budget; j++) {
                if (dp[j - pkgs[i].price] === -1) continue;
                const candTotal = dp[j - pkgs[i].price] + pkgs[i].totalUC;
                const candBase  = dpBase[j - pkgs[i].price] + pkgs[i].baseUC;
                if (candTotal > dp[j]) {
                    dp[j] = candTotal; dpBase[j] = candBase; ch[j] = i;
                }
            }
        }

        let bestTotal = 0, bestCost = 0, bestPkgUC = 0, bestBaseUC = 0;
        for (let c = 0; c <= budget; c++) {
            if (dp[c] === -1) continue;
            const bonus = bonusOn ? getBonus(dpBase[c], true) : 0;
            const total = dp[c] + bonus;
            if (total > bestTotal || (total === bestTotal && c < bestCost)) {
                bestTotal = total; bestCost = c; bestPkgUC = dp[c]; bestBaseUC = dpBase[c];
            }
        }

        if (bestTotal === 0) {
            resultDiv.innerHTML = '<p style="color:#f87171;text-align:center;padding:12px;">예산이 부족합니다.</p>';
            resultDiv.classList.add('show');
            btn.innerHTML = '계산하기'; btn.disabled = false;
            return;
        }

        const counts  = traceback(ch, pkgs, bestCost, 'price');
        const bonus   = bonusOn ? getBonus(bestBaseUC, true) : 0;
        const remain  = budget - bestCost;
        const bonusLine = bonusOn
            ? `<span style="font-size:0.78rem;">(패키지 ${bestPkgUC.toLocaleString()} UC + 누적보너스 ${bonus.toLocaleString()} UC)</span>`
            : `<span style="font-size:0.78rem;">패키지 보너스 포함</span>`;

        let pkgRows = '';
        counts.forEach((c, i) => {
            if (c > 0) pkgRows += `<div class="package-item">
                <span>${pkgs[i].price.toLocaleString()}원 · ${pkgs[i].label}</span>
                <span class="pkg-count">× ${c}</span>
            </div>`;
        });

        const copyText  = `[PUBG MOBILE UC 계산 결과]\n예산: ${budget.toLocaleString()}원\n사용 금액: ${bestCost.toLocaleString()}원\n구매 조합:\n${pkgListText(counts, pkgs)}\n총 획득 UC: ${bestTotal.toLocaleString()} UC\n\npubginfo.site`;
        const kakaoTitle = `PUBG UC 최대 획득: ${bestTotal.toLocaleString()} UC`;
        const kakaoDesc  = `${bestCost.toLocaleString()}원으로 최대 UC · pubginfo.site`;

        let html = `<h3>최대 UC 획득 방법</h3>
            <div class="price-highlight">${bestTotal.toLocaleString()} UC</div>
            <div class="sub-info">사용: <strong>${bestCost.toLocaleString()}원</strong> / ${budget.toLocaleString()}원<br>${bonusLine}<br>
            ${remain > 0 ? `<span style="color:#6b7280;">잔여: ${remain.toLocaleString()}원</span>` : ''}</div>
            ${pkgRows}
            ${shareButtonsHTML(copyText, kakaoTitle, kakaoDesc)}`;

        resultDiv.innerHTML = html;
        resultDiv.classList.add('show');
        btn.innerHTML = '계산하기'; btn.disabled = false;
    }, 300);
}
