# API Documentation - AI Support Assistant

## Base URL
```
http://localhost:8000/api
```

## Authentication
No authentication required. Rate limiting is applied per IP address.

## AI Model
The backend uses **Google Generative AI (Gemini 2.5 Flash)** for generating responses. This is the latest, fastest model with improved performance and accuracy. Responses are strictly based on product documentation provided in `docs.json`. The model will not provide information outside the documentation scope.

---

## Endpoints

### 1. Health Check
**Endpoint:** `GET /health`

**Description:** Check if the server is running

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-02-24T10:30:00.000Z"
}
```

**Status Code:** `200 OK`

---

### 2. Send Message & Get AI Response
**Endpoint:** `POST /api/chat`

**Description:** Send a user message and receive an AI response based on product documentation

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "message": "How can I reset my password?"
}
```

**Request Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `sessionId` | string | ✅ | Unique session identifier (UUID format) |
| `message` | string | ✅ | User's message/question (min 1 character) |

**Successful Response (200 OK):**
```json
{
  "success": true,
  "reply": "Users can reset their password from Settings > Security > Change Password. Click the 'Forgot Password' link on the login page or go to your account settings and click 'Reset Password'. You will receive an email with instructions to create a new password. The reset link expires in 24 hours.",
  "tokensUsed": 185
}
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Operation status |
| `reply` | string | AI-generated response |
| `tokensUsed` | number | Gemini API tokens consumed |

**Error Responses:**

**400 Bad Request** - Missing required fields:
```json
{
  "success": false,
  "error": "sessionId and message are required"
}
```

**429 Too Many Requests** - Rate limit exceeded:
```json
{
  "success": false,
  "error": "Too many requests, please try again later"
}
```

**500 Internal Server Error** - Server or LLM error:
```json
{
  "success": false,
  "error": "Failed to generate response. Please try again."
}
```

**Rate Limit:**
- 10 requests per 15 minutes per IP address
- Headers include remaining quota info

**Example cURL:**
```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "message": "How do I update my payment method?"
  }'
```

**Example JavaScript:**
```javascript
const response = await fetch('http://localhost:8000/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sessionId: '550e8400-e29b-41d4-a716-446655440000',
    message: 'How do I cancel my subscription?'
  })
});
const data = await response.json();
console.log(data.reply);
```

---

### 3. Fetch Conversation History
**Endpoint:** `GET /api/conversations/:sessionId`

**Description:** Retrieve all messages for a specific session in chronological order

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `sessionId` | string | ✅ | Unique session identifier (UUID) |

**Query Parameters:** None

**Successful Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "session_id": "550e8400-e29b-41d4-a716-446655440000",
      "role": "user",
      "content": "How do I reset my password?",
      "sequence": 1,
      "created_at": "2024-02-24T10:30:00.000Z"
    },
    {
      "id": 2,
      "session_id": "550e8400-e29b-41d4-a716-446655440000",
      "role": "assistant",
      "content": "Users can reset their password from Settings > Security...",
      "sequence": 2,
      "created_at": "2024-02-24T10:30:05.123Z"
    }
  ]
}
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Operation status |
| `data` | array | Array of message objects |

**Message Object Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `id` | number | Message unique identifier |
| `session_id` | string | Associated session ID |
| `role` | string | Either `"user"` or `"assistant"` |
| `content` | string | Message text content |
| `sequence` | number | Order within conversation |
| `created_at` | string | ISO 8601 timestamp |

**Empty Conversation (200 OK):**
```json
{
  "success": true,
  "data": []
}
```

**Error Responses:**

**404 Not Found** - Session doesn't exist (no messages):
```json
{
  "success": true,
  "data": []
}
```

**500 Internal Server Error** - Database error:
```json
{
  "success": false,
  "error": "Failed to fetch conversation"
}
```

**Rate Limit:**
- 30 requests per 15 minutes per IP address

**Example cURL:**
```bash
curl http://localhost:8000/api/conversations/550e8400-e29b-41d4-a716-446655440000
```

**Example JavaScript:**
```javascript
const sessionId = '550e8400-e29b-41d4-a716-446655440000';
const response = await fetch(
  `http://localhost:8000/api/conversations/${sessionId}`
);
const messages = await response.json();
messages.forEach(msg => {
  console.log(`[${msg.role}] ${msg.content}`);
});
```

---

### 4. List All Sessions
**Endpoint:** `GET /api/sessions`

**Description:** Retrieve all active sessions with metadata

**Query Parameters:** None

**Successful Response (200 OK):**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "created_at": "2024-02-24T10:00:00.000Z",
    "updated_at": "2024-02-24T10:45:30.000Z",
    "title": "New Chat",
    "status": "active"
  },
  {
    "id": "662f9511-f40c-52e5-b827-557766551111",
    "created_at": "2024-02-24T09:15:00.000Z",
    "updated_at": "2024-02-24T09:30:00.000Z",
    "title": "New Chat",
    "status": "active"
  }
]
```

**Response Array Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Session unique identifier (UUID) |
| `created_at` | string | Session creation timestamp (ISO 8601) |
| `updated_at` | string | Last activity timestamp (ISO 8601) |
| `title` | string | Session title |
| `status` | string | Session status: `"active"`, `"archived"`, or `"deleted"` |

**Empty Response (200 OK):**
```json
[]
```

**Error Response:**

**500 Internal Server Error** - Database error:
```json
{
  "success": false,
  "error": "Failed to fetch sessions"
}
```

**Rate Limit:**
- 30 requests per 15 minutes per IP address

**Example cURL:**
```bash
curl http://localhost:8000/api/sessions
```

**Example JavaScript:**
```javascript
const response = await fetch('http://localhost:8000/api/sessions');
const sessions = await response.json();
console.log(`Active sessions: ${sessions.length}`);
sessions.forEach(session => {
  console.log(`${session.id} - Updated: ${session.updated_at}`);
});
```

---

### 5. Create New Session
**Endpoint:** `POST /api/sessions`

**Description:** Create a new chat session

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Sales Inquiry"
}
```

**Request Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `title` | string | ❌ | Session title (optional, default: "New Chat") |

**Successful Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "created_at": "2024-02-24T10:30:00.000Z",
    "updated_at": "2024-02-24T10:30:00.000Z",
    "title": "Sales Inquiry",
    "status": "active"
  }
}
```

**Error Responses:**

**400 Bad Request**:
```json
{
  "success": false,
  "error": "Invalid request body"
}
```

**500 Internal Server Error**:
```json
{
  "success": false,
  "error": "Failed to create session"
}
```

**Rate Limit:**
- 30 requests per 15 minutes per IP address

---

### 6. Get Session Details
**Endpoint:** `GET /api/sessions/:id`

**Description:** Retrieve details for a specific session

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | ✅ | Session ID (UUID) |

**Successful Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "created_at": "2024-02-24T10:30:00.000Z",
    "updated_at": "2024-02-24T10:45:30.000Z",
    "title": "Sales Inquiry",
    "status": "active"
  }
}
```

**Error Responses:**

**404 Not Found**:
```json
{
  "success": false,
  "error": "Session not found"
}
```

---

## Common Error Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request format or missing fields |
| 404 | Not Found | Resource not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Server Error | Internal server error |
| 503 | Service Unavailable | LLM API unavailable |

---

## Rate Limiting

### Chat Endpoint
- **Limit:** 10 requests per 15 minutes per IP
- **Headers:** Includes X-RateLimit-* headers
- **Response on limit:** 429 Too Many Requests

### Other Endpoints
- **Limit:** 30 requests per 15 minutes per IP
- **Headers:** Includes X-RateLimit-* headers
- **Response on limit:** 429 Too Many Requests

**Rate Limit Headers:**
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 9
X-RateLimit-Reset: 1708761030
```

---

## Response Formats

### Success Response Format
```json
{
  "success": true,
  "data": {},
  "message": "Operation successful"
}
```

### Error Response Format
```json
{
  "success": false,
  "error": "Error description",
  "message": "Additional context if available"
}
```

---

## Session Management Best Practices

1. **Generate SessionId on First Load**
   - Client creates UUID (v4) once
   - Store in localStorage
   - Reuse for all subsequent requests in same session

2. **New Chat Workflow**
   - Generate new UUID
   - Update localStorage with new sessionId
   - Start fresh conversation (no history loaded)

3. **Handle Session Errors**
   - If session doesn't exist, backend creates it automatically
   - Check response for successful status
   - Fallback to new session if needed

4. **Maintain Conversation History**
   - Load messages via GET /api/conversations/:sessionId on app start
   - Append new messages as they're received
   - Persist locally for instant UI updates

---

## Example Workflow

```javascript
// 1. Initialize session on first load
let sessionId = localStorage.getItem('sessionId');
if (!sessionId) {
  sessionId = generateUUID();
  localStorage.setItem('sessionId', sessionId);
}

// 2. Load existing conversation
const response = await fetch(`/api/conversations/${sessionId}`);
const messages = await response.json();

// 3. Send new message
const chatResponse = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ sessionId, message: userInput })
});

// 4. Process response and update UI
const data = await chatResponse.json();
addMessageToUI(data.reply, 'assistant');

// 5. Create new session when needed
const newSessionId = generateUUID();
localStorage.setItem('sessionId', newSessionId);
messages = []; // Clear messages
```

---

## Testing with Postman/cURL

### Import Collection URL
Available in repository's `postman-collection.json`

### Quick Test Scenario
```bash
# 1. Send a message
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"test-session-001","message":"What is your refund policy?"}'

# 2. Get conversation
curl http://localhost:8000/api/conversations/test-session-001

# 3. List all sessions
curl http://localhost:8000/api/sessions
```

---

**API Version:** 1.2  
**Last Updated:** February 24, 2026

### Recent Changes (v1.2)
- ✅ Upgraded to Google Generative AI Gemini 2.5 Flash (latest, fastest model)
- ✅ Improved response time and quality
- ✅ Better support for complex queries

### Previous Changes (v1.1)
- ✅ Fixed `/api/conversations/:sessionId` response format (now wrapped with `{ success, data }`)
- ✅ Updated AI model from `gemini-1.5-flash` to `gemini-pro` for better compatibility
- ✅ Improved error handling and response consistency
- ✅ Enhanced documentation with wrapped response examples
