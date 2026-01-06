import { v4 as uuidv4 } from 'uuid'

/**
 * News 엔티티 타입 정의
 */
export interface News {
    id: string
    title: string
    url: string
    source: string
    publishedAt: Date
    summary?: string
    imageUrl?: string
    createdAt: Date
}

/**
 * News 생성에 필요한 입력 데이터 타입
 */
export interface CreateNewsInput {
    title: string
    url: string
    source: string
    publishedAt: Date
    summary?: string
    imageUrl?: string
}

/**
 * News 엔티티 생성 함수
 * @param input - 뉴스 생성에 필요한 데이터
 * @returns 생성된 News 엔티티
 */
export function createNews(input: CreateNewsInput): News {
    return {
        id: uuidv4(),
        title: input.title,
        url: input.url,
        source: input.source,
        publishedAt: input.publishedAt,
        summary: input.summary,
        imageUrl: input.imageUrl,
        createdAt: new Date(),
    }
}

/**
 * News 데이터 유효성 검증 함수
 * @param data - 검증할 뉴스 데이터
 * @returns 유효하면 true, 그렇지 않으면 false
 */
export function validateNews(data: Partial<CreateNewsInput>): boolean {
    // 필수 필드 검증
    if (!data.title || data.title.trim() === '') {
        return false
    }

    if (!data.url || data.url.trim() === '') {
        return false
    }

    if (!data.source || data.source.trim() === '') {
        return false
    }

    // URL 형식 검증
    try {
        new URL(data.url)
    } catch {
        return false
    }

    return true
}

/**
 * 데이터베이스 row를 News 엔티티로 변환
 * @param row - SQLite에서 가져온 row 데이터
 * @returns News 엔티티
 */
export function rowToNews(row: Record<string, unknown>): News {
    return {
        id: row.id as string,
        title: row.title as string,
        url: row.url as string,
        source: row.source as string,
        publishedAt: new Date(row.published_at as string),
        summary: row.summary as string | undefined,
        imageUrl: row.image_url as string | undefined,
        createdAt: new Date(row.created_at as string),
    }
}
