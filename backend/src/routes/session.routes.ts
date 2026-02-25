import { Router } from 'express';
import { SessionController } from '../controllers/session.controller';
import { validate, createSessionSchema, updateSessionSchema } from '../middleware/validation';
import { generalRateLimiter } from '../middleware/rateLimit';

const router = Router();
const sessionController = new SessionController();

// Apply general rate limiting to all session routes
router.use(generalRateLimiter);

router.post('/', validate(createSessionSchema), sessionController.createSession);
router.get('/', sessionController.getAllSessions);
router.get('/:id', sessionController.getSession);
router.patch('/:id', validate(updateSessionSchema), sessionController.updateSession);
router.delete('/:id', sessionController.deleteSession);

export default router;