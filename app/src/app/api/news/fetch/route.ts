import { NextResponse } from 'next/server'
import { SearchApiClient } from '@/infrastructure/api/SearchApiClient'
import { NewsRepository } from '@/infrastructure/repositories/NewsRepository'
import { CategoryRepository } from '@/infrastructure/repositories/CategoryRepository'
import { FetchLogRepository, CategoryFetchResult } from '@/infrastructure/repositories/FetchLogRepository'
import { NewsFetchService } from '@/application/services/NewsFetchService'
import { AISummaryService } from '@/application/services/AISummaryService'
import { GPTLogger } from '@/infrastructure/logging/GPTLogger'
import { SearchApiLogger } from '@/infrastructure/logging/SearchApiLogger'
import { initializeDatabase, getDatabase, isDatabaseInitialized } from '@/infrastructure/database/sqlite'

/**
 * POST /api/news/fetch
 * 뉴스 수집 API - 모든 카테고리에서 뉴스를 검색하여 데이터베이스에 저장
 */
export async function POST() {
    const startTime = Date.now()

    // 데이터베이스 초기화
    if (!isDatabaseInitialized()) {
        initializeDatabase()
    }
    const db = getDatabase()
    const fetchLogRepository = new FetchLogRepository(db)

    try {
        // Search API 설정 확인
        const searchApiUrl = process.env.SEARCH_LLM_URL
        const searchApiKey = process.env.SEARCH_LLM_API_KEY || 'NONE'
        const promptId = process.env.SEARCH_MODEL

        if (!searchApiUrl || !promptId) {
            // 설정 오류 로그
            fetchLogRepository.save({
                status: 'error',
                durationMs: Date.now() - startTime,
                totalFetched: 0,
                totalSaved: 0,
                totalDuplicates: 0,
                categoryResults: [],
                errorMessage: 'SEARCH_LLM_URL and SEARCH_MODEL environment variables are required',
            })

            return NextResponse.json(
                { error: 'SEARCH_LLM_URL and SEARCH_MODEL environment variables are required' },
                { status: 500 }
            )
        }

        // 저장소 및 서비스 인스턴스 생성
        const searchApiLogger = new SearchApiLogger()
        const searchClient = new SearchApiClient(searchApiUrl, searchApiKey, promptId, searchApiLogger)
        const newsRepository = new NewsRepository(db)
        const categoryRepository = new CategoryRepository(db)

        // AI 요약 서비스 생성 (Summary LLM 설정이 있는 경우에만)
        let aiSummaryService: AISummaryService | null = null
        const summaryUrl = process.env.SUMMARY_LLM_URL
        const summaryKey = process.env.SUMMARY_LLM_API_KEY || 'NONE'
        const summaryModel = process.env.SUMMARY_MODEL
        if (summaryUrl && summaryModel) {
            const gptLogger = new GPTLogger(db)
            aiSummaryService = new AISummaryService(summaryUrl, summaryKey, summaryModel, gptLogger)
        }

        const fetchService = new NewsFetchService(newsRepository, searchClient, aiSummaryService)

        // 모든 카테고리 조회
        const categories = categoryRepository.findAll()

        // 모든 카테고리에서 뉴스 수집
        const results = await fetchService.fetchAllCategories(categories)

        // 결과 집계
        const total = {
            fetched: 0,
            saved: 0,
            duplicates: 0,
            summarized: 0,
        }

        const categoryResults: CategoryFetchResult[] = results.map(result => {
            total.fetched += result.fetched
            total.saved += result.saved
            total.duplicates += result.duplicates
            total.summarized += result.summarized

            return {
                categoryId: result.categoryId || '',
                categoryName: result.categoryName || '',
                fetched: result.fetched,
                saved: result.saved,
                duplicates: result.duplicates,
                errors: result.errors,
            }
        })

        const durationMs = Date.now() - startTime

        // 성공 로그 저장
        fetchLogRepository.save({
            status: 'success',
            durationMs,
            totalFetched: total.fetched,
            totalSaved: total.saved,
            totalDuplicates: total.duplicates,
            categoryResults,
        })

        return NextResponse.json({
            success: true,
            aiSummaryEnabled: !!aiSummaryService,
            categories: categoryResults,
            total,
            durationMs,
        })
    } catch (error) {
        const durationMs = Date.now() - startTime
        const message = error instanceof Error ? error.message : 'Unknown error'
        console.error('Error fetching news:', error)

        // 에러 로그 저장
        fetchLogRepository.save({
            status: 'error',
            durationMs,
            totalFetched: 0,
            totalSaved: 0,
            totalDuplicates: 0,
            categoryResults: [],
            errorMessage: message,
        })

        return NextResponse.json(
            { error: `Failed to fetch news: ${message}` },
            { status: 500 }
        )
    }
}
