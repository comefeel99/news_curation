'use client'

import { useState } from 'react'
import FetchLogTable from '@/components/FetchLogTable'
import SearchApiLogTable from '@/components/SearchApiLogTable'
import ScheduleSettings from '@/components/ScheduleSettings'
import SearchSettings from '@/components/SearchSettings'
import CategoryManagement from '@/components/CategoryManagement'
import styles from './page.module.css'

type Tab = 'fetch-logs' | 'search-logs' | 'settings' | 'categories' | 'search-config'

/**
 * 관리자 페이지
 */
export default function AdminPage() {
    const [activeTab, setActiveTab] = useState<Tab>('fetch-logs')

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <h1 className={styles.title}>📊 관리자 대시보드</h1>
                <a href="/" className={styles.backLink}>← 뉴스 브리핑으로 돌아가기</a>
            </header>
            <main className={styles.main}>
                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${activeTab === 'fetch-logs' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('fetch-logs')}
                    >
                        뉴스 수집 이력
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'search-logs' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('search-logs')}
                    >
                        Search API 로그
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'categories' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('categories')}
                    >
                        카테고리 관리
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'settings' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('settings')}
                    >
                        자동 수집 설정(스케줄)
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'search-config' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('search-config')}
                    >
                        검색 필터 설정
                    </button>
                </div>

                {activeTab === 'fetch-logs' && <FetchLogTable />}
                {activeTab === 'search-logs' && <SearchApiLogTable />}
                {activeTab === 'settings' && <ScheduleSettings />}
                {activeTab === 'categories' && <CategoryManagement />}
                {activeTab === 'search-config' && <SearchSettings />}
            </main>
        </div>
    )
}
