import { Link, useNavigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useNotification } from "../contexts/NotificationContext";
import { useSettings } from "../contexts/SettingsContext";
import { useSocketState } from "../contexts/SocketContext";
import { useState, Fragment, useEffect } from "react";
import { Menu, Transition } from "@headlessui/react";
import { 
  Squares2X2Icon,
  ClipboardDocumentListIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
  BellIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ShoppingCartIcon,
  TagIcon,
  CubeIcon,
  UsersIcon,
  ChartBarIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ListBulletIcon,
  PlusIcon,
  DocumentChartBarIcon,
  PresentationChartLineIcon,
  UserGroupIcon,
  IdentificationIcon,
  BanknotesIcon,
  TrashIcon,
  CheckIcon,
  Bars3Icon,
  XMarkIcon
} from "@heroicons/react/24/outline";

export default function Layout() {
  const { user, logout } = useAuth();
  const { showNotification, history, unreadCount, markAllAsRead, clearHistory } = useNotification();
  const { settings } = useSettings();
  const { isConnected, lastError } = useSocketState();
  const nav = useNavigate();
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [openDropdowns, setOpenDropdowns] = useState({});
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const toggleDropdown = (label) => {
    setOpenDropdowns(prev => ({
      ...prev,
      [label]: !prev[label]
    }));
    if (!isExpanded && !isMobileMenuOpen) setIsExpanded(true);
  };

  const handleLogout = () => {
    logout();
    showNotification("Logged out successfully", "info");
    nav("/login");
  };

  const menuItems = [
    { icon: Squares2X2Icon, label: "Dashboard", path: "/", id: "dashboard" },
    { icon: ShoppingCartIcon, label: "POS", path: "/pos", id: "pos" },
    { icon: ClipboardDocumentListIcon, label: "Transactions", path: "/transactions", id: "transactions" },
    { 
      icon: TagIcon, 
      label: "Products", 
      dropdown: true,
      id: "products",
      children: [
        { icon: ListBulletIcon, label: "Products", path: "/products/all" },
        { icon: PlusIcon, label: "Add Product", path: "/products/add" },
      ]
    },
    { icon: CubeIcon, label: "Inventory", path: "/inventory", id: "inventory" },
    { 
      icon: ChartBarIcon, 
      label: "Reports", 
      dropdown: true,
      id: "reports",
      children: [
        { icon: DocumentChartBarIcon, label: "Sales Report", path: "/reports/sales" },
        { icon: PresentationChartLineIcon, label: "Inventory Report", path: "/reports/inventory" },
        { icon: IdentificationIcon, label: "Cashier Report", path: "/reports/cashiers" },
        { icon: BanknotesIcon, label: "Profit & Loss", path: "/reports/profit-loss" },
      ]
    },
    { icon: UserGroupIcon, label: "Users", path: "/users", id: "users" },
    { icon: Cog6ToothIcon, label: "Settings", path: "/settings", id: "settings" },
  ];

  // Filter menu items based on user permissions
  const filteredMenuItems = menuItems.filter(item => {
    // If user is admin, show everything
    if (user?.role === 'admin') return true;
    
    // Otherwise check permissions
    const userPermissions = user?.permissions || [];
    return userPermissions.includes(item.id);
  });

  return (
    <div className="flex h-screen bg-dark-900 text-text-primary overflow-hidden">
      {/* Mobile Menu Button */}
      <button 
        className="lg:hidden fixed top-4 left-4 z-[70] p-2 bg-dark-800 text-white rounded-lg shadow-lg border border-dark-700"
        onClick={() => setIsMobileMenuOpen(true)}
      >
        <Bars3Icon className="w-6 h-6" />
      </button>

      {/* Sidebar Overlay for Mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[60] lg:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed lg:relative z-[100] flex flex-col h-full transition-all duration-500 ease-in-out 
          ${isMobileMenuOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'} 
          ${isExpanded ? 'lg:w-72' : 'lg:w-24'}
          bg-dark-900 border-r border-dark-700/50
        `}
      >
        {/* Close Button for Mobile */}
        <button 
          className="lg:hidden absolute top-6 right-6 text-gray-500 hover:text-red-400 z-[80] transition-all duration-500 p-2 rounded-lg hover:bg-white/[0.02]"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <XMarkIcon className="w-6 h-6" />
        </button>

        {/* Toggle Button (Desktop Only) - Seamlessly Integrated */}
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="hidden lg:flex absolute -right-[13px] top-12 z-50 bg-dark-900 text-gray-500 hover:text-accent w-6 h-10 items-center justify-center rounded-md border border-white/[0.05] shadow-xl transition-all duration-500 hover:bg-dark-800 group"
        >
          {isExpanded ? (
            <ChevronLeftIcon className="w-3 h-3 transition-transform duration-500 group-hover:-translate-x-0.5" />
          ) : (
            <ChevronRightIcon className="w-3 h-3 transition-transform duration-500 group-hover:translate-x-0.5" />
          )}
        </button>
        
        {/* Content Wrapper */}
        <div className="relative z-10 flex flex-col h-full w-full py-10">
            
            {/* Premium Logo Section */}
            <div className={`mb-14 flex items-center transition-all duration-500 ${isExpanded || isMobileMenuOpen ? 'px-10 gap-5' : 'flex-col justify-center'}`}>
                <div className="w-12 h-12 relative flex-shrink-0 group cursor-pointer">
                    <div 
                      className="absolute inset-0 rounded-xl blur-lg opacity-20 group-hover:opacity-60 transition-opacity duration-700" 
                      style={{ background: `linear-gradient(to top right, ${settings?.logoColorStart || '#ea580c'}, ${settings?.logoColorEnd || '#dc2626'})` }}
                    />
                    <div className="relative w-full h-full bg-dark-800 rounded-xl flex items-center justify-center border border-white/10 z-10 overflow-hidden shadow-2xl">
                        <span 
                          className="text-2xl font-black bg-clip-text text-transparent"
                          style={{ backgroundImage: `linear-gradient(to bottom right, #ffffff, ${settings?.logoColorStart || '#f97316'})` }}
                        >
                          {settings?.logoChar || 'S'}
                        </span>
                    </div>
                </div>
                
                <div className={`flex flex-col transition-all duration-500 ${isExpanded || isMobileMenuOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 pointer-events-none absolute'}`}>
                  <span className="text-xl font-extrabold text-white tracking-tight uppercase leading-none">{settings?.appName || "Samoke Valley"}</span>
                  <span className="text-[9px] font-bold text-gray-400/60 uppercase tracking-[0.3em] mt-1">{settings?.appSubtitle || "Admin Dashboard"}</span>
                </div>
            </div>

            {/* Navigation Section */}
            <nav className="flex-1 flex flex-col gap-2 w-full px-6 overflow-y-auto custom-scrollbar">
                {filteredMenuItems.map((item) => {
                    const isActive = location.pathname === item.path || (item.children?.some(child => location.pathname === child.path));
                    const isOpen = openDropdowns[item.label];

                    return (
                        <div key={item.label} className="w-full">
                            {item.dropdown ? (
                                <>
                                    <button
                                        onClick={() => toggleDropdown(item.label)}
                                        className={`group relative flex items-center w-full rounded-xl transition-all duration-500 mb-1 ${isExpanded || isMobileMenuOpen ? 'px-4 py-3.5' : 'justify-center py-3.5'}
                                          ${isActive ? 'bg-white/[0.03]' : 'hover:bg-white/[0.02]'}
                                        `}
                                    >
                                        {/* Active Indicator Bar - More subtle left border */}
                                        {isActive && (
                                          <div className="absolute left-0 w-1 h-5 bg-accent rounded-r-full shadow-[0_0_15px_rgba(234,88,12,0.3)]" />
                                        )}

                                        <div className={`relative flex-shrink-0 transition-all duration-500 ${isActive ? 'text-accent' : 'text-gray-500 group-hover:text-gray-300'}`}>
                                            <item.icon className="w-5 h-5" />
                                        </div>

                                        {(isExpanded || isMobileMenuOpen) && (
                                            <>
                                                <span className={`ml-4 font-semibold text-[13px] tracking-wide flex-1 text-left transition-colors ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>
                                                    {item.label}
                                                </span>
                                                <ChevronDownIcon className={`w-3.5 h-3.5 transition-transform duration-500 ${isOpen ? 'rotate-180 text-accent' : 'text-gray-600 group-hover:text-gray-400'}`} />
                                            </>
                                        )}
                                    </button>
                                    
                                    {/* Dropdown Children - Improved Indentation and Guide Line */}
                                    {(isExpanded || isMobileMenuOpen) && isOpen && (
                                        <div className="mb-3 ml-[26px] pl-6 border-l border-white/[0.05] flex flex-col gap-1.5 relative">
                                            {item.children.map((child) => {
                                                const isChildActive = location.pathname === child.path;
                                                return (
                                                    <Link
                                                        key={child.label}
                                                        to={child.path}
                                                        className={`
                                                            group flex items-center py-2.5 rounded-lg transition-all duration-500 relative
                                                            ${isChildActive 
                                                                ? "text-accent" 
                                                                : "text-gray-500 hover:text-gray-300"
                                                            }
                                                        `}
                                                    >
                                                        {/* Horizontal Guide Line Extension */}
                                                        <div className={`absolute -left-6 w-4 h-[1px] ${isChildActive ? 'bg-accent/50' : 'bg-white/[0.05]'}`} />
                                                        
                                                        <child.icon className={`w-4 h-4 mr-3 transition-all duration-500 ${isChildActive ? 'scale-110 text-accent' : 'group-hover:scale-110 group-hover:text-gray-300'}`} />
                                                        <span className={`text-[11px] font-bold uppercase tracking-[0.15em] ${isChildActive ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'}`}>{child.label}</span>
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <Link
                                    to={item.path}
                                    className={`group relative flex items-center w-full rounded-xl transition-all duration-500 mb-1 ${isExpanded || isMobileMenuOpen ? 'px-4 py-3.5' : 'justify-center py-3.5'}
                                      ${isActive ? 'bg-white/[0.03]' : 'hover:bg-white/[0.02]'}
                                    `}
                                >
                                    {/* Active Indicator Bar */}
                                    {isActive && (
                                      <div className="absolute left-0 w-1 h-5 bg-accent rounded-r-full shadow-[0_0_15px_rgba(234,88,12,0.3)]" />
                                    )}

                                    <div className={`relative flex-shrink-0 transition-all duration-500 ${isActive ? 'text-accent' : 'text-gray-500 group-hover:text-gray-300'}`}>
                                        <item.icon className="w-5 h-5" />
                                    </div>

                                    {(isExpanded || isMobileMenuOpen) && (
                                        <span className={`ml-4 font-semibold text-[13px] tracking-wide transition-colors ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>
                                            {item.label}
                                        </span>
                                    )}
                                </Link>
                            )}
                        </div>
                    );
                })}
            </nav>

            {/* Logout Footer - Improved Separation */}
            <div className={`mt-auto pt-8 border-t border-white/[0.05] mx-6 ${isExpanded || isMobileMenuOpen ? 'px-2' : 'flex justify-center'}`}>
                 <button
                    onClick={handleLogout}
                    className={`group flex items-center rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-400/[0.03] transition-all duration-500 ${isExpanded || isMobileMenuOpen ? 'w-full px-4 py-3.5 gap-4' : 'w-12 h-12 justify-center'}`}
                >
                    <ArrowRightOnRectangleIcon className="w-5 h-5 flex-shrink-0 group-hover:-translate-x-1 transition-transform duration-500" />
                    {(isExpanded || isMobileMenuOpen) && <span className="font-bold text-[11px] tracking-[0.2em] uppercase">Sign Out</span>}
                </button>
            </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 overflow-auto bg-dark-900 flex flex-col relative transition-all duration-300 w-full`}>
        <header className="h-20 md:h-24 min-h-[5rem] flex items-center justify-between px-4 md:px-8 py-4 md:py-6 sticky top-0 z-[90] bg-dark-900/80 backdrop-blur-md border-b border-dark-700/50">
          <div className="ml-12 lg:ml-0">
            <h1 className="text-xl md:text-3xl font-bold text-white tracking-tight">
              {(() => {
                const currentItem = menuItems.find(i => i.path === location.pathname);
                if (currentItem) return currentItem.label;
                
                // Search in children if not found in top-level
                for (const item of menuItems) {
                  if (item.children) {
                    const child = item.children.find(c => c.path === location.pathname);
                    if (child) return child.label;
                  }
                }
                
                return "Dashboard";
              })()}
            </h1>
            <p className="text-sm text-text-secondary mt-1">{new Date().toDateString()}</p>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
              {/* Real-time Status */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-dark-800 rounded-xl border border-dark-700 shadow-lg">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                  {isConnected ? 'Sync Active' : 'Offline'}
                </span>
                {lastError && (
                  <div className="group relative">
                    <XMarkIcon className="w-3.5 h-3.5 text-red-500 cursor-help" />
                    <div className="absolute right-0 top-full mt-2 w-48 p-2 bg-red-500 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                      {lastError}
                    </div>
                  </div>
                )}
              </div>

              <div className="hidden md:flex flex-col items-end">
                <p className="text-sm font-black text-white leading-none mb-1">{user?.fullName || "User"}</p>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{user?.role || "Staff"}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-dark-800 p-1 border-2 border-dark-700 shadow-xl">
                 <div className="w-full h-full rounded-xl bg-gradient-to-tr from-accent to-orange-400 flex items-center justify-center text-white font-bold text-lg">
                    {user?.fullName?.charAt(0) || "A"}
                 </div>
              </div>
              
              {/* Notification Bell in Header */}
              <Menu as="div" className="relative ml-2">
                <Menu.Button className="relative w-10 h-10 flex-shrink-0 rounded-xl bg-dark-800 text-gray-400 flex items-center justify-center hover:bg-dark-700 hover:text-white transition-all duration-300 border border-dark-700 shadow-lg">
                  <BellIcon className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-dark-900" />
                  )}
                </Menu.Button>
                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="absolute right-0 mt-4 w-80 origin-top-right rounded-2xl bg-dark-800 border border-dark-700 shadow-2xl focus:outline-none overflow-hidden z-50">
                    <div className="p-4 border-b border-dark-700 flex justify-between items-center">
                      <h3 className="font-bold text-white">Notifications</h3>
                      <div className="flex gap-2">
                        <button 
                          onClick={markAllAsRead}
                          className="p-1.5 rounded-lg hover:bg-dark-700 text-gray-400 hover:text-white transition-colors"
                          title="Mark all as read"
                        >
                          <CheckIcon className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={clearHistory}
                          className="p-1.5 rounded-lg hover:bg-dark-700 text-gray-400 hover:text-white transition-colors"
                          title="Clear all"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="max-h-96 overflow-y-auto custom-scrollbar p-2 space-y-1">
                      {history.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 text-sm">
                          <BellIcon className="w-8 h-8 mx-auto mb-2 opacity-20" />
                          No notifications yet
                        </div>
                      ) : (
                        history.map((item) => (
                          <div 
                            key={item.id} 
                            className={`p-3 rounded-xl transition-colors ${item.read ? 'opacity-60 hover:bg-dark-700/50' : 'bg-dark-700/30 hover:bg-dark-700 border-l-2 border-accent'}`}
                          >
                            <div className="flex justify-between items-start mb-1">
                              <h4 className={`text-sm font-bold ${item.type === 'success' ? 'text-green-400' : item.type === 'error' ? 'text-red-400' : 'text-white'}`}>
                                {item.title}
                              </h4>
                              <span className="text-[10px] text-gray-500">{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <p className="text-xs text-gray-300 leading-snug">{item.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </Menu.Items>
                </Transition>
              </Menu>
          </div>
        </header>

        <div className="flex-1 p-4 md:p-8">
           <Outlet />
        </div>
      </main>
    </div>
  );
}