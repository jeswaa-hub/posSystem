# ForProduction
This file contains all production-related components, configurations, and code segments removed from the main codebase for tracking and future integration.

## [BackendSide\server.js](file:///c:/Users/LENOVO/Desktop/POS%20System/BackendSide/server.js)
**Timestamp:** 2026-03-08
**Reason for Removal:** Separation of production CORS origins from development environment.

### Original Code (Line 38-43):
```javascript
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "https://samokivalley.springbullbars.shop"], // Restrict to trusted domains
    methods: ["GET", "POST", "PATCH", "DELETE"],
    credentials: true
  }
});
```

### Original Code (Line 48-51):
```javascript
app.use(cors({
  origin: ["http://localhost:5173", "https://samokivalley.springbullbars.shop"], // Restrict CORS
  credentials: true
}));
```

---

## [FrontendSide\src\contexts\SocketContext.jsx](file:///c:/Users/LENOVO/Desktop/POS%20System/FrontendSide/src/contexts/SocketContext.jsx)
**Timestamp:** 2026-03-08
**Reason for Removal:** Moving production WebSocket URL and HTTPS enforcement logic to ForProduction.

### Original Code (Line 1-24):
```javascript
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
```

### Original Code (Line 43-53):
```javascript
    const rawBaseUrl =
      import.meta.env.VITE_API_URL ||
      "http://localhost:5000/api";
    // Strip /api path — Socket.IO connects to server root, not the API prefix
    let socketUrl = rawBaseUrl.replace(/\/api\/?$/, "");
    
    // Force HTTPS for production domains (not localhost)
    if (!socketUrl.includes("localhost") && !socketUrl.includes("127.0.0.1")) {
      socketUrl = socketUrl.replace(/^http:\/\//i, "https://");
    }
```

---

## [FrontendSide\src\services\api.js](file:///c:/Users/LENOVO/Desktop/POS%20System/FrontendSide/src/services/api.js)
**Timestamp:** 2026-03-08
**Reason for Removal:** Removing hardcoded production API URL fallback.

### Original Code (Line 4):
```javascript
  baseURL: import.meta.env.VITE_API_URL || "https://apisamokivalley.springbullbars.shop/api",
```

---

## [FrontendSide\.env](file:///c:/Users/LENOVO/Desktop/POS%20System/FrontendSide/.env)
**Timestamp:** 2026-03-08
**Reason for Removal:** Removing commented-out production API URL from environment variables.

### Original Code (Line 1):
```env
# VITE_API_URL=https://apisamokivalley.springbullbars.shop/api
```
