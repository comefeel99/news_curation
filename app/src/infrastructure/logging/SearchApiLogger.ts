import { v4 as uuidv4 } from 'uuid'
import { getDatabase, initializeDatabase, isDatabaseInitialized } from '../database/sqlite'

/**
 * Search API 로그 엔티티
 */
export interface SearchApiLog {
    id: string
    createdAt: Date
    categoryId?: string
    categoryName?: string
    searchQuery: string
    status: 'success' | 'error'
    durationMs: number
    resultCount: number
    tokensPrompt?: number
    tokensCompletion?: number
    requestBody?: string
    responseBody?: string
    errorMessage?: string
}

/**
 * Search API 로그 생성 입력 타입
 */
export interface CreateSearchApiLogInput {
    categoryId?: string
    categoryName?: string
    searchQuery: string
    status: 'success' | 'error'
    durationMs: number
    resultCount: number
    tokensPrompt?: number
    tokensCompletion?: number
    requestBody?: string
    responseBody?: string
    errorMessage?: string
}

/**
 * 페이지네이션 결과 타입
 */
export interface PaginatedSearchApiLogs {
    logs: SearchApiLog[]
    total: number
    page: number
    limit: number
    totalPages: number
}

/**
 * DB row를 SearchApiLog로 변환
 */
interface SearchApiLogRow {
    id: string
    created_at: string
    category_id: string | null
    category_name: string | null
    search_query: string
    status: string
    duration_ms: number | null
    result_count: number | null
    tokens_prompt: number | null
    tokens_completion: number | null
    request_body: string | null
    response_body: string | null
    error_message: string | null
}

function rowToSearchApiLog(row: SearchApiLogRow): SearchApiLog {
    return {
        id: row.id,
        createdAt: new Date(row.created_at),
        categoryId: row.category_id || undefined,
        categoryName: row.category_name || undefined,
        searchQuery: row.search_query,
        status: row.status as 'success' | 'error',
        durationMs: row.duration_ms || 0,
        resultCount: row.result_count || 0,
        tokensPrompt: row.tokens_prompt || undefined,
        tokensCompletion: row.tokens_completion || undefined,
        requestBody: row.request_body || undefined,
        responseBody: row.response_body || undefined,
        errorMessage: row.error_message || undefined,
    }
}

/**
 * Search API 로그 저장소
 */
export class SearchApiLogger {
    private ensureDatabase() {
        if (!isDatabaseInitialized()) {
            initializeDatabase()
        }
        return getDatabase()
    }

    /**
     * Search API 호출 로그 저장
     */
    save(input: CreateSearchApiLogInput): SearchApiLog {
        const db = this.ensureDatabase()
        const id = uuidv4()
        const createdAt = new Date()

        const stmt = db.prepare(`
      INSERT INTO search_api_logs (
        id, created_at, category_id, category_name, search_query,
        status, duration_ms, result_count, tokens_prompt, tokens_completion,
        request_body, response_body, error_message
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

        stmt.run(
            id,
            createdAt.toISOString(),
            input.categoryId || null,
            input.categoryName || null,
            input.searchQuery,
            input.status,
            input.durationMs,
            input.resultCount,
            input.tokensPrompt || null,
            input.tokensCompletion || null,
            input.requestBody || null,
            input.responseBody || null,
            input.errorMessage || null
        )

        return {
            id,
            createdAt,
            ...input,
        }
    }

    /**
     * 페이지네이션된 로그 목록 조회
     */
    findAllPaginated(page: number = 1, limit: number = 20): PaginatedSearchApiLogs {
        const db = this.ensureDatabase()
        const offset = (page - 1) * limit

        // 전체 개수 조회
        const countStmt = db.prepare('SELECT COUNT(*) as count FROM search_api_logs')
        const countResult = countStmt.get() as { count: number }
        const total = countResult.count

        // 페이지네이션된 목록 조회
        const stmt = db.prepare(`
      SELECT * FROM search_api_logs
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `)
        const rows = stmt.all(limit, offset) as SearchApiLogRow[]

        return {
            logs: rows.map(rowToSearchApiLog),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        }
    }

    /**
     * 특정 로그 조회
     */
    findById(id: string): SearchApiLog | null {
        const db = this.ensureDatabase()
        const stmt = db.prepare('SELECT * FROM search_api_logs WHERE id = ?')
        const row = stmt.get(id) as SearchApiLogRow | undefined

        if (!row) {
            return null
        }

        return rowToSearchApiLog(row)
    }
}
