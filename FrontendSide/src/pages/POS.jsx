import { useState, useEffect } from "react";
import { 
  MagnifyingGlassIcon, 
  TrashIcon, 
  PlusIcon, 
  MinusIcon,
  ShoppingBagIcon,
  CreditCardIcon,
  BanknotesIcon,
  QrCodeIcon,
  CubeIcon,
  TagIcon,
  FunnelIcon,
  XMarkIcon,
  Squares2X2Icon,
  ListBulletIcon
} from "@heroicons/react/24/outline";
import { useNotification } from "../contexts/NotificationContext";
import { useSettings } from "../contexts/SettingsContext";
import { useSocket } from "../contexts/SocketContext";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import CheckoutModal from "../components/CheckoutModal";
import POSSkeleton from "../components/skeletons/POSSkeleton";

export default function POS() {
  const { showNotification } = useNotification();
  const { categories: dbCategories, settings } = useSettings();
  const socket = useSocket();
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  
  // Load cart from localStorage or default to empty array
  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem("pos_cart");
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (e) {
      console.error("Failed to parse cart from local storage", e);
      return [];
    }
  });

  const [products, setProducts] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [orderNumber, setOrderNumber] = useState(() => Math.floor(Math.random() * 9000) + 1000);
  const [isFilterOpen, setIsFilterOpen] = useState(false); // State for custom filter dropdown
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false); // Mobile cart toggle
  const [viewMode, setViewMode] = useState("grid"); // grid or list

  // Focus search on mount and hotkeys
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl + K or / to search
      if ((e.ctrlKey && e.key === 'k') || e.key === '/') {
        e.preventDefault();
        document.getElementById('pos-search')?.focus();
      }
      // F2 for checkout
      if (e.key === 'F2') {
        e.preventDefault();
        handleCheckoutClick();
      }
      // Escape to clear search or close cart
      if (e.key === 'Escape') {
        setSearchQuery("");
        setIsCartOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart]);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("pos_cart", JSON.stringify(cart));
  }, [cart]);

  // Fetch products from API
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get("/products");
      // Only show active products in POS
      setProducts(res.data.filter(p => p.status === 'active'));
    } catch (err) {
      console.error("Failed to fetch products:", err);
      showNotification("Failed to load products", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Real-time Updates
  useEffect(() => {
    if (!socket) return;

    socket.on("product_created", (newProduct) => {
      if (newProduct.status === 'active') {
        setProducts(prev => [...prev, newProduct]);
      }
    });

    socket.on("product_updated", (updatedProduct) => {
      if (updatedProduct.status === 'active') {
        setProducts(prev => prev.map(p => p._id === updatedProduct._id ? updatedProduct : p));
        // Update item in cart if it exists
        setCart(prev => prev.map(item => item._id === updatedProduct._id ? { ...updatedProduct, quantity: item.quantity } : item));
      } else {
        // If product is no longer active, remove from list and cart
        setProducts(prev => prev.filter(p => p._id !== updatedProduct._id));
        setCart(prev => prev.filter(item => item._id !== updatedProduct._id));
      }
    });

    socket.on("product_deleted", (deletedId) => {
      setProducts(prev => prev.filter(p => p._id !== deletedId));
      setCart(prev => prev.filter(item => item._id !== deletedId));
    });

    return () => {
      socket.off("product_created");
      socket.off("product_updated");
      socket.off("product_deleted");
    };
  }, [socket]);

  const handleCheckoutClick = () => {
    if (cart.length === 0) {
      showNotification("Cart is empty", "error");
      return;
    }
    setIsCheckoutModalOpen(true);
  };

  const handleCheckoutConfirm = async (customerName) => {
    // Ensure we have a valid cashier ID
    const cashierId = user?._id || user?.id;
    
    if (!cashierId) {
      showNotification("Session invalid. Please login again.", "error");
      return;
    }

    try {
      const payload = {
        items: cart.map(item => ({
          product: item._id,
          quantity: item.quantity
        })),
        customerName: customerName,
        paymentMethod,
        cashier: cashierId
      };

      await api.post("/transactions", payload);
      
      showNotification("Order placed successfully!", "success");
      setCart([]);
      setOrderNumber(Math.floor(Math.random() * 9000) + 1000);
      setIsCheckoutModalOpen(false);
    } catch (err) {
      console.error("Checkout failed:", err);
      showNotification(err.response?.data?.message || "Checkout failed", "error");
    }
  };

  const categories = ["All", ...dbCategories.map(c => c.name)];

  const filteredProducts = products.filter(p => 
    (p.type !== 'ingredient') && // Filter out ingredients
    (activeCategory === "All" || p.category === activeCategory) &&
    (p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
     (p.sku || "").toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item._id === product._id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          showNotification(`Only ${product.stock} units of ${product.name} available in stock`, "warning");
          return prev;
        }
        return prev.map(item => item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      if (product.stock <= 0) {
        showNotification(`${product.name} is out of stock`, "warning");
        return prev;
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item._id === id) {
        const newQty = item.quantity + delta;
        if (newQty > item.stock) {
          showNotification(`Only ${item.stock} units available in stock`, "warning");
          return item;
        }
        return { ...item, quantity: Math.max(1, newQty) };
      }
      return item;
    }));
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item._id !== id));
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const taxRate = settings?.taxRate ?? 12; // Use settings tax rate or default to 12
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tax;

  if (loading) return <POSSkeleton />;

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-120px)] gap-6 p-4 relative overflow-hidden font-sans">
      {/* Mobile Cart Toggle */}
      <button 
        onClick={() => setIsCartOpen(!isCartOpen)}
        aria-label="Toggle Cart"
        className="lg:hidden fixed bottom-6 right-6 z-[60] bg-accent text-white p-5 rounded-2xl shadow-[0_20px_50px_rgba(234,88,12,0.4)] flex items-center justify-center transition-all active:scale-95 hover:scale-105 active:shadow-inner"
      >
        <div className="relative">
          <ShoppingBagIcon className="w-7 h-7" />
          {cart.length > 0 && (
            <span className="absolute -top-3 -right-3 bg-white text-accent text-[11px] font-black w-6 h-6 flex items-center justify-center rounded-full border-2 border-accent shadow-lg animate-bounce">
              {cart.reduce((acc, item) => acc + item.quantity, 0)}
            </span>
          )}
        </div>
      </button>

      {/* Left Column: Product Selection */}
      <div className="flex-1 flex flex-col gap-6 overflow-hidden h-full">
        {/* Search & Header Section */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 bg-dark-800 p-5 rounded-3xl border border-white/[0.05] shadow-2xl backdrop-blur-md">
          <div className="relative flex-1 group">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-accent transition-colors" />
            <input 
              id="pos-search"
              type="text" 
              placeholder="Search products (Ctrl+K)" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-dark-950/50 text-white pl-12 pr-4 py-4 rounded-2xl border border-white/[0.05] focus:border-accent/50 focus:ring-1 focus:ring-accent/50 outline-none placeholder-gray-600 transition-all font-medium text-sm"
              aria-label="Search products"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white transition-colors"
                aria-label="Clear search"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-2 bg-dark-950/30 p-1 rounded-2xl border border-white/[0.03]">
            <button 
              onClick={() => setViewMode("grid")}
              className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'text-gray-500 hover:text-gray-300'}`}
              aria-label="Grid view"
            >
              <Squares2X2Icon className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setViewMode("list")}
              className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'text-gray-500 hover:text-gray-300'}`}
              aria-label="List view"
            >
              <ListBulletIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Categories Horizontal Scroll */}
        <div className="flex items-center gap-3 overflow-x-auto pb-2 custom-scrollbar no-scrollbar scroll-smooth">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest whitespace-nowrap border transition-all duration-300 ${
                activeCategory === category
                  ? "bg-accent border-accent text-white shadow-lg shadow-accent/20 translate-y-[-2px]"
                  : "bg-dark-800 border-white/[0.05] text-gray-500 hover:text-gray-200 hover:border-white/[0.1] hover:bg-dark-700"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {filteredProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-20 opacity-30">
              <div className="w-24 h-24 bg-dark-800 rounded-full flex items-center justify-center mb-6 border border-white/[0.05]">
                <MagnifyingGlassIcon className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">No products found</h3>
              <p className="text-gray-400 max-w-xs">Try adjusting your search or category filters to find what you're looking for.</p>
            </div>
          ) : (
            <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4' : 'grid-cols-1'}`}>
              {filteredProducts.map((product) => {
                const cartItem = cart.find(item => item._id === product._id);
                const isOutOfStock = product.stock <= 0;
                const isAtLimit = cartItem && cartItem.quantity >= product.stock;

                if (viewMode === 'list') {
                  return (
                    <div 
                      key={product._id}
                      onClick={() => !isOutOfStock && !isAtLimit && addToCart(product)}
                      className={`group relative flex items-center gap-6 p-4 rounded-3xl transition-all duration-300 border overflow-hidden ${
                        isOutOfStock || isAtLimit
                        ? "bg-dark-900 border-white/[0.03] opacity-50 grayscale cursor-not-allowed"
                        : "bg-dark-800 border-white/[0.05] cursor-pointer hover:border-accent hover:shadow-lg transform hover:-translate-y-0.5 active:scale-[0.99]"
                      }`}
                    >
                      {/* Product Image */}
                      <div className="relative w-20 h-20 flex-shrink-0 rounded-2xl overflow-hidden bg-dark-900/50 border border-white/[0.03]">
                        <img 
                          src={product.image || "https://via.placeholder.com/150"} 
                          alt={product.name} 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        {cartItem && (
                          <div className="absolute top-0 right-0 z-10 bg-accent text-white w-6 h-6 rounded-bl-xl flex items-center justify-center text-xs font-black shadow-lg">
                            {cartItem.quantity}
                          </div>
                        )}
                      </div>

                      {/* Product Info - Name & Category */}
                      <div className="flex-1 min-w-0 py-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">{product.category}</span>
                          {product.sku && <span className="text-[9px] font-mono font-bold text-gray-600 uppercase opacity-40 group-hover:opacity-100 transition-opacity">#{product.sku}</span>}
                        </div>
                        <h3 className={`font-bold text-base tracking-tight truncate ${
                          isOutOfStock || isAtLimit ? "text-gray-500" : "text-white group-hover:text-accent transition-colors"
                        }`}>
                          {product.name}
                        </h3>
                      </div>

                      {/* Stock Info */}
                      <div className="hidden lg:flex flex-col items-center px-8 border-x border-white/[0.03]">
                        <span className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] mb-1.5">Availability</span>
                        <div className="flex items-center gap-2">
                           <div className={`w-2 h-2 rounded-full ${product.stock <= 5 ? "bg-orange-500 animate-pulse" : "bg-green-500"}`} />
                           <span className="text-sm font-bold text-gray-400">{product.stock} units</span>
                        </div>
                      </div>

                      {/* Price & Add Action */}
                      <div className="flex items-center gap-8 pl-6">
                        <div className="flex flex-col items-end min-w-[100px]">
                          <span className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] mb-1">Unit Price</span>
                          <span className={`font-black text-xl tracking-tighter ${isOutOfStock || isAtLimit ? "text-gray-600" : "text-white group-hover:text-accent transition-colors"}`}>
                            ₱{product.price.toLocaleString()}
                          </span>
                        </div>
                        
                        <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center transition-all duration-500 ${
                          isOutOfStock || isAtLimit 
                          ? "bg-dark-900 border-white/[0.03] text-gray-700" 
                          : "bg-dark-900 border-white/[0.05] text-gray-400 group-hover:bg-accent group-hover:border-accent group-hover:text-white group-hover:shadow-[0_8px_20px_rgba(234,88,12,0.3)]"
                        }`}>
                          <PlusIcon className="w-6 h-6 stroke-[2.5]" />
                        </div>
                      </div>

                      {/* Status Labels */}
                      {(isOutOfStock || isAtLimit) && (
                        <div className="absolute inset-0 flex items-center justify-end pr-28 pointer-events-none">
                          <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-2xl ${
                            isOutOfStock ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-orange-500/10 text-orange-400 border-orange-500/20"
                          }`}>
                            {isOutOfStock ? "Out of Stock" : "Limit Reached"}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <div 
                    key={product._id}
                    onClick={() => !isOutOfStock && !isAtLimit && addToCart(product)}
                    className={`group relative flex flex-col rounded-[2.5rem] transition-all duration-500 border overflow-hidden ${
                      isOutOfStock || isAtLimit
                      ? "bg-dark-900 border-white/[0.03] opacity-50 grayscale cursor-not-allowed"
                      : "bg-dark-800 border-white/[0.05] cursor-pointer hover:border-accent hover:shadow-[0_20px_40px_rgba(234,88,12,0.08)] transform hover:-translate-y-2 active:scale-[0.98]"
                    }`}
                  >
                    {/* Visual Indicators */}
                    {cartItem && (
                      <div className="absolute top-4 right-4 z-10 bg-accent text-white w-9 h-9 rounded-full flex items-center justify-center text-sm font-black border-2 border-dark-800 shadow-xl animate-scale-in">
                        {cartItem.quantity}
                      </div>
                    )}

                    {/* Product Image Wrapper */}
                    <div className="relative aspect-square overflow-hidden bg-dark-900/50">
                      <img 
                        src={product.image || "https://via.placeholder.com/150"} 
                        alt={product.name} 
                        loading="lazy"
                        className={`w-full h-full object-cover transition-transform duration-1000 ${!isOutOfStock && !isAtLimit && "group-hover:scale-110"}`}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-dark-950/90 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                      
                      {/* Status Overlay */}
                      {(isOutOfStock || isAtLimit) && (
                        <div className="absolute inset-0 flex items-center justify-center bg-dark-950/60 backdrop-blur-[2px]">
                          <span className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest border shadow-2xl ${
                            isOutOfStock ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-orange-500/20 text-orange-400 border-orange-500/30"
                          }`}>
                            {isOutOfStock ? "Sold Out" : "Stock Limit"}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="p-6 space-y-5">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] leading-none">{product.category}</span>
                          {product.sku && <span className="text-[10px] font-mono font-bold text-gray-600 uppercase tracking-tighter opacity-40 group-hover:opacity-100 transition-opacity">{product.sku}</span>}
                        </div>
                        <h3 className={`font-bold text-base tracking-tight leading-snug transition-colors line-clamp-2 min-h-[3rem] ${
                          isOutOfStock || isAtLimit ? "text-gray-500" : "text-white group-hover:text-accent"
                        }`}>
                          {product.name}
                        </h3>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-white/[0.03]">
                        <div className="flex flex-col">
                          <span className={`font-black text-xl tracking-tighter ${isOutOfStock || isAtLimit ? "text-gray-600" : "text-white group-hover:text-accent transition-colors"}`}>
                            ₱{product.price.toLocaleString()}
                          </span>
                          <div className="flex items-center gap-2 mt-1">
                             <div className={`w-2 h-2 rounded-full ${product.stock <= 5 ? "bg-orange-500 animate-pulse" : "bg-green-500"}`} />
                             <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{product.stock} left</span>
                          </div>
                        </div>
                        
                        <div className={`w-12 h-12 rounded-[1.25rem] border flex items-center justify-center transition-all duration-500 ${
                          isOutOfStock || isAtLimit 
                          ? "bg-dark-900 border-white/[0.03] text-gray-700" 
                          : "bg-dark-900 border-white/[0.05] text-gray-400 group-hover:bg-accent group-hover:border-accent group-hover:text-white group-hover:shadow-[0_12px_24px_rgba(234,88,12,0.3)]"
                        }`}>
                          <PlusIcon className="w-6 h-6 stroke-[2.5]" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Overlay for mobile cart */}
      {isCartOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-dark-950/80 backdrop-blur-md z-[70] transition-opacity"
          onClick={() => setIsCartOpen(false)}
        />
      )}

      {/* Right Column: Order Cart - REDESIGNED FOR EFFICIENCY */}
      <div className={`
        fixed inset-y-0 right-0 z-[80] w-full sm:w-[450px] bg-dark-900 lg:static lg:bg-dark-800 lg:w-[400px] xl:w-[450px] 
        flex flex-col lg:rounded-[2.5rem] border-l lg:border border-white/[0.05] shadow-[0_50px_100px_rgba(0,0,0,0.5)] overflow-hidden 
        transition-all duration-500 ease-in-out transform
        ${isCartOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"}
      `}>
        {/* Header */}
        <div className="p-6 pb-5 border-b border-white/[0.03] flex items-center justify-between bg-dark-800/50 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            {/* Close Button for Mobile */}
            <button 
              onClick={() => setIsCartOpen(false)}
              className="lg:hidden p-2 text-gray-400 hover:text-white bg-dark-900 rounded-xl border border-white/[0.05] transition-all"
              aria-label="Close cart"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
            <div className="flex flex-col">
              <h2 className="text-xl font-black text-white tracking-tighter uppercase leading-none">Your Order</h2>
              <div className="flex items-center gap-2 mt-1.5">
                 <span className="bg-accent/10 text-accent px-1.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-[0.1em] border border-accent/20">
                    ID: #{orderNumber}
                 </span>
                 <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{cart.length} ITEMS</span>
              </div>
            </div>
          </div>
          <button 
            onClick={() => setCart([])}
            disabled={cart.length === 0}
            className="p-2.5 text-gray-600 hover:text-red-400 hover:bg-red-400/5 rounded-xl transition-all disabled:opacity-0"
            title="Clear Cart"
          >
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Items - High Visual Clarity */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5 custom-scrollbar">
          {cart.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
              <div className="w-24 h-24 bg-dark-950/50 rounded-[2.5rem] flex items-center justify-center mb-6 border border-white/[0.03] animate-pulse">
                <ShoppingBagIcon className="w-12 h-12 text-gray-700" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Cart is empty</h3>
              <p className="text-gray-500 max-w-[200px] text-sm leading-relaxed">Select products to start building your order.</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item._id} className="group flex gap-5 items-start animate-slide-in relative">
                <div className="relative flex-shrink-0">
                  <img src={item.image} className="w-20 h-20 rounded-[1.5rem] object-cover border border-white/[0.05] group-hover:scale-105 transition-transform duration-500 shadow-xl" alt={item.name} />
                  <div className="absolute -top-2 -left-2 bg-dark-900 text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border border-white/[0.05] shadow-lg">
                    {item.quantity}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0 py-1">
                  <h4 className="text-white font-bold truncate text-base tracking-tight mb-1 group-hover:text-accent transition-colors">{item.name}</h4>
                  <div className="flex items-center gap-3">
                     <span className="text-accent text-sm font-black tracking-tight">₱{(item.price * item.quantity).toLocaleString()}</span>
                     <span className="text-gray-600 text-[10px] font-bold uppercase tracking-widest">₱{item.price.toLocaleString()} ea</span>
                  </div>
                </div>

                <div className="flex flex-col items-end justify-between self-stretch py-1">
                  <div className="flex items-center bg-dark-950/80 rounded-2xl p-1.5 border border-white/[0.05] shadow-inner group-hover:border-accent/20 transition-colors">
                    <button 
                      onClick={() => updateQuantity(item._id, -1)} 
                      className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-white hover:bg-dark-800 rounded-xl transition-all active:scale-90"
                      aria-label="Decrease quantity"
                    >
                      <MinusIcon className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center text-sm font-black text-white">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item._id, 1)} 
                      disabled={item.quantity >= item.stock}
                      className={`w-7 h-7 flex items-center justify-center rounded-xl transition-all active:scale-90 ${
                        item.quantity >= item.stock ? "text-gray-800 cursor-not-allowed" : "text-gray-500 hover:text-white hover:bg-dark-800"
                      }`}
                      aria-label="Increase quantity"
                    >
                      <PlusIcon className="w-4 h-4" />
                    </button>
                  </div>
                  <button 
                    onClick={() => removeFromCart(item._id)} 
                    className="p-2 text-gray-600 hover:text-red-500 bg-red-500/0 hover:bg-red-500/5 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                    aria-label="Remove item"
                  >
                    <TrashIcon className="w-4.5 h-4.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Summary & Checkout Section - COMPACT & EFFICIENT */}
        <div className="p-6 bg-dark-900/80 backdrop-blur-xl border-t border-white/[0.05] space-y-5">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 font-bold uppercase tracking-widest text-[9px]">Subtotal</span>
              <span className="text-gray-300 font-black text-xs">₱{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 font-bold uppercase tracking-widest text-[9px]">Tax ({taxRate}%)</span>
              <span className="text-gray-300 font-black text-xs">₱{tax.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-end pt-3 border-t border-white/[0.03]">
              <span className="text-white font-black text-base tracking-tighter uppercase leading-none">Total</span>
              <span className="text-accent font-black text-3xl tracking-tighter leading-none shadow-accent/20 drop-shadow-2xl">₱{total.toLocaleString()}</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] ml-1">Payment Method</span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setPaymentMethod("cash")}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all duration-500 group ${
                    paymentMethod === "cash"
                      ? "bg-accent border-accent text-white shadow-[0_8px_20px_rgba(234,88,12,0.25)] scale-[1.02]"
                      : "bg-dark-950/50 border-white/[0.03] text-gray-600 hover:text-gray-300 hover:border-white/[0.1] hover:bg-dark-800"
                  }`}
                >
                  <BanknotesIcon className={`w-5 h-5 ${paymentMethod === 'cash' ? 'text-white' : 'group-hover:text-accent'} transition-colors`} />
                  <span className="text-[9px] font-black uppercase tracking-widest">Cash</span>
                </button>
                <button
                  onClick={() => setPaymentMethod("card")}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all duration-500 group ${
                    paymentMethod === "card"
                      ? "bg-accent border-accent text-white shadow-[0_8px_20px_rgba(234,88,12,0.25)] scale-[1.02]"
                      : "bg-dark-950/50 border-white/[0.03] text-gray-600 hover:text-gray-300 hover:border-white/[0.1] hover:bg-dark-800"
                  }`}
                >
                  <CreditCardIcon className={`w-5 h-5 ${paymentMethod === 'card' ? 'text-white' : 'group-hover:text-accent'} transition-colors`} />
                  <span className="text-[9px] font-black uppercase tracking-widest">Card</span>
                </button>
                <button
                  onClick={() => setPaymentMethod("gcash")}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all duration-500 group ${
                    paymentMethod === "gcash"
                      ? "bg-accent border-accent text-white shadow-[0_8px_20px_rgba(234,88,12,0.25)] scale-[1.02]"
                      : "bg-dark-950/50 border-white/[0.03] text-gray-600 hover:text-gray-300 hover:border-white/[0.1] hover:bg-dark-800"
                  }`}
                >
                  <QrCodeIcon className={`w-5 h-5 ${paymentMethod === 'gcash' ? 'text-white' : 'group-hover:text-accent'} transition-colors`} />
                  <span className="text-[9px] font-black uppercase tracking-widest">E-Wallet</span>
                </button>
              </div>
            </div>

            <button
              onClick={handleCheckoutClick}
              disabled={cart.length === 0}
              className={`w-full relative overflow-hidden group py-4 rounded-2xl font-black uppercase tracking-[0.15em] transition-all duration-500 flex items-center justify-center gap-2.5 ${
                cart.length === 0
                ? "bg-dark-950/50 border border-white/[0.03] text-gray-700 cursor-not-allowed"
                : "bg-accent text-white shadow-[0_15px_40px_rgba(234,88,12,0.3)] hover:shadow-[0_20px_50px_rgba(234,88,12,0.4)] hover:scale-[1.01] active:scale-95"
              }`}
            >
              <ShoppingBagIcon className={`w-5 h-5 ${cart.length > 0 ? "group-hover:animate-bounce" : ""}`} />
              <span className="text-xs">Checkout (F2)</span>
            </button>
          </div>
        </div>
      </div>

      <CheckoutModal 
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        onConfirm={handleCheckoutConfirm}
        totalAmount={total}
        cartItems={cart}
      />
    </div>
  );
}
