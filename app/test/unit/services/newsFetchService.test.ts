import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NewsFetchService } from '@/application/services/NewsFetchService'
import { NewsRepository } from '@/infrastructure/repositories/NewsRepository'
import { NewsApiClient, NewsApiArticle } from '@/infrastructure/api/NewsApiClient'
import { createNews } from '@/domain/entities/News'
import { initializeDatabase, closeDatabase, getDatabase } from '@/infrastructure/database/sqlite'
import fs from 'fs'
import path from 'path'

const TEST_DB_PATH = path.join(__dirname, 'test-fetch.db')

describe('NewsFetchService', () => {
    let service: NewsFetchService
    let repository: NewsRepository
    let mockApiClient: {
        fetchTechNews: ReturnType<typeof vi.fn>
        parseArticle: ReturnType<typeof vi.fn>
    }

    beforeEach(() => {
        initializeDatabase(TEST_DB_PATH)
        repository = new NewsRepository(getDatabase())

        // Create mock API client
        mockApiClient = {
            fetchTechNews: vi.fn(),
            parseArticle: vi.fn((article: NewsApiArticle) => ({
                title: article.title,
                url: article.url,
                source: article.source.name,
                publishedAt: new Date(article.publishedAt),
                imageUrl: article.urlToImage || undefined,
            })),
        }

        service = new NewsFetchService(repository, mockApiClient as unknown as NewsApiClient)
    })

    afterEach(() => {
        closeDatabase()
        if (fs.existsSync(TEST_DB_PATH)) {
            fs.unlinkSync(TEST_DB_PATH)
        }
        vi.clearAllMocks()
    })

    describe('fetchAndSaveNews', () => {
        it('should fetch news from API and save to database', async () => {
            const mockArticles: NewsApiArticle[] = [
                {
                    source: { id: 'test', name: 'TechSource' },
                    author: null,
                    title: '기술 뉴스 1',
                    description: '설명 1',
                    url: 'https://example.com/news/1',
                    urlToImage: 'https://example.com/image1.jpg',
                    publishedAt: '2026-01-06T10:00:00Z',
                    content: null,
                },
                {
                    source: { id: 'test2', name: 'ScienceSource' },
                    author: null,
                    title: '과학 뉴스 2',
                    description: '설명 2',
                    url: 'https://example.com/news/2',
                    urlToImage: 'https://example.com/image2.jpg',
                    publishedAt: '2026-01-06T09:00:00Z',
                    content: null,
                },
            ]

            mockApiClient.fetchTechNews.mockResolvedValueOnce(mockArticles)

            const result = await service.fetchAndSaveNews()

            expect(result.fetched).toBe(2)
            expect(result.saved).toBe(2)
            expect(result.duplicates).toBe(0)

            const allNews = repository.findAll()
            expect(allNews).toHaveLength(2)
        })

        it('should skip duplicate news based on URL', async () => {
            // Pre-save a news item
            const existingNews = createNews({
                title: '기존 뉴스',
                url: 'https://example.com/existing',
                source: 'ExistingSource',
                publishedAt: new Date(),
            })
            repository.save(existingNews)

            const mockArticles: NewsApiArticle[] = [
                {
                    source: { id: 'test', name: 'TechSource' },
                    author: null,
                    title: '새 뉴스',
                    description: '설명',
                    url: 'https://example.com/new',
                    urlToImage: null,
                    publishedAt: '2026-01-06T10:00:00Z',
                    content: null,
                },
                {
                    source: { id: 'test', name: 'ExistingSource' },
                    author: null,
                    title: '중복 뉴스 (다른 제목)',
                    description: '설명',
                    url: 'https://example.com/existing', // Same URL as existing
                    urlToImage: null,
                    publishedAt: '2026-01-06T09:00:00Z',
                    content: null,
                },
            ]

            mockApiClient.fetchTechNews.mockResolvedValueOnce(mockArticles)

            const result = await service.fetchAndSaveNews()

            expect(result.fetched).toBe(2)
            expect(result.saved).toBe(1)
            expect(result.duplicates).toBe(1)

            const allNews = repository.findAll()
            expect(allNews).toHaveLength(2) // 1 existing + 1 new
        })

        it('should handle API errors gracefully', async () => {
            mockApiClient.fetchTechNews.mockRejectedValueOnce(new Error('API Error'))

            await expect(service.fetchAndSaveNews()).rejects.toThrow('API Error')
        })

        it('should return empty result when no articles fetched', async () => {
            mockApiClient.fetchTechNews.mockResolvedValueOnce([])

            const result = await service.fetchAndSaveNews()

            expect(result.fetched).toBe(0)
            expect(result.saved).toBe(0)
            expect(result.duplicates).toBe(0)
        })
    })
})
