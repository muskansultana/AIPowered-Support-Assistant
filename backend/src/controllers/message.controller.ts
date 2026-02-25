import { Request, Response, NextFunction } from 'express';
import { MessageService } from '../services/message.service';
import { DocumentService } from '../services/document.service';
import { AIService } from '../services/ai.service';
import { CreateMessageDTO } from '../types';

export class MessageController {
  private messageService = new MessageService();
  private documentService = new DocumentService();
  private aiService = new AIService();

  createMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const sessionId = req.params.sessionId as string;
      const data: CreateMessageDTO = req.body;
      
      // Save user message
      const userMessage = await this.messageService.createMessage(sessionId, data);
      
      res.status(201).json({
        success: true,
        data: userMessage
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Create message and get AI response
   */
  createMessageWithAI = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const sessionId = req.params.sessionId as string;
      const data: CreateMessageDTO = req.body;
      
      // Save user message
      const userMessage = await this.messageService.createMessage(sessionId, data);
      
      // Get conversation history (last 10 messages = 5 pairs)
      const allMessages = await this.messageService.getMessagesBySessionId(sessionId);
      const conversationHistory = allMessages.slice(-10);
      
      // Get documents context
      const documentsContext = this.documentService.getDocumentsAsContext();
      
      // Generate AI response
      const { reply } = await this.aiService.generateResponse(
        data.content,
        documentsContext,
        conversationHistory
      );
      
      // Save AI response
      const assistantMessage = await this.messageService.createMessage(sessionId, {
        role: 'assistant',
        content: reply
      });
      
      res.status(201).json({
        success: true,
        data: {
          userMessage,
          assistantMessage
        }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Stream AI response (for real-time chat)
   */
  streamMessageWithAI = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const sessionId = req.params.sessionId as string;
      const data: CreateMessageDTO = req.body;
      
      // Save user message
      await this.messageService.createMessage(sessionId, data);
      
      // Get conversation history
      const allMessages = await this.messageService.getMessagesBySessionId(sessionId);
      const conversationHistory = allMessages.slice(-10);
      
      // Get documents context
      const documentsContext = this.documentService.getDocumentsAsContext();
      
      // Set headers for streaming
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      let fullResponse = '';
      
      // Stream AI response
      for await (const chunk of this.aiService.streamResponse(
        data.content,
        documentsContext,
        conversationHistory
      )) {
        fullResponse += chunk;
        res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
      }
      
      // Save complete AI response
      await this.messageService.createMessage(sessionId, {
        role: 'assistant',
        content: fullResponse
      });
      
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      next(error);
    }
  };

  getMessages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const sessionId = req.params.sessionId as string;
      const messages = await this.messageService.getMessagesBySessionId(sessionId);
      
      res.json({
        success: true,
        data: messages
      });
    } catch (error) {
      next(error);
    }
  };
}