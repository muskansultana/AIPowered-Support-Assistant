import { Request, Response, NextFunction } from 'express';
import { SessionController } from '../session.controller';
import { SessionService } from '../../services/session.service';
import { CreateSessionDTO, UpdateSessionDTO, Session } from '../../types';

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-1234'),
}));

jest.mock('../../services/session.service');

describe('SessionController', () => {
  let sessionController: SessionController;
  let mockSessionService: jest.Mocked<SessionService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSessionService = new SessionService() as jest.Mocked<SessionService>;
    sessionController = new SessionController();
    (sessionController as any).sessionService = mockSessionService;

    mockRequest = {
      body: {},
      params: {},
      query: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  describe('createSession', () => {
    it('should create a session successfully', async () => {
      const sessionData: CreateSessionDTO = {
        title: 'New Chat',
      };

      const createdSession: Session = {
        id: 'session-123',
        title: 'New Chat',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockRequest.body = sessionData;
      mockSessionService.createSession = jest.fn().mockResolvedValue(createdSession);

      await sessionController.createSession(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockSessionService.createSession).toHaveBeenCalledWith(sessionData);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: createdSession,
      });
    });

    it('should create session without title', async () => {
      mockRequest.body = {};
      const createdSession: Session = {
        id: 'session-123',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockSessionService.createSession = jest.fn().mockResolvedValue(createdSession);

      await sessionController.createSession(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockSessionService.createSession).toHaveBeenCalledWith({});
      expect(mockResponse.status).toHaveBeenCalledWith(201);
    });

    it('should call next with error if creation fails', async () => {
      const error = new Error('Database error');
      mockRequest.body = { title: 'Test' };
      mockSessionService.createSession = jest.fn().mockRejectedValue(error);

      await sessionController.createSession(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getSession', () => {
    it('should get session by id successfully', async () => {
      const session: Session = {
        id: 'session-123',
        title: 'Test Session',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockRequest.params = { id: 'session-123' };
      mockSessionService.getSessionById = jest.fn().mockResolvedValue(session);

      await sessionController.getSession(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockSessionService.getSessionById).toHaveBeenCalledWith('session-123');
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: session,
      });
    });

    it('should return 404 if session not found', async () => {
      mockRequest.params = { id: 'non-existent' };
      mockSessionService.getSessionById = jest.fn().mockResolvedValue(null);

      await sessionController.getSession(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Session not found',
      });
    });

    it('should call next with error if retrieval fails', async () => {
      const error = new Error('Database error');
      mockRequest.params = { id: 'session-123' };
      mockSessionService.getSessionById = jest.fn().mockRejectedValue(error);

      await sessionController.getSession(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getAllSessions', () => {
    it('should get all active sessions by default', async () => {
      const sessions: Session[] = [
        {
          id: 'session-1',
          title: 'Session 1',
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'session-2',
          title: 'Session 2',
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      mockRequest.query = {};
      mockSessionService.getAllSessions = jest.fn().mockResolvedValue(sessions);

      await sessionController.getAllSessions(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockSessionService.getAllSessions).toHaveBeenCalledWith('active');
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: sessions,
      });
    });

    it('should filter sessions by status', async () => {
      mockRequest.query = { status: 'archived' };
      mockSessionService.getAllSessions = jest.fn().mockResolvedValue([]);

      await sessionController.getAllSessions(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockSessionService.getAllSessions).toHaveBeenCalledWith('archived');
    });

    it('should return empty array if no sessions found', async () => {
      mockRequest.query = {};
      mockSessionService.getAllSessions = jest.fn().mockResolvedValue([]);

      await sessionController.getAllSessions(
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
      mockRequest.query = {};
      mockSessionService.getAllSessions = jest.fn().mockRejectedValue(error);

      await sessionController.getAllSessions(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
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
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockRequest.params = { id: 'session-123' };
      mockRequest.body = updateData;
      mockSessionService.updateSession = jest.fn().mockResolvedValue(updatedSession);

      await sessionController.updateSession(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockSessionService.updateSession).toHaveBeenCalledWith('session-123', updateData);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: updatedSession,
      });
    });

    it('should return 404 if session not found', async () => {
      mockRequest.params = { id: 'non-existent' };
      mockRequest.body = { title: 'New Title' };
      mockSessionService.updateSession = jest.fn().mockResolvedValue(null);

      await sessionController.updateSession(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Session not found',
      });
    });

    it('should update session status', async () => {
      const updateData: UpdateSessionDTO = {
        status: 'archived',
      };

      mockRequest.params = { id: 'session-123' };
      mockRequest.body = updateData;
      mockSessionService.updateSession = jest.fn().mockResolvedValue({} as Session);

      await sessionController.updateSession(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockSessionService.updateSession).toHaveBeenCalledWith('session-123', updateData);
    });

    it('should call next with error if update fails', async () => {
      const error = new Error('Database error');
      mockRequest.params = { id: 'session-123' };
      mockRequest.body = { title: 'Test' };
      mockSessionService.updateSession = jest.fn().mockRejectedValue(error);

      await sessionController.updateSession(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('deleteSession', () => {
    it('should soft delete session by default', async () => {
      mockRequest.params = { id: 'session-123' };
      mockRequest.query = {};
      mockSessionService.deleteSession = jest.fn().mockResolvedValue(true);

      await sessionController.deleteSession(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockSessionService.deleteSession).toHaveBeenCalledWith('session-123', true);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Session archived',
      });
    });

    it('should hard delete session when soft=false', async () => {
      mockRequest.params = { id: 'session-123' };
      mockRequest.query = { soft: 'false' };
      mockSessionService.deleteSession = jest.fn().mockResolvedValue(true);

      await sessionController.deleteSession(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockSessionService.deleteSession).toHaveBeenCalledWith('session-123', false);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Session deleted permanently',
      });
    });

    it('should return 404 if session not found', async () => {
      mockRequest.params = { id: 'non-existent' };
      mockRequest.query = {};
      mockSessionService.deleteSession = jest.fn().mockResolvedValue(false);

      await sessionController.deleteSession(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Session not found',
      });
    });

    it('should call next with error if deletion fails', async () => {
      const error = new Error('Database error');
      mockRequest.params = { id: 'session-123' };
      mockRequest.query = {};
      mockSessionService.deleteSession = jest.fn().mockRejectedValue(error);

      await sessionController.deleteSession(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});