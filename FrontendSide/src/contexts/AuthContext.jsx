import { createContext, useContext, useEffect, useState } from "react";
import { getCurrentUser, logout as authLogout } from "../services/auth";
import LoadingScreen from "../components/LoadingScreen";
import api from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = () => {
    authLogout();
    setUser(null);
  };

  useEffect(() => {
    // Check if the current user is still active in the DB
    const checkUserStatus = async () => {
      const savedUser = getCurrentUser();
      if (savedUser) {
        try {
          const userId = savedUser._id || savedUser.id;
          const res = await api.get(`/users/${userId}`);
          if (res.data.isActive === false) {
            logout();
          } else {
            setUser(res.data);
          }
        } catch (err) {
          console.error("Session verification failed:", err);
          // If 404 or other errors, log out for safety
          if (err.response?.status === 404) logout();
        }
      }
      
      setTimeout(() => {
        setLoading(false);
      }, 1500);
    };

    checkUserStatus();
  }, []);

  const login = (userData, token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const updateUser = (userData) => {
    setUser((prev) => {
      const updated = { ...(prev || {}), ...(userData || {}) };
      localStorage.setItem("user", JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, loading }}>
      {loading ? <LoadingScreen /> : children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
