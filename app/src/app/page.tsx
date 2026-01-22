'use client'

import { useState, useEffect, useCallback } from 'react'
import Header from '@/components/Header'
import NewsFeed from '@/components/NewsFeed'
import CategoryModal from '@/components/CategoryModal'
import { Category } from '@/domain/entities/Category'
import styles from './page.module.css'

/**
 * 메인 페이지 - 뉴스 피드
 */
export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // 카테고리 목록 조회
  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 초기 로드
  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  // 카테고리 선택 핸들러
  const handleCategorySelect = (categoryId: string | null) => {
    setSelectedCategoryId(categoryId)
  }

  // 카테고리 추가 핸들러
  const handleAddCategory = async (name: string, searchQuery: string) => {
    const response = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, searchQuery }),
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || '카테고리 추가에 실패했습니다.')
    }

    // 카테고리 목록 새로고침
    await fetchCategories()
  }

  // 카테고리 삭제 핸들러
  const handleDeleteCategory = async (categoryId: string) => {
    const response = await fetch(`/api/categories/${categoryId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || '카테고리 삭제에 실패했습니다.')
    }

    // 삭제된 카테고리가 선택되어 있었다면 전체로 변경
    if (selectedCategoryId === categoryId) {
      setSelectedCategoryId(null)
    }

    // 카테고리 목록 새로고침
    await fetchCategories()
  }

  return (
    <div className={styles.page}>
      <Header
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        onCategorySelect={handleCategorySelect}
        onAddClick={() => setIsModalOpen(true)}
        onDeleteCategory={handleDeleteCategory}
        isLoading={isLoading}
      />
      <main className={styles.main}>
        <div className={styles.container}>
          <NewsFeed selectedCategoryId={selectedCategoryId} />
        </div>
      </main>

      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddCategory}
      />
    </div>
  )
}
