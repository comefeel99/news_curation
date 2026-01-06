'use client'

import { News } from '@/domain/entities/News'
import styles from './NewsCard.module.css'

interface NewsCardProps {
    news: News
}

/**
 * 뉴스 카드 컴포넌트
 * Genspark 스타일의 단일 뉴스 아이템을 표시합니다.
 */
export default function NewsCard({ news }: NewsCardProps) {
    // 상대 시간 포맷팅
    const formatRelativeTime = (date: Date): string => {
        const now = new Date()
        const diff = now.getTime() - new Date(date).getTime()

        const minutes = Math.floor(diff / (1000 * 60))
        const hours = Math.floor(diff / (1000 * 60 * 60))
        const days = Math.floor(diff / (1000 * 60 * 60 * 24))

        if (minutes < 1) return '방금 전'
        if (minutes < 60) return `${minutes}분 전`
        if (hours < 24) return `${hours}시간 전`
        if (days < 7) return `${days}일 전`

        return new Date(date).toLocaleDateString('ko-KR', {
            month: 'short',
            day: 'numeric',
        })
    }

    return (
        <article className={styles.card}>
            {/* 제목 */}
            <h2 className={styles.title}>
                <a
                    href={news.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.titleLink}
                >
                    {news.title}
                </a>
            </h2>

            {/* 이미지 */}
            {news.imageUrl && (
                <div className={styles.imageWrapper}>
                    <img
                        src={news.imageUrl}
                        alt={news.title}
                        className={styles.image}
                        loading="lazy"
                        onError={(e) => {
                            // 이미지 로드 실패 시 숨김
                            (e.target as HTMLImageElement).style.display = 'none'
                        }}
                    />
                </div>
            )}

            {/* AI 요약 */}
            {news.summary && (
                <div className={styles.summary}>
                    <p>{news.summary}</p>
                </div>
            )}

            {/* 메타 정보 */}
            <div className={styles.meta}>
                <span className={styles.source}>{news.source}</span>
                <span className={styles.dot}>•</span>
                <time className={styles.time} dateTime={new Date(news.publishedAt).toISOString()}>
                    {formatRelativeTime(news.publishedAt)}
                </time>
            </div>
        </article>
    )
}
