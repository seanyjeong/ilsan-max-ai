# 일산맥스AI - 학원 전용 AI 어시스턴트

## 프로젝트 개요
P-ACA 학원관리시스템과 연동되는 별도 AI 어시스턴트 프로젝트.
기존 MySQL 데이터 + 입시 정보 문서 기반 RAG 시스템.

---

## 데이터 소스

### 1. MySQL (P-ACA 연동)
- 학생 정보 (students)
- 납부 내역 (student_payments)
- 출석 기록 (attendance)
- 강사 정보 (instructors)
- 급여 정보 (salaries)
- 수업 스케줄 (schedules)
- 시즌 정보 (seasons)

### 2. 문서 RAG (Supabase pgvector)
- 대학별 입시 정보
- 실기 배점/비율
- 커트라인 정보
- 종목별 점수 환산표

---

## 예시 질문

### 시스템 데이터 (MySQL 쿼리)
- "11월 매출 얼마야?"
- "미납자 누구야?"
- "내 12월 스케줄 알려줘"
- "내 수업일수 몇 일이야?"
- "김OO 학생 출석률 어때?"
- "이번달 강사별 급여 현황"

### 입시 정보 (문서 RAG)
- "서울대 체육교육과 25년 실기 비율 얼마야?"
- "한양대 체육학과 제멀 287 몇 점이야?"
- "인하대 스포츠과학과 커트라인?"
- "경희대 체대 실기 종목 뭐야?"

---

## 권한 체계

| 역할 | 접근 가능 데이터 |
|------|-----------------|
| owner | 전체 (매출, 학생, 강사, 급여 등) |
| admin | 학생, 출석, 스케줄 |
| teacher | 본인 스케줄, 본인 급여, 담당 학생 |
| student/parent | 본인 납부내역, 본인 스케줄, 출석 |
| guest | 입시 정보만 (문서 RAG) |

---

## 기술 스택

- **프론트엔드**: Next.js (별도 프로젝트 - `ilsan-max-ai`)
- **백엔드/워크플로우**: n8n
- **벡터 DB**: Supabase pgvector
- **LLM**: Claude API 또는 OpenAI
- **기존 DB 연동**: MySQL (P-ACA)

---

## 아키텍처

```
[사용자] → [Next.js 채팅 UI]
              ↓
         [n8n 워크플로우]
              ↓
         [권한 체크 (JWT 기반)]
              ↓
    ┌─────────┴─────────┐
    ↓                   ↓
[MySQL 쿼리]    [Supabase 벡터 검색]
(시스템 데이터)    (입시 정보 문서)
    └─────────┬─────────┘
              ↓
         [LLM 답변 생성]
              ↓
         [응답 반환]
```

---

## 구현 단계

### Phase 1: 기본 구조
1. Next.js 프로젝트 생성 (`ilsan-max-ai`)
2. 채팅 UI 구현
3. n8n 워크플로우 기본 설정
4. P-ACA MySQL 연동

### Phase 2: 권한 시스템
1. JWT 기반 인증 (P-ACA 로그인 연동)
2. 역할별 접근 제어
3. 쿼리 필터링 (본인 데이터만)

### Phase 3: MySQL 쿼리 AI
1. 자연어 → SQL 변환
2. 결과 → 자연어 답변
3. 권한별 쿼리 제한

### Phase 4: 문서 RAG
1. Supabase pgvector 설정
2. 입시 정보 문서 임베딩
3. 벡터 검색 + LLM 답변

### Phase 5: 고도화
1. 대화 컨텍스트 유지
2. 복합 질문 처리
3. 차트/표 시각화

---

## 레포지토리

- **이름**: `ilsan-max-ai`
- **위치**: `/home/sean/ilsan-max-ai`
- **GitHub**: seanyjeong/ilsan-max-ai (예정)

---

## 연동 정보

### P-ACA MySQL
- Host: 211.37.174.218
- Database: paca
- 테이블: students, student_payments, attendance, instructors, salaries, schedules, seasons 등

### Supabase
- 프로젝트 생성 필요
- pgvector extension 활성화

### n8n
- URL: https://n8n.sean8320.dedyn.io/
- 워크플로우: "일산맥스AI" 생성 예정

---

## 메모

- P-ACA와 별도 프로젝트로 관리
- 다른 학원에도 적용 가능하도록 설계
- 입시 정보는 매년 업데이트 필요
