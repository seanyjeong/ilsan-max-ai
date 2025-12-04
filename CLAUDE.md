# CLAUDE.md

## 프로젝트 개요
일산맥스AI - 일산맥스 체육학원용 AI 어시스턴트
- P-ACA 학원관리시스템 연동 (academy_id = 2)
- 정시 입시 정보 DB 연동

## 기술 스택
- **백엔드 API**: Express.js (포트 8321, 경로: /maxai)
- **워크플로우**: n8n (https://n8n.sean8320.dedyn.io/)
- **LLM**: Google Gemini Pro (n8n AI Agent)
- **DB**: MySQL (jungsi - 입시정보, paca - 학원관리)

## 파일 구조
```
/home/sean/ilsan-max-ai/
├── ilsan-max.js        # Express API 서버
├── n8n-workflow.json   # n8n 워크플로우 (import용)
└── CLAUDE.md
```

## DB 연결 정보

### jungsi DB (입시 정보)
- Host: 211.37.174.218
- User: maxilsan
- Password: q141171616!
- Database: jungsi
- 테이블:
  - `정시기본` - 대학/학과 기본 정보 (U_ID, 대학명, 학과명, 학년도)
  - `정시반영비율` - 수능/실기 반영 비율
  - `정시_원본반영표` - 원본 반영표 (보여주기용)
  - `정시실기배점` - 실기 종목별 배점표 (종목명, 성별, 기록, 배점)

### paca DB (학원 관리)
- Host: 211.37.174.218
- User: maxilsan
- Password: q141171616!
- Database: paca
- 테이블: students, student_payments, attendance, class_schedules, instructors

## API 엔드포인트

### 대학 정보 (/maxai/api/universities)
| 경로 | 설명 |
|------|------|
| GET /search?name=검색어&year=2026 | 대학/학과 검색 |
| GET /:uid?year=2026 | 대학 상세 정보 |
| POST /calculate-score | 실기 점수 계산 |

### 학원 관리 (/maxai/api/paca) - academy_id = 2 고정
| 경로 | 설명 |
|------|------|
| GET /dashboard | 대시보드 요약 |
| GET /students | 학생 목록 |
| GET /unpaid | 전체 미납자 |
| GET /today-unpaid?date= | 오늘 수업 예정자 중 미납자 |
| GET /today-attendance?date= | 오늘 수업 예정 학생 |
| GET /revenue?year=&month= | 매출 조회 |
| GET /instructors | 강사 목록 |

## API 인증
- Header: `x-api-key: ilsan-max-ai-key-2024`

## n8n 워크플로우 구조

```
Chat Trigger → Gemini(의도분석) → JSON파싱 → IF(API필요?)
                                                ├─ Yes → URL생성 → HTTP요청 → Gemini(응답생성) → 출력
                                                └─ No → 일반대화 응답 → 출력
```

### 의도분석 시스템 프롬프트 핵심
- 약어 변환: 스교→스포츠교육, 체교→체육교육, 스과→스포츠과학
- 대학명 약어: 숙대→숙명, 국대→국민, 한대→한양
- 대학/입시 질문은 무조건 API 호출 (Gemini 지식 사용 금지)
- JSON 출력: `{"action":"api","type":"university|paca","endpoint":"...","params":{...}}`

### 응답생성 시스템 프롬프트 핵심
- 숫자 읽기 쉽게 (300000 → 30만원)
- today-unpaid는 "오늘 수업 예정인 학생 중 미납자"
- 총액은 말하지 마 (민감정보)
- 실기배점표는 종목별 표 형태로 표시

## 배포

### 서버 정보
- **서버**: 211.37.174.218 (cafe24)
- **SSH**: root / Qq141171616!
- **코드 위치**: /root/supermax/ilsan-max-ai
- **서비스명**: ilsan-max
- **포트**: 8321
- **nginx**: supermax.kr/maxai → localhost:8321

### 자동 배포 (n8n webhook)
- GitHub push → n8n webhook 호출 → git pull + systemctl restart ilsan-max
- Webhook URL: https://n8n.sean8320.dedyn.io/webhook/ilsan-max-deploy

### 수동 배포/재시작
```bash
ssh root@211.37.174.218
cd /root/supermax/ilsan-max-ai
git pull
systemctl restart ilsan-max
systemctl status ilsan-max
journalctl -u ilsan-max -f  # 로그 확인
```

### n8n 워크플로우 (별도 관리!)
- n8n-workflow.json은 git으로 관리되지만, **실제 n8n에는 수동 import 필요**
- n8n 웹(https://n8n.sean8320.dedyn.io/)에서 직접 수정해야 함

## 현재 상태 및 이슈

### 작동 확인된 기능
- API 서버 실행 (health check OK)
- P-ACA 학원 데이터 조회 (students, unpaid, attendance 등)

### 확인 필요한 이슈
- jungsi DB 데이터 조회가 갑자기 안 됨 (처음엔 됐음)
- 국민대 스교 검색 → 빈 결과 반환
- 원인 추정: DB 연결 또는 테이블 조회 문제

### 디버깅 방법
```bash
# 서버에서 직접 DB 쿼리 테스트
mysql -u maxilsan -p'q141171616!' jungsi -e "SELECT COUNT(*) FROM 정시기본 WHERE 학년도 = 2026;"

# ilsan-max-ai 서비스 로그
journalctl -u ilsan-max-ai -f

# API 직접 테스트
curl -H "x-api-key: ilsan-max-ai-key-2024" "https://supermax.kr/maxai/api/universities/search?name=국민&year=2026"
```

## 참고
- P-ACA 프로젝트: `/home/sean/pacapro` (프론트), `/home/sean/supermax/paca/backend` (백엔드)
- 기존 정시 시스템: `/home/sean/supermax/jungsi.js`
