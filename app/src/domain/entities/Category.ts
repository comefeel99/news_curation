import { v4 as uuidv4 } from 'uuid'

/**
 * Category 엔티티 타입 정의
 */
export interface Category {
    id: string
    name: string           // 카테고리 이름 (예: "sk텔레콤 주식")
    searchQuery: string    // 검색 쿼리 (예: "sk텔레콤 주식 시세")
    isDefault: boolean     // 기본 카테고리 여부 (삭제 불가)
    createdAt: Date
}

/**
 * Category 생성에 필요한 입력 데이터 타입
 */
export interface CreateCategoryInput {
    name: string
    searchQuery: string
    isDefault?: boolean
}

/**
 * 기본 카테고리 ID 상수
 */
export const DEFAULT_CATEGORY_IDS = {
    TECH: 'default-tech',
    SCIENCE: 'default-science',
} as const

/**
 * 기본 카테고리 데이터
 */
export const DEFAULT_CATEGORIES: CreateCategoryInput[] = [
    {
        name: '기술',
        searchQuery: '최신 IT 기술 뉴스 인공지능 AI 소프트웨어 스타트업',
        isDefault: true,
    },
    {
        name: '과학',
        searchQuery: '최신 과학 뉴스 연구 발견 우주 바이오 기술',
        isDefault: true,
    },
]

/**
 * Category 엔티티 생성 함수
 * @param input - 카테고리 생성에 필요한 데이터
 * @param customId - 커스텀 ID (기본 카테고리용)
 * @returns 생성된 Category 엔티티
 */
export function createCategory(input: CreateCategoryInput, customId?: string): Category {
    return {
        id: customId || uuidv4(),
        name: input.name,
        searchQuery: input.searchQuery,
        isDefault: input.isDefault ?? false,
        createdAt: new Date(),
    }
}

/**
 * Category 데이터 유효성 검증 함수
 * @param data - 검증할 카테고리 데이터
 * @returns 유효하면 true, 그렇지 않으면 false
 */
export function validateCategory(data: Partial<CreateCategoryInput>): boolean {
    // 이름 검증
    if (!data.name || data.name.trim() === '') {
        return false
    }

    // 검색 쿼리 검증
    if (!data.searchQuery || data.searchQuery.trim() === '') {
        return false
    }

    // 이름 길이 제한 (1-50자)
    if (data.name.length > 50) {
        return false
    }

    // 검색 쿼리 길이 제한 (1-200자)
    if (data.searchQuery.length > 200) {
        return false
    }

    return true
}

/**
 * 데이터베이스 row를 Category 엔티티로 변환
 * @param row - SQLite에서 가져온 row 데이터
 * @returns Category 엔티티
 */
export function rowToCategory(row: Record<string, unknown>): Category {
    return {
        id: row.id as string,
        name: row.name as string,
        searchQuery: row.search_query as string,
        isDefault: Boolean(row.is_default),
        createdAt: new Date(row.created_at as string),
    }
}
