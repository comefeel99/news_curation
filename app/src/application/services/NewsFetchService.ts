import { NewsRepository } from '@/infrastructure/repositories/NewsRepository'
import { NewsApiClient } from '@/infrastructure/api/NewsApiClient'
import { AISummaryService } from '@/application/services/AISummaryService'
import { createNews, validateNews } from '@/domain/entities/News'

/**
 * 뉴스 가져오기 결과 타입
 */
export interface FetchResult {
    fetched: number
    saved: number
    duplicates: number
    summarized: number
    errors: string[]
}

/**
 * 뉴스 수집 서비스
 * NewsAPI에서 뉴스를 가져와 데이터베이스에 저장하고, AI 요약을 생성합니다.
 */
export class NewsFetchService {
    private readonly repository: NewsRepository
    private readonly apiClient: NewsApiClient
    private readonly aiSummaryService: AISummaryService | null

    constructor(
        repository: NewsRepository,
        apiClient: NewsApiClient,
        aiSummaryService: AISummaryService | null = null
    ) {
        this.repository = repository
        this.apiClient = apiClient
        this.aiSummaryService = aiSummaryService
    }

    /**
     * 뉴스 수집 및 저장 (AI 요약 포함)
     * @returns 수집 결과 (가져온 수, 저장된 수, 중복 수, 요약 수, 에러)
     */
    async fetchAndSaveNews(): Promise<FetchResult> {
        const result: FetchResult = {
            fetched: 0,
            saved: 0,
            duplicates: 0,
            summarized: 0,
            errors: [],
        }

        // NewsAPI에서 뉴스 가져오기
        const articles = await this.apiClient.fetchTechNews()
        result.fetched = articles.length

        if (articles.length === 0) {
            return result
        }

        // 각 기사 처리
        for (const article of articles) {
            try {
                const newsInput = this.apiClient.parseArticle(article)

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
                                news.id
                            )
                            if (summary) {
                                this.repository.updateSummary(news.id, summary)
                                result.summarized++
                            }
                        } catch (summaryError) {
                            const msg = summaryError instanceof Error ? summaryError.message : 'Unknown'
                            console.error(`AI 요약 생성 실패 (${news.id}):`, msg)
                            // 요약 실패해도 뉴스 저장은 유지
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
     * 과학 뉴스 수집 및 저장 (AI 요약 포함)
     * @returns 수집 결과
     */
    async fetchAndSaveScienceNews(): Promise<FetchResult> {
        const result: FetchResult = {
            fetched: 0,
            saved: 0,
            duplicates: 0,
            summarized: 0,
            errors: [],
        }

        // NewsAPI에서 과학 뉴스 가져오기
        const articles = await this.apiClient.fetchTechNews({ category: 'science' })
        result.fetched = articles.length

        if (articles.length === 0) {
            return result
        }

        // 각 기사 처리
        for (const article of articles) {
            try {
                const newsInput = this.apiClient.parseArticle(article)

                if (!validateNews(newsInput)) {
                    result.errors.push(`Invalid news data: ${newsInput.title}`)
                    continue
                }

                const news = createNews(newsInput)
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
                                news.id
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
}
