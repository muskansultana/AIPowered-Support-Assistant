import Database from 'better-sqlite3';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_PATH = process.env.DATABASE_PATH || './chat.db';

class DatabaseConnection {
  private static instance: Database.Database | null = null;

  static getInstance(): Database.Database {
    if (!this.instance) {
      this.instance = new Database(DATABASE_PATH, {
        verbose: process.env.NODE_ENV === 'development' ? console.log : undefined
      });
      
      // Enable foreign keys
      this.instance.pragma('foreign_keys = ON');
      
      console.log('✅ Database connected successfully');
    }
    return this.instance;
  }

  static close(): void {
    if (this.instance) {
      this.instance.close();
      this.instance = null;
      console.log('Database connection closed');
    }
  }
}

export default DatabaseConnection;