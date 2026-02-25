import axios from "axios";
import { Message, ChatResponse } from "./types";

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "https://aipowered-support-assistant.onrender.com/api",
  timeout: 30000,
});

// Add response interceptor for error handling
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.data?.error) {
      console.error("API Error:", error.response.data.error);
    } else if (error.message === "Network Error") {
      console.error("Network error - unable to connect to backend");
    }
    return Promise.reject(error);
  }
);

export const sendMessage = async (
  sessionId: string,
  message: string
): Promise<ChatResponse> => {
  try {
    const res = await API.post<{ success: boolean; reply: string; tokensUsed?: number }>(
      "/chat",
      {
        sessionId,
        message,
      }
    );
    return {
      reply: res.data.reply,
      tokensUsed: res.data.tokensUsed,
    };
  } catch (error) {
    throw error;
  }
};

export const fetchConversation = async (
  sessionId: string
): Promise<Message[]> => {
  try {
    const res = await API.get<{ success: boolean; data: Message[] }>(
      `/conversations/${sessionId}`
    );
    return res.data?.data || [];
  } catch (error) {
    console.error("Error fetching conversation:", error);
    return [];
  }
};

export const fetchSessions = async (): Promise<any[]> => {
  try {
    const res = await API.get("/sessions");
    return res.data;
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return [];
  }
};