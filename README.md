# AI-Powered Support Assistant 🤖

A full-stack AI-powered customer support chatbot application built with React, Node.js/Express, SQLite, and Google Gemini API. This project enables users to have conversations with an AI assistant that answers questions purely based on product documentation.

---

## 📋 Requirements Status

### ✅ Functional Requirements Completed:

#### 1. Frontend (React.js) ✓
- **Chat Screen Component**: Input box + Send button + message list
- **Message Bubbles**: User and assistant messages with timestamps
- **Loading State**: Visual feedback while AI generates response
- **Session Management**: 
  - Auto-generates UUIDs on first load
  - Stores sessionId in localStorage
  - Maintains conversation through same session
  - "New Chat" button to start fresh sessions
- **Timestamps**: Display conversation date/time

#### 2. Backend (Node.js + Express) ✓
- **Chat Endpoint** `POST /api/chat`
  - Accepts: `{ sessionId, message }`
  - Returns: `{ reply, tokensUsed }`
  - Document-based answering
  - Session context management

- **Fetch Conversation** `GET /api/conversations/:sessionId`
  - Returns all messages for a session
  - Chronologically ordered

- **List Sessions** `GET /api/sessions`
  - Returns all active sessions
  - Includes timestamps

#### 3. SQLite Database ✓
- **sessions table**: id, created_at, updated_at, title, status
- **messages table**: id, session_id, role, content, sequence, created_at
- **Indexes**: Optimized for query performance
- Foreign key constraints and cascading deletes

#### 4. Document-Based Answering ✓
- **docs.json**: Sample FAQs loaded at startup
- **AI Rules**:
  - Generates responses ONLY from documentation
  - Responds "Sorry, I don't have information about that." for out-of-scope queries
  - Strict no-hallucination policy
  - Context-aware responses using conversation history

#### 5. Context & Memory ✓
- Maintains last 10 messages (5 user+assistant pairs) as context
- Context loaded from SQLite, not in-memory
- Threaded conversation flow

#### 6. Prompting Requirement ✓
- Backend constructs prompts with:
  - Full product documentation
  - Recent chat history (last 5 pairs)
  - Current user message
  - Strict instructions to stay document-focused

#### 7. Rate Limiting + Error Handling ✓
- **Rate Limiting**:
  - Chat endpoint: 10 requests/15 minutes per IP
  - General endpoints: 30 requests/15 minutes per IP
  - Configurable via environment variables

- **Error Handling**:
  - Missing sessionId/message validation
  - LLM API error recovery
  - Database connection failures
  - Clean JSON error responses
  - User-friendly error messages in UI

---

## 🏗️ Project Structure

```
chatbot/
├── chat-backend/                 # Node.js/Express backend
│   ├── src/
│   │   ├── index.ts             # Main server entry point
│   │   ├── config/
│   │   │   └── database.ts      # Database configuration
│   │   ├── controllers/         # Request handlers
│   │   │   ├── chat.controller.ts
│   │   │   ├── message.controller.ts
│   │   │   └── session.controller.ts
│   │   ├── services/            # Business logic
│   │   │   ├── chat.service.ts      # Chat orchestration
│   │   │   ├── ai.service.ts         # Google Gemini integration
│   │   │   ├── document.service.ts   # Documentation management
│   │   │   ├── message.service.ts    # Message persistence
│   │   │   └── session.service.ts    # Session management
│   │   ├── models/              # Database models
│   │   ├── routes/              # API routes
│   │   ├── middleware/          # Express middleware
│   │   │   ├── errorHandler.ts
│   │   │   ├── rateLimit.ts
│   │   │   └── validation.ts
│   │   ├── types/               # TypeScript interfaces
│   │   └── database/
│   │       ├── init.ts          # Database initialization
│   │       └── schema.sql       # Database schema
│   ├── docs.json               # Product documentation
│   ├── package.json
│   ├── tsconfig.json
│   └── eslint.config.mjs
│
├── frontend/                    # React TypeScript frontend
│   ├── public/
│   │   ├── index.html
│   │   └── manifest.json
│   ├── src/
│   │   ├── index.tsx           # React entry point
│   │   ├── App.tsx             # Main App component
│   │   ├── api.ts              # API integration layer
│   │   ├── types.ts            # TypeScript types
│   │   ├── utils.ts            # Utility functions
│   │   ├── components/         # React components
│   │   │   ├── ChatWindow.tsx  # Main chat interface
│   │   │   ├── ChatInput.tsx   # Message input form
│   │   │   └── MessageBubble.tsx # Message display
│   │   ├── App.css
│   │   └── index.css
│   ├── package.json
│   └── tsconfig.json
│
└── README.md                    # This file
```

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js (v16+)
- npm or yarn
- Google Generative AI API key

### Backend Setup

1. **Install dependencies**
   ```bash
   cd chat-backend
   npm install
   ```

2. **Configure environment variables**
   Create a `.env` file in `chat-backend/`:
   ```env
   PORT=8000
   NODE_ENV=development
   GOOGLE_API_KEY=your_google_gemini_api_key_here
   GOOGLE_MODEL=gemini-1.5-flash
   MAX_TOKENS=2000
   TEMPERATURE=0.7
   CORS_ORIGIN=http://localhost:3000
   ```

3. **Initialize database**
   ```bash
   npm run db:init
   ```

4. **Start the server**
   ```bash
   npm run dev
   ```
   Server will run on `http://localhost:8000`

### Frontend Setup

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Configure environment variables** (optional)
   Create a `.env` file in `frontend/`:
   ```env
   REACT_APP_API_URL=http://localhost:8000/api
   ```

3. **Start the development server**
   ```bash
   npm start
   ```
   Frontend will open at `http://localhost:3000`

---

## 📡 API Documentation

### Base URL
```
http://localhost:8000/api
```

### Endpoints

#### 1. Send Message
```http
POST /api/chat
```

**Request:**
```json
{
  "sessionId": "uuid-string",
  "message": "How do I reset my password?"
}
```

**Response (200):**
```json
{
  "success": true,
  "reply": "Users can reset their password from Settings > Security...",
  "tokensUsed": 142
}
```

**Error (400):**
```json
{
  "success": false,
  "error": "sessionId and message are required"
}
```

---

#### 2. Fetch Conversation
```http
GET /api/conversations/:sessionId
```

**Response (200):**
```json
[
  {
    "id": 1,
    "session_id": "uuid",
    "role": "user",
    "content": "How do I reset my password?",
    "sequence": 1,
    "created_at": "2024-02-24T10:30:00Z"
  },
  {
    "id": 2,
    "session_id": "uuid",
    "role": "assistant",
    "content": "You can reset your password from...",
    "sequence": 2,
    "created_at": "2024-02-24T10:30:05Z"
  }
]
```

---

#### 3. List Sessions
```http
GET /api/sessions
```

**Response (200):**
```json
[
  {
    "id": "session-uuid-1",
    "created_at": "2024-02-24T10:00:00Z",
    "updated_at": "2024-02-24T10:45:00Z",
    "title": "Session 1",
    "status": "active"
  }
]
```

---

## 📚 Database Schema

### sessions table
```sql
CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    title TEXT,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'archived', 'deleted'))
);
```

### messages table
```sql
CREATE TABLE messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    sequence INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);
```

### Indexes
- `idx_messages_session_id`: Fast lookups by session
- `idx_messages_session_sequence`: Ordered retrieval
- `idx_sessions_status`: Filter by status
- `idx_sessions_updated_at`: Sort by recency

---

## 📝 Product Documentation (docs.json)

The `docs.json` file contains FAQs that the AI uses to answer questions:

```json
[
  {
    "id": "reset-password",
    "title": "Reset Password",
    "content": "Users can reset their password from Settings > Security..."
  },
  {
    "id": "refund-policy",
    "title": "Refund Policy",
    "content": "Refunds are allowed within 30 days of purchase..."
  }
]
```

**Key Points:**
- All AI responses are generated ONLY from this documentation
- Missing topics result in "Sorry, I don't have information about that."
- Can be updated without restarting the server (reload functionality exists)

---

## 🔐 Key Implementation Details

### Session Management
- Sessions are created **automatically** when a user sends their first message
- sessionId is stored in browser localStorage for persistence
- Each session maintains independent conversation history
- "New Chat" button generates a new UUID and clears the conversation

### Context Window
- Last 10 messages (5 user+assistant pairs) are sent to the LLM for context
- This ensures coherent multi-turn conversations
- All messages are persisted in SQLite

### Document-Only Responses
The system uses a strict system prompt that:
1. Loads all documentation at startup
2. Instructs the AI to ONLY use provided docs
3. Enforces "Sorry, I don't have information about that." responses for out-of-scope queries
4. Prevents hallucination through explicit instructions

Example system prompt:
```
You are a customer support assistant. You must ONLY answer questions based on 
the following product documentation:

[Full documentation here]

STRICT RULES:
1. ONLY use information from the documentation above
2. If asked about something NOT in the docs, respond EXACTLY with: 
   "Sorry, I don't have information about that."
3. Do NOT make up, guess, or hallucinate any information
```

### Rate Limiting Strategy
- **Chat Endpoint**: 10 requests per 15 minutes per IP (to protect LLM usage)
- **Other Endpoints**: 30 requests per 15 minutes per IP
- IP detected from `X-Forwarded-For` header (proxy-aware)
- Configurable through environment variables

### Error Handling Flow
```
User Action
    ↓
Validation (Zod schemas)
    ↓
Rate Limiting Check
    ↓
Business Logic
    ↓
Database Operations
    ↓
LLM API Call
    ↓
Error? → Clean JSON response + UI notification
Success? → Persist & Return data
```

---

## 🔧 Environment Variables

### Backend (.env)
```env
# Server
PORT=8000
NODE_ENV=development
DATABASE_PATH=./chat.db

# Google Gemini API
GOOGLE_API_KEY=your_api_key_here
GOOGLE_MODEL=gemini-2.5-flash
MAX_TOKENS=2000
TEMPERATURE=0.7

# CORS
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_CHAT_MAX=20
RATE_LIMIT_CHAT_WINDOW_MS=60000
RATE_LIMIT_GENERAL_MAX=100
RATE_LIMIT_GENERAL_WINDOW_MS=60000
```

**AI Model Notes**: 
- Uses **Google Generative AI Gemini 2.5 Flash** - Latest, fastest model with improved performance
- Falling back to `gemini-pro` is also supported if availability issues occur
- Make sure `GOOGLE_API_KEY` is set to a valid API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:8000/api
```

---

## 🧪 Testing the Application

### Manual Testing Checklist

1. **Session Management**
   - [ ] Refresh page → same sessionId persists
   - [ ] New Chat → new sessionId generated
   - [ ] Messages load after refresh

2. **Chat Messaging**
   - [ ] Send "How do I reset my password?" → Get doc-based response
   - [ ] Send "Tell me a joke" → Get "Sorry, I don't have information..."
   - [ ] Loading indicator appears while fetching

3. **Error Handling**
   - [ ] Disconnect backend → Error message displays
   - [ ] Invalid message → Error notification
   - [ ] Rate limit exceeded → 429 error handling

4. **UI/UX**
   - [ ] Messages scroll to bottom automatically
   - [ ] Timestamps display correctly
   - [ ] Send button disabled while loading
   - [ ] Empty state message shows on new session

---

## 📊 Performance Considerations

- **Message Retrieval**: O(1) lookups via indexed session_id
- **Rate Limiting**: Redis could replace in-memory store for scalability
- **Document Loading**: Loaded once at startup; could use embeddings for similarity search (bonus feature)
- **Context Limit**: Kept to 5 pairs (10 messages) to reduce LLM costs

---

## 🔮 Bonus Features Implemented/Available

### Implemented:
- ✅ Rate limiting (IP-based)
- ✅ Proper error handling
- ✅ Database persistence
- ✅ Session management
- ✅ Context history

### Available for Enhancement:
- Embeddings + Vector similarity search (replace full docs approach)
- Markdown rendering in assistant replies
- User authentication
- Message search/filtering
- Download conversation as PDF
- Admin dashboard for docs management

---

## 🛠️ Development Commands

### Backend
```bash
cd chat-backend

# Development mode (auto-reload)
npm run dev

# Production build
npm run build

# Start production server
npm start

# Initialize database
npm run db:init

# Lint code
npm run lint
```

### Frontend
```bash
cd frontend

# Development server
npm start

# Production build
npm run build

# Run tests
npm test

# Eject (not recommended)
npm run eject
```

---

## 🐛 Troubleshooting

### Backend won't start
- Check if port 8000 is already in use
- Verify GOOGLE_API_KEY is set in .env
- Run `npm install` to ensure dependencies are installed

### AI response failing (Model not found error)
- Ensure `GOOGLE_MODEL=gemini-2.5-flash` in .env (recommended)
- Alternative models: `gemini-pro` or `gemini-1.5-flash`
- Verify your Google API key has access to the Generative AI API
- Check https://aistudio.google.com/app/apikey to validate your API key
- Try regenerating credentials if the issue persists

### Frontend can't connect to backend
- Verify backend is running on port 8000
- Check REACT_APP_API_URL is correct in frontend .env
- Check browser console for CORS errors
- Ensure `CORS_ORIGIN` in backend .env includes frontend URL (http://localhost:3000)

### Database errors
- Delete `chat.db` and run `npm run db:init` again
- Check file permissions in the project directory

### Rate limiting too strict
- Adjust `CHAT_RATE_LIMIT` and `GENERAL_RATE_LIMIT` in backend .env
- Check X-Forwarded-For header if behind a proxy

### Chat not scrolling to bottom
- Check browser zoom level
- Clear browser cache and hard refresh (Ctrl+Shift+R)

---

## 📄 File Structure Explanation

### Backend Architecture

**Controllers**: Handle HTTP requests/responses
- `chat.controller.ts`: Validates chat requests
- `session.controller.ts`: Manages sessions
- `message.controller.ts`: Fetch conversations

**Services**: Core business logic
- `chat.service.ts`: Orchestrates chat flow
- `ai.service.ts`: Calls Google Gemini API
- `document.service.ts`: Manages FAQ documentation
- `message.service.ts`: Database operations for messages
- `session.service.ts`: Database operations for sessions

**Models**: Database interactions
- Direct database queries using better-sqlite3

**Middleware**: Request processing
- `validation.ts`: Zod schema validation
- `rateLimit.ts`: Rate limiting logic
- `errorHandler.ts`: Global error handler

### Frontend Architecture

**Components**:
- `ChatWindow.tsx`: Main chat interface (state management, message display)
- `ChatInput.tsx`: Message input and send logic
- `MessageBubble.tsx`: Individual message styling

**Utilities**:
- `api.ts`: Axios wrapper for backend API calls
- `utils.ts`: Helper functions (session management, formatting)
- `types.ts`: TypeScript interfaces

---

## 📱 UI Components Breakdown

### ChatWindow (Main Container)
- Centered card layout with rounded corners
- Header with purple gradient accent
- Title "🤖 Chat Assistant" and session info
- "New Chat" button with hover effect
- Auto-scrolling message area
- Loading indicator with bounce animation
- Error banner with warning styling
- Session timestamps display

### ChatInput (Message Form)
- Textarea with dynamic height (grows up to 120px)
- Keyboard support:
  - **Enter**: Send message
  - **Shift+Enter**: New line
- Purple submit button with hover effect
- Proper disabled states while loading
- Form submission handling

### MessageBubble (Individual Message)
- **User Messages**: 
  - Right-aligned purple (#667eea) background
  - White text for contrast
  - Subtle box shadow
- **Assistant Messages**: 
  - Left-aligned light gray (#f1f3f5) background
  - Dark text (#1a1a1a) for readability
  - Same shadow styling
- **Timestamps**: Small gray text, time-only format
- **Text Handling**: Proper word wrapping, line breaks preserved

### Visual Hierarchy
- Large header (28px) for title
- Regular body text (14px) for messages
- Small text (12-13px) for metadata
- Proper spacing between messages (8px gap)

---

## 🎨 Styling Approach

- **CSS**: Inline styles in components + CSS files for global styling
- **Layout**: Centered chat container with responsive flexbox design
- **Color Scheme** (Modern Purple Theme):
  - Primary Action: #667eea (Purple Blue)
  - User Messages: #667eea (Purple Blue)
  - Assistant Messages: #f1f3f5 (Light Gray)
  - Background Gradient: #667eea → #764ba2 (Purple gradient)
  - Borders & Accents: #dee2e6, #e9ecef
  - Error Messages: #ffc107 (Amber warning)
  - Text Primary: #1a1a1a, Text Secondary: #6c757d

- **Container**: 
  - Centered on screen with max-width 900px
  - Rounded corners with 12px border-radius
  - Elegant box shadow for depth
  - 95vh height with 800px max-height

- **Responsiveness**: 
  - Flexbox-based layout that adapts to screen size
  - Textarea grows with content (max 120px)
  - Messages wrap with proper spacing

- **Interactive Elements**: 
  - Smooth transitions (0.2s) on hover
  - Button hover states with color changes
  - Custom scrollbar styling (thin, rounded)
  - Loading animations (bounce effect)

- **Typography**:
  - System fonts for optimal rendering
  - Proper font sizes and line heights for readability
  - Font weights for visual hierarchy

---

## 📦 Deployment Notes

### Frontend (Vercel/Netlify)
```bash
- Set REACT_APP_API_URL to production backend URL
- npm run build
- Deploy build/ folder
```

### Backend (Render/Railway)
```bash
- Set NODE_ENV=production
- Set GOOGLE_API_KEY to production key
- Set CORS_ORIGIN to production frontend URL
- Database file will persist on server
```

---

## 🔄 Recent Updates & Changes

### Latest Upgrade (v1.2.0)
- ✅ **Gemini 2.5 Flash Model**: Upgraded to Google's latest AI model for faster responses and better accuracy
- ✅ **Improved Performance**: Faster inference times and better understanding of complex queries
- ✅ **Enhanced Rate Limits**: Now supporting 20 chat requests and 100 general requests per window

### Previous Improvements (v1.1.0)
- ✅ Fixed React Hook dependencies using `useCallback` for `loadConversation`
- ✅ Fixed TypeScript CSS error (paddingHorizontal → padding)
- ✅ Updated Google Gemini model from `gemini-1.5-flash` to `gemini-pro` for better compatibility
- ✅ Enhanced error handling in API layer with response type checking
- ✅ Improved fetchConversation to handle wrapped API responses correctly

### UI/UX Enhancements
- ✅ **Centered Layout**: Chat positioned in center of screen with max-width constraints
- ✅ **Modern Color Scheme**: Gradient purple background (#667eea → #764ba2)
- ✅ **Professional Styling**: Updated to modern design standards
- ✅ **Better Colors**:
  - Purple buttons and user messages (#667eea)
  - Light gray assistant messages (#f1f3f5)
  - Amber warning for errors (#ffc107)
  - Subtle borders and shadows
- ✅ **Improved Interactions**: Hover effects, smooth transitions, custom scrollbars
- ✅ **Better Typography**: Proper font sizes, weights, and line heights
- ✅ **Loading States**: Animated bounce indicators, disabled form states
- ✅ **Error UX**: Better dismissible error messages with icons

---

## ✅ Requirements Validation

| Requirement | Status | Notes |
|---|---|---|
| React Frontend | ✅ | TypeScript, component-based, modern styling |
| Node.js Backend | ✅ | Express, TypeScript, improved error handling |
| SQLite Database | ✅ | Schema optimized with indexes |
| Chat Endpoint | ✅ | /api/chat with validation |
| Fetch Conversation | ✅ | /api/conversations/:sessionId |
| List Sessions | ✅ | /api/sessions |
| Session Handling | ✅ | UUID-based, localStorage, centered UI |
| Document-Only Answers | ✅ | Strict LLM prompt rules, gemini-pro model |
| Context Management | ✅ | Last 5 pairs stored in SQLite |
| Rate Limiting | ✅ | IP-based per endpoint |
| Error Handling | ✅ | Validation + try-catch blocks + UI notifications |
| UI/UX Styling | ✅ | Centered layout, modern design, purple theme |
| README | ✅ | Comprehensive documentation |
| docs.json | ✅ | Sample FAQs provided |

---

## 👨‍💻 Code Quality

- **Language**: TypeScript for type safety across frontend and backend
- **Linting**: ESLint configured with proper rule enforcement
- **React Hooks**: Proper dependency management with useCallback
- **Error Handling**: Comprehensive try-catch blocks, middleware error handling, user-friendly notifications
- **Validation**: Zod schemas for input validation, type-safe API responses
- **Database**: Foreign keys, cascade deletes, indexed queries for performance
- **Security**: CORS enabled with origin checking, rate limiting per IP, input validation
- **API Integration**: Proper error interception, response type checking, fallback handling
- **Component Structure**: Clean separation of concerns, reusable components
- **Styling**: Consistent design system, proper CSS organization, responsive flexbox layout

---

## 📝 License

This project is created as part of the Weitredge assignment.

---

**Last Updated**: February 24, 2026  
**Version**: 1.2.0  
**Status**: ✅ Complete, Optimized, and Ready for Production

### Version History
- **v1.2.0** - Upgraded to Gemini 2.5 Flash (latest model)
- **v1.1.0** - UI/UX improvements, React Hook fixes, Model compatibility update
- **v1.0.0** - Initial implementation
"# AIPowered-Support-Assistant" 
