import { ChatService } from '../chat.service';
import { MessageService } from '../message.service';
import { SessionService } from '../session.service';
import { DocumentService } from '../document.service';
import { AIService } from '../ai.service';
import { ChatRequest, Session, Message } from '../../types';

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-1234'),
}));

jest.mock('../message.service');
jest.mock('../session.service');
jest.mock('../document.service');
jest.mock('../ai.service');

describe('ChatService', () => {
  let chatService: ChatService;
  let mockMessageService: jest.Mocked<MessageService>;
  let mockSessionService: jest.Mocked<SessionService>;
  let mockDocumentService: jest.Mocked<DocumentService>;
  let mockAIService: jest.Mocked<AIService>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockMessageService = new MessageService() as jest.Mocked<MessageService>;
    mockSessionService = new SessionService() as jest.Mocked<SessionService>;
    mockDocumentService = new DocumentService() as jest.Mocked<DocumentService>;
    mockAIService = new AIService() as jest.Mocked<AIService>;

    chatService = new ChatService();
    (chatService as any).messageService = mockMessageService;
    (chatService as any).sessionService = mockSessionService;
    (chatService as any).documentService = mockDocumentService;
    (chatService as any).aiService = mockAIService;
  });

  describe('handleChatRequest', () => {
    it('should handle chat request with existing session', async () => {
      const request: ChatRequest = {
        sessionId: 'existing-session',
        message: 'How do I reset my password?',
      };

      const existingSession: Session = {
        id: 'existing-session',
        title: 'Chat',
        status: 'active',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      };

      const messages: Message[] = [];
      const documentsContext = 'Documentation here';
      const aiResponse = {
        reply: 'Go to Settings > Security',
        tokensUsed: 150,
      };

      mockSessionService.getSessionById = jest.fn().mockResolvedValue(existingSession);
      mockMessageService.createMessage = jest.fn().mockResolvedValue({} as Message);
      mockMessageService.getMessagesBySessionId = jest.fn().mockResolvedValue(messages);
      mockDocumentService.getDocumentsAsContext = jest.fn().mockReturnValue(documentsContext);
      mockAIService.generateResponse = jest.fn().mockResolvedValue(aiResponse);

      const result = await chatService.handleChatRequest(request);

      expect(mockSessionService.getSessionById).toHaveBeenCalledWith('existing-session');
      expect(mockMessageService.createMessage).toHaveBeenCalledTimes(2);
      expect(result).toEqual(aiResponse);
    });

    it('should create new session if session does not exist', async () => {
      const request: ChatRequest = {
        sessionId: 'non-existent',
        message: 'Test message',
      };

      const newSession: Session = {
        id: 'new-session-id',
        title: 'New Chat',
        status: 'active',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      };

      mockSessionService.getSessionById = jest.fn().mockResolvedValue(null);
      mockSessionService.createSession = jest.fn().mockResolvedValue(newSession);
      mockMessageService.createMessage = jest.fn().mockResolvedValue({} as Message);
      mockMessageService.getMessagesBySessionId = jest.fn().mockResolvedValue([]);
      mockDocumentService.getDocumentsAsContext = jest.fn().mockReturnValue('docs');
      mockAIService.generateResponse = jest.fn().mockResolvedValue({
        reply: 'Response',
        tokensUsed: 100,
      });

      await chatService.handleChatRequest(request);

      expect(mockSessionService.createSession).toHaveBeenCalledWith({ title: 'New Chat' });
      expect(mockMessageService.createMessage).toHaveBeenCalledWith('new-session-id', {
        role: 'user',
        content: 'Test message',
      });
    });

    it('should limit conversation history to last 10 messages', async () => {
      const request: ChatRequest = {
        sessionId: 'session-123',
        message: 'Test',
      };

      const allMessages: Message[] = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        session_id: 'session-123',
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `Message ${i}`,
        sequence: i + 1,
        created_at: '2024-01-01',
      })) as Message[];

      mockSessionService.getSessionById = jest.fn().mockResolvedValue({} as Session);
      mockMessageService.createMessage = jest.fn().mockResolvedValue({} as Message);
      mockMessageService.getMessagesBySessionId = jest.fn().mockResolvedValue(allMessages);
      mockDocumentService.getDocumentsAsContext = jest.fn().mockReturnValue('docs');
      mockAIService.generateResponse = jest.fn().mockResolvedValue({
        reply: 'Response',
      });

      await chatService.handleChatRequest(request);

      const expectedHistory = allMessages.slice(-10);
      expect(mockAIService.generateResponse).toHaveBeenCalledWith(
        'Test',
        'docs',
        expectedHistory
      );
    });

    it('should save both user and assistant messages', async () => {
      const request: ChatRequest = {
        sessionId: 'session-123',
        message: 'User message',
      };

      mockSessionService.getSessionById = jest.fn().mockResolvedValue({} as Session);
      mockMessageService.createMessage = jest.fn().mockResolvedValue({} as Message);
      mockMessageService.getMessagesBySessionId = jest.fn().mockResolvedValue([]);
      mockDocumentService.getDocumentsAsContext = jest.fn().mockReturnValue('docs');
      mockAIService.generateResponse = jest.fn().mockResolvedValue({
        reply: 'AI response',
        tokensUsed: 100,
      });

      await chatService.handleChatRequest(request);

      expect(mockMessageService.createMessage).toHaveBeenNthCalledWith(1, 'session-123', {
        role: 'user',
        content: 'User message',
      });

      expect(mockMessageService.createMessage).toHaveBeenNthCalledWith(2, 'session-123', {
        role: 'assistant',
        content: 'AI response',
      });
    });

    it('should throw error if AI service fails', async () => {
      const request: ChatRequest = {
        sessionId: 'session-123',
        message: 'Test',
      };

      const error = new Error('AI service error');

      mockSessionService.getSessionById = jest.fn().mockResolvedValue({} as Session);
      mockMessageService.createMessage = jest.fn().mockResolvedValue({} as Message);
      mockMessageService.getMessagesBySessionId = jest.fn().mockResolvedValue([]);
      mockDocumentService.getDocumentsAsContext = jest.fn().mockReturnValue('docs');
      mockAIService.generateResponse = jest.fn().mockRejectedValue(error);

      await expect(chatService.handleChatRequest(request)).rejects.toThrow('AI service error');
    });
  });
});