'use client'

import { Category } from '@/domain/entities/Category'
import styles from './CategoryTabs.module.css'

interface CategoryTabsProps {
    categories: Category[]
    selectedId: string | null  // null = 전체
    onSelect: (categoryId: string | null) => void
    onAddClick: () => void
}

/**
 * 카테고리 탭 컴포넌트
 * 카테고리를 탭 형태로 표시하고, 선택/추가 기능을 제공합니다.
 */
export default function CategoryTabs({
    categories,
    selectedId,
    onSelect,
    onAddClick
}: CategoryTabsProps) {
    return (
        <nav className={styles.tabs}>
            {/* 전체 탭 */}
            <button
                className={`${styles.tab} ${selectedId === null ? styles.active : ''}`}
                onClick={() => onSelect(null)}
            >
                전체
            </button>

            {/* 카테고리 탭들 */}
            {categories.map((category) => (
                <button
                    key={category.id}
                    className={`${styles.tab} ${selectedId === category.id ? styles.active : ''} ${category.isDefault ? styles.default : ''}`}
                    onClick={() => onSelect(category.id)}
                    title={category.searchQuery}
                >
                    {category.name}
                </button>
            ))}

            {/* 카테고리 추가 버튼 */}
            <button
                className={`${styles.tab} ${styles.addButton}`}
                onClick={onAddClick}
                title="카테고리 추가"
            >
                + 추가
            </button>
        </nav>
    )
}
