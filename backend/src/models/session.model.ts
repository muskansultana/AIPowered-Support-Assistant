import DatabaseConnection from '../config/database';
import { Session, CreateSessionDTO, UpdateSessionDTO } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class SessionModel {
  private db = DatabaseConnection.getInstance();

  create(data: CreateSessionDTO): Session {
    const id = uuidv4();
    const stmt = this.db.prepare(`
      INSERT INTO sessions (id, title)
      VALUES (?, ?)
    `);
    
    stmt.run(id, data.title || null);
    
    return this.findById(id)!;
  }

  findById(id: string): Session | undefined {
    const stmt = this.db.prepare('SELECT * FROM sessions WHERE id = ?');
    return stmt.get(id) as Session | undefined;
  }

  findAll(status: string = 'active'): Session[] {
    const stmt = this.db.prepare(`
      SELECT * FROM sessions 
      WHERE status = ? 
      ORDER BY updated_at DESC
    `);
    return stmt.all(status) as Session[];
  }

  update(id: string, data: UpdateSessionDTO): Session | undefined {
    const updates: string[] = [];
    const values: (string | null | undefined)[] = [];

    if (data.title !== undefined) {
      updates.push('title = ?');
      values.push(data.title);
    }

    if (data.status !== undefined) {
      updates.push('status = ?');
      values.push(data.status);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const stmt = this.db.prepare(`
      UPDATE sessions 
      SET ${updates.join(', ')}
      WHERE id = ?
    `);

    stmt.run(...values);
    return this.findById(id);
  }

  delete(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM sessions WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  softDelete(id: string): Session | undefined {
    return this.update(id, { status: 'deleted' });
  }
}