import { Request, Response, NextFunction } from 'express';
import { ChatController } from '../chat.controller';
import { ChatService } from '../../services/chat.service';
import { ChatRequest, ChatResponse } from '../../types';

// Mock uuid before other imports
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mocked-uuid-1234'),
}));

// Mock the ChatService
jest.mock('../../services/chat.service');

describe('ChatController', () => {
  let chatController: ChatController;
  let mockChatService: jest.Mocked<ChatService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Create mock ChatService
    mockChatService = new ChatService() as jest.Mocked<ChatService>;

    // Create ChatController instance
    chatController = new ChatController();
    
    // Replace the chatService with our mock
    (chatController as any).chatService = mockChatService;

    // Setup mock request
    mockRequest = {
      body: {},
      params: {},
      query: {},
    };

    // Setup mock response
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
      write: jest.fn().mockReturnThis(),
      end: jest.fn().mockReturnThis(),
    };

    // Setup mock next function
    mockNext = jest.fn();
  });

  describe('chat', () => {
    it('should return 400 if sessionId is missing', async () => {
      mockRequest.body = {
        message: 'Hello',
      };

      await chatController.chat(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'sessionId and message are required',
      });
      expect(mockChatService.handleChatRequest).not.toHaveBeenCalled();
    });

    it('should return 400 if message is missing', async () => {
      mockRequest.body = {
        sessionId: 'session-123',
      };

      await chatController.chat(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'sessionId and message are required',
      });
      expect(mockChatService.handleChatRequest).not.toHaveBeenCalled();
    });

    it('should return 400 if both sessionId and message are missing', async () => {
      mockRequest.body = {};

      await chatController.chat(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'sessionId and message are required',
      });
    });

    it('should successfully process chat request and return response', async () => {
      const chatRequest: ChatRequest = {
        sessionId: 'session-123',
        message: 'How do I reset my password?',
      };

      const chatResponse: ChatResponse = {
        reply: 'You can reset your password from Settings > Security.',
        tokensUsed: 150,
      };

      mockRequest.body = chatRequest;
      mockChatService.handleChatRequest = jest.fn().mockResolvedValue(chatResponse);

      await chatController.chat(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockChatService.handleChatRequest).toHaveBeenCalledWith(chatRequest);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        reply: chatResponse.reply,
        tokensUsed: chatResponse.tokensUsed,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle empty sessionId', async () => {
      mockRequest.body = {
        sessionId: '',
        message: 'Hello',
      };

      await chatController.chat(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'sessionId and message are required',
      });
    });

    it('should handle empty message', async () => {
      mockRequest.body = {
        sessionId: 'session-123',
        message: '',
      };

      await chatController.chat(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'sessionId and message are required',
      });
    });

    it('should call next with error if chatService throws error', async () => {
      const chatRequest: ChatRequest = {
        sessionId: 'session-123',
        message: 'Hello',
      };

      const error = new Error('Service error');
      mockRequest.body = chatRequest;
      mockChatService.handleChatRequest = jest.fn().mockRejectedValue(error);

      await chatController.chat(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockChatService.handleChatRequest).toHaveBeenCalledWith(chatRequest);
      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('should handle response without tokensUsed', async () => {
      const chatRequest: ChatRequest = {
        sessionId: 'session-123',
        message: 'Test message',
      };

      const chatResponse: ChatResponse = {
        reply: 'Test reply',
      };

      mockRequest.body = chatRequest;
      mockChatService.handleChatRequest = jest.fn().mockResolvedValue(chatResponse);

      await chatController.chat(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        reply: 'Test reply',
      });
    });
  });

  describe('chatStream', () => {
    it('should return 400 if sessionId is missing', async () => {
      mockRequest.body = {
        message: 'Hello',
      };

      await chatController.chatStream(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'sessionId and message are required',
      });
    });

    it('should return 400 if message is missing', async () => {
      mockRequest.body = {
        sessionId: 'session-123',
      };

      await chatController.chatStream(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'sessionId and message are required',
      });
    });

    it('should set correct headers for streaming', async () => {
      const chatRequest: ChatRequest = {
        sessionId: 'session-123',
        message: 'Hello',
      };

      mockRequest.body = chatRequest;

      // Mock async generator
      async function* mockGenerator() {
        yield 'Hello';
        yield ' World';
      }

      mockChatService.handleStreamingChatRequest = jest.fn().mockReturnValue(mockGenerator());

      await chatController.chatStream(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'text/event-stream');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-cache');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Connection', 'keep-alive');
    });

    it('should stream chunks and send done message', async () => {
      const chatRequest: ChatRequest = {
        sessionId: 'session-123',
        message: 'Hello',
      };

      mockRequest.body = chatRequest;

      // Mock async generator with multiple chunks
      async function* mockGenerator() {
        yield 'Hello';
        yield ' ';
        yield 'World';
      }

      mockChatService.handleStreamingChatRequest = jest.fn().mockReturnValue(mockGenerator());

      await chatController.chatStream(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockChatService.handleStreamingChatRequest).toHaveBeenCalledWith(chatRequest);
      
      // Verify each chunk was written
      expect(mockResponse.write).toHaveBeenCalledWith(
        `data: ${JSON.stringify({ content: 'Hello' })}\n\n`
      );
      expect(mockResponse.write).toHaveBeenCalledWith(
        `data: ${JSON.stringify({ content: ' ' })}\n\n`
      );
      expect(mockResponse.write).toHaveBeenCalledWith(
        `data: ${JSON.stringify({ content: 'World' })}\n\n`
      );
      
      // Verify done message
      expect(mockResponse.write).toHaveBeenCalledWith(
        `data: ${JSON.stringify({ done: true })}\n\n`
      );
      
      expect(mockResponse.end).toHaveBeenCalled();
    });

    it('should handle empty stream', async () => {
      const chatRequest: ChatRequest = {
        sessionId: 'session-123',
        message: 'Hello',
      };

      mockRequest.body = chatRequest;

      // Mock empty async generator
      async function* mockGenerator() {
        // Empty generator
      }

      mockChatService.handleStreamingChatRequest = jest.fn().mockReturnValue(mockGenerator());

      await chatController.chatStream(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Should only have done message
      expect(mockResponse.write).toHaveBeenCalledWith(
        `data: ${JSON.stringify({ done: true })}\n\n`
      );
      expect(mockResponse.end).toHaveBeenCalled();
    });

    it('should call next with error if streaming fails', async () => {
      const chatRequest: ChatRequest = {
        sessionId: 'session-123',
        message: 'Hello',
      };

      mockRequest.body = chatRequest;

      const error = new Error('Streaming error');

      // Mock async generator that throws
      async function* mockGenerator() {
        throw error;
      }

      mockChatService.handleStreamingChatRequest = jest.fn().mockReturnValue(mockGenerator());

      await chatController.chatStream(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should handle single chunk stream', async () => {
      const chatRequest: ChatRequest = {
        sessionId: 'session-123',
        message: 'Hello',
      };

      mockRequest.body = chatRequest;

      async function* mockGenerator() {
        yield 'Single response';
      }

      mockChatService.handleStreamingChatRequest = jest.fn().mockReturnValue(mockGenerator());

      await chatController.chatStream(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.write).toHaveBeenCalledTimes(2); // 1 chunk + done
      expect(mockResponse.write).toHaveBeenCalledWith(
        `data: ${JSON.stringify({ content: 'Single response' })}\n\n`
      );
    });
  });
});