/* 결혼컨닝 도구: 결혼 예산 나누기, 양가 의견 맞추기표, 대본 복사.
   모든 계산은 브라우저 안에서만 하고 서버로 보내지 않는다. */
(function () {
  function $(id) { return document.getElementById(id); }
  function num(id) {
    var el = $(id); if (!el) return 0;
    var v = parseFloat(String(el.value).replace(/[^\d.]/g, ''));
    return isNaN(v) ? 0 : v;
  }
  function man(n) { return Math.round(n).toLocaleString('ko-KR') + '만 원'; }
  function won(n) { return (Math.round(n / 1000) * 1000).toLocaleString('ko-KR') + '원'; }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function bind(form, fn) { if (!form) return; form.addEventListener('input', fn); form.addEventListener('change', fn); fn(); }
  Array.prototype.forEach.call(document.querySelectorAll('.calc input[data-money]'), function (el) {
    el.addEventListener('input', function () {
      var raw = el.value.replace(/[^\d]/g, '');
      el.value = raw ? Number(raw).toLocaleString('ko-KR') : '';
    });
  });

  /* ── 1. 결혼 예산 나누기 ───────────────────────────── */
  (function () {
    var f = $('calc-wbudget'); if (!f) return;
    // [이름, 기본 비율, 줄이는 선택지 id, 줄였을 때 비율, 아끼는 법 글]
    var ITEMS = [
      ['예식장 (대관료+식대)', 45, null, 0, '/wedding-day/venue-check/'],
      ['스드메 (스튜디오·드레스·메이크업)', 12, null, 0, '/budget/sdm-cost/'],
      ['예물 (반지·시계)', 12, 'wb-yemul', 5, '/yedan/yemul/'],
      ['신혼여행', 12, 'wb-trip', 6, '/honsu/honeymoon-prep/'],
      ['예단·함·이바지', 8, 'wb-yedan', 0, '/yedan/yedan/'],
      ['본식 스냅·영상', 4, 'wb-snap', 0, '/budget/wedding-cost/'],
      ['한복·혼주 의상·상견례', 3, null, 0, '/wedding-day/honju-hanbok/'],
      ['청첩장·답례품·기타', 4, null, 0, '/dapre/wedding-favors/']
    ];
    var KEY = 'wc-budget-ratio-v1', custom = null;
    var saved = null;
    try { saved = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { saved = null; }
    if (saved && saved.p && saved.p.length === ITEMS.length) {
      custom = saved.p;
      ITEMS.forEach(function (it) { if (it[2] && $(it[2])) $(it[2]).checked = !!(saved.c && saved.c[it[2]]); });
    }
    function saveCustom() {
      try {
        if (!custom) { localStorage.removeItem(KEY); return; }
        var c = {}; ITEMS.forEach(function (it) { if (it[2] && $(it[2])) c[it[2]] = $(it[2]).checked; });
        localStorage.setItem(KEY, JSON.stringify({ p: custom, c: c }));
      } catch (e) {}
    }
    // 체크 상태로 기본 비율 계산 → 정수 %로 합계 100 맞추기
    function defaults() {
      var w = ITEMS.map(function (it) { return it[2] && $(it[2]) && $(it[2]).checked ? it[3] : it[1]; });
      var sum = w.reduce(function (a, b) { return a + b; }, 0);
      var raw = w.map(function (x) { return x / sum * 100; }), p = raw.map(Math.floor);
      var left = 100 - p.reduce(function (a, b) { return a + b; }, 0);
      raw.map(function (x, i) { return [x - Math.floor(x), i]; }).sort(function (a, b) { return b[0] - a[0]; })
        .slice(0, left).forEach(function (r) { p[r[1]]++; });
      return p;
    }
    // 비율 표 (한 번만 그리고, 입력 중에는 금액 칸만 바꿈)
    var box = $('wb-ratio');
    box.innerHTML = '<p class="ratio-head"><b>항목별 비율</b> <span class="hint" style="display:inline">%를 직접 고쳐도 됩니다</span></p>' +
      '<table class="rows ratio"><tbody>' + ITEMS.map(function (it, i) {
        return '<tr><td><a href="' + (window.BASE || '') + it[4] + '">' + it[0] + '</a></td><td class="pct"><input type="text" inputmode="decimal" data-pct="' + i + '" aria-label="' + it[0] + ' 비율(%)">%</td><td class="amt" id="wb-amt' + i + '"></td></tr>';
      }).join('') + '</tbody></table>' +
      '<p class="ratio-sum" id="wb-sum"></p>' +
      '<div class="seg"><button type="button" id="wb-fit">합계 100%로 맞추기</button><button type="button" id="wb-reset">기본 비율로 되돌리기</button></div>';
    var pins = box.querySelectorAll('input[data-pct]');
    function fill(p) { Array.prototype.forEach.call(pins, function (el, i) { el.value = String(Math.round(p[i] * 10) / 10); }); }
    function pcts() { return Array.prototype.map.call(pins, function (el) { var v = parseFloat(el.value); return isFinite(v) && v > 0 ? v : 0; }); }
    fill(custom || defaults());
    box.addEventListener('input', function (e) {
      if (!e.target.hasAttribute('data-pct')) return;
      var v = e.target.value.replace(/[^0-9.]/g, ''); if (v !== e.target.value) e.target.value = v;
      custom = pcts(); saveCustom();
    });
    ITEMS.forEach(function (it, i) {
      if (!it[2] || !$(it[2])) return;
      $(it[2]).addEventListener('change', function () {
        if (!custom) { fill(defaults()); return; }
        pins[i].value = String(this.checked ? it[3] : it[1]); custom = pcts(); saveCustom();
      });
    });
    $('wb-fit').addEventListener('click', function () {
      var p = pcts(), s = p.reduce(function (a, b) { return a + b; }, 0); if (!s) return;
      var q = p.map(function (x) { return Math.round(x / s * 1000) / 10; });
      var d = Math.round((100 - q.reduce(function (a, b) { return a + b; }, 0)) * 10) / 10;
      var big = q.indexOf(Math.max.apply(null, q)); q[big] = Math.round((q[big] + d) * 10) / 10;
      fill(q); custom = pcts(); saveCustom(); run();
    });
    $('wb-reset').addEventListener('click', function () { custom = null; saveCustom(); fill(defaults()); run(); });
    function run() {
      var total = num('wb-total'), guests = num('wb-guests'), gift = num('wb-gift');
      var out = $('wb-out'), p = pcts();
      var psum = Math.round(p.reduce(function (a, b) { return a + b; }, 0) * 10) / 10;
      var amt = p.map(function (x) { return total * x / 100; });
      amt.forEach(function (a, i) { $('wb-amt' + i).textContent = !total ? '' : p[i] ? man(a) : '생략'; });
      var used = amt.reduce(function (a, b) { return a + b; }, 0);
      $('wb-sum').innerHTML = '합계 <b>' + psum + '%</b>' + (total ? ' · ' + man(used) : '') +
        (psum > 100 ? ' <span class="warn" style="display:inline">· 총예산보다 ' + man(used - total) + ' 넘칩니다</span>'
          : psum < 100 ? ' <span class="warn" style="display:inline">· 아직 ' + man(total - used) + ' (' + Math.round((100 - psum) * 10) / 10 + '%) 남았습니다</span>' : '');
      if (!total) { out.innerHTML = '<p class="note">총예산을 넣으면 바로 나눠 드립니다.</p>'; return; }
      var html = '<p class="big">' + man(total) + '<small>총예산 (신혼집 제외)</small></p>';
      if (guests > 0 && amt[0] > 0) {
        var per = amt[0] * 10000 / guests;
        html += '<p class="note" style="margin-top:12px"><b>하객 1명당 예식장 예산: 약 ' + won(per) + '</b><br>대관료가 따로 붙는 곳이면 식대로 쓸 수 있는 돈은 이보다 적습니다. 예식장 견적의 1인 식대 × 보증인원이 이 금액 안에 들어오는지 먼저 비교해 보세요.</p>';
      }
      if (gift > 0 && guests > 0) {
        var inflow = gift * guests / 10000;
        html += '<table class="rows"><tbody><tr><td>예상 축의금 (하객 수 × 입력한 금액)</td><td>' + man(inflow) + '</td></tr>' +
          '<tr><td>축의금을 뺀 실제 부담</td><td>' + man(Math.max(total - inflow, 0)) + '</td></tr></tbody></table>' +
          '<p class="note">축의금은 양가가 각자 관리하는 집도 많아서, 두 사람 예산에 넣을지는 먼저 양가와 이야기해 두세요.</p>';
      }
      html += '<p class="note">기본 비율은 항목을 고루 나눈 예시입니다. 우리에게 중요한 항목의 %를 올리고 덜 중요한 항목을 줄여 보세요. 고친 비율은 이 기기에만 저장됩니다.</p>';
      out.innerHTML = html;
    }
    bind(f, run);
  })();

  /* ── 2. 양가 의견 맞추기표 ─────────────────────────── */
  (function () {
    var box = $('match'); if (!box) return;
    // [질문, 보기 3개(순서 있음 → 이웃이면 '조금 다름'), 순서 없음이면 true, 이야기 꺼내는 글]
    var Q = [
      ['예단', ['하지 않음', '간소하게 (현금 일부만)', '격식 갖춰서'], false, '/script/skip-yedan/'],
      ['예물', ['커플링만', '반지·시계 정도', '세트로 제대로'], false, '/yedan/yemul/'],
      ['함', ['생략', '간단히 전달만', '함진아비까지'], false, '/yedan/yedan/'],
      ['이바지 음식', ['생략', '간단히', '격식 갖춰서'], false, '/yedan/ibaji/'],
      ['폐백', ['생략', '간단히', '격식 갖춰서'], false, '/yedan/pyebaek/'],
      ['결혼식 규모', ['100명 이하 (스몰)', '100~250명', '250명 이상'], false, '/wedding-day/venue-check/'],
      ['예식 장소', ['웨딩홀', '호텔', '하우스·야외·기타'], true, '/wedding-day/venue-check/'],
      ['주례', ['없이 (성혼선언문)', '지인·은사께 부탁', '주례 선생님 모시기'], true, '/wedding-day/ceremony-order/'],
      ['결혼 시기', ['6개월 안에', '6개월~1년 뒤', '1년 넘게 여유 있게'], false, '/prep/checklist/'],
      ['결혼식 비용 나누기', ['반반', '각자 형편대로', '한쪽이 더 많이'], true, '/script/money-talk/'],
      ['신혼집 마련', ['둘이 모은 돈으로', '양가 도움 조금', '양가 도움 많이'], false, '/script/money-talk/'],
      ['축의금 관리', ['양가가 각자', '모두 신랑·신부에게', '부모님이 정리 후 일부'], true, '/script/money-talk/'],
      ['신혼여행', ['국내·가까운 곳', '가까운 해외', '먼 해외'], false, '/honsu/honeymoon-prep/']
    ];
    var ANY = '상관없음 (맞출게요)';
    var form = $('m-form'), res = $('m-res'), share = $('m-share');
    var other = null;   // 링크로 받은 상대 답

    form.innerHTML = Q.map(function (q, i) {
      var opts = q[1].concat([ANY]);
      return '<fieldset><legend>' + (i + 1) + '. ' + q[0] + '</legend><div class="opts">' + opts.map(function (o, j) {
        return '<label><input type="radio" name="q' + i + '" value="' + j + '">' + o + '</label>';
      }).join('') + '</div></fieldset>';
    }).join('');

    function mine() {
      return Q.map(function (q, i) {
        var c = form.querySelector('input[name=q' + i + ']:checked');
        return c ? c.value : '-';
      }).join('');
    }
    function side() { var c = box.querySelector('input[name=side]:checked'); return c ? c.value : 'a'; }
    function label(s) { return s === 'a' ? '신랑 측' : '신부 측'; }
    function encode(obj) { return btoa(unescape(encodeURIComponent(JSON.stringify(obj)))).replace(/=+$/, ''); }
    function decode(s) { try { return JSON.parse(decodeURIComponent(escape(atob(s)))); } catch (e) { return null; } }

    var h = location.hash.match(/m=([A-Za-z0-9+/_-]+)/);
    if (h) {
      other = decode(h[1].replace(/-/g, '+').replace(/_/g, '/'));
      if (other && other.a && other.s) {
        var me = other.s === 'a' ? 'b' : 'a';
        var r = box.querySelector('input[name=side][value=' + me + ']'); if (r) r.checked = true;
        $('m-got').hidden = false;
        $('m-got').innerHTML = '<b>' + esc(other.n || label(other.s)) + '</b>의 답을 받았습니다. 답은 결과에서 함께 공개됩니다. 아래를 우리 쪽 생각대로 고른 뒤 <b>비교 결과 보기</b>를 누르세요.';
      } else other = null;
    }

    $('m-link').addEventListener('click', function () {
      var a = mine();
      if (a.indexOf('-') !== -1 && !confirm('아직 고르지 않은 질문이 있습니다. 그래도 링크를 만들까요?')) return;
      var code = encode({ s: side(), n: ($('m-name').value || '').slice(0, 20), a: a }).replace(/\+/g, '-').replace(/\//g, '_');
      var link = location.href.split('#')[0] + '#m=' + code;
      share.hidden = false;
      share.querySelector('input').value = link;
      if (navigator.clipboard) navigator.clipboard.writeText(link).then(function () { share.querySelector('.note').textContent = '링크를 복사했습니다. 카톡 등으로 상대에게 보내 주세요. 상대가 열면 자기 답을 고른 뒤 둘을 비교해 볼 수 있습니다.'; });
    });

    function count(a) { return a.replace(/-/g, '').length; }
    function compareLocal() {
      var cur = mine();
      if (!count(cur)) { alert(label(side()) + ' 답을 아직 고르지 않았습니다. 13가지를 고른 뒤 다시 눌러 주세요.'); return; }
      var a = first.s === 'a' ? first.a : cur, b = first.s === 'a' ? cur : first.a;
      show(a, b, first.s === 'a' ? first.n : $('m-name').value, first.s === 'a' ? $('m-name').value : first.n);
    }

    $('m-compare').addEventListener('click', function () {
      if (first) { compareLocal(); return; }
      if (!other) { alert('먼저 상대에게서 받은 링크로 이 페이지를 열어 주세요. 같은 기기에서 함께 해 보려면 "한 화면에서 둘 다 고르기"를 쓰세요.'); return; }
      if (!count(mine())) { alert('우리 쪽 답을 아직 고르지 않았습니다. 13가지를 고른 뒤 다시 눌러 주세요.'); return; }
      show(other.s === 'a' ? other.a : mine(), other.s === 'a' ? mine() : other.a, other.s === 'a' ? other.n : $('m-name').value, other.s === 'a' ? $('m-name').value : other.n);
    });

    // 한 화면에서 둘 다: 첫 번째 사람이 다 고른 뒤 누르면 답을 저장하고, 폼을 비워 두 번째 사람 차례로 넘긴다
    var first = null;
    $('m-local').addEventListener('click', function () {
      if (first) { compareLocal(); return; }
      var a = mine(), n = count(a);
      if (!n) {
        $('m-got').hidden = false;
        $('m-got').innerHTML = '<b>' + label(side()) + '</b>이 먼저 아래 13가지를 모두 고른 뒤, 이 버튼을 다시 눌러 주세요. 그러면 답이 저장되고 상대 차례로 넘어갑니다.';
        this.textContent = label(side()) + ' 다 골랐어요 → 상대 차례';
        return;
      }
      if (n < Q.length && !confirm('아직 고르지 않은 질문이 ' + (Q.length - n) + '개 있습니다. 이대로 저장하고 상대 차례로 넘길까요?')) return;
      first = { s: side(), a: a, n: $('m-name').value };
      form.reset(); $('m-name').value = '';
      var r = box.querySelector('input[name=side][value=' + (first.s === 'a' ? 'b' : 'a') + ']'); if (r) r.checked = true;
      this.textContent = '두 번째 답까지 골랐어요 → 비교';
      $('m-got').hidden = false;
      $('m-got').innerHTML = '<b>' + label(first.s) + '</b> 답 ' + n + '개를 저장했습니다. 이제 <b>' + label(first.s === 'a' ? 'b' : 'a') + '</b>이 골라 주세요. 다 고르면 아래 버튼을 누르세요.';
      window.scrollTo({ top: box.offsetTop - 10, behavior: 'smooth' });
    });

    function show(a, b, na, nb) {
      var same = [], near = [], talk = [];
      var rows = Q.map(function (q, i) {
        var x = a.charAt(i), y = b.charAt(i), txt = function (v) { return v === '-' ? '(안 고름)' : v === '3' ? ANY : q[1][+v]; };
        var st;
        if (x === '-' || y === '-') st = ['', '-'];
        else if (x === y || x === '3' || y === '3') { st = ['ok', '맞음']; same.push(q[0]); }
        else if (!q[2] && Math.abs(x - y) === 1) { st = ['mid', '조금 다름']; near.push(i); }
        else { st = ['talk', '이야기 필요']; talk.push(i); }
        return '<tr><td>' + q[0] + '</td><td>' + esc(txt(x)) + '</td><td>' + esc(txt(y)) + '</td><td class="' + st[0] + '">' + st[1] + '</td></tr>';
      }).join('');
      var d = new Date(), today = d.getFullYear() + '.' + (d.getMonth() + 1) + '.' + d.getDate();
      var html = '<p class="m-printhead">결혼컨닝 · 양가 의견 맞추기표 · ' + today + '</p><h3>비교 결과</h3><p class="big">' + same.length + ' / ' + Q.length + '<small>이미 같은 생각</small></p>';
      if (talk.length) html += '<p><b>먼저 이야기할 것:</b> ' + talk.map(function (i) { return '<a href="' + (window.BASE || '') + Q[i][3] + '">' + Q[i][0] + '</a>'; }).join(', ') + '</p>';
      if (near.length) html += '<p><b>조금만 맞추면 되는 것:</b> ' + near.map(function (i) { return Q[i][0]; }).join(', ') + '</p>';
      html += '<div class="table-wrap"><table><thead><tr><th>항목</th><th>' + esc(na || '신랑 측') + '</th><th>' + esc(nb || '신부 측') + '</th><th>상태</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
      html += '<p class="note">"상관없음"을 고른 항목은 맞춰 줄 수 있다는 뜻으로 보고 "맞음"으로 표시했습니다. 이 결과는 어디에도 저장되지 않으니, 필요하면 PDF로 저장하거나 화면을 캡처해 두세요.</p><p class="m-printbtn"><button type="button" class="btn-plain" onclick="window.print()">PDF로 저장 · 인쇄</button></p>';
      res.innerHTML = html; res.hidden = false;
      document.body.classList.add('has-mres');
      res.scrollIntoView({ behavior: 'smooth' });
    }
  })();

  /* ── 3. 대본 복사 버튼 ───────────────────────────── */
  Array.prototype.forEach.call(document.querySelectorAll('.script'), function (box) {
    if (!navigator.clipboard) return;
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'copy'; b.textContent = '복사하기';
    b.addEventListener('click', function () {
      var t = Array.prototype.map.call(box.querySelectorAll('p'), function (p) { return p.innerText; }).join('\n');
      navigator.clipboard.writeText(t).then(function () { b.textContent = '복사했어요'; setTimeout(function () { b.textContent = '복사하기'; }, 1500); });
    });
    box.appendChild(b);
  });
})();

/* ── 4. 결혼 준비 체크리스트 (체크는 이 브라우저에만 저장) ── */
(function () {
  var box = document.getElementById('clist'); if (!box) return;
  // [단계 이름, 시작(결혼 전 개월), 끝(개월), [[할 일, 비고(주의사항), 링크]]]
  var S = [
    ['큰 틀 잡기', 12, 10, [
      ['양가 부모님께 인사, 결혼 허락', '각자 자기 부모님께 먼저 말씀드리기', ''],
      ['결혼 시기 후보 2~3개 정하기', '양가 행사·명절·연말을 피해서', '/prep/checklist/'],
      ['예식 지역·하객 규모 대략 정하기', '양가 부모님 손님 수를 먼저 여쭤 보기', ''],
      ['총예산 정하기', '신혼집 비용은 따로 계산', '/budget/budget-calculator/'],
      ['웨딩플래너 쓸지 정하기', '비용 방식과 연결 업체 범위 확인', '/budget/wedding-cost/'],
      ['예단·예물·함 범위 두 사람 생각 맞추기', '상견례 전에 맞춰 두면 자리가 편해짐', '/sanggyeonrye/agree-sheet/']
    ]],
    ['상견례와 예식장', 10, 8, [
      ['상견례 날짜·식당 예약', '독립된 룸, 양가 중간 위치, 주차 확인', '/sanggyeonrye/restaurant/'],
      ['상견례 선물 준비', '양가가 주고받을지·가격대를 미리 맞추기', '/sanggyeonrye/gift/'],
      ['상견례', '예단·예물 금액은 그 자리에서 정하지 않기', '/sanggyeonrye/order-talk/'],
      ['예식장 3~5곳 투어', '같은 기준으로 비교, 하루 2~3곳', '/wedding-day/venue-check/'],
      ['예식장 계약', '보증인원·식대 포함 항목·위약금을 계약서로 확인', '/wedding-day/venue-check/']
    ]],
    ['스드메와 신혼집', 8, 6, [
      ['스튜디오·드레스·메이크업 계약', '추가금을 견적서에 항목별로 적어 달라고 하기', '/budget/sdm-cost/'],
      ['본식 스냅·영상 예약', '원본 제공·작가 지정비·납품 기간 확인', '/budget/wedding-cost/'],
      ['신혼집 지역·예산 정하기', '대출·지원제도는 공식 누리집에서 최신 조건 확인', '']
    ]],
    ['신혼여행과 예물', 6, 4, [
      ['신혼여행 항공·숙소 예약', '여권 남은 기간 확인 (6개월 이상 요구하는 나라 많음)', '/honsu/honeymoon-prep/'],
      ['예물 고르기', '맞춤은 제작 기간이 있어 미리, 사이즈 수정 조건 확인', '/yedan/yemul/'],
      ['한복·혼주 한복 정하기', '양가 어머님 한복 색을 미리 맞추기', '/wedding-day/honju-hanbok/'],
      ['예단·이바지·폐백 확정', '각자 자기 부모님께 전하기', '/yedan/yedan/']
    ]],
    ['촬영과 혼수', 4, 3, [
      ['웨딩촬영', '누드톤 속옷·구두·소품 챙기기', '/prep/photo-shoot-prep/'],
      ['드레스 가봉', '본식 구두를 신고 길이 맞추기', ''],
      ['혼수 가전·가구 목록', '집 치수 재고, 배송일은 입주일 이후로', '/honsu/appliance-list/']
    ]],
    ['청첩장과 하객', 3, 2, [
      ['하객 명단 정리', '부모님 손님 수를 여쭤 인쇄 수량 정하기', ''],
      ['종이·모바일 청첩장 만들기', '이름·날짜·장소 오타 두 사람이 각각 확인', ''],
      ['사회·축가·축사 부탁', '두 달 전에, 거절해도 괜찮다는 말 함께', '/script/request-texts/'],
      ['예식 순서 정하기', '덕담·성혼선언은 부모님께 한 달 전에 부탁', '/wedding-day/ceremony-order/']
    ]],
    ['마무리 점검', 1.5, 0.25, [
      ['청첩장 돌리기 (6~4주 전)', '단체방보다 한 사람씩, 인사 한두 줄 덧붙이기', '/script/invitation-texts/'],
      ['답례품 주문', '보증인원보다 조금 넉넉히, 제작 기간 확인', '/dapre/wedding-favors/'],
      ['부케·부토니에·폐백 음식 주문', '폐백은 할 때만', '/yedan/pyebaek/'],
      ['예식장에 최종 보증인원 알리기', '통보 마감일을 계약서에서 확인', ''],
      ['당일 타임테이블·잔금 봉투 준비', '업체 이름을 봉투에 써서 나눠 두기', ''],
      ['축의금 받을 사람·가방 들 사람 정하기', '축의금 관리 방식을 양가와 미리 정하기', '/script/money-talk/']
    ]],
    ['당일과 그 뒤', 0, -1, [
      ['당일 준비물 챙기기', '신분증·잔금 봉투·반지·구두·사례 봉투', ''],
      ['축의금·방명록 정리', '누가 보냈는지 기록해 두기', ''],
      ['감사 문자 보내기 (1~2주 안)', '금액은 언급하지 않기', '/script/thank-you-texts/'],
      ['혼인신고', '성인 증인 2명 서명 필요', '/honsu/after-wedding/'],
      ['전입신고 (이사한 날부터 14일 안)', '정부24 온라인 가능', '/honsu/after-wedding/']
    ]]
  ];
  var KEY = 'wc-checklist-v1';
  var state = {};
  try { state = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { state = {}; }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }
  var dateEl = document.getElementById('cl-date');
  if (state.date) dateEl.value = state.date;
  function fmt(d) { return d.getFullYear() + '.' + (d.getMonth() + 1) + '.' + d.getDate(); }
  function before(base, m) { var d = new Date(base); d.setDate(d.getDate() - Math.round(m * 30.4)); return d; }
  function when(st, base) {
    var label = st[1] <= 0 ? '결혼식 당일·이후' : st[2] < 1 ? '결혼 6주 전~1주 전' : 'D-' + st[1] + '~' + st[2] + '개월';
    if (!base) return label;
    if (st[1] <= 0) return label + '<br><small>' + fmt(base) + '~</small>';
    return label + '<br><small>' + fmt(before(base, st[1])) + ' ~ ' + fmt(before(base, st[2])) + '</small>';
  }
  function render() {
    var base = dateEl.value ? new Date(dateEl.value + 'T00:00:00') : null;
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var total = 0, done = 0, html = '';
    S.forEach(function (st, si) {
      var late = base && st[1] > 0 && before(base, st[2]) < today;
      html += '<tr class="stage"><th colspan="3">' + (si + 1) + '단계 · ' + st[0] + '</th><th class="cl-when">' + when(st, base) + '</th></tr>';
      st[3].forEach(function (t, ti) {
        var id = si + '-' + ti, on = !!state[id];
        total++; if (on) done++;
        var name = t[2] ? '<a href="' + (window.BASE || '') + t[2] + '">' + t[0] + '</a>' : t[0];
        html += '<tr class="' + (on ? 'done' : late ? 'late' : '') + '"><td class="cl-box"><input type="checkbox" data-id="' + id + '"' + (on ? ' checked' : '') + ' aria-label="' + t[0] + '"></td><td colspan="2">' + name + (late && !on ? ' <span class="late-tag">늦음</span>' : '') + '</td><td class="cl-note">' + t[1] + '</td></tr>';
      });
    });
    document.getElementById('cl-body').innerHTML = html;
    document.getElementById('cl-prog').innerHTML = '<b>' + done + '</b> / ' + total + ' 완료' + (base ? ' · 결혼식 ' + fmt(base) + ' (D-' + Math.max(Math.ceil((base - today) / 864e5), 0) + ')' : '');
    document.getElementById('cl-bar').style.width = (total ? done / total * 100 : 0) + '%';
  }
  document.getElementById('cl-body').addEventListener('change', function (e) {
    var id = e.target.getAttribute('data-id'); if (!id) return;
    if (e.target.checked) state[id] = 1; else delete state[id];
    save(); render();
  });
  dateEl.addEventListener('change', function () { state.date = dateEl.value; save(); render(); });
  document.getElementById('cl-print').addEventListener('click', function () { window.print(); });
  document.getElementById('cl-reset').addEventListener('click', function () {
    if (!confirm('체크한 내용을 모두 지울까요? (결혼 날짜는 남겨 둡니다)')) return;
    state = { date: state.date }; save(); render();
  });
  render();
})();

/* ── 5. 혼수 체크리스트 (체크·예산은 이 브라우저에만 저장) ── */
(function () {
  var box = document.getElementById('hlist'); if (!box) return;
  var LV = ['필수', '있으면 좋음', '나중에', '집에 따라'];
  // [묶음, [[품목, 우선(0~3), 비고, 링크]]]  ※ 순서를 바꾸면 저장된 체크가 어긋나니 새 품목은 묶음 끝에 추가
  var G = [
    ['입주 전 준비', [
      ['신혼집 실측 (방·창문·현관·엘리베이터)', 0, '가로·세로·높이와 콘센트·배수구 위치를 사진과 함께 기록', ''],
      ['기본 옵션 확인 (에어컨·붙박이장·가스레인지)', 0, '있는 걸 또 사지 않게 집 계약 때 확인', ''],
      ['입주일·배송일 표 만들기', 0, '큰 가전·가구가 같은 날 몰리지 않게, 커튼은 입주 당일 필요', ''],
      ['설치비·폐가전 수거 확인', 0, '벽걸이·직렬 설치·이전 설치비가 따로 붙는지 계약 전에 확인', ''],
      ['보증서·영수증 보관 폴더', 1, '사진으로도 찍어 두면 A/S 때 편함', '']
    ]],
    ['가전', [
      ['냉장고', 0, '자리 폭·높이·깊이와 문 여는 방향, 반입 통로 폭 확인', '/honsu/appliance-list/'],
      ['세탁기·건조기', 0, '세탁실 폭·높이 실측, 위아래로 쌓으면 전용 설치 키트 필요, 일체형 세탁건조기도 비교, 배수구 위치 확인', '/honsu/appliance-list/'],
      ['무선 청소기', 0, '거치대 둘 자리와 콘센트 확인, 먼지통 비우기 방식 비교', ''],
      ['로봇청소기', 1, '문턱 높이와 바닥 짐 먼저 확인, 물걸레 겸용은 급수·배수 방식과 스테이션 자리 확인', ''],
      ['전자레인지', 0, '주방 상판이나 수납장 자리 확인', ''],
      ['전기밥솥', 0, '2인 가구는 작은 용량으로도 충분', ''],
      ['에어컨', 3, '배관 구멍·실외기 자리 확인, 설치비 별도인 경우 많음', ''],
      ['인덕션·가스레인지', 3, '인덕션은 전기 용량(전용 회로) 확인, 기본 설치 여부 먼저', ''],
      ['TV', 1, '벽걸이는 벽 재질과 설치비 확인, 소파와의 거리 고려', ''],
      ['식기세척기', 1, '설치 공간과 급수 연결 확인, 2인 가구는 작은 용량도 충분', ''],
      ['정수기', 1, '렌탈이면 약정 기간과 중도 해지 위약금 확인', ''],
      ['공기청정기', 2, '살아 보고 필요하면 사도 늦지 않음', ''],
      ['김치냉장고', 2, '김치를 많이 먹지 않으면 냉장고로 충분', ''],
      ['에어프라이어·커피머신', 2, '주방 상판이 금방 차니 자리부터 확인', '']
    ]],
    ['가구', [
      ['침대·매트리스', 0, '방 크기 실측, 현관·계단 통과 여부, 매트리스는 직접 누워 보기', ''],
      ['옷장·수납장', 0, '붙박이장 여부 먼저 확인, 천장 높이 실측', ''],
      ['식탁·의자', 0, '주방 동선과 의자 뒤로 뺄 공간 확인', ''],
      ['소파', 1, '거실 동선과 반입 크기 확인, 천 소재는 관리법 확인', ''],
      ['신발장·현관 수납', 3, '기본 신발장 크기 확인 후 부족하면 추가', ''],
      ['책상·작업 공간', 2, '재택근무를 하면 우선순위를 올리기', ''],
      ['화장대', 2, '서랍장 위 거울로 대신하는 경우도 많음', ''],
      ['조명·스탠드', 2, '기본 조명으로 살아 보고 바꿔도 됨', '']
    ]],
    ['주방', [
      ['냄비·프라이팬', 0, '인덕션이면 사용 가능 표시 확인', ''],
      ['식기·수저', 0, '2~4인 세트로 시작, 손님용은 나중에', ''],
      ['칼·도마·조리도구', 0, '도마는 고기·채소용 2개가 편함', ''],
      ['밀폐용기', 0, '같은 브랜드로 맞추면 쌓기 쉬움', ''],
      ['주방 세제·수세미·행주', 0, '입주 첫날 바로 필요', ''],
      ['손님용 식기', 2, '집들이 날짜가 정해지면 그때 준비', '']
    ]],
    ['침구·커튼·욕실·생활', [
      ['이불·베개', 0, '세탁할 때를 생각해 2세트, 계절에 맞게', ''],
      ['커튼·블라인드', 0, '창 크기(가로·세로) 실측, 침실은 암막 여부 정하기, 입주 첫날 밤부터 필요', ''],
      ['수건', 0, '1인당 5~6장이면 넉넉함', ''],
      ['욕실용품 (샤워기·매트·수납)', 0, '샤워기 헤드 규격, 수건걸이 위치 확인', ''],
      ['청소용품 (밀대·걸레·쓰레기통)', 0, '분리수거함은 놓을 자리부터 정하기', ''],
      ['빨래 건조대', 3, '건조기가 없으면 필수, 베란다 폭 확인', ''],
      ['멀티탭·공구', 0, '멀티탭은 개별 스위치·과부하 차단 제품', ''],
      ['상비약·구급함', 0, '해열제·소화제·밴드 정도로 시작', ''],
      ['소화기·화재감지기', 1, '주방 근처에 두고 사용법 미리 읽어 두기', ''],
      ['러그·쿠션 등 꾸미기', 2, '살면서 천천히, 예산이 남을 때', '']
    ]]
  ];
  var KEY = 'wc-honsu-v3', state = {};
  try { state = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { state = {}; }
  if (!state.c) state.c = {}; if (!state.w) state.w = {};
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }
  var filterEl = document.getElementById('hl-filter');
  if (state.f) filterEl.value = state.f;
  function n(v) { var x = parseFloat(String(v || '').replace(/,/g, '')); return isFinite(x) && x > 0 ? x : 0; }
  function money(v) { return Math.round(v).toLocaleString('ko-KR'); }
  function shown(lv) { var f = filterEl.value; return f === 'all' || f.indexOf(String(lv)) >= 0; }
  function summary() {
    var total = 0, done = 0, sum = 0, left = 0;
    G.forEach(function (g, gi) { g[1].forEach(function (t, ti) {
      if (!shown(t[1])) return;
      var id = gi + '-' + ti, w = n(state.w[id]); total++; sum += w;
      if (state.c[id]) done++; else left += w;
    }); });
    document.getElementById('hl-prog').innerHTML = '<b>' + done + '</b> / ' + total + ' 준비 완료' + (sum ? ' · 예산 합계 <b>' + money(sum) + '만원</b> (안 산 품목 ' + money(left) + '만원)' : '');
    document.getElementById('hl-bar').style.width = (total ? done / total * 100 : 0) + '%';
  }
  function render() {
    var html = '';
    G.forEach(function (g, gi) {
      var rows = '';
      g[1].forEach(function (t, ti) {
        if (!shown(t[1])) return;
        var id = gi + '-' + ti, on = !!state.c[id];
        var name = t[3] ? '<a href="' + (window.BASE || '') + t[3] + '">' + t[0] + '</a>' : t[0];
        rows += '<tr class="' + (on ? 'done' : '') + '"><td class="cl-box"><input type="checkbox" data-id="' + id + '"' + (on ? ' checked' : '') + ' aria-label="' + t[0] + '"></td><td class="hl-name">' + name + '<span class="hl-sub">' + t[2] + '</span></td><td class="hl-lv"><span class="lv lv' + t[1] + '">' + LV[t[1]] + '</span></td><td class="hl-won"><input type="text" inputmode="decimal" data-w="' + id + '" value="' + (state.w[id] || '') + '" aria-label="' + t[0] + ' 예산(만원)"></td><td class="cl-note">' + t[2] + '</td></tr>';
      });
      if (rows) html += '<tr class="stage"><th colspan="5">' + g[0] + '</th></tr>' + rows;
    });
    document.getElementById('hl-body').innerHTML = html;
    summary();
  }
  var body = document.getElementById('hl-body');
  body.addEventListener('change', function (e) {
    var id = e.target.getAttribute('data-id'); if (!id) return;
    if (e.target.checked) state.c[id] = 1; else delete state.c[id];
    e.target.closest('tr').className = e.target.checked ? 'done' : '';
    save(); summary();
  });
  body.addEventListener('input', function (e) {
    var id = e.target.getAttribute('data-w'); if (!id) return;
    var v = e.target.value.replace(/[^0-9.,]/g, ''); if (v !== e.target.value) e.target.value = v;
    if (v) state.w[id] = v; else delete state.w[id];
    save(); summary();
  });
  filterEl.addEventListener('change', function () { state.f = filterEl.value; save(); render(); });
  document.getElementById('hl-print').addEventListener('click', function () { window.print(); });
  document.getElementById('hl-reset').addEventListener('click', function () {
    if (!confirm('체크와 예산을 모두 지울까요?')) return;
    state = { c: {}, w: {}, f: state.f }; save(); render();
  });
  render();
})();

/* ── 6. 결혼 날짜 고르기 달력 (음력·공휴일 자료는 2026~2028년) ── */
(function () {
  var box = document.getElementById('wdate'); if (!box) return;
  // 음력 달이 시작하는 양력 날짜 [YYYYMMDD, 음력 월, 윤달 1] — korean-lunar-calendar(한국천문연구원 자료 기반)로 만듦
  var LM = [["20251220",11,0],["20260119",12,0],["20260217",1,0],["20260319",2,0],["20260417",3,0],["20260517",4,0],["20260615",5,0],["20260714",6,0],["20260813",7,0],["20260911",8,0],["20261011",9,0],["20261109",10,0],["20261209",11,0],["20270108",12,0],["20270207",1,0],["20270308",2,0],["20270407",3,0],["20270506",4,0],["20270605",5,0],["20270704",6,0],["20270802",7,0],["20270901",8,0],["20270930",9,0],["20271029",10,0],["20271128",11,0],["20271228",12,0],["20280127",1,0],["20280225",2,0],["20280326",3,0],["20280425",4,0],["20280524",5,0],["20280623",5,1],["20280722",6,0],["20280820",7,0],["20280919",8,0],["20281018",9,0],["20281116",10,0],["20281216",11,0]];
  // 공휴일 (2026년 11월 기준, 제헌절·노동절 포함, 임시공휴일 제외)
  var HOL = {"20260101":"신정연휴","20260216":"설날 전날","20260217":"설날","20260218":"설날 다음날","20260301":"삼일절","20260302":"삼일절 대체 휴일","20260501":"노동절","20260505":"어린이날","20260524":"부처님오신날","20260525":"부처님오신날 대체 휴일","20260603":"지방선거일","20260606":"현충일","20260717":"제헌절","20260815":"광복절","20260817":"광복절 대체 휴일","20260924":"추석 전날","20260925":"추석","20260926":"추석 다음날","20261003":"개천절","20261005":"개천절 대체 휴일","20261009":"한글날","20261225":"기독탄신일","20270101":"신정연휴","20270206":"설날 전날","20270207":"설날","20270208":"설날 다음날","20270209":"설날 대체 휴일","20270301":"삼일절","20270501":"노동절","20270503":"노동절 대체 휴일","20270505":"어린이날","20270513":"부처님오신날","20270606":"현충일","20270717":"제헌절","20270719":"제헌절 대체 휴일","20270815":"광복절","20270816":"광복절 대체 휴일","20270914":"추석 전날","20270915":"추석","20270916":"추석 다음날","20271003":"개천절","20271004":"개천절 대체 휴일","20271009":"한글날","20271011":"한글날 대체 휴일","20271225":"기독탄신일","20271227":"기독탄신일 대체 휴일","20280101":"신정연휴","20280126":"설날 전날","20280127":"설날","20280128":"설날 다음날","20280301":"삼일절","20280412":"국회의원 선거일","20280501":"노동절","20280502":"부처님오신날","20280505":"어린이날","20280606":"현충일","20280717":"제헌절","20280815":"광복절","20281002":"추석 전날","20281003":"개천절·추석","20281004":"추석 다음날","20281005":"추석 대체 휴일","20281009":"한글날","20281225":"기독탄신일"};
  var FIRST = new Date(2026, 0, 1), LAST = new Date(2028, 11, 31);
  function key(d) { return d.getFullYear() + ('0' + (d.getMonth() + 1)).slice(-2) + ('0' + d.getDate()).slice(-2); }
  function parse(k) { return new Date(+k.slice(0, 4), +k.slice(4, 6) - 1, +k.slice(6, 8)); }
  var starts = LM.map(function (x) { return [parse(x[0]).getTime(), x[1], x[2]]; });
  function lunar(d) {
    var t = d.getTime(), s = null;
    for (var i = starts.length - 1; i >= 0; i--) if (starts[i][0] <= t) { s = starts[i]; break; }
    if (!s) return null;
    return { m: s[1], leap: s[2], d: Math.round((t - s[0]) / 864e5) + 1 };
  }
  function off(d) { var w = d.getDay(); return w === 0 || w === 6 || !!HOL[key(d)]; }
  // 쉬는 날이 3일 넘게 이어지면 연휴
  var LONG = {};
  (function () {
    var d = new Date(FIRST), run = [];
    while (d <= LAST) {
      if (off(d)) run.push(key(d));
      else { if (run.length >= 3) run.forEach(function (k) { LONG[k] = 1; }); run = []; }
      d.setDate(d.getDate() + 1);
    }
    if (run.length >= 3) run.forEach(function (k) { LONG[k] = 1; });
  })();
  function season(m) { return [3, 4, 5, 6, 9, 10, 11].indexOf(m) >= 0 ? '성수기' : '비수기'; }
  function sonless(l) { return l && (l.d % 10 === 9 || l.d % 10 === 0); }
  var startEl = document.getElementById('wd-start'), lenEl = document.getElementById('wd-len'), onlyEl = document.getElementById('wd-weekend');
  var now = new Date(), opts = '', d0 = new Date(Math.max(new Date(now.getFullYear(), now.getMonth(), 1), FIRST));
  for (var d = new Date(d0); d <= LAST; d.setMonth(d.getMonth() + 1)) {
    opts += '<option value="' + d.getFullYear() + '-' + d.getMonth() + '">' + d.getFullYear() + '년 ' + (d.getMonth() + 1) + '월</option>';
  }
  startEl.innerHTML = opts;
  var WK = ['일', '월', '화', '수', '목', '금', '토'];
  function tags(d) {
    var k = key(d), l = lunar(d), t = [];
    if (sonless(l)) t.push(['son', '손 없는 날']);
    if (HOL[k]) t.push(['hol', HOL[k]]);
    else if (LONG[k]) t.push(['long', '연휴']);
    return t;
  }
  function render() {
    var p = startEl.value.split('-'), y = +p[0], m = +p[1], n = +lenEl.value, html = '', picks = [];
    for (var i = 0; i < n; i++) {
      var first = new Date(y, m + i, 1); if (first > LAST) break;
      var mm = first.getMonth() + 1, ss = season(mm);
      html += '<div class="wd-month"><h3>' + first.getFullYear() + '년 ' + mm + '월 <span class="wd-season ' + (ss === '성수기' ? 'hi' : 'lo') + '">' + ss + '</span></h3><div class="wd-grid">';
      html += WK.map(function (w, wi) { return '<b class="wd-wk' + (wi === 0 ? ' sun' : wi === 6 ? ' sat' : '') + '">' + w + '</b>'; }).join('');
      for (var b = 0; b < first.getDay(); b++) html += '<span class="wd-cell empty"></span>';
      for (var dd = new Date(first); dd.getMonth() === first.getMonth(); dd.setDate(dd.getDate() + 1)) {
        var wd = dd.getDay(), wkend = wd === 0 || wd === 6, l = lunar(dd), t = tags(dd), k = key(dd);
        var cls = 'wd-cell' + (wd === 0 || HOL[k] ? ' sun' : wd === 6 ? ' sat' : '') + (LONG[k] ? ' long' : '') + (sonless(l) ? ' son' : '') + (onlyEl.checked && !wkend ? ' dim' : '');
        html += '<span class="' + cls + '" title="' + t.map(function (x) { return x[1]; }).join(', ') + '"><b>' + dd.getDate() + '</b><small>' + (l ? (l.leap ? '윤' : '') + l.m + '.' + l.d : '') + '</small>' +
          (sonless(l) ? '<i class="dot" aria-label="손 없는 날"></i>' : '') + (HOL[k] ? '<em>' + HOL[k].replace(/ 대체 휴일$/, ' 대체') + '</em>' : '') + '</span>';
        if (wkend && sonless(l) && !LONG[k] && !HOL[k]) picks.push([new Date(dd), ss]);
      }
      html += '</div></div>';
    }
    document.getElementById('wd-cal').innerHTML = html;
    var lo = picks.filter(function (x) { return x[1] === '비수기'; }).length;
    document.getElementById('wd-picks').innerHTML = picks.length
      ? '<h3>주말 + 손 없는 날 + 연휴 아님: ' + picks.length + '일' + (lo ? ' <small>(비수기 ' + lo + '일)</small>' : '') + '</h3><ul class="wd-list">' + picks.map(function (x) {
          var dd = x[0], l = lunar(dd);
          return '<li><b>' + dd.getFullYear() + '.' + (dd.getMonth() + 1) + '.' + dd.getDate() + ' (' + WK[dd.getDay()] + ')</b> <small>음력 ' + l.m + '.' + l.d + '</small> <span class="wd-season ' + (x[1] === '성수기' ? 'hi' : 'lo') + '">' + x[1] + '</span></li>';
        }).join('') + '</ul>'
      : '<p class="note">이 기간에는 세 조건을 모두 갖춘 주말이 없습니다. 기간을 늘려 보세요.</p>';
  }
  [startEl, lenEl, onlyEl].forEach(function (el) { el.addEventListener('change', render); });
  document.getElementById('wd-print').addEventListener('click', function () { window.print(); });
  render();
})();

/* ── 7. 축사·사회 대본 만들기 ───────────────────────── */
(function () {
  var box = document.getElementById('speech'); if (!box) return;
  function v(id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; }
  function has(s) { var c = s.charCodeAt(s.length - 1); return c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 !== 0; }
  // 받침에 맞는 조사: j(이름, '이', '가')
  function j(s, a, b) { return s + (s && has(s) ? a : b); }
  // 친구 부를 때: 받침 있으면 '이' 붙임 (민수 → 민수, 지은 → 지은이)
  function call(s) { return s && has(s) ? s + '이' : s; }
  function given(s) { return s.length >= 3 ? s.slice(1) : s; }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  var mode = 'toast';
  Array.prototype.forEach.call(box.querySelectorAll('[data-mode]'), function (b) {
    b.addEventListener('click', function () {
      mode = b.getAttribute('data-mode');
      Array.prototype.forEach.call(box.querySelectorAll('[data-mode]'), function (x) { x.classList.toggle('is-on', x === b); });
      Array.prototype.forEach.call(box.querySelectorAll('[data-only]'), function (x) { x.hidden = x.getAttribute('data-only') !== mode; });
      run();
    });
  });
  function toast() {
    var g = v('sp-groom') || '신랑', br = v('sp-bride') || '신부', me = v('sp-me') || '○○○';
    var side = v('sp-side'), friend = side === 'b' ? br : g, other = side === 'b' ? g : br;
    var o = other + ' 씨', f = call(given(friend)), rel = v('sp-rel') || '오랜 친구', yrs = v('sp-years'), ep = v('sp-ep'), imp = v('sp-imp'), tone = v('sp-tone');
    var P = [];
    P.push('안녕하세요. 저는 ' + (side === 'b' ? '신부' : '신랑') + ' ' + friend + '의 ' + rel + ', ' + me + '입니다.');
    if (tone === 'short') {
      P.push((yrs ? yrs + '년 동안 ' : '') + '곁에서 지켜본 ' + f + '는 누구보다 따뜻한 사람입니다. 그런 ' + f + '가 평생을 함께할 ' + o + '를 만나 오늘 이 자리에 섰습니다.');
      P.push(g + ', ' + br + ' 두 사람, 지금처럼 서로를 아끼며 행복하게 살기를 진심으로 응원합니다. 결혼 축하해!');
      return P;
    }
    P.push('먼저 바쁘신 중에도 두 사람의 앞날을 축복하러 와 주신 양가 부모님과 하객 여러분께 감사드립니다. 그리고 이렇게 소중한 자리에서 축사를 할 수 있게 해 준 ' + g + ', ' + br + ' 두 사람에게도 고맙다는 말을 전합니다.');
    var p2 = (yrs ? '제가 ' + f + '를 알고 지낸 지 벌써 ' + yrs + '년이 되었습니다. ' : '') ;
    if (tone === 'fun') p2 += f + '는 겉으로는 무심한 척하지만, 친구가 힘들 때면 제일 먼저 연락하는 사람입니다. 물론 답장은 가끔 하루 뒤에 오지만요.';
    else p2 += f + '는 말보다 행동으로 마음을 보여 주는 사람입니다. 제가 힘들 때마다 아무 말 없이 곁을 지켜 준 친구였습니다.';
    P.push(p2);
    if (ep) {
      var e = ep.replace(/[.!?]+$/, '');
      P.push('아직도 잊지 못하는 기억이 있습니다. ' + (/[다요]$/.test(e) ? e + '.' : '바로 ' + e + '입니다.') + ' 그때 저는 ' + f + '가 정말 좋은 사람이라는 걸 다시 한번 느꼈습니다.');
    }
    var p4 = imp ? '그런 ' + f + '가 ' + o + '를 처음 소개해 준 날을 기억합니다. ' + imp + (/[.!?]$/.test(imp) ? '' : '.') + ' ' : '그런 ' + f + '가 ' + o + '를 만나고 나서 눈에 띄게 밝아졌습니다. ';
    p4 += tone === 'fun' ? '연애 이야기만 나오면 휴대폰부터 꺼내 사진을 보여 주던 모습이 아직도 생생합니다. 이제는 그 사진을 보는 대신 두 사람의 행복한 모습을 직접 보게 되어 기쁩니다.' : '두 사람이 함께 있는 모습을 보면, 서로에게 꼭 맞는 사람을 만났다는 게 느껴집니다.';
    P.push(p4);
    P.push(tone === 'fun'
      ? g + ', ' + br + '! 앞으로 살다 보면 다툴 일도 있겠지만, 그럴 때는 오늘 이 자리에서 서로를 바라보던 눈빛을 떠올려 주세요. 그리고 싸우더라도 저한테 전화하는 건 자정 전까지만 부탁합니다.'
      : g + ', ' + br + ' 두 사람, 살다 보면 좋은 날도 힘든 날도 있겠지만 오늘의 마음을 잊지 말고 서로에게 가장 든든한 편이 되어 주세요.');
    P.push('두 사람의 새로운 시작을 진심으로 축하합니다. 여러분, 앞으로 행복하게 살아갈 두 사람에게 큰 박수 부탁드립니다. 감사합니다.');
    return P;
  }
  function emcee() {
    var g = v('sp-groom') || '○○○', br = v('sp-bride') || '○○○', me = v('sp-me') || '○○○', rel = v('sp-mrel') || '친구';
    var style = v('sp-style'), singer = v('sp-singer'), blesser = v('sp-bless') || '신랑 아버님', candle = document.getElementById('sp-candle').checked;
    var L = [], n = 0;
    function step(t, s) { n++; L.push('【' + n + '. ' + t + '】\n' + s); }
    L.push('(예식 5분 전) 잠시 후 신랑 ' + g + ' 군과 신부 ' + br + ' 양의 결혼식을 시작하겠습니다. 하객 여러분께서는 자리에 앉아 주시고, 휴대폰은 진동으로 바꿔 주시기 바랍니다.');
    step('개식 선언', '안녕하십니까. 오늘 사회를 맡은 ' + (v('sp-side') === 'b' ? '신부' : '신랑') + '의 ' + rel + ' ' + me + '입니다. 바쁘신 중에도 두 사람의 앞날을 축복하기 위해 와 주신 하객 여러분께 신랑·신부를 대신해 감사 인사를 드립니다. 지금부터 신랑 ' + g + ' 군과 신부 ' + br + ' 양의 결혼식을 시작하겠습니다.');
    if (candle) step('화촉 점화', '먼저 두 사람의 앞날을 밝히는 화촉 점화가 있겠습니다. 양가 어머님께서는 앞으로 나와 주시기 바랍니다. 하객 여러분, 큰 박수로 맞아 주십시오.');
    step('신랑 입장', '다음은 신랑 입장입니다. 오늘의 주인공, 신랑 ' + g + ' 군 입장!');
    step('신부 입장', '이어서 신부 입장이 있겠습니다. 오늘 가장 아름다운 신부, ' + br + ' 양이 아버님과 함께 입장합니다. 큰 박수 부탁드립니다.');
    step('맞절', '신랑·신부는 서로 마주 보고 맞절을 하겠습니다. 신랑·신부 맞절!');
    if (style === 'jurye') {
      step('혼인 서약', '다음은 혼인 서약입니다. 주례 선생님께서 진행해 주시겠습니다.');
      step('성혼 선언', '주례 선생님께서 두 사람이 부부가 되었음을 선언해 주시겠습니다.');
      step('주례사', '두 사람의 앞날을 위해 주례 선생님께서 좋은 말씀을 해 주시겠습니다.');
    } else {
      step('혼인 서약', '다음은 두 사람이 직접 준비한 혼인 서약입니다. 신랑·신부는 하객 여러분을 향해 서 주시기 바랍니다.');
      step('성혼선언문 낭독', (style === 'mc' ? '두 사람이 부부가 되었음을 제가 대신 선언하겠습니다. (성혼선언문 낭독)' : '이어서 신부 아버님께서 성혼선언문을 낭독해 주시겠습니다.') + ' 이로써 두 사람이 부부가 되었음을 하객 여러분 앞에 엄숙히 선언합니다. 큰 박수로 축하해 주십시오.');
      step('덕담', blesser + '께서 두 사람에게 덕담을 해 주시겠습니다.');
    }
    if (singer) step('축가', '두 사람을 위해 ' + j(singer, '이', '가') + ' 축가를 준비했습니다. 큰 박수로 맞아 주십시오.\n(축가 후) 아름다운 노래 감사합니다. 다시 한번 큰 박수 부탁드립니다.');
    step('양가 부모님께 인사', '신랑·신부는 키워 주신 은혜에 감사하는 마음을 담아 양가 부모님께 인사드리겠습니다. 먼저 신부 측 부모님께, 이어서 신랑 측 부모님께 인사드립니다.');
    step('하객 인사', '이번에는 오늘 와 주신 하객 여러분께 감사 인사를 드리겠습니다. 신랑·신부, 하객 여러분께 인사!');
    step('행진', '이제 두 사람이 부부로서 첫걸음을 내딛는 행진이 있겠습니다. 하객 여러분, 가장 큰 박수와 환호로 축하해 주십시오. 신랑·신부 행진!');
    step('폐식과 사진 안내', '이상으로 신랑 ' + g + ' 군과 신부 ' + br + ' 양의 결혼식을 모두 마치겠습니다. 잠시 후 사진 촬영이 있겠습니다. 양가 가족분들, 친척분들, 그리고 친구분들 순서로 촬영하겠으니 자리에서 잠시 기다려 주십시오. 식사는 ○층 연회장에서 하시면 됩니다. 감사합니다.');
    return L;
  }
  function run() {
    var out = document.getElementById('sp-out'), text;
    if (mode === 'toast') text = toast().join('\n\n'); else text = emcee().join('\n\n');
    var chars = text.replace(/\s/g, '').length, min = Math.max(1, Math.round(chars / 300 * 2) / 2);
    out.innerHTML = '<p class="note">약 ' + chars.toLocaleString('ko-KR') + '자 · 소리 내어 읽으면 ' + min + '분 안팎</p><div class="script sp-text">' + esc(text).split('\n\n').map(function (p) { return '<p>' + p.replace(/\n/g, '<br>') + '</p>'; }).join('') + '</div>';
    out.setAttribute('data-text', text);
  }
  box.addEventListener('input', run); box.addEventListener('change', run);
  document.getElementById('sp-copy').addEventListener('click', function () {
    var t = document.getElementById('sp-out').getAttribute('data-text') || '', b = this;
    function ok() { b.textContent = '복사했어요'; setTimeout(function () { b.textContent = '대본 복사하기'; }, 1500); }
    if (navigator.clipboard) navigator.clipboard.writeText(t).then(ok, function () {}); 
  });
  document.getElementById('sp-print').addEventListener('click', function () { window.print(); });
  run();
})();
