# 뉴스 큐레이션 웹서비스

> **Note**: 전체 프로젝트 문서는 루트 디렉토리의 [`README.md`](../README.md)와 [`docs/`](../docs) 폴더를 참고하세요.

AI가 요약한 최신 과학/기술 뉴스를 빠르게 확인할 수 있는 웹 서비스입니다.

![News Curation](https://via.placeholder.com/800x400?text=News+Curation+Preview)

## ✨ 주요 기능

- 📰 **뉴스 수집**: NewsAPI에서 과학/기술 뉴스 자동 수집
- 🤖 **AI 요약**: OpenAI GPT를 활용한 뉴스 요약 생성
- 🎨 **모던 UI**: Genspark 스타일의 피드형 인터페이스
- 📱 **반응형 디자인**: 데스크톱/모바일 모두 지원
- 🌙 **다크 모드**: 시스템 설정에 따른 자동 테마 전환
- ♾️ **무한 스크롤**: 끊김 없는 뉴스 탐색 경험

## 🛠️ 기술 스택

| 영역 | 기술 |
|------|------|
| **Frontend** | Next.js 16, React 19, TypeScript |
| **Backend** | Next.js API Routes |
| **Database** | SQLite (Better-SQLite3) |
| **AI** | OpenAI GPT-4o-mini |
| **News Source** | NewsAPI.org |
| **Testing** | Vitest, Testing Library |
| **Styling** | CSS Modules, CSS Variables |

## 📦 설치 방법

### 1. 의존성 설치

```bash
cd app
npm install
```

### 2. 환경 변수 설정

`env.example` 파일을 참고하여 `.env.local` 파일을 생성합니다:

```bash
# .env.local
NEWSAPI_KEY=your_newsapi_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

### API 키 발급 방법

1. **NewsAPI 키**
   - [https://newsapi.org](https://newsapi.org) 에서 무료 계정 생성
   - Dashboard에서 API Key 복사

2. **OpenAI 키**
   - [https://platform.openai.com](https://platform.openai.com) 에서 계정 생성
   - API Keys 메뉴에서 새 키 생성

## 🚀 실행 방법

### 개발 모드

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

### 프로덕션 빌드

```bash
npm run build
npm run start
```

## 📡 API 사용법

### 뉴스 목록 조회

```bash
GET /api/news?page=1&limit=10
```

**응답 예시:**
```json
{
  "success": true,
  "data": [
    {
      "id": "abc123",
      "title": "새로운 AI 기술 발표",
      "url": "https://example.com/news",
      "source": "TechNews",
      "publishedAt": "2026-01-06T10:00:00Z",
      "summary": "AI 기술이 크게 발전했습니다...",
      "imageUrl": "https://example.com/image.jpg"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "hasMore": true,
    "totalPages": 5
  }
}
```

### 뉴스 수집 트리거

```bash
POST /api/news/fetch
```

**응답 예시:**
```json
{
  "success": true,
  "technology": {
    "fetched": 20,
    "saved": 15,
    "duplicates": 5,
    "errors": []
  },
  "science": {
    "fetched": 18,
    "saved": 12,
    "duplicates": 6,
    "errors": []
  },
  "total": {
    "fetched": 38,
    "saved": 27,
    "duplicates": 11
  }
}
```

## 🧪 테스트

```bash
# 전체 테스트 실행
npm test

# 테스트 (watch 모드)
npm run test:watch

# 테스트 커버리지
npm run test:coverage

# 타입 체크
npm run type-check
```

## 📁 프로젝트 구조

```
app/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API Routes
│   │   │   └── news/
│   │   │       ├── route.ts   # GET /api/news
│   │   │       └── fetch/
│   │   │           └── route.ts  # POST /api/news/fetch
│   │   ├── layout.tsx         # Root Layout
│   │   ├── page.tsx           # Home Page
│   │   └── globals.css        # Global Styles
│   │
│   ├── components/            # React Components
│   │   ├── Header.tsx
│   │   ├── NewsFeed.tsx
│   │   └── NewsCard.tsx
│   │
│   ├── domain/                # Domain Layer
│   │   └── entities/
│   │       └── News.ts
│   │
│   ├── application/           # Application Layer
│   │   └── services/
│   │       ├── NewsFetchService.ts
│   │       └── AISummaryService.ts
│   │
│   └── infrastructure/        # Infrastructure Layer
│       ├── api/
│       │   └── NewsApiClient.ts
│       ├── database/
│       │   └── sqlite.ts
│       └── repositories/
│           └── NewsRepository.ts
│
├── test/                      # Tests
│   ├── unit/
│   └── integration/
│
├── data/                      # SQLite Database
│   └── news.db
│
└── env.example               # Environment Variables Example
```

## 🔧 주요 명령어

| 명령어 | 설명 |
|-------|------|
| `npm run dev` | 개발 서버 실행 |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 프로덕션 서버 실행 |
| `npm test` | 테스트 실행 |
| `npm run type-check` | TypeScript 타입 검사 |
| `npm run lint` | ESLint 검사 |

## 🤝 기여 방법

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 라이선스

MIT License

## 🙏 참고

- [Genspark News](https://www.genspark.ai/news) - UI/UX 디자인 참고
- [NewsAPI](https://newsapi.org) - 뉴스 데이터 제공
- [OpenAI](https://openai.com) - AI 요약 기능
