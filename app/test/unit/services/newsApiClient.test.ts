import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NewsApiClient, NewsApiResponse, NewsApiArticle } from '@/infrastructure/api/NewsApiClient'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('NewsApiClient', () => {
    let client: NewsApiClient

    beforeEach(() => {
        vi.clearAllMocks()
        client = new NewsApiClient('test-api-key')
    })

    describe('fetchTechNews', () => {
        it('should fetch technology news from NewsAPI', async () => {
            const mockResponse: NewsApiResponse = {
                status: 'ok',
                totalResults: 2,
                articles: [
                    {
                        source: { id: 'techcrunch', name: 'TechCrunch' },
                        author: 'John Doe',
                        title: 'New AI Breakthrough',
                        description: 'Scientists announce major AI advancement',
                        url: 'https://techcrunch.com/ai',
                        urlToImage: 'https://techcrunch.com/image.jpg',
                        publishedAt: '2026-01-06T10:00:00Z',
                        content: 'Full article content here...',
                    },
                    {
                        source: { id: null, name: 'TechNews' },
                        author: null,
                        title: 'Quantum Computing Update',
                        description: 'Latest in quantum technology',
                        url: 'https://technews.com/quantum',
                        urlToImage: null,
                        publishedAt: '2026-01-06T09:00:00Z',
                        content: 'Content...',
                    },
                ],
            }

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse,
            })

            const articles = await client.fetchTechNews()

            expect(mockFetch).toHaveBeenCalledTimes(1)
            expect(articles).toHaveLength(2)
            expect(articles[0].title).toBe('New AI Breakthrough')
            expect(articles[1].title).toBe('Quantum Computing Update')
        })

        it('should handle API error response', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 401,
                statusText: 'Unauthorized',
            })

            await expect(client.fetchTechNews()).rejects.toThrow('NewsAPI error: 401 Unauthorized')
        })

        it('should handle network errors', async () => {
            mockFetch.mockRejectedValueOnce(new Error('Network error'))

            await expect(client.fetchTechNews()).rejects.toThrow('Network error')
        })

        it('should filter out articles without title or url', async () => {
            const mockResponse: NewsApiResponse = {
                status: 'ok',
                totalResults: 3,
                articles: [
                    {
                        source: { id: null, name: 'Source1' },
                        author: null,
                        title: 'Valid Article',
                        description: 'Description',
                        url: 'https://example.com/valid',
                        urlToImage: null,
                        publishedAt: '2026-01-06T10:00:00Z',
                        content: 'Content',
                    },
                    {
                        source: { id: null, name: 'Source2' },
                        author: null,
                        title: '[Removed]', // NewsAPI returns this for removed articles
                        description: null,
                        url: 'https://example.com/removed',
                        urlToImage: null,
                        publishedAt: '2026-01-06T09:00:00Z',
                        content: null,
                    },
                    {
                        source: { id: null, name: 'Source3' },
                        author: null,
                        title: '',
                        description: null,
                        url: '',
                        urlToImage: null,
                        publishedAt: '2026-01-06T08:00:00Z',
                        content: null,
                    },
                ],
            }

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse,
            })

            const articles = await client.fetchTechNews()

            expect(articles).toHaveLength(1)
            expect(articles[0].title).toBe('Valid Article')
        })

        it('should respect page and pageSize parameters', async () => {
            const mockResponse: NewsApiResponse = {
                status: 'ok',
                totalResults: 50,
                articles: [],
            }

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse,
            })

            await client.fetchTechNews({ page: 2, pageSize: 20 })

            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('page=2'),
                expect.any(Object)
            )
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('pageSize=20'),
                expect.any(Object)
            )
        })
    })

    describe('parseArticle', () => {
        it('should correctly parse article data', () => {
            const article: NewsApiArticle = {
                source: { id: 'test', name: 'Test Source' },
                author: 'Author Name',
                title: 'Test Title',
                description: 'Test Description',
                url: 'https://example.com/article',
                urlToImage: 'https://example.com/image.jpg',
                publishedAt: '2026-01-06T10:00:00Z',
                content: 'Content...',
            }

            const parsed = client.parseArticle(article)

            expect(parsed.title).toBe('Test Title')
            expect(parsed.url).toBe('https://example.com/article')
            expect(parsed.source).toBe('Test Source')
            expect(parsed.imageUrl).toBe('https://example.com/image.jpg')
            expect(parsed.publishedAt).toBeInstanceOf(Date)
        })
    })
})
