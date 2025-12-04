# CLAUDE.md

## 프로젝트 개요
일산맥스AI - P-ACA 학원관리시스템 연동 AI 어시스턴트

## 기술 스택
- **프론트엔드**: Next.js + TypeScript + TailwindCSS
- **백엔드/워크플로우**: n8n (https://n8n.sean8320.dedyn.io/)
- **벡터 DB**: Supabase pgvector
- **LLM**: Claude API 또는 OpenAI
- **기존 DB**: MySQL (P-ACA)

## 연동 정보

### P-ACA MySQL
- Host: 211.37.174.218
- Database: paca
- 주요 테이블: students, student_payments, attendance, instructors, salaries, schedules, seasons

### P-ACA 프로젝트 위치
- 프론트엔드: `/home/sean/pacapro`
- 백엔드: `/home/sean/supermax/paca/backend`

## 핵심 기능
1. **시스템 데이터 질의** (MySQL 쿼리)
   - 매출, 미납자, 스케줄, 출석률 등

2. **입시 정보 RAG** (벡터 검색)
   - 대학별 실기 비율, 커트라인, 점수 환산표

## 권한 체계
- owner: 전체 데이터
- admin: 학생, 출석, 스케줄
- teacher: 본인 스케줄/급여, 담당 학생
- student/parent: 본인 데이터만
- guest: 입시 정보만

## 참고 문서
- 기획서: `README.md`
