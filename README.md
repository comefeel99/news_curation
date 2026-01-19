# 📰 News Curation

AI 기반 뉴스 큐레이션 서비스 - 최신 과학/기술 뉴스를 AI가 자동으로 수집하고 요약합니다.

## 🌟 프로젝트 개요

이 프로젝트는 NewsAPI에서 최신 과학/기술 뉴스를 자동으로 수집하고, OpenAI GPT를 활용하여 뉴스 요약을 생성하는 웹 서비스입니다. 사용자는 Genspark 스타일의 모던한 피드형 인터페이스를 통해 빠르게 뉴스를 탐색할 수 있습니다.

## ✨ 주요 기능

| 기능 | 설명 |
|------|------|
| 📰 **자동 뉴스 수집** | NewsAPI를 통한 과학/기술 뉴스 자동 수집 |
| 🤖 **AI 요약** | OpenAI GPT-4o-mini를 활용한 뉴스 요약 생성 |
| 🎨 **모던 UI** | Genspark 스타일의 피드형 인터페이스 |
| 📱 **반응형 디자인** | 데스크톱/모바일 모두 지원 |
| 🌙 **다크 모드** | 시스템 설정에 따른 자동 테마 전환 |
| ♾️ **무한 스크롤** | 끊김 없는 뉴스 탐색 경험 |

## 🛠️ 기술 스택

- **Frontend**: Next.js 16, React 19, TypeScript
- **Backend**: Next.js API Routes
- **Database**: SQLite (Better-SQLite3)
- **AI**: OpenAI GPT-4o-mini
- **News Source**: NewsAPI.org
- **Testing**: Vitest, Testing Library
- **Styling**: CSS Modules, CSS Variables

## 📂 프로젝트 구조

```
news_curation/
├── app/                    # 메인 웹 애플리케이션
│   ├── src/               # 소스 코드
│   │   ├── app/          # Next.js App Router (페이지, API)
│   │   ├── components/   # React 컴포넌트
│   │   ├── domain/       # 도메인 레이어 (엔티티)
│   │   ├── application/  # 애플리케이션 레이어 (서비스)
│   │   └── infrastructure/ # 인프라 레이어 (DB, API 클라이언트)
│   ├── test/             # 테스트 코드
│   └── data/             # SQLite 데이터베이스
├── docs/                   # 문서
│   └── plans/            # 기능 개발 계획서
├── SKILL.md               # AI 기능 개발 가이드라인
└── plan-template.md       # 계획 문서 템플릿
```

## 🚀 시작하기

### 1. 의존성 설치

```bash
cd app
npm install
```

### 2. 환경 변수 설정

`app/env.example`을 참고하여 `app/.env.local` 파일 생성:

```bash
NEWSAPI_KEY=your_newsapi_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

## 📋 주요 명령어

| 명령어 | 설명 |
|-------|------|
| `npm run dev` | 개발 서버 실행 |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 프로덕션 서버 실행 |
| `npm test` | 테스트 실행 |
| `npm run test:coverage` | 테스트 커버리지 확인 |
| `npm run type-check` | TypeScript 타입 검사 |
| `npm run lint` | ESLint 검사 |

## 📡 API 엔드포인트

| 엔드포인트 | 메서드 | 설명 |
|-----------|--------|------|
| `/api/news` | GET | 뉴스 목록 조회 (페이지네이션 지원) |
| `/api/news/fetch` | POST | 새 뉴스 수집 트리거 |

자세한 API 사용법은 [app/README.md](app/README.md)를 참조하세요.

## 🧪 테스트

```bash
cd app

# 전체 테스트 실행
npm test

# Watch 모드
npm run test:watch

# 커버리지 확인
npm run test:coverage
```

## 📝 라이선스

MIT License

## 🔗 참조

- [Genspark News](https://www.genspark.ai/news) - UI/UX 디자인 참고
- [NewsAPI](https://newsapi.org) - 뉴스 데이터 제공
- [OpenAI](https://openai.com) - AI 요약 기능
