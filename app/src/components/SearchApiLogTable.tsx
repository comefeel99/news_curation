'use client'

import { useState, useEffect, useCallback } from 'react'
import styles from './SearchApiLogTable.module.css'
import { SearchApiLog, PaginatedSearchApiLogs } from '@/infrastructure/logging/SearchApiLogger'

export default function SearchApiLogTable() {
    const [data, setData] = useState<PaginatedSearchApiLogs | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [expandedRow, setExpandedRow] = useState<string | null>(null)

    const fetchLogs = useCallback(async (page: number = 1) => {
        setLoading(true)
        setError(null)

        try {
            const response = await fetch(`/api/admin/search-logs?page=${page}&limit=20`)
            if (!response.ok) {
                throw new Error('로그를 불러오지 못했습니다')
            }
            const result = await response.json()
            setData(result)
        } catch (err) {
            setError(err instanceof Error ? err.message : '알 수 없는 오류')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchLogs(1)
    }, [fetchLogs])

    const handlePageChange = (newPage: number) => {
        if (data && newPage >= 1 && newPage <= data.totalPages) {
            fetchLogs(newPage)
        }
    }

    const toggleExpand = (id: string) => {
        setExpandedRow(expandedRow === id ? null : id)
    }

    const formatDate = (date: Date | string) => {
        const d = new Date(date)
        return d.toLocaleString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        })
    }

    const formatDuration = (ms: number) => {
        if (ms < 1000) return `${ms}ms`
        return `${(ms / 1000).toFixed(2)}s`
    }

    const truncateText = (text: string, maxLength: number = 50) => {
        if (text.length <= maxLength) return text
        return text.substring(0, maxLength) + '...'
    }

    if (loading && !data) {
        return <div className={styles.loading}>로딩 중...</div>
    }

    if (error) {
        return <div className={styles.error}>{error}</div>
    }

    if (!data || data.logs.length === 0) {
        return <div className={styles.empty}>Search API 호출 이력이 없습니다</div>
    }

    return (
        <div className={styles.container}>
            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>호출 시간</th>
                            <th>카테고리</th>
                            <th>검색 쿼리</th>
                            <th>상태</th>
                            <th>소요 시간</th>
                            <th>결과 수</th>
                            <th>토큰</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.logs.map((log: SearchApiLog) => (
                            <>
                                <tr key={log.id} className={expandedRow === log.id ? styles.expanded : ''}>
                                    <td>{formatDate(log.createdAt)}</td>
                                    <td>{log.categoryName || '-'}</td>
                                    <td title={log.searchQuery}>{truncateText(log.searchQuery)}</td>
                                    <td>
                                        <span className={`${styles.badge} ${styles[log.status]}`}>
                                            {log.status === 'success' ? '성공' : '실패'}
                                        </span>
                                    </td>
                                    <td>{formatDuration(log.durationMs)}</td>
                                    <td>{log.resultCount}</td>
                                    <td>
                                        {log.tokensPrompt && log.tokensCompletion
                                            ? `${log.tokensPrompt} / ${log.tokensCompletion}`
                                            : '-'}
                                    </td>
                                    <td>
                                        <button
                                            className={styles.expandButton}
                                            onClick={() => toggleExpand(log.id)}
                                        >
                                            {expandedRow === log.id ? '접기' : '상세'}
                                        </button>
                                    </td>
                                </tr>
                                {expandedRow === log.id && (
                                    <tr className={styles.detailRow}>
                                        <td colSpan={8}>
                                            <div className={styles.detailContent}>
                                                {log.errorMessage && (
                                                    <div className={styles.detailSection}>
                                                        <h4>에러 메시지</h4>
                                                        <pre className={styles.errorText}>{log.errorMessage}</pre>
                                                    </div>
                                                )}
                                                {log.requestBody && (
                                                    <div className={styles.detailSection}>
                                                        <h4>요청 본문</h4>
                                                        <pre className={styles.codeBlock}>
                                                            {JSON.stringify(JSON.parse(log.requestBody), null, 2)}
                                                        </pre>
                                                    </div>
                                                )}
                                                {log.responseBody && (
                                                    <div className={styles.detailSection}>
                                                        <h4>응답 본문</h4>
                                                        <pre className={styles.codeBlock}>
                                                            {JSON.stringify(JSON.parse(log.responseBody), null, 2)}
                                                        </pre>
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
            </div>

            {/* 페이지네이션 */}
            {data.totalPages > 1 && (
                <div className={styles.pagination}>
                    <button
                        onClick={() => handlePageChange(data.page - 1)}
                        disabled={data.page === 1}
                        className={styles.pageButton}
                    >
                        이전
                    </button>
                    <span className={styles.pageInfo}>
                        {data.page} / {data.totalPages}
                    </span>
                    <button
                        onClick={() => handlePageChange(data.page + 1)}
                        disabled={data.page === data.totalPages}
                        className={styles.pageButton}
                    >
                        다음
                    </button>
                </div>
            )}
        </div>
    )
}
