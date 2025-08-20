import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { useAuth } from "../context/AuthContext";
import { io } from "socket.io-client";

function AIideas() {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);

  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = io(import.meta.env.VITE_SOCKET_URL, { withCredentials: true });

    socketRef.current.emit("joinRoom", { userId: user._id });

    socketRef.current.on("newMessage", (msg) => {
      // Normalize sender: user vs AI
      const normalizedMsg = {
        ...msg,
        sender: msg.sender === "AI" ? "AI" : "user",
      };
      setMessages((prev) => [...prev, normalizedMsg]);
    });

    return () => socketRef.current.disconnect();
  }, [user._id]);

  // Fetch previous messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/api/ai/ideas/user/${user._id}`,
          { credentials: "include" }
        );
        const data = await res.json();
        if (data.success) {
          // Map DB messages to have sender: "user" or "AI"
          const normalized = data.data.map((msg) => ({
            ...msg,
            sender: msg.sender === "AI" || !msg.createdBy ? "AI" : "user",
          }));
          setMessages(normalized);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to fetch messages");
      }
    };
    fetchMessages();
  }, [user._id]);

  const handleSend = () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError("");

    socketRef.current.emit("sendPrompt", { userId: user._id, text: prompt });

    setPrompt("");
    setLoading(false);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-full p-6 bg-gray-900 text-white">
      <h1 className="text-2xl font-bold mb-4">🤖 AI Assistant</h1>

      <div className="flex-1 overflow-y-auto mb-4 space-y-3">
        {messages.map((msg, idx) => {
          const isUser = msg.sender === "user";
          return (
            <div
              key={idx}
              className={`max-w-xl p-3 rounded-lg shadow-md break-words ${isUser
                  ? " text-white ml-auto text-right"
                  : "bg-gray-700 text-white mr-auto text-left"
                }`}
            >

              <ReactMarkdown>{msg.text}</ReactMarkdown>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>


      <div className="flex gap-2">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="✨ Ask me anything… spark a new idea 💡"
          className="flex-1 p-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          onClick={handleSend}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg"
        >
          {loading ? "Sending..." : "Send"}
        </button>
      </div>

      {error && <p className="text-red-400 mt-2">{error}</p>}
    </div>
  );
}

export default AIideas;


