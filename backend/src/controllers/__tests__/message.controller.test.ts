import { Request, Response, NextFunction } from 'express';
import { MessageController } from '../message.controller';
import { MessageService } from '../../services/message.service';
import { DocumentService } from '../../services/document.service';
import { AIService } from '../../services/ai.service';
import { CreateMessageDTO, Message } from '../../types';

// Mock all dependencies
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-1234'),
}));

jest.mock('../../services/message.service');
jest.mock('../../services/document.service');
jest.mock('../../services/ai.service');

describe('MessageController', () => {
  let messageController: MessageController;
  let mockMessageService: jest.Mocked<MessageService>;
  let mockDocumentService: jest.Mocked<DocumentService>;
  let mockAIService: jest.Mocked<AIService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();

    mockMessageService = new MessageService() as jest.Mocked<MessageService>;
    mockDocumentService = new DocumentService() as jest.Mocked<DocumentService>;
    mockAIService = new AIService() as jest.Mocked<AIService>;

    messageController = new MessageController();
    (messageController as any).messageService = mockMessageService;
    (messageController as any).documentService = mockDocumentService;
    (messageController as any).aiService = mockAIService;

    mockRequest = {
      body: {},
      params: {},
      query: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
      write: jest.fn().mockReturnThis(),
      end: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  describe('createMessage', () => {
    it('should create a message successfully', async () => {
      const sessionId = 'session-123';
      const messageData: CreateMessageDTO = {
        role: 'user',
        content: 'Hello, world!',
      };

      const createdMessage: Message = {
        id: 1,
        session_id: sessionId,
        role: 'user',
        content: 'Hello, world!',
        sequence: 1,
        created_at: new Date().toISOString(),
      };

      mockRequest.params = { sessionId };
      mockRequest.body = messageData;
      mockMessageService.createMessage = jest.fn().mockResolvedValue(createdMessage);

      await messageController.createMessage(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockMessageService.createMessage).toHaveBeenCalledWith(sessionId, messageData);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: createdMessage,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with error if message creation fails', async () => {
      const error = new Error('Database error');
      mockRequest.params = { sessionId: 'session-123' };
      mockRequest.body = { role: 'user', content: 'Test' };
      mockMessageService.createMessage = jest.fn().mockRejectedValue(error);

      await messageController.createMessage(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });

  describe('createMessageWithAI', () => {
    it('should create message and generate AI response', async () => {
      const sessionId = 'session-123';
      const messageData: CreateMessageDTO = {
        role: 'user',
        content: 'How do I reset my password?',
      };

      const userMessage: Message = {
        id: 1,
        session_id: sessionId,
        role: 'user',
        content: messageData.content,
        sequence: 1,
        created_at: new Date().toISOString(),
      };

      const assistantMessage: Message = {
        id: 2,
        session_id: sessionId,
        role: 'assistant',
        content: 'You can reset your password from Settings > Security.',
        sequence: 2,
        created_at: new Date().toISOString(),
      };

      const conversationHistory: Message[] = [userMessage];
      const documentsContext = 'Product documentation here...';

      mockRequest.params = { sessionId };
      mockRequest.body = messageData;

      mockMessageService.createMessage = jest
        .fn()
        .mockResolvedValueOnce(userMessage)
        .mockResolvedValueOnce(assistantMessage);
      mockMessageService.getMessagesBySessionId = jest.fn().mockResolvedValue(conversationHistory);
      mockDocumentService.getDocumentsAsContext = jest.fn().mockReturnValue(documentsContext);
      mockAIService.generateResponse = jest.fn().mockResolvedValue({
        reply: assistantMessage.content,
        tokensUsed: 150,
      });

      await messageController.createMessageWithAI(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockMessageService.createMessage).toHaveBeenCalledTimes(2);
      expect(mockMessageService.getMessagesBySessionId).toHaveBeenCalledWith(sessionId);
      expect(mockDocumentService.getDocumentsAsContext).toHaveBeenCalled();
      expect(mockAIService.generateResponse).toHaveBeenCalledWith(
        messageData.content,
        documentsContext,
        conversationHistory
      );
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          userMessage,
          assistantMessage,
        },
      });
    });

    it('should limit conversation history to last 10 messages', async () => {
      const sessionId = 'session-123';
      const messageData: CreateMessageDTO = {
        role: 'user',
        content: 'Test message',
      };

      // Create 15 messages
      const allMessages: Message[] = Array.from({ length: 15 }, (_, i) => ({
        id: i + 1,
        session_id: sessionId,
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `Message ${i + 1}`,
        sequence: i + 1,
        created_at: new Date().toISOString(),
      })) as Message[];

      mockRequest.params = { sessionId };
      mockRequest.body = messageData;

      mockMessageService.createMessage = jest.fn().mockResolvedValue(allMessages[0]);
      mockMessageService.getMessagesBySessionId = jest.fn().mockResolvedValue(allMessages);
      mockDocumentService.getDocumentsAsContext = jest.fn().mockReturnValue('docs');
      mockAIService.generateResponse = jest.fn().mockResolvedValue({
        reply: 'Response',
      });

      await messageController.createMessageWithAI(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      const expectedHistory = allMessages.slice(-10);
      expect(mockAIService.generateResponse).toHaveBeenCalledWith(
        messageData.content,
        'docs',
        expectedHistory
      );
    });

    it('should call next with error if AI generation fails', async () => {
      const error = new Error('AI service error');
      mockRequest.params = { sessionId: 'session-123' };
      mockRequest.body = { role: 'user', content: 'Test' };

      mockMessageService.createMessage = jest.fn().mockResolvedValue({} as Message);
      mockMessageService.getMessagesBySessionId = jest.fn().mockResolvedValue([]);
      mockDocumentService.getDocumentsAsContext = jest.fn().mockReturnValue('docs');
      mockAIService.generateResponse = jest.fn().mockRejectedValue(error);

      await messageController.createMessageWithAI(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('streamMessageWithAI', () => {
    it('should stream AI response chunks', async () => {
      const sessionId = 'session-123';
      const messageData: CreateMessageDTO = {
        role: 'user',
        content: 'Test streaming',
      };

      async function* mockGenerator() {
        yield 'Hello';
        yield ' ';
        yield 'World';
      }

      mockRequest.params = { sessionId };
      mockRequest.body = messageData;

      mockMessageService.createMessage = jest.fn().mockResolvedValue({} as Message);
      mockMessageService.getMessagesBySessionId = jest.fn().mockResolvedValue([]);
      mockDocumentService.getDocumentsAsContext = jest.fn().mockReturnValue('docs');
      mockAIService.streamResponse = jest.fn().mockReturnValue(mockGenerator());

      await messageController.streamMessageWithAI(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'text/event-stream');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-cache');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Connection', 'keep-alive');

      expect(mockResponse.write).toHaveBeenCalledWith(
        `data: ${JSON.stringify({ content: 'Hello' })}\n\n`
      );
      expect(mockResponse.write).toHaveBeenCalledWith(
        `data: ${JSON.stringify({ content: ' ' })}\n\n`
      );
      expect(mockResponse.write).toHaveBeenCalledWith(
        `data: ${JSON.stringify({ content: 'World' })}\n\n`
      );
      expect(mockResponse.write).toHaveBeenCalledWith(
        `data: ${JSON.stringify({ done: true })}\n\n`
      );
      expect(mockResponse.end).toHaveBeenCalled();

      expect(mockMessageService.createMessage).toHaveBeenCalledTimes(2);
      expect(mockMessageService.createMessage).toHaveBeenLastCalledWith(sessionId, {
        role: 'assistant',
        content: 'Hello World',
      });
    });

    it('should handle streaming errors', async () => {
      const error = new Error('Streaming error');
      mockRequest.params = { sessionId: 'session-123' };
      mockRequest.body = { role: 'user', content: 'Test' };

      async function* mockGenerator() {
        throw error;
      }

      mockMessageService.createMessage = jest.fn().mockResolvedValue({} as Message);
      mockMessageService.getMessagesBySessionId = jest.fn().mockResolvedValue([]);
      mockDocumentService.getDocumentsAsContext = jest.fn().mockReturnValue('docs');
      mockAIService.streamResponse = jest.fn().mockReturnValue(mockGenerator());

      await messageController.streamMessageWithAI(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getMessages', () => {
    it('should get all messages for a session', async () => {
      const sessionId = 'session-123';
      const messages: Message[] = [
        {
          id: 1,
          session_id: sessionId,
          role: 'user',
          content: 'Hello',
          sequence: 1,
          created_at: new Date().toISOString(),
        },
        {
          id: 2,
          session_id: sessionId,
          role: 'assistant',
          content: 'Hi there!',
          sequence: 2,
          created_at: new Date().toISOString(),
        },
      ];

      mockRequest.params = { sessionId };
      mockMessageService.getMessagesBySessionId = jest.fn().mockResolvedValue(messages);

      await messageController.getMessages(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockMessageService.getMessagesBySessionId).toHaveBeenCalledWith(sessionId);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: messages,
      });
    });

    it('should return empty array if no messages found', async () => {
      mockRequest.params = { sessionId: 'session-123' };
      mockMessageService.getMessagesBySessionId = jest.fn().mockResolvedValue([]);

      await messageController.getMessages(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: [],
      });
    });

    it('should call next with error if retrieval fails', async () => {
      const error = new Error('Database error');
      mockRequest.params = { sessionId: 'session-123' };
      mockMessageService.getMessagesBySessionId = jest.fn().mockRejectedValue(error);

      await messageController.getMessages(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});