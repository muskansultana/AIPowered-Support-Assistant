import { useState } from "react";

interface Props {
  onSend: (message: string) => void;
  loading: boolean;
}

const ChatInput: React.FC<Props> = ({ onSend, loading }) => {
  const [message, setMessage] = useState<string>("");

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    if (!message.trim()) return;
    onSend(message);
    setMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Send on Enter, but allow Shift+Enter for new line
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: "flex",
        gap: "12px",
        padding: "16px 24px 24px 24px",
        borderTop: "1px solid #e9ecef",
        backgroundColor: "#ffffff",
      }}
    >
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type your message... (Shift+Enter for new line)"
        disabled={loading}
        style={{
          flex: 1,
          padding: "12px 14px",
          border: "1px solid #dee2e6",
          borderRadius: "8px",
          fontSize: "14px",
          fontFamily: "inherit",
          resize: "none",
          minHeight: "44px",
          maxHeight: "120px",
          opacity: loading ? 0.6 : 1,
          transition: "all 0.2s",
          boxSizing: "border-box",
        }}
        rows={1}
      />
      <button
        type="submit"
        disabled={loading || !message.trim()}
        style={{
          padding: "12px 28px",
          backgroundColor: loading || !message.trim() ? "#dee2e6" : "#667eea",
          color: loading || !message.trim() ? "#6c757d" : "white",
          border: "none",
          borderRadius: "8px",
          cursor: loading || !message.trim() ? "not-allowed" : "pointer",
          fontSize: "14px",
          fontWeight: "600",
          transition: "all 0.2s",
          alignSelf: "flex-end",
          whiteSpace: "nowrap",
        }}
        onMouseOver={(e) => {
          if (!loading && message.trim()) {
            e.currentTarget.style.backgroundColor = "#5568d3";
          }
        }}
        onMouseOut={(e) => {
          if (!loading && message.trim()) {
            e.currentTarget.style.backgroundColor = "#667eea";
          }
        }}
      >
        {loading ? "Sending..." : "Send"}
      </button>
    </form>
  );
};

export default ChatInput;