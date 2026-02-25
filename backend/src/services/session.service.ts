import { SessionModel } from '../models/session.model';
import { CreateSessionDTO, UpdateSessionDTO, Session } from '../types';

export class SessionService {
  private sessionModel = new SessionModel();

  async createSession(data: CreateSessionDTO): Promise<Session> {
    return this.sessionModel.create(data);
  }

  async getSessionById(id: string): Promise<Session | null> {
    const session = this.sessionModel.findById(id);
    return session || null;
  }

  async getAllSessions(status: string = 'active'): Promise<Session[]> {
    return this.sessionModel.findAll(status);
  }

  async updateSession(id: string, data: UpdateSessionDTO): Promise<Session | null> {
    const session = this.sessionModel.update(id, data);
    return session || null;
  }

  async deleteSession(id: string, soft: boolean = true): Promise<boolean> {
    if (soft) {
      const session = this.sessionModel.softDelete(id);
      return !!session;
    }
    return this.sessionModel.delete(id);
  }
}