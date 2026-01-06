import Header from '@/components/Header'
import NewsFeed from '@/components/NewsFeed'
import styles from './page.module.css'

/**
 * 메인 페이지 - 뉴스 피드
 */
export default function HomePage() {
  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.main}>
        <div className={styles.container}>
          <NewsFeed />
        </div>
      </main>
    </div>
  )
}
