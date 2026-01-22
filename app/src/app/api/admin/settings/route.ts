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
        const { schedule, enabled } = await request.json()

        if (!schedule) {
            return NextResponse.json({ error: 'Schedule is required' }, { status: 400 })
        }

        const scheduler = SchedulerService.getInstance()
        scheduler.updateSchedule(schedule, enabled)

        return NextResponse.json({ success: true, schedule, enabled })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
    }
}
