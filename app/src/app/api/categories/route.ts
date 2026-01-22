import { NextRequest, NextResponse } from 'next/server'
import { CategoryRepository } from '@/infrastructure/repositories/CategoryRepository'
import { validateCategory, createCategory } from '@/domain/entities/Category'
import { initializeDatabase, getDatabase, isDatabaseInitialized } from '@/infrastructure/database/sqlite'

/**
 * GET /api/categories
 * 모든 카테고리 조회
 */
export async function GET() {
    try {
        if (!isDatabaseInitialized()) {
            initializeDatabase()
        }

        const db = getDatabase()
        const categoryRepository = new CategoryRepository(db)
        const categories = categoryRepository.findAll()

        return NextResponse.json({
            success: true,
            data: categories,
            total: categories.length,
        })
    } catch (error) {
        console.error('Error fetching categories:', error)
        const message = error instanceof Error ? error.message : 'Unknown error'
        return NextResponse.json(
            { error: `Failed to fetch categories: ${message}` },
            { status: 500 }
        )
    }
}

/**
 * POST /api/categories
 * 새 카테고리 추가
 * Body: { name: string, searchQuery: string }
 */
export async function POST(request: NextRequest) {
    try {
        if (!isDatabaseInitialized()) {
            initializeDatabase()
        }

        const db = getDatabase()
        const categoryRepository = new CategoryRepository(db)

        // 요청 본문 파싱
        const body = await request.json()
        const { name, searchQuery } = body

        // 유효성 검증
        if (!validateCategory({ name, searchQuery })) {
            return NextResponse.json(
                { error: '카테고리 이름과 검색 쿼리를 올바르게 입력해주세요.' },
                { status: 400 }
            )
        }

        // 중복 이름 체크
        const existing = categoryRepository.findByName(name)
        if (existing) {
            return NextResponse.json(
                { error: '이미 존재하는 카테고리 이름입니다.' },
                { status: 409 }
            )
        }

        // 카테고리 생성
        const category = createCategory({
            name: name.trim(),
            searchQuery: searchQuery.trim(),
            isDefault: false,
        })

        const saved = categoryRepository.save(category)
        if (!saved) {
            return NextResponse.json(
                { error: '카테고리 저장에 실패했습니다.' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            data: saved,
        }, { status: 201 })
    } catch (error) {
        console.error('Error creating category:', error)
        const message = error instanceof Error ? error.message : 'Unknown error'

        // 최대 개수 초과 에러
        if (message.includes('최대')) {
            return NextResponse.json(
                { error: message },
                { status: 400 }
            )
        }

        return NextResponse.json(
            { error: `Failed to create category: ${message}` },
            { status: 500 }
        )
    }
}
