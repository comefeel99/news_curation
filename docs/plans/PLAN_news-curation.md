# Implementation Plan: 뉴스 큐레이션 웹서비스 (Genspark-style)

**Status**: ⏳ Pending
**Started**: 2026-01-06
**Last Updated**: 2026-01-06
**Estimated Completion**: 2026-01-08

---

**⚠️ CRITICAL INSTRUCTIONS**: After completing each phase:
1. ✅ Check off completed task checkboxes
2. 🧪 Run all quality gate validation commands
3. ⚠️ Verify ALL quality gate items pass
4. 📅 Update "Last Updated" date above
5. 📝 Document learnings in Notes section
6. ➡️ Only then proceed to next phase

⛔ **DO NOT skip quality gates or proceed with failing checks**

---

## 📋 Overview

### Feature Description
Genspark News(https://www.genspark.ai/news)와 유사한 형태의 뉴스 큐레이션 웹서비스를 개발합니다.
- 과학/기술 분야의 뉴스를 수집하여 피드 형태로 노출
- OpenAI를 활용한 AI 요약 기능 제공
- 단일 컬럼 카드 리스트 UI (모던하고 미니멀한 디자인)
- 한국어 전용 서비스

### Success Criteria
- [ ] NewsAPI에서 과학/기술 뉴스 수집 및 저장
- [ ] OpenAI GPT를 활용한 뉴스 요약 생성
- [ ] Genspark 스타일의 피드형 UI 구현
- [ ] 무한 스크롤로 뉴스 목록 표시
- [ ] 반응형 디자인 지원 (모바일/데스크톱)

### User Impact
사용자가 과학/기술 분야의 최신 뉴스를 AI 요약과 함께 빠르게 훑어볼 수 있어, 정보 습득 시간을 단축하고 핵심 내용을 쉽게 파악할 수 있습니다.

---

## 🏗️ Architecture Decisions

| Decision | Rationale | Trade-offs |
|----------|-----------|------------|
| **Frontend: Next.js (App Router)** | React 기반, SSR 지원, API Routes 내장 | 러닝커브 있음 |
| **Backend: Next.js API Routes** | 별도 백엔드 서버 불필요, 빠른 MVP 개발 | 복잡한 로직에는 한계 |
| **Database: SQLite (Better-SQLite3)** | 설정 간단, 파일 기반, MVP에 적합 | 동시성 제한, 스케일링 한계 |
| **News Source: NewsAPI.org** | 간단한 API, 무료 티어, 빠른 테스트 | 일일 100회 제한 (무료) |
| **AI: OpenAI GPT-4o-mini** | 비용 효율적, 빠른 응답, 한국어 지원 | API 비용 발생 |
| **Styling: Vanilla CSS + CSS Variables** | 유연성, 성능, 종속성 없음 | TailwindCSS 대비 작성량 증가 |

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│                   (Next.js App Router)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  NewsFeed   │  │  NewsCard   │  │  InfiniteScroll     │  │
│  │  Component  │  │  Component  │  │  Component          │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     API Routes                               │
│  ┌─────────────────┐  ┌─────────────────────────────────┐   │
│  │ GET /api/news   │  │ POST /api/news/fetch            │   │
│  │ (목록 조회)      │  │ (뉴스 수집 + AI 요약)            │   │
│  └─────────────────┘  └─────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│    SQLite DB    │  │   NewsAPI.org   │  │   OpenAI API    │
│  (뉴스 저장)     │  │  (뉴스 수집)     │  │  (AI 요약)      │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

---

## 📦 Dependencies

### Required Before Starting
- [ ] Node.js 18+ 설치
- [ ] NewsAPI.org 계정 생성 및 API 키 발급
- [ ] OpenAI API 키 발급

### External Dependencies
```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "better-sqlite3": "^9.0.0",
    "openai": "^4.0.0"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.0.0",
    "@types/node": "^20.0.0",
    "@types/react": "^18.0.0",
    "typescript": "^5.0.0",
    "vitest": "^1.0.0",
    "@testing-library/react": "^14.0.0"
  }
}
```

---

## 🧪 Test Strategy

### Testing Approach
**TDD Principle**: Write tests FIRST, then implement to make them pass

### Test Pyramid for This Feature
| Test Type | Coverage Target | Purpose |
|-----------|-----------------|---------|
| **Unit Tests** | ≥80% | 뉴스 서비스 로직, 데이터 모델, 유틸리티 |
| **Integration Tests** | Critical paths | API Routes, DB 연동, 외부 API 연동 |
| **E2E Tests** | Key user flows | 뉴스 목록 조회, 무한 스크롤 |

### Test File Organization
```
test/
├── unit/
│   ├── services/
│   │   ├── newsService.test.ts
│   │   └── aiService.test.ts
│   └── utils/
│       └── formatters.test.ts
├── integration/
│   ├── api/
│   │   ├── news.test.ts
│   │   └── fetch.test.ts
│   └── database/
│       └── newsRepository.test.ts
└── e2e/
    └── newsFeed.test.ts
```

---

## 🚀 Implementation Phases

---

### Phase 1: 프로젝트 초기화 및 데이터 모델
**Goal**: Next.js 프로젝트 설정, SQLite 데이터베이스 및 뉴스 모델 구현
**Estimated Time**: 2시간
**Status**: ⏳ Pending

#### Tasks

**🔴 RED: Write Failing Tests First**
- [ ] **Test 1.1**: 뉴스 엔티티 및 데이터베이스 테스트 작성
  - File(s): `test/unit/models/news.test.ts`
  - Expected: Tests FAIL - 모델이 아직 없음
  - Details:
    - 뉴스 엔티티 생성 테스트
    - 필수 필드 검증 (title, url, source, publishedAt)
    - 옵션 필드 검증 (summary, imageUrl)

- [ ] **Test 1.2**: 뉴스 저장소 테스트 작성
  - File(s): `test/integration/database/newsRepository.test.ts`
  - Expected: Tests FAIL - 저장소가 아직 없음
  - Details:
    - 뉴스 저장 테스트
    - 뉴스 목록 조회 테스트 (페이지네이션)
    - 중복 URL 처리 테스트

**🟢 GREEN: Implement to Make Tests Pass**
- [ ] **Task 1.3**: Next.js 프로젝트 생성 및 설정
  - Command: `npx create-next-app@latest ./ --typescript --app --src-dir --no-tailwind --no-eslint`
  - Details: TypeScript, App Router 사용, src 디렉토리 구조

- [ ] **Task 1.4**: 뉴스 엔티티 구현
  - File(s): `src/domain/entities/News.ts`
  - Goal: Test 1.1 통과
  - Details:
    ```typescript
    interface News {
      id: string;
      title: string;
      url: string;
      source: string;
      publishedAt: Date;
      summary?: string;
      imageUrl?: string;
      createdAt: Date;
    }
    ```

- [ ] **Task 1.5**: SQLite 데이터베이스 및 저장소 구현
  - File(s): 
    - `src/infrastructure/database/sqlite.ts`
    - `src/infrastructure/repositories/NewsRepository.ts`
  - Goal: Test 1.2 통과
  - Details: Better-SQLite3 사용, 동기 API

**🔵 REFACTOR: Clean Up Code**
- [ ] **Task 1.6**: 코드 품질 개선
  - Checklist:
    - [ ] 타입 정의 분리 (`src/types/`)
    - [ ] 에러 핸들링 추가
    - [ ] 인라인 문서화

#### Quality Gate ✋

**⚠️ STOP: Do NOT proceed to Phase 2 until ALL checks pass**

**TDD Compliance**:
- [ ] Tests written FIRST and initially failed
- [ ] Production code written to make tests pass
- [ ] Code improved while tests still pass

**Validation Commands**:
```bash
# 테스트 실행
npm test

# 타입 체크
npm run type-check

# 빌드 확인
npm run build
```

**Manual Test Checklist**:
- [ ] SQLite 데이터베이스 파일 생성 확인
- [ ] 뉴스 CRUD 동작 확인

---

### Phase 2: 뉴스 수집 서비스 (NewsAPI 연동)
**Goal**: NewsAPI에서 과학/기술 뉴스를 수집하여 데이터베이스에 저장
**Estimated Time**: 2시간
**Status**: ⏳ Pending

#### Tasks

**🔴 RED: Write Failing Tests First**
- [ ] **Test 2.1**: NewsAPI 클라이언트 테스트 작성
  - File(s): `test/unit/services/newsApiClient.test.ts`
  - Expected: Tests FAIL
  - Details:
    - API 응답 파싱 테스트
    - 에러 핸들링 테스트
    - Rate limit 처리 테스트

- [ ] **Test 2.2**: 뉴스 수집 서비스 테스트 작성
  - File(s): `test/unit/services/newsFetchService.test.ts`
  - Expected: Tests FAIL
  - Details:
    - 뉴스 수집 및 저장 플로우
    - 중복 뉴스 필터링
    - 에러 시 롤백 처리

**🟢 GREEN: Implement to Make Tests Pass**
- [ ] **Task 2.3**: NewsAPI 클라이언트 구현
  - File(s): `src/infrastructure/api/NewsApiClient.ts`
  - Goal: Test 2.1 통과
  - Details:
    - 과학/기술 카테고리 뉴스 조회
    - 한국어 뉴스 필터링 (language=ko)

- [ ] **Task 2.4**: 뉴스 수집 서비스 구현
  - File(s): `src/application/services/NewsFetchService.ts`
  - Goal: Test 2.2 통과
  - Details:
    - NewsAPI → DB 저장 파이프라인
    - 중복 체크 로직

- [ ] **Task 2.5**: API Route 구현 (수동 트리거)
  - File(s): `src/app/api/news/fetch/route.ts`
  - Details: POST 요청으로 뉴스 수집 트리거

**🔵 REFACTOR: Clean Up Code**
- [ ] **Task 2.6**: 코드 품질 개선
  - Checklist:
    - [ ] 환경 변수 설정 (.env.local)
    - [ ] 에러 타입 정의
    - [ ] 로깅 추가

#### Quality Gate ✋

**Validation Commands**:
```bash
npm test
npm run type-check
npm run build

# 수동 테스트: 뉴스 수집 API 호출
curl -X POST http://localhost:3000/api/news/fetch
```

**Manual Test Checklist**:
- [ ] NewsAPI에서 뉴스 수집 확인
- [ ] 데이터베이스에 뉴스 저장 확인
- [ ] 중복 수집 방지 확인

---

### Phase 3: AI 요약 서비스 (OpenAI 연동)
**Goal**: OpenAI GPT를 활용하여 수집된 뉴스에 대한 AI 요약 생성
**Estimated Time**: 2시간
**Status**: ⏳ Pending

#### Tasks

**🔴 RED: Write Failing Tests First**
- [ ] **Test 3.1**: AI 요약 서비스 테스트 작성
  - File(s): `test/unit/services/aiSummaryService.test.ts`
  - Expected: Tests FAIL
  - Details:
    - 요약 생성 테스트 (모킹)
    - 프롬프트 구성 테스트
    - 에러 핸들링 테스트
    - 토큰 제한 처리 테스트

- [ ] **Test 3.2**: 뉴스 수집 + 요약 통합 테스트 작성
  - File(s): `test/integration/services/newsPipeline.test.ts`
  - Expected: Tests FAIL
  - Details:
    - 수집 → 요약 → 저장 전체 플로우

**🟢 GREEN: Implement to Make Tests Pass**
- [ ] **Task 3.3**: OpenAI 클라이언트 구현
  - File(s): `src/infrastructure/api/OpenAIClient.ts`
  - Goal: OpenAI API 연동
  - Details:
    - GPT-4o-mini 사용 (비용 효율)
    - 스트리밍 비활성화 (간단한 응답)

- [ ] **Task 3.4**: AI 요약 서비스 구현
  - File(s): `src/application/services/AISummaryService.ts`
  - Goal: Test 3.1 통과
  - Details:
    - 프롬프트 엔지니어링 (한국어 3-4줄 요약)
    - 배치 처리 (다수 뉴스 요약)

- [ ] **Task 3.5**: 뉴스 수집 서비스에 AI 요약 통합
  - File(s): `src/application/services/NewsFetchService.ts` (수정)
  - Goal: Test 3.2 통과
  - Details: 수집 후 자동 요약 생성

**🔵 REFACTOR: Clean Up Code**
- [ ] **Task 3.6**: 코드 품질 개선
  - Checklist:
    - [ ] 프롬프트 템플릿 분리
    - [ ] 재시도 로직 추가
    - [ ] 비용 모니터링 로깅

#### Quality Gate ✋

**Validation Commands**:
```bash
npm test
npm run type-check
npm run build

# AI 요약 테스트
curl -X POST http://localhost:3000/api/news/fetch
```

**Manual Test Checklist**:
- [ ] AI 요약이 자연스러운 한국어인지 확인
- [ ] 요약 길이가 적절한지 확인 (3-4줄)
- [ ] API 비용 확인

---

### Phase 4: 프론트엔드 UI 구현 (Genspark 스타일)
**Goal**: Genspark News와 유사한 피드형 UI 구현 (무한 스크롤, 카드 레이아웃)
**Estimated Time**: 3시간
**Status**: ⏳ Pending

#### Tasks

**🔴 RED: Write Failing Tests First**
- [ ] **Test 4.1**: 뉴스 목록 API 테스트 작성
  - File(s): `test/integration/api/news.test.ts`
  - Expected: Tests FAIL
  - Details:
    - 페이지네이션 응답 테스트
    - 빈 목록 처리 테스트
    - 에러 응답 테스트

- [ ] **Test 4.2**: 뉴스 컴포넌트 테스트 작성
  - File(s): `test/unit/components/NewsCard.test.tsx`
  - Expected: Tests FAIL
  - Details:
    - 렌더링 테스트
    - 필수 정보 표시 확인
    - 이미지 없을 때 폴백 처리

**🟢 GREEN: Implement to Make Tests Pass**
- [ ] **Task 4.3**: 뉴스 목록 API 구현
  - File(s): `src/app/api/news/route.ts`
  - Goal: Test 4.1 통과
  - Details:
    - GET /api/news?page=1&limit=10
    - 최신순 정렬
    - 페이지네이션 메타데이터

- [ ] **Task 4.4**: 글로벌 스타일 및 디자인 시스템 구현
  - File(s): `src/app/globals.css`
  - Details:
    - CSS Variables (색상, 간격, 폰트)
    - 다크모드 스타일
    - 반응형 브레이크포인트

- [ ] **Task 4.5**: NewsCard 컴포넌트 구현
  - File(s): `src/components/NewsCard.tsx`, `src/components/NewsCard.module.css`
  - Goal: Test 4.2 통과
  - Details:
    - 제목, 이미지, 요약, 출처, 시간 표시
    - 호버 효과
    - 외부 링크 연결

- [ ] **Task 4.6**: NewsFeed 컴포넌트 구현 (무한 스크롤)
  - File(s): `src/components/NewsFeed.tsx`, `src/components/NewsFeed.module.css`
  - Details:
    - Intersection Observer 활용
    - 로딩 상태 표시
    - 에러 상태 처리

- [ ] **Task 4.7**: 메인 페이지 구현
  - File(s): `src/app/page.tsx`, `src/app/layout.tsx`
  - Details:
    - 헤더 (서비스 타이틀)
    - NewsFeed 컴포넌트 연동
    - 그라데이션 배경 효과

**🔵 REFACTOR: Clean Up Code**
- [ ] **Task 4.8**: 코드 품질 개선
  - Checklist:
    - [ ] 컴포넌트 분리 및 정리
    - [ ] 접근성 개선 (ARIA 속성)
    - [ ] 성능 최적화 (이미지 lazy loading)

#### Quality Gate ✋

**Validation Commands**:
```bash
npm test
npm run type-check
npm run build
npm run dev  # UI 확인
```

**Manual Test Checklist**:
- [ ] Genspark과 유사한 디자인 확인
- [ ] 무한 스크롤 동작 확인
- [ ] 모바일 반응형 확인
- [ ] 뉴스 카드 클릭 시 원문 이동 확인

---

### Phase 5: 통합 테스트 및 완성
**Goal**: 전체 시스템 통합 테스트, 에러 처리 보완, 문서화
**Estimated Time**: 2시간
**Status**: ⏳ Pending

#### Tasks

**🔴 RED: Write Failing Tests First**
- [ ] **Test 5.1**: E2E 테스트 작성
  - File(s): `test/e2e/newsFeed.test.ts`
  - Expected: Tests FAIL
  - Details:
    - 페이지 로드 → 뉴스 표시 플로우
    - 스크롤 → 추가 로딩 플로우
    - 에러 상태 표시

**🟢 GREEN: Implement to Make Tests Pass**
- [ ] **Task 5.2**: 에러 바운더리 및 로딩 상태 개선
  - File(s): 
    - `src/components/ErrorBoundary.tsx`
    - `src/components/LoadingSpinner.tsx`
  - Goal: Test 5.1 통과

- [ ] **Task 5.3**: 환경 설정 문서화
  - File(s): `README.md`
  - Details:
    - 설치 방법
    - 환경 변수 설정
    - 실행 방법
    - API 키 발급 가이드

- [ ] **Task 5.4**: 뉴스 자동 수집 설정 (선택)
  - File(s): `src/app/api/cron/route.ts`
  - Details: Vercel Cron 또는 수동 트리거

**🔵 REFACTOR: Clean Up Code**
- [ ] **Task 5.5**: 최종 코드 정리
  - Checklist:
    - [ ] 불필요한 코드 제거
    - [ ] console.log 정리
    - [ ] 타입 정의 검토

#### Quality Gate ✋

**Validation Commands**:
```bash
npm test
npm run type-check
npm run build
npm run start  # 프로덕션 모드 확인
```

**Manual Test Checklist**:
- [ ] 전체 플로우 동작 확인
- [ ] 에러 상황 처리 확인
- [ ] README 따라 설치 가능한지 확인

---

## ⚠️ Risk Assessment

| Risk | Probability | Impact | Mitigation Strategy |
|------|-------------|--------|---------------------|
| NewsAPI 무료 한도 초과 | Medium | Medium | RSS 피드 대안 준비, 캐싱 적극 활용 |
| OpenAI API 비용 증가 | Low | Medium | GPT-4o-mini 사용, 요약 길이 제한 |
| 한국어 뉴스 수집 부족 | Medium | High | 네이버 뉴스 API 대안 준비 |
| SQLite 동시성 문제 | Low | Low | MVP 단계에서는 문제없음, 추후 PostgreSQL 전환 |

---

## 🔄 Rollback Strategy

### If Phase 1 Fails
- `rm -rf node_modules package-lock.json`
- 프로젝트 디렉토리 초기화

### If Phase 2 Fails
- NewsAPI 연동 코드 제거
- 목 데이터로 대체

### If Phase 3 Fails
- AI 요약 기능 비활성화
- 원문 일부 발췌로 대체

### If Phase 4 Fails
- 기본 HTML 목록으로 대체
- 스타일링 단순화

### If Phase 5 Fails
- E2E 테스트 스킵
- 수동 테스트로 대체

---

## 📊 Progress Tracking

### Completion Status
- **Phase 1**: ⏳ 0%
- **Phase 2**: ⏳ 0%
- **Phase 3**: ⏳ 0%
- **Phase 4**: ⏳ 0%
- **Phase 5**: ⏳ 0%

**Overall Progress**: 0% complete

### Time Tracking
| Phase | Estimated | Actual | Variance |
|-------|-----------|--------|----------|
| Phase 1 | 2 hours | - | - |
| Phase 2 | 2 hours | - | - |
| Phase 3 | 2 hours | - | - |
| Phase 4 | 3 hours | - | - |
| Phase 5 | 2 hours | - | - |
| **Total** | 11 hours | - | - |

---

## 📝 Notes & Learnings

### Implementation Notes
- (개발 중 추가)

### Blockers Encountered
- (발생 시 추가)

### Improvements for Future Plans
- (완료 후 추가)

---

## 📚 References

### Documentation
- [NewsAPI Documentation](https://newsapi.org/docs)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Better-SQLite3 Documentation](https://github.com/WiseLibs/better-sqlite3)

### Design Reference
- [Genspark News](https://www.genspark.ai/news) - UI/UX 참고

---

## ✅ Final Checklist

**Before marking plan as COMPLETE**:
- [ ] All phases completed with quality gates passed
- [ ] Full integration testing performed
- [ ] Documentation updated (README.md)
- [ ] All tests passing
- [ ] Manual testing completed
- [ ] Plan document archived for future reference

---

**Plan Status**: ⏳ Pending Approval
**Next Action**: 사용자 승인 후 Phase 1 시작
**Blocked By**: None
