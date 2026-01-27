'use client'

import { useState, useEffect } from 'react'
import styles from './SearchSettings.module.css'

interface SearchConfig {
    recencyFilter: string
    newsFilterOff: boolean
    searchTypeExtensionLimit: string
}

const RECENCY_OPTIONS = [
    { label: '1시간', value: '1hour' },
    { label: '1일', value: '1day' },
    { label: '1주', value: '1week' },
    { label: '1개월', value: '1month' },
    { label: '1년', value: '1year' },
]

export default function SearchSettings() {
    const [config, setConfig] = useState<SearchConfig | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    useEffect(() => {
        fetchSettings()
    }, [])

    const fetchSettings = async () => {
        try {
            const response = await fetch('/api/admin/settings')
            const data = await response.json()
            setConfig({
                recencyFilter: data.recencyFilter || '1day',
                newsFilterOff: data.newsFilterOff ?? true,
                searchTypeExtensionLimit: data.searchTypeExtensionLimit || 'Complex'
            })
        } catch (error) {
            setMessage({ type: 'error', text: '설정을 불러오는데 실패했습니다.' })
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        if (!config) return

        setSaving(true)
        setMessage(null)

        try {
            // 기존 설정을 유지하면서 검색 설정만 업데이트하기 위해 먼저 현재 설정을 가져옴 (옵션)
            // 하지만 API는 patch 형태가 아니라 전체 덮어쓰기 형태일 수 있으므로
            // route.ts 구현을 보면 POST에서 json body의 필드들을 받아서처리함.
            // schedule 등 다른 필드는 보내지 않으면 undefined로 처리되어 무시되거나 에러가 날 수 있음.
            // route.ts 구현: const { schedule, enabled, recencyFilter... } = await request.json()
            // if (!schedule) return error.
            // 아, schedule이 필수값으로 되어 있음!
            // 따라서 저장 시 schedule 정보도 같이 보내줘야 함.
            // 이를 해결하기 위해 fetchSettings에서 전체 데이터를 받아오거나,
            // API를 수정하여 schedule이 없으면 무시하도록 하거나,
            // SearchSettings 컴포넌트에서 schedule 정보도 state로 가지고 있어야 함.

            // 더 좋은 방법: API가 부분 업데이트를 지원하도록 수정했어야 함.
            // 현재 route.ts는 schedule이 없으면 400 에러를 리턴함.
            // -> "if (!schedule) { return NextResponse.json({ error: 'Schedule is required' }, { status: 400 }) }"

            // 따라서 여기서 schedule 정보도 같이 보내야 함.
            // fetchSettings에서 전체 데이터를 받아오도록 수정.

            // 다시 fetch하여 최신 schedule 정보를 가져온 뒤 병합해서 저장
            const currentSettingsRes = await fetch('/api/admin/settings')
            const currentSettings = await currentSettingsRes.json()

            const response = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    schedule: currentSettings.schedule,
                    enabled: currentSettings.enabled,
                    recencyFilter: config.recencyFilter,
                    newsFilterOff: config.newsFilterOff,
                    searchTypeExtensionLimit: config.searchTypeExtensionLimit
                })
            })

            if (!response.ok) throw new Error('Failed to save')

            setMessage({ type: 'success', text: '설정이 저장되었습니다.' })
        } catch (error) {
            setMessage({ type: 'error', text: '설정 저장에 실패했습니다.' })
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className={styles.loading}>로딩 중...</div>
    if (!config) return <div className={styles.error}>설정을 불러올 수 없습니다.</div>

    return (
        <div className={styles.container}>
            <div className={styles.section}>
                <h3 className={styles.sectionTitle}>검색 필터 설정</h3>

                <div className={styles.controlGroup}>
                    <label className={styles.label}>검색 기간 (Recency Filter)</label>
                    <select
                        className={styles.select}
                        value={config.recencyFilter}
                        onChange={(e) => setConfig({ ...config, recencyFilter: e.target.value })}
                    >
                        {RECENCY_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label} ({opt.value})
                            </option>
                        ))}
                    </select>
                </div>

                <div className={styles.controlGroup}>
                    <label className={styles.toggleLabel}>
                        <input
                            type="checkbox"
                            checked={config.newsFilterOff}
                            onChange={(e) => setConfig({ ...config, newsFilterOff: e.target.checked })}
                            className={styles.toggleInput}
                        />
                        <span className={styles.toggleText}>
                            뉴스 필터 끄기 (News Filter Off)
                            <span className={styles.helpText} style={{ display: 'block', marginLeft: 0 }}>
                                체크 시 뉴스 필터가 <b>꺼집니다</b> (더 많은 검색 결과 노출).
                            </span>
                        </span>
                    </label>
                </div>

                <div className={styles.controlGroup}>
                    <label className={styles.label}>검색 확장 제한 (Extension Limit)</label>
                    <input
                        type="text"
                        className={styles.input}
                        value={config.searchTypeExtensionLimit}
                        onChange={(e) => setConfig({ ...config, searchTypeExtensionLimit: e.target.value })}
                        placeholder="예: Complex, Simple"
                    />
                    <p className={styles.helpText}>
                        검색 쿼리 확장 수준을 설정합니다 (예: Complex).
                    </p>
                </div>

                <div className={styles.actions}>
                    <button
                        className={styles.saveBtn}
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? '저장 중...' : '설정 저장'}
                    </button>
                </div>

                {message && (
                    <div className={`${styles.message} ${styles[message.type]}`}>
                        {message.text}
                    </div>
                )}
            </div>
        </div>
    )
}
