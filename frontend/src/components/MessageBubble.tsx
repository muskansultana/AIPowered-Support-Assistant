import { Message } from "../types";
import { formatTime } from "../utils";

interface Props {
  message: Message;
}

const MessageBubble: React.FC<Props> = ({ message }) => {
  const isUser = message.role === "user";

  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        marginBottom: "12px",
        padding: "0 8px",
      }}
    >
      <div
        style={{
          maxWidth: "70%",
          padding: "12px 16px",
          borderRadius: "12px",
          backgroundColor: isUser ? "#667eea" : "#f1f3f5",
          color: isUser ? "white" : "#1a1a1a",
          wordWrap: "break-word",
          overflowWrap: "break-word",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        }}
      >
        <div style={{ lineHeight: "1.5", fontSize: "14px" }}>
          {message.content}
        </div>
        <div
          style={{
            fontSize: "12px",
            marginTop: "6px",
            opacity: 0.7,
            textAlign: "right",
          }}
        >
          {formatTime(message.created_at)}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;