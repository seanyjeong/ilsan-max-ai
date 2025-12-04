# CLAUDE.md

## 프로젝트 개요
**일산맥스AI** - 일산맥스 체육학원 강사용 AI 어시스턴트
- 학원 현황, 미납자, 출석, 강사 스케줄 조회
- 정시 입시 정보 (대학/학과 검색, 실기배점표)
- 랜덤 지목 기능 (주사위 굴리기)
- 개발자: 정으뜸 원장님

## 현재 버전
- **프론트엔드**: v1.2.1
- **Git**: main 브랜치

## 기술 스택
| 구분 | 기술 | 비고 |
|------|------|------|
| 백엔드 API | Express.js | 포트 8321, 경로 /maxai |
| AI 워크플로우 | n8n | https://n8n.sean8320.dedyn.io/ |
| LLM | Google Gemini Pro | n8n AI Agent |
| DB | MySQL | jungsi(입시), paca(학원) |
| 프론트엔드 | HTML/JS | public/index.html |

## 파일 구조
```
/home/sean/ilsan-max-ai/
├── ilsan-max.js                  # Express API 서버
├── public/
│   └── index.html                # 채팅 UI (https://supermax.kr/maxai/)
├── n8n-workflow-with-memory.json # n8n 워크플로우 (메모리 포함, 현재 사용중)
├── n8n-workflow.json             # n8n 워크플로우 (기본, 미사용)
└── CLAUDE.md
```

## 인증 정보

### API 인증
- **Header**: `x-api-key: ilsan-max-ai-key-2024`

### DB 연결
| DB | Host | User | Password | Database |
|----|------|------|----------|----------|
| 입시 | 211.37.174.218 | maxilsan | q141171616! | jungsi |
| 학원 | 211.37.174.218 | maxilsan | q141171616! | paca |

### 서버 SSH
- **IP**: 211.37.174.218 (cafe24)
- **계정**: root / Qq141171616!
- **코드 위치**: /root/supermax/ilsan-max-ai

### n8n
- **URL**: https://n8n.sean8320.dedyn.io/
- **Gemini API**: 잼미니ai (credential ID: rIawsYBi86ezULt5)

## API 엔드포인트

### 학원 관리 (/maxai/api/paca) - academy_id = 2 고정
| 경로 | 설명 |
|------|------|
| GET /dashboard | 대시보드 요약 |
| GET /students | 학생 목록 |
| GET /students/search?name=이름 | 학생 검색 (전화번호 조회) |
| GET /students/payment?name=이름&year_month=2025-12 | 학생 결제 조회 |
| GET /unpaid | 전체 미납자 |
| GET /today-unpaid?date= | 오늘 수업 예정자 중 미납자 |
| GET /today-attendance?date= | 오늘 수업 예정 학생 |
| GET /revenue?year=&month= | 매출 조회 |
| GET /instructors | 강사 목록 |
| GET /instructor-schedule?date=&time_slot=&year_month= | 출근 강사 조회 |

### 대학 정보 (/maxai/api/universities)
| 경로 | 설명 |
|------|------|
| GET /search?name=검색어&year=2026 | 대학/학과 검색 |
| GET /:uid?year=2026 | 대학 상세 정보 |
| POST /calculate-score | 실기 점수 계산 |

### 채팅 프록시
| 경로 | 설명 |
|------|------|
| POST /maxai/chat | n8n 챗봇 프록시 (CORS 우회) |

## n8n 워크플로우 구조 (현재)

```
Chat Trigger → AI Agent(의도분석) → JSON파싱 → IF(API필요?)
                                                  ├─ Yes → URL생성 → API호출 → IF(랜덤지목?)
                                                  │                              ├─ Yes → 랜덤선택 Code → AI Agent(응답생성)
                                                  │                              └─ No → AI Agent(응답생성)
                                                  └─ No → 일반대화 응답 포맷
```

### 주요 노드
| 노드 | 역할 |
|------|------|
| Chat Trigger | 웹훅 (ilsan-max-ai-chat) |
| AI Agent - 의도분석 | 사용자 입력 → JSON 라우팅 |
| Memory - 의도분석 | 대화 기록 10개 저장 |
| JSON 파싱 | AI 출력에서 JSON 추출 |
| API 호출 필요? | action === "api" 체크 |
| URL 생성 | API URL 생성 |
| API 호출 | HTTP Request |
| 랜덤지목 | random_pick === true 체크 |
| Code in JavaScript | 주사위 굴리기 (1-99), 원장님 포함 |
| AI Agent - 응답생성 | API 데이터 → 자연어 응답 |
| Memory - 응답생성 | 대화 기록 10개 저장 |

### 랜덤 지목 기능
- 커피, 점심, 청소 등 "누가 할래?" 질문에 주사위 굴림
- 출근 강사 + 정으뜸 원장님 중 랜덤 선택
- 1-99 점수로 가장 높은 사람 당첨
- 결과: 주사위 점수 전체 공개 + 당첨자 발표

### 의도분석 프롬프트 핵심
```
- JSON만 출력! 텍스트 금지!
- 약어 변환: 스교→스포츠교육, 체교→체육교육, 스레→스포츠레저
- 대학명 약어: 숙대→숙명, 국대→국민, 한대→한양, 성신→성신여자대학교
- 종목 약어: 제멀→제자리멀리뛰기, 윗몸→윗몸일으키기
- 랜덤 지목: random_pick: true 추가
- 잡담/반응도 JSON으로 처리
```

### 응답생성 프롬프트 핵심
```
- API 데이터만 사용! 추측 금지!
- 숫자: 300000 → 30만원
- 실기배점표: 종목별 정렬해서 표시
- 랜덤지목: diceResults 전체 보여주고 당첨자 발표
- 총액/매출 금액은 말하지 마 (민감정보)
```

## 배포

### 자동 배포
- GitHub push → n8n webhook → git pull + systemctl restart
- Webhook: https://n8n.sean8320.dedyn.io/webhook/ilsan-max-deploy

### 수동 배포
```bash
ssh root@211.37.174.218
cd /root/supermax/ilsan-max-ai
git pull
systemctl restart ilsan-max
journalctl -u ilsan-max -f  # 로그 확인
```

### 서비스 관리
```bash
systemctl status ilsan-max
systemctl restart ilsan-max
systemctl stop ilsan-max
```

## 중요 사항

### n8n 워크플로우 관리
- `n8n-workflow-with-memory.json`은 git으로 관리
- **실제 n8n에는 수동 import 필요!**
- n8n 웹에서 직접 수정 후 JSON export 권장

### DB 테이블 (paca)
- **students**: 학생 정보 (academy_id = 2)
- **student_payments**: 결제 정보
- **instructors**: 강사 정보
- **instructor_schedules**: 강사 출근 스케줄
- **class_schedules**: 수업 스케줄
- **attendance**: 출석 기록
- **academy_settings**: 학원 설정 (tuition_due_day 등)

### DB 테이블 (jungsi)
- **정시기본**: 대학/학과 기본 정보
- **정시반영비율**: 수능/실기 반영 비율
- **정시실기배점**: 실기 종목별 배점표
- **정시_원본반영표**: 원본 반영표

## 디버깅

### API 테스트
```bash
# 대학 검색
curl -H "x-api-key: ilsan-max-ai-key-2024" \
  "https://supermax.kr/maxai/api/universities/search?name=국민&year=2026"

# 미납자 조회
curl -H "x-api-key: ilsan-max-ai-key-2024" \
  "https://supermax.kr/maxai/api/paca/unpaid"

# 강사 스케줄
curl -H "x-api-key: ilsan-max-ai-key-2024" \
  "https://supermax.kr/maxai/api/paca/instructor-schedule"
```

### DB 쿼리 테스트
```bash
mysql -u maxilsan -p'q141171616!' jungsi -e "SELECT COUNT(*) FROM 정시기본 WHERE 학년도 = 2026;"
mysql -u maxilsan -p'q141171616!' paca -e "SELECT * FROM instructors WHERE academy_id = 2;"
```

### 로그 확인
```bash
journalctl -u ilsan-max -f
```

## 관련 프로젝트
- **P-ACA 프론트**: /home/sean/pacapro
- **P-ACA 백엔드**: /home/sean/supermax/paca/backend
- **정시 시스템**: /home/sean/supermax/jungsi.js

## 변경 이력
| 날짜 | 버전 | 내용 |
|------|------|------|
| 2025-12-05 | 1.2.1 | 잡담/반응 JSON 처리 개선 |
| 2025-12-05 | 1.2.0 | 랜덤 지목 주사위 기능 (1-99, 원장님 포함) |
| 2025-12-04 | 1.1.x | 랜덤 지목 기본 기능, 강사별 출근 횟수 조회 |
| 2025-12-04 | 1.0.x | 채팅 UI, 배점표 테이블 렌더링, 메모리 기능 |
