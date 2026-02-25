import { MessageService } from './message.service';
import { SessionService } from './session.service';
import { DocumentService } from './document.service';
import { AIService } from './ai.service';
import { ChatRequest, ChatResponse } from '../types';

export class ChatService {
  private messageService = new MessageService();
  private sessionService = new SessionService();
  private documentService = new DocumentService();
  private aiService = new AIService();

  /**
   * Handle chat request with document-based answering
   */
  async handleChatRequest(request: ChatRequest): Promise<ChatResponse> {
    const { sessionId: initialSessionId, message } = request;
    let sessionId = initialSessionId;

    // 1. Ensure session exists (create if not)
    let session = await this.sessionService.getSessionById(sessionId);
    if (!session) {
      session = await this.sessionService.createSession({ title: 'New Chat' });
      sessionId = session.id; // Use the new session ID
    }

    // 2. Save user message
    await this.messageService.createMessage(sessionId, {
      role: 'user',
      content: message
    });

    // 3. Get last 5 message pairs (10 messages total) for context
    const allMessages = await this.messageService.getMessagesBySessionId(sessionId);
    const contextMessages = allMessages.slice(-10);

    // 4. Get documents context
    const documentsContext = this.documentService.getDocumentsAsContext();

    // 5. Generate AI response
    const { reply, tokensUsed } = await this.aiService.generateResponse(
      message,
      documentsContext,
      contextMessages
    );

    // 6. Save assistant response
    await this.messageService.createMessage(sessionId, {
      role: 'assistant',
      content: reply
    });

    return {
      reply,
      tokensUsed
    };
  }

  /**
   * Stream chat response (optional)
   */
  async *handleStreamingChatRequest(request: ChatRequest): AsyncGenerator<string, void, unknown> {
    const { sessionId: initialSessionId, message } = request;
    let sessionId = initialSessionId;

    // Ensure session exists
    let session = await this.sessionService.getSessionById(sessionId);
    if (!session) {
      session = await this.sessionService.createSession({ title: 'New Chat' });
      sessionId = session.id; // Use the new session ID
    }

    // Save user message
    await this.messageService.createMessage(sessionId, {
      role: 'user',
      content: message
    });

    // Get context
    const allMessages = await this.messageService.getMessagesBySessionId(sessionId);
    const contextMessages = allMessages.slice(-10);

    // Get documents
    const documentsContext = this.documentService.getDocumentsAsContext();

    // Stream response
    let fullResponse = '';
    for await (const chunk of this.aiService.streamResponse(
      message,
      documentsContext,
      contextMessages
    )) {
      fullResponse += chunk;
      yield chunk;
    }

    // Save complete response
    await this.messageService.createMessage(sessionId, {
      role: 'assistant',
      content: fullResponse
    });
  }
}