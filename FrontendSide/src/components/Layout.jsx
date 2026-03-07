import { Link, useNavigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useNotification } from "../contexts/NotificationContext";
import { useSettings } from "../contexts/SettingsContext";
import { useState, Fragment, useEffect } from "react";
import { Menu, Transition } from "@headlessui/react";
import { 
  Squares2X2Icon,
  ClipboardDocumentListIcon,
  MapPinIcon,
  CreditCardIcon,
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
  MagnifyingGlassIcon,
  DocumentChartBarIcon,
  PresentationChartLineIcon,
  UserGroupIcon,
  IdentificationIcon,
  BanknotesIcon,
  TrashIcon,
  CheckIcon,
  Bars3Icon,
  XMarkIcon
} from "@heroicons/react/24/solid";

export default function Layout() {
  const { user, logout } = useAuth();
  const { showNotification, history, unreadCount, markAllAsRead, clearHistory } = useNotification();
  const { settings } = useSettings();
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
        className={`fixed lg:relative z-[70] flex flex-col h-full transition-all duration-300 ease-in-out 
          ${isMobileMenuOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'} 
          ${isExpanded ? 'lg:w-64' : 'lg:w-24'}
        `}
      >
        {/* Close Button for Mobile */}
        <button 
          className="lg:hidden absolute top-4 right-4 text-gray-400 hover:text-white"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <XMarkIcon className="w-6 h-6" />
        </button>

        {/* Organic Curved Background Strip */}
        <div className={`absolute top-0 left-0 bottom-0 transition-all duration-300 ease-in-out z-0 w-full`}>
          <div className="w-full h-full bg-dark-800 rounded-r-3xl shadow-2xl shadow-black/50 overflow-hidden relative">
            {/* Wavy/Organic Overlay Effect */}
            <div className="absolute top-0 right-0 w-8 h-full bg-gradient-to-l from-white/5 to-transparent skew-x-3 blur-xl opacity-30" />
            <div className="absolute bottom-20 -right-4 w-16 h-32 bg-accent/10 rounded-full blur-2xl" />
          </div>
        </div>
        
        {/* Toggle Button (Desktop Only) */}
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="hidden lg:block absolute right-0 top-12 translate-x-1/2 z-50 bg-accent text-white p-2.5 rounded-full shadow-2xl border-2 border-dark-900 hover:scale-110 transition-all duration-300 group ring-4 ring-dark-900/50"
        >
          {isExpanded ? (
            <ChevronLeftIcon className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform stroke-[3]" />
          ) : (
            <ChevronRightIcon className="w-4 h-4 group-hover:translate-x-0.5 transition-transform stroke-[3]" />
          )}
        </button>
        
        {/* Content Wrapper */}
        <div className="relative z-10 flex flex-col h-full w-full py-6">
            
            {/* Fiery Logo */}
            <div className={`mb-10 flex items-center group cursor-pointer ${isExpanded || isMobileMenuOpen ? 'px-6 gap-4' : 'flex-col justify-center'}`}>
                <div className="w-14 h-14 relative flex-shrink-0 flex items-center justify-center">
                    {/* Flame Effect Background */}
                    <div 
                      className="absolute inset-0 rounded-2xl blur-md opacity-75 group-hover:opacity-100 transition-opacity duration-300 animate-pulse" 
                      style={{ background: `linear-gradient(to top right, ${settings?.logoColorStart || '#ea580c'}, ${settings?.logoColorEnd || '#dc2626'}, #facc15)` }}
                    />
                    <div className="relative w-full h-full bg-dark-900 rounded-xl flex items-center justify-center border border-white/10 z-10 overflow-hidden">
                        <span 
                          className="text-3xl font-black bg-clip-text text-transparent transform -skew-x-6"
                          style={{ backgroundImage: `linear-gradient(to bottom right, #fcd34d, ${settings?.logoColorStart || '#f97316'}, ${settings?.logoColorEnd || '#dc2626'})` }}
                        >
                          {settings?.logoChar || 'S'}
                        </span>
                        {/* Shine effect */}
                        <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 group-hover:animate-shimmer" />
                    </div>
                </div>
                
                {/* Logo Text (Visible when expanded or mobile) */}
                <div className={`flex flex-col overflow-hidden transition-all duration-300 ${isExpanded || isMobileMenuOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0 hidden lg:flex'}`}>
                  <span className="text-xl font-bold text-white tracking-tight whitespace-nowrap">{settings?.appName || "POS System"}</span>
                  <span className="text-xs text-text-secondary whitespace-nowrap">{settings?.appSubtitle || "Admin Dashboard"}</span>
                </div>
            </div>

            {/* Navigation Icons */}
            <nav className="flex-1 flex flex-col gap-2 w-full px-2 overflow-y-auto custom-scrollbar">
                {filteredMenuItems.map((item) => {
                    const isActive = location.pathname === item.path || (item.children?.some(child => location.pathname === child.path));
                    const isOpen = openDropdowns[item.label];

                    return (
                        <div key={item.label} className="w-full">
                            {item.dropdown ? (
                                <>
                                    <button
                                        onClick={() => toggleDropdown(item.label)}
                                        className={`group relative flex items-center w-full transition-all duration-300 ${isExpanded || isMobileMenuOpen ? 'px-4 py-3' : 'justify-center py-4'}`}
                                    >
                                        {isActive && !isExpanded && !isMobileMenuOpen && (
                                            <div className="absolute left-0 right-0 mx-auto w-12 h-12 bg-accent/20 rounded-xl blur-md scale-110" />
                                        )}
                                        <div className={`
                                            relative flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-300 z-10
                                            ${isActive 
                                                ? "bg-gradient-to-br from-accent to-red-600 text-white shadow-lg shadow-accent/40" 
                                                : "text-gray-400 hover:bg-dark-700 hover:text-white"
                                            }
                                        `}>
                                            <item.icon className="w-6 h-6" />
                                        </div>
                                        {(isExpanded || isMobileMenuOpen) && (
                                            <>
                                                <span className={`ml-4 font-medium tracking-wide flex-1 text-left ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>
                                                    {item.label}
                                                </span>
                                                {isOpen ? (
                                                    <ChevronUpIcon className="w-4 h-4 text-gray-500" />
                                                ) : (
                                                    <ChevronDownIcon className="w-4 h-4 text-gray-500" />
                                                )}
                                            </>
                                        )}
                                    </button>
                                    
                                    {/* Dropdown Children */}
                                    {(isExpanded || isMobileMenuOpen) && isOpen && (
                                        <div className="mt-1 flex flex-col gap-1 ml-4 border-l-2 border-dark-700">
                                            {item.children.map((child) => {
                                                const isChildActive = location.pathname === child.path;
                                                return (
                                                    <Link
                                                        key={child.label}
                                                        to={child.path}
                                                        className={`
                                                            flex items-center px-6 py-2.5 rounded-r-xl transition-all duration-200
                                                            ${isChildActive 
                                                                ? "bg-accent/10 text-accent font-semibold" 
                                                                : "text-gray-500 hover:bg-dark-700/50 hover:text-gray-300"
                                                            }
                                                        `}
                                                    >
                                                        <child.icon className="w-4 h-4 mr-3" />
                                                        <span className="text-sm">{child.label}</span>
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <Link
                                    to={item.path}
                                    className={`group relative flex items-center w-full transition-all duration-300 ${isExpanded ? 'px-4 py-3' : 'justify-center py-4'}`}
                                >
                                    {isActive && !isExpanded && (
                                        <div className="absolute left-0 right-0 mx-auto w-12 h-12 bg-accent/20 rounded-xl blur-md scale-110" />
                                    )}
                                    <div className={`
                                        relative flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-300 z-10
                                        ${isActive 
                                            ? "bg-gradient-to-br from-accent to-red-600 text-white shadow-lg shadow-accent/40" 
                                            : "text-gray-400 hover:bg-dark-700 hover:text-white"
                                        }
                                    `}>
                                        <item.icon className="w-6 h-6" />
                                    </div>
                                    {isExpanded && (
                                        <span className={`ml-4 font-medium tracking-wide ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>
                                            {item.label}
                                        </span>
                                    )}
                                </Link>
                            )}
                        </div>
                    );
                })}
            </nav>

            {/* Logout & Notifications */}
            <div className={`mt-auto flex flex-col gap-2 w-full pb-4 border-t border-dark-700 pt-4 ${isExpanded ? 'px-6' : 'items-center'}`}>
                 <div className={`bg-dark-700 my-2 ${isExpanded ? 'w-full h-[1px]' : 'w-8 h-[1px]'}`} />

                 {/* Logout */}
                 <button
                    onClick={handleLogout}
                    className={`group relative flex items-center rounded-xl text-gray-400 hover:bg-red-500/10 hover:text-red-500 transition-all duration-300 ${isExpanded ? 'w-full px-2 py-2 gap-3' : 'w-10 h-10 justify-center'}`}
                >
                    <ArrowRightOnRectangleIcon className="w-6 h-6 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    {isExpanded && <span className="font-medium whitespace-nowrap">Logout</span>}
                </button>
            </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 overflow-auto bg-dark-900 flex flex-col relative transition-all duration-300 w-full`}>
        <header className="h-20 md:h-24 min-h-[5rem] flex items-center justify-between px-4 md:px-8 py-4 md:py-6 sticky top-0 z-20 bg-dark-900/80 backdrop-blur-md border-b border-dark-700/50">
          <div className="ml-12 lg:ml-0">
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
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
          
          {/* Centered Search Bar */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:block w-[600px]">
            <div className="relative w-full group">
              <input 
                type="text" 
                placeholder="Search..." 
                className="w-full bg-dark-800 text-white pl-11 pr-4 py-3 rounded-2xl border border-transparent focus:border-accent focus:ring-1 focus:ring-accent placeholder-text-muted transition-all shadow-lg shadow-black/20 group-hover:bg-dark-700"
              />
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-text-secondary absolute left-4 top-1/2 -translate-y-1/2 group-hover:text-white transition-colors">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-white">{user?.fullName || "Admin User"}</p>
                <p className="text-xs text-text-secondary font-medium">{user?.role || "Manager"}</p>
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