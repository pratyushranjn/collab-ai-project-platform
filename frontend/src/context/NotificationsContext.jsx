import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useSocket } from "./SocketContext";
import toast from "react-hot-toast";

const NotificationsContext = createContext(null);

export const NotificationsProvider = ({ children }) => {
  const socket = useSocket();
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("notifications");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setItems(parsed);
        setUnread(parsed.filter((n) => !n.read).length);
      } catch (e) {
        console.error("Failed to parse notifications", e);
      }
    }
  }, []);

  // Save to localStorage whenever items change
  useEffect(() => {
    if (items.length > 0) {
      localStorage.setItem("notifications", JSON.stringify(items));
    } else {
      localStorage.removeItem("notifications");
    }
    setUnread(items.filter((n) => !n.read).length);
  }, [items]);

  // Add new notification
  const push = (n) => {
    const safeData =
      n.type === "chat.message"
        ? {
          projectId: n.data.projectId,
          projectName: n.data.projectName,
          messageId: n.data.messageId,
          sender: n.data.sender?.name || "Unknown",
        }
        : n.data;

    setItems((prev) => {
      const next = [
        {
          ...n,
          data: safeData,
          _cid: crypto.randomUUID(),
          read: false,
          createdAt: Date.now(),
        },
        ...prev,
      ];
      return next.slice(0, 25);
    });
  };

  const markAllRead = () => {
    setItems([]);
    localStorage.removeItem("notifications");
    setUnread(0);
  };

  const removeNotification = (id) => {
    setItems((prev) => prev.filter((n) => n._cid !== id));
  };


  const markOneRead = (id) => {
    setItems((prev) =>
      prev.map((n) => (n._cid === id ? { ...n, read: true } : n))
    );
  };
  

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    const onNotification = (payload) => {
      if (payload.type === "task.assigned") {
        toast.success(
          `New task: ${payload.data.title} (${payload.data.projectName})`
        );
      }
      if (payload.type === "chat.message") {
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

    socket.on("notification:new", onNotification);
    return () => socket.off("notification:new", onNotification);
  }, [socket]);

  const value = useMemo(
    () => ({
      items,
      unread,
      push,
      markAllRead,
      markOneRead,
      removeNotification
    }),
    [items, unread]
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationsContext);
