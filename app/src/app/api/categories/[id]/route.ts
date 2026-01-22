import { NextRequest, NextResponse } from 'next/server'
import { CategoryRepository } from '@/infrastructure/repositories/CategoryRepository'
import { initializeDatabase, getDatabase, isDatabaseInitialized } from '@/infrastructure/database/sqlite'

interface RouteParams {
    params: Promise<{ id: string }>
}

/**
 * GET /api/categories/:id
 * 특정 카테고리 조회
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params

        if (!isDatabaseInitialized()) {
            initializeDatabase()
        }

        const db = getDatabase()
        const categoryRepository = new CategoryRepository(db)
        const category = categoryRepository.findById(id)

        if (!category) {
            return NextResponse.json(
                { error: '카테고리를 찾을 수 없습니다.' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            success: true,
            data: category,
        })
    } catch (error) {
        console.error('Error fetching category:', error)
        const message = error instanceof Error ? error.message : 'Unknown error'
        return NextResponse.json(
            { error: `Failed to fetch category: ${message}` },
            { status: 500 }
        )
    }
}

/**
 * DELETE /api/categories/:id
 * 카테고리 삭제 (기본 카테고리는 삭제 불가)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params

        if (!isDatabaseInitialized()) {
            initializeDatabase()
        }

        const db = getDatabase()
        const categoryRepository = new CategoryRepository(db)

        // 카테고리 존재 여부 확인
        const category = categoryRepository.findById(id)
        if (!category) {
            return NextResponse.json(
                { error: '카테고리를 찾을 수 없습니다.' },
                { status: 404 }
            )
        }

        // 삭제 시도
        const deleted = categoryRepository.delete(id)
        if (!deleted) {
            return NextResponse.json(
                { error: '카테고리 삭제에 실패했습니다.' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            message: '카테고리가 삭제되었습니다.',
        })
    } catch (error) {
        console.error('Error deleting category:', error)
        const message = error instanceof Error ? error.message : 'Unknown error'

        // 기본 카테고리 삭제 시도 에러
        if (message.includes('기본 카테고리')) {
            return NextResponse.json(
                { error: message },
                { status: 403 }
            )
        }

        return NextResponse.json(
            { error: `Failed to delete category: ${message}` },
            { status: 500 }
        )
    }
}
