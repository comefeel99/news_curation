import { NextResponse } from 'next/server'
import { SearchApiLogger } from '@/infrastructure/logging/SearchApiLogger'

/**
 * GET /api/admin/search-logs
 * Search API 호출 로그 조회
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1', 10)
        const limit = parseInt(searchParams.get('limit') || '20', 10)

        // 유효성 검증
        if (page < 1 || limit < 1 || limit > 100) {
            return NextResponse.json(
                { error: 'Invalid pagination parameters' },
                { status: 400 }
            )
        }

        const logger = new SearchApiLogger()
        const result = logger.findAllPaginated(page, limit)

        return NextResponse.json(result)
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        console.error('Error fetching search API logs:', error)

        return NextResponse.json(
            { error: `Failed to fetch logs: ${message}` },
            { status: 500 }
        )
    }
}
