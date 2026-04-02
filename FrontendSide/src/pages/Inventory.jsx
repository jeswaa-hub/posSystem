import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { 
  MagnifyingGlassIcon, 
  FunnelIcon,
  ArrowPathIcon,
  PencilSquareIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
  CubeIcon,
  BanknotesIcon,
  ClipboardDocumentListIcon
} from "@heroicons/react/24/outline";
import { useNotification } from "../contexts/NotificationContext";
import { useAuth } from "../contexts/AuthContext";
import { useSettings } from "../contexts/SettingsContext";
import api from "../services/api";
import { useSocket } from "../contexts/SocketContext";
import InventorySkeleton from "../components/skeletons/InventorySkeleton";

const formatPeso = (amount) => {
  return `₱${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export default function Inventory() {
  const { showNotification } = useNotification();
  const { user } = useAuth();
  const { categories: dbCategories } = useSettings();
  const socket = useSocket();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [isAddIngredientModalOpen, setIsAddIngredientModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Ingredient Form State
  const [ingredientForm, setIngredientForm] = useState({
    name: "",
    category: "Raw Material",
    cost: "",
    unit: "pcs", // e.g. kg, liters, pcs
    stock: ""    // Added stock quantity field
  });

  const handleAddIngredientSubmit = async (e) => {
    e.preventDefault();
    try {
      const generatedSKU = `ING-${Date.now().toString().slice(-6)}`;
      
      const productPayload = {
        name: ingredientForm.name,
        category: ingredientForm.category,
        price: 0,
        cost: Number(ingredientForm.cost),
        sku: generatedSKU,
        unit: ingredientForm.unit,
        type: 'ingredient',
        status: 'active',
        stock: Number(ingredientForm.stock)
      };

      const prodRes = await api.post("products", productPayload);
      const newProduct = prodRes.data;

      await api.post("inventory", {
        product: newProduct._id,
        stockOnHand: Number(ingredientForm.stock),
        reorderPoint: 5,
        maxStock: 100,
        notes: "Initial raw material entry"
      });

      showNotification("Ingredient added successfully", "success");
      setIsAddIngredientModalOpen(false);
      setIngredientForm({
        name: "",
        category: "Raw Material",
        cost: "",
        unit: "pcs",
        stock: ""
      });
      fetchInventory();
    } catch (err) {
      console.error("Failed to add ingredient:", err);
      showNotification("Failed to add ingredient", "error");
    }
  };

  // Adjustment Form State
  const [adjustForm, setAdjustForm] = useState({
    type: "delta", // 'delta' or 'set'
    quantity: "",
    reason: "Manual Adjustment",
    notes: ""
  });

  // Init Form State (Removed)


  const fetchInventory = async () => {
    try {
      const res = await api.get("inventory");
      setInventory(res.data);
    } catch (err) {
      console.error("Failed to fetch inventory:", err);
      showNotification("Failed to load inventory data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  // Real-time Updates
  useEffect(() => {
    if (!socket) return;

    socket.on("inventory_updated", (updatedItem) => {
      setInventory(prev => prev.map(item => 
        item._id === updatedItem._id 
          ? updatedItem
          : item
      ));

      // Conflict detection: If this item is currently being adjusted
      if (isAdjustModalOpen && selectedItem?._id === updatedItem._id) {
        showNotification("Stock was updated by another user.", "warning");
      }
    });

    socket.on("inventory_created", (newItem) => {
      setInventory(prev => {
        // Prevent duplicate
        if (prev.find(i => i._id === newItem._id)) return prev;
        return [newItem, ...prev];
      });
    });

    socket.on("inventory_deleted", (deletedId) => {
      setInventory(prev => prev.filter(i => i._id !== deletedId));
    });

    return () => {
      socket.off("inventory_updated");
      socket.off("inventory_created");
      socket.off("inventory_deleted");
    };
  }, [socket]);

  const categories = ["All", "Raw Material", ...dbCategories.map(c => c.name)];

  const filteredInventory = inventory.filter(item => {
    // 1. First, strictly filter for Raw Materials / Ingredients
    const isIngredient = 
      item.product?.type === 'ingredient' || 
      item.product?.category === "Raw Material" || 
      item.product?.category?.name === "Raw Material";
      
    if (!isIngredient) return false;

    // 2. Filter by Search
    const matchesSearch = (item.product?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.product?.sku || "").toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    // 3. Filter by Category (Sub-categories of raw materials, if any)
    if (activeCategory === "All" || activeCategory === "Raw Material") return true;
    
    const prodCat = item.product?.category?.name || item.product?.category || "";
    return prodCat === activeCategory;
  });

  // Derived Metrics (Calculated ONLY from Raw Materials)
  // We re-calculate based on the full list of INGREDIENTS, ignoring the search filter for the top cards
  const allIngredients = inventory.filter(item => 
      item.product?.type === 'ingredient' || 
      item.product?.category === "Raw Material" || 
      item.product?.category?.name === "Raw Material"
  );

  const totalStockValue = allIngredients.reduce((acc, item) => acc + (item.stockOnHand * (item.product?.cost || 0)), 0);
  const lowStockCount = allIngredients.filter(item => item.stockOnHand <= (item.reorderPoint || 5)).length;
  const totalItems = allIngredients.length;

  const handleAdjustClick = (item) => {
    setSelectedItem(item);
    setAdjustForm({
      type: "delta",
      quantity: "",
      reason: "Manual Adjustment",
      notes: ""
    });
    setIsAdjustModalOpen(true);
  };

  // Pagination Logic
  const totalPages = Math.ceil(filteredInventory.length / itemsPerPage);
  const paginatedInventory = filteredInventory.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;

    const qty = Number(adjustForm.quantity);
    if (isNaN(qty) || qty === 0) {
      showNotification("Please enter a valid quantity", "error");
      return;
    }

    const backup = [...inventory];
    try {
      // Optimistic update
      setInventory(prev => prev.map(item => {
        if (item._id === selectedItem._id) {
          const oldQty = item.stockOnHand;
          let newQty = oldQty;
          if (adjustForm.type === 'set') {
            newQty = qty;
          } else {
            newQty = oldQty + qty;
          }
          return { ...item, stockOnHand: newQty };
        }
        return item;
      }));
      setIsAdjustModalOpen(false);

      await api.post("inventory/adjust", {
        productId: selectedItem.product._id,
        adjustmentQty: qty,
        type: adjustForm.type,
        reason: adjustForm.reason,
        userId: user._id, // Assuming user context has _id
        notes: adjustForm.notes
      });
      
      showNotification("Stock adjusted successfully", "success");
    } catch (err) {
      console.error("Adjustment failed:", err);
      // Rollback
      setInventory(backup);
      showNotification(err.response?.data?.message || "Failed to adjust stock", "error");
    }
  };

  if (loading) return <InventorySkeleton />;

  return (
    <div className="p-2 space-y-6 animate-fade-in">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">Inventory Management</h2>
          <p className="text-gray-400 mt-1">Track stock levels and valuations</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={fetchInventory}
            className="p-3 bg-dark-800 rounded-xl text-gray-400 hover:text-white border border-dark-700 hover:border-accent transition-all"
          >
            <ArrowPathIcon className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Valuation Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-dark-800 p-6 rounded-3xl border border-dark-700 shadow-xl relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <BanknotesIcon className="w-24 h-24 text-green-500" />
          </div>
          <div className="relative z-10">
            <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-1">Total Asset Value</p>
            <h3 className="text-3xl font-black text-white">{formatPeso(totalStockValue)}</h3>
            <p className="text-xs text-green-500 font-bold mt-2 flex items-center gap-1">
              <CheckCircleIcon className="w-4 h-4" /> Based on Cost Price
            </p>
          </div>
        </div>

        <div className="bg-dark-800 p-6 rounded-3xl border border-dark-700 shadow-xl relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <ExclamationTriangleIcon className="w-24 h-24 text-orange-500" />
          </div>
          <div className="relative z-10">
            <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-1">Low Stock Alerts</p>
            <h3 className="text-3xl font-black text-orange-500">{lowStockCount}</h3>
            <p className="text-xs text-gray-400 font-bold mt-2">Items below reorder point</p>
          </div>
        </div>

        <div className="bg-dark-800 p-6 rounded-3xl border border-dark-700 shadow-xl relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <CubeIcon className="w-24 h-24 text-blue-500" />
          </div>
          <div className="relative z-10">
            <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-1">Total SKUs</p>
            <h3 className="text-3xl font-black text-white">{totalItems}</h3>
            <p className="text-xs text-gray-400 font-bold mt-2">Active products in inventory</p>
          </div>
        </div>
      </div>

      {/* Stock Table */}
      <div className="bg-dark-800 rounded-3xl border border-dark-700 shadow-xl overflow-hidden flex flex-col h-[600px]">
        {/* Toolbar */}
        <div className="p-6 border-b border-dark-700 flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative max-w-md flex-1">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search by Product Name or SKU..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-dark-900 text-white pl-12 pr-4 py-3 rounded-2xl border border-dark-700 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all placeholder:text-gray-600"
            />
          </div>
          <div className="flex gap-2">
            <div className="relative group">
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`p-3 bg-dark-900 rounded-xl text-gray-400 hover:text-white border border-dark-700 hover:border-accent transition-all ${
                  activeCategory !== 'All' ? 'bg-accent border-accent text-white' : ''
                }`}
              >
                <FunnelIcon className="w-5 h-5" />
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

            <button 
              onClick={() => setIsAddIngredientModalOpen(true)}
              className="flex items-center gap-2 px-4 py-3 bg-dark-900 text-gray-400 hover:text-white border border-dark-700 rounded-2xl font-bold transition-all"
            >
              <CubeIcon className="w-5 h-5" />
              <span>Add Ingredient</span>
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-dark-800 z-10">
              <tr className="border-b border-dark-700">
                <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest">Product</th>
                <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest text-right">Cost / Price</th>
                <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest text-center">Stock Level</th>
                <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest text-center">Status</th>
                <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest text-center">Reserved</th>
                <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500 font-medium animate-pulse">
                    Loading inventory...
                  </td>
                </tr>
              ) : paginatedInventory.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    <p className="mb-2 text-lg font-medium text-gray-400">No raw materials found.</p>
                    <p className="text-sm">Add ingredients using the "Add Ingredient" button to start tracking.</p>
                  </td>
                </tr>
              ) : (
                paginatedInventory.map((item) => {
                  const isLowStock = item.stockOnHand <= (item.reorderPoint || 5);
                  return (
                    <tr key={item._id} className="group hover:bg-dark-700/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-white font-bold text-sm">{item.product?.name || "Unknown"}</span>
                          <span className="text-xs text-gray-500 font-mono">{item.product?.sku || "NO SKU"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-gray-300 font-bold text-xs">Cost: {formatPeso(item.product?.cost || 0)}</span>
                          {item.product?.type !== 'ingredient' && (
                            <span className="text-gray-500 text-[10px]">SRP: {formatPeso(item.product?.price || 0)}</span>
                          )}
                          {item.product?.type === 'ingredient' && (
                             <span className="text-gray-500 text-[10px] italic">Raw Material</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className={`text-lg font-black ${isLowStock ? "text-red-500" : "text-green-500"}`}>
                            {item.stockOnHand}
                          </span>
                          {isLowStock && (
                            <span className="text-[10px] font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full mt-1 animate-pulse">
                              Low Stock
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                          item.stockOnHand > 0 
                            ? "bg-green-500/10 text-green-500 border-green-500/20" 
                            : "bg-red-500/10 text-red-500 border-red-500/20"
                        }`}>
                          {item.stockOnHand > 0 ? "In Stock" : "Out of Stock"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`text-sm font-bold ${item.reservedStock > 0 ? 'text-orange-500' : 'text-gray-500'}`}>
                          {item.reservedStock || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => handleAdjustClick(item)}
                            className="p-2 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white transition-all"
                            title="Adjust Stock"
                          >
                            <PencilSquareIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-4 border-t border-dark-700 flex items-center justify-between bg-dark-800">
          <p className="text-sm text-gray-500 font-medium">
            Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredInventory.length)} to {Math.min(currentPage * itemsPerPage, filteredInventory.length)} of {filteredInventory.length} items
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 text-sm font-bold text-gray-400 bg-dark-900 rounded-xl hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-dark-700 hover:border-gray-500"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-4 py-2 text-sm font-bold text-gray-400 bg-dark-900 rounded-xl hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-dark-700 hover:border-gray-500"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Add Ingredient Modal */}
      {isAddIngredientModalOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-dark-900 w-full max-w-lg rounded-[2rem] shadow-2xl border border-dark-700 overflow-hidden animate-scale-in">
            <div className="p-6 border-b border-dark-800 bg-dark-800/50 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-white">Add New Ingredient</h3>
                <p className="text-gray-400 text-xs font-bold mt-1">Define a raw material or supply</p>
              </div>
              <button 
                onClick={() => setIsAddIngredientModalOpen(false)}
                className="p-2 rounded-xl hover:bg-dark-700 text-gray-400 hover:text-white transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleAddIngredientSubmit} className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Ingredient Name</label>
                  <input
                    required
                    type="text"
                    value={ingredientForm.name}
                    onChange={(e) => setIngredientForm({ ...ingredientForm, name: e.target.value })}
                    className="w-full bg-dark-800 text-white font-bold px-4 py-3 rounded-xl border border-dark-700 focus:border-accent outline-none"
                    placeholder="e.g. Milk 1L, Coffee Beans 1kg"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Cost (per unit)</label>
                    <input
                      required
                      type="number"
                      min="0"
                      step="0.01"
                      value={ingredientForm.cost}
                      onChange={(e) => setIngredientForm({ ...ingredientForm, cost: e.target.value })}
                      className="w-full bg-dark-800 text-white font-bold px-4 py-3 rounded-xl border border-dark-700 focus:border-accent outline-none"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Unit</label>
                    <select
                      value={ingredientForm.unit}
                      onChange={(e) => setIngredientForm({ ...ingredientForm, unit: e.target.value })}
                      className="w-full bg-dark-800 text-white font-bold px-4 py-3 rounded-xl border border-dark-700 focus:border-accent outline-none"
                    >
                      <option value="pcs">Pieces (pcs)</option>
                      <option value="kg">Kilograms (kg)</option>
                      <option value="g">Grams (g)</option>
                      <option value="l">Liters (l)</option>
                      <option value="ml">Milliliters (ml)</option>
                      <option value="pack">Pack</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Initial Stock</label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={ingredientForm.stock}
                    onChange={(e) => setIngredientForm({ ...ingredientForm, stock: e.target.value })}
                    className="w-full bg-dark-800 text-white font-bold px-4 py-3 rounded-xl border border-dark-700 focus:border-accent outline-none"
                    placeholder="e.g. 100"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddIngredientModalOpen(false)}
                  className="flex-1 py-3 rounded-xl font-bold text-gray-400 bg-dark-800 hover:bg-dark-700 hover:text-white transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl font-black text-white bg-accent hover:bg-orange-600 shadow-lg shadow-accent/20 transition-all"
                >
                  Save Ingredient
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Adjustment Modal */}
      {isAdjustModalOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-dark-900 w-full max-w-lg rounded-[2rem] shadow-2xl border border-dark-700 overflow-hidden animate-scale-in">
            <div className="p-6 border-b border-dark-800 bg-dark-800/50 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-white">Adjust Stock</h3>
                <p className="text-gray-400 text-xs font-bold mt-1">{selectedItem?.product?.name}</p>
              </div>
              <button 
                onClick={() => setIsAdjustModalOpen(false)}
                className="p-2 rounded-xl hover:bg-dark-700 text-gray-400 hover:text-white transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleAdjustSubmit} className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Type</label>
                    <select
                      value={adjustForm.type}
                      onChange={(e) => setAdjustForm({ ...adjustForm, type: e.target.value })}
                      className="w-full bg-dark-800 text-white font-bold px-4 py-3 rounded-xl border border-dark-700 focus:border-accent outline-none"
                    >
                      <option value="delta">Add/Deduct (+/-)</option>
                      <option value="set">Set Exact Qty</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Quantity</label>
                    <input
                      type="number"
                      required
                      value={adjustForm.quantity}
                      onChange={(e) => setAdjustForm({ ...adjustForm, quantity: e.target.value })}
                      placeholder={adjustForm.type === 'delta' ? "+10 or -5" : "e.g. 50"}
                      className="w-full bg-dark-800 text-white font-bold px-4 py-3 rounded-xl border border-dark-700 focus:border-accent outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Reason Code</label>
                  <select
                    value={adjustForm.reason}
                    onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                    className="w-full bg-dark-800 text-white font-bold px-4 py-3 rounded-xl border border-dark-700 focus:border-accent outline-none"
                  >
                    <option value="Manual Adjustment">Manual Adjustment</option>
                    <option value="Restock">Restock Delivery</option>
                    <option value="Spoilage">Spoilage / Damaged</option>
                    <option value="Theft">Theft / Loss</option>
                    <option value="Return">Customer Return</option>
                    <option value="Audit">Audit Correction</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Notes (Optional)</label>
                  <textarea
                    rows="3"
                    value={adjustForm.notes}
                    onChange={(e) => setAdjustForm({ ...adjustForm, notes: e.target.value })}
                    className="w-full bg-dark-800 text-white font-medium px-4 py-3 rounded-xl border border-dark-700 focus:border-accent outline-none resize-none"
                    placeholder="Additional details..."
                  ></textarea>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="flex-1 py-3 rounded-xl font-bold text-gray-400 bg-dark-800 hover:bg-dark-700 hover:text-white transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl font-black text-white bg-accent hover:bg-orange-600 shadow-lg shadow-accent/20 transition-all"
                >
                  Confirm Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}


    </div>
  );
}
