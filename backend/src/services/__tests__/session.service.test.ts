import { SessionService } from '../session.service';
import { SessionModel } from '../../models/session.model';
import { CreateSessionDTO, UpdateSessionDTO, Session } from '../../types';

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-1234'),
}));

jest.mock('../../models/session.model');

describe('SessionService', () => {
  let sessionService: SessionService;
  let mockSessionModel: jest.Mocked<SessionModel>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSessionModel = new SessionModel() as jest.Mocked<SessionModel>;
    sessionService = new SessionService();
    (sessionService as any).sessionModel = mockSessionModel;
  });

  describe('createSession', () => {
    it('should create session successfully', async () => {
      const sessionData: CreateSessionDTO = {
        title: 'New Chat',
      };

      const createdSession: Session = {
        id: 'session-123',
        title: 'New Chat',
        status: 'active',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      };

      mockSessionModel.create = jest.fn().mockReturnValue(createdSession);

      const result = await sessionService.createSession(sessionData);

      expect(mockSessionModel.create).toHaveBeenCalledWith(sessionData);
      expect(result).toEqual(createdSession);
    });

    it('should create session without title', async () => {
      const sessionData: CreateSessionDTO = {};

      mockSessionModel.create = jest.fn().mockReturnValue({} as Session);

      await sessionService.createSession(sessionData);

      expect(mockSessionModel.create).toHaveBeenCalledWith({});
    });
  });

  describe('getSessionById', () => {
    it('should return session if found', async () => {
      const session: Session = {
        id: 'session-123',
        title: 'Test',
        status: 'active',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      };

      mockSessionModel.findById = jest.fn().mockReturnValue(session);

      const result = await sessionService.getSessionById('session-123');

      expect(mockSessionModel.findById).toHaveBeenCalledWith('session-123');
      expect(result).toEqual(session);
    });

    it('should return null if session not found', async () => {
      mockSessionModel.findById = jest.fn().mockReturnValue(undefined);

      const result = await sessionService.getSessionById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getAllSessions', () => {
    it('should return all active sessions by default', async () => {
      const sessions: Session[] = [
        {
          id: '1',
          title: 'Session 1',
          status: 'active',
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
      ];

      mockSessionModel.findAll = jest.fn().mockReturnValue(sessions);

      const result = await sessionService.getAllSessions();

      expect(mockSessionModel.findAll).toHaveBeenCalledWith('active');
      expect(result).toEqual(sessions);
    });

    it('should filter by status', async () => {
      mockSessionModel.findAll = jest.fn().mockReturnValue([]);

      await sessionService.getAllSessions('archived');

      expect(mockSessionModel.findAll).toHaveBeenCalledWith('archived');
    });

    it('should return empty array if no sessions', async () => {
      mockSessionModel.findAll = jest.fn().mockReturnValue([]);

      const result = await sessionService.getAllSessions();

      expect(result).toEqual([]);
    });
  });

  describe('updateSession', () => {
    it('should update session successfully', async () => {
      const updateData: UpdateSessionDTO = {
        title: 'Updated Title',
      };

      const updatedSession: Session = {
        id: 'session-123',
        title: 'Updated Title',
        status: 'active',
        created_at: '2024-01-01',
        updated_at: '2024-01-02',
      };

      mockSessionModel.update = jest.fn().mockReturnValue(updatedSession);

      const result = await sessionService.updateSession('session-123', updateData);

      expect(mockSessionModel.update).toHaveBeenCalledWith('session-123', updateData);
      expect(result).toEqual(updatedSession);
    });

    it('should return null if session not found', async () => {
      mockSessionModel.update = jest.fn().mockReturnValue(undefined);

      const result = await sessionService.updateSession('non-existent', { title: 'Test' });

      expect(result).toBeNull();
    });

    it('should update status', async () => {
      const updateData: UpdateSessionDTO = {
        status: 'archived',
      };

      mockSessionModel.update = jest.fn().mockReturnValue({} as Session);

      await sessionService.updateSession('session-123', updateData);

      expect(mockSessionModel.update).toHaveBeenCalledWith('session-123', updateData);
    });
  });

  describe('deleteSession', () => {
    it('should soft delete by default', async () => {
      const session: Session = {
        id: 'session-123',
        title: 'Test',
        status: 'deleted',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      };

      mockSessionModel.softDelete = jest.fn().mockReturnValue(session);

      const result = await sessionService.deleteSession('session-123');

      expect(mockSessionModel.softDelete).toHaveBeenCalledWith('session-123');
      expect(result).toBe(true);
    });

    it('should hard delete when soft=false', async () => {
      mockSessionModel.delete = jest.fn().mockReturnValue(true);

      const result = await sessionService.deleteSession('session-123', false);

      expect(mockSessionModel.delete).toHaveBeenCalledWith('session-123');
      expect(result).toBe(true);
    });

    it('should return false if soft delete fails', async () => {
      mockSessionModel.softDelete = jest.fn().mockReturnValue(undefined);

      const result = await sessionService.deleteSession('session-123');

      expect(result).toBe(false);
    });

    it('should return false if hard delete fails', async () => {
      mockSessionModel.delete = jest.fn().mockReturnValue(false);

      const result = await sessionService.deleteSession('session-123', false);

      expect(result).toBe(false);
    });
  });
});