import { NextResponse } from 'next/server'
import { SchedulerService } from '@/application/services/SchedulerService'
import { SystemSettingRepository } from '@/infrastructure/repositories/SystemSettingRepository'

/**
 * GET /api/admin/settings
 * 시스템 설정 조회
 */
export async function GET() {
    try {
        const repo = new SystemSettingRepository()
        const settings = repo.getAll()

        return NextResponse.json({
            schedule: settings['CRON_SCHEDULE'] || '0 */6 * * *',
            enabled: settings['CRON_ENABLED'] === 'true',
            recencyFilter: settings['SEARCH_RECENCY_FILTER'] || '1day',
            newsFilterOff: settings['NEWS_FILTER_OFF'] === 'true', // 문자열 "true"면 true, 아니면 false (default true여야 하지만 DB값 없을때 처리 주의)
            // default logic: if not set, fallback to default. Current code uses 'true' string in DB?
            // Let's stick to what NewsFetchService does: const newsFilterOffText = ... || 'true'
            // So if DB has no value, it is true.
            // If DB has "false", it is false.
            searchTypeExtensionLimit: settings['SEARCH_TYPE_EXTENSION_LIMIT'] || 'Complex'
        })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
    }
}

/**
 * POST /api/admin/settings
 * 시스템 설정 저장
 */
export async function POST(request: Request) {
    try {
        const { schedule, enabled, recencyFilter, newsFilterOff, searchTypeExtensionLimit } = await request.json()

        if (!schedule) {
            return NextResponse.json({ error: 'Schedule is required' }, { status: 400 })
        }

        const scheduler = SchedulerService.getInstance()
        scheduler.updateSchedule(schedule, enabled)

        const repo = new SystemSettingRepository()
        if (recencyFilter) repo.set('SEARCH_RECENCY_FILTER', recencyFilter)
        if (typeof newsFilterOff === 'boolean') repo.set('NEWS_FILTER_OFF', String(newsFilterOff))
        if (searchTypeExtensionLimit) repo.set('SEARCH_TYPE_EXTENSION_LIMIT', searchTypeExtensionLimit)

        return NextResponse.json({ success: true, schedule, enabled, recencyFilter, newsFilterOff, searchTypeExtensionLimit })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
    }
}
