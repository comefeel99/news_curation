import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AISummaryService, OpenAIClient } from '@/application/services/AISummaryService'

describe('AISummaryService', () => {
    let service: AISummaryService
    let mockClient: OpenAIClient

    beforeEach(() => {
        vi.clearAllMocks()

        // Create mock OpenAI client
        mockClient = {
            chat: {
                completions: {
                    create: vi.fn().mockResolvedValue({
                        choices: [
                            {
                                message: {
                                    content: '이것은 테스트 요약입니다.',
                                },
                            },
                        ],
                    }),
                },
            },
        }

        // Inject mock client directly
        service = new AISummaryService(mockClient)
    })

    describe('buildPrompt', () => {
        it('should build a proper prompt for Korean summary', () => {
            const prompt = service.buildPrompt('AI 기술 발전', '상세 내용...')

            expect(prompt).toContain('AI 기술 발전')
            expect(prompt).toContain('한국어')
            expect(prompt).toContain('3-4줄')
        })

        it('should include title and content in prompt', () => {
            const title = '테스트 제목'
            const content = '테스트 내용입니다.'

            const prompt = service.buildPrompt(title, content)

            expect(prompt).toContain(title)
            expect(prompt).toContain(content)
        })
    })

    describe('generateSummary', () => {
        it('should return null for empty content', async () => {
            const summary = await service.generateSummary('Title Only', '')

            expect(summary).toBeNull()
            expect(mockClient.chat.completions.create).not.toHaveBeenCalled()
        })

        it('should return null for whitespace-only content', async () => {
            const summary = await service.generateSummary('Title', '   ')

            expect(summary).toBeNull()
            expect(mockClient.chat.completions.create).not.toHaveBeenCalled()
        })

        it('should call OpenAI API for valid content', async () => {
            const summary = await service.generateSummary(
                'New AI Technology',
                'Scientists announced a breakthrough...'
            )

            expect(summary).toBe('이것은 테스트 요약입니다.')
            expect(mockClient.chat.completions.create).toHaveBeenCalledTimes(1)
        })

        it('should handle API errors', async () => {
            vi.mocked(mockClient.chat.completions.create).mockRejectedValueOnce(
                new Error('OpenAI API Error')
            )

            await expect(
                service.generateSummary('Title', 'Content')
            ).rejects.toThrow('OpenAI API Error')
        })

        it('should handle empty response from API', async () => {
            vi.mocked(mockClient.chat.completions.create).mockResolvedValueOnce({
                choices: [
                    {
                        message: {
                            content: null,
                        },
                    },
                ],
            })

            const summary = await service.generateSummary('Title', 'Content')

            expect(summary).toBeNull()
        })
    })

    describe('generateSummaryFromUrl', () => {
        it('should generate summary from title and source', async () => {
            const summary = await service.generateSummaryFromUrl(
                '새로운 기술 발표',
                'https://example.com/news',
                'TechNews'
            )

            expect(summary).toBe('이것은 테스트 요약입니다.')
            expect(mockClient.chat.completions.create).toHaveBeenCalledTimes(1)
        })
    })

    describe('generateBatchSummaries', () => {
        it('should generate summaries for multiple articles', async () => {
            const articles = [
                { id: '1', title: '기사 1', content: '내용 1' },
                { id: '2', title: '기사 2', content: '내용 2' },
            ]

            const results = await service.generateBatchSummaries(articles)

            expect(results).toHaveLength(2)
            expect(results[0].id).toBe('1')
            expect(results[0].summary).toBe('이것은 테스트 요약입니다.')
            expect(results[1].id).toBe('2')
        })

        it('should handle errors for individual articles', async () => {
            vi.mocked(mockClient.chat.completions.create)
                .mockResolvedValueOnce({
                    choices: [{ message: { content: '성공' } }],
                })
                .mockRejectedValueOnce(new Error('API Error'))

            const articles = [
                { id: '1', title: '기사 1', content: '내용 1' },
                { id: '2', title: '기사 2', content: '내용 2' },
            ]

            const results = await service.generateBatchSummaries(articles)

            expect(results).toHaveLength(2)
            expect(results[0].summary).toBe('성공')
            expect(results[1].summary).toBeNull()
        })
    })
})
