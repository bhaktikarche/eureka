// components/ChatInterface.jsx
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { chatAPI, documentAPI } from "../utils/api";
import "./ChatInterface.css";

const ChatInterface = () => {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hello! I'm Eureka, your AI librarian. I can help you search, summarize, and manage your documents. How can I assist you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const response = await documentAPI.getAll();
      setDocuments(response.data);
    } catch (error) {
      console.error("Failed to load documents:", error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await chatAPI.sendMessage(input, messages.slice(-10));
      const aiMessage = { role: "assistant", content: response.data.response };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage = {
        role: "assistant",
        content:
          "Sorry, I encountered an error processing your request. Please try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (action) => {
    const actions = {
      search: "Search my documents",
      recent: "Show my recent documents",
      upload: () => navigate("/dashboard?tab=upload"),
      help: "What can you help me with?",
      count: "How many documents do I have?",
      excel: "Show me Excel files",
      pdf: "Show me PDF files",
      large: "Show me files larger than 5MB",
    };

    if (typeof actions[action] === "function") {
      actions[action]();
    } else {
      setInput(actions[action]);
      setTimeout(() => {
        const fakeEvent = { preventDefault: () => {} };
        handleSendMessage(fakeEvent);
      }, 100);
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2>Eureka AI Librarian</h2>
        <p>Ask me anything about your documents</p>

        <div className="quick-actions">
          <button onClick={() => handleQuickAction("search")}>🔍 Search</button>
          <button onClick={() => handleQuickAction("recent")}>📄 Recent</button>
          <button onClick={() => handleQuickAction("count")}>📊 Count</button>
          <button onClick={() => handleQuickAction("excel")}>📊 Excel</button>
          <button onClick={() => handleQuickAction("pdf")}>📝 PDF</button>
          <button onClick={() => handleQuickAction("large")}>💾 Large</button>
          <button onClick={() => handleQuickAction("upload")}>📤 Upload</button>
          <button onClick={() => handleQuickAction("help")}>❓ Help</button>
        </div>
      </div>

      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.role}`}>
            <div className="message-content">
              {msg.content.split("\n").map((line, i) => (
                <React.Fragment key={i}>
                  {line}
                  <br />
                </React.Fragment>
              ))}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message assistant">
            <div className="message-content loading">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="chat-input-form">
        <div className="input-container">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your documents..."
            disabled={isLoading}
          />
          {/* Upload Icon */}
          <button type="button" className="icon-btn" title="Upload File">
            📎
          </button>
          {/* Voice Icon */}
          <button type="button" className="icon-btn" title="Voice Input">
            🎤
          </button>
          <button type="submit" disabled={isLoading || !input.trim()}>
            ➤
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatInterface;
