import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

export const createSessionSchema = z.object({
  title: z.string().optional()
});

export const updateSessionSchema = z.object({
  title: z.string().optional(),
  status: z.enum(['active', 'archived', 'deleted']).optional()
});

export const createMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1, 'Content is required')
});

export const chatRequestSchema = z.object({
  sessionId: z.string().min(1, 'sessionId is required'),
  message: z.string().min(1, 'message is required')
});

export const validate = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.issues
        });
        return;
      }
      next(error);
    }
  };
};