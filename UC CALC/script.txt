let platform = 'ios', mode = 'price';

// baseUC  : 누적 충전 이벤트 달성 기준 UC (보너스 제외 기본 지급 UC)
// bonusUC : 패키지 자체 보너스 UC
// totalUC : baseUC + bonusUC (실제 지급량)
const data = {
    ios: [
        { price:1100,   baseUC:60,   bonusUC:0,    totalUC:60,   label:'60 UC' },
        { price:4400,   baseUC:180,  bonusUC:10,   totalUC:190,  label:'190 UC' },
        { price:14000,  baseUC:600,  bonusUC:60,   totalUC:660,  label:'660 UC' },
        { price:33000,  baseUC:1500, bonusUC:300,  totalUC:1800, label:'1,800 UC' },
        { price:66000,  baseUC:2950, bonusUC:900,  totalUC:3850, label:'3,850 UC' },
        { price:149000, baseUC:5900, bonusUC:2200, totalUC:8100, label:'8,100 UC' }
    ],
    android: [
        { price:1100,   baseUC:60,   bonusUC:0,    totalUC:60,   label:'60 UC' },
        { price:3300,   baseUC:180,  bonusUC:10,   totalUC:190,  label:'180 + 10 UC' },
        { price:11000,  baseUC:600,  bonusUC:60,   totalUC:660,  label:'600 + 60 UC' },
        { price:27500,  baseUC:1500, bonusUC:300,  totalUC:1800, label:'1,500 + 300 UC' },
        { price:55000,  baseUC:2950, bonusUC:900,  totalUC:3850, label:'2,950 + 900 UC' },
        { price:110000, baseUC:5900, bonusUC:2200, totalUC:8100, label:'5,900 + 2,200 UC' }
    ],
    midasbuy: [
        { price:1100,   baseUC:60,   bonusUC:0,    totalUC:60,   label:'60 UC' },
        { price:3300,   baseUC:180,  bonusUC:15,   totalUC:195,  label:'180 + 15 UC' },
        { price:11000,  baseUC:600,  bonusUC:80,   totalUC:680,  label:'600 + 80 UC' },
        { price:27500,  baseUC:1500, bonusUC:350,  totalUC:1850, label:'1,500 + 350 UC' },
        { price:55000,  baseUC:2950, bonusUC:1000, totalUC:3950, label:'2,950 + 1,000 UC' },
        { price:110000, baseUC:5900, bonusUC:2400, totalUC:8300, label:'5,900 + 2,400 UC' }
    ]
};

// iOS 누적 충전 보너스 — baseUC 합계 기준으로 계산
function getBonus(baseUC, on) {
    if (!on) return 0;
    let b = 0;
    if (baseUC >= 1000)  b += 450;
    if (baseUC >= 2000)  b += 450;
    if (baseUC >= 3000)  b += 450;
    for (let i = 5000; i <= 39000; i += 2000) {
        if (baseUC >= i) b += 900; else break;
    }
    return b;
}

// ── DP 빌더 (baseUC 기준 인덱싱) ─────────────────────────────
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

// 역추적 함수: key 매개변수를 추가하여 모드별로 baseUC 또는 price 기준으로 유연하고 안전하게 차감 (무한루프 방지)
function traceback(ch, pkgs, startValue, key = 'baseUC') {
    const counts = new Array(pkgs.length).fill(0);
    let tmp = startValue;
    while (tmp > 0 && ch[tmp] !== -1) {
        const pkgIdx = ch[tmp];
        counts[pkgIdx]++;
        tmp -= pkgs[pkgIdx][key];
    }
    return counts;
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
    document.getElementById('result').classList.remove('show');
    document.getElementById('result').innerHTML = '';
    document.getElementById('mainInput').value = '';
    document.getElementById('useBonus').checked = true;
    document.getElementById('tabPrice').classList.add('active');
    document.getElementById('tabUC').classList.remove('active');
    document.getElementById('inputLabel').textContent = '필요한 UC를 입력하세요';
    document.getElementById('mainInput').placeholder = '예: 12000';
    document.getElementById('mainTitle').innerHTML = 'UC 최저가 계산기 <span class="title-badge">BETA</span>';
    
    // 🛠️ 첫 화면 멈춤 버그 수정: index.html에 정의된 소문자 'bonusrow' ID와 안전하게 매칭되도록 보정
    const bonusRow = document.getElementById('bonusRow') || document.getElementById('bonusrow');
    if (bonusRow) {
        bonusRow.style.display = os === 'ios' ? 'flex' : 'none';
    }
    
    const verMap = { ios: 'v3.4 (iOS)', android: 'v3.4 (Android)', midasbuy: 'v3.4 (MidasBuy)' };
    document.getElementById('versionTag').textContent = verMap[os];
    document.body.className = platform + ' mode-' + mode;
    
    // 페이지 먼저 로드
    showPage('calcPage', 'welcomePage', 'anim-up');
    
    // 🛠️ 랜더링과 애니메이션이 끝난 후 너비를 안전하게 계산하도록 에러 안전장치 적용 및 타이밍 조절
    setTimeout(() => updateMSlider(), 300);
    setTimeout(() => document.getElementById('mainInput').focus(), 480);
}

function goBack() {
    document.body.className = '';
    document.getElementById('versionTag').textContent = 'v3.4';
    showPage('welcomePage', 'calcPage', 'anim-down');
}

function updateMSlider() {
    const s = document.getElementById('mSlider');
    const t = document.getElementById(mode === 'price' ? 'tabPrice' : 'tabUC');
    // 🛠️ 엘리먼트가 존재하고 레이아웃 측정이 가능한 상태일 때만 스타일 계산 수행
    if (s && t && t.offsetWidth > 0) {
        s.style.left = (t.offsetLeft - 4) + 'px';
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
    setTimeout(updateMSlider, 10);
    document.getElementById('mainInput').focus();
}

function resetResult() {
    const r = document.getElementById('result');
    if (r) { r.classList.remove('show'); r.innerHTML = ''; }
    document.getElementById('mainInput').value = '';
}

function handleEnterKey(e) { if (e.key === 'Enter') calculate(); }
function calculate() { mode === 'price' ? calcMinPrice() : calcMaxUC(); }

// ── 모드 A: UC 입력 → 최저가 ─────────────────────────────────
function calcMinPrice() {
    const input     = document.getElementById('mainInput');
    const resultDiv = document.getElementById('result');
    const btn       = document.getElementById('calculateBtn');
    const bonusOn   = platform === 'ios' && document.getElementById('useBonus').checked;
    const targetUC  = parseInt(input.value);
    if (isNaN(targetUC) || targetUC <= 0) return;

    btn.innerHTML = '<span class="loading"></span> 계산중...'; btn.disabled = true;

    setTimeout(() => {
        const pkgs      = data[platform];
        const maxBase   = Math.max(...pkgs.map(p => p.baseUC));
        const searchMax = targetUC + maxBase * 3; 

        const { dp, dpTotal, ch } = buildMinCostDP(pkgs, searchMax);

        let bestPrice = Infinity, bestBaseUC = 0, bestEffective = 0;
        for (let b = 0; b <= searchMax; b++) {
            if (dp[b] === Infinity) continue;
            const effective = dpTotal[b] + (bonusOn ? getBonus(b, true) : 0);
            if (effective < targetUC) continue;
            if (dp[b] < bestPrice || (dp[b] === bestPrice && effective > bestEffective)) {
                bestPrice     = dp[b];
                bestBaseUC    = b;
                bestEffective = effective;
            }
        }

        if (bestPrice === Infinity) {
            resultDiv.innerHTML = '<p style="color:#f87171;text-align:center;">계산 가능한 조합을 찾지 못했습니다.</p>';
            resultDiv.classList.add('show');
            btn.innerHTML = '계산하기'; btn.disabled = false;
            return;
        }

        const counts    = traceback(ch, pkgs, bestBaseUC, 'baseUC');
        const pkgTotal  = dpTotal[bestBaseUC];                         
        const bonus     = bonusOn ? getBonus(bestBaseUC, true) : 0;   
        const finalUC   = pkgTotal + bonus;
        const bonusLine = bonusOn
            ? `<span style="font-size:0.8rem;">(기본 ${bestBaseUC.toLocaleString()} + 패키지보너스 ${(pkgTotal - bestBaseUC).toLocaleString()} + 누적보너스 ${bonus.toLocaleString()})</span>`
            : `<span style="font-size:0.8rem;">패키지 보너스 포함 금액</span>`;

        let html = `<h3>최적 구매 방법</h3>
            <div class="price-highlight">${bestPrice.toLocaleString()}원</div>
            <div class="sub-info">획득 UC: <strong>${finalUC.toLocaleString()}</strong><br>${bonusLine}</div>`;
        counts.forEach((c, i) => {
            if (c > 0) html += `<div class="package-item"><span>${pkgs[i].price.toLocaleString()}원 (${pkgs[i].label})</span><span style="font-weight:700;">× ${c}</span></div>`;
        });

        resultDiv.innerHTML = html; resultDiv.classList.add('show');
        btn.innerHTML = '계산하기'; btn.disabled = false;
    }, 300);
}

// ── 모드 B: 예산 입력 → 최대 UC ──────────────────────────────
function calcMaxUC() {
    const input     = document.getElementById('mainInput');
    const resultDiv = document.getElementById('result');
    const btn       = document.getElementById('calculateBtn');
    const bonusOn   = platform === 'ios' && document.getElementById('useBonus').checked;
    const budget    = parseInt(input.value);
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
                    dp[j]     = candTotal;
                    dpBase[j] = candBase;
                    ch[j]     = i;
                }
            }
        }

        let bestTotal = 0, bestCost = 0, bestPkgUC = 0, bestBaseUC = 0;
        for (let c = 0; c <= budget; c++) {
            if (dp[c] === -1) continue;
            const bonus = bonusOn ? getBonus(dpBase[c], true) : 0;
            const total = dp[c] + bonus;
            if (total > bestTotal || (total === bestTotal && c < bestCost)) {
                bestTotal  = total;
                bestCost   = c;
                bestPkgUC  = dp[c];
                bestBaseUC = dpBase[c];
            }
        }

        if (bestTotal === 0) {
            resultDiv.innerHTML = '<p style="color:#f87171;text-align:center;">예산이 부족합니다.</p>';
            resultDiv.classList.add('show');
            btn.innerHTML = '계산하기'; btn.disabled = false;
            return;
        }

        const counts  = traceback(ch, pkgs, bestCost, 'price');
        const bonus   = bonusOn ? getBonus(bestBaseUC, true) : 0;
        const remain  = budget - bestCost;
        const bonusLine = bonusOn
            ? `<span style="font-size:0.8rem;">(패키지 ${bestPkgUC.toLocaleString()} UC + 누적보너스 ${bonus.toLocaleString()} UC)</span>`
            : `<span style="font-size:0.8rem;">패키지 보너스 포함 금액</span>`;

        let html = `<h3>최대 UC 획득 방법</h3>
            <div class="price-highlight">${bestTotal.toLocaleString()} UC</div>
            <div class="sub-info">사용: <strong>${bestCost.toLocaleString()}원</strong> / ${budget.toLocaleString()}원<br>${bonusLine}<br>
            ${remain > 0 ? `<span style="color:#6b7280;">잔여: ${remain.toLocaleString()}원</span>` : ''}</div>`;
        counts.forEach((c, i) => {
            if (c > 0) html += `<div class="package-item"><span>${pkgs[i].price.toLocaleString()}원 (${pkgs[i].label})</span><span style="font-weight:700;">× ${c}</span></div>`;
        });

        resultDiv.innerHTML = html; resultDiv.classList.add('show');
        btn.innerHTML = '계산하기'; btn.disabled = false;
    }, 300);
}
