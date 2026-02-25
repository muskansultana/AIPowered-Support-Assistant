export interface Session {
  id: string;
  created_at: string;
  updated_at: string;
  title?: string;
  status: 'active' | 'archived' | 'deleted';
}

export interface Message {
  id: number;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  sequence: number;
  created_at: string;
}

export interface CreateSessionDTO {
  title?: string;
}

export interface CreateMessageDTO {
  role: 'user' | 'assistant';
  content: string;
}

export interface UpdateSessionDTO {
  title?: string;
  status?: 'active' | 'archived' | 'deleted';
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface Document {
  id: string;
  title: string;
  content: string;
}

export interface ChatRequest {
  sessionId: string;
  message: string;
}

export interface ChatResponse {
  reply: string;
  tokensUsed?: number;
}