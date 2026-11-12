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
    function run() {
      var total = num('wb-total'), guests = num('wb-guests'), gift = num('wb-gift');
      var out = $('wb-out');
      if (!total) { out.innerHTML = '<p class="note">총예산을 넣으면 바로 나눠 드립니다.</p>'; return; }
      var w = ITEMS.map(function (it) { return it[2] && $(it[2]) && $(it[2]).checked ? it[3] : it[1]; });
      var sum = w.reduce(function (a, b) { return a + b; }, 0);
      var amt = w.map(function (x) { return total * x / sum; });
      var html = '<p class="big">' + man(total) + '<small>총예산 (신혼집 제외)</small></p>';
      html += '<table class="rows"><tbody>' + ITEMS.map(function (it, i) {
        return '<tr><td><a href="' + (window.BASE || '') + it[4] + '">' + it[0] + '</a> <small>(' + Math.round(w[i] / sum * 100) + '%)</small></td><td>' + (w[i] ? man(amt[i]) : '생략') + '</td></tr>';
      }).join('') + '</tbody></table>';
      if (guests > 0) {
        var per = amt[0] * 10000 / guests;
        html += '<p class="note" style="margin-top:12px"><b>하객 1명당 예식장 예산: 약 ' + won(per) + '</b><br>대관료가 따로 붙는 곳이면 식대로 쓸 수 있는 돈은 이보다 적습니다. 예식장 견적의 1인 식대 × 보증인원이 이 금액 안에 들어오는지 먼저 비교해 보세요.</p>';
      }
      if (gift > 0 && guests > 0) {
        var inflow = gift * guests / 10000;
        html += '<table class="rows"><tbody><tr><td>예상 축의금 (하객 수 × 입력한 금액)</td><td>' + man(inflow) + '</td></tr>' +
          '<tr><td>축의금을 뺀 실제 부담</td><td>' + man(Math.max(total - inflow, 0)) + '</td></tr></tbody></table>' +
          '<p class="note">축의금은 양가가 각자 관리하는 집도 많아서, 두 사람 예산에 넣을지는 먼저 양가와 이야기해 두세요.</p>';
      }
      html += '<p class="note">비율은 항목을 고루 나눈 예시입니다. 지역·업체·하객 수에 따라 크게 달라지니, 우리에게 중요한 항목에 더 주고 덜 중요한 항목을 줄여 조정하세요.</p>';
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
      ['커튼·블라인드', 0, '창 크기 실측, 입주 첫날 밤부터 필요', ''],
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
    ['침구·욕실·생활', [
      ['이불·베개', 0, '세탁할 때를 생각해 2세트, 계절에 맞게', ''],
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
  var KEY = 'wc-honsu-v2', state = {};
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
