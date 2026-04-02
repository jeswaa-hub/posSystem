import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useSocket } from "../contexts/SocketContext";
import { useAuth } from "../contexts/AuthContext";
import { 
  UserPlusIcon, 
  ShieldCheckIcon, 
  PencilSquareIcon, 
  TrashIcon, 
  MagnifyingGlassIcon, 
  XMarkIcon, 
  ClipboardDocumentListIcon, 
  UserCircleIcon, 
  CheckCircleIcon, 
  Squares2X2Icon, 
  ShoppingCartIcon, 
  TagIcon, 
  CubeIcon, 
  UsersIcon, 
  ChartBarIcon, 
  Cog6ToothIcon, 
  ArrowLeftIcon, 
  ChevronRightIcon, 
  LockClosedIcon, 
  InformationCircleIcon, 
  ShieldExclamationIcon, 
  PowerIcon, 
  CheckIcon,
  KeyIcon
} from "@heroicons/react/24/outline";
import { useNotification } from "../contexts/NotificationContext";
import api from "../services/api";
import UsersSkeleton from "../components/skeletons/UsersSkeleton";

export default function Users() {
  const socket = useSocket();
  const { user: currentUser } = useAuth(); // Get current logged-in user
  const { showNotification } = useNotification();
  const [userList, setUserList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    role: "cashier",
    permissions: [],
    password: "" // Add password field
  });

  const [addFormData, setAddFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "cashier",
    permissions: ["dashboard", "pos", "transactions"]
  });

  // Role Definitions with Default Permissions
  const roleDefaults = {
    admin: ["dashboard", "pos", "transactions", "products", "inventory", "customers", "reports", "users", "settings"],
    manager: ["dashboard", "pos", "transactions", "products", "inventory", "customers", "reports"],
    cashier: ["dashboard", "pos", "transactions"]
  };

  // Permissions Grouped by Category
  const permissionGroups = [
    {
      title: "Core Access",
      permissions: [
        { id: "dashboard", label: "Access Dashboard", icon: Squares2X2Icon, description: "Can view the main dashboard overview" },
        { id: "pos", label: "Access POS", icon: ShoppingCartIcon, description: "Can make sales and process transactions" },
        { id: "transactions", label: "View Transactions", icon: ClipboardDocumentListIcon, description: "Can view sales history and transaction details" },
      ]
    },
    {
      title: "Inventory Management",
      permissions: [
        { id: "products", label: "Manage Products", icon: TagIcon, description: "Can add, edit, and delete products" },
        { id: "inventory", label: "Access Inventory", icon: CubeIcon, description: "Can view and update stock levels" },
      ]
    },
    {
      title: "Customer & Sales",
      permissions: [
        { id: "customers", label: "Manage Customers", icon: UsersIcon, description: "Can view and edit customer data" },
        { id: "reports", label: "View Reports", icon: ChartBarIcon, description: "Can access sales and performance reports" },
      ]
    },
    {
      title: "Administration",
      permissions: [
        { id: "users", label: "User Management", icon: ShieldCheckIcon, description: "Can manage employee accounts and permissions" },
        { id: "settings", label: "System Settings", icon: Cog6ToothIcon, description: "Can modify system branding and categories" },
      ]
    }
  ];

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get("users");
      setUserList(res.data);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      showNotification("Failed to load user list", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Real-time Updates
  useEffect(() => {
    if (!socket) return;

    socket.on("user_created", (newUser) => {
      setUserList(prev => {
        if (prev.find(u => u._id === newUser._id)) return prev;
        return [...prev, newUser];
      });
    });

    socket.on("user_updated", (updatedUser) => {
      setUserList(prev => prev.map(u => u._id === updatedUser._id ? updatedUser : u));
      
      // Conflict detection: If this user is currently being edited
      if (isModalOpen && selectedUser?._id === updatedUser._id) {
        showNotification("This user account was modified by another admin.", "warning");
      }
    });

    socket.on("user_deleted", (deletedId) => {
      setUserList(prev => prev.filter(u => u._id !== deletedId));
    });

    return () => {
      socket.off("user_created");
      socket.off("user_updated");
      socket.off("user_deleted");
    };
  }, [socket]);

  const filteredUsers = userList.filter(u => 
    (u.fullName?.toLowerCase() || "").includes(searchQuery.toLowerCase()) || 
    (u.email?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  );

  const handleEditClick = (user) => {
    setSelectedUser(user);
    setFormData({
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      permissions: user.permissions || roleDefaults[user.role],
      password: "" // Reset password field
    });
    setIsModalOpen(true);
  };

  const handleRoleChange = (role) => {
    // Only admin can change roles
    if (currentUser.role !== 'admin') return;
    
    setFormData(prev => ({
      ...prev,
      role,
      permissions: roleDefaults[role]
    }));
  };

  const handlePermissionToggle = (permId) => {
    // Only admin can change permissions
    if (currentUser.role !== 'admin') return;

    setFormData(prev => {
      const newPermissions = prev.permissions.includes(permId)
        ? prev.permissions.filter(id => id !== permId)
        : [...prev.permissions, permId];
      
      return { ...prev, permissions: newPermissions };
    });
  };

  const handleAddRoleChange = (newRole) => {
    setAddFormData(prev => ({
      ...prev,
      role: newRole,
      permissions: roleDefaults[newRole]
    }));
  };

  const handleAddPermissionToggle = (permId) => {
    setAddFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permId)
        ? prev.permissions.filter(p => p !== permId)
        : [...prev.permissions, permId]
    }));
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("users/register", addFormData);
      // Removed manual state update: socket handles it
      setIsAddModalOpen(false);
      setAddFormData({
        fullName: "",
        email: "",
        password: "",
        role: "cashier",
        permissions: ["dashboard", "pos", "transactions"]
      });
      showNotification("Employee added successfully", "success");
    } catch (err) {
      console.error("Failed to add employee:", err);
      showNotification(err.response?.data?.message || "Failed to add employee", "error");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const updateData = {
        fullName: formData.fullName,
        email: formData.email,
      };

      // Only include password if it's not empty
      if (formData.password) {
        updateData.password = formData.password;
      }

      // Only include role and permissions if user is admin
      if (currentUser.role === 'admin') {
        updateData.role = formData.role;
        updateData.permissions = formData.permissions;
      }

      await api.patch(`/users/${selectedUser._id}`, updateData);
      // Removed manual state update: socket handles it
      setIsModalOpen(false);
      showNotification("User updated successfully", "success");
    } catch (err) {
      console.error("Failed to update user:", err);
      showNotification("Failed to update user", "error");
    }
  };

  const handleDeleteClick = (user) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      const newStatus = selectedUser.isActive !== false ? false : true;
      await api.patch(`/users/${selectedUser._id}`, { isActive: newStatus });
      // Removed manual state update: socket handles it
      setIsDeleteModalOpen(false);
      showNotification(`User account ${newStatus ? 'activated' : 'deactivated'}`, "info");
    } catch (err) {
      console.error("Failed to update user status:", err);
      showNotification("Failed to update user status", "error");
    }
  };

  if (loading) return <UsersSkeleton />;

  return (
    <div className="p-2 space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">User Management</h2>
          <p className="text-gray-400 mt-1">Manage employee accounts and their access permissions</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-accent hover:bg-orange-600 text-white font-bold px-6 py-4 rounded-2xl shadow-lg transition-all transform hover:-translate-y-1 active:scale-95"
        >
          <UserPlusIcon className="w-5 h-5" />
          <span>Add New Employee</span>
        </button>
      </div>

      {/* Search Section */}
      <div className="bg-dark-800 p-6 rounded-3xl border border-dark-700 shadow-xl">
        <div className="relative max-w-md">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input 
            type="text" 
            placeholder="Search employees by name or email..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-dark-900 text-white pl-12 pr-4 py-4 rounded-2xl border border-dark-700 focus:border-accent outline-none transition-all placeholder:text-gray-600"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-dark-800 rounded-3xl border border-dark-700 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-dark-900/50 border-b border-dark-700">
                <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Employee</th>
                <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Role</th>
                <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Permissions</th>
                <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700/50">
              {filteredUsers.map(user => (
                <tr key={user._id || user.id} className="hover:bg-dark-700/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                        <UserCircleIcon className="w-8 h-8" />
                      </div>
                      <div>
                        <p className="text-white font-bold">{user.fullName}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-dark-900 text-gray-400 text-xs font-bold rounded-lg border border-dark-700 capitalize">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {(user.permissions || []).slice(0, 3).map(p => (
                        <span key={p} className="text-[10px] bg-accent/5 text-accent/80 border border-accent/10 px-2 py-0.5 rounded uppercase font-black">
                          {p}
                        </span>
                      ))}
                      {(user.permissions || []).length > 3 && (
                        <span className="text-[10px] bg-dark-900 text-gray-500 px-2 py-0.5 rounded font-black">
                          +{(user.permissions || []).length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {user.isActive !== false ? (
                      <span className="flex items-center gap-1.5 text-green-500 text-[10px] font-black uppercase tracking-wider bg-green-500/10 px-2.5 py-1 rounded-full border border-green-500/20">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                        Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-red-500 text-[10px] font-black uppercase tracking-wider bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/20">
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleEditClick(user)}
                        className="p-2.5 bg-dark-900 text-gray-400 hover:text-accent hover:border-accent border border-dark-700 rounded-xl transition-all"
                        title="Edit Permissions"
                      >
                        <ShieldCheckIcon className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(user)}
                        className={`p-2.5 bg-dark-900 border border-dark-700 rounded-xl transition-all ${
                          user.isActive !== false 
                          ? "text-gray-400 hover:text-red-500 hover:border-red-500" 
                          : "text-green-500 border-green-500/30 hover:bg-green-500/10"
                        }`}
                        title={user.isActive !== false ? "Deactivate User" : "Activate User"}
                      >
                        {user.isActive !== false ? (
                          <PowerIcon className="w-5 h-5" />
                        ) : (
                          <CheckIcon className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Employee Modal (Redesigned) */}
      {isAddModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-hidden">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-2xl" onClick={() => setIsAddModalOpen(false)} />
          <div className="relative w-full max-w-4xl bg-dark-800 rounded-[2.5rem] border border-dark-700 shadow-2xl overflow-hidden animate-modal-in flex flex-col max-h-[90vh]">
            
            {/* Header with Breadcrumbs */}
            <div className="p-8 border-b border-dark-700 bg-dark-800/50 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
                <button 
                  onClick={() => setIsAddModalOpen(false)}
                  className="hover:text-accent transition-colors flex items-center gap-1"
                >
                  <ArrowLeftIcon className="w-3 h-3" />
                  User Management
                </button>
                <ChevronRightIcon className="w-3 h-3" />
                <span className="text-white">Register New Employee</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-3xl font-black text-white tracking-tight">Create Employee Account</h3>
                  <p className="text-gray-400 text-sm mt-1">Set up profile and access for new staff members</p>
                </div>
                <button onClick={() => setIsAddModalOpen(false)} className="p-3 bg-dark-900 rounded-2xl text-gray-500 hover:text-white transition-all border border-dark-700">
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
              <form onSubmit={handleAddSubmit} className="space-y-10">
                
                {/* Account Details Section */}
                <section className="space-y-6">
                  <div className="flex items-center gap-3 text-accent mb-2">
                    <UserCircleIcon className="w-6 h-6" />
                    <h4 className="text-lg font-bold text-white uppercase tracking-wider text-sm">Account Details</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-dark-900/50 p-8 rounded-3xl border border-dark-700/50">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Full Name</label>
                      <input
                        required
                        type="text"
                        value={addFormData.fullName}
                        onChange={(e) => setAddFormData({ ...addFormData, fullName: e.target.value })}
                        className="w-full bg-dark-800/50 text-white font-bold px-5 py-3 rounded-2xl border border-dark-700/30 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
                        placeholder="e.g. John Doe"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Email Address</label>
                      <input
                        required
                        type="email"
                        value={addFormData.email}
                        onChange={(e) => setAddFormData({ ...addFormData, email: e.target.value })}
                        className="w-full bg-dark-800/50 text-white font-medium px-5 py-3 rounded-2xl border border-dark-700/30 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
                        placeholder="john@example.com"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Initial Password</label>
                      <input
                        required
                        type="password"
                        value={addFormData.password}
                        onChange={(e) => setAddFormData({ ...addFormData, password: e.target.value })}
                        className="w-full bg-dark-800/50 text-white font-medium px-5 py-3 rounded-2xl border border-dark-700/30 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                </section>

                {/* Role Selection Section */}
                <section className="space-y-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3 text-accent">
                      <ShieldCheckIcon className="w-6 h-6" />
                      <h4 className="text-lg font-bold text-white uppercase tracking-wider text-sm">Role Assignment</h4>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-accent/10 rounded-xl border border-accent/20">
                      <InformationCircleIcon className="w-4 h-4 text-accent" />
                      <span className="text-[10px] font-bold text-accent uppercase tracking-widest">Auto-assigns default perms</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.keys(roleDefaults).map(role => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => handleAddRoleChange(role)}
                        className={`group relative p-6 rounded-[2rem] border-2 transition-all duration-300 text-left overflow-hidden ${
                          addFormData.role === role 
                          ? "bg-accent/10 border-accent shadow-2xl shadow-accent/10" 
                          : "bg-dark-900/50 border-dark-700/50 hover:border-dark-600 grayscale opacity-60 hover:opacity-100 hover:grayscale-0"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className={`text-lg font-black uppercase tracking-tighter ${addFormData.role === role ? "text-accent" : "text-gray-500"}`}>
                            {role}
                          </span>
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                            addFormData.role === role ? "bg-accent border-accent scale-110" : "border-dark-600"
                          }`}>
                            {addFormData.role === role && <CheckCircleIcon className="w-4 h-4 text-white" />}
                          </div>
                        </div>
                        <p className={`text-xs leading-relaxed ${addFormData.role === role ? "text-gray-300" : "text-gray-600"}`}>
                          {role === 'admin' ? "Full system access including all settings and user management." : 
                           role === 'manager' ? "Manage products, inventory, customers and view all reports." : 
                           "Basic access for sales processing and dashboard overview."}
                        </p>
                        {addFormData.role === role && (
                          <div className="absolute -right-4 -bottom-4 opacity-10">
                            <ShieldCheckIcon className="w-24 h-24" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </section>

                {/* Permissions Section Grouped */}
                <section className="space-y-8">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3 text-accent">
                      <LockClosedIcon className="w-6 h-6" />
                      <h4 className="text-lg font-bold text-white uppercase tracking-wider text-sm">Permissions Matrix</h4>
                    </div>
                    {(addFormData.permissions.length !== roleDefaults[addFormData.role].length || 
                      !addFormData.permissions.every(p => roleDefaults[addFormData.role].includes(p))) && (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-500/10 rounded-xl border border-orange-500/20 animate-pulse">
                        <ShieldExclamationIcon className="w-4 h-4 text-orange-500" />
                        <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">Custom Overrides Active</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                    {permissionGroups.map((group, gIdx) => (
                      <div key={gIdx} className="space-y-5">
                        <h5 className="text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-3">
                          {group.title}
                          <div className="h-px bg-dark-700/50 flex-1" />
                        </h5>
                        <div className="space-y-3">
                          {group.permissions.map(perm => {
                            const isDefault = roleDefaults[addFormData.role].includes(perm.id);
                            const isActive = addFormData.permissions.includes(perm.id);
                            
                            return (
                              <div 
                                key={perm.id}
                                onClick={() => handleAddPermissionToggle(perm.id)}
                                className={`group p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center gap-4 ${
                                  isActive
                                  ? isDefault ? "bg-dark-900/80 border-dark-700/50" : "bg-accent/10 border-accent/30 ring-1 ring-accent/20"
                                  : "bg-dark-900/30 border-dark-700/20 opacity-40 hover:opacity-100"
                                }`}
                              >
                                <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                                  isActive
                                  ? isDefault ? "bg-dark-800 text-accent/80" : "bg-accent text-white"
                                  : "bg-dark-800 text-gray-600"
                                }`}>
                                  <perm.icon className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <p className={`font-bold text-sm ${isActive ? "text-white" : "text-gray-500"}`}>
                                      {perm.label}
                                    </p>
                                    {isActive && !isDefault && (
                                      <span className="text-[8px] font-black uppercase bg-accent/20 text-accent px-1.5 py-0.5 rounded">Custom</span>
                                    )}
                                    {isDefault && !isActive && (
                                      <span className="text-[8px] font-black uppercase bg-red-500/20 text-red-500 px-1.5 py-0.5 rounded">Revoked</span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-gray-600 leading-tight mt-0.5">
                                    {perm.description}
                                  </p>
                                </div>
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                  isActive
                                  ? isDefault ? "bg-dark-700 border-dark-600 text-accent" : "bg-accent border-accent text-white"
                                  : "bg-dark-800 border-dark-700"
                                }`}>
                                  {isActive && <CheckCircleIcon className="w-3.5 h-3.5" />}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </form>
            </div>

            {/* Sticky Footer Buttons */}
            <div className="p-8 border-t border-dark-700 bg-dark-800/80 backdrop-blur-md flex gap-4">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="flex-1 py-4 rounded-2xl font-bold text-gray-400 bg-dark-900 border border-dark-700 hover:bg-dark-700 hover:text-white transition-all flex items-center justify-center gap-2"
              >
                <XMarkIcon className="w-5 h-5" />
                Cancel Registration
              </button>
              <button
                onClick={handleAddSubmit}
                type="submit"
                className="flex-[2] py-4 rounded-2xl font-black text-white bg-gradient-to-br from-accent via-orange-500 to-red-600 shadow-2xl shadow-accent/20 transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2"
              >
                <UserPlusIcon className="w-6 h-6" />
                Create Employee Account
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Edit Permissions Modal (Redesigned) */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-hidden">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-2xl" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-4xl bg-dark-800 rounded-[2.5rem] border border-dark-700 shadow-2xl overflow-hidden animate-modal-in flex flex-col max-h-[90vh]">
            
            {/* Header with Breadcrumbs */}
            <div className="p-8 border-b border-dark-700 bg-dark-800/50 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="hover:text-accent transition-colors flex items-center gap-1"
                >
                  <ArrowLeftIcon className="w-3 h-3" />
                  User Management
                </button>
                <ChevronRightIcon className="w-3 h-3" />
                <span className="text-white">Edit User: {selectedUser?.fullName}</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-3xl font-black text-white tracking-tight">Edit Access Control</h3>
                  <p className="text-gray-400 text-sm mt-1">Configure roles and granular permissions</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-3 bg-dark-900 rounded-2xl text-gray-500 hover:text-white transition-all border border-dark-700">
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
              <form onSubmit={handleSubmit} className="space-y-10">
                
                {/* User Information Section */}
                <section className="space-y-6">
                  <div className="flex items-center gap-3 text-accent mb-2">
                    <UserCircleIcon className="w-6 h-6" />
                    <h4 className="text-lg font-bold text-white uppercase tracking-wider text-sm">User Information</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-dark-900/50 p-8 rounded-3xl border border-dark-700/50">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Full Name</label>
                      <input
                        required
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className="w-full bg-dark-800/50 text-white font-bold px-5 py-3 rounded-2xl border border-dark-700/30 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Email Address</label>
                      <input
                        required
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-dark-800/50 text-white font-medium px-5 py-3 rounded-2xl border border-dark-700/30 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs font-black text-gray-500 uppercase tracking-widest">
                        New Password <span className="text-gray-600 normal-case">(Leave blank to keep current)</span>
                      </label>
                      <div className="relative">
                        <KeyIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input
                          type="password"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          placeholder="••••••••"
                          className="w-full bg-dark-800/50 text-white font-medium pl-12 pr-5 py-3 rounded-2xl border border-dark-700/30 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all placeholder:text-gray-700"
                        />
                      </div>
                    </div>
                  </div>
                </section>

                {/* Role Selection Section */}
                <section className="space-y-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3 text-accent">
                      <ShieldCheckIcon className="w-6 h-6" />
                      <h4 className="text-lg font-bold text-white uppercase tracking-wider text-sm">Role Assignment</h4>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-accent/10 rounded-xl border border-accent/20">
                      <InformationCircleIcon className="w-4 h-4 text-accent" />
                      <span className="text-[10px] font-bold text-accent uppercase tracking-widest">Auto-assigns default perms</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.keys(roleDefaults).map(role => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => handleRoleChange(role)}
                        className={`group relative p-6 rounded-[2rem] border-2 transition-all duration-300 text-left overflow-hidden ${
                          formData.role === role 
                          ? "bg-accent/10 border-accent shadow-2xl shadow-accent/10" 
                          : "bg-dark-900/50 border-dark-700/50 hover:border-dark-600 grayscale opacity-60 hover:opacity-100 hover:grayscale-0"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className={`text-lg font-black uppercase tracking-tighter ${formData.role === role ? "text-accent" : "text-gray-500"}`}>
                            {role}
                          </span>
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                            formData.role === role ? "bg-accent border-accent scale-110" : "border-dark-600"
                          }`}>
                            {formData.role === role && <CheckCircleIcon className="w-4 h-4 text-white" />}
                          </div>
                        </div>
                        <p className={`text-xs leading-relaxed ${formData.role === role ? "text-gray-300" : "text-gray-600"}`}>
                          {role === 'admin' ? "Full system access including all settings and user management." : 
                           role === 'manager' ? "Manage products, inventory, customers and view all reports." : 
                           "Basic access for sales processing and dashboard overview."}
                        </p>
                        {formData.role === role && (
                          <div className="absolute -right-4 -bottom-4 opacity-10">
                            <ShieldCheckIcon className="w-24 h-24" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </section>

                {/* Permissions Section Grouped */}
                <section className="space-y-8">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3 text-accent">
                      <LockClosedIcon className="w-6 h-6" />
                      <h4 className="text-lg font-bold text-white uppercase tracking-wider text-sm">Permissions Matrix</h4>
                    </div>
                    {(formData.permissions.length !== roleDefaults[formData.role].length || 
                      !formData.permissions.every(p => roleDefaults[formData.role].includes(p))) && (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-500/10 rounded-xl border border-orange-500/20 animate-pulse">
                        <ShieldExclamationIcon className="w-4 h-4 text-orange-500" />
                        <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">Custom Overrides Active</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                    {permissionGroups.map((group, gIdx) => (
                      <div key={gIdx} className="space-y-5">
                        <h5 className="text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-3">
                          {group.title}
                          <div className="h-px bg-dark-700/50 flex-1" />
                        </h5>
                        <div className="space-y-3">
                          {group.permissions.map(perm => {
                            const isDefault = roleDefaults[formData.role].includes(perm.id);
                            const isActive = formData.permissions.includes(perm.id);
                            
                            return (
                              <div 
                                key={perm.id}
                                onClick={() => handlePermissionToggle(perm.id)}
                                className={`group p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center gap-4 ${
                                  isActive
                                  ? isDefault ? "bg-dark-900/80 border-dark-700/50" : "bg-accent/10 border-accent/30 ring-1 ring-accent/20"
                                  : "bg-dark-900/30 border-dark-700/20 opacity-40 hover:opacity-100"
                                }`}
                              >
                                <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                                  isActive
                                  ? isDefault ? "bg-dark-800 text-accent/80" : "bg-accent text-white"
                                  : "bg-dark-800 text-gray-600"
                                }`}>
                                  <perm.icon className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <p className={`font-bold text-sm ${isActive ? "text-white" : "text-gray-500"}`}>
                                      {perm.label}
                                    </p>
                                    {isActive && !isDefault && (
                                      <span className="text-[8px] bg-accent/20 text-accent px-1.5 py-0.5 rounded font-black uppercase">Custom</span>
                                    )}
                                    {isDefault && !isActive && (
                                      <span className="text-[8px] bg-red-500/20 text-red-500 px-1.5 py-0.5 rounded font-black uppercase">Revoked</span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-gray-600 leading-tight mt-0.5">
                                    {perm.description}
                                  </p>
                                </div>
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                  isActive
                                  ? isDefault ? "bg-dark-700 border-dark-600 text-accent" : "bg-accent border-accent text-white"
                                  : "bg-dark-800 border-dark-700"
                                }`}>
                                  {isActive && <CheckCircleIcon className="w-3.5 h-3.5" />}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </form>
            </div>

            {/* Sticky Footer Buttons */}
            <div className="p-8 border-t border-dark-700 bg-dark-800/80 backdrop-blur-md flex gap-4">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-4 rounded-2xl font-bold text-gray-400 bg-dark-900 border border-dark-700 hover:bg-dark-700 hover:text-white transition-all flex items-center justify-center gap-2"
              >
                <XMarkIcon className="w-5 h-5" />
                Discard Changes
              </button>
              <button
                onClick={handleSubmit}
                type="submit"
                className="flex-[2] py-4 rounded-2xl font-black text-white bg-gradient-to-br from-accent via-orange-500 to-red-600 shadow-2xl shadow-accent/20 transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2"
              >
                <ShieldCheckIcon className="w-6 h-6" />
                Apply User Permissions
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete/Status Confirmation Modal */}
      {isDeleteModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-hidden">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-2xl" onClick={() => setIsDeleteModalOpen(false)} />
          <div className="relative w-full max-w-md bg-dark-800 rounded-[2.5rem] border border-dark-700 shadow-2xl overflow-hidden animate-modal-in">
            <div className="p-8 text-center">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
                selectedUser?.isActive !== false ? "bg-red-500/10" : "bg-green-500/10"
              }`}>
                {selectedUser?.isActive !== false ? (
                  <PowerIcon className="w-10 h-10 text-red-500" />
                ) : (
                  <CheckIcon className="w-10 h-10 text-green-500" />
                )}
              </div>
              <h3 className="text-2xl font-black text-white mb-2">
                {selectedUser?.isActive !== false ? "Deactivate User?" : "Activate User?"}
              </h3>
              <p className="text-gray-400 mb-8 px-4 leading-relaxed">
                {selectedUser?.isActive !== false 
                  ? `Are you sure you want to deactivate ${selectedUser?.fullName}? They will no longer be able to log in.`
                  : `Do you want to reactivate ${selectedUser?.fullName}'s account?`}
              </p>
              
              <div className="flex gap-4">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 py-4 rounded-2xl font-bold text-gray-400 bg-dark-900 border border-dark-700 hover:bg-dark-700 hover:text-white transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className={`flex-1 py-4 rounded-2xl font-black text-white shadow-lg transition-all transform hover:-translate-y-1 ${
                    selectedUser?.isActive !== false 
                    ? "bg-red-600 hover:bg-red-700 shadow-red-600/20" 
                    : "bg-green-600 hover:bg-green-700 shadow-green-600/20"
                  }`}
                >
                  {selectedUser?.isActive !== false ? "Yes, Deactivate" : "Yes, Activate"}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
