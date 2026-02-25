import fs from 'fs';
import path from 'path';
import { DocumentService } from '../document.service';
import { Document } from '../../types';

jest.mock('fs');
jest.mock('path');

describe('DocumentService', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('constructor', () => {
    it('should load documents successfully', () => {
      const mockDocuments: Document[] = [
        { id: '1', title: 'Doc 1', content: 'Content 1' },
        { id: '2', title: 'Doc 2', content: 'Content 2' },
      ];

      (path.resolve as jest.Mock).mockReturnValue('/path/to/docs.json');
      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockDocuments));

      const service = new DocumentService();

      expect(service.getAllDocuments()).toEqual(mockDocuments);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Loaded 2 documents')
      );
    });

    it('should use default path if not provided', () => {
      (path.resolve as jest.Mock).mockReturnValue('/resolved/docs.json');
      (fs.readFileSync as jest.Mock).mockReturnValue('[]');

      new DocumentService();

      expect(path.resolve).toHaveBeenCalledWith('docs.json');
    });

    it('should use custom path if provided', () => {
      (path.resolve as jest.Mock).mockReturnValue('/custom/path/docs.json');
      (fs.readFileSync as jest.Mock).mockReturnValue('[]');

      new DocumentService('/custom/path/docs.json');

      expect(path.resolve).toHaveBeenCalledWith('/custom/path/docs.json');
    });

    it('should throw error if file cannot be read', () => {
      (path.resolve as jest.Mock).mockReturnValue('/path/to/docs.json');
      (fs.readFileSync as jest.Mock).mockImplementation(() => {
        throw new Error('File not found');
      });

      expect(() => new DocumentService()).toThrow('Failed to load product documentation');
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should throw error if JSON is invalid', () => {
      (path.resolve as jest.Mock).mockReturnValue('/path/to/docs.json');
      (fs.readFileSync as jest.Mock).mockReturnValue('invalid json');

      expect(() => new DocumentService()).toThrow('Failed to load product documentation');
    });
  });

  describe('getAllDocuments', () => {
    it('should return all documents', () => {
      const mockDocuments: Document[] = [
        { id: '1', title: 'Doc 1', content: 'Content 1' },
        { id: '2', title: 'Doc 2', content: 'Content 2' },
      ];

      (path.resolve as jest.Mock).mockReturnValue('/path/to/docs.json');
      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockDocuments));

      const service = new DocumentService();
      const result = service.getAllDocuments();

      expect(result).toEqual(mockDocuments);
      expect(result).toHaveLength(2);
    });

    it('should return empty array if no documents', () => {
      (path.resolve as jest.Mock).mockReturnValue('/path/to/docs.json');
      (fs.readFileSync as jest.Mock).mockReturnValue('[]');

      const service = new DocumentService();
      const result = service.getAllDocuments();

      expect(result).toEqual([]);
    });
  });

  describe('getDocumentsAsContext', () => {
    it('should format documents as context string', () => {
      const mockDocuments: Document[] = [
        { id: '1', title: 'Password Reset', content: 'Go to Settings > Security' },
        { id: '2', title: 'Account Deletion', content: 'Go to Settings > Account' },
      ];

      (path.resolve as jest.Mock).mockReturnValue('/path/to/docs.json');
      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockDocuments));

      const service = new DocumentService();
      const result = service.getDocumentsAsContext();

      expect(result).toContain('Title: Password Reset');
      expect(result).toContain('Content: Go to Settings > Security');
      expect(result).toContain('---');
      expect(result).toContain('Title: Account Deletion');
    });

    it('should return empty string if no documents', () => {
      (path.resolve as jest.Mock).mockReturnValue('/path/to/docs.json');
      (fs.readFileSync as jest.Mock).mockReturnValue('[]');

      const service = new DocumentService();
      const result = service.getDocumentsAsContext();

      expect(result).toBe('');
    });

    it('should handle special characters in content', () => {
      const mockDocuments: Document[] = [
        { id: '1', title: 'Test', content: 'Content with\nnewlines\tand\ttabs' },
      ];

      (path.resolve as jest.Mock).mockReturnValue('/path/to/docs.json');
      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockDocuments));

      const service = new DocumentService();
      const result = service.getDocumentsAsContext();

      expect(result).toContain('Content with\nnewlines\tand\ttabs');
    });
  });

  describe('searchDocuments', () => {
    let service: DocumentService;
    const mockDocuments: Document[] = [
      { id: '1', title: 'Password Reset', content: 'Reset your password from Settings' },
      { id: '2', title: 'Account Settings', content: 'Manage your account preferences' },
      { id: '3', title: 'Two-Factor Auth', content: 'Enable 2FA for security' },
    ];

    beforeEach(() => {
      (path.resolve as jest.Mock).mockReturnValue('/path/to/docs.json');
      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockDocuments));
      service = new DocumentService();
    });

    it('should find documents by title match', () => {
      const result = service.searchDocuments('password');

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Password Reset');
    });

    it('should find documents by content match', () => {
      const result = service.searchDocuments('security');

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Two-Factor Auth');
    });

    it('should find multiple documents', () => {
      const result = service.searchDocuments('settings');

      expect(result).toHaveLength(2);
    });

    it('should be case insensitive', () => {
      const result1 = service.searchDocuments('PASSWORD');
      const result2 = service.searchDocuments('password');

      expect(result1).toEqual(result2);
    });

    it('should return empty array if no matches', () => {
      const result = service.searchDocuments('nonexistent');

      expect(result).toEqual([]);
    });

    it('should handle empty query', () => {
      const result = service.searchDocuments('');

      expect(result).toHaveLength(0);
    });

    it('should match partial words', () => {
      const result = service.searchDocuments('pass');

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Password Reset');
    });
  });

  describe('reloadDocuments', () => {
    it('should reload documents from file', () => {
      const initialDocs: Document[] = [
        { id: '1', title: 'Doc 1', content: 'Content 1' },
      ];

      const updatedDocs: Document[] = [
        { id: '1', title: 'Doc 1', content: 'Updated Content' },
        { id: '2', title: 'Doc 2', content: 'New Document' },
      ];

      (path.resolve as jest.Mock).mockReturnValue('/path/to/docs.json');
      (fs.readFileSync as jest.Mock)
        .mockReturnValueOnce(JSON.stringify(initialDocs))
        .mockReturnValueOnce(JSON.stringify(updatedDocs));

      const service = new DocumentService();
      expect(service.getAllDocuments()).toHaveLength(1);

      service.reloadDocuments();
      expect(service.getAllDocuments()).toHaveLength(2);
      expect(service.getAllDocuments()[0].content).toBe('Updated Content');
    });

    it('should throw error if reload fails', () => {
      (path.resolve as jest.Mock).mockReturnValue('/path/to/docs.json');
      (fs.readFileSync as jest.Mock)
        .mockReturnValueOnce('[]')
        .mockImplementationOnce(() => {
          throw new Error('File not found');
        });

      const service = new DocumentService();

      expect(() => service.reloadDocuments()).toThrow('Failed to load product documentation');
    });
  });
});