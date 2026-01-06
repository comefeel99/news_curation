import { CreateNewsInput } from '@/domain/entities/News'

/**
 * NewsAPI 응답 타입
 */
export interface NewsApiResponse {
    status: string
    totalResults: number
    articles: NewsApiArticle[]
}

/**
 * NewsAPI 기사 타입
 */
export interface NewsApiArticle {
    source: {
        id: string | null
        name: string
    }
    author: string | null
    title: string
    description: string | null
    url: string
    urlToImage: string | null
    publishedAt: string
    content: string | null
}

/**
 * NewsAPI 요청 옵션
 */
export interface FetchOptions {
    page?: number
    pageSize?: number
    language?: string
    category?: string
}

/**
 * NewsAPI 클라이언트
 * NewsAPI.org에서 뉴스를 가져오는 클라이언트
 */
export class NewsApiClient {
    private readonly apiKey: string
    private readonly baseUrl = 'https://newsapi.org/v2'

    constructor(apiKey: string) {
        this.apiKey = apiKey
    }

    /**
     * 기술/과학 뉴스 가져오기
     * @param options - 요청 옵션 (page, pageSize 등)
     * @returns 뉴스 기사 배열
     */
    async fetchTechNews(options: FetchOptions = {}): Promise<NewsApiArticle[]> {
        const {
            page = 1,
            pageSize = 20,
            language = 'ko',
            category = 'technology',
        } = options

        const params = new URLSearchParams({
            apiKey: this.apiKey,
            country: 'us',  // 미국 뉴스 (무료 플랜에서 더 많은 결과)
            category,
            page: String(page),
            pageSize: String(pageSize),
        })

        // 한국어 뉴스가 적을 경우 영어도 함께 가져오기 위해 country 대신 language 사용
        // 하지만 category와 함께 사용하려면 top-headlines 엔드포인트 사용
        const url = `${this.baseUrl}/top-headlines?${params.toString()}`

        const response = await fetch(url, {
            headers: {
                'X-Api-Key': this.apiKey,
            },
        })

        if (!response.ok) {
            throw new Error(`NewsAPI error: ${response.status} ${response.statusText}`)
        }

        const data: NewsApiResponse = await response.json()

        // 유효하지 않은 기사 필터링
        return data.articles.filter((article) => {
            // 제목이 없거나 [Removed]인 경우 제외
            if (!article.title || article.title === '[Removed]' || article.title.trim() === '') {
                return false
            }
            // URL이 없는 경우 제외
            if (!article.url || article.url.trim() === '') {
                return false
            }
            return true
        })
    }

    /**
     * NewsAPI 기사를 CreateNewsInput 형식으로 변환
     * @param article - NewsAPI 기사
     * @returns CreateNewsInput 형식의 데이터
     */
    parseArticle(article: NewsApiArticle): CreateNewsInput {
        return {
            title: article.title,
            url: article.url,
            source: article.source.name,
            publishedAt: new Date(article.publishedAt),
            imageUrl: article.urlToImage || undefined,
        }
    }
}
