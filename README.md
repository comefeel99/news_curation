# 뉴스 큐레이션 프로젝트 (News Curation)

AI 기반의 최신 과학/기술 뉴스 큐레이션 및 요약 서비스입니다. NewsAPI를 통해 뉴스를 수집하고, OpenAI GPT를 활용하여 핵심 내용을 요약 제공합니다.

## 📚 문서 목록

이 프로젝트에 대한 자세한 문서는 `docs/` 디렉토리에 위치해 있습니다.

- [**시스템 아키텍처 (Architecture)**](docs/ARCHITECTURE.md): 시스템 구조, 데이터 흐름, 기술 스택에 대한 상세 설명
- [**API 레퍼런스 (API Reference)**](docs/API_REFERENCE.md): API 엔드포인트 및 사용법
- [**데이터베이스 스키마 (Database Schema)**](docs/DATABASE_SCHEMA.md): 데이터베이스 테이블 구조 및 ERD
- [**사용자 가이드 (User Guide)**](docs/USER_GUIDE.md): 기능 소개 및 설정 방법

## 🚀 빠른 시작 (Quick Start)

### 필수 요구 사항
- Node.js 18 이상
- NewsAPI Key
- OpenAI API Key

### 설치 및 실행

1. **저장소 클론 및 이동**
   ```bash
   git clone <repository-url>
   cd news_curation/app
   ```

2. **의존성 설치**
   ```bash
   npm install
   ```

3. **환경 변수 설정**
   `app/.env.local` 파일을 생성하고 키를 입력하세요.
   ```bash
   cp .env.example .env.local
   # .env.local 파일 편집
   ```

4. **개발 서버 실행**
   ```bash
   npm run dev
   ```
   브라우저에서 [http://localhost:3000](http://localhost:3000)으로 접속하세요.

## 🤝 기여하기 (Contributing)

프로젝트 기여 방법에 대한 자세한 내용은 [DATA_CONTRIBUTING.md](CONTRIBUTING.md)를 참고해주세요.

## 📝 라이선스

MIT License
