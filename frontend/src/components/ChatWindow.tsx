import { useEffect, useState, useRef, useCallback } from "react";
import { Message } from "../types";
import { sendMessage, fetchConversation } from "../api";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";
import { getOrCreateSessionId, createNewSession, resetSessionTime, getSessionStartTime, formatDate } from "../utils";

const ChatWindow: React.FC = () => {
  const [sessionId, setSessionId] = useState<string>(getOrCreateSessionId());
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversation on component mount or session change
  const loadConversation = useCallback(async () => {
    setIsInitializing(true);
    setError(null);
    try {
      const data = await fetchConversation(sessionId);
      setMessages(data || []);
    } catch (err) {
      console.error("Error loading conversation", err);
      setError("Failed to load conversation. Please try again.");
      setMessages([]);
    } finally {
      setIsInitializing(false);
    }
  }, [sessionId]);

  useEffect(() => {
    loadConversation();
  }, [loadConversation]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    setLoading(true);
    setError(null);

    // Add user message immediately
    const userMessage: Message = {
      role: "user",
      content: text,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      const data = await sendMessage(sessionId, text);

      if (!data.reply) {
        throw new Error("Empty response from server");
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: data.reply,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error("Error sending message", err);
      
      // Show error message to user
      const errorMessage = err.response?.data?.error || 
                          err.message || 
                          "Failed to get response. Please try again.";
      
      setError(errorMessage);

      // Remove the optimistic user message if request failed
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = () => {
    const newId = createNewSession();
    resetSessionTime();
    setSessionId(newId);
    setMessages([]);
    setError(null);
  };

  const sessionStartTime = getSessionStartTime();

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", width: "100%", backgroundColor: "#ffffff" }}>
      {/* Header */}
      <div
        style={{
          padding: "20px 24px",
          backgroundColor: "#f8f9fa",
          borderBottom: "2px solid #e9ecef",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px" }}>
          <div>
            <h1 style={{ margin: "0 0 6px 0", fontSize: "28px", fontWeight: "700", color: "#1a1a1a" }}>
              🤖 Chat Assistant
            </h1>
            <p style={{ margin: 0, fontSize: "13px", color: "#6c757d" }}>
              {formatDate(sessionStartTime)} • ID: {sessionId.substring(0, 8)}...
            </p>
          </div>

          <button
            onClick={handleNewChat}
            style={{
              padding: "10px 20px",
              backgroundColor: "#667eea",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "600",
              transition: "all 0.2s",
              whiteSpace: "nowrap",
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#5568d3")}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#667eea")}
          >
            + New Chat
          </button>
        </div>
      </div>

      {/* Messages Container */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px 24px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          backgroundColor: "#ffffff",
        }}
      >
        {messages.length === 0 && !isInitializing && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
              color: "#999",
              textAlign: "center",
              gap: "12px",
            }}
          >
            <div style={{ fontSize: "56px" }}>👋</div>
            <h2 style={{ margin: 0, fontSize: "22px", color: "#1a1a1a", fontWeight: "600" }}>
              Welcome Back!
            </h2>
            <p style={{ margin: 0, fontSize: "14px", color: "#666", maxWidth: "380px", lineHeight: "1.5" }}>
              Ask me anything about our products and services. I'm here to help you!
            </p>
            <p style={{ margin: "8px 0 0 0", fontSize: "13px", opacity: 0.6, color: "#999" }}>
              💡 I can only answer questions based on our documentation
            </p>
          </div>
        )}

        {isInitializing && (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
            <div style={{ fontSize: "14px", color: "#999" }}>Loading conversation...</div>
          </div>
        )}

        {messages.map((msg, index) => (
          <MessageBubble key={index} message={msg} />
        ))}

        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: "12px" }}>
            <div
              style={{
                padding: "12px 16px",
                backgroundColor: "#E5E5EA",
                borderRadius: "12px",
                display: "flex",
                gap: "4px",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  backgroundColor: "#999",
                  borderRadius: "50%",
                  animation: "bounce 1.4s infinite",
                }}
              />
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  backgroundColor: "#999",
                  borderRadius: "50%",
                  animation: "bounce 1.4s infinite",
                  animationDelay: "0.2s",
                }}
              />
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  backgroundColor: "#999",
                  borderRadius: "50%",
                  animation: "bounce 1.4s infinite",
                  animationDelay: "0.4s",
                }}
              />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error Message */}
      {error && (
        <div
          style={{
            margin: "0 24px 16px 24px",
            padding: "12px 16px",
            backgroundColor: "#fff3cd",
            border: "1px solid #ffc107",
            borderRadius: "8px",
            color: "#856404",
            fontSize: "13px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <span>⚠️ {error}</span>
          <button
            onClick={() => setError(null)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "18px",
              color: "#856404",
              padding: "0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Input */}
      <ChatInput onSend={handleSend} loading={loading} />

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% {
            transform: scale(0.8);
            opacity: 0.5;
          }
          40% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default ChatWindow;