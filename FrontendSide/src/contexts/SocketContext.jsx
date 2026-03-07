// import { createContext, useContext, useEffect, useMemo } from "react";
// import { io } from "socket.io-client";

// const SocketContext = createContext();

// export const useSocket = () => useContext(SocketContext);

// export const SocketProvider = ({ children }) => {
//   const socket = useMemo(() => {
//     return io("https://samokivalley.springbullbars.shop", {
//       transports: ["websocket"],
//       autoConnect: true,
//     });
//   }, []);

//   useEffect(() => {
//     return () => socket.close();
//   }, [socket]);

//   return (
//     <SocketContext.Provider value={socket}>
//       {children}
//     </SocketContext.Provider>
//   );
// };

import { createContext, useContext, useEffect, useMemo } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const socket = useMemo(() => {
    const rawBaseUrl =
      import.meta.env.VITE_API_URL ||
      "https://samokivalley.springbullbars.shop/api";
    // Strip /api path — Socket.IO connects to server root, not the API prefix
    const socketUrl = rawBaseUrl.replace(/^http:\/\//i, "https://").replace(/\/api\/?$/, "");

    return io(socketUrl, {
      transports: ["websocket"],
      autoConnect: true,
    });
  }, []);

  useEffect(() => {
    return () => socket.close();
  }, [socket]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
