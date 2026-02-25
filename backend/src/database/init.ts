import fs from 'fs';
import path from 'path';
import DatabaseConnection from '../config/database';

const initializeDatabase = (): void => {
  try {
    const db = DatabaseConnection.getInstance();
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    
    db.exec(schema);
    
    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  }
};

// Run if executed directly
if (require.main === module) {
  initializeDatabase();
  DatabaseConnection.close();
}

export default initializeDatabase;