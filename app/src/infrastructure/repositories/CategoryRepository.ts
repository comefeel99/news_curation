import Database from 'better-sqlite3'
import { Category, rowToCategory, CreateCategoryInput, createCategory } from '@/domain/entities/Category'

/**
 * 카테고리 최대 개수 제한 (기본 카테고리 포함)
 */
const MAX_CATEGORIES = 7

/**
 * 카테고리 저장소
 * 카테고리 CRUD 작업을 담당합니다.
 */
export class CategoryRepository {
    private db: Database.Database

    constructor(db: Database.Database) {
        this.db = db
    }

    /**
     * 카테고리 저장
     * @param category - 저장할 카테고리 엔티티
     * @returns 저장된 카테고리 또는 null (중복인 경우)
     */
    save(category: Category): Category | null {
        // 중복 이름 체크
        const existing = this.findByName(category.name)
        if (existing) {
            return null
        }

        // 최대 개수 체크
        if (this.count() >= MAX_CATEGORIES) {
            throw new Error(`최대 ${MAX_CATEGORIES}개의 카테고리만 생성할 수 있습니다.`)
        }

        const stmt = this.db.prepare(`
      INSERT INTO categories (id, name, search_query, is_default, created_at)
      VALUES (?, ?, ?, ?, ?)
    `)

        stmt.run(
            category.id,
            category.name,
            category.searchQuery,
            category.isDefault ? 1 : 0,
            category.createdAt.toISOString()
        )

        return category
    }

    /**
     * 입력 데이터로 카테고리 생성 및 저장
     * @param input - 카테고리 생성 입력 데이터
     * @returns 생성된 카테고리 또는 null
     */
    create(input: CreateCategoryInput): Category | null {
        const category = createCategory(input)
        return this.save(category)
    }

    /**
     * 모든 카테고리 조회
     * @returns 카테고리 배열 (기본 카테고리가 먼저, 그 다음 생성일 순)
     */
    findAll(): Category[] {
        const stmt = this.db.prepare(`
      SELECT * FROM categories 
      ORDER BY is_default DESC, created_at ASC
    `)
        const rows = stmt.all() as Record<string, unknown>[]
        return rows.map(rowToCategory)
    }

    /**
     * ID로 카테고리 조회
     * @param id - 카테고리 ID
     * @returns 카테고리 또는 null
     */
    findById(id: string): Category | null {
        const stmt = this.db.prepare('SELECT * FROM categories WHERE id = ?')
        const row = stmt.get(id) as Record<string, unknown> | undefined
        return row ? rowToCategory(row) : null
    }

    /**
     * 이름으로 카테고리 조회
     * @param name - 카테고리 이름
     * @returns 카테고리 또는 null
     */
    findByName(name: string): Category | null {
        const stmt = this.db.prepare('SELECT * FROM categories WHERE name = ?')
        const row = stmt.get(name) as Record<string, unknown> | undefined
        return row ? rowToCategory(row) : null
    }

    /**
     * 검색 쿼리 업데이트
     * @param id - 카테고리 ID
     * @param name - 새 이름
     * @param searchQuery - 새 검색 쿼리
     * @returns 업데이트된 카테고리 또는 null
     */
    update(id: string, name: string, searchQuery: string): Category | null {
        // 1. 존재 여부 및 수정 가능 여부 확인
        const existing = this.findById(id)
        if (!existing) {
            return null
        }

        if (existing.isDefault) {
            throw new Error('기본 카테고리는 수정할 수 없습니다.')
        }

        // 2. 이름 중복 체크 (자기 자신 제외)
        const nameCheckStmt = this.db.prepare('SELECT id FROM categories WHERE name = ? AND id != ?')
        const duplicate = nameCheckStmt.get(name, id)
        if (duplicate) {
            throw new Error('이미 존재하는 카테고리 이름입니다.')
        }

        // 3. 업데이트 수행
        const stmt = this.db.prepare(`
            UPDATE categories 
            SET name = ?, search_query = ?
            WHERE id = ?
        `)

        stmt.run(name, searchQuery, id)

        return this.findById(id)
    }

    /**
     * 카테고리 삭제
     * @param id - 삭제할 카테고리 ID
     * @returns 삭제 성공 여부
     * @throws 기본 카테고리 삭제 시도 시 에러
     */
    delete(id: string): boolean {
        // 기본 카테고리 삭제 불가
        const category = this.findById(id)
        if (!category) {
            return false
        }

        if (category.isDefault) {
            throw new Error('기본 카테고리는 삭제할 수 없습니다.')
        }

        // 해당 카테고리의 뉴스들의 category_id를 null로 설정
        const updateNewsStmt = this.db.prepare('UPDATE news SET category_id = NULL WHERE category_id = ?')
        updateNewsStmt.run(id)

        // 카테고리 삭제
        const deleteStmt = this.db.prepare('DELETE FROM categories WHERE id = ?')
        const result = deleteStmt.run(id)

        return result.changes > 0
    }

    /**
     * 카테고리 개수 조회
     */
    count(): number {
        const stmt = this.db.prepare('SELECT COUNT(*) as count FROM categories')
        const row = stmt.get() as { count: number }
        return row.count
    }
}
