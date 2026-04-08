"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2, Bot, User } from "lucide-react";
import { chatAPI, ChatMessage } from "@/lib/api";

interface ChatBotProps {
  userRole: "student" | "mentor";
  userId: number;
}

export default function ChatBot({ userRole, userId }: ChatBotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load welcome message on first open
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        role: "assistant",
        content:
          userRole === "student"
            ? "Hi! I'm your analytics assistant. Ask me about your domain scores, skills, or how to improve your profile! 🎓"
            : "Hello! I can help you find students, analyze performance trends, and provide insights. What would you like to know? 📊",
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, messages.length, userRole]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: inputMessage.trim(),
    };

    // Add user message to chat
    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);
    setError(null);

    try {
      // Call chatbot API
      const response = await chatAPI.sendMessage({
        message: userMessage.content,
        conversation_history: messages,
        user_role: userRole,
        user_id: userId,
      });

      // Add AI response to chat
      const aiMessage: ChatMessage = {
        role: "assistant",
        content: response.response,
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err: any) {
      console.error("Chat error:", err);
      const errorMsg =
        err.response?.status === 503
          ? "Chatbot is not configured. Please add GROQ_API_KEY to backend/.env"
          : "Sorry, I'm having trouble responding right now. Please try again.";
      setError(errorMsg);

      // Add error message to chat
      const errorMessage: ChatMessage = {
        role: "assistant",
        content: errorMsg,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    // Don't save on close - only keep in memory during session
  };

  const handleOpen = () => {
    setIsOpen(true);
  };

  // Clear chat when component unmounts (logout/page close)
  useEffect(() => {
    return () => {
      // Clear session storage on unmount
      if (typeof window !== "undefined") {
        sessionStorage.removeItem(`chat_${userRole}_${userId}`);
      }
    };
  }, [userRole, userId]);

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={handleOpen}
          className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 z-50 group"
          aria-label="Open chat"
        >
          <MessageCircle className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 bg-green-500 w-3 h-3 rounded-full animate-pulse"></span>
          <div className="absolute right-16 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Ask me anything!
          </div>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-200 dark:border-gray-700">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-full">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold">AI Assistant</h3>
                <p className="text-xs text-white/80">
                  {userRole === "student" ? "Student Support" : "Mentor Support"}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="hover:bg-white/20 p-2 rounded-full transition"
              aria-label="Close chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-800">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.role === "assistant" && (
                  <div className="bg-blue-500 text-white p-2 rounded-full h-8 w-8 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                    msg.role === "user"
                      ? "bg-blue-500 text-white rounded-br-none"
                      : "bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-none shadow"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
                {msg.role === "user" && (
                  <div className="bg-gray-300 dark:bg-gray-600 p-2 rounded-full h-8 w-8 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-gray-700 dark:text-gray-200" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="bg-blue-500 text-white p-2 rounded-full h-8 w-8 flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white dark:bg-gray-700 rounded-2xl rounded-bl-none px-4 py-3 shadow">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            {error && (
              <div className="mb-2 text-xs text-red-500 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                {error}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything..."
                disabled={isLoading}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white disabled:opacity-50"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white p-2 rounded-full transition disabled:cursor-not-allowed"
                aria-label="Send message"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
              Powered by AI • Session-based memory
            </p>
          </div>
        </div>
      )}
    </>
  );
}
