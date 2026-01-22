import { SchedulerService } from '@/application/services/SchedulerService'

export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        const scheduler = SchedulerService.getInstance()
        scheduler.init()
    }
}
