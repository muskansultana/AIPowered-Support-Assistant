import { Router } from 'express';
import { ChatController } from '../controllers/chat.controller';
import { z } from 'zod';
import { validate } from '../middleware/validation';
import { chatRateLimiter } from '../middleware/rateLimit';

const router = Router();
const chatController = new ChatController();

// Validation schema
const chatRequestSchema = z.object({
  sessionId: z.string().min(1, 'sessionId is required'),
  message: z.string().min(1, 'message is required')
});

// Apply rate limiting to chat endpoints
router.post(
  '/', 
  chatRateLimiter,  // Rate limit first
  validate(chatRequestSchema), 
  chatController.chat
);

// Streaming chat endpoint (optional)
router.post(
  '/stream', 
  chatRateLimiter,  // Rate limit streaming too
  validate(chatRequestSchema), 
  chatController.chatStream
);

export default router;