import { CreateNewsInput } from '@/domain/entities/News'
import { SearchApiLogger } from '../logging/SearchApiLogger'

/**
 * Search API 요청 메시지 타입
 */
export interface SearchApiMessage {
    role: 'system' | 'user' | 'assistant'
    content: string
}

/**
 * Search API 모델 확장 설정
 */
export interface SearchModelExtensions {
    service_type: 'PAAS'
    return_citations: boolean
    return_images: boolean
    return_related_questions: boolean
    search_type_extension_limit: string
    search_domain_filter: string[]
    search_recency_filter: 'day' | 'week' | 'month'
}

/**
 * Search API 요청 타입
 */
export interface SearchApiRequest {
    is_production: boolean
    prompt_id: number
    messages: SearchApiMessage[]
    model_extensions: SearchModelExtensions
}

/**
 * PaaS Citation 상세 정보
 */
export interface PaasCitation {
    title: string
    url: string
    snippet: string
    type: string
    image: string | null
    site_name: string
    og_tags?: {
        title?: string
        site_name?: string | null
        image?: string
        description?: string
        url?: string
        type?: string
    }
    favicon?: string
    is_visible: boolean
    ci: unknown | null
}

/**
 * Search API 응답 타입
 */
export interface SearchApiResponse {
    state: number
    res: {
        transaction_id: string
        model: string
        usage: {
            prompt_tokens: number
            completion_tokens: number
            total_tokens: number
        }
        choices: Array<{
            index: number
            finish_reason: string
            message: {
                content: string
                role: string
            }
        }>
        system_fingerprint: string
        id: string
        created: number
        object: string
        model_extensions: {
            images: unknown[]
            citations: string[]
            related_questions: unknown[]
            stock_disclaimer: boolean
            paas_citations: PaasCitation[]
        }
    }
}

/**
 * 검색 옵션
 */
export interface SearchOptions {
    recencyFilter?: 'day' | 'week' | 'month'
    domainFilter?: string[]
    isProduction?: boolean
}

/**
 * 카테고리 정보 (로깅용)
 */
export interface CategoryInfo {
    id?: string
    name?: string
}

/**
 * 검색 결과 기사 타입
 */
export interface SearchResultArticle {
    title: string
    url: string
    snippet: string
    source: string
    imageUrl: string | null
    favicon: string | null
}

/**
 * Search API 클라이언트
 * Chat Completions 형태의 PET Search API를 사용하여 뉴스를 검색합니다.
 */
export class SearchApiClient {
    private readonly apiUrl: string
    private readonly apiKey: string
    private readonly promptId: number
    private readonly logger?: SearchApiLogger

    private readonly DEFAULT_SYSTEM_PROMPT =
        '당신은 전문 뉴스 리서치 및 요약 담당 에이전트입니다. 아래의 정보를 바탕으로 **최신성, 정확성, 맥락성**을 갖춘 뉴스 자료를 수집하고, 이를 명확하고 간결하게 요약해주세요.'

    constructor(apiUrl: string, apiKey: string, promptId: string | number, logger?: SearchApiLogger) {
        this.apiUrl = apiUrl
        this.apiKey = apiKey
        this.promptId = typeof promptId === 'string' ? parseInt(promptId, 10) : promptId
        this.logger = logger
    }

    /**
     * 뉴스 검색 수행
     * @param query - 검색 쿼리 (예: "최신 기술 뉴스 AI 인공지능")
     * @param options - 검색 옵션
     * @param categoryInfo - 카테고리 정보 (로깅용)
     * @returns 검색 결과 기사 배열
     */
    async searchNews(query: string, options: SearchOptions = {}, categoryInfo?: CategoryInfo): Promise<SearchResultArticle[]> {
        const startTime = Date.now()
        const {
            recencyFilter = 'week',
            domainFilter = [],
            isProduction = false,
        } = options

        const requestBody: SearchApiRequest = {
            is_production: isProduction,
            prompt_id: this.promptId,
            messages: [
                {
                    role: 'system',
                    content: this.DEFAULT_SYSTEM_PROMPT,
                },
                {
                    role: 'user',
                    content: query,
                },
            ],
            model_extensions: {
                service_type: 'PAAS',
                return_citations: true,
                return_images: false,
                return_related_questions: false,
                search_type_extension_limit: 'Complex',
                search_domain_filter: domainFilter,
                search_recency_filter: recencyFilter,
            },
        }

        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(this.apiKey && this.apiKey !== 'NONE' ? { 'Authorization': `Bearer ${this.apiKey}` } : {}),
                },
                body: JSON.stringify(requestBody),
            })

            if (!response.ok) {
                const errorText = await response.text()
                const error = new Error(`Search API error: ${response.status} ${response.statusText} - ${errorText}`)

                // 에러 로깅
                if (this.logger) {
                    this.logger.save({
                        categoryId: categoryInfo?.id,
                        categoryName: categoryInfo?.name,
                        searchQuery: query,
                        status: 'error',
                        durationMs: Date.now() - startTime,
                        resultCount: 0,
                        requestBody: JSON.stringify(requestBody),
                        errorMessage: error.message,
                    })
                }
                throw error
            }

            const data: SearchApiResponse = await response.json()

            // 응답 상태 확인
            if (data.state !== 200) {
                const error = new Error(`Search API returned error state: ${data.state}`)

                // 에러 로깅
                if (this.logger) {
                    this.logger.save({
                        categoryId: categoryInfo?.id,
                        categoryName: categoryInfo?.name,
                        searchQuery: query,
                        status: 'error',
                        durationMs: Date.now() - startTime,
                        resultCount: 0,
                        requestBody: JSON.stringify(requestBody),
                        responseBody: JSON.stringify(data),
                        errorMessage: error.message,
                    })
                }
                throw error
            }

            // paas_citations에서 기사 정보 추출
            const results = this.parseCitations(data.res.model_extensions.paas_citations)

            // 성공 로깅
            if (this.logger) {
                this.logger.save({
                    categoryId: categoryInfo?.id,
                    categoryName: categoryInfo?.name,
                    searchQuery: query,
                    status: 'success',
                    durationMs: Date.now() - startTime,
                    resultCount: results.length,
                    tokensPrompt: data.res.usage.prompt_tokens,
                    tokensCompletion: data.res.usage.completion_tokens,
                    requestBody: JSON.stringify(requestBody),
                    responseBody: JSON.stringify(data),
                })
            }

            return results
        } catch (error) {
            // 네트워크 에러 등 예외 처리
            if (this.logger && !(error instanceof Error && error.message.includes('Search API'))) {
                this.logger.save({
                    categoryId: categoryInfo?.id,
                    categoryName: categoryInfo?.name,
                    searchQuery: query,
                    status: 'error',
                    durationMs: Date.now() - startTime,
                    resultCount: 0,
                    requestBody: JSON.stringify(requestBody),
                    errorMessage: error instanceof Error ? error.message : String(error),
                })
            }
            throw error
        }
    }

    /**
     * 기술 뉴스 검색
     * @param options - 검색 옵션
     * @returns 기술 관련 뉴스 기사 배열
     */
    async searchTechNews(options: SearchOptions = {}): Promise<SearchResultArticle[]> {
        const query = '최신 IT 기술 뉴스 인공지능 AI 소프트웨어 스타트업'
        return this.searchNews(query, options)
    }

    /**
     * 과학 뉴스 검색
     * @param options - 검색 옵션
     * @returns 과학 관련 뉴스 기사 배열
     */
    async searchScienceNews(options: SearchOptions = {}): Promise<SearchResultArticle[]> {
        const query = '최신 과학 뉴스 연구 발견 우주 바이오 기술'
        return this.searchNews(query, options)
    }

    /**
     * PaaS Citations를 SearchResultArticle로 변환
     * @param citations - paas_citations 배열
     * @returns 변환된 기사 배열
     */
    private parseCitations(citations: PaasCitation[]): SearchResultArticle[] {
        if (!citations || citations.length === 0) {
            return []
        }

        return citations
            .filter(citation => citation.is_visible && citation.title && citation.url)
            .map(citation => ({
                title: citation.title,
                url: citation.url,
                snippet: citation.snippet || citation.og_tags?.description || '',
                source: citation.site_name || this.extractDomain(citation.url),
                imageUrl: citation.image || citation.og_tags?.image || null,
                favicon: citation.favicon || null,
            }))
    }

    /**
     * URL에서 도메인 추출
     * @param url - 원본 URL
     * @returns 도메인 문자열
     */
    private extractDomain(url: string): string {
        try {
            const urlObj = new URL(url)
            return urlObj.hostname.replace('www.', '')
        } catch {
            return 'Unknown'
        }
    }

    /**
     * SearchResultArticle을 CreateNewsInput 형식으로 변환
     * @param article - 검색 결과 기사
     * @returns CreateNewsInput 형식의 데이터
     */
    parseArticle(article: SearchResultArticle): CreateNewsInput {
        return {
            title: article.title,
            url: article.url,
            source: article.source,
            publishedAt: new Date(), // Search API에서 발행일 미제공, 현재 시간 사용
            summary: article.snippet || undefined,
            imageUrl: article.imageUrl || undefined,
        }
    }
}
