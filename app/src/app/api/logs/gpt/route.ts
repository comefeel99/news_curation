import { NextRequest, NextResponse } from 'next/server'
import { GPTLogger } from '@/infrastructure/logging/GPTLogger'
import { initializeDatabase, getDatabase, isDatabaseInitialized } from '@/infrastructure/database/sqlite'

/**
 * GET /api/logs/gpt
 * GPT API 호출 로그 조회
 */
export async function GET(request: NextRequest) {
    try {
        // 쿼리 파라미터 파싱
        const searchParams = request.nextUrl.searchParams
        const limit = parseInt(searchParams.get('limit') || '100', 10)
        const newsId = searchParams.get('newsId')

        // 유효성 검증
        if (limit < 1 || limit > 1000) {
            return NextResponse.json(
                { error: 'Invalid limit parameter (1-1000)' },
                { status: 400 }
            )
        }

        // 데이터베이스 초기화
        if (!isDatabaseInitialized()) {
            initializeDatabase()
        }

        const gptLogger = new GPTLogger(getDatabase())

        // 로그 조회
        let logs
        if (newsId) {
            logs = gptLogger.getLogsByNewsId(newsId)
        } else {
            logs = gptLogger.getRecentLogs(limit)
        }

        // 통계 조회
        const stats = gptLogger.getStats()

        return NextResponse.json({
            success: true,
            stats,
            logs,
        })
    } catch (error) {
        console.error('Error fetching GPT logs:', error)
        const message = error instanceof Error ? error.message : 'Unknown error'
        return NextResponse.json(
            { error: `Failed to fetch GPT logs: ${message}` },
            { status: 500 }
        )
    }
}

/**
 * DELETE /api/logs/gpt
 * 오래된 GPT 로그 삭제
 */
export async function DELETE(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const daysToKeep = parseInt(searchParams.get('days') || '30', 10)

        if (daysToKeep < 1) {
            return NextResponse.json(
                { error: 'Invalid days parameter' },
                { status: 400 }
            )
        }

        if (!isDatabaseInitialized()) {
            initializeDatabase()
        }

        const gptLogger = new GPTLogger(getDatabase())
        const deleted = gptLogger.cleanOldLogs(daysToKeep)

        return NextResponse.json({
            success: true,
            deleted,
            message: `Deleted ${deleted} logs older than ${daysToKeep} days`,
        })
    } catch (error) {
        console.error('Error deleting GPT logs:', error)
        const message = error instanceof Error ? error.message : 'Unknown error'
        return NextResponse.json(
            { error: `Failed to delete GPT logs: ${message}` },
            { status: 500 }
        )
    }
}
