import fs from 'fs';
import path from 'path';
import { Document } from '../types';

export class DocumentService {
  private documents: Document[] = [];
  private docsPath: string;

  constructor(docsPath: string = 'docs.json') {
    this.docsPath = path.resolve(docsPath);
    this.loadDocuments();
  }

  /**
   * Load documents from docs.json
   */
  private loadDocuments(): void {
    try {
      const fileContent = fs.readFileSync(this.docsPath, 'utf-8');
      this.documents = JSON.parse(fileContent);
      console.log(`✅ Loaded ${this.documents.length} documents from ${this.docsPath}`);
    } catch (error) {
      console.error('❌ Error loading documents:', error);
      throw new Error('Failed to load product documentation', { cause: error });
    }
  }

  /**
   * Get all documents
   */
  getAllDocuments(): Document[] {
    return this.documents;
  }

  /**
   * Get documents as formatted text for LLM context
   */
  getDocumentsAsContext(): string {
    return this.documents
      .map((doc) => `Title: ${doc.title}\nContent: ${doc.content}`)
      .join('\n\n---\n\n');
  }

  /**
   * Search for relevant documents (simple keyword matching)
   * This can be enhanced with embeddings for bonus points
   */
  searchDocuments(query: string): Document[] {
    const lowerQuery = query.toLowerCase();
    
    // Return empty array for empty query
    if (!lowerQuery) {
      return [];
    }
    
    return this.documents.filter(doc => {
      const titleMatch = doc.title.toLowerCase().includes(lowerQuery);
      const contentMatch = doc.content.toLowerCase().includes(lowerQuery);
      return titleMatch || contentMatch;
    });
  }

  /**
   * Reload documents (useful if docs.json is updated)
   */
  reloadDocuments(): void {
    this.loadDocuments();
  }
}