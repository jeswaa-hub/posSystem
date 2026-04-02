import { createContext, useContext, useState, useEffect } from "react";
import { useSocket } from "./SocketContext";
import api from "../services/api";

const SettingsContext = createContext();

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}

export function SettingsProvider({ children }) {
  const socket = useSocket();
  const [settings, setSettings] = useState({
    appName: "POS System",
    appSubtitle: "Admin Dashboard",
    logoChar: "S",
    logoColorStart: "#f59e0b",
    logoColorEnd: "#dc2626",
    taxRate: 12,
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all settings and categories from Backend
  const fetchData = async () => {
    try {
      const [settingsRes, categoriesRes] = await Promise.all([
        api.get("settings"),
        api.get("categories")
      ]);

      if (settingsRes.data) {
        setSettings(settingsRes.data);
      }
      if (categoriesRes.data) {
        setCategories(categoriesRes.data);
      }
    } catch (err) {
      console.error("Failed to fetch data from DB:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Real-time Updates
  useEffect(() => {
    if (!socket) return;

    socket.on("settings_updated", (newSettings) => {
      setSettings(newSettings);
    });

    socket.on("category_created", (newCategory) => {
      setCategories(prev => {
        if (prev.find(c => c._id === newCategory._id)) return prev;
        return [...prev, newCategory];
      });
    });

    socket.on("category_updated", (updatedCategory) => {
      setCategories(prev => prev.map(c => c._id === updatedCategory._id ? updatedCategory : c));
    });

    socket.on("category_deleted", (deletedId) => {
      setCategories(prev => prev.filter(c => c._id !== deletedId));
    });

    return () => {
      socket.off("settings_updated");
      socket.off("category_created");
      socket.off("category_updated");
      socket.off("category_deleted");
    };
  }, [socket]);

  const updateBranding = async (newBranding) => {
    try {
      const res = await api.patch("settings", newBranding);
      // Immediate update for better UX
      setSettings(res.data);
      return res.data;
    } catch (err) {
      console.error("Failed to save branding:", err);
      throw err;
    }
  };

  const addCategory = async (name) => {
    try {
      const res = await api.post("categories", { name });
      // Immediate update for better UX
      setCategories(prev => {
        if (prev.find(c => c._id === res.data._id)) return prev;
        return [...prev, res.data];
      });
      return res.data;
    } catch (err) {
      console.error("Failed to add category:", err);
      throw err;
    }
  };

  const removeCategory = async (id) => {
    try {
      await api.delete(`categories/${id}`);
      // Immediate update for better UX
      setCategories(prev => prev.filter(c => c._id !== id));
    } catch (err) {
      console.error("Failed to remove category:", err);
      throw err;
    }
  };

  return (
    <SettingsContext.Provider value={{ 
      settings, 
      categories, 
      updateBranding, 
      addCategory, 
      removeCategory,
      loading,
      refreshData: fetchData 
    }}>
      {!loading && children}
    </SettingsContext.Provider>
  );
}
