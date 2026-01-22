'use client'

import { Category } from '@/domain/entities/Category'
import CategoryTabs from './CategoryTabs'
import styles from './Header.module.css'

interface HeaderProps {
    categories: Category[]
    selectedCategoryId: string | null
    onCategorySelect: (categoryId: string | null) => void
    onAddClick: () => void
    onDeleteCategory: (categoryId: string) => Promise<void>
    isLoading: boolean
}

/**
 * 헤더 컴포넌트
 * 서비스 타이틀과 카테고리 탭을 표시합니다.
 */
export default function Header({
    categories,
    selectedCategoryId,
    onCategorySelect,
    onAddClick,
    isLoading,
}: HeaderProps) {
    return (
        <header className={styles.header}>
            <div className={styles.container}>
                <div className={styles.logo}>
                    <span className={styles.icon}>📰</span>
                    <h1 className={styles.title}>뉴스 브리핑</h1>
                </div>
                <nav className={styles.nav}>
                    {isLoading ? (
                        <span className={styles.loading}>로딩 중...</span>
                    ) : (
                        <CategoryTabs
                            categories={categories}
                            selectedId={selectedCategoryId}
                            onSelect={onCategorySelect}
                            onAddClick={onAddClick}
                        />
                    )}
                </nav>
            </div>
        </header>
    )
}
