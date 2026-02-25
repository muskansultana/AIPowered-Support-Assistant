export type Role = "user" | "assistant";

export interface Message {
  id?: number;
  session_id?: string;
  role: Role;
  content: string;
  created_at: string;
  sequence?: number;
}

export interface ChatResponse {
  reply: string;
  tokensUsed?: number;
  success?: boolean;
}

export interface Session {
  id: string;
  created_at: string;
  updated_at: string;
  title?: string;
  status?: "active" | "archived" | "deleted";
}

export interface ApiError {
  success: false;
  error: string;
}