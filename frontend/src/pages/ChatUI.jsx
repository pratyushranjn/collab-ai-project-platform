import React, { useState, useEffect, useRef } from "react";
import { Send } from "lucide-react";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000"); 

export default function ChatUI({ projectId, user }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    socket.emit("joinProjectRoom", projectId);

    socket.on("receiveMessage", (message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      socket.off("receiveMessage");
    };
  }, [projectId]);

  const sendMessage = () => {
    if (newMessage.trim() === "") return;

    const messageData = {
      user: user.name,
      text: newMessage,
      timestamp: new Date().toISOString(),
    };

    socket.emit("sendMessage", { projectId, message: messageData });
    setMessages((prev) => [...prev, messageData]);
    setNewMessage("");
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white p-4">
      {/* Chat messages scrollable */}
      <div className="flex-1 overflow-y-auto mb-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`mb-2 max-w-xs break-words ${
              msg.user === user.name ? "ml-auto text-right" : "mr-auto text-left"
            }`}
          >
            <div
              className={`inline-block p-2 rounded-lg ${
                msg.user === user.name ? "bg-blue-600" : "bg-gray-700"
              }`}
            >
              <span className="font-semibold">{msg.user}: </span>
              <span>{msg.text}</span>
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {new Date(msg.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input fixed at bottom */}
      <div className="flex">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-3 py-2 rounded-l bg-gray-800 border border-gray-700 focus:outline-none placeholder-gray-400"
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          onClick={sendMessage}
          className="bg-blue-500 hover:bg-blue-600 px-4 rounded-r flex items-center justify-center"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
}
