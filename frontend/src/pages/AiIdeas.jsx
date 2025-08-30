import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import { io } from "socket.io-client";
import { useAuth } from "../context/AuthContext";

export default function AIIdeas() {
  const { user, loading } = useAuth();

  const API_URL = import.meta.env.VITE_BASE_URL 
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL

  console.log(API_URL, "---", SOCKET_URL);

  const [messages, setMessages] = useState([]);
  const [prompt, setPrompt] = useState("");
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState("");

  const socketRef = useRef(null);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  // Simple client ID generator
  const genClientId = () => `cid-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  // Connect socket and fetch history
  useEffect(() => {
    if (!user?._id) return;

    const socket = io(SOCKET_URL, { withCredentials: true });
    socketRef.current = socket;

    // Fetch chat history when connected
    const fetchHistory = async () => {
      try {
        setError("");
        const res = await fetch(`${API_URL}/ai/ideas/user/${user._id}`, {
          credentials: "include",
        });
        const data = await res.json();
        const messageList = (data?.data || []).map((m) => ({
          ...m,
          sender: m.sender === "AI" ? "AI" : "user",
        }));
        setMessages(messageList);
        inputRef.current?.focus();
      } catch {
        setError("Failed to fetch messages");
      }
    };

    // Handle new messages from server
    const handleNewMessage = (msg) => {
      setMessages((prev) => {
        
        if (msg.clientId) {
          const index = prev.findIndex((m) => m.clientId === msg.clientId);
          if (index !== -1) {
            const newMessages = [...prev];
            newMessages[index] = { ...msg, clientId: undefined };
            return newMessages;
          }
        }
        // Adding new message
        return [...prev, msg];
      });

      setThinking(false);
      inputRef.current?.focus();
    };

    socket.on("connect", fetchHistory);
    socket.on("newMessage", handleNewMessage);
    socket.on("connect_error", (e) => setError(e?.message || "Socket error"));

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [SOCKET_URL, API_URL, user?._id]);

  // Auto-scroll to bottom
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Send message
  const send = () => {
    const text = prompt.trim();
    if (!text || !socketRef.current || thinking) return;

    setThinking(true);
    const clientId = genClientId();

    // Add user message immediately
    setMessages((prev) => [
      ...prev,
      {
        _id: `temp-${clientId}`,
        clientId,
        createdBy: user._id,
        sender: "user",
        text,
        createdAt: new Date().toISOString(),
      },
    ]);

    // Get last 20 messages for context
    const history = messages.slice(-20).map((m) => ({
      role: m.sender === "user" ? "user" : "model",
      text: m.text,
    }));

    // Send to server
    socketRef.current.emit("sendPrompt", {
      userId: user._id,
      text,
      clientId,
      history,
    });

    setPrompt("");
    inputRef.current?.focus();
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !thinking) {
      e.preventDefault();
      send();
    }
  };

  if (loading) return <div className="p-6 text-white">Loading…</div>;
  if (!user) return null;

  return (
    <div className="flex min-h-screen flex-col bg-[#000212] text-white">

      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-800 px-4 py-3">
        <h1 className="text-lg sm:text-2xl font-semibold">🤖 AI Assistant</h1>
        <div className="text-[11px] sm:text-xs text-gray-400">
          {thinking ? "Thinking…" : `Messages: ${messages.length}`}
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 space-y-3">
        {messages.map((m) => {
          const isUser = m.sender === "user";
          const key = m._id || m.clientId || `${m.sender}-${Date.now()}`;

          return (
            <div
              key={key}
              className={`w-fit max-w-full sm:max-w-2xl rounded-2xl p-3 sm:p-4 shadow ${
                isUser
                  ? "ml-auto bg-blue-600/10 border border-blue-700/40"
                  : "mr-auto bg-gray-800/60 border border-gray-700/50"
              }`}
            >
              <div className={`mb-1 text-[10px] sm:text-xs ${
                isUser ? "text-blue-300/80" : "text-gray-300/80"
              }`}>
                {isUser ? "You" : "AI"}
              </div>
              <div className="prose prose-invert max-w-none">
                <ReactMarkdown rehypePlugins={[rehypeSanitize]}>
                  {m.text || ""}
                </ReactMarkdown>
              </div>
              <div className="mt-2 text-[10px] text-gray-400">
                {new Date(m.createdAt || Date.now()).toLocaleString()}
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </main>

      {/* Input */}
      <footer className="sticky bottom-0 border-t border-gray-800 bg-black/60 backdrop-blur px-3 sm:px-4 py-3">
        <div className="mx-auto flex w-full max-w-4xl gap-2">
          <textarea
            ref={inputRef}
            rows={1}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="✨ Spark a new idea 💡"
            className="min-h-[44px] max-h-40 flex-1 resize-y rounded-xl border border-gray-700 bg-gray-900 p-3 text-white outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500"
            disabled={thinking}
          />
          <button
            onClick={send}
            disabled={thinking || !prompt.trim()}
            className={`shrink-0 rounded-xl px-4 py-2 transition ${
              thinking || !prompt.trim()
                ? "bg-gray-700 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600 active:scale-[0.98]"
            }`}
          >
            {thinking ? "…" : "Send"}
          </button>
        </div>
        {error && (
          <p className="mx-auto mt-2 w-full max-w-4xl text-sm text-red-400">
            {error}
          </p>
        )}
      </footer>
    </div>
  );
}