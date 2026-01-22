import Database from 'better-sqlite3'
import { News, rowToNews } from '@/domain/entities/News'

/**
 * 페이지네이션 결과 타입
 */
export interface PaginatedResult<T> {
    data: T[]
    total: number
    page: number
    limit: number
    hasMore: boolean
}

/**
 * 뉴스 저장소 클래스
 * SQLite 데이터베이스와 상호작용하여 뉴스 데이터를 관리합니다.
 */
export class NewsRepository {
    private db: Database.Database

    constructor(database: Database.Database) {
        this.db = database
    }

    /**
     * 뉴스 저장
     * @param news - 저장할 뉴스 엔티티
     * @returns 저장된 뉴스 또는 중복 시 null
     */
    save(news: News): News | null {
        // 중복 URL 체크
        const existing = this.findByUrl(news.url)
        if (existing) {
            return null
        }

        const stmt = this.db.prepare(`
      INSERT INTO news (id, title, url, source, published_at, summary, image_url, category_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

        stmt.run(
            news.id,
            news.title,
            news.url,
            news.source,
            news.publishedAt.toISOString(),
            news.summary || null,
            news.imageUrl || null,
            news.categoryId || null,
            news.createdAt.toISOString()
        )

        return news
    }

    /**
     * 모든 뉴스 조회 (최신순 정렬)
     * @returns 뉴스 배열
     */
    findAll(): News[] {
        const stmt = this.db.prepare(`
      SELECT * FROM news ORDER BY published_at DESC
    `)
        const rows = stmt.all() as Record<string, unknown>[]
        return rows.map(rowToNews)
    }

    /**
     * 페이지네이션된 뉴스 조회
     * @param page - 페이지 번호 (1부터 시작)
     * @param limit - 페이지당 항목 수
     * @param categoryId - 카테고리 ID (선택적)
     * @returns 페이지네이션 결과
     */
    findAllPaginated(page: number, limit: number, categoryId?: string): PaginatedResult<News> {
        const offset = (page - 1) * limit

        let total: number
        let rows: Record<string, unknown>[]

        if (categoryId) {
            // 특정 카테고리의 뉴스만 조회
            const countStmt = this.db.prepare('SELECT COUNT(*) as count FROM news WHERE category_id = ?')
            const countResult = countStmt.get(categoryId) as { count: number }
            total = countResult.count

            const stmt = this.db.prepare(`
              SELECT * FROM news WHERE category_id = ? ORDER BY published_at DESC LIMIT ? OFFSET ?
            `)
            rows = stmt.all(categoryId, limit, offset) as Record<string, unknown>[]
        } else {
            // 전체 뉴스 조회
            const countStmt = this.db.prepare('SELECT COUNT(*) as count FROM news')
            const countResult = countStmt.get() as { count: number }
            total = countResult.count

            const stmt = this.db.prepare(`
              SELECT * FROM news ORDER BY published_at DESC LIMIT ? OFFSET ?
            `)
            rows = stmt.all(limit, offset) as Record<string, unknown>[]
        }

        const data = rows.map(rowToNews)

        return {
            data,
            total,
            page,
            limit,
            hasMore: offset + data.length < total,
        }
    }

    /**
     * 카테고리별 뉴스 조회
     * @param categoryId - 카테고리 ID
     * @param page - 페이지 번호
     * @param limit - 페이지당 항목 수
     * @returns 페이지네이션 결과
     */
    findByCategory(categoryId: string, page: number, limit: number): PaginatedResult<News> {
        return this.findAllPaginated(page, limit, categoryId)
    }

    /**
     * ID로 뉴스 조회
     * @param id - 뉴스 ID
     * @returns 뉴스 또는 null
     */
    findById(id: string): News | null {
        const stmt = this.db.prepare('SELECT * FROM news WHERE id = ?')
        const row = stmt.get(id) as Record<string, unknown> | undefined
        return row ? rowToNews(row) : null
    }

    /**
     * URL로 뉴스 조회
     * @param url - 뉴스 URL
     * @returns 뉴스 또는 null
     */
    findByUrl(url: string): News | null {
        const stmt = this.db.prepare('SELECT * FROM news WHERE url = ?')
        const row = stmt.get(url) as Record<string, unknown> | undefined
        return row ? rowToNews(row) : null
    }

    /**
     * 뉴스 요약 업데이트
     * @param id - 뉴스 ID
     * @param summary - 새로운 요약
     * @returns 업데이트 성공 여부
     */
    updateSummary(id: string, summary: string): boolean {
        const stmt = this.db.prepare('UPDATE news SET summary = ? WHERE id = ?')
        const result = stmt.run(summary, id)
        return result.changes > 0
    }

    /**
     * 요약이 없는 뉴스 조회
     * @param limit - 최대 개수
     * @returns 요약이 없는 뉴스 배열
     */
    findWithoutSummary(limit: number = 10): News[] {
        const stmt = this.db.prepare(`
      SELECT * FROM news WHERE summary IS NULL ORDER BY published_at DESC LIMIT ?
    `)
        const rows = stmt.all(limit) as Record<string, unknown>[]
        return rows.map(rowToNews)
    }

    /**
     * 뉴스 삭제
     * @param id - 뉴스 ID
     * @returns 삭제 성공 여부
     */
    delete(id: string): boolean {
        const stmt = this.db.prepare('DELETE FROM news WHERE id = ?')
        const result = stmt.run(id)
        return result.changes > 0
    }
}
