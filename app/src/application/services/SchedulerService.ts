import * as cron from 'node-cron'
import { SystemSettingRepository } from '@/infrastructure/repositories/SystemSettingRepository'
import { createNewsFetchService } from '@/application/services/NewsFetchService'
import { CategoryRepository } from '@/infrastructure/repositories/CategoryRepository'
import { FetchLogRepository } from '@/infrastructure/repositories/FetchLogRepository'
import { getDatabase, initializeDatabase, isDatabaseInitialized } from '@/infrastructure/database/sqlite'

export class SchedulerService {
    private static instance: SchedulerService
    private task: cron.ScheduledTask | null = null
    private readonly settingsRepo: SystemSettingRepository

    private constructor() {
        this.settingsRepo = new SystemSettingRepository()
    }

    static getInstance(): SchedulerService {
        if (!SchedulerService.instance) {
            SchedulerService.instance = new SchedulerService()
        }
        return SchedulerService.instance
    }

    init() {
        if (this.task) {
            return
        }

        try {
            const enabled = this.settingsRepo.get('CRON_ENABLED') === 'true'
            const schedule = this.settingsRepo.get('CRON_SCHEDULE') || '0 */6 * * *'

            console.log(`[Scheduler] Init - Enabled: ${enabled}, Schedule: ${schedule}`)

            if (enabled) {
                this.start(schedule)
            }
        } catch (error) {
            console.error('[Scheduler] Initialization failed:', error)
        }
    }

    start(schedule: string) {
        this.stop() // 기존 작업 정리

        console.log(`[Scheduler] Starting news fetch schedule: ${schedule}`)

        // 유효성 검증
        if (!cron.validate(schedule)) {
            console.error('[Scheduler] Invalid cron expression:', schedule)
            return
        }

        this.task = cron.schedule(schedule, async () => {
            console.log('[Scheduler] Running scheduled news fetch...')
            try {
                if (!isDatabaseInitialized()) {
                    initializeDatabase()
                }
                const db = getDatabase()
                const categoryRepo = new CategoryRepository(db)
                const fetchLogRepo = new FetchLogRepository(db)
                const fetchService = createNewsFetchService()

                await fetchService.executeFetchAndLog(categoryRepo, fetchLogRepo)
                console.log('[Scheduler] Fetch completed successfully')
            } catch (error) {
                console.error('[Scheduler] Error execution:', error)
            }
        })
    }

    stop() {
        if (this.task) {
            this.task.stop()
            this.task = null
            console.log('[Scheduler] Stopped schedule')
        }
    }

    updateSchedule(schedule: string, enabled: boolean) {
        this.settingsRepo.set('CRON_SCHEDULE', schedule)
        this.settingsRepo.set('CRON_ENABLED', String(enabled))

        if (enabled) {
            this.start(schedule)
        } else {
            this.stop()
        }
    }
}
