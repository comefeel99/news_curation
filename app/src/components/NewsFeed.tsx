'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { News } from '@/domain/entities/News'
import NewsCard from './NewsCard'
import styles from './NewsFeed.module.css'

interface PaginationInfo {
    page: number
    limit: number
    total: number
    hasMore: boolean
    totalPages: number
}

interface NewsResponse {
    success: boolean
    data: News[]
    pagination: PaginationInfo
}

/**
 * 뉴스 피드 컴포넌트
 * 무한 스크롤을 지원하는 뉴스 목록을 표시합니다.
 */
export default function NewsFeed() {
    const [news, setNews] = useState<News[]>([])
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(true)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isInitialLoad, setIsInitialLoad] = useState(true)

    const observerRef = useRef<IntersectionObserver | null>(null)
    const loadMoreRef = useRef<HTMLDivElement | null>(null)

    // 뉴스 가져오기
    const fetchNews = useCallback(async (pageNum: number) => {
        if (isLoading) return

        setIsLoading(true)
        setError(null)

        try {
            const response = await fetch(`/api/news?page=${pageNum}&limit=10`)

            if (!response.ok) {
                throw new Error('뉴스를 불러오는데 실패했습니다.')
            }

            const data: NewsResponse = await response.json()

            if (data.success) {
                setNews(prev => pageNum === 1 ? data.data : [...prev, ...data.data])
                setHasMore(data.pagination.hasMore)
                setPage(pageNum)
            } else {
                throw new Error('뉴스 데이터를 가져올 수 없습니다.')
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.'
            setError(message)
        } finally {
            setIsLoading(false)
            setIsInitialLoad(false)
        }
    }, [isLoading])

    // 초기 로드
    useEffect(() => {
        fetchNews(1)
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    // 무한 스크롤 설정
    useEffect(() => {
        if (!loadMoreRef.current || !hasMore) return

        observerRef.current = new IntersectionObserver(
            (entries) => {
                const target = entries[0]
                if (target.isIntersecting && hasMore && !isLoading) {
                    fetchNews(page + 1)
                }
            },
            {
                threshold: 0.1,
                rootMargin: '100px',
            }
        )

        observerRef.current.observe(loadMoreRef.current)

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect()
            }
        }
    }, [hasMore, isLoading, page, fetchNews])

    // 새로고침
    const handleRefresh = () => {
        setNews([])
        setPage(1)
        setHasMore(true)
        setIsInitialLoad(true)
        fetchNews(1)
    }

    // 초기 로딩 스켈레톤
    if (isInitialLoad) {
        return (
            <div className={styles.feed}>
                {[...Array(3)].map((_, i) => (
                    <div key={i} className={styles.skeleton}>
                        <div className={styles.skeletonTitle}></div>
                        <div className={styles.skeletonImage}></div>
                        <div className={styles.skeletonText}></div>
                        <div className={styles.skeletonText}></div>
                        <div className={styles.skeletonMeta}></div>
                    </div>
                ))}
            </div>
        )
    }

    // 에러 상태
    if (error && news.length === 0) {
        return (
            <div className={styles.errorContainer}>
                <div className={styles.errorIcon}>⚠️</div>
                <h3 className={styles.errorTitle}>뉴스를 불러올 수 없습니다</h3>
                <p className={styles.errorMessage}>{error}</p>
                <button onClick={handleRefresh} className={styles.retryButton}>
                    다시 시도
                </button>
            </div>
        )
    }

    // 빈 상태
    if (!isLoading && news.length === 0) {
        return (
            <div className={styles.emptyContainer}>
                <div className={styles.emptyIcon}>📰</div>
                <h3 className={styles.emptyTitle}>뉴스가 없습니다</h3>
                <p className={styles.emptyMessage}>
                    아직 수집된 뉴스가 없습니다. 잠시 후 다시 확인해주세요.
                </p>
                <button onClick={handleRefresh} className={styles.refreshButton}>
                    새로고침
                </button>
            </div>
        )
    }

    return (
        <div className={styles.feed}>
            {/* 뉴스 목록 */}
            {news.map((item) => (
                <NewsCard key={item.id} news={item} />
            ))}

            {/* 로딩 인디케이터 */}
            {isLoading && (
                <div className={styles.loadingContainer}>
                    <div className={styles.spinner}></div>
                    <span className={styles.loadingText}>뉴스를 불러오는 중...</span>
                </div>
            )}

            {/* 무한 스크롤 트리거 */}
            {hasMore && !isLoading && (
                <div ref={loadMoreRef} className={styles.loadMoreTrigger}></div>
            )}

            {/* 더 이상 뉴스가 없음 */}
            {!hasMore && news.length > 0 && (
                <div className={styles.endMessage}>
                    <span>모든 뉴스를 확인했습니다</span>
                </div>
            )}

            {/* 에러 토스트 (뉴스가 있는 상태에서 추가 로딩 실패) */}
            {error && news.length > 0 && (
                <div className={styles.errorToast}>
                    <span>{error}</span>
                    <button onClick={() => fetchNews(page + 1)}>재시도</button>
                </div>
            )}
        </div>
    )
}
