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
    const selectedCategory = categories.find(c => c.id === selectedId)
    const currentName = selectedCategory ? selectedCategory.name : '전체'

    return (
        <div className={styles.container}>
            <button className={styles.triggerButton}>
                {currentName}
                <span className={styles.triggerIcon}>▼</span>
            </button>

            <div className={styles.dropdown}>
                {/* 전체 선택 */}
                <button
                    className={`${styles.dropdownItem} ${selectedId === null ? styles.active : ''}`}
                    onClick={() => onSelect(null)}
                >
                    전체
                </button>

                {/* 카테고리 목록 */}
                {categories.map((category) => (
                    <button
                        key={category.id}
                        className={`${styles.dropdownItem} ${selectedId === category.id ? styles.active : ''} ${category.isDefault ? styles.default : ''}`}
                        onClick={() => onSelect(category.id)}
                        title={category.searchQuery}
                    >
                        {category.name}
                    </button>
                ))}

                <div className={styles.divider} />

                {/* 카테고리 추가 */}
                <button
                    className={`${styles.dropdownItem} ${styles.addButton}`}
                    onClick={onAddClick}
                >
                    + 카테고리 추가
                </button>
            </div>
        </div>
    )
}
