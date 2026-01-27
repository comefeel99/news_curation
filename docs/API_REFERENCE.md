# API 레퍼런스 (API Reference)

이 문서는 News Curation 서비스의 내부 API 엔드포인트에 대한 명세입니다. 모든 응답은 JSON 포맷으로 반환됩니다.

## 📰 뉴스 (News)

### 뉴스 목록 조회
수집된 뉴스 목록을 페이징하여 조회합니다.

- **URL**: `GET /api/news`
- **Parameters**:

| 이름 | 타입 | 필수 여부 | 기본값 | 설명 |
|------|------|----------|--------|------|
| `page` | number | No | 1 | 조회할 페이지 번호 |
| `limit` | number | No | 10 | 페이지 당 항목 수 (최대 50) |
| `categoryId` | string | No | - | 특정 카테고리의 뉴스만 필터링 |

- **Response Example**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-string",
      "title": "뉴스 제목",
      "url": "https://news.com/article",
      "source": "언론사명",
      "publishedAt": "2026-01-27T10:00:00Z",
      "summary": "AI 요약 내용...",
      "imageUrl": "https://news.com/image.jpg",
      "categoryId": "category-id"
    }
  ],
  "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "hasMore": true,
      "totalPages": 10
  }
}
```

### 뉴스 수집 트리거
즉시 뉴스 수집을 실행합니다.

- **URL**: `POST /api/news/fetch`
- **Response Example**:
```json
{
  "success": true,
  "technology": {
    "fetched": 10,
    "saved": 5,
    "duplicates": 5,
    "errors": []
  },
  "science": { ... }
}
```

## 🗂️ 카테고리 (Categories)

### 카테고리 목록 조회
등록된 모든 뉴스 카테고리를 조회합니다.

- **URL**: `GET /api/categories`
- **Response Example**:
```json
{
  "success": true,
  "data": [
    {
      "id": "tech",
      "name": "기술",
      "searchQuery": "technology OR AI",
      "isDefault": 1
    },
    ...
  ]
}
```

### 카테고리 추가
새로운 뉴스 카테고리를 추가합니다.

- **URL**: `POST /api/categories`
- **Body**:
```json
{
  "name": "경제",
  "searchQuery": "economy OR finance"
}
```
- **Response Example**:
```json
{
  "success": true,
  "data": {
      "id": "uuid...",
      "name": "경제",
      ...
  }
}
```

## ⚙️ 관리자 (Admin)

### 설정 조회
시스템 설정을 조회합니다.

- **URL**: `GET /api/admin/settings`

### 설정 업데이트
시스템 설정을 수정합니다.

- **URL**: `POST /api/admin/settings`
- **Body**: `{ "key": "CRON_SCHEDULE", "value": "0 */12 * * *" }`
