import { Router } from 'express';
import { MessageController } from '../controllers/message.controller';
import { generalRateLimiter } from '../middleware/rateLimit';

const router = Router();
const messageController = new MessageController();

// Apply general rate limiting
router.use(generalRateLimiter);

// GET /api/conversations/:sessionId
router.get('/:sessionId', messageController.getMessages);

export default router;