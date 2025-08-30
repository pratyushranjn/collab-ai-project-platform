import { useEffect, useRef, useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";
import api from "../api/api";
import { Send, MessageSquare, ArrowLeft } from "lucide-react";

export default function ProjectChat() {
  const { projectId } = useParams();
  const socket = useSocket();
  const { user } = useAuth();

  const { state } = useLocation();
  const [projectName, setProjectName] = useState(state?.projectName || "");

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [threadOpen, setThreadOpen] = useState(false);
  const [threadRoot, setThreadRoot] = useState(null);
  const [threadReplies, setThreadReplies] = useState([]);
  const [err, setErr] = useState("");
  const [typingUsers, setTypingUsers] = useState({});

  const listRef = useRef(null);
  const threadRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Load messages
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const res = await api.get(`/chat/projects/${projectId}/messages?limit=50`);
        if (mounted) setMessages(res.data?.messages || []);
      } catch (e) {
        const status = e?.response?.status;
        const msg =
          status === 401
            ? "Not authenticated."
            : status === 403
              ? "You’re not a member of this project."
              : "Failed to load messages.";
        setErr(msg);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [projectId]);

  // Load project name if missing
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (projectName || !projectId) return;
      try {
        const resp = await api.get(`/projects/${projectId}`);
        if (mounted) setProjectName(resp?.data?.data?.name || "");
      } catch {
        // 
      }
    })();
    return () => {
      mounted = false;
    };
  }, [projectId, projectName]);

  // Socket events
  useEffect(() => {
    if (!socket) return;
    let unsubscribed = false;

    socket.emit("project:join", { projectId }, (ack) => {
      if (!ack?.ok && !unsubscribed) {
        setErr(ack?.error || "Unable to join project room.");
      }
    });

    const onNew = (msg) => {
      if (!msg.parentMessage) {
        setMessages((prev) => [...prev, msg]);
      } else {
        setThreadReplies((prev) =>
          threadOpen && threadRoot && msg.parentMessage === threadRoot._id
            ? [...prev, msg]
            : prev
        );
        setMessages((prev) =>
          prev.map((m) =>
            m._id === msg.parentMessage
              ? { ...m, replyCount: (m.replyCount || 0) + 1 }
              : m
          )
        );
      }
    };

    const onTyping = ({ userId, name, isTyping }) => {
      setTypingUsers((prev) => {
        const updated = { ...prev };
        if (isTyping) {
          updated[userId] = name || "Member";
        } else {
          delete updated[userId];
        }
        return updated;
      });
    };

    socket.on("message:new", onNew);
    socket.on("typing", onTyping);

    return () => {
      unsubscribed = true;
      socket.off("message:new", onNew);
      socket.off("typing", onTyping);
      socket.emit("project:leave", { projectId }, () => { });
    };
  }, [socket, projectId, threadOpen, threadRoot]);

  // Auto scroll
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages.length]);

  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [threadReplies.length]);

  const sendRoot = () => {
    const text = input.trim();
    if (!text || !socket) return;
    setSending(true);
    socket.emit("message:send", { projectId, text }, (ack) => {
      setSending(false);
      if (ack?.ok) setInput("");
      else setErr(ack?.error || "Failed to send message.");
    });
  };

  const openThread = async (rootMsg) => {
    setThreadRoot(rootMsg);
    setThreadOpen(true);
    try {
      setErr("");
      const res = await api.get(`/chat/projects/${projectId}/threads/${rootMsg._id}`);
      setThreadReplies(res.data?.replies || []);
    } catch (e) {
      const status = e?.response?.status;
      setErr(status === 403 ? "You’re not a member of this project." : "Failed to load thread.");
    }
  };

  const closeThread = () => {
    setThreadOpen(false);
    setThreadRoot(null);
    setThreadReplies([]);
  };

  const sendReply = (text) => {
    const t = text.trim();
    if (!t || !socket || !threadRoot) return;
    socket.emit(
      "message:send",
      { projectId, text: t, parentMessage: threadRoot._id },
      (ack) => {
        if (!ack?.ok) setErr(ack?.error || "Failed to send reply.");
      }
    );
  };

  const RootMessage = ({ m }) => {
    const isMe = (m.sender?._id || m.sender) === (user?._id || user?.id);
    return (
      <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
        <div className="max-w-[75%]">
          <div
            className={`px-3 py-2 rounded-xl text-sm leading-relaxed ${isMe
                ? "bg-blue-600 text-white rounded-br-md"
                : "bg-gray-700 text-white rounded-bl-md"
              }`}
          >
            <div className="opacity-80 text-[11px] mb-1">{m.sender?.name || "Member"}</div>
            {m.text}
          </div>
          <div className="flex items-center gap-3 text-[11px] text-gray-400 mt-1 px-1">
            <span>
              {new Date(m.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            <button
              onClick={() => openThread(m)}
              className="inline-flex items-center gap-1 hover:underline"
              title="Reply in thread"
            >
              <MessageSquare size={12} />
              Reply {m.replyCount ? `(${m.replyCount})` : ""}
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="p-6 text-white">Loading chat…</div>;
  }

  return (
    <div className="h-[calc(100vh-4rem)] text-white flex" style={{ backgroundColor: "#000212" }}>
      {/* Main column */}
      <div className={`flex flex-col ${threadOpen ? "w-2/3" : "w-full"}`}>
        {/* Header */}
        <div className="flex items-center p-3 bg-gray-900 border-b border-gray-700 justify-between">
          <div className="flex items-center gap-3">
            <Link to={`/projects/${projectId}`} className="p-1.5 rounded hover:bg-gray-800">
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h2 className="text-base font-semibold">{projectName || "Project Chat"}</h2>
              <p className="text-gray-400 text-xs">Room: {projectId}</p>
            </div>
          </div>
          {err && (
            <div className="text-xs px-2 py-1 rounded bg-red-900/50 text-red-200 border border-red-700">
              {err}
            </div>
          )}
        </div>

        {/* Messages */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-3 space-y-3">
          {messages.length === 0 ? (
            <div className="text-center text-gray-400 mt-12">
              <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                <Send size={18} className="text-gray-600" />
              </div>
              <p className="text-base">No messages yet</p>
              <p className="text-xs mt-1">Start the conversation</p>
            </div>
          ) : (
            messages.map((m) => <RootMessage key={m._id} m={m} />)
          )}
        </div>

        {/* Typing indicator */}
        {Object.keys(typingUsers).length > 0 && (
          <div className="px-4 py-1 text-xs text-gray-400">
            {Object.values(typingUsers)
              .filter((name) => name !== user?.name)
              .join(", ")}{" "}
            {Object.values(typingUsers).length > 1 ? "are typing..." : "is typing..."}
          </div>
        )}

        {/* Input */}
        <div className="p-3 bg-gray-900 border-t border-gray-700">
          <div className="flex items-center bg-gray-800 rounded-full px-3 py-1.5">
            <input
              value={input}
              onChange={(e) => {
                setInput(e.target.value);

                if (socket) {
                  socket.emit("typing", { projectId, isTyping: true });

                  if (typingTimeoutRef.current) {
                    clearTimeout(typingTimeoutRef.current);
                  }

                  typingTimeoutRef.current = setTimeout(() => {
                    socket.emit("typing", { projectId, isTyping: false });
                  }, 2000);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendRoot();
                  if (socket) socket.emit("typing", { projectId, isTyping: false });
                }
              }}
              placeholder="Message the project…"
              className="flex-1 bg-transparent text-white placeholder-gray-400 focus:outline-none px-1 text-sm"
            />
            <button
              onClick={sendRoot}
              disabled={!input.trim() || sending}
              className={`p-1.5 rounded-full transition-colors ${input.trim() && !sending
                  ? "bg-blue-500 hover:bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-400 cursor-not-allowed"
                }`}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Thread panel */}
      {threadOpen && threadRoot && (
        <ThreadPanel
          projectId={projectId}
          root={threadRoot}
          replies={threadReplies}
          onClose={closeThread}
          onSend={sendReply}
        />
      )}
    </div>
  );
}

function ThreadPanel({ root, replies, onClose, onSend }) {
  const [text, setText] = useState("");
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [replies.length]);

  return (
    <div className="w-1/3 border-l border-gray-700 flex flex-col bg-[#0b0b13]">
      <div className="p-3 bg-gray-900 border-b border-gray-700 flex items-center justify-between">
        <div className="font-semibold text-sm">Thread</div>
        <button onClick={onClose} className="text-xs text-gray-300 hover:underline">
          Close
        </button>
      </div>

      <div className="p-3">
        <div className="bg-gray-800 rounded-lg p-3 text-sm">
          <div className="opacity-80 text-[11px] mb-1">{root.sender?.name || "Member"}</div>
          {root.text}
          <div className="text-[10px] text-gray-400 mt-1">
            {new Date(root.createdAt).toLocaleString()}
          </div>
        </div>
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto p-3 space-y-2">
        {replies.map((r) => (
          <div key={r._id} className="bg-gray-800 rounded-lg p-2 text-sm">
            <div className="opacity-80 text-[11px] mb-1">{r.sender?.name || "Member"}</div>
            {r.text}
            <div className="text-[10px] text-gray-400 mt-1">
              {new Date(r.createdAt).toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 bg-gray-900 border-t border-gray-700">
        <div className="flex items-center bg-gray-800 rounded-full px-3 py-1.5">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                const t = text.trim();
                if (t) {
                  onSend(t);
                  setText("");
                }
              }
            }}
            placeholder="Reply in thread…"
            className="flex-1 bg-transparent text-white placeholder-gray-400 focus:outline-none px-1 text-sm"
          />
          <button
            onClick={() => {
              const t = text.trim();
              if (t) {
                onSend(t);
                setText("");
              }
            }}
            disabled={!text.trim()}
            className={`p-1.5 rounded-full transition-colors ${text.trim()
                ? "bg-blue-500 hover:bg-blue-600 text-white"
                : "bg-gray-700 text-gray-400 cursor-not-allowed"
              }`}
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
