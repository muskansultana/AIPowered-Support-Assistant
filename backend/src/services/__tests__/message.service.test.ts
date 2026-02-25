import { MessageService } from '../message.service';
import { MessageModel } from '../../models/message.model';
import { SessionModel } from '../../models/session.model';
import { CreateMessageDTO, Message, Session } from '../../types';

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-1234'),
}));

jest.mock('../../models/message.model');
jest.mock('../../models/session.model');

describe('MessageService', () => {
  let messageService: MessageService;
  let mockMessageModel: jest.Mocked<MessageModel>;
  let mockSessionModel: jest.Mocked<SessionModel>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockMessageModel = new MessageModel() as jest.Mocked<MessageModel>;
    mockSessionModel = new SessionModel() as jest.Mocked<SessionModel>;

    messageService = new MessageService();
    (messageService as any).messageModel = mockMessageModel;
    (messageService as any).sessionModel = mockSessionModel;
  });

  describe('createMessage', () => {
    it('should create message successfully', async () => {
      const sessionId = 'session-123';
      const messageData: CreateMessageDTO = {
        role: 'user',
        content: 'Hello',
      };

      const session: Session = {
        id: sessionId,
        title: 'Test',
        status: 'active',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      };

      const createdMessage: Message = {
        id: 1,
        session_id: sessionId,
        role: 'user',
        content: 'Hello',
        sequence: 1,
        created_at: '2024-01-01',
      };

      mockSessionModel.findById = jest.fn().mockReturnValue(session);
      mockMessageModel.create = jest.fn().mockReturnValue(createdMessage);

      const result = await messageService.createMessage(sessionId, messageData);

      expect(mockSessionModel.findById).toHaveBeenCalledWith(sessionId);
      expect(mockMessageModel.create).toHaveBeenCalledWith(sessionId, messageData);
      expect(result).toEqual(createdMessage);
    });

    it('should throw error if session not found', async () => {
      const sessionId = 'non-existent';
      const messageData: CreateMessageDTO = {
        role: 'user',
        content: 'Hello',
      };

      mockSessionModel.findById = jest.fn().mockReturnValue(undefined);

      await expect(
        messageService.createMessage(sessionId, messageData)
      ).rejects.toThrow('Session not found');

      expect(mockMessageModel.create).not.toHaveBeenCalled();
    });

    it('should create assistant message', async () => {
      const sessionId = 'session-123';
      const messageData: CreateMessageDTO = {
        role: 'assistant',
        content: 'Response',
      };

      mockSessionModel.findById = jest.fn().mockReturnValue({} as Session);
      mockMessageModel.create = jest.fn().mockReturnValue({} as Message);

      await messageService.createMessage(sessionId, messageData);

      expect(mockMessageModel.create).toHaveBeenCalledWith(sessionId, messageData);
    });
  });

  describe('getMessagesBySessionId', () => {
    it('should return messages for a session', async () => {
      const sessionId = 'session-123';
      const messages: Message[] = [
        {
          id: 1,
          session_id: sessionId,
          role: 'user',
          content: 'Hello',
          sequence: 1,
          created_at: '2024-01-01',
        },
        {
          id: 2,
          session_id: sessionId,
          role: 'assistant',
          content: 'Hi',
          sequence: 2,
          created_at: '2024-01-01',
        },
      ];

      mockMessageModel.findBySessionId = jest.fn().mockReturnValue(messages);

      const result = await messageService.getMessagesBySessionId(sessionId);

      expect(mockMessageModel.findBySessionId).toHaveBeenCalledWith(sessionId);
      expect(result).toEqual(messages);
    });

    it('should return empty array if no messages', async () => {
      mockMessageModel.findBySessionId = jest.fn().mockReturnValue([]);

      const result = await messageService.getMessagesBySessionId('session-123');

      expect(result).toEqual([]);
    });
  });

  describe('deleteMessagesBySessionId', () => {
    it('should delete messages and return count', async () => {
      const sessionId = 'session-123';
      mockMessageModel.deleteBySessionId = jest.fn().mockReturnValue(5);

      const result = await messageService.deleteMessagesBySessionId(sessionId);

      expect(mockMessageModel.deleteBySessionId).toHaveBeenCalledWith(sessionId);
      expect(result).toBe(5);
    });

    it('should return 0 if no messages deleted', async () => {
      mockMessageModel.deleteBySessionId = jest.fn().mockReturnValue(0);

      const result = await messageService.deleteMessagesBySessionId('session-123');

      expect(result).toBe(0);
    });
  });
});