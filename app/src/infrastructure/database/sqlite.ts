import Database from 'better-sqlite3'
import path from 'path'

let db: Database.Database | null = null

const DEFAULT_DB_PATH = path.join(process.cwd(), 'data', 'news.db')

/**
 * 데이터베이스 초기화 및 테이블 생성
 * @param dbPath - 데이터베이스 파일 경로 (기본: ./data/news.db)
 */
export function initializeDatabase(dbPath: string = DEFAULT_DB_PATH): void {
    // 디렉토리 생성
    const fs = require('fs')
    const dir = path.dirname(dbPath)
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
    }

    db = new Database(dbPath)

    // WAL 모드 활성화 (성능 향상)
    db.pragma('journal_mode = WAL')

    // 뉴스 테이블 생성
    db.exec(`
    CREATE TABLE IF NOT EXISTS news (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      url TEXT NOT NULL UNIQUE,
      source TEXT NOT NULL,
      published_at TEXT NOT NULL,
      summary TEXT,
      image_url TEXT,
      created_at TEXT NOT NULL
    )
  `)

    // GPT 로그 테이블 생성
    db.exec(`
    CREATE TABLE IF NOT EXISTS gpt_logs (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      model TEXT NOT NULL,
      prompt TEXT NOT NULL,
      response TEXT,
      tokens_input INTEGER,
      tokens_output INTEGER,
      duration_ms INTEGER,
      news_id TEXT,
      status TEXT NOT NULL,
      error_message TEXT
    )
  `)

    // 인덱스 생성
    db.exec(`
    CREATE INDEX IF NOT EXISTS idx_news_published_at ON news(published_at DESC);
    CREATE INDEX IF NOT EXISTS idx_news_url ON news(url);
    CREATE INDEX IF NOT EXISTS idx_gpt_logs_created_at ON gpt_logs(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_gpt_logs_news_id ON gpt_logs(news_id);
  `)
}

/**
 * 현재 데이터베이스 인스턴스 반환
 * @returns Database 인스턴스
 * @throws 데이터베이스가 초기화되지 않은 경우 에러
 */
export function getDatabase(): Database.Database {
    if (!db) {
        throw new Error('Database not initialized. Call initializeDatabase() first.')
    }
    return db
}

/**
 * 데이터베이스 연결 종료
 */
export function closeDatabase(): void {
    if (db) {
        db.close()
        db = null
    }
}

/**
 * 데이터베이스 초기화 여부 확인
 */
export function isDatabaseInitialized(): boolean {
    return db !== null
}
