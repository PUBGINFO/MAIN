let platform = 'ios', mode = 'price';

const data = {
    ios: [
        { price:1100,   totalUC:60,   label:'60 UC' },
        { price:4400,   totalUC:190,  label:'190 UC' },
        { price:14000,  totalUC:660,  label:'660 UC' },
        { price:33000,  totalUC:1800, label:'1,800 UC' },
        { price:66000,  totalUC:3850, label:'3,850 UC' },
        { price:149000, totalUC:8100, label:'8,100 UC' }
    ],
    android: [
        { price:1100,   totalUC:60,   label:'60 UC' },
        { price:3300,   totalUC:190,  label:'180 + 10 UC' },
        { price:11000,  totalUC:660,  label:'600 + 60 UC' },
        { price:27500,  totalUC:1800, label:'1,500 + 300 UC' },
        { price:55000,  totalUC:3850, label:'2,950 + 900 UC' },
        { price:110000, totalUC:8100, label:'5,900 + 2,200 UC' }
    ],
    midasbuy: [
        { price:1100,   totalUC:60,   label:'60 UC' },
        { price:3300,   totalUC:195,  label:'180 + 15 UC' },
        { price:11000,  totalUC:680,  label:'600 + 80 UC' },
        { price:27500,  totalUC:1850, label:'1,500 + 350 UC' },
        { price:55000,  totalUC:3950, label:'2,950 + 1,000 UC' },
        { price:110000, totalUC:8300, label:'5,900 + 2,400 UC' }
    ]
};

function showPage(showId, hideId, animClass) {
    const s = document.getElementById(showId);
    const h = document.getElementById(hideId);
    h.classList.add('hidden');
    s.classList.remove('hidden','anim-up','anim-down');
    void s.offsetWidth;
    s.classList.add(animClass);
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
    // 보너스 체크박스: iOS만 표시
    document.getElementById('bonusRow').style.display = os === 'ios' ? 'flex' : 'none';
    const verMap = { ios: 'v3.2 (iOS)', android: 'v3.2 (Android)', midasbuy: 'v3.2 (MidasBuy)' };
    document.getElementById('versionTag').textContent = verMap[os];
    document.body.className = platform + ' mode-' + mode;
    showPage('calcPage','welcomePage','anim-up');
    setTimeout(function(){ updateMSlider(); }, 50);
    setTimeout(function(){ document.getElementById('mainInput').focus(); }, 480);
}

function goBack() {
    document.body.className = '';
    document.getElementById('versionTag').textContent = 'v3.2';
    showPage('welcomePage','calcPage','anim-down');
}

function updateMSlider() {
    var s = document.getElementById('mSlider');
    var t = document.getElementById(mode === 'price' ? 'tabPrice' : 'tabUC');
    s.style.left = (t.offsetLeft - 4) + 'px';
    s.style.width = t.offsetWidth + 'px';
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
    var r = document.getElementById('result');
    r.classList.remove('show'); r.innerHTML = '';
    document.getElementById('mainInput').value = '';
}

function handleEnterKey(e) { if (e.key === 'Enter') calculate(); }

function getBonus(uc, on) {
    if (!on) return 0;
    var b = 0;
    if (uc >= 1000) b += 450;
    if (uc >= 2000) b += 450;
    if (uc >= 3000) b += 450;
    for (var i = 5000; i <= 39000; i += 2000) { if (uc >= i) b += 900; else break; }
    return b;
}

function calculate() { mode === 'price' ? calcMinPrice() : calcMaxUC(); }

function calcMinPrice() {
    var input = document.getElementById('mainInput');
    var resultDiv = document.getElementById('result');
    var btn = document.getElementById('calculateBtn');
    var bonusOn = platform === 'ios' && document.getElementById('useBonus').checked;
    var targetUC = parseInt(input.value);
    if (isNaN(targetUC) || targetUC <= 0) return;
    btn.innerHTML = '<span class="loading"></span> 계산중...'; btn.disabled = true;
    setTimeout(function() {
        var pkgs = data[platform];
        var max = targetUC + 8300;
        var dp = new Array(max + 1).fill(Infinity);
        var ch = new Array(max + 1).fill(-1);
        dp[0] = 0;
        for (var i = 0; i < pkgs.length; i++)
            for (var j = pkgs[i].totalUC; j <= max; j++)
                if (dp[j - pkgs[i].totalUC] + pkgs[i].price < dp[j]) { dp[j] = dp[j - pkgs[i].totalUC] + pkgs[i].price; ch[j] = i; }
        var bestPrice = Infinity, bestUC = 0;
        for (var u = 0; u <= max; u++) {
            if (dp[u] === Infinity) continue;
            var t = u + (platform === 'ios' ? getBonus(u, bonusOn) : 0);
            if (t >= targetUC && dp[u] < bestPrice) { bestPrice = dp[u]; bestUC = u; }
        }
        var counts = new Array(pkgs.length).fill(0);
        var tmp = bestUC;
        while (tmp > 0 && ch[tmp] !== -1) { counts[ch[tmp]]++; tmp -= pkgs[ch[tmp]].totalUC; }
        var bonus = platform === 'ios' ? getBonus(bestUC, bonusOn) : 0;
        var finalUC = bestUC + bonus;
        var bonusLine = platform === 'ios'
            ? '<span style="font-size:0.8rem;">(패키지 ' + bestUC.toLocaleString() + ' + iOS 보너스 ' + bonus.toLocaleString() + ')</span>'
            : '<span style="font-size:0.8rem;">패키지 보너스 포함 금액</span>';
        var html = '<h3>최적 구매 방법</h3><div class="price-highlight">' + bestPrice.toLocaleString() + '원</div>'
            + '<div class="sub-info">획득 UC: <strong>' + finalUC.toLocaleString() + '</strong><br>' + bonusLine + '</div>';
        counts.forEach(function(c, i) { if (c > 0) html += '<div class="package-item"><span>' + pkgs[i].price.toLocaleString() + '원 (' + pkgs[i].label + ')</span><span style="font-weight:700;">× ' + c + '</span></div>'; });
        resultDiv.innerHTML = html; resultDiv.classList.add('show');
        btn.innerHTML = '계산하기'; btn.disabled = false;
    }, 400);
}

function calcMaxUC() {
    var input = document.getElementById('mainInput');
    var resultDiv = document.getElementById('result');
    var btn = document.getElementById('calculateBtn');
    var bonusOn = platform === 'ios' && document.getElementById('useBonus').checked;
    var budget = parseInt(input.value);
    if (isNaN(budget) || budget <= 0) return;
    btn.innerHTML = '<span class="loading"></span> 계산중...'; btn.disabled = true;
    setTimeout(function() {
        var pkgs = data[platform];
        var dp = new Array(budget + 1).fill(0);
        var ch = new Array(budget + 1).fill(-1);
        for (var i = 0; i < pkgs.length; i++)
            for (var j = pkgs[i].price; j <= budget; j++) {
                var cand = dp[j - pkgs[i].price] + pkgs[i].totalUC;
                if (cand > dp[j]) { dp[j] = cand; ch[j] = i; }
            }
        var bestUC = 0, bestCost = 0;
        for (var c = 0; c <= budget; c++) if (dp[c] > bestUC) { bestUC = dp[c]; bestCost = c; }
        var bonus = platform === 'ios' ? getBonus(bestUC, bonusOn) : 0;
        var finalUC = bestUC + bonus;
        var remain = budget - bestCost;
        var bonusLine = platform === 'ios'
            ? '<span style="font-size:0.8rem;">(패키지 ' + bestUC.toLocaleString() + ' UC + iOS 보너스 ' + bonus.toLocaleString() + ' UC)</span>'
            : '<span style="font-size:0.8rem;">패키지 보너스 포함 금액</span>';
        var counts = new Array(pkgs.length).fill(0);
        var tmp = bestCost;
        while (tmp > 0 && ch[tmp] !== -1) { counts[ch[tmp]]++; tmp -= pkgs[ch[tmp]].price; }
        var html = '<h3>최대 UC 획득 방법</h3><div class="price-highlight">' + finalUC.toLocaleString() + ' UC</div>'
            + '<div class="sub-info">사용: <strong>' + bestCost.toLocaleString() + '원</strong> / ' + budget.toLocaleString() + '원<br>' + bonusLine + '<br>'
            + (remain > 0 ? '<span style="color:#6b7280;">잔여: ' + remain.toLocaleString() + '원</span>' : '') + '</div>';
        counts.forEach(function(c, i) { if (c > 0) html += '<div class="package-item"><span>' + pkgs[i].price.toLocaleString() + '원 (' + pkgs[i].label + ')</span><span style="font-weight:700;">× ' + c + '</span></div>'; });
        resultDiv.innerHTML = html; resultDiv.classList.add('show');
        btn.innerHTML = '계산하기'; btn.disabled = false;
    }, 400);
}
