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
  XMarkIcon
} from "@heroicons/react/24/outline";
import { useNotification } from "../contexts/NotificationContext";
import { useSettings } from "../contexts/SettingsContext";
import { useSocket } from "../contexts/SocketContext";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import CheckoutModal from "../components/CheckoutModal";

export default function POS() {
  const { showNotification } = useNotification();
  const { categories: dbCategories, settings } = useSettings();
  const socket = useSocket();
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  
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

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("pos_cart", JSON.stringify(cart));
  }, [cart]);

  // Fetch products from API
  const fetchProducts = async () => {
    try {
      const res = await api.get("/products");
      // Only show active products in POS
      setProducts(res.data.filter(p => p.status === 'active'));
    } catch (err) {
      console.error("Failed to fetch products:", err);
      showNotification("Failed to load products", "error");
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

  return (
    <div className="flex flex-col lg:flex-row h-full gap-6 p-2 relative overflow-hidden">
      {/* Mobile Cart Toggle */}
      <button 
        onClick={() => setIsCartOpen(!isCartOpen)}
        className="lg:hidden fixed bottom-20 right-6 z-40 bg-accent text-white p-4 rounded-full shadow-2xl shadow-accent/40 flex items-center justify-center transition-transform active:scale-95"
      >
        <div className="relative">
          <ShoppingBagIcon className="w-6 h-6" />
          {cart.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-dark-800">
              {cart.reduce((acc, item) => acc + item.quantity, 0)}
            </span>
          )}
        </div>
      </button>

      {/* Left Column: Product Selection */}
      <div className="flex-1 flex flex-col gap-6 overflow-hidden h-full">
        {/* Search & Categories */}
        <div className="bg-dark-800 p-6 rounded-3xl border border-dark-700 shadow-xl flex items-center gap-4">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search products..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-dark-900 text-white pl-12 pr-4 py-3 rounded-2xl border border-dark-700 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
            />
          </div>

          <div className="relative group">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`p-3.5 rounded-2xl border transition-all flex items-center justify-center cursor-pointer ${
                activeCategory !== 'All' 
                  ? 'bg-accent border-accent text-white shadow-lg shadow-accent/20' 
                  : 'bg-dark-900 border-dark-700 text-gray-400 hover:text-white hover:border-gray-500'
              }`}
            >
              <FunnelIcon className="w-6 h-6" />
            </button>
            
            {isFilterOpen && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setIsFilterOpen(false)}
                ></div>
                <div className="absolute right-0 top-full mt-2 w-48 bg-dark-900 border border-dark-700 rounded-2xl shadow-2xl z-20 overflow-hidden py-1 animate-scale-in origin-top-right">
                  <div className="max-h-64 overflow-y-auto custom-scrollbar">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => {
                          setActiveCategory(cat);
                          setIsFilterOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm font-bold capitalize tracking-wider transition-colors ${
                          activeCategory === cat
                            ? 'bg-accent/10 text-accent'
                            : 'text-gray-400 hover:bg-dark-800 hover:text-white'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6 pr-2 custom-scrollbar pb-24 lg:pb-0">
          {filteredProducts.map(product => {
            const cartItem = cart.find(item => item._id === product._id);
            const isOutOfStock = product.stock <= 0;
            const isAtLimit = cartItem && cartItem.quantity >= product.stock;

            return (
              <div 
                key={product._id}
                onClick={() => !isOutOfStock && !isAtLimit && addToCart(product)}
                className={`bg-dark-800 rounded-[2rem] border p-4 group flex flex-col h-fit transition-all duration-300 ${
                  isOutOfStock || isAtLimit
                  ? "border-dark-700/30 opacity-60 grayscale cursor-not-allowed"
                  : "border-dark-700/50 cursor-pointer hover:border-accent hover:shadow-2xl hover:shadow-accent/5 transform hover:-translate-y-1.5"
                }`}
              >
                {/* Product Image Wrapper */}
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden mb-4 bg-dark-900/50 border border-dark-700/30">
                  <img 
                    src={product.image || "https://via.placeholder.com/150"} 
                    alt={product.name} 
                    className={`w-full h-full object-cover transition-transform duration-700 ${!isOutOfStock && !isAtLimit && "group-hover:scale-110"}`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-900/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                  
                  {/* Status Overlay */}
                  {(isOutOfStock || isAtLimit) && (
                    <div className="absolute inset-0 flex items-center justify-center bg-dark-950/40 backdrop-blur-[2px]">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border shadow-xl ${
                        isOutOfStock ? "bg-red-500/20 text-red-500 border-red-500/30" : "bg-orange-500/20 text-orange-500 border-orange-500/30"
                      }`}>
                        {isOutOfStock ? "Sold Out" : "Limit Reached"}
                      </span>
                    </div>
                  )}

                  {/* Category Badge */}
                  <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2.5 py-1 bg-dark-900/80 backdrop-blur-md rounded-lg border border-white/5 shadow-xl">
                    <TagIcon className="w-3 h-3 text-accent" />
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-300">{product.category}</span>
                  </div>

                  {/* SKU Badge */}
                  {product.sku && (
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-dark-950/60 backdrop-blur-sm rounded-md border border-white/5">
                      <span className="text-[9px] font-mono font-bold text-gray-500 uppercase">{product.sku}</span>
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="flex-1 px-1 space-y-3">
                  <div className="space-y-1">
                    <h3 className={`font-black text-sm tracking-tight leading-tight transition-colors truncate ${
                      isOutOfStock || isAtLimit ? "text-gray-500" : "text-white group-hover:text-accent"
                    }`}>
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <CubeIcon className="w-3.5 h-3.5" />
                      <span className={`text-[11px] font-bold ${product.stock <= 5 && !isOutOfStock ? "text-orange-500" : ""}`}>
                        {product.stock} in stock
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest leading-none">Price</span>
                      <span className={`font-black text-lg tracking-tighter ${isOutOfStock || isAtLimit ? "text-gray-600" : "text-accent"}`}>
                        ₱{product.price.toLocaleString()}
                      </span>
                    </div>
                    
                    <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center transition-all duration-300 ${
                      isOutOfStock || isAtLimit 
                      ? "bg-dark-900 border-dark-700 text-gray-700" 
                      : "bg-dark-900 border-dark-700 text-gray-400 group-hover:bg-accent group-hover:border-accent group-hover:text-white group-hover:shadow-lg group-hover:shadow-accent/20"
                    }`}>
                      <PlusIcon className="w-5 h-5 stroke-[2.5]" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Overlay for mobile cart */}
      {isCartOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-dark-950/80 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setIsCartOpen(false)}
        />
      )}

      {/* Right Column: Order Cart */}
      <div className={`
        fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-dark-900 lg:static lg:bg-dark-800 lg:w-96 
        flex flex-col lg:rounded-3xl border-l lg:border border-dark-700 shadow-2xl overflow-hidden 
        transition-transform duration-300 ease-in-out transform
        ${isCartOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"}
      `}>
        {/* Header */}
        <div className="p-6 border-b border-dark-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Close Button for Mobile */}
            <button 
              onClick={() => setIsCartOpen(false)}
              className="lg:hidden p-2 -ml-2 text-gray-400 hover:text-white transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
            <div className="bg-accent/20 p-2 rounded-xl">
              <ShoppingBagIcon className="w-6 h-6 text-accent" />
            </div>
            <h2 className="text-xl font-bold text-white">Current Order</h2>
          </div>
          <span className="bg-dark-900 px-3 py-1 rounded-lg text-xs font-bold text-gray-400 border border-dark-700">
            #{orderNumber}
          </span>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 custom-scrollbar">
          {cart.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40">
              <div className="w-20 h-20 bg-dark-900 rounded-full flex items-center justify-center mb-4">
                <ShoppingBagIcon className="w-10 h-10" />
              </div>
              <p className="text-gray-400">Your cart is empty</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item._id} className="flex gap-4 items-center animate-fade-in">
                <img src={item.image} className="w-16 h-16 rounded-xl object-cover" />
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-bold truncate text-sm">{item.name}</h4>
                  <p className="text-accent text-xs font-bold">₱{item.price.toLocaleString()}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center bg-dark-900 rounded-lg p-1 border border-dark-700">
                    <button onClick={() => updateQuantity(item._id, -1)} className="p-1 hover:text-accent transition-colors">
                      <MinusIcon className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center text-xs font-bold text-white">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item._id, 1)} 
                      disabled={item.quantity >= item.stock}
                      className={`p-1 transition-colors ${item.quantity >= item.stock ? "text-gray-700 cursor-not-allowed" : "hover:text-accent"}`}
                    >
                      <PlusIcon className="w-3 h-3" />
                    </button>
                  </div>
                  <button onClick={() => removeFromCart(item._id)} className="text-gray-500 hover:text-red-500 transition-colors">
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Summary & Checkout */}
        <div className="p-6 bg-dark-900 border-t border-dark-700 space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Subtotal</span>
              <span className="text-white font-medium">₱{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Tax ({taxRate}%)</span>
              <span className="text-white font-medium">₱{tax.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-lg font-black pt-2 border-t border-dark-700">
              <span className="text-white">Total</span>
              <span className="text-accent">₱{total.toLocaleString()}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2">
            <button
              onClick={() => setPaymentMethod("cash")}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl border bg-dark-800 transition-all ${
                paymentMethod === "cash"
                  ? "border-accent text-white shadow-lg shadow-accent/20"
                  : "border-dark-700 text-gray-400 hover:text-white hover:border-accent"
              }`}
            >
              <BanknotesIcon className="w-5 h-5" />
              <span className="text-[10px] font-bold">Cash</span>
            </button>
            <button
              onClick={() => setPaymentMethod("card")}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl border bg-dark-800 transition-all ${
                paymentMethod === "card"
                  ? "border-accent text-white shadow-lg shadow-accent/20"
                  : "border-dark-700 text-gray-400 hover:text-white hover:border-accent"
              }`}
            >
              <CreditCardIcon className="w-5 h-5" />
              <span className="text-[10px] font-bold">Card</span>
            </button>
            <button
              onClick={() => setPaymentMethod("gcash")}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl border bg-dark-800 transition-all ${
                paymentMethod === "gcash"
                  ? "border-accent text-white shadow-lg shadow-accent/20"
                  : "border-dark-700 text-gray-400 hover:text-white hover:border-accent"
              }`}
            >
              <QrCodeIcon className="w-5 h-5" />
              <span className="text-[10px] font-bold">E-Wallet</span>
            </button>
          </div>

          <button 
            onClick={handleCheckoutClick}
            className="w-full bg-accent hover:bg-orange-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-accent/20 transition-all transform active:scale-95"
          >
            Place Order
          </button>
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
