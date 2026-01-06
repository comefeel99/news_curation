# Implementation Plan: 한글 AI 요약 통합

**Status**: ⏳ Pending
**Started**: 2026-01-06
**Last Updated**: 2026-01-06
**Estimated Completion**: 2026-01-06

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
뉴스 수집 시 OpenAI GPT를 활용하여 영어 뉴스를 **한국어로 요약**하고, 
사용자에게 한글 요약이 UI에 표시되도록 합니다.

### 현재 상태
- ✅ AISummaryService 구현됨 (한글 요약 프롬프트 포함)
- ❌ 뉴스 수집 시 AI 요약이 자동 생성되지 않음
- ❌ 요약 없이 뉴스 카드가 표시됨

### 목표
- 뉴스 수집(fetch) 시 자동으로 한글 AI 요약 생성
- 모든 뉴스 카드에 한글 요약 표시

### Success Criteria
- [ ] 뉴스 수집 시 AI 요약 자동 생성
- [ ] UI에 한글 요약 표시
- [ ] 요약 생성 실패해도 뉴스 저장은 정상 진행
- [ ] GPT API 호출 이력 로그 저장

---

## 🏗️ Architecture Decisions

| Decision | Rationale | Trade-offs |
|----------|-----------|------------|
| **수집 시 요약 생성** | 사용자 대기 시간 없음 | 수집 속도 느려짐 |
| **제목 기반 요약** | 본문 없어도 요약 가능 | 정확도 낮을 수 있음 |
| **비동기 처리** | 일부 실패해도 전체 진행 | 일부 뉴스 요약 없을 수 있음 |
| **한글 프롬프트** | 자연스러운 한글 출력 | N/A |
| **SQLite 로그 저장** | 간단, 파일 기반, 조회 용이 | 대용량 시 성능 저하 |

---

## 🚀 Implementation Phases

---

### Phase 1: NewsFetchService에 AI 요약 통합
**Goal**: 뉴스 수집 시 자동으로 한글 AI 요약 생성
**Estimated Time**: 30분
**Status**: ⏳ Pending

#### Tasks

**🔴 RED: Write Failing Tests First**
- [ ] **Test 1.1**: 뉴스 수집 + 요약 통합 테스트 작성
  - File: `test/integration/services/newsPipeline.test.ts`
  - Expected: 수집된 뉴스에 한글 요약이 포함되어야 함

**🟢 GREEN: Implement to Make Tests Pass**
- [ ] **Task 1.2**: NewsFetchService 수정
  - File: `src/application/services/NewsFetchService.ts`
  - Changes:
    - AISummaryService 의존성 주입
    - 뉴스 저장 후 요약 생성
    - 요약을 DB에 업데이트

- [ ] **Task 1.3**: fetch API route 수정
  - File: `src/app/api/news/fetch/route.ts`
  - Changes:
    - AISummaryService 인스턴스 생성
    - NewsFetchService에 전달

**🔵 REFACTOR: Clean Up Code**
- [ ] **Task 1.4**: 에러 핸들링 개선
  - 요약 생성 실패 시 로깅
  - 뉴스 저장은 계속 진행

#### 코드 변경 상세

**NewsFetchService.ts 수정:**
```typescript
// 생성자에 AISummaryService 추가
constructor(
  repository: NewsRepository, 
  apiClient: NewsApiClient,
  aiSummaryService?: AISummaryService  // 선택적
) {
  // ...
}

// 저장 후 요약 생성
const saved = this.repository.save(news)
if (saved && this.aiSummaryService) {
  try {
    const summary = await this.aiSummaryService.generateSummaryFromUrl(
      news.title,
      news.url,
      news.source
    )
    if (summary) {
      this.repository.updateSummary(news.id, summary)
    }
  } catch (error) {
    console.error('AI 요약 생성 실패:', error)
  }
}
```

**fetch/route.ts 수정:**
```typescript
// AISummaryService 인스턴스 생성
const openaiKey = process.env.OPENAI_API_KEY
let aiSummaryService: AISummaryService | undefined

if (openaiKey) {
  aiSummaryService = new AISummaryService(openaiKey)
}

const fetchService = new NewsFetchService(
  repository, 
  apiClient, 
  aiSummaryService
)
```

#### Quality Gate ✋

**Validation Commands:**
```bash
npm test
npm run type-check
curl -X POST http://localhost:3000/api/news/fetch
# 응답에서 saved 수 확인
# UI에서 한글 요약 표시 확인
```

**Manual Test Checklist:**
- [ ] 뉴스 수집 API 정상 동작
- [ ] 뉴스 카드에 한글 요약 표시
- [ ] OpenAI 키 없어도 뉴스 수집 정상 동작

---

### Phase 2: 기존 뉴스 요약 생성 API
**Goal**: 이미 저장된 뉴스 중 요약 없는 항목에 요약 생성
**Estimated Time**: 20분
**Status**: ⏳ Pending

#### Tasks

- [ ] **Task 2.1**: 요약 생성 전용 API 추가
  - File: `src/app/api/news/summarize/route.ts`
  - Endpoint: `POST /api/news/summarize`
  - 기능: 요약 없는 뉴스에 AI 요약 생성

#### Quality Gate ✋

**Validation Commands:**
```bash
curl -X POST http://localhost:3000/api/news/summarize
# 기존 뉴스에 요약 추가 확인
```

---

### Phase 3: GPT API 호출 이력 로그 저장
**Goal**: 모든 GPT API 호출을 로그로 저장하여 비용 추적 및 디버깅 지원
**Estimated Time**: 30분
**Status**: ⏳ Pending

#### Tasks

**🔴 RED: Write Failing Tests First**
- [ ] **Test 3.1**: GPT 로그 저장 테스트 작성
  - File: `test/unit/services/gptLogger.test.ts`
  - Expected: GPT 호출 시 로그 저장

**🟢 GREEN: Implement to Make Tests Pass**
- [ ] **Task 3.2**: GPT 로그 테이블 생성
  - File: `src/infrastructure/database/sqlite.ts`
  - SQL:
    ```sql
    CREATE TABLE IF NOT EXISTS gpt_logs (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      model TEXT NOT NULL,
      prompt TEXT NOT NULL,
      response TEXT,
      tokens_input INTEGER,
      tokens_output INTEGER,
      duration_ms INTEGER,
      news_id TEXT,
      status TEXT NOT NULL,  -- 'success' | 'error'
      error_message TEXT
    )
    ```

- [ ] **Task 3.3**: GPTLogger 서비스 구현
  - File: `src/infrastructure/logging/GPTLogger.ts`
  - 기능:
    - 호출 시작/종료 시간 기록
    - 프롬프트 및 응답 저장
    - 토큰 사용량 기록
    - 에러 로깅

- [ ] **Task 3.4**: AISummaryService에 로거 통합
  - File: `src/application/services/AISummaryService.ts`
  - Changes:
    - GPTLogger 의존성 주입
    - 모든 GPT 호출 전후 로깅

- [ ] **Task 3.5**: 로그 조회 API 추가 (선택)
  - File: `src/app/api/logs/gpt/route.ts`
  - Endpoint: `GET /api/logs/gpt`
  - 기능: GPT 호출 이력 조회

#### 코드 변경 상세

**GPTLogger.ts:**
```typescript
interface GPTLogEntry {
  id: string
  createdAt: Date
  model: string
  prompt: string
  response: string | null
  tokensInput: number | null
  tokensOutput: number | null
  durationMs: number
  newsId: string | null
  status: 'success' | 'error'
  errorMessage: string | null
}

export class GPTLogger {
  constructor(private db: Database.Database) {}

  log(entry: Omit<GPTLogEntry, 'id' | 'createdAt'>): void {
    const stmt = this.db.prepare(`
      INSERT INTO gpt_logs 
      (id, created_at, model, prompt, response, tokens_input, tokens_output, 
       duration_ms, news_id, status, error_message)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    // ...
  }

  getRecentLogs(limit: number = 100): GPTLogEntry[] {
    // ...
  }

  getStats(): { totalCalls: number, totalTokens: number, ... } {
    // ...
  }
}
```

**AISummaryService.ts 수정:**
```typescript
constructor(
  apiKeyOrClient: string | OpenAIClient, 
  model: string = 'gpt-4o-mini',
  logger?: GPTLogger  // 선택적
) {
  // ...
}

async generateSummary(title: string, content: string): Promise<string | null> {
  const startTime = Date.now()
  
  try {
    const response = await this.client.chat.completions.create(...)
    
    // 로깅
    if (this.logger) {
      this.logger.log({
        model: this.model,
        prompt: prompt,
        response: response.choices[0]?.message?.content,
        tokensInput: response.usage?.prompt_tokens,
        tokensOutput: response.usage?.completion_tokens,
        durationMs: Date.now() - startTime,
        newsId: null,
        status: 'success',
        errorMessage: null,
      })
    }
    
    return response.choices[0]?.message?.content || null
  } catch (error) {
    if (this.logger) {
      this.logger.log({
        model: this.model,
        prompt: prompt,
        response: null,
        tokensInput: null,
        tokensOutput: null,
        durationMs: Date.now() - startTime,
        newsId: null,
        status: 'error',
        errorMessage: error.message,
      })
    }
    throw error
  }
}
```

#### Quality Gate ✋

**Validation Commands:**
```bash
npm test
npm run type-check
# 뉴스 수집 후 로그 확인
curl http://localhost:3000/api/logs/gpt
```

**Manual Test Checklist:**
- [ ] GPT 호출 시 로그 저장 확인
- [ ] 성공/실패 모두 로깅
- [ ] 로그 조회 API 동작 확인

---

## ⚠️ Risk Assessment

| Risk | Probability | Impact | Mitigation Strategy |
|------|-------------|--------|---------------------|
| OpenAI API 비용 증가 | Medium | Medium | 뉴스당 1회만 요약, 캐싱 |
| 요약 생성 시간 증가 | High | Low | 비동기 처리, 타임아웃 설정 |
| API 키 미설정 | Medium | Low | 키 없어도 수집은 정상 진행 |
| 로그 데이터 증가 | Low | Low | 주기적 정리, 보관 기간 설정 |

---

## 📊 Progress Tracking

### Completion Status
- **Phase 1**: ⏳ 0%
- **Phase 2**: ⏳ 0%
- **Phase 3**: ⏳ 0%

**Overall Progress**: 0% complete

### Time Tracking
| Phase | Estimated | Actual | Variance |
|-------|-----------|--------|----------|
| Phase 1 | 30분 | - | - |
| Phase 2 | 20분 | - | - |
| Phase 3 | 30분 | - | - |
| **Total** | 80분 | - | - |

---

## 📝 Notes & Learnings

### 한글 요약 프롬프트 (이미 구현됨)
```
당신은 뉴스 기사를 간결하고 명확하게 요약하는 전문가입니다. 
항상 한국어로 응답합니다.

다음 뉴스 기사를 한국어로 3-4줄로 요약해주세요.
```

### GPT 로그 테이블 스키마
```sql
gpt_logs (
  id, created_at, model, prompt, response, 
  tokens_input, tokens_output, duration_ms, 
  news_id, status, error_message
)
```

---

**Plan Status**: ⏳ Pending Approval
**Next Action**: 사용자 승인 후 Phase 1 시작
**Blocked By**: None
