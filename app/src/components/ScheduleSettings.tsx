'use client'

import { useState, useEffect } from 'react'
import styles from './ScheduleSettings.module.css'

interface Settings {
    schedule: string
    enabled: boolean
}

const PRESETS = [
    { label: '1시간마다', value: '0 * * * *' },
    { label: '3시간마다', value: '0 */3 * * *' },
    { label: '6시간마다', value: '0 */6 * * *' },
    { label: '12시간마다', value: '0 */12 * * *' },
    { label: '매일 자정', value: '0 0 * * *' },
]

export default function ScheduleSettings() {
    const [settings, setSettings] = useState<Settings | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
    const [customSchedule, setCustomSchedule] = useState('')
    const [isCustom, setIsCustom] = useState(false)
    const [fetching, setFetching] = useState(false)

    useEffect(() => {
        fetchSettings()
    }, [])

    const fetchSettings = async () => {
        try {
            const response = await fetch('/api/admin/settings')
            const data = await response.json()
            setSettings(data)

            // 프리셋 확인
            const isPreset = PRESETS.some(p => p.value === data.schedule)
            setIsCustom(!isPreset)
            if (!isPreset) {
                setCustomSchedule(data.schedule)
            }
        } catch (error) {
            setMessage({ type: 'error', text: '설정을 불러오는데 실패했습니다.' })
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        if (!settings) return

        setSaving(true)
        setMessage(null)

        try {
            const scheduleToSave = isCustom ? customSchedule : settings.schedule

            const response = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    schedule: scheduleToSave,
                    enabled: settings.enabled
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

    const handleManualFetch = async () => {
        setFetching(true)
        setMessage(null)
        try {
            const response = await fetch('/api/news/fetch', { method: 'POST' })
            const data = await response.json()

            if (!response.ok) throw new Error(data.error || '수집 실패')

            // number 타입인지 확인 후 출력
            const count = typeof data.total?.saved === 'number' ? data.total.saved : 0
            setMessage({ type: 'success', text: `수집 완료: ${count}건의 새로운 뉴스 저장` })
        } catch (error) {
            setMessage({ type: 'error', text: '수동 수집 중 오류가 발생했습니다.' })
        } finally {
            setFetching(false)
        }
    }

    if (loading) return <div className={styles.loading}>로딩 중...</div>
    if (!settings) return <div className={styles.error}>설정을 불러올 수 없습니다.</div>

    return (
        <div className={styles.container}>
            <div className={styles.section}>
                <h3 className={styles.sectionTitle}>자동 수집 설정</h3>

                <div className={styles.controlGroup}>
                    <label className={styles.toggleLabel}>
                        <input
                            type="checkbox"
                            checked={settings.enabled}
                            onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                            className={styles.toggleInput}
                        />
                        <span className={styles.toggleText}>자동 수집 활성화</span>
                    </label>
                </div>

                <div className={styles.controlGroup}>
                    <label className={styles.label}>수집 주기</label>
                    <div className={styles.presets}>
                        {PRESETS.map((preset) => (
                            <button
                                key={preset.value}
                                className={`${styles.presetBtn} ${!isCustom && settings.schedule === preset.value ? styles.active : ''}`}
                                onClick={() => {
                                    setIsCustom(false)
                                    setSettings({ ...settings, schedule: preset.value })
                                }}
                                disabled={!settings.enabled}
                            >
                                {preset.label}
                            </button>
                        ))}
                        <button
                            className={`${styles.presetBtn} ${isCustom ? styles.active : ''}`}
                            onClick={() => setIsCustom(true)}
                            disabled={!settings.enabled}
                        >
                            직접 입력
                        </button>
                    </div>
                </div>

                {isCustom && (
                    <div className={styles.controlGroup}>
                        <label className={styles.label}>CRON 표현식</label>
                        <input
                            type="text"
                            value={customSchedule}
                            onChange={(e) => setCustomSchedule(e.target.value)}
                            className={styles.input}
                            placeholder="* * * * *"
                            disabled={!settings.enabled}
                        />
                        <p className={styles.helpText}>
                            분 시 일 월 요일 순서 (예: <code className={styles.codeTag}>0 */6 * * *</code> = 6시간마다)
                        </p>
                    </div>
                )}

                <div className={styles.actions}>
                    <button
                        className={styles.saveBtn}
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? '저장 중...' : '설정 저장'}
                    </button>
                </div>

                <div className={styles.divider} />

                <div className={styles.controlGroup}>
                    <h4 className={styles.subTitle}>수동 수집</h4>
                    <p className={styles.descriptionText}>
                        설정된 주기와 상관없이 즉시 뉴스를 수집합니다.
                    </p>
                    <button
                        className={styles.manualFetchBtn}
                        onClick={handleManualFetch}
                        disabled={fetching}
                    >
                        {fetching ? '수집 중...' : '지금 수집 실행'}
                    </button>
                </div>

                {message && (
                    <div className={`${styles.message} ${styles[message.type]}`}>
                        {message.text}
                    </div>
                )}
            </div>

            <div className={styles.description}>
                <h4>💡 참고사항</h4>
                <ul>
                    <li>서버 재시작 시에도 설정된 주기는 유지됩니다.</li>
                    <li>주기를 너무 짧게 설정하면 API 비용이 증가하거나 시스템 부하가 발생할 수 있습니다.</li>
                    <li>권장 설정: 6시간 또는 12시간마다</li>
                </ul>
            </div>
        </div>
    )
}
