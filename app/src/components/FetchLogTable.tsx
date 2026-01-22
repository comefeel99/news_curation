'use client'

import { useState, useEffect, useCallback } from 'react'
import { FetchLog, CategoryFetchResult } from '@/infrastructure/repositories/FetchLogRepository'
import styles from './FetchLogTable.module.css'

interface FetchLogTableProps {
    // 추가 props 필요시 확장
}

interface PaginationInfo {
    page: number
    limit: number
    total: number
    hasMore: boolean
    totalPages: number
}

/**
 * 수집 로그 테이블 컴포넌트
 */
export default function FetchLogTable({ }: FetchLogTableProps) {
    const [logs, setLogs] = useState<FetchLog[]>([])
    const [pagination, setPagination] = useState<PaginationInfo | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [expandedId, setExpandedId] = useState<string | null>(null)

    const fetchLogs = useCallback(async (page: number = 1) => {
        setIsLoading(true)
        setError(null)

        try {
            const response = await fetch(`/api/admin/fetch-logs?page=${page}&limit=10`)
            if (!response.ok) {
                throw new Error('로그를 불러오는데 실패했습니다.')
            }

            const data = await response.json()
            if (data.success) {
                setLogs(data.data.map((log: FetchLog) => ({
                    ...log,
                    createdAt: new Date(log.createdAt),
                })))
                setPagination(data.pagination)
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : '알 수 없는 오류'
            setError(message)
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchLogs()
    }, [fetchLogs])

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        }).format(date)
    }

    const formatDuration = (ms: number) => {
        if (ms < 1000) return `${ms}ms`
        return `${(ms / 1000).toFixed(1)}s`
    }

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id)
    }

    if (isLoading) {
        return <div className={styles.loading}>로딩 중...</div>
    }

    if (error) {
        return (
            <div className={styles.error}>
                <p>{error}</p>
                <button onClick={() => fetchLogs()}>다시 시도</button>
            </div>
        )
    }

    if (logs.length === 0) {
        return (
            <div className={styles.empty}>
                <p>수집 이력이 없습니다.</p>
                <p className={styles.hint}>뉴스 수집을 실행하면 이력이 기록됩니다.</p>
            </div>
        )
    }

    return (
        <div className={styles.container}>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>호출 시간</th>
                        <th>상태</th>
                        <th>소요 시간</th>
                        <th>수집</th>
                        <th>저장</th>
                        <th>중복</th>
                        <th>상세</th>
                    </tr>
                </thead>
                <tbody>
                    {logs.map((log) => (
                        <>
                            <tr key={log.id} className={log.status === 'error' ? styles.errorRow : ''}>
                                <td>{formatDate(log.createdAt)}</td>
                                <td>
                                    <span className={`${styles.badge} ${log.status === 'success' ? styles.success : styles.errorBadge}`}>
                                        {log.status === 'success' ? '성공' : '실패'}
                                    </span>
                                </td>
                                <td>{formatDuration(log.durationMs)}</td>
                                <td>{log.totalFetched}</td>
                                <td>{log.totalSaved}</td>
                                <td>{log.totalDuplicates}</td>
                                <td>
                                    <button
                                        className={styles.expandButton}
                                        onClick={() => toggleExpand(log.id)}
                                    >
                                        {expandedId === log.id ? '접기' : '펼치기'}
                                    </button>
                                </td>
                            </tr>
                            {expandedId === log.id && (
                                <tr key={`${log.id}-details`} className={styles.detailRow}>
                                    <td colSpan={7}>
                                        <div className={styles.details}>
                                            {log.errorMessage && (
                                                <div className={styles.errorMessage}>
                                                    <strong>에러:</strong> {log.errorMessage}
                                                </div>
                                            )}
                                            {log.categoryResults && log.categoryResults.length > 0 && (
                                                <div className={styles.categoryResults}>
                                                    <strong>카테고리별 결과:</strong>
                                                    <ul>
                                                        {log.categoryResults.map((cat: CategoryFetchResult, idx: number) => (
                                                            <li key={idx}>
                                                                <span className={styles.categoryName}>{cat.categoryName}</span>
                                                                : 수집 {cat.fetched}, 저장 {cat.saved}, 중복 {cat.duplicates}
                                                                {cat.errors.length > 0 && (
                                                                    <span className={styles.categoryError}> (에러 {cat.errors.length}건)</span>
                                                                )}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </>
                    ))}
                </tbody>
            </table>

            {/* 페이지네이션 */}
            {pagination && pagination.totalPages > 1 && (
                <div className={styles.pagination}>
                    <button
                        disabled={pagination.page === 1}
                        onClick={() => fetchLogs(pagination.page - 1)}
                    >
                        이전
                    </button>
                    <span>
                        {pagination.page} / {pagination.totalPages}
                    </span>
                    <button
                        disabled={!pagination.hasMore}
                        onClick={() => fetchLogs(pagination.page + 1)}
                    >
                        다음
                    </button>
                </div>
            )}
        </div>
    )
}
