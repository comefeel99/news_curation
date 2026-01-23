import { GPTLogger } from '@/infrastructure/logging/GPTLogger'

/**
 * Chat Completions API 응답 타입
 */
interface ChatCompletionResponse {
    state: number
    res: {
        choices: Array<{
            message: {
                content: string
            }
        }>
        usage?: {
            prompt_tokens: number
            completion_tokens: number
            total_tokens: number
        }
    }
}

/**
 * AI 요약 서비스
 * Chat Completions API를 활용하여 뉴스 기사를 요약합니다.
 * SearchApiClient와 동일하게 직접 fetch를 사용합니다.
 */
export class AISummaryService {
    private readonly apiUrl: string
    private readonly apiKey: string
    private readonly model: string
    private readonly logger: GPTLogger | null

    constructor(
        apiUrl: string,
        apiKey: string,
        model: string,
        logger: GPTLogger | null = null
    ) {
        this.apiUrl = apiUrl
        this.apiKey = apiKey
        this.model = model
        this.logger = logger
    }

    /**
     * 뉴스 제목과 내용을 기반으로 요약 생성
     * @param title - 뉴스 제목
     * @param content - 뉴스 내용
     * @param newsId - 관련 뉴스 ID (로깅용)
     * @returns 요약 텍스트 또는 null
     */
    async generateSummary(
        title: string,
        content: string,
        newsId: string | null = null
    ): Promise<string | null> {
        if (!content || content.trim() === '') {
            return null
        }

        const prompt = this.buildPrompt(title, content)
        return this.callApi(prompt, newsId)
    }

    /**
     * URL과 제목, snippet, description으로 요약 생성
     * @param title - 뉴스 제목
     * @param url - 뉴스 URL
     * @param source - 뉴스 출처
     * @param newsId - 관련 뉴스 ID (로깅용)
     * @param snippet - 검색 결과 snippet (선택)
     * @param description - OG description (선택)
     * @returns 요약 텍스트 또는 null
     */
    async generateSummaryFromUrl(
        title: string,
        url: string,
        source: string,
        newsId: string | null = null,
        snippet?: string,
        description?: string
    ): Promise<string | null> {
        // snippet과 description 정보 구성
        let contentInfo = ''
        if (snippet) {
            contentInfo += `\n발췌: ${snippet}`
        }
        if (description && description !== snippet) {
            contentInfo += `\n설명: ${description}`
        }

        const prompt = `다음 뉴스 기사 정보를 바탕으로 한국어로 3-4줄로 요약해주세요.

제목: ${title}
출처: ${source}
URL: ${url}${contentInfo}

주의사항:
- 제공된 정보를 바탕으로 핵심 내용을 요약
- 객관적이고 사실적인 톤 유지
- 출처, URL, 날짜 등 메타정보는 요약에 포함하지 마세요
- 독자가 기사의 핵심을 빠르게 파악할 수 있도록 작성`

        return this.callApi(prompt, newsId)
    }

    /**
     * API 호출 공통 메서드
     */
    private async callApi(prompt: string, newsId: string | null): Promise<string | null> {
        const startTime = Date.now()

        const requestBody = {
            is_production: false,
            prompt_id: parseInt(this.model, 10),
            messages: [
                {
                    role: 'system',
                    content: '당신은 뉴스 기사를 간결하고 명확하게 요약하는 전문가입니다. 항상 한국어로 응답합니다.',
                },
                {
                    role: 'user',
                    content: prompt,
                },
            ],
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
                throw new Error(`Summary API error: ${response.status} ${response.statusText} - ${errorText}`)
            }

            const data: ChatCompletionResponse = await response.json()

            // 응답 상태 확인
            if (data.state !== 200) {
                throw new Error(`Summary API returned error state: ${data.state}`)
            }

            const summary = data.res?.choices?.[0]?.message?.content || null
            const durationMs = Date.now() - startTime

            // 성공 로깅
            if (this.logger) {
                this.logger.log({
                    model: this.model,
                    prompt: prompt.substring(0, 1000),
                    response: summary,
                    tokensInput: data.res?.usage?.prompt_tokens || null,
                    tokensOutput: data.res?.usage?.completion_tokens || null,
                    durationMs,
                    newsId,
                    status: 'success',
                    errorMessage: null,
                })
            }

            return summary
        } catch (error) {
            const durationMs = Date.now() - startTime
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'

            // 에러 로깅
            if (this.logger) {
                this.logger.log({
                    model: this.model,
                    prompt: prompt.substring(0, 1000),
                    response: null,
                    tokensInput: null,
                    tokensOutput: null,
                    durationMs,
                    newsId,
                    status: 'error',
                    errorMessage,
                })
            }

            throw error
        }
    }

    /**
     * 요약 프롬프트 생성
     */
    buildPrompt(title: string, content: string): string {
        return `다음 뉴스 기사를 한국어로 3-4줄로 요약해주세요.

제목: ${title}

내용:
${content}

요약 조건:
- 핵심 정보만 포함
- 객관적인 톤 유지
- 독자가 기사의 핵심을 빠르게 파악할 수 있도록 작성
- 3-4줄 이내로 작성`
    }

    /**
     * 여러 뉴스 기사 배치 요약
     */
    async generateBatchSummaries(
        articles: Array<{ id: string; title: string; content?: string }>
    ): Promise<Array<{ id: string; summary: string | null }>> {
        const results: Array<{ id: string; summary: string | null }> = []

        for (const article of articles) {
            try {
                const summary = article.content
                    ? await this.generateSummary(article.title, article.content, article.id)
                    : await this.generateSummaryFromUrl(article.title, '', '', article.id)

                results.push({ id: article.id, summary })
            } catch (error) {
                console.error(`Error generating summary for ${article.id}:`, error)
                results.push({ id: article.id, summary: null })
            }
        }

        return results
    }
}
