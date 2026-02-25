import DatabaseConnection from '../config/database';
import { Message, CreateMessageDTO } from '../types';

export class MessageModel {
  private db = DatabaseConnection.getInstance();

  create(sessionId: string, data: CreateMessageDTO): Message {
    // Get next sequence number
    const seqStmt = this.db.prepare(`
      SELECT COALESCE(MAX(sequence), 0) + 1 as next_seq 
      FROM messages 
      WHERE session_id = ?
    `);
    const { next_seq } = seqStmt.get(sessionId) as { next_seq: number };

    // Insert message
    const insertStmt = this.db.prepare(`
      INSERT INTO messages (session_id, role, content, sequence)
      VALUES (?, ?, ?, ?)
    `);
    
    const result = insertStmt.run(sessionId, data.role, data.content, next_seq);

    // Update session's updated_at
    const updateSessionStmt = this.db.prepare(`
      UPDATE sessions 
      SET updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);
    updateSessionStmt.run(sessionId);

    return this.findById(result.lastInsertRowid as number)!;
  }

  findById(id: number): Message | undefined {
    const stmt = this.db.prepare('SELECT * FROM messages WHERE id = ?');
    return stmt.get(id) as Message | undefined;
  }

  findBySessionId(sessionId: string): Message[] {
    const stmt = this.db.prepare(`
      SELECT * FROM messages 
      WHERE session_id = ? 
      ORDER BY sequence ASC, created_at ASC
    `);
    return stmt.all(sessionId) as Message[];
  }

  deleteBySessionId(sessionId: string): number {
    const stmt = this.db.prepare('DELETE FROM messages WHERE session_id = ?');
    const result = stmt.run(sessionId);
    return result.changes;
  }
}