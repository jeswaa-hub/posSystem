import { useState, useEffect } from "react";
import { useSettings } from "../contexts/SettingsContext";
import { useNotification } from "../contexts/NotificationContext";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import { 
  TrashIcon, 
  PlusIcon,
  SwatchIcon,
  BanknotesIcon,
  TagIcon,
  UserCircleIcon,
  ComputerDesktopIcon
} from "@heroicons/react/24/outline";

export default function Settings() {
  const { settings, categories, updateBranding, addCategory, removeCategory } = useSettings();
  const { user, updateUser } = useAuth();
  const { showNotification } = useNotification();
  
  const [activeTab, setActiveTab] = useState("general"); // general, finance, categories, account
  
  // Branding State
  const [brandingData, setBrandingData] = useState(settings);
  const [newCategoryName, setNewCategoryName] = useState("");

  // Credentials State
  const [userData, setUserData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  // Sync settings
  useEffect(() => {
    setBrandingData(settings);
  }, [settings]);

  // Sync user data
  useEffect(() => {
    if (user) {
      setUserData(prev => ({
        ...prev,
        fullName: user.fullName || "",
        email: user.email || ""
      }));
    }
  }, [user]);

  const handleBrandingChange = (e) => {
    const { name, value } = e.target;
    setBrandingData(prev => ({ ...prev, [name]: value }));
  };

  const handleUserChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    if (categories.some(c => c.name.toLowerCase() === newCategoryName.trim().toLowerCase())) {
      showNotification("Category already exists", "warning");
      return;
    }
    try {
      await addCategory(newCategoryName.trim());
      setNewCategoryName("");
      showNotification("Category added successfully", "success");
    } catch (_err) {
      showNotification("Failed to add category", "error");
    }
  };

  const handleRemoveCategory = async (id) => {
    try {
      await removeCategory(id);
      showNotification("Category removed", "info");
    } catch (_err) {
      showNotification("Failed to remove category", "error");
    }
  };

  const handleBrandingSubmit = async (e) => {
    e.preventDefault();
    try {
      // Ensure taxRate is a number
      const payload = { ...brandingData, taxRate: Number(brandingData.taxRate) };
      await updateBranding(payload);
      showNotification("Settings saved successfully", "success");
    } catch (_err) {
      showNotification("Failed to save settings", "error");
    }
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    if (userData.password && userData.password !== userData.confirmPassword) {
        showNotification("Passwords do not match", "error");
        return;
    }

    try {
        const payload = {
            fullName: userData.fullName,
            email: userData.email,
        };
        if (userData.password) {
            payload.password = userData.password;
        }

        const userId = user?._id || user?.id;
        const res = await api.patch(`/users/${userId}`, payload);
        updateUser(res.data);
        setUserData(prev => ({ ...prev, password: "", confirmPassword: "" }));
        showNotification("Profile updated successfully", "success");
    } catch (err) {
        showNotification(err.response?.data?.message || "Failed to update profile", "error");
    }
  };

  const menuItems = [
    { id: 'general', label: 'General & Branding', icon: ComputerDesktopIcon },
    { id: 'finance', label: 'Finance & Tax', icon: BanknotesIcon },
    { id: 'categories', label: 'Product Categories', icon: TagIcon },
    { id: 'account', label: 'Account Settings', icon: UserCircleIcon },
  ];

  return (
    <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row gap-6 md:gap-8 h-[calc(100vh-140px)] md:h-[calc(100vh-160px)] overflow-hidden">
      
      {/* Sidebar Navigation */}
      <div className="w-full md:w-64 lg:w-72 bg-dark-800 rounded-3xl border border-dark-700 shadow-xl p-4 flex flex-col flex-shrink-0">
        <h2 className="text-xl font-black text-white px-4 py-4 mb-2 tracking-tight">Settings</h2>
        <div className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0 custom-scrollbar">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${
                  isActive 
                    ? "bg-accent text-white shadow-lg shadow-accent/20" 
                    : "text-gray-400 hover:bg-dark-700 hover:text-white"
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-dark-800 rounded-3xl border border-dark-700 shadow-xl overflow-hidden flex flex-col h-full">
        <div className="p-4 md:p-8 overflow-y-auto custom-scrollbar h-full">
          
          {/* General & Branding Section */}
          {activeTab === 'general' && (
            <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
              <div>
                <h3 className="text-2xl font-black text-white mb-2">Branding & Appearance</h3>
                <p className="text-gray-400">Customize how your POS system looks</p>
              </div>
              
              <form onSubmit={handleBrandingSubmit} className="space-y-6">
                {/* App Name */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-500 uppercase tracking-widest">Application Name</label>
                  <input
                    type="text"
                    name="appName"
                    value={brandingData.appName}
                    onChange={handleBrandingChange}
                    className="w-full bg-dark-900 text-white px-4 py-3 rounded-xl border border-dark-700 focus:border-accent focus:ring-1 focus:ring-accent transition-all outline-none font-bold"
                    placeholder="POS System"
                  />
                </div>

                {/* App Subtitle */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-500 uppercase tracking-widest">Subtitle / Tagline</label>
                  <input
                    type="text"
                    name="appSubtitle"
                    value={brandingData.appSubtitle}
                    onChange={handleBrandingChange}
                    className="w-full bg-dark-900 text-white px-4 py-3 rounded-xl border border-dark-700 focus:border-accent focus:ring-1 focus:ring-accent transition-all outline-none font-bold"
                    placeholder="Admin Dashboard"
                  />
                </div>

                {/* Logo Character */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-500 uppercase tracking-widest">Logo Character (Single Letter)</label>
                  <input
                    type="text"
                    name="logoChar"
                    maxLength={1}
                    value={brandingData.logoChar}
                    onChange={handleBrandingChange}
                    className="w-full bg-dark-900 text-white px-4 py-3 rounded-xl border border-dark-700 focus:border-accent focus:ring-1 focus:ring-accent transition-all outline-none font-bold"
                    placeholder="S"
                  />
                </div>

                {/* Logo Gradient */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-500 uppercase tracking-widest">Gradient Start</label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        name="logoColorStart"
                        value={brandingData.logoColorStart}
                        onChange={handleBrandingChange}
                        className="h-12 w-16 bg-transparent cursor-pointer rounded-lg border border-dark-700 p-1 flex-shrink-0"
                      />
                      <input
                        type="text"
                        name="logoColorStart"
                        value={brandingData.logoColorStart}
                        onChange={handleBrandingChange}
                        className="flex-1 w-full min-w-0 bg-dark-900 text-white px-4 py-3 rounded-xl border border-dark-700 focus:border-accent outline-none font-mono text-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-500 uppercase tracking-widest">Gradient End</label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        name="logoColorEnd"
                        value={brandingData.logoColorEnd}
                        onChange={handleBrandingChange}
                        className="h-12 w-16 bg-transparent cursor-pointer rounded-lg border border-dark-700 p-1 flex-shrink-0"
                      />
                      <input
                        type="text"
                        name="logoColorEnd"
                        value={brandingData.logoColorEnd}
                        onChange={handleBrandingChange}
                        className="flex-1 w-full min-w-0 bg-dark-900 text-white px-4 py-3 rounded-xl border border-dark-700 focus:border-accent outline-none font-mono text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Preview Section */}
                <div className="mt-8 p-6 bg-dark-900 rounded-2xl border border-dark-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 relative flex items-center justify-center">
                      <div 
                        className="absolute inset-0 rounded-2xl blur-md opacity-75 animate-pulse" 
                        style={{ background: `linear-gradient(to top right, ${brandingData.logoColorStart}, ${brandingData.logoColorEnd})` }}
                      />
                      <div className="relative w-full h-full bg-dark-900 rounded-xl flex items-center justify-center border border-white/10 z-10 overflow-hidden">
                        <span 
                          className="text-4xl font-black bg-clip-text text-transparent transform -skew-x-6"
                          style={{ backgroundImage: `linear-gradient(to bottom right, ${brandingData.logoColorStart}, ${brandingData.logoColorEnd})` }}
                        >
                          {brandingData.logoChar}
                        </span>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-2xl font-bold text-white tracking-tight">{brandingData.appName}</h4>
                      <p className="text-sm text-gray-400">{brandingData.appSubtitle}</p>
                    </div>
                  </div>
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-widest bg-dark-800 px-3 py-1 rounded-lg border border-dark-700">Live Preview</div>
                </div>

                <div className="pt-6 flex justify-end">
                  <button
                    type="submit"
                    className="px-8 py-3 bg-accent hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg shadow-accent/20 transition-all transform hover:scale-105 active:scale-95"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Finance Section */}
          {activeTab === 'finance' && (
            <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
              <div>
                <h3 className="text-2xl font-black text-white mb-2">Finance & Tax</h3>
                <p className="text-gray-400">Manage tax rates and financial settings</p>
              </div>

              <form onSubmit={handleBrandingSubmit} className="space-y-6">
                <div className="bg-dark-900 p-6 rounded-2xl border border-dark-700">
                  <div className="space-y-4">
                    <label className="text-sm font-bold text-gray-500 uppercase tracking-widest">Default Tax Rate</label>
                    <div className="relative">
                      <input
                        type="number"
                        name="taxRate"
                        min="0"
                        step="0.01"
                        value={brandingData.taxRate ?? 12}
                        onChange={handleBrandingChange}
                        className="w-full bg-dark-800 text-white pl-4 pr-12 py-4 rounded-xl border border-dark-700 focus:border-accent focus:ring-1 focus:ring-accent transition-all outline-none font-bold text-lg"
                        placeholder="12"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-black text-lg">%</span>
                    </div>
                    <p className="text-sm text-gray-400">
                      This percentage will be applied to all transactions automatically. Set to 0 for no tax.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-8 py-3 bg-accent hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg shadow-accent/20 transition-all transform hover:scale-105 active:scale-95"
                  >
                    Update Tax Rate
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Categories Section */}
          {activeTab === 'categories' && (
            <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
              <div>
                <h3 className="text-2xl font-black text-white mb-2">Product Categories</h3>
                <p className="text-gray-400">Organize your products with custom categories</p>
              </div>

              <div className="space-y-6">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCategory())}
                    className="flex-1 bg-dark-900 text-white px-6 py-4 rounded-2xl border border-dark-700 focus:border-accent outline-none font-bold placeholder:font-normal"
                    placeholder="Type new category name..."
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    className="bg-accent text-white px-6 py-4 rounded-2xl hover:bg-orange-600 transition-all font-bold shadow-lg shadow-accent/20"
                  >
                    <PlusIcon className="w-6 h-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {categories?.map(cat => (
                    <div key={cat._id} className="flex items-center justify-between bg-dark-900 text-gray-300 px-5 py-4 rounded-2xl border border-dark-700 group hover:border-gray-600 transition-all">
                      <span className="font-bold text-white">{cat.name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCategory(cat._id)}
                        className="text-gray-600 hover:text-red-500 transition-colors p-2 hover:bg-dark-800 rounded-lg"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                  {categories?.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-500 border-2 border-dashed border-dark-700 rounded-2xl">
                      No categories found. Add one above.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Account Section */}
          {activeTab === 'account' && (
            <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
              <div>
                <h3 className="text-2xl font-black text-white mb-2">Account Settings</h3>
                <p className="text-gray-400">Update your profile information and password</p>
              </div>

              <form onSubmit={handleUserSubmit} className="space-y-6">
                <div className="space-y-4">
                  {/* Full Name */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-500 uppercase tracking-widest">Full Name</label>
                    <input
                      type="text"
                      name="fullName"
                      value={userData.fullName}
                      onChange={handleUserChange}
                      className="w-full bg-dark-900 text-white px-4 py-3 rounded-xl border border-dark-700 focus:border-accent focus:ring-1 focus:ring-accent transition-all outline-none font-bold"
                      placeholder="John Doe"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-500 uppercase tracking-widest">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={userData.email}
                      onChange={handleUserChange}
                      className="w-full bg-dark-900 text-white px-4 py-3 rounded-xl border border-dark-700 focus:border-accent focus:ring-1 focus:ring-accent transition-all outline-none font-bold"
                      placeholder="john@example.com"
                    />
                  </div>

                  <div className="border-t border-dark-700 my-6 pt-6">
                    <h4 className="text-lg font-bold text-white mb-4">Change Password</h4>
                    {/* Password */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-500 uppercase tracking-widest">New Password</label>
                        <input
                          type="password"
                          name="password"
                          value={userData.password}
                          onChange={handleUserChange}
                          className="w-full bg-dark-900 text-white px-4 py-3 rounded-xl border border-dark-700 focus:border-accent focus:ring-1 focus:ring-accent transition-all outline-none font-bold"
                          placeholder="••••••••"
                        />
                      </div>

                      {/* Confirm Password */}
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-500 uppercase tracking-widest">Confirm New Password</label>
                        <input
                          type="password"
                          name="confirmPassword"
                          value={userData.confirmPassword}
                          onChange={handleUserChange}
                          className="w-full bg-dark-900 text-white px-4 py-3 rounded-xl border border-dark-700 focus:border-accent focus:ring-1 focus:ring-accent transition-all outline-none font-bold"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-8 py-3 bg-accent hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg shadow-accent/20 transition-all transform hover:scale-105 active:scale-95"
                  >
                    Update Profile
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
