import Database from 'better-sqlite3'
import { v4 as uuidv4 } from 'uuid'

/**
 * GPT 로그 엔트리 타입
 */
export interface GPTLogEntry {
    id: string
    createdAt: Date
    model: string
    prompt: string
    response: string | null
    tokensInput: number | null
    tokensOutput: number | null
    durationMs: number
    newsId: string | null
    status: 'success' | 'error'
    errorMessage: string | null
}

/**
 * GPT 로그 입력 타입 (id, createdAt 제외)
 */
export type GPTLogInput = Omit<GPTLogEntry, 'id' | 'createdAt'>

/**
 * GPT 통계 타입
 */
export interface GPTStats {
    totalCalls: number
    successCalls: number
    errorCalls: number
    totalTokensInput: number
    totalTokensOutput: number
    avgDurationMs: number
}

/**
 * GPT API 호출 로거
 * 모든 GPT API 호출을 데이터베이스에 기록합니다.
 */
export class GPTLogger {
    private db: Database.Database

    constructor(database: Database.Database) {
        this.db = database
    }

    /**
     * GPT 호출 로그 저장
     * @param entry - 로그 엔트리 데이터
     * @returns 저장된 로그 ID
     */
    log(entry: GPTLogInput): string {
        const id = uuidv4()
        const createdAt = new Date().toISOString()

        const stmt = this.db.prepare(`
      INSERT INTO gpt_logs 
      (id, created_at, model, prompt, response, tokens_input, tokens_output, 
       duration_ms, news_id, status, error_message)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

        stmt.run(
            id,
            createdAt,
            entry.model,
            entry.prompt,
            entry.response,
            entry.tokensInput,
            entry.tokensOutput,
            entry.durationMs,
            entry.newsId,
            entry.status,
            entry.errorMessage
        )

        return id
    }

    /**
     * 최근 로그 조회
     * @param limit - 조회할 로그 수 (기본: 100)
     * @returns 로그 엔트리 배열
     */
    getRecentLogs(limit: number = 100): GPTLogEntry[] {
        const stmt = this.db.prepare(`
      SELECT * FROM gpt_logs ORDER BY created_at DESC LIMIT ?
    `)
        const rows = stmt.all(limit) as Record<string, unknown>[]
        return rows.map(this.rowToLogEntry)
    }

    /**
     * 특정 뉴스의 로그 조회
     * @param newsId - 뉴스 ID
     * @returns 로그 엔트리 배열
     */
    getLogsByNewsId(newsId: string): GPTLogEntry[] {
        const stmt = this.db.prepare(`
      SELECT * FROM gpt_logs WHERE news_id = ? ORDER BY created_at DESC
    `)
        const rows = stmt.all(newsId) as Record<string, unknown>[]
        return rows.map(this.rowToLogEntry)
    }

    /**
     * GPT 사용 통계 조회
     * @returns 통계 데이터
     */
    getStats(): GPTStats {
        const stmt = this.db.prepare(`
      SELECT 
        COUNT(*) as total_calls,
        SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success_calls,
        SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as error_calls,
        COALESCE(SUM(tokens_input), 0) as total_tokens_input,
        COALESCE(SUM(tokens_output), 0) as total_tokens_output,
        COALESCE(AVG(duration_ms), 0) as avg_duration_ms
      FROM gpt_logs
    `)
        const row = stmt.get() as Record<string, unknown>

        return {
            totalCalls: Number(row.total_calls) || 0,
            successCalls: Number(row.success_calls) || 0,
            errorCalls: Number(row.error_calls) || 0,
            totalTokensInput: Number(row.total_tokens_input) || 0,
            totalTokensOutput: Number(row.total_tokens_output) || 0,
            avgDurationMs: Number(row.avg_duration_ms) || 0,
        }
    }

    /**
     * 오래된 로그 삭제
     * @param daysToKeep - 보관 일수 (기본: 30일)
     * @returns 삭제된 로그 수
     */
    cleanOldLogs(daysToKeep: number = 30): number {
        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

        const stmt = this.db.prepare(`
      DELETE FROM gpt_logs WHERE created_at < ?
    `)
        const result = stmt.run(cutoffDate.toISOString())
        return result.changes
    }

    /**
     * DB row를 GPTLogEntry로 변환
     */
    private rowToLogEntry(row: Record<string, unknown>): GPTLogEntry {
        return {
            id: row.id as string,
            createdAt: new Date(row.created_at as string),
            model: row.model as string,
            prompt: row.prompt as string,
            response: row.response as string | null,
            tokensInput: row.tokens_input as number | null,
            tokensOutput: row.tokens_output as number | null,
            durationMs: row.duration_ms as number,
            newsId: row.news_id as string | null,
            status: row.status as 'success' | 'error',
            errorMessage: row.error_message as string | null,
        }
    }
}
