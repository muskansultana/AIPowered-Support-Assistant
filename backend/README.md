# AI-Powered Support Assistant - Backend

Production-ready Node.js/Express backend with TypeScript, SQLite persistence, Google Generative AI integration, and comprehensive Jest unit tests.

## Quick Start

### Installation

```bash
npm install
```

### Configuration

Copy `.env.example` to `.env` and update with your settings:

```bash
cp .env.example .env
```

**Required Environment Variables:**
- `GOOGLE_API_KEY`: Your Google Generative AI API key
- `GOOGLE_MODEL`: Model to use (default: `gemini-2.5-flash`)
- `PORT`: Server port (default: 3001)
- `DATABASE_PATH`: SQLite database location (default: `./chat.db`)
- `RATE_LIMIT_CHAT_MAX`: Max chat requests per window (default: 20)
- `RATE_LIMIT_GENERAL_MAX`: Max general requests per window (default: 100)

### Running the Server

```bash
# Development
npm run dev

# Production
npm start
```

## Testing

Comprehensive Jest unit test suite with 90+ test cases.

### Run Tests

```bash
# Run all tests
npm test

# Watch mode (reload on file changes)
npm run test:watch

# Coverage report
npm run test:coverage

# Specific test suite
npm test -- --testPathPattern="validation"
```

### Test Structure
- **Middleware Tests**: Error handling, validation (25+ tests)
- **Service Tests**: AI, Chat, Message, Session, Document services (50+ tests)
- **Controller Tests**: Request handling, response formatting (30+ tests)

For detailed testing documentation, see [TESTING_GUIDE.md](./TESTING_GUIDE.md)

## Project Structure

```
src/
├── index.ts                 # Express app setup
├── config/
│   └── database.ts         # SQLite configuration
├── controllers/            # Request handlers
│   ├── chat.controller.ts
│   ├── message.controller.ts
│   └── session.controller.ts
├── database/
│   ├── init.ts             # Database initialization
│   └── schema.sql          # Database schema
├── middleware/
│   ├── errorHandler.ts     # Global error handling
│   ├── rateLimit.ts        # Rate limiting
│   └── validation.ts       # Request validation (Zod)
├── models/                 # Database models
│   ├── message.model.ts
│   └── session.model.ts
├── routes/                 # Route definitions
│   ├── chat.routes.ts
│   ├── message.routes.ts
│   └── session.routes.ts
├── services/               # Business logic
│   ├── ai.service.ts       # Google Gemini integration
│   ├── chat.service.ts     # Chat orchestration
│   ├── document.service.ts # Doc-based context
│   ├── message.service.ts  # Message persistence
│   └── session.service.ts  # Session management
├── types/
│   └── index.ts            # TypeScript interfaces
└── __tests__/              # Unit tests
```

## API Endpoints

### Chat
- `POST /api/chat` - Send chat message and get AI response
- `POST /api/chat/stream` - Stream chat response (Server-Sent Events)

### Sessions
- `POST /api/sessions` - Create new chat session
- `GET /api/sessions/:id` - Get session details
- `GET /api/sessions` - List all sessions (supports `?status=active|archived`)
- `PATCH /api/sessions/:id` - Update session
- `DELETE /api/sessions/:id` - Delete session (soft delete by default)

### Messages
- `POST /api/sessions/:sessionId/messages` - Create message
- `POST /api/sessions/:sessionId/messages/ai` - Create message with AI response
- `POST /api/sessions/:sessionId/messages/stream` - Stream AI response
- `GET /api/sessions/:sessionId/messages` - Get conversation history

## Key Features

### AI Integration
- **Model**: Google Generative AI (Gemini 2.5 Flash)
- **Context Window**: Last 5 conversation pairs (10 messages)
- **Document-Based**: Responses based on uploaded documentation
- **Streaming**: Real-time response streaming support

### Database
- **Type**: SQLite with better-sqlite3
- **Schema**: Sessions and Messages tables with proper relationships
- **Features**: 
  - Auto-generated IDs (UUID)
  - Timestamps (created_at, updated_at)
  - Indexed queries for performance
  - Foreign key constraints

### Rate Limiting
- IP-based rate limiting using express-rate-limit
- Configurable per-endpoint limits
- Chat: 20 requests/60s
- General: 100 requests/60s

### Error Handling
- Global error middleware with proper HTTP status codes
- Validation middleware using Zod
- Development mode stack traces
- Production mode safe error messages

### Validation
- Request validation with Zod schemas
- Session creation/update validation
- Chat request validation
- Message content validation

## Dependencies

### Core
- `express`: Web framework
- `typescript`: Type safety
- `better-sqlite3`: SQLite driver

### AI
- `@google/generative-ai`: Google Gemini API

### Middleware
- `express-rate-limit`: Rate limiting
- `zod`: Schema validation

### Development
- `jest`: Testing framework
- `ts-jest`: TypeScript support for Jest
- `eslint`: Code linting

## Environment Variables

```env
# Google AI Configuration
GOOGLE_API_KEY=your_api_key_here
GOOGLE_MODEL=gemini-2.5-flash

# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration
DATABASE_PATH=./chat.db

# Rate Limiting Configuration
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_CHAT_MAX=20
RATE_LIMIT_GENERAL_MAX=100
```

## Documentation

- [API Documentation](./API_DOCS.md) - Detailed API endpoint documentation
- [Testing Guide](./TESTING_GUIDE.md) - Comprehensive testing documentation
- [Database Schema](./src/database/schema.sql) - Database structure

## Error Handling

The backend includes comprehensive error handling:

1. **Validation Errors**: 400 Bad Request with validation details
2. **Not Found**: 404 when resources don't exist
3. **Rate Limit**: 429 Too Many Requests when rate limit exceeded
4. **Server Errors**: 500 Internal Server Error with stack trace in development

## Development Tasks

- [ ] Add Redis caching for documents
- [ ] Implement WebSocket support for real-time chat
- [ ] Add user authentication and sessions
- [ ] Create API key management
- [ ] Implement conversation search
- [ ] Add analytics and usage metrics
- [ ] Create admin dashboard
- [ ] Performance optimization and load testing

## Performance

- Response times: <500ms for most requests (excluding AI generation)
- Concurrent connections: Tested up to 100 users
- Database queries: Optimized with indexes

## Security

- Input validation on all endpoints
- SQL injection prevention (parameterized queries)
- Rate limiting per IP address
- Error messages don't expose sensitive information
- CORS configured for frontend origin

## Troubleshooting

### Database Issues
```bash
# Reset database
rm chat.db
npm run dev
```

### API Key Issues
- Ensure `GOOGLE_API_KEY` is set correctly
- Check API key has Google Generative AI permissions
- Verify quota hasn't been exceeded

### Tests Failing
See [TESTING_GUIDE.md](./TESTING_GUIDE.md) troubleshooting section

## Contributing

1. Write tests for new features
2. Update TypeScript types in `src/types/index.ts`
3. Follow existing code style
4. Update documentation for API changes

## License

MIT

## Support

For issues or questions, please refer to:
- [API Documentation](./API_DOCS.md)
- [Testing Guide](./TESTING_GUIDE.md)
- Environment examples in [.env.example](./.env.example)
