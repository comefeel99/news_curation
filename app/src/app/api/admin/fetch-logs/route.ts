import { NextRequest, NextResponse } from 'next/server'
import { FetchLogRepository } from '@/infrastructure/repositories/FetchLogRepository'
import { initializeDatabase, getDatabase, isDatabaseInitialized } from '@/infrastructure/database/sqlite'

/**
 * GET /api/admin/fetch-logs
 * 수집 로그 목록 조회 (최신순, 페이지네이션)
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const page = parseInt(searchParams.get('page') || '1', 10)
        const limit = parseInt(searchParams.get('limit') || '20', 10)

        // 유효성 검증
        if (page < 1 || limit < 1 || limit > 100) {
            return NextResponse.json(
                { error: 'Invalid page or limit parameter' },
                { status: 400 }
            )
        }

        // 데이터베이스 초기화
        if (!isDatabaseInitialized()) {
            initializeDatabase()
        }

        const db = getDatabase()
        const fetchLogRepository = new FetchLogRepository(db)
        const result = fetchLogRepository.findAllPaginated(page, limit)

        return NextResponse.json({
            success: true,
            data: result.data,
            pagination: {
                page: result.page,
                limit: result.limit,
                total: result.total,
                hasMore: result.hasMore,
                totalPages: Math.ceil(result.total / result.limit),
            },
        })
    } catch (error) {
        console.error('Error fetching logs:', error)
        const message = error instanceof Error ? error.message : 'Unknown error'
        return NextResponse.json(
            { error: `Failed to fetch logs: ${message}` },
            { status: 500 }
        )
    }
}
