/* 
  [PRODUCTION_ELEMENT_REMOVED]: SocketProvider boilerplate for production domain moved to ForProduction.md
  Timestamp: 2026-03-08 | Reason: Separation of development and production code.
*/

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error("useSocket must be used within a SocketProvider");
  return context.socket;
};

export const useSocketState = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error("useSocketState must be used within a SocketProvider");
  return { isConnected: context.isConnected, lastError: context.lastError };
};

export const SocketProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastError, setLastError] = useState(null);

  const socket = useMemo(() => {
    /*
      [PRODUCTION_ELEMENT_REMOVED]: Production URL fallback and HTTPS enforcement moved to ForProduction.md
      Timestamp: 2026-03-08 | Reason: Simplifying for local development environment.
    */
    const socketUrl = import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, "") || "http://localhost:5000";

    return io(socketUrl, {
      transports: ["polling", "websocket"], // Allow polling fallback for more reliable connection
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      withCredentials: true // Important for CORS
    });
  }, []);

  useEffect(() => {
    console.log("Setting up socket listeners. Current socket status:", socket.connected);
    
    // Set initial state based on current connection status
    setIsConnected(socket.connected);

    const onConnect = () => {
      console.log("SOCKET EVENT: connect");
      setIsConnected(true);
      setLastError(null);
    };

    const onDisconnect = (reason) => {
      console.log("SOCKET EVENT: disconnect, reason:", reason);
      setIsConnected(false);
    };

    const onConnectError = (err) => {
      console.error("SOCKET EVENT: connect_error, error:", err);
      setLastError(err.message);
      setIsConnected(false);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);

    // If socket is already connected when effect runs, trigger onConnect manually
    if (socket.connected) {
      onConnect();
    }

    return () => {
      console.log("Cleaning up socket listeners");
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
    };
  }, [socket]);

  const value = {
    socket,
    isConnected,
    lastError
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
