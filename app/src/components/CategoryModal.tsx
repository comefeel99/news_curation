'use client'

import { useState } from 'react'
import styles from './CategoryModal.module.css'

interface CategoryModalProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (name: string, searchQuery: string) => Promise<void>
}

/**
 * 카테고리 추가 모달 컴포넌트
 */
export default function CategoryModal({ isOpen, onClose, onSubmit }: CategoryModalProps) {
    const [name, setName] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (!name.trim() || !searchQuery.trim()) {
            setError('이름과 검색 쿼리를 모두 입력해주세요.')
            return
        }

        if (name.length > 50) {
            setError('카테고리 이름은 50자 이내로 입력해주세요.')
            return
        }

        if (searchQuery.length > 200) {
            setError('검색 쿼리는 200자 이내로 입력해주세요.')
            return
        }

        setIsLoading(true)
        try {
            await onSubmit(name.trim(), searchQuery.trim())
            setName('')
            setSearchQuery('')
            onClose()
        } catch (err) {
            const message = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.'
            setError(message)
        } finally {
            setIsLoading(false)
        }
    }

    const handleClose = () => {
        if (!isLoading) {
            setName('')
            setSearchQuery('')
            setError(null)
            onClose()
        }
    }

    return (
        <div className={styles.overlay} onClick={handleClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2 className={styles.title}>카테고리 추가</h2>
                    <button
                        className={styles.closeButton}
                        onClick={handleClose}
                        disabled={isLoading}
                    >
                        ×
                    </button>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.field}>
                        <label htmlFor="categoryName" className={styles.label}>
                            카테고리 이름
                        </label>
                        <input
                            id="categoryName"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="예: sk텔레콤 주식"
                            className={styles.input}
                            maxLength={50}
                            disabled={isLoading}
                            autoFocus
                        />
                    </div>

                    <div className={styles.field}>
                        <label htmlFor="searchQuery" className={styles.label}>
                            검색 쿼리
                        </label>
                        <input
                            id="searchQuery"
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="예: sk텔레콤 주식 시세 뉴스"
                            className={styles.input}
                            maxLength={200}
                            disabled={isLoading}
                        />
                        <span className={styles.hint}>
                            뉴스 검색에 사용될 키워드를 입력하세요
                        </span>
                    </div>

                    {error && (
                        <div className={styles.error}>
                            {error}
                        </div>
                    )}

                    <div className={styles.actions}>
                        <button
                            type="button"
                            className={styles.cancelButton}
                            onClick={handleClose}
                            disabled={isLoading}
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            className={styles.submitButton}
                            disabled={isLoading}
                        >
                            {isLoading ? '추가 중...' : '추가'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
