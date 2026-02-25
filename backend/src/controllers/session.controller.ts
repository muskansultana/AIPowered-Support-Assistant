import { Request, Response, NextFunction } from 'express';
import { SessionService } from '../services/session.service';
import { CreateSessionDTO, UpdateSessionDTO } from '../types';

export class SessionController {
  private sessionService = new SessionService();

  createSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data: CreateSessionDTO = req.body;
      const session = await this.sessionService.createSession(data);
      
      res.status(201).json({
        success: true,
        data: session
      });
    } catch (error) {
      next(error);
    }
  };

  getSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const session = await this.sessionService.getSessionById(id as string);
      
      if (!session) {
        res.status(404).json({
          success: false,
          error: 'Session not found'
        });
        return;
      }

      res.json({
        success: true,
        data: session
      });
    } catch (error) {
      next(error);
    }
  };

  getAllSessions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const status = (req.query.status as string) || 'active';
      const sessions = await this.sessionService.getAllSessions(status);
      
      res.json({
        success: true,
        data: sessions
      });
    } catch (error) {
      next(error);
    }
  };

  updateSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const data: UpdateSessionDTO = req.body;
      
      const session = await this.sessionService.updateSession(id as string, data);
      
      if (!session) {
        res.status(404).json({
          success: false,
          error: 'Session not found'
        });
        return;
      }

      res.json({
        success: true,
        data: session
      });
    } catch (error) {
      next(error);
    }
  };

  deleteSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const soft = req.query.soft !== 'false'; // Default to soft delete
      
      const deleted = await this.sessionService.deleteSession(id as string, soft);
      
      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Session not found'
        });
        return;
      }

      res.json({
        success: true,
        message: soft ? 'Session archived' : 'Session deleted permanently'
      });
    } catch (error) {
      next(error);
    }
  };
}