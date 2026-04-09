import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext"; 

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!user) {
      if (socket) {
        try {
          socket.disconnect();
        } catch (e) {
          console.log("socket error",e);
        }
        setSocket(null);
      }
      return;
    }

    // connect only when user exists
    const s = io(import.meta.env.VITE_SOCKET_URL, {
      withCredentials: true,
    });

    s.on("connect", () => {
      setSocket(s);
    });

    s.on("connect_error", (err) =>
      console.error("[socket connect_error]", err?.message)
    );

    return () => {
      try {
        s.off("connect");
        s.off("connect_error");
        s.disconnect();
      } catch (e) {}
    };
    
  }, [user]); 

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
};

export const useSocket = () => useContext(SocketContext);