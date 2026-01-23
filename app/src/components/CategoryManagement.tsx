'use client'

import { useState, useEffect } from 'react'
import CategoryModal from '@/components/CategoryModal'
import styles from './CategoryManagement.module.css'

interface Category {
    id: string
    name: string
    searchQuery: string
    isDefault: boolean
    createdAt: string
}

export default function CategoryManagement() {
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // 모달 상태
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingCategory, setEditingCategory] = useState<Category | null>(null)

    useEffect(() => {
        fetchCategories()
    }, [])

    const fetchCategories = async () => {
        try {
            const response = await fetch('/api/categories')
            const data = await response.json()
            if (data.success) {
                setCategories(data.data)
            } else {
                throw new Error(data.error || '카테고리 목록을 불러오지 못했습니다.')
            }
        } catch (err) {
            setError('카테고리 목록 로딩 실패')
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const handleAdd = () => {
        setEditingCategory(null)
        setIsModalOpen(true)
    }

    const handleEdit = (category: Category) => {
        setEditingCategory(category)
        setIsModalOpen(true)
    }

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`'${name}' 카테고리를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없으며, 해당 카테고리로 수집된 뉴스는 분류가 해제됩니다.`)) {
            return
        }

        try {
            const response = await fetch(`/api/categories/${id}`, {
                method: 'DELETE'
            })
            const data = await response.json()

            if (data.success) {
                await fetchCategories()
            } else {
                alert(data.error || '삭제 실패')
            }
        } catch (err) {
            console.error(err)
            alert('삭제 중 오류가 발생했습니다.')
        }
    }

    const handleModalSubmit = async (name: string, searchQuery: string) => {
        try {
            if (editingCategory) {
                // 수정
                const response = await fetch(`/api/categories/${editingCategory.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, searchQuery })
                })
                const data = await response.json()
                if (!response.ok) throw new Error(data.error)
            } else {
                // 추가
                const response = await fetch('/api/categories', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, searchQuery })
                })
                const data = await response.json()
                if (!data.success) throw new Error(data.error)
            }

            await fetchCategories()
            setIsModalOpen(false)
        } catch (err) {
            const message = err instanceof Error ? err.message : '저장 실패'
            throw new Error(message) // 모달에서 에러 표시하도록 throw
        }
    }

    if (loading) return <div className={styles.loading}>로딩 중...</div>
    if (error) return <div className={styles.error}>{error}</div>

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h3 className={styles.title}>카테고리 목록 ({categories.length})</h3>
                <button className={styles.addButton} onClick={handleAdd}>
                    + 새 카테고리
                </button>
            </div>

            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>이름</th>
                            <th>검색 쿼리</th>
                            <th>타입</th>
                            <th>등록일</th>
                            <th>관리</th>
                        </tr>
                    </thead>
                    <tbody>
                        {categories.length === 0 ? (
                            <tr>
                                <td colSpan={5} className={styles.emptyState}>
                                    등록된 카테고리가 없습니다.
                                </td>
                            </tr>
                        ) : (
                            categories.map((category) => (
                                <tr key={category.id}>
                                    <td className={styles.nameCell}>{category.name}</td>
                                    <td>
                                        <code className={styles.queryCode}>{category.searchQuery}</code>
                                    </td>
                                    <td>
                                        <span className={`${styles.badge} ${category.isDefault ? styles.default : styles.custom}`}>
                                            {category.isDefault ? '기본' : '사용자'}
                                        </span>
                                    </td>
                                    <td>{new Date(category.createdAt).toLocaleDateString()}</td>
                                    <td className={styles.actions}>
                                        {category.isDefault ? (
                                            <span className={styles.disabledText}>관리 불가</span>
                                        ) : (
                                            <>
                                                <button
                                                    className={styles.editBtn}
                                                    onClick={() => handleEdit(category)}
                                                >
                                                    수정
                                                </button>
                                                <button
                                                    className={styles.deleteBtn}
                                                    onClick={() => handleDelete(category.id, category.name)}
                                                >
                                                    삭제
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <CategoryModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleModalSubmit}
                initialData={editingCategory}
            />
        </div>
    )
}
