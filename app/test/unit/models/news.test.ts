import { describe, it, expect } from 'vitest'
import { News, createNews, validateNews } from '@/domain/entities/News'

describe('News Entity', () => {
    describe('createNews', () => {
        it('should create a news entity with all required fields', () => {
            const newsData = {
                title: '새로운 AI 기술 발표',
                url: 'https://example.com/news/1',
                source: 'TechNews',
                publishedAt: new Date('2026-01-06T10:00:00Z'),
            }

            const news = createNews(newsData)

            expect(news.id).toBeDefined()
            expect(news.title).toBe(newsData.title)
            expect(news.url).toBe(newsData.url)
            expect(news.source).toBe(newsData.source)
            expect(news.publishedAt).toEqual(newsData.publishedAt)
            expect(news.createdAt).toBeInstanceOf(Date)
        })

        it('should create a news entity with optional fields', () => {
            const newsData = {
                title: '새로운 AI 기술 발표',
                url: 'https://example.com/news/1',
                source: 'TechNews',
                publishedAt: new Date('2026-01-06T10:00:00Z'),
                summary: 'AI 기술이 크게 발전했습니다.',
                imageUrl: 'https://example.com/image.jpg',
            }

            const news = createNews(newsData)

            expect(news.summary).toBe(newsData.summary)
            expect(news.imageUrl).toBe(newsData.imageUrl)
        })

        it('should generate unique IDs for each news entity', () => {
            const newsData = {
                title: '테스트 뉴스',
                url: 'https://example.com/news/1',
                source: 'TestSource',
                publishedAt: new Date(),
            }

            const news1 = createNews(newsData)
            const news2 = createNews({ ...newsData, url: 'https://example.com/news/2' })

            expect(news1.id).not.toBe(news2.id)
        })
    })

    describe('validateNews', () => {
        it('should return true for valid news data', () => {
            const newsData = {
                title: '유효한 뉴스',
                url: 'https://example.com/news',
                source: 'ValidSource',
                publishedAt: new Date(),
            }

            expect(validateNews(newsData)).toBe(true)
        })

        it('should return false when title is empty', () => {
            const newsData = {
                title: '',
                url: 'https://example.com/news',
                source: 'ValidSource',
                publishedAt: new Date(),
            }

            expect(validateNews(newsData)).toBe(false)
        })

        it('should return false when url is empty', () => {
            const newsData = {
                title: '유효한 제목',
                url: '',
                source: 'ValidSource',
                publishedAt: new Date(),
            }

            expect(validateNews(newsData)).toBe(false)
        })

        it('should return false when source is empty', () => {
            const newsData = {
                title: '유효한 제목',
                url: 'https://example.com/news',
                source: '',
                publishedAt: new Date(),
            }

            expect(validateNews(newsData)).toBe(false)
        })

        it('should return false when url is not a valid URL format', () => {
            const newsData = {
                title: '유효한 제목',
                url: 'not-a-url',
                source: 'ValidSource',
                publishedAt: new Date(),
            }

            expect(validateNews(newsData)).toBe(false)
        })
    })
})
