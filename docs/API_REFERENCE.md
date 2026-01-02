# API Reference

**Last Updated**: Phase 1 - Initial Setup  
**Status**: 🚧 Will be populated as APIs are implemented

---

## 🎯 Overview

This document provides complete API reference for all backend endpoints.

**Base URLs:**
- Development: `http://localhost:3000/api`
- Production: `https://yourdomain.com/api`

**Authentication:**
- Supabase Auth (JWT in Authorization header)
- Anonymous access allowed for some endpoints

---

## 💬 Comments API

### `POST /api/comments`
Create a new comment on a chapter.

**Request:**
```typescript
{
  chapter_id: string;      // e.g., "ch1"
  content: string;         // Max 2000 characters
  is_anonymous?: boolean;  // Default: false
}
```

**Response:**
```typescript
{
  id: string;
  chapter_id: string;
  user_id: string | null;
  content: string;
  is_anonymous: boolean;
  created_at: string;
  author: {
    display_name: string;
    avatar_url: string | null;
  }
}
```

**Errors:**
- `400`: Invalid input
- `429`: Rate limit exceeded
- `401`: Authentication required (if is_anonymous=false)

---

### `GET /api/comments?chapter_id={id}`
Fetch all comments for a chapter.

**Query Parameters:**
- `chapter_id` (required): Chapter identifier
- `limit` (optional): Number of comments (default: 100)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
```typescript
{
  comments: [
    {
      id: string;
      chapter_id: string;
      content: string;
      is_anonymous: boolean;
      created_at: string;
      author: {
        display_name: string;
        avatar_url: string | null;
      }
    }
  ],
  total: number;
}
```

---

### `DELETE /api/comments/:id`
Delete a comment (own comments or admin).

**Authentication**: Required

**Response:**
```typescript
{ success: true }
```

**Errors:**
- `401`: Not authenticated
- `403`: Not authorized (not your comment and not admin)
- `404`: Comment not found

---

### `POST /api/comments/:id/flag`
Flag a comment for moderation.

**Request:**
```typescript
{
  reason?: string;  // Optional reason for flagging
}
```

**Response:**
```typescript
{ success: true }
```

---

## 📊 Reading Progress API

### `PUT /api/progress`
Save or update reading progress.

**Authentication**: Required

**Request:**
```typescript
{
  chapter_id: string;
  scroll_percentage: number;  // 0-100
}
```

**Response:**
```typescript
{
  id: string;
  user_id: string;
  chapter_id: string;
  scroll_percentage: number;
  updated_at: string;
}
```

---

### `GET /api/progress`
Get all reading progress for current user.

**Authentication**: Required

**Response:**
```typescript
{
  progress: [
    {
      chapter_id: string;
      scroll_percentage: number;
      updated_at: string;
    }
  ]
}
```

---

## 📧 Newsletter API

### `POST /api/newsletter/subscribe`
Subscribe to newsletter.

**Request:**
```typescript
{
  email: string;  // Valid email address
}
```

**Response:**
```typescript
{
  success: true,
  message: "Please check your email to confirm subscription."
}
```

**Errors:**
- `400`: Invalid email
- `409`: Already subscribed
- `429`: Rate limit exceeded

---

### `GET /api/newsletter/confirm?token={token}`
Confirm newsletter subscription.

**Query Parameters:**
- `token` (required): Confirmation token from email

**Response:**
HTML page with success/error message

---

### `GET /api/newsletter/unsubscribe?token={token}`
Unsubscribe from newsletter.

**Query Parameters:**
- `token` (required): Unsubscribe token from email

**Response:**
HTML page with confirmation

---

## 🖼️ OpenGraph Images

### `GET /api/og/[chapterId]`
Generate dynamic OG image for chapter.

**Path Parameters:**
- `chapterId`: Chapter identifier (e.g., "ch1")

**Response:**
- Content-Type: `image/png`
- Cache-Control: `s-maxage=86400, stale-while-revalidate`

**Example:**
```html
<meta property="og:image" content="https://yourdomain.com/api/og/ch1" />
```

---

## 🔒 Authentication (Supabase)

### Sign In with Google
```typescript
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`
  }
});
```

### Sign Out
```typescript
const { error } = await supabase.auth.signOut();
```

### Get Current User
```typescript
const { data: { user } } = await supabase.auth.getUser();
```

---

## 🛡️ Rate Limiting

All public endpoints have rate limits:

| Endpoint | Limit | Window |
|----------|-------|--------|
| POST /api/comments | 10 | 1 hour |
| POST /api/newsletter/subscribe | 5 | 1 day |
| GET /api/og/* | 100 | 1 hour |

**Rate Limit Headers:**
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1234567890
```

---

## ❌ Error Responses

All errors follow this format:

```typescript
{
  error: string;          // Error message
  code?: string;          // Error code (optional)
  details?: any;          // Additional details (optional)
}
```

**Common Error Codes:**
- `400`: Bad Request - Invalid input
- `401`: Unauthorized - Authentication required
- `403`: Forbidden - Insufficient permissions
- `404`: Not Found - Resource doesn't exist
- `429`: Too Many Requests - Rate limit exceeded
- `500`: Internal Server Error - Something went wrong

---

## 🧪 Testing

### Using cURL

**Create Comment:**
```bash
curl -X POST http://localhost:3000/api/comments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "chapter_id": "ch1",
    "content": "Great chapter!",
    "is_anonymous": false
  }'
```

**Subscribe to Newsletter:**
```bash
curl -X POST http://localhost:3000/api/newsletter/subscribe \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

---

**Status**: 🚧 In Progress (will be updated as features are implemented)  
**Next**: Implement actual API routes in subsequent phases
