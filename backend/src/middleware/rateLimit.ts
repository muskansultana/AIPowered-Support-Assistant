import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for chat endpoint
 * 20 requests per minute per IP
 */
export const chatRateLimiter = rateLimit({
  windowMs: 60000, // 1 minute
  max: 20,
  message: {
    success: false,
    error: 'Too many requests. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Rate limiter for general API endpoints
 * 100 requests per minute per IP
 */
export const generalRateLimiter = rateLimit({
  windowMs: 60000, // 1 minute
  max: 100,
  message: {
    success: false,
    error: 'Too many requests. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});