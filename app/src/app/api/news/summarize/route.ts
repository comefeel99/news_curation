import { NextResponse } from 'next/server'
import { NewsRepository } from '@/infrastructure/repositories/NewsRepository'
import { AISummaryService } from '@/application/services/AISummaryService'
import { GPTLogger } from '@/infrastructure/logging/GPTLogger'
import { initializeDatabase, getDatabase, isDatabaseInitialized } from '@/infrastructure/database/sqlite'

/**
 * POST /api/news/summarize
 * 기존 뉴스 중 요약 없는 항목에 AI 요약 생성
 */
export async function POST() {
    try {
        // OpenAI 키 확인
        const openaiKey = process.env.OPENAI_API_KEY
        if (!openaiKey) {
            return NextResponse.json(
                { error: 'OPENAI_API_KEY environment variable is not set' },
                { status: 500 }
            )
        }

        // 데이터베이스 초기화
        if (!isDatabaseInitialized()) {
            initializeDatabase()
        }

        const db = getDatabase()
        const repository = new NewsRepository(db)
        const gptLogger = new GPTLogger(db)
        const aiSummaryService = new AISummaryService(openaiKey, 'gpt-4o-mini', gptLogger)

        // 요약 없는 뉴스 조회
        const newsWithoutSummary = repository.findWithoutSummary()
        const total = newsWithoutSummary.length

        if (total === 0) {
            return NextResponse.json({
                success: true,
                message: 'All news already have summaries',
                processed: 0,
                succeeded: 0,
                failed: 0,
            })
        }

        let succeeded = 0
        let failed = 0
        const errors: string[] = []

        // 각 뉴스에 요약 생성
        for (const news of newsWithoutSummary) {
            try {
                const summary = await aiSummaryService.generateSummaryFromUrl(
                    news.title,
                    news.url,
                    news.source,
                    news.id
                )

                if (summary) {
                    repository.updateSummary(news.id, summary)
                    succeeded++
                } else {
                    failed++
                    errors.push(`No summary generated for: ${news.title}`)
                }
            } catch (error) {
                failed++
                const msg = error instanceof Error ? error.message : 'Unknown error'
                errors.push(`Error for ${news.id}: ${msg}`)
                console.error(`Error generating summary for ${news.id}:`, msg)
            }
        }

        return NextResponse.json({
            success: true,
            processed: total,
            succeeded,
            failed,
            errors: errors.slice(0, 10), // 최대 10개 에러만 반환
        })
    } catch (error) {
        console.error('Error summarizing news:', error)
        const message = error instanceof Error ? error.message : 'Unknown error'
        return NextResponse.json(
            { error: `Failed to summarize news: ${message}` },
            { status: 500 }
        )
    }
}
