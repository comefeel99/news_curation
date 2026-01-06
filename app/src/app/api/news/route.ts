import { NextRequest, NextResponse } from 'next/server'
import { NewsRepository } from '@/infrastructure/repositories/NewsRepository'
import { initializeDatabase, getDatabase, isDatabaseInitialized } from '@/infrastructure/database/sqlite'

/**
 * GET /api/news
 * 뉴스 목록 조회 API (페이지네이션 지원)
 */
export async function GET(request: NextRequest) {
    try {
        // 쿼리 파라미터 파싱
        const searchParams = request.nextUrl.searchParams
        const page = parseInt(searchParams.get('page') || '1', 10)
        const limit = parseInt(searchParams.get('limit') || '10', 10)

        // 유효성 검증
        if (page < 1 || limit < 1 || limit > 50) {
            return NextResponse.json(
                { error: 'Invalid page or limit parameter' },
                { status: 400 }
            )
        }

        // 데이터베이스 초기화
        if (!isDatabaseInitialized()) {
            initializeDatabase()
        }

        // 뉴스 조회
        const repository = new NewsRepository(getDatabase())
        const result = repository.findAllPaginated(page, limit)

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
        console.error('Error fetching news:', error)
        const message = error instanceof Error ? error.message : 'Unknown error'
        return NextResponse.json(
            { error: `Failed to fetch news: ${message}` },
            { status: 500 }
        )
    }
}
