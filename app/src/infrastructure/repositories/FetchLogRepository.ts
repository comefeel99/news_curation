import { v4 as uuidv4 } from 'uuid'
import Database from 'better-sqlite3'

/**
 * 카테고리별 수집 결과
 */
export interface CategoryFetchResult {
    categoryId: string
    categoryName: string
    fetched: number
    saved: number
    duplicates: number
    errors: string[]
}

/**
 * 수집 로그 엔티티
 */
export interface FetchLog {
    id: string
    createdAt: Date
    status: 'success' | 'error'
    durationMs: number
    totalFetched: number
    totalSaved: number
    totalDuplicates: number
    categoryResults: CategoryFetchResult[]
    errorMessage?: string
}

/**
 * 수집 로그 생성 입력
 */
export interface CreateFetchLogInput {
    status: 'success' | 'error'
    durationMs: number
    totalFetched: number
    totalSaved: number
    totalDuplicates: number
    categoryResults: CategoryFetchResult[]
    errorMessage?: string
}

/**
 * 페이지네이션 결과
 */
export interface PaginatedFetchLogs {
    data: FetchLog[]
    total: number
    page: number
    limit: number
    hasMore: boolean
}

/**
 * DB row를 FetchLog로 변환
 */
function rowToFetchLog(row: Record<string, unknown>): FetchLog {
    return {
        id: row.id as string,
        createdAt: new Date(row.created_at as string),
        status: row.status as 'success' | 'error',
        durationMs: row.duration_ms as number,
        totalFetched: row.total_fetched as number,
        totalSaved: row.total_saved as number,
        totalDuplicates: row.total_duplicates as number,
        categoryResults: JSON.parse((row.category_results as string) || '[]'),
        errorMessage: row.error_message as string | undefined,
    }
}

/**
 * 수집 로그 저장소
 */
export class FetchLogRepository {
    private db: Database.Database

    constructor(db: Database.Database) {
        this.db = db
    }

    /**
     * 수집 로그 저장
     */
    save(input: CreateFetchLogInput): FetchLog {
        const id = uuidv4()
        const createdAt = new Date()

        const stmt = this.db.prepare(`
            INSERT INTO fetch_logs (id, created_at, status, duration_ms, total_fetched, total_saved, total_duplicates, category_results, error_message)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)

        stmt.run(
            id,
            createdAt.toISOString(),
            input.status,
            input.durationMs,
            input.totalFetched,
            input.totalSaved,
            input.totalDuplicates,
            JSON.stringify(input.categoryResults),
            input.errorMessage || null
        )

        return {
            id,
            createdAt,
            ...input,
        }
    }

    /**
     * 페이지네이션된 로그 조회 (최신순)
     */
    findAllPaginated(page: number, limit: number): PaginatedFetchLogs {
        const offset = (page - 1) * limit

        const countStmt = this.db.prepare('SELECT COUNT(*) as count FROM fetch_logs')
        const countResult = countStmt.get() as { count: number }
        const total = countResult.count

        const stmt = this.db.prepare(`
            SELECT * FROM fetch_logs ORDER BY created_at DESC LIMIT ? OFFSET ?
        `)
        const rows = stmt.all(limit, offset) as Record<string, unknown>[]
        const data = rows.map(rowToFetchLog)

        return {
            data,
            total,
            page,
            limit,
            hasMore: offset + data.length < total,
        }
    }

    /**
     * ID로 로그 조회
     */
    findById(id: string): FetchLog | null {
        const stmt = this.db.prepare('SELECT * FROM fetch_logs WHERE id = ?')
        const row = stmt.get(id) as Record<string, unknown> | undefined
        return row ? rowToFetchLog(row) : null
    }

    /**
     * 최근 로그 조회
     */
    findRecent(limit: number = 10): FetchLog[] {
        const stmt = this.db.prepare(`
            SELECT * FROM fetch_logs ORDER BY created_at DESC LIMIT ?
        `)
        const rows = stmt.all(limit) as Record<string, unknown>[]
        return rows.map(rowToFetchLog)
    }
}
