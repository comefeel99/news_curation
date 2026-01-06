import OpenAI from 'openai'
import { GPTLogger } from '@/infrastructure/logging/GPTLogger'

/**
 * OpenAI 클라이언트 인터페이스 (테스트 용이성을 위해)
 */
export interface OpenAIClient {
    chat: {
        completions: {
            create: (params: unknown) => Promise<{
                choices: Array<{
                    message: {
                        content: string | null
                    }
                }>
                usage?: {
                    prompt_tokens: number
                    completion_tokens: number
                    total_tokens: number
                }
            }>
        }
    }
}

/**
 * AI 요약 서비스
 * OpenAI GPT를 활용하여 뉴스 기사를 요약합니다.
 */
export class AISummaryService {
    private client: OpenAIClient
    private model: string
    private logger: GPTLogger | null

    constructor(
        apiKeyOrClient: string | OpenAIClient,
        model: string = 'gpt-4o-mini',
        logger: GPTLogger | null = null
    ) {
        if (typeof apiKeyOrClient === 'string') {
            this.client = new OpenAI({ apiKey: apiKeyOrClient }) as unknown as OpenAIClient
        } else {
            this.client = apiKeyOrClient
        }
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
        // 내용이 없으면 요약 생성 불가
        if (!content || content.trim() === '') {
            return null
        }

        const prompt = this.buildPrompt(title, content)
        const startTime = Date.now()

        try {
            const response = await this.client.chat.completions.create({
                model: this.model,
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
                max_tokens: 300,
                temperature: 0.3,
            })

            const summary = response.choices[0]?.message?.content
            const durationMs = Date.now() - startTime

            // 로깅
            if (this.logger) {
                this.logger.log({
                    model: this.model,
                    prompt: prompt.substring(0, 1000), // 프롬프트 길이 제한
                    response: summary,
                    tokensInput: response.usage?.prompt_tokens || null,
                    tokensOutput: response.usage?.completion_tokens || null,
                    durationMs,
                    newsId,
                    status: 'success',
                    errorMessage: null,
                })
            }

            return summary || null
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
     * URL과 제목만으로 요약 생성 (내용 없이 제목과 출처 기반)
     * @param title - 뉴스 제목
     * @param url - 뉴스 URL
     * @param source - 뉴스 출처
     * @param newsId - 관련 뉴스 ID (로깅용)
     * @returns 요약 텍스트 또는 null
     */
    async generateSummaryFromUrl(
        title: string,
        url: string,
        source: string,
        newsId: string | null = null
    ): Promise<string | null> {
        const prompt = `다음 뉴스 기사의 제목과 출처를 바탕으로 기사 내용을 추측하여 한국어로 3-4줄로 요약해주세요.

제목: ${title}
출처: ${source}
URL: ${url}

주의사항:
- 제목에서 유추할 수 있는 핵심 내용만 포함
- 추측이 아닌 사실적인 톤 유지
- 독자가 기사의 핵심을 파악할 수 있도록 작성`

        const startTime = Date.now()

        try {
            const response = await this.client.chat.completions.create({
                model: this.model,
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
                max_tokens: 300,
                temperature: 0.3,
            })

            const summary = response.choices[0]?.message?.content
            const durationMs = Date.now() - startTime

            // 로깅
            if (this.logger) {
                this.logger.log({
                    model: this.model,
                    prompt: prompt.substring(0, 1000),
                    response: summary,
                    tokensInput: response.usage?.prompt_tokens || null,
                    tokensOutput: response.usage?.completion_tokens || null,
                    durationMs,
                    newsId,
                    status: 'success',
                    errorMessage: null,
                })
            }

            return summary || null
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
     * @param title - 뉴스 제목
     * @param content - 뉴스 내용
     * @returns 프롬프트 문자열
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
     * @param articles - 요약할 뉴스 배열 [{title, content}]
     * @returns 요약 결과 배열
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
