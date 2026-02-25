import { AIService } from '../ai.service';
import { GoogleGenAI } from '@google/genai';

jest.mock('@google/genai');

describe('AIService', () => {
  let aiService: AIService;
  let mockGenerateContent: jest.Mock;
  let mockGenerateContentStream: jest.Mock;

  beforeEach(() => {
    process.env.GOOGLE_API_KEY = 'test-key';

    mockGenerateContent = jest.fn();
    mockGenerateContentStream = jest.fn();

    (GoogleGenAI as jest.Mock).mockImplementation(() => {
      return {
        models: {
          generateContent: mockGenerateContent,
          generateContentStream: mockGenerateContentStream,
        },
      };
    });

    aiService = new AIService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateResponse', () => {
    it('should generate response successfully', async () => {
      mockGenerateContent.mockResolvedValue({
        text: 'Hello world',
        usageMetadata: { totalTokenCount: 25 },
      });

      const result = await aiService.generateResponse('Hi', 'Docs');

      expect(result.reply).toBe('Hello world');
      expect(result.tokensUsed).toBe(25);
    });

    it('should trim whitespace', async () => {
      mockGenerateContent.mockResolvedValue({
        text: '  Trim me  ',
        usageMetadata: {},
      });

      const result = await aiService.generateResponse('Hi', 'Docs');

      expect(result.reply).toBe('Trim me');
    });

    it('should return empty string if null text', async () => {
      mockGenerateContent.mockResolvedValue({
        text: null,
        usageMetadata: {},
      });

      const result = await aiService.generateResponse('Hi', 'Docs');

      expect(result.reply).toBe('');
    });

    it('should throw formatted error if API fails', async () => {
      mockGenerateContent.mockRejectedValue(new Error('API Failure'));

      await expect(
        aiService.generateResponse('Hi', 'Docs')
      ).rejects.toThrow('Failed to generate AI response: API Failure');
    });
  });

  describe('streamResponse', () => {
    it('should stream chunks', async () => {
      async function* mockStream() {
        yield { text: 'Hello ' };
        yield { text: 'World' };
      }

      mockGenerateContentStream.mockResolvedValue(mockStream());

      const chunks: string[] = [];

      for await (const chunk of aiService.streamResponse('Hi', 'Docs')) {
        chunks.push(chunk);
      }

      expect(chunks).toEqual(['Hello ', 'World']);
    });

    it('should throw formatted error if streaming fails', async () => {
      mockGenerateContentStream.mockRejectedValue(
        new Error('Stream Failure')
      );

      await expect(async () => {
        for await (const chunk of aiService.streamResponse('Hi', 'Docs')) {}
      }).rejects.toThrow(
        'Failed to stream AI response: Stream Failure'
      );
    });
  });
});