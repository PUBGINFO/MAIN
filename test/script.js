// ────────────────────────────────────────────────────────────
// 카카오 SDK 초기화 (앱 키 및 초기화 시점 안전장치)
// ────────────────────────────────────────────────────────────
const KAKAO_APP_KEY = 'b80f2d95ba7e522d696f884635837c5c';

let platform = 'ios', mode = 'price';

// ── 패키지 데이터 ─────────────────────────────────────────────
const data = {
    ios: [
        { price: 1100,   baseUC: 60,   bonusUC: 0,    totalUC: 60,   label: '60 UC' },
        { price: 4400,   baseUC: 180,  bonusUC: 10,   totalUC: 190,  label: '180 UC + 10 UC 보너스' },
        { price: 14000,  baseUC: 600,  bonusUC: 60,   totalUC: 660,  label: '600 UC + 60 UC 보너스' },
        { price: 33000,  baseUC: 1500, bonusUC: 300,  totalUC: 1800, label: '1,500 UC + 300 UC 보너스' },
        { price: 66000,  baseUC: 2950, bonusUC: 900,  totalUC: 3850, label: '2,950 UC + 900 UC 보너스' },
        { price: 149000, baseUC: 5900, bonusUC: 2200, totalUC: 8100, label: '5,900 UC + 2,200 UC 보너스' }
    ],
    android: [
        { price: 1100,   baseUC: 60,   bonusUC: 0,    totalUC: 60,   label: '60 UC' },
        { price: 3300,   baseUC: 180,  bonusUC: 10,   totalUC: 190,  label: '180 UC + 10 UC 보너스' },
        { price: 11000,  baseUC: 600,  bonusUC: 60,   totalUC: 660,  label: '600 UC + 60 UC 보너스' },
        { price: 27500,  baseUC: 1500, bonusUC: 300,  totalUC: 1800, label: '1,500 UC + 300 UC 보너스' },
        { price: 55000,  baseUC: 2950, bonusUC: 900,  totalUC: 3850, label: '2,950 UC + 900 UC 보너스' },
        { price: 110000, baseUC: 5900, bonusUC: 2200, totalUC: 8100, label: '5,900 UC + 2,200 UC 보너스' }
    ],
    midasbuy: [
        { price: 1100,   baseUC: 60,   bonusUC: 0,    totalUC: 60,   label: '60 UC' },
        { price: 3300,   baseUC: 180,  bonusUC: 15,   totalUC: 195,  label: '180 UC + 15 UC 보너스' },
        { price: 11000,  baseUC: 600,  bonusUC: 80,   totalUC: 680,  label: '600 UC + 80 UC 보너스' },
        { price: 27500,  baseUC: 1500, bonusUC: 350,  totalUC: 1850, label: '1,500 UC + 350 UC 보너스' },
        { price: 55000,  baseUC: 2950, bonusUC: 1000, totalUC: 3950, label: '2,950 UC + 1,000 UC 보너스' },
        { price: 110000, baseUC: 5900, bonusUC: 2400, totalUC: 8300, label: '5,900 UC + 2,400 UC 보너스' }
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
        if (baseUC >= i) b += 900;
        else break;
    }
    return b;
}

// ── DP 빌더 ──────────────────────────────────────────────────
function buildMinCostDP(pkgs, maxBaseUC) {
    const dp = new Array(maxBaseUC + 1).fill(Infinity);
    const dpTotal = new Array(maxBaseUC + 1).fill(0);
    const ch = new Array(maxBaseUC + 1).fill(-1);

    dp[0] = 0;
    dpTotal[0] = 0;

    for (let i = 0; i < pkgs.length; i++) {
        for (let j = pkgs[i].baseUC; j <= maxBaseUC; j++) {
            const prev = dp[j - pkgs[i].baseUC];
            if (prev === Infinity) continue;

            const newCost = prev + pkgs[i].price;
            const newTotal = dpTotal[j - pkgs[i].baseUC] + pkgs[i].totalUC;

            if (newCost < dp[j] || (newCost === dp[j] && newTotal > dpTotal[j])) {
                dp[j] = newCost;
                dpTotal[j] = newTotal;
                ch[j] = i;
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
    return counts
        .map((c, i) => c > 0 ? `${pkgs[i].label} × ${c}` : '')
        .filter(Boolean)
        .join('\n');
}

// ── 클립보드 복사 (고유 ID 대응) ──────────────────────────────
function copyResult(text, copyBtnId) {
    navigator.clipboard.writeText(text).then(() => {
        const btn = document.getElementById(copyBtnId);
        if (!btn) return;
        btn.textContent = '✓ 복사됨!';
        btn.style.background = '#22c55e';
        setTimeout(() => {
            btn.textContent = '텍스트 복사';
            btn.style.background = '';
        }, 2000);
    }).catch(() => {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);

        const btn = document.getElementById(copyBtnId);
        if (btn) {
            btn.textContent = '✓ 복사됨!';
            btn.style.background = '#22c55e';
            setTimeout(() => {
                btn.textContent = '텍스트 복사';
                btn.style.background = '';
            }, 2000);
        }
    });
}

// ── 캡쳐 스타일 정리 ─────────────────────────────────────────
function sanitizeForCapture(root) {
    const nodes = [root, ...root.querySelectorAll('*')];

    nodes.forEach(el => {
        const cs = getComputedStyle(el);

        // 색이 죽는 원인 계열 제거
        el.style.opacity = '1';
        el.style.filter = 'none';
        el.style.backdropFilter = 'none';
        el.style.webkitBackdropFilter = 'none';
        el.style.mixBlendMode = 'normal';
        el.style.transform = 'none';
        el.style.transition = 'none';
        el.style.animation = 'none';
        el.style.textShadow = 'none';

        // 배경/텍스트는 원본 그대로 유지
        el.style.backgroundColor = cs.backgroundColor;
        el.style.backgroundImage = cs.backgroundImage;
        el.style.backgroundRepeat = cs.backgroundRepeat;
        el.style.backgroundPosition = cs.backgroundPosition;
        el.style.backgroundSize = cs.backgroundSize;
        el.style.backgroundAttachment = cs.backgroundAttachment;
        el.style.backgroundClip = cs.backgroundClip;
        el.style.color = cs.color;

        // 카드/버튼 형태 유지
        el.style.borderColor = cs.borderColor;
        el.style.borderStyle = cs.borderStyle;
        el.style.borderWidth = cs.borderWidth;
        el.style.borderRadius = cs.borderRadius;
        el.style.boxShadow = cs.boxShadow;

        // 렌더링 안정화
        el.style.webkitFontSmoothing = 'antialiased';
        el.style.textRendering = 'geometricPrecision';
    });
}

// ── 캡쳐용 이미지 렌더링 ──────────────────────────────────────
async function renderShareImage(targetArea) {
    if (typeof html2canvas === 'undefined') {
        throw new Error('html2canvas가 로드되지 않았습니다.');
    }

    const wrapper = document.createElement('div');
    wrapper.style.position = 'fixed';
    wrapper.style.left = '-99999px';
    wrapper.style.top = '0';
    wrapper.style.margin = '0';
    wrapper.style.padding = '24px';
    wrapper.style.background = '#ffffff';
    wrapper.style.border = '0';
    wrapper.style.boxSizing = 'border-box';
    wrapper.style.overflow = 'visible';
    wrapper.style.display = 'inline-block';
    wrapper.style.width = 'auto';
    wrapper.style.maxWidth = '960px';

    const clone = targetArea.cloneNode(true);

    const shareBar = clone.querySelector('.share-buttons');
    if (shareBar) shareBar.remove();

    // 원본 레이아웃 최대한 유지하되, 캡쳐 방해 요소 제거
    clone.style.opacity = '1';
    clone.style.filter = 'none';
    clone.style.backdropFilter = 'none';
    clone.style.webkitBackdropFilter = 'none';
    clone.style.mixBlendMode = 'normal';
    clone.style.transform = 'none';
    clone.style.transition = 'none';
    clone.style.animation = 'none';
    clone.style.overflow = 'visible';
    clone.style.height = 'auto';
    clone.style.minHeight = '0';
    clone.style.maxHeight = 'none';
    clone.style.boxSizing = 'border-box';

    // 내부 필터/암전 효과 제거
    sanitizeForCapture(clone);

    // 캡쳐 전용 스타일 시트
    const style = document.createElement('style');
    style.textContent = `
        *, *::before, *::after {
            animation: none !important;
            transition: none !important;
        }
    `;

    wrapper.appendChild(style);
    wrapper.appendChild(clone);
    document.body.appendChild(wrapper);

    try {
        await new Promise(requestAnimationFrame);
        await new Promise(requestAnimationFrame);

        // 내용 길이에 따라 폭 유동 조절
        const cloneRect = clone.getBoundingClientRect();
        const scrollH = clone.scrollHeight || cloneRect.height || 0;
        const scrollW = clone.scrollWidth || cloneRect.width || 0;

        let finalWidth = 420;
        if (scrollH > 1000) finalWidth = 900;
        else if (scrollH > 800) finalWidth = 820;
        else if (scrollH > 650) finalWidth = 720;
        else if (scrollH > 500) finalWidth = 620;
        else finalWidth = Math.max(420, Math.min(scrollW + 48, 620));

        wrapper.style.width = finalWidth + 'px';
        clone.style.width = '100%';
        clone.style.maxWidth = '100%';

        const canvas = await html2canvas(wrapper, {
            useCORS: true,
            allowTaint: true,
            scale: 2,
            backgroundColor: '#ffffff',
            removeContainer: true,
            scrollX: 0,
            scrollY: 0
        });

        return canvas;
    } finally {
        if (wrapper.parentNode) wrapper.parentNode.removeChild(wrapper);
    }
}

// ── 카카오 공유 버튼 준비 ─────────────────────────────────────
function prepareKakaoButton(buttonId, kakaoTitle, kakaoDesc) {
    if (typeof Kakao !== 'undefined' && !Kakao.isInitialized()) {
        Kakao.init(KAKAO_APP_KEY);
    }

    const targetArea = document.getElementById('result');
    if (!targetArea || typeof html2canvas === 'undefined') return;

    const kakaoBtn = document.getElementById(buttonId);
    if (!kakaoBtn) return;

    kakaoBtn.addEventListener('click', async function(e) {
        if (kakaoBtn.classList.contains('processing')) {
            e.preventDefault();
            return;
        }

        kakaoBtn.classList.add('processing');
        kakaoBtn.innerHTML = `⏳ 이미지 생성 중...`;

        try {
            const canvas = await renderShareImage(targetArea);

            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
            if (!blob) throw new Error('이미지 변환에 실패했습니다.');

            const file = new File([blob], 'pubg_receipt.png', { type: 'image/png' });
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);

            const uploaded = await Kakao.Share.uploadImage({
                file: dataTransfer.files,
            });

            const uploadedImageUrl = uploaded.infos.original.url;
            const currentTimestamp = Date.now();

            Kakao.Share.sendDefault({
                objectType: 'feed',
                content: {
                    title: kakaoTitle,
                    description: kakaoDesc,
                    imageUrl: uploadedImageUrl,
                    link: {
                        mobileWebUrl: 'https://pubginfo.site?t=' + currentTimestamp,
                        webUrl: 'https://pubginfo.site?t=' + currentTimestamp
                    }
                },
                buttons: [
                    {
                        title: '나도 최저가 계산하기 🔗',
                        link: {
                            mobileWebUrl: 'https://pubginfo.site?t=' + currentTimestamp,
                            webUrl: 'https://pubginfo.site?t=' + currentTimestamp
                        }
                    }
                ]
            });

            kakaoBtn.classList.remove('processing');
            kakaoBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3C6.477 3 2 6.477 2 11c0 2.757 1.428 5.185 3.6 6.713L4.5 21l4.2-2.1A10.5 10.5 0 0 0 12 19c5.523 0 10-3.477 10-8S17.523 3 12 3z"/></svg> 카카오톡 공유`;
        } catch (err) {
            alert('공유 처리 중 오류: ' + err.message);
            kakaoBtn.classList.remove('processing');
            kakaoBtn.innerHTML = `카카오톡 공유`;
        }
    });
}

// ── 공유 버튼 HTML 생성 ───────────────────────────────────────
function shareButtonsHTML(copyText, kakaoTitle, kakaoDesc) {
    const randomSuffix = Math.floor(Math.random() * 100000);
    const uniqueKakaoId = 'kakao-dynamic-btn-' + randomSuffix;
    const uniqueCopyId = 'copy-dynamic-btn-' + randomSuffix;

    setTimeout(() => {
        prepareKakaoButton(uniqueKakaoId, kakaoTitle, kakaoDesc);
    }, 50);

    return `<div class="share-buttons">
        <button class="btn-share btn-kakao" id="${uniqueKakaoId}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3C6.477 3 2 6.477 2 11c0 2.757 1.428 5.185 3.6 6.713L4.5 21l4.2-2.1A10.5 10.5 0 0 0 12 19c5.523 0 10-3.477 10-8S17.523 3 12 3z"/></svg>
            카카오톡 공유
        </button>
        <button class="btn-share btn-copy" id="${uniqueCopyId}" onclick='copyResult(${JSON.stringify(copyText)}, "${uniqueCopyId}")'>
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
    platform = os;
    mode = 'price';
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
        s.style.left = (t.offsetLeft - 4) + 'px';
        s.style.width = t.offsetWidth + 'px';
    }
}

function setMode(m) {
    if (mode === m) return;
    mode = m;
    resetResult();
    document.body.className = platform + ' mode-' + mode;
    document.getElementById('tabPrice').classList.toggle('active', m === 'price');
    document.getElementById('tabUC').classList.toggle('active', m === 'uc');
    document.getElementById('inputLabel').textContent = m === 'price' ? '필요한 UC를 입력하세요' : '보유 예산을 입력하세요 (원)';
    document.getElementById('mainInput').placeholder = m === 'price' ? '예: 12000' : '예: 50000';
    document.getElementById('mainTitle').innerHTML = (m === 'price' ? 'UC 최저가 계산기' : 'UC 예산 계산기') + ' <span class="title-badge">BETA</span>';
    document.getElementById('ownedUCGroup').style.display = m === 'price' ? 'block' : 'none';
    setTimeout(updateMSlider, 10);
    document.getElementById('mainInput').focus();
}

function resetResult() {
    const r = document.getElementById('result');
    if (r) {
        r.classList.remove('show');
        r.innerHTML = '';
    }
    const inp = document.getElementById('mainInput');
    if (inp) inp.value = '';
}

function handleEnterKey(e) {
    if (e.key === 'Enter') calculate();
}

function calculate() {
    mode === 'price' ? calcMinPrice() : calcMaxUC();
}

function calcMinPrice() {
    const resultDiv = document.getElementById('result');
    const btn = document.getElementById('calculateBtn');
    const bonusOn = platform === 'ios' && document.getElementById('useBonus').checked;

    const targetUCRaw = parseInt(document.getElementById('mainInput').value) || 0;
    const ownedUC = parseInt(document.getElementById('ownedUC').value) || 0;
    const targetUC = targetUCRaw - ownedUC;

    if (targetUCRaw <= 0) return;

    if (targetUC <= 0) {
        resultDiv.innerHTML = `<div class="already-enough">
            ✅ 이미 충분한 UC를 보유하고 있습니다.<br>
            <span style="font-size:0.82rem;color:#9ca3af;">보유 UC: ${ownedUC.toLocaleString()} / 목표 UC: ${targetUCRaw.toLocaleString()}</span>
        </div>`;
        resultDiv.classList.add('show');
        return;
    }

    btn.innerHTML = '<span class="loading"></span> 계산중...';
    btn.disabled = true;

    setTimeout(() => {
        const pkgs = data[platform];
        const maxBase = Math.max(...pkgs.map(p => p.baseUC));
        const searchMax = Math.ceil(targetUC * 1.15) + maxBase * 2;

        const { dp, dpTotal, ch } = buildMinCostDP(pkgs, searchMax);

        let bestPrice = Infinity, bestBaseUC = 0, bestEffective = 0;
        for (let b = 0; b <= searchMax; b++) {
            if (dp[b] === Infinity) continue;
            const eff = dpTotal[b] + (bonusOn ? getBonus(b, true) : 0);
            if (eff < targetUC) continue;
            if (dp[b] < bestPrice || (dp[b] === bestPrice && eff > bestEffective)) {
                bestPrice = dp[b];
                bestBaseUC = b;
                bestEffective = eff;
            }
        }

        if (bestPrice === Infinity) {
            resultDiv.innerHTML = '<p style="color:#f87171;text-align:center;padding:12px;">계산 가능한 조합을 찾지 못했습니다.</p>';
            resultDiv.classList.add('show');
            btn.innerHTML = '계산하기';
            btn.disabled = false;
            return;
        }

        const bestCounts = traceback(ch, pkgs, bestBaseUC, 'baseUC');
        const bestPkgUC = dpTotal[bestBaseUC];
        const bestBonus = bonusOn ? getBonus(bestBaseUC, true) : 0;
        const bestFinalUC = bestPkgUC + bestBonus;

        const extraCostLimit = Math.max(5000, Math.round(bestPrice * 0.08));
        let recoPrice = Infinity, recoBaseUC = 0, recoEffective = 0;

        for (let b = bestBaseUC + 1; b <= searchMax; b++) {
            if (dp[b] === Infinity) continue;
            const eff = dpTotal[b] + (bonusOn ? getBonus(b, true) : 0);
            const extraCost = dp[b] - bestPrice;
            const extraUC = eff - bestFinalUC;
            if (extraCost > extraCostLimit) continue;
            if (extraUC < 300) continue;
            if (dp[b] < recoPrice || (dp[b] === recoPrice && eff > recoEffective)) {
                recoPrice = dp[b];
                recoBaseUC = b;
                recoEffective = eff;
            }
        }

        const hasReco = recoPrice !== Infinity && recoPrice !== bestPrice;

        const bonusLine = bonusOn
            ? `<span style="font-size:0.78rem;">(기본 ${bestBaseUC.toLocaleString()} + 패키지보너스 ${(bestPkgUC - bestBaseUC).toLocaleString()} + 누적보너스 ${bestBonus.toLocaleString()})</span>`
            : `<span style="font-size:0.78rem;">패키지 보너스 포함</span>`;

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

        const copyText = `[PUBG MOBILE UC 계산 결과]\n총 결제 금액: ${bestPrice.toLocaleString()}원\n추천 조합:\n${pkgListText(bestCounts, pkgs)}\n총 획득 UC: ${bestFinalUC.toLocaleString()} UC\n\npubginfo.site`;
        const kakaoTitle = `PUBG UC 최적가: ${bestPrice.toLocaleString()}원`;
        const kakaoDesc = `총 ${bestFinalUC.toLocaleString()} UC를 획득하는 가장 경제적인 최적 조합 영수증 · pubginfo.site`;

        let html = `<h3>최적 구매 방법</h3>
            ${ownedLine}
            <div class="price-highlight">${bestPrice.toLocaleString()}원</div>
            <div class="sub-info">획득 UC: <strong>${bestFinalUC.toLocaleString()}</strong><br>${bonusLine}</div>
            ${pkgRows}`;

        if (hasReco) {
            const recoCounts = traceback(ch, pkgs, recoBaseUC, 'baseUC');
            const recoPkgUC = dpTotal[recoBaseUC];
            const recoBonus = bonusOn ? getBonus(recoBaseUC, true) : 0;
            const recoFinalUC = recoPkgUC + recoBonus;
            const extraCost = recoPrice - bestPrice;
            const extraUC = recoFinalUC - bestFinalUC;

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
                ${shareButtonsHTML(recoCopyText, `PUBG UC 대박 추천: ${recoPrice.toLocaleString()}원`, `단돈 +${extraCost.toLocaleString()}원 보태고 +${extraUC.toLocaleString()} UC 추가 보너스 기회! · pubginfo.site`)}
            </div>`;
        }

        html += shareButtonsHTML(copyText, kakaoTitle, kakaoDesc);

        resultDiv.innerHTML = html;
        resultDiv.classList.add('show');
        btn.innerHTML = '계산하기';
        btn.disabled = false;
    }, 300);
}

function calcMaxUC() {
    const resultDiv = document.getElementById('result');
    const btn = document.getElementById('calculateBtn');
    const bonusOn = platform === 'ios' && document.getElementById('useBonus').checked;
    const budget = parseInt(document.getElementById('mainInput').value);

    if (isNaN(budget) || budget <= 0) return;

    btn.innerHTML = '<span class="loading"></span> 계산중...';
    btn.disabled = true;

    setTimeout(() => {
        const pkgs = data[platform];
        const dp = new Array(budget + 1).fill(-1);
        const dpBase = new Array(budget + 1).fill(0);
        const ch = new Array(budget + 1).fill(-1);
        dp[0] = 0;

        for (let i = 0; i < pkgs.length; i++) {
            for (let j = pkgs[i].price; j <= budget; j++) {
                if (dp[j - pkgs[i].price] === -1) continue;
                const candTotal = dp[j - pkgs[i].price] + pkgs[i].totalUC;
                const candBase = dpBase[j - pkgs[i].price] + pkgs[i].baseUC;
                if (candTotal > dp[j]) {
                    dp[j] = candTotal;
                    dpBase[j] = candBase;
                    ch[j] = i;
                }
            }
        }

        let bestTotal = 0, bestCost = 0, bestPkgUC = 0, bestBaseUC = 0;
        for (let c = 0; c <= budget; c++) {
            if (dp[c] === -1) continue;
            const bonus = bonusOn ? getBonus(dpBase[c], true) : 0;
            const total = dp[c] + bonus;
            if (total > bestTotal || (total === bestTotal && c < bestCost)) {
                bestTotal = total;
                bestCost = c;
                bestPkgUC = dp[c];
                bestBaseUC = dpBase[c];
            }
        }

        if (bestTotal === 0) {
            resultDiv.innerHTML = '<p style="color:#f87171;text-align:center;padding:12px;">예산이 부족합니다.</p>';
            resultDiv.classList.add('show');
            btn.innerHTML = '계산하기';
            btn.disabled = false;
            return;
        }

        const counts = traceback(ch, pkgs, bestCost, 'price');
        const bonus = bonusOn ? getBonus(bestBaseUC, true) : 0;
        const remain = budget - bestCost;

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

        const copyText = `[PUBG MOBILE UC 계산 결과]\n예산: ${budget.toLocaleString()}원\n사용 금액: ${bestCost.toLocaleString()}원\n구매 조합:\n${pkgListText(counts, pkgs)}\n총 획득 UC: ${bestTotal.toLocaleString()} UC\n\npubginfo.site`;
        const kakaoTitle = `PUBG UC 최대 획득: ${bestTotal.toLocaleString()} UC`;
        const kakaoDesc = `${bestCost.toLocaleString()}원의 예산으로 쥐어짠 최대 효율 조합 결과 · pubginfo.site`;

        let html = `<h3>최대 UC 획득 방법</h3>
            <div class="price-highlight">${bestTotal.toLocaleString()} UC</div>
            <div class="sub-info">사용: <strong>${bestCost.toLocaleString()}원</strong> / ${budget.toLocaleString()}원<br>${bonusLine}<br>
            ${remain > 0 ? `<span style="color:#6b7280;">잔여: ${remain.toLocaleString()}원</span>` : ''}</div>
            ${pkgRows}
            ${shareButtonsHTML(copyText, kakaoTitle, kakaoDesc)}`;

        resultDiv.innerHTML = html;
        resultDiv.classList.add('show');
        btn.innerHTML = '계산하기';
        btn.disabled = false;
    }, 300);
}
