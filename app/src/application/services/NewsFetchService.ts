import { NewsRepository } from '@/infrastructure/repositories/NewsRepository'
import { SearchApiClient } from '@/infrastructure/api/SearchApiClient'
import { AISummaryService } from '@/application/services/AISummaryService'
import { SystemSettingRepository } from '@/infrastructure/repositories/SystemSettingRepository'
import { createNews, validateNews, CreateNewsInput } from '@/domain/entities/News'
import { Category } from '@/domain/entities/Category'

/**
 * 뉴스 가져오기 결과 타입
 */
export interface FetchResult {
    fetched: number
    saved: number
    duplicates: number
    summarized: number
    errors: string[]
    categoryId?: string
    categoryName?: string
}

/**
 * 뉴스 수집 서비스
 * Search API에서 뉴스를 검색하여 데이터베이스에 저장하고, AI 요약을 생성합니다.
 */
export class NewsFetchService {
    private readonly repository: NewsRepository
    private readonly searchClient: SearchApiClient
    private readonly systemSettingRepository: SystemSettingRepository
    private readonly aiSummaryService: AISummaryService | null

    constructor(
        repository: NewsRepository,
        searchClient: SearchApiClient,
        systemSettingRepository: SystemSettingRepository,
        aiSummaryService: AISummaryService | null = null
    ) {
        this.repository = repository
        this.searchClient = searchClient
        this.systemSettingRepository = systemSettingRepository
        this.aiSummaryService = aiSummaryService
    }

    /**
     * 카테고리별 뉴스 수집 및 저장
     * @param category - 수집할 카테고리
     * @returns 수집 결과
     */
    async fetchByCategory(category: Category): Promise<FetchResult> {
        const result: FetchResult = {
            fetched: 0,
            saved: 0,
            duplicates: 0,
            summarized: 0,
            errors: [],
            categoryId: category.id,
            categoryName: category.name,
        }

        // 시스템 설정 조회
        const recencyFilter = this.systemSettingRepository.get('SEARCH_RECENCY_FILTER') || '1day'
        const newsFilterOffText = this.systemSettingRepository.get('NEWS_FILTER_OFF') || 'true'
        const newsFilterOff = newsFilterOffText === 'true'
        const extensionLimit = this.systemSettingRepository.get('SEARCH_TYPE_EXTENSION_LIMIT') || 'Complex'

        // Search API에서 카테고리 검색 쿼리로 뉴스 검색
        const articles = await this.searchClient.searchNews(
            category.searchQuery,
            {
                recencyFilter,
                newsFilterOff,
                extensionLimit,
            },
            { id: category.id, name: category.name }
        )
        result.fetched = articles.length

        if (articles.length === 0) {
            return result
        }

        // 각 기사 처리
        for (const article of articles) {
            try {
                const baseInput = this.searchClient.parseArticle(article)

                // categoryId 추가
                const newsInput: CreateNewsInput = {
                    ...baseInput,
                    categoryId: category.id,
                }

                // 유효성 검증
                if (!validateNews(newsInput)) {
                    result.errors.push(`Invalid news data: ${newsInput.title}`)
                    continue
                }

                // 뉴스 엔티티 생성
                const news = createNews(newsInput)

                // 저장 (중복 체크 포함)
                const saved = this.repository.save(news)
                if (saved) {
                    result.saved++

                    // AI 요약 생성
                    if (this.aiSummaryService) {
                        try {
                            const summary = await this.aiSummaryService.generateSummaryFromUrl(
                                news.title,
                                news.url,
                                news.source,
                                news.id,
                                article.snippet,
                                undefined
                            )
                            if (summary) {
                                this.repository.updateSummary(news.id, summary)
                                result.summarized++
                            }
                        } catch (summaryError) {
                            const msg = summaryError instanceof Error ? summaryError.message : 'Unknown'
                            console.error(`AI 요약 생성 실패 (${news.id}):`, msg)
                        }
                    }
                } else {
                    result.duplicates++
                }
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Unknown error'
                result.errors.push(`Error processing article: ${message}`)
            }
        }

        return result
    }

    /**
     * 여러 카테고리의 뉴스 일괄 수집
     * @param categories - 수집할 카테고리 배열
     * @returns 카테고리별 수집 결과 배열
     */
    async fetchAllCategories(categories: Category[]): Promise<FetchResult[]> {
        const results: FetchResult[] = []

        for (const category of categories) {
            try {
                const result = await this.fetchByCategory(category)
                results.push(result)
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Unknown error'
                results.push({
                    fetched: 0,
                    saved: 0,
                    duplicates: 0,
                    summarized: 0,
                    errors: [`Category ${category.name} fetch failed: ${message}`],
                    categoryId: category.id,
                    categoryName: category.name,
                })
            }
        }

        return results
    }

    /**
     * 기존 호환성을 위한 기술 뉴스 수집 (deprecated)
     * @deprecated fetchByCategory 사용 권장
     */
    async fetchAndSaveNews(): Promise<FetchResult> {
        const techCategory: Category = {
            id: 'default-tech',
            name: '기술',
            searchQuery: '최신 IT 기술 뉴스 인공지능 AI 소프트웨어 스타트업',
            isDefault: true,
            createdAt: new Date(),
        }
        return this.fetchByCategory(techCategory)
    }

    /**
     * 기존 호환성을 위한 과학 뉴스 수집 (deprecated)
     * @deprecated fetchByCategory 사용 권장
     */
    async fetchAndSaveScienceNews(): Promise<FetchResult> {
        const scienceCategory: Category = {
            id: 'default-science',
            name: '과학',
            searchQuery: '최신 과학 뉴스 연구 발견 우주 바이오 기술',
            isDefault: true,
            createdAt: new Date(),
        }
        return this.fetchByCategory(scienceCategory)
    }

    /**
     * 모든 카테고리 뉴스 수집 및 로깅 실행 (스케줄러용)
     */
    async executeFetchAndLog(
        categoryRepository: { findAll: () => Category[] },
        fetchLogRepository: { save: (log: any) => void }
    ): Promise<void> {
        const startTime = Date.now()

        try {
            const categories = categoryRepository.findAll()
            const results = await this.fetchAllCategories(categories)

            // 결과 집계
            const total = {
                fetched: 0,
                saved: 0,
                duplicates: 0,
                summarized: 0,
            }

            const categoryResults = results.map(result => {
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

            // 성공 로그 저장
            fetchLogRepository.save({
                status: 'success',
                durationMs: Date.now() - startTime,
                totalFetched: total.fetched,
                totalSaved: total.saved,
                totalDuplicates: total.duplicates,
                categoryResults,
            })
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error'
            console.error('Error in executeFetchAndLog:', error)

            // 에러 로그 저장
            fetchLogRepository.save({
                status: 'error',
                durationMs: Date.now() - startTime,
                totalFetched: 0,
                totalSaved: 0,
                totalDuplicates: 0,
                categoryResults: [],
                errorMessage: message,
            })
        }
    }
}

/**
 * NewsFetchService 인스턴스 생성 헬퍼
 */
export function createNewsFetchService(): NewsFetchService {
    const { getDatabase, initializeDatabase, isDatabaseInitialized } = require('@/infrastructure/database/sqlite')
    const { NewsRepository } = require('@/infrastructure/repositories/NewsRepository')
    const { SearchApiClient } = require('@/infrastructure/api/SearchApiClient')
    const { AISummaryService } = require('@/application/services/AISummaryService')
    const { SystemSettingRepository } = require('@/infrastructure/repositories/SystemSettingRepository')
    const { GPTLogger } = require('@/infrastructure/logging/GPTLogger')
    const { SearchApiLogger } = require('@/infrastructure/logging/SearchApiLogger')

    if (!isDatabaseInitialized()) {
        initializeDatabase()
    }
    const db = getDatabase()
    const newsRepository = new NewsRepository(db)
    const systemSettingRepository = new SystemSettingRepository()

    // Search API 설정
    const searchApiUrl = process.env.SEARCH_LLM_URL
    const searchApiKey = process.env.SEARCH_LLM_API_KEY || 'NONE'
    const promptId = process.env.SEARCH_MODEL

    if (!searchApiUrl || !promptId) {
        throw new Error('Search API environment variables are not set')
    }

    const searchApiLogger = new SearchApiLogger()
    const searchClient = new SearchApiClient(searchApiUrl, searchApiKey, promptId, searchApiLogger)

    // AI Summary 서비스
    let aiSummaryService: AISummaryService | null = null
    const summaryUrl = process.env.SUMMARY_LLM_URL
    const summaryKey = process.env.SUMMARY_LLM_API_KEY || 'NONE'
    const summaryModel = process.env.SUMMARY_MODEL
    if (summaryUrl && summaryModel) {
        const gptLogger = new GPTLogger(db)
        aiSummaryService = new AISummaryService(summaryUrl, summaryKey, summaryModel, gptLogger)
    }

    return new NewsFetchService(newsRepository, searchClient, systemSettingRepository, aiSummaryService)
}
