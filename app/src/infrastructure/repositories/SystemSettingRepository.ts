import Database from 'better-sqlite3'
import { getDatabase, initializeDatabase, isDatabaseInitialized } from '../database/sqlite'

export interface SystemSetting {
    key: string
    value: string
    updatedAt: Date
}

export class SystemSettingRepository {
    private ensureDatabase() {
        if (!isDatabaseInitialized()) {
            initializeDatabase()
        }
        return getDatabase()
    }

    /**
     * 설정값 조회
     * @param key 설정 키
     */
    get(key: string): string | null {
        const db = this.ensureDatabase()
        const stmt = db.prepare('SELECT value FROM system_settings WHERE key = ?')
        const row = stmt.get(key) as { value: string } | undefined
        return row ? row.value : null
    }

    /**
     * 설정값 저장
     * @param key 설정 키
     * @param value 설정 값
     */
    set(key: string, value: string): void {
        const db = this.ensureDatabase()
        const stmt = db.prepare(`
            INSERT INTO system_settings (key, value, updated_at)
            VALUES (?, ?, datetime('now'))
            ON CONFLICT(key) DO UPDATE SET
            value = excluded.value,
            updated_at = excluded.updated_at
        `)
        stmt.run(key, value)
    }

    /**
     * 모든 설정 조회
     */
    getAll(): Record<string, string> {
        const db = this.ensureDatabase()
        const stmt = db.prepare('SELECT key, value FROM system_settings')
        const rows = stmt.all() as { key: string; value: string }[]

        const settings: Record<string, string> = {}
        rows.forEach(row => {
            settings[row.key] = row.value
        })
        return settings
    }
}
