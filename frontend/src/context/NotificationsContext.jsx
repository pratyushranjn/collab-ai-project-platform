import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useSocket } from "./SocketContext";
import toast from "react-hot-toast";

const NotificationsContext = createContext(null);

export const NotificationsProvider = ({ children }) => {
  const socket = useSocket();
  const [items, setItems] = useState([]);       // {id?, type, createdAt, data, read}
  const [unread, setUnread] = useState(0);

  // Add a new notification
  const push = (n) => {
    setItems(prev => {
      const next = [{ ...n, _cid: crypto.randomUUID(), read: false }, ...prev];
      return next;
    });
    setUnread(u => u + 1);
  };

  const markAllRead = () => {
    setItems(prev => prev.map(n => ({ ...n, read: true })));
    setUnread(0);
  };

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    socket.off('notification:new');

    const onNotification = (payload) => {
      if (payload.type === 'task.assigned') {
        toast.success(`New task: ${payload.data.title} (${payload.data.projectName})`);
      }
      if (payload.type === 'chat.message') {
        toast(`💬 New message in ${payload.data.projectName}`, {
          style: {
            background: "#0f172a",  
            color: "#f8fafc",     
            borderRadius: "10px",
            padding: "12px 16px",
            fontSize: "14px",
            fontWeight: 500,
            borderLeft: "4px solid #3b82f6", 
          },
        });
      }
      push(payload);
    };

    socket.on('notification:new', onNotification);
    return () => {
      socket.off('notification:new', onNotification);
    };
  }, [socket]);

  const value = useMemo(() => ({
    items,
    unread,
    push,
    markAllRead,
  }), [items, unread]);

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationsContext);
