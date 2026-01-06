import styles from './Header.module.css'

/**
 * 헤더 컴포넌트
 * 서비스 타이틀과 간단한 네비게이션을 표시합니다.
 */
export default function Header() {
    return (
        <header className={styles.header}>
            <div className={styles.container}>
                <div className={styles.logo}>
                    <span className={styles.icon}>📰</span>
                    <h1 className={styles.title}>뉴스 브리핑</h1>
                </div>
                <nav className={styles.nav}>
                    <span className={styles.category}>과학 &amp; 기술</span>
                </nav>
            </div>
        </header>
    )
}
