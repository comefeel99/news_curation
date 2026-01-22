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

  // 카테고리 테이블 생성
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      search_query TEXT NOT NULL,
      is_default INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    )
  `)

  // 뉴스 테이블 생성 (category_id 포함)
  db.exec(`
    CREATE TABLE IF NOT EXISTS news (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      url TEXT NOT NULL UNIQUE,
      source TEXT NOT NULL,
      published_at TEXT NOT NULL,
      summary TEXT,
      image_url TEXT,
      category_id TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    )
  `)

  // 기존 news 테이블에 category_id 컬럼이 없는 경우 추가 (마이그레이션)
  try {
    db.exec(`ALTER TABLE news ADD COLUMN category_id TEXT REFERENCES categories(id)`)
  } catch {
    // 컬럼이 이미 존재하면 무시
  }

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

  // 수집 로그 테이블 생성
  db.exec(`
    CREATE TABLE IF NOT EXISTS fetch_logs (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      status TEXT NOT NULL,
      duration_ms INTEGER,
      total_fetched INTEGER,
      total_saved INTEGER,
      total_duplicates INTEGER,
      category_results TEXT,
      error_message TEXT
    )
  `)

  // Search API 호출 로그 테이블 생성
  db.exec(`
    CREATE TABLE IF NOT EXISTS search_api_logs (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      category_id TEXT,
      category_name TEXT,
      search_query TEXT NOT NULL,
      status TEXT NOT NULL,
      duration_ms INTEGER,
      result_count INTEGER,
      tokens_prompt INTEGER,
      tokens_completion INTEGER,
      request_body TEXT,
      response_body TEXT,
      error_message TEXT
    )
  `)

  // 시스템 설정 테이블 생성
  db.exec(`
    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `)

  // 인덱스 생성
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_news_published_at ON news(published_at DESC);
    CREATE INDEX IF NOT EXISTS idx_news_url ON news(url);
    CREATE INDEX IF NOT EXISTS idx_news_category_id ON news(category_id);
    CREATE INDEX IF NOT EXISTS idx_gpt_logs_created_at ON gpt_logs(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_gpt_logs_news_id ON gpt_logs(news_id);
    CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);
    CREATE INDEX IF NOT EXISTS idx_fetch_logs_created_at ON fetch_logs(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_search_api_logs_created_at ON search_api_logs(created_at DESC);
  `)

  // 기본 카테고리 시드 데이터 삽입
  seedDefaultCategories(db)

  // 기본 시스템 설정 시드 데이터 삽입
  seedDefaultSettings(db)
}

/**
 * 기본 시스템 설정 데이터 삽입
 */
function seedDefaultSettings(database: Database.Database): void {
  const insertStmt = database.prepare(`
    INSERT OR IGNORE INTO system_settings (key, value, updated_at)
    VALUES (?, ?, datetime('now'))
  `)

  // 기본 스케줄: 6시간 마다
  insertStmt.run('CRON_SCHEDULE', '0 */6 * * *')
  // 기본 상태: 활성화
  insertStmt.run('CRON_ENABLED', 'true')
}

/**
 * 기본 카테고리 시드 데이터 삽입
 */
function seedDefaultCategories(database: Database.Database): void {
  const insertStmt = database.prepare(`
        INSERT OR IGNORE INTO categories (id, name, search_query, is_default, created_at)
        VALUES (?, ?, ?, 1, datetime('now'))
    `)

  insertStmt.run(
    'default-tech',
    '기술',
    '최신 IT 기술 뉴스 인공지능 AI 소프트웨어 스타트업'
  )

  insertStmt.run(
    'default-science',
    '과학',
    '최신 과학 뉴스 연구 발견 우주 바이오 기술'
  )
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
