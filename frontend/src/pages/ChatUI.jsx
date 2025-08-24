import { useState, useEffect } from "react";
import { Send, ArrowLeft } from "lucide-react";
import { safeRequest } from "../utils/safeRequest";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";

export default function ChatUI() {
  const { user: currentUser } = useAuth();
  const socket = useSocket();

  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  // Fetch all users 
  useEffect(() => {
    const fetchUsers = async () => {
      const [res, err] = await safeRequest(() => api.get("/users"));
      if (!err && res?.data?.success) {
        const filtered = (res.data.data || []).filter(
          (u) => u._id !== currentUser?._id
        );
        setUsers(filtered);
      }
    };
    if (currentUser) fetchUsers();
  }, [currentUser]);

  const handleUserSelect = async (user) => {
    setSelectedUser(user);
    setMessages([]); 
  };

  const handleBackToUserList = () => setSelectedUser(null);

  const sendMessage = () => {
    if (!input.trim() || !selectedUser || !socket || !currentUser) return;

    const newMessage = {
      sender: currentUser._id,
      senderName: currentUser.name,
      receiver: selectedUser._id,
      text: input,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInput("");
    socket.emit("sendMessage", newMessage);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="h-screen text-white text-sm" style={{ backgroundColor: "#000212" }}>
      {!selectedUser ? (
        <div className="h-full p-3 ">
          <h2 className="text-xl font-bold mb-4 text-center">Select User</h2>
          <div className="space-y-2">
            {users.map((u) => (
              <div
                key={u._id}
                onClick={() => handleUserSelect(u)}
                className="p-3 bg-gray-900 hover:bg-gray-800 rounded-md cursor-pointer transition-colors border border-gray-700 "
              >
                <div className="flex items-center ">
                  <div className="w-9 h-9 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium mr-3 text-sm">
                    {u.name?.charAt(0).toUpperCase()}
                  </div>
                  <h3 className="font-medium text-base">{u.name}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center p-3 bg-gray-900 border-b border-gray-700">
            <button
              onClick={handleBackToUserList}
              className="mr-3 p-1.5 hover:bg-gray-800 rounded-full transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="w-9 h-9 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium mr-3 text-sm">
              {selectedUser.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-base font-semibold">{selectedUser.name}</h2>
              <p className="text-gray-400 text-xs">Online</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center text-gray-400 mt-12">
                <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Send size={18} className="text-gray-600" />
                </div>
                <p className="text-base">Start chatting with {selectedUser.name}</p>
                <p className="text-xs mt-1">Send a message to begin</p>
              </div>
            ) : (
              messages.map((msg, i) => {
                const isMe = msg.sender === currentUser._id;
                return (
                  <div key={i} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div className="max-w-xs lg:max-w-sm">
                      <div
                        className={`px-3 py-2 rounded-xl text-sm leading-relaxed ${
                          isMe
                            ? "bg-blue-600 text-white rounded-br-md"
                            : "bg-gray-700 text-white rounded-bl-md"
                        }`}
                      >
                        {msg.text}
                      </div>
                      <div
                        className={`text-[10px] text-gray-400 mt-0.5 px-1 ${
                          isMe ? "text-right" : "text-left"
                        }`}
                      >
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Input */}
          <div className="p-3 bg-gray-900 border-t border-gray-700">
            <div className="flex items-center bg-gray-800 rounded-full px-3 py-1.5">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Message ${selectedUser.name}...`}
                className="flex-1 bg-transparent text-white placeholder-gray-400 focus:outline-none px-1 text-sm"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim()}
                className={`p-1.5 rounded-full transition-colors ${
                  input.trim()
                    ? "bg-blue-500 hover:bg-blue-600 text-white"
                    : "bg-gray-700 text-gray-400 cursor-not-allowed"
                }`}
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
