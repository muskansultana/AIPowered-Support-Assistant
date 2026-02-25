import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate, chatRequestSchema, createSessionSchema } from '../validation';

describe('validation middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      body: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  describe('validate', () => {
    it('should call next if validation passes', () => {
      const schema = z.object({
        name: z.string(),
      });

      mockRequest.body = { name: 'Test' };

      const middleware = validate(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should return 400 if validation fails', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      });

      mockRequest.body = { name: 'Test' }; // Missing age

      const middleware = validate(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Validation error',
          details: expect.any(Array),
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should include validation error details', () => {
      const schema = z.object({
        email: z.string().email(),
      });

      mockRequest.body = { email: 'invalid-email' };

      const middleware = validate(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          details: expect.arrayContaining([
            expect.objectContaining({
              path: ['email'],
            }),
          ]),
        })
      );
    });
  });

  describe('chatRequestSchema', () => {
    it('should validate valid chat request', () => {
      const validData = {
        sessionId: 'session-123',
        message: 'Hello',
      };

      const result = chatRequestSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject missing sessionId', () => {
      const invalidData = {
        message: 'Hello',
      };

      const result = chatRequestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject empty sessionId', () => {
      const invalidData = {
        sessionId: '',
        message: 'Hello',
      };

      const result = chatRequestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject missing message', () => {
      const invalidData = {
        sessionId: 'session-123',
      };

      const result = chatRequestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject empty message', () => {
      const invalidData = {
        sessionId: 'session-123',
        message: '',
      };

      const result = chatRequestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('createSessionSchema', () => {
    it('should validate with title', () => {
      const validData = {
        title: 'My Session',
      };

      const result = createSessionSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate without title', () => {
      const validData = {};

      const result = createSessionSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject non-string title', () => {
      const invalidData = {
        title: 123,
      };

      const result = createSessionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});