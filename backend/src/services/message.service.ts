import { MessageModel } from '../models/message.model';
import { SessionModel } from '../models/session.model';
import { CreateMessageDTO, Message } from '../types';

export class MessageService {
  private messageModel = new MessageModel();
  private sessionModel = new SessionModel();

  async createMessage(sessionId: string, data: CreateMessageDTO): Promise<Message> {
    // Verify session exists
    const session = this.sessionModel.findById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    return this.messageModel.create(sessionId, data);
  }

  async getMessagesBySessionId(sessionId: string): Promise<Message[]> {
    return this.messageModel.findBySessionId(sessionId);
  }

  async deleteMessagesBySessionId(sessionId: string): Promise<number> {
    return this.messageModel.deleteBySessionId(sessionId);
  }
}