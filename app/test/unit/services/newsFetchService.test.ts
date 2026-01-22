import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NewsFetchService } from '@/application/services/NewsFetchService'
import { NewsRepository } from '@/infrastructure/repositories/NewsRepository'
import { SearchApiClient, SearchResultArticle } from '@/infrastructure/api/SearchApiClient'
import { createNews } from '@/domain/entities/News'
import { Category } from '@/domain/entities/Category'
import { initializeDatabase, closeDatabase, getDatabase } from '@/infrastructure/database/sqlite'
import fs from 'fs'
import path from 'path'

const TEST_DB_PATH = path.join(__dirname, 'test-fetch.db')

describe('NewsFetchService', () => {
    let service: NewsFetchService
    let repository: NewsRepository
    let mockSearchClient: {
        searchNews: ReturnType<typeof vi.fn>
        searchTechNews: ReturnType<typeof vi.fn>
        searchScienceNews: ReturnType<typeof vi.fn>
        parseArticle: ReturnType<typeof vi.fn>
    }

    const testCategory: Category = {
        id: 'test-category',
        name: '테스트',
        searchQuery: '테스트 검색 쿼리',
        isDefault: false,
        createdAt: new Date(),
    }

    beforeEach(() => {
        initializeDatabase(TEST_DB_PATH)
        repository = new NewsRepository(getDatabase())

        // Create mock Search API client
        mockSearchClient = {
            searchNews: vi.fn(),
            searchTechNews: vi.fn(),
            searchScienceNews: vi.fn(),
            parseArticle: vi.fn((article: SearchResultArticle) => ({
                title: article.title,
                url: article.url,
                source: article.source,
                publishedAt: new Date(),
                summary: article.snippet || undefined,
                imageUrl: article.imageUrl || undefined,
            })),
        }

        service = new NewsFetchService(repository, mockSearchClient as unknown as SearchApiClient)
    })

    afterEach(() => {
        closeDatabase()
        if (fs.existsSync(TEST_DB_PATH)) {
            fs.unlinkSync(TEST_DB_PATH)
        }
        vi.clearAllMocks()
    })

    describe('fetchByCategory', () => {
        it('should fetch news from Search API and save to database', async () => {
            const mockArticles: SearchResultArticle[] = [
                {
                    title: '기술 뉴스 1',
                    url: 'https://example.com/news/1',
                    snippet: '설명 1',
                    source: 'TechSource',
                    imageUrl: 'https://example.com/image1.jpg',
                    favicon: null,
                },
                {
                    title: '과학 뉴스 2',
                    url: 'https://example.com/news/2',
                    snippet: '설명 2',
                    source: 'ScienceSource',
                    imageUrl: 'https://example.com/image2.jpg',
                    favicon: null,
                },
            ]

            mockSearchClient.searchNews.mockResolvedValueOnce(mockArticles)

            const result = await service.fetchByCategory(testCategory)

            expect(result.fetched).toBe(2)
            expect(result.saved).toBe(2)
            expect(result.duplicates).toBe(0)
            expect(result.categoryId).toBe(testCategory.id)
            expect(result.categoryName).toBe(testCategory.name)

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

            const mockArticles: SearchResultArticle[] = [
                {
                    title: '새 뉴스',
                    url: 'https://example.com/new',
                    snippet: '설명',
                    source: 'TechSource',
                    imageUrl: null,
                    favicon: null,
                },
                {
                    title: '중복 뉴스 (다른 제목)',
                    url: 'https://example.com/existing', // Same URL as existing
                    snippet: '설명',
                    source: 'ExistingSource',
                    imageUrl: null,
                    favicon: null,
                },
            ]

            mockSearchClient.searchNews.mockResolvedValueOnce(mockArticles)

            const result = await service.fetchByCategory(testCategory)

            expect(result.fetched).toBe(2)
            expect(result.saved).toBe(1)
            expect(result.duplicates).toBe(1)

            const allNews = repository.findAll()
            expect(allNews).toHaveLength(2) // 1 existing + 1 new
        })

        it('should handle API errors gracefully', async () => {
            mockSearchClient.searchNews.mockRejectedValueOnce(new Error('API Error'))

            await expect(service.fetchByCategory(testCategory)).rejects.toThrow('API Error')
        })

        it('should return empty result when no articles fetched', async () => {
            mockSearchClient.searchNews.mockResolvedValueOnce([])

            const result = await service.fetchByCategory(testCategory)

            expect(result.fetched).toBe(0)
            expect(result.saved).toBe(0)
            expect(result.duplicates).toBe(0)
        })
    })

    describe('fetchAllCategories', () => {
        it('should fetch news from multiple categories', async () => {
            const categories: Category[] = [
                { id: 'cat1', name: '카테고리1', searchQuery: '쿼리1', isDefault: true, createdAt: new Date() },
                { id: 'cat2', name: '카테고리2', searchQuery: '쿼리2', isDefault: false, createdAt: new Date() },
            ]

            mockSearchClient.searchNews.mockResolvedValue([
                { title: '뉴스', url: 'https://example.com/1', snippet: '', source: 'Src', imageUrl: null, favicon: null },
            ])

            const results = await service.fetchAllCategories(categories)

            expect(results).toHaveLength(2)
            expect(mockSearchClient.searchNews).toHaveBeenCalledTimes(2)
        })
    })
})

