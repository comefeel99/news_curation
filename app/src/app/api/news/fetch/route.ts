import { NextResponse } from 'next/server'
import { NewsApiClient } from '@/infrastructure/api/NewsApiClient'
import { NewsRepository } from '@/infrastructure/repositories/NewsRepository'
import { NewsFetchService } from '@/application/services/NewsFetchService'
import { AISummaryService } from '@/application/services/AISummaryService'
import { GPTLogger } from '@/infrastructure/logging/GPTLogger'
import { initializeDatabase, getDatabase, isDatabaseInitialized } from '@/infrastructure/database/sqlite'

/**
 * POST /api/news/fetch
 * 뉴스 수집 API - NewsAPI에서 뉴스를 가져와 데이터베이스에 저장하고 AI 요약 생성
 */
export async function POST() {
    try {
        // NewsAPI 키 확인
        const newsApiKey = process.env.NEWSAPI_KEY
        if (!newsApiKey) {
            return NextResponse.json(
                { error: 'NEWSAPI_KEY environment variable is not set' },
                { status: 500 }
            )
        }

        // 데이터베이스 초기화
        if (!isDatabaseInitialized()) {
            initializeDatabase()
        }

        const db = getDatabase()

        // 서비스 인스턴스 생성
        const apiClient = new NewsApiClient(newsApiKey)
        const repository = new NewsRepository(db)

        // AI 요약 서비스 생성 (OpenAI 키가 있는 경우에만)
        let aiSummaryService: AISummaryService | null = null
        const openaiKey = process.env.OPENAI_API_KEY
        if (openaiKey) {
            const gptLogger = new GPTLogger(db)
            aiSummaryService = new AISummaryService(openaiKey, 'gpt-4o-mini', gptLogger)
        }

        const fetchService = new NewsFetchService(repository, apiClient, aiSummaryService)

        // 기술 뉴스 수집
        const techResult = await fetchService.fetchAndSaveNews()

        // 과학 뉴스 수집
        const scienceResult = await fetchService.fetchAndSaveScienceNews()

        const result = {
            success: true,
            aiSummaryEnabled: !!aiSummaryService,
            technology: {
                fetched: techResult.fetched,
                saved: techResult.saved,
                duplicates: techResult.duplicates,
                summarized: techResult.summarized,
                errors: techResult.errors,
            },
            science: {
                fetched: scienceResult.fetched,
                saved: scienceResult.saved,
                duplicates: scienceResult.duplicates,
                summarized: scienceResult.summarized,
                errors: scienceResult.errors,
            },
            total: {
                fetched: techResult.fetched + scienceResult.fetched,
                saved: techResult.saved + scienceResult.saved,
                duplicates: techResult.duplicates + scienceResult.duplicates,
                summarized: techResult.summarized + scienceResult.summarized,
            },
        }

        return NextResponse.json(result)
    } catch (error) {
        console.error('Error fetching news:', error)
        const message = error instanceof Error ? error.message : 'Unknown error'
        return NextResponse.json(
            { error: `Failed to fetch news: ${message}` },
            { status: 500 }
        )
    }
}
