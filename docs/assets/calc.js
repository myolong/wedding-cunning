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
      var html = '<h3>비교 결과</h3><p class="big">' + same.length + ' / ' + Q.length + '<small>이미 같은 생각</small></p>';
      if (talk.length) html += '<p><b>먼저 이야기할 것:</b> ' + talk.map(function (i) { return '<a href="' + (window.BASE || '') + Q[i][3] + '">' + Q[i][0] + '</a>'; }).join(', ') + '</p>';
      if (near.length) html += '<p><b>조금만 맞추면 되는 것:</b> ' + near.map(function (i) { return Q[i][0]; }).join(', ') + '</p>';
      html += '<div class="table-wrap"><table><thead><tr><th>항목</th><th>' + esc(na || '신랑 측') + '</th><th>' + esc(nb || '신부 측') + '</th><th>상태</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
      html += '<p class="note">"상관없음"을 고른 항목은 맞춰 줄 수 있다는 뜻으로 보고 "맞음"으로 표시했습니다. 이 결과는 어디에도 저장되지 않으니, 필요하면 인쇄하거나 화면을 캡처해 두세요.</p><p><button type="button" class="btn-plain" onclick="window.print()">인쇄하기</button></p>';
      res.innerHTML = html; res.hidden = false;
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
