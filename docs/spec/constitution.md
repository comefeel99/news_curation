<!--
SYNC IMPACT REPORT
Version: 1.0.0
- Defined initial principles based on codebase analysis.
- Established Clean Architecture, Type Safety, Modular UI, and Robust Error Handling as core laws.
-->
# Project Constitution

## 1. Clean Architecture (클린 아키텍처)
The project MUST adhere to a strictly layered architecture to separate concerns and ensure testability.
- **Domain Layer** (`src/domain`): MUST contain pure business logic and entities. MUST NOT depend on outer layers.
- **Application Layer** (`src/application`): MUST define use cases and services. Orchestrates domain objects.
- **Infrastructure Layer** (`src/infrastructure`): MUST implement interfaces defined in inner layers (repositories, API clients). Handles external details (DB, Network).
- **Presentation Layer** (`src/components`, `src/app`): MUST allow interaction with the application.

## 2. Strong Type Safety (강력한 타입 안전성)
Code MUST utilize TypeScript's strict mode to prevent runtime errors.
- **No Implicit Any**: All variables and functions MUST have explicit types.
- **Interfaces**: Define strictly typed interfaces for all props, API responses, and services.
- **Strict Null Checks**: Handle `null` and `undefined` explicitly.

## 3. Modular & Declarative UI (모듈화 및 선언적 UI)
Frontend development MUST follow modern React practices.
- **Functional Components**: All components MUST be Functional Components using Hooks.
- **CSS Modules**: Styling MUST be encapsulated using CSS Modules (`*.module.css`) to prevent global namespace pollution.
- **Client/Server Split**: Explicitly mark Client Components with `'use client'` when using hooks or interactivity.

## 4. Robust Error Handling (견고한 에러 처리)
Application stability MUST be prioritized through consistent error management.
- **Services**: MUST use `try-catch` blocks to handle external failures (API, DB).
- **Safe Typing**: Catch blocks MUST handle `unknown` error types safely (e.g., `error instanceof Error`).
- **Graceful Degradation**: UI MUST fail gracefully (e.g., hide broken images, show error states) rather than crashing.

## 5. Governance & Versioning (거버넌스 및 버전 관리)
- **Versioning**: This constitution follows Semantic Versioning (MAJOR.MINOR.PATCH).
- **Review**: Any architectural change violating these principles MUST requires a constitution amendment and team review.
- **Documentation**: Code MUST be documented with JSDoc, especially for public interfaces and complex logic.
