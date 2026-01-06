import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { NewsRepository } from '@/infrastructure/repositories/NewsRepository'
import { createNews, News } from '@/domain/entities/News'
import { initializeDatabase, closeDatabase, getDatabase } from '@/infrastructure/database/sqlite'
import fs from 'fs'
import path from 'path'

const TEST_DB_PATH = path.join(__dirname, 'test-news.db')

describe('NewsRepository', () => {
    let repository: NewsRepository

    beforeEach(() => {
        // Initialize test database
        initializeDatabase(TEST_DB_PATH)
        repository = new NewsRepository(getDatabase())
    })

    afterEach(() => {
        // Cleanup test database
        closeDatabase()
        if (fs.existsSync(TEST_DB_PATH)) {
            fs.unlinkSync(TEST_DB_PATH)
        }
    })

    describe('save', () => {
        it('should save a news entity to the database', () => {
            const news = createNews({
                title: '테스트 뉴스 제목',
                url: 'https://example.com/news/1',
                source: 'TestSource',
                publishedAt: new Date('2026-01-06T10:00:00Z'),
                summary: '테스트 요약입니다.',
                imageUrl: 'https://example.com/image.jpg',
            })

            const saved = repository.save(news)

            expect(saved).not.toBeNull()
            expect(saved!.id).toBe(news.id)
            expect(saved!.title).toBe(news.title)
        })

        it('should not save duplicate news with same URL', () => {
            const news1 = createNews({
                title: '첫 번째 뉴스',
                url: 'https://example.com/same-url',
                source: 'Source1',
                publishedAt: new Date(),
            })

            const news2 = createNews({
                title: '두 번째 뉴스',
                url: 'https://example.com/same-url',
                source: 'Source2',
                publishedAt: new Date(),
            })

            repository.save(news1)
            const saved2 = repository.save(news2)

            // Should return null or throw error for duplicate
            expect(saved2).toBeNull()
        })
    })

    describe('findAll', () => {
        it('should return all news sorted by publishedAt descending', () => {
            const news1 = createNews({
                title: '오래된 뉴스',
                url: 'https://example.com/old',
                source: 'Source',
                publishedAt: new Date('2026-01-01T10:00:00Z'),
            })

            const news2 = createNews({
                title: '최신 뉴스',
                url: 'https://example.com/new',
                source: 'Source',
                publishedAt: new Date('2026-01-06T10:00:00Z'),
            })

            repository.save(news1)
            repository.save(news2)

            const allNews = repository.findAll()

            expect(allNews).toHaveLength(2)
            expect(allNews[0].title).toBe('최신 뉴스')
            expect(allNews[1].title).toBe('오래된 뉴스')
        })

        it('should return empty array when no news exists', () => {
            const allNews = repository.findAll()

            expect(allNews).toEqual([])
        })
    })

    describe('findAllPaginated', () => {
        it('should return paginated news', () => {
            // Create 15 news items
            for (let i = 0; i < 15; i++) {
                const news = createNews({
                    title: `뉴스 ${i + 1}`,
                    url: `https://example.com/news/${i + 1}`,
                    source: 'Source',
                    publishedAt: new Date(Date.now() - i * 1000 * 60), // Each 1 minute older
                })
                repository.save(news)
            }

            const page1 = repository.findAllPaginated(1, 10)
            const page2 = repository.findAllPaginated(2, 10)

            expect(page1.data).toHaveLength(10)
            expect(page1.total).toBe(15)
            expect(page1.page).toBe(1)
            expect(page1.limit).toBe(10)
            expect(page1.hasMore).toBe(true)

            expect(page2.data).toHaveLength(5)
            expect(page2.hasMore).toBe(false)
        })
    })

    describe('findById', () => {
        it('should return news by id', () => {
            const news = createNews({
                title: '찾을 뉴스',
                url: 'https://example.com/find',
                source: 'Source',
                publishedAt: new Date(),
            })

            repository.save(news)

            const found = repository.findById(news.id)

            expect(found).toBeDefined()
            expect(found?.id).toBe(news.id)
            expect(found?.title).toBe(news.title)
        })

        it('should return null when news not found', () => {
            const found = repository.findById('non-existent-id')

            expect(found).toBeNull()
        })
    })

    describe('findByUrl', () => {
        it('should return news by url', () => {
            const news = createNews({
                title: 'URL로 찾을 뉴스',
                url: 'https://example.com/specific-url',
                source: 'Source',
                publishedAt: new Date(),
            })

            repository.save(news)

            const found = repository.findByUrl('https://example.com/specific-url')

            expect(found).toBeDefined()
            expect(found?.url).toBe(news.url)
        })
    })

    describe('updateSummary', () => {
        it('should update the summary of a news', () => {
            const news = createNews({
                title: '요약 업데이트 테스트',
                url: 'https://example.com/summary',
                source: 'Source',
                publishedAt: new Date(),
            })

            repository.save(news)

            const updated = repository.updateSummary(news.id, 'AI가 생성한 새로운 요약입니다.')

            expect(updated).toBe(true)

            const found = repository.findById(news.id)
            expect(found?.summary).toBe('AI가 생성한 새로운 요약입니다.')
        })
    })
})
