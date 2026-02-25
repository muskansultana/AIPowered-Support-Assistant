import { Request, Response, NextFunction } from 'express';
import { ChatService } from '../services/chat.service';
import { ChatRequest } from '../types';

export class ChatController {
  private chatService = new ChatService();

  /**
   * POST /api/chat
   * Handle chat request with AI response
   */
  chat = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const chatRequest: ChatRequest = req.body;

      // Validate request
      if (!chatRequest.sessionId || !chatRequest.message) {
        res.status(400).json({
          success: false,
          error: 'sessionId and message are required'
        });
        return;
      }

      // Process chat
      const response = await this.chatService.handleChatRequest(chatRequest);

      res.json({
        success: true,
        ...response
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/chat/stream
   * Stream chat response
   */
  chatStream = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const chatRequest: ChatRequest = req.body;

      if (!chatRequest.sessionId || !chatRequest.message) {
        res.status(400).json({
          success: false,
          error: 'sessionId and message are required'
        });
        return;
      }

      // Set headers for streaming
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      // Stream response
      for await (const chunk of this.chatService.handleStreamingChatRequest(chatRequest)) {
        res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
      }

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      next(error);
    }
  };
}