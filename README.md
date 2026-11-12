# 결혼컨닝

처음 하는 결혼 준비 컨닝페이퍼 (정적 사이트, GitHub Pages /docs 배포).

- `python3 build.py` → `src/` 를 읽어 `docs/` 생성 (빌드 후 `src/dates.json`도 함께 커밋)
- 사이트 설정(도메인, 애드센스, 검색엔진 인증): `build.py` 맨 위
- 메뉴 하나 = `src/sections/<id>/` (section.json, items.json, guides/*.html)
- 가이드 머리말 `calc: yes` → 도구 스크립트가 붙고 홈 '결혼 준비 도구'에 표시, `js: yes` → 스크립트만 붙음(대본 복사 버튼)
- 도구 스크립트: `src/assets/calc.js` (결혼 예산 나누기, 양가 의견 맞추기표, 대본 복사). 모두 브라우저 안에서만 처리
- 양가 의견 맞추기표 질문을 바꾸면 `calc.js`의 `Q` 배열 순서를 유지할 것 (이미 보낸 링크의 답 순서가 바뀜)
- 세금(증여·축의금 과세 등) 내용은 다루지 않음
