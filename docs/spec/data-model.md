# Data Model

## Entities

### News
Represents a curated news article with AI summary.

| Field | Type | Required | Description | Constraints |
|-------|------|----------|-------------|-------------|
| id | string | Yes | UUID | PK |
| title | string | Yes | Article title | |
| url | string | Yes | Original link | Unique |
| source | string | Yes | Publisher name | |
| publishedAt | DateTime | Yes | Article date | |
| summary | string | No | AI generated summary | |
| imageUrl | string | No | Thumbnail URL | |
| categoryId | string | Yes | FK to Category | |
| createdAt | DateTime | Yes | Record creation | |

### Category
Represents a news topic for classification and fetching.

| Field | Type | Required | Description | Constraints |
|-------|------|----------|-------------|-------------|
| id | string | Yes | UUID/Slug | PK |
| name | string | Yes | Display name | Unique |
| searchQuery | string | Yes | Query for NewsAPI | |
| isDefault | boolean | Yes | Default visibility | Default false |
| createdAt | DateTime | Yes | Record creation | |

### SystemSetting
Key-value store for application configuration.

| Field | Type | Required | Description | Constraints |
|-------|------|----------|-------------|-------------|
| key | string | Yes | Config Key | PK |
| value | string | Yes | Config Value | |
| updatedAt | DateTime | Yes | Last modified | |

## Relationships

- **Category has many News**: One category can contain multiple news articles. `News.categoryId` reference `Category.id`.

## Validation Rules

- **News URL**: Must be a valid URL format.
- **Category Name**: Must not be empty.
- **Search Query**: Must not be empty (required for fetching).
