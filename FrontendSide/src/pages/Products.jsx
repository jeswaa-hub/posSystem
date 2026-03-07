import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useSocket } from "../contexts/SocketContext";
import { 
  MagnifyingGlassIcon, 
  PlusIcon, 
  FunnelIcon,
  EllipsisVerticalIcon,
  PencilSquareIcon,
  TrashIcon,
  ArchiveBoxIcon,
  ArrowPathIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  TagIcon,
  BanknotesIcon,
  CubeIcon,
  ShieldCheckIcon,
  ChevronRightIcon,
  ArrowLeftIcon,
  InformationCircleIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  PowerIcon,
  CheckIcon
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import { useNotification } from "../contexts/NotificationContext";
import { useSettings } from "../contexts/SettingsContext";
import api from "../services/api";

export default function Products() {
  const navigate = useNavigate();
  const socket = useSocket();
  const { showNotification } = useNotification();
  const { categories: dbCategories } = useSettings();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [products, setProducts] = useState([]);

  // Fetch products from API
  const fetchProducts = async () => {
    try {
      const res = await api.get("/products");
      setProducts(res.data);
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
      setProducts(prev => {
        if (prev.find(p => p._id === newProduct._id)) return prev;
        return [...prev, newProduct];
      });
    });

    socket.on("product_updated", (updatedProduct) => {
      setProducts(prev => prev.map(p => p._id === updatedProduct._id ? updatedProduct : p));
    });

    socket.on("product_deleted", (deletedId) => {
      setProducts(prev => prev.filter(p => p._id !== deletedId));
    });

    return () => {
      socket.off("product_created");
      socket.off("product_updated");
      socket.off("product_deleted");
    };
  }, [socket]);

  // Modal States
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: "",
    price: "",
    cost: "",
    stock: "",
    category: "",
    status: "",
    sku: ""
  });

  const categories = ["All", ...dbCategories.map(c => c.name)];

  const filteredProducts = products.filter(p => 
    (p.type !== 'ingredient') && // Filter out ingredients
    (activeCategory === "All" || p.category === activeCategory) &&
    (p.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Handle Edit Click
  const handleEditClick = (product) => {
    setSelectedProduct(product);
    setEditFormData({
      name: product.name,
      price: product.price,
      cost: product.cost || 0,
      stock: product.stock,
      category: product.category,
      status: product.status,
      sku: product.sku || ""
    });
    setIsEditModalOpen(true);
  };

  // Handle Delete Click
  const handleDeleteClick = (product) => {
    setSelectedProduct(product);
    setIsDeleteModalOpen(true);
  };

  // Save Edit
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    
    // Price Validation
    if (Number(editFormData.price) <= Number(editFormData.cost)) {
      showNotification("Selling price must be higher than the cost price", "warning");
      return;
    }

    try {
      await api.patch(`/products/${selectedProduct._id}`, editFormData);
      // Removed manual update, socket will handle it
      setIsEditModalOpen(false);
      showNotification("Product updated successfully", "success");
    } catch (err) {
      console.error("Failed to update product:", err);
      showNotification("Failed to update product", "error");
    }
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    try {
      await api.delete(`/products/${selectedProduct._id}`);
      // Removed manual update, socket will handle it
      setIsDeleteModalOpen(false);
      showNotification("Product deleted successfully", "success");
    } catch (err) {
      console.error("Failed to delete product:", err);
      showNotification("Failed to delete product", "error");
    }
  };

  return (
    <div className="p-2 space-y-8 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">All Products</h2>
          <p className="text-gray-400 mt-1">Manage your store products, pricing, and stock levels</p>
        </div>
        <button 
          onClick={() => navigate("/products/add")}
          className="flex items-center justify-center gap-2 bg-accent hover:bg-orange-600 text-white font-bold px-6 py-4 rounded-2xl shadow-lg shadow-accent/20 transition-all transform hover:-translate-y-1 active:scale-95"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Header & Filter */}
      <div className="bg-dark-800 p-6 rounded-3xl border border-dark-700 shadow-xl flex items-center gap-4">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by name or SKU..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-dark-900 text-white pl-12 pr-4 py-3 rounded-2xl border border-dark-700 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all placeholder:text-gray-600"
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

      {/* Products Table/Grid */}
      <div className="bg-dark-800 rounded-3xl border border-dark-700 shadow-xl overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-dark-900/50 border-b border-dark-700">
                <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Product</th>
                <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Category</th>
                <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Cost</th>
                <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Price</th>
                <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Stock</th>
                <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700/50">
              {filteredProducts.map(product => (
                <tr key={product._id} className="hover:bg-dark-700/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl overflow-hidden border border-dark-700 flex-shrink-0">
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="text-white font-bold">{product.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-dark-900 text-gray-400 text-xs font-bold rounded-lg border border-dark-700">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-400 font-bold">₱{(product.cost || 0).toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-white font-black">₱{product.price.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-1.5 bg-dark-900 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${product.stock < 10 ? 'bg-red-500' : 'bg-green-500'}`} 
                          style={{ width: `${Math.min(100, (product.stock / 50) * 100)}%` }}
                        />
                      </div>
                      <span className={`text-xs font-bold ${product.stock < 10 ? 'text-red-500' : 'text-gray-400'}`}>
                        {product.stock}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {product.status === 'active' ? (
                      <span className="flex items-center gap-1.5 text-green-500 text-xs font-black uppercase tracking-wider">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                        Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-red-500 text-xs font-black uppercase tracking-wider">
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                        Out of Stock
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleEditClick(product)}
                        className="p-2.5 bg-dark-900 text-gray-400 hover:text-accent hover:border-accent border border-dark-700 rounded-xl transition-all shadow-sm"
                      >
                        <PencilSquareIcon className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(product)}
                        className="p-2.5 bg-dark-900 text-gray-400 hover:text-red-500 hover:border-red-500 border border-dark-700 rounded-xl transition-all shadow-sm"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Footer (Placeholder) */}
        <div className="px-6 py-5 bg-dark-900/50 flex items-center justify-between border-t border-dark-700">
          <p className="text-sm text-gray-500">
            Showing <span className="text-white font-bold">1-6</span> of <span className="text-white font-bold">24</span> products
          </p>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-dark-800 text-gray-500 border border-dark-700 rounded-xl cursor-not-allowed">Previous</button>
            <button className="px-4 py-2 bg-dark-800 text-white border border-dark-700 rounded-xl hover:bg-dark-700 transition-all">Next</button>
          </div>
        </div>
      </div>

      {/* Edit Modal (Redesigned) */}
      {isEditModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-hidden">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-2xl" onClick={() => setIsEditModalOpen(false)} />
          <div className="relative w-full max-w-4xl bg-dark-800 rounded-[2.5rem] border border-dark-700 shadow-2xl overflow-hidden animate-modal-in flex flex-col max-h-[90vh]">
            
            {/* Header with Breadcrumbs */}
            <div className="p-8 border-b border-dark-700 bg-dark-800/50 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
                <button 
                  onClick={() => setIsEditModalOpen(false)}
                  className="hover:text-accent transition-colors flex items-center gap-1"
                >
                  <ArrowLeftIcon className="w-3 h-3" />
                  Product List
                </button>
                <ChevronRightIcon className="w-3 h-3" />
                <span className="text-white">Edit Product: {selectedProduct?.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-3xl font-black text-white tracking-tight">Edit Product Details</h3>
                  <p className="text-gray-400 text-sm mt-1">Update pricing, inventory, and product info</p>
                </div>
                <button onClick={() => setIsEditModalOpen(false)} className="p-3 bg-dark-900 rounded-2xl text-gray-500 hover:text-white transition-all border border-dark-700">
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
              <form onSubmit={handleSaveEdit} className="space-y-10">
                
                {/* Basic Information */}
                <section className="space-y-6">
                  <div className="flex items-center gap-3 text-accent mb-2">
                    <TagIcon className="w-6 h-6" />
                    <h4 className="text-lg font-bold text-white uppercase tracking-wider text-sm">Product Information</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-dark-900/50 p-8 rounded-3xl border border-dark-700/50">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Product Name</label>
                      <input
                        required
                        autoFocus
                        type="text"
                        value={editFormData.name}
                        onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                        className="w-full bg-dark-800/50 text-white font-bold px-5 py-3 rounded-2xl border border-dark-700/30 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
                        placeholder="e.g. Espresso"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Category</label>
                      <select
                        value={editFormData.category}
                        onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                        className="w-full bg-dark-800/50 text-white font-medium px-5 py-3 rounded-2xl border border-dark-700/30 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all appearance-none cursor-pointer"
                      >
                        {categories.filter(c => c !== "All").map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs font-black text-gray-500 uppercase tracking-widest">SKU (Stock Keeping Unit)</label>
                      <input
                        type="text"
                        value={editFormData.sku}
                        onChange={(e) => setEditFormData({ ...editFormData, sku: e.target.value })}
                        className="w-full bg-dark-800/50 text-white font-mono px-5 py-3 rounded-2xl border border-dark-700/30 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
                        placeholder="e.g. HOT-001"
                      />
                    </div>
                  </div>
                </section>

                {/* Pricing & Stock */}
                <section className="space-y-6">
                  <div className="flex items-center gap-3 text-accent mb-2">
                    <BanknotesIcon className="w-6 h-6" />
                    <h4 className="text-lg font-bold text-white uppercase tracking-wider text-sm">Pricing & Inventory</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-dark-900/50 p-8 rounded-3xl border border-dark-700/50">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Cost (₱)</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₱</span>
                        <input
                          required
                          type="number"
                          value={editFormData.cost}
                          onChange={(e) => setEditFormData({ ...editFormData, cost: Number(e.target.value) })}
                          className="w-full bg-dark-800/50 text-white font-bold pl-10 pr-5 py-3 rounded-2xl border border-dark-700/30 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Selling (₱)</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₱</span>
                        <input
                          required
                          type="number"
                          value={editFormData.price}
                          onChange={(e) => setEditFormData({ ...editFormData, price: Number(e.target.value) })}
                          className={`w-full bg-dark-800/50 text-white font-bold pl-10 pr-5 py-3 rounded-2xl border ${Number(editFormData.price) <= Number(editFormData.cost) ? 'border-red-500/50 focus:ring-red-500' : 'border-dark-700/30 focus:border-accent focus:ring-accent'} outline-none transition-all`}
                        />
                      </div>
                      {Number(editFormData.price) <= Number(editFormData.cost) && (
                        <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider animate-pulse">Price must be {">"} cost</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Stock Level</label>
                      <div className="relative">
                        <CubeIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                          required
                          type="number"
                          value={editFormData.stock}
                          onChange={(e) => setEditFormData({ ...editFormData, stock: Number(e.target.value) })}
                          className="w-full bg-dark-800/50 text-white font-bold pl-10 pr-5 py-3 rounded-2xl border border-dark-700/30 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </section>

                {/* Status Selection */}
                <section className="space-y-6">
                  <div className="flex items-center gap-3 text-accent mb-2">
                    <InformationCircleIcon className="w-6 h-6" />
                    <h4 className="text-lg font-bold text-white uppercase tracking-wider text-sm">Product Status</h4>
                  </div>
                  <div className="flex p-2 bg-dark-900/50 rounded-3xl border border-dark-700/50">
                    {[
                      { id: 'active', label: 'Active', icon: CheckCircleIcon, color: 'bg-green-500' },
                      { id: 'out_of_stock', label: 'Out of Stock', icon: ExclamationCircleIcon, color: 'bg-red-500' }
                    ].map(status => (
                      <button
                        key={status.id}
                        type="button"
                        onClick={() => setEditFormData({ ...editFormData, status: status.id })}
                        className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all duration-300 ${
                          editFormData.status === status.id 
                          ? `${status.color} text-white shadow-2xl scale-[1.02]` 
                          : "text-gray-500 hover:text-white hover:bg-dark-800"
                        }`}
                      >
                        <status.icon className="w-5 h-5" />
                        {status.label}
                      </button>
                    ))}
                  </div>
                </section>
              </form>
            </div>

            {/* Sticky Footer Buttons */}
            <div className="p-8 border-t border-dark-700 bg-dark-800/80 backdrop-blur-md flex gap-4">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="flex-1 py-4 rounded-2xl font-bold text-gray-400 bg-dark-900 border border-dark-700 hover:bg-dark-700 hover:text-white transition-all flex items-center justify-center gap-2"
              >
                <XMarkIcon className="w-5 h-5" />
                Discard
              </button>
              <button
                onClick={handleSaveEdit}
                type="submit"
                className="flex-[2] py-4 rounded-2xl font-black text-white bg-gradient-to-br from-accent via-orange-500 to-red-600 shadow-2xl shadow-accent/20 transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2"
              >
                <ShieldCheckIcon className="w-6 h-6" />
                Save Product Changes
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Modal */}
      {isDeleteModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-2xl" onClick={() => setIsDeleteModalOpen(false)} />
          <div className="relative w-full max-w-md bg-dark-800 rounded-[2.5rem] border border-dark-700 shadow-2xl overflow-hidden animate-modal-in">
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <ExclamationTriangleIcon className="w-10 h-10 text-red-500" />
              </div>
              <h3 className="text-2xl font-black text-white mb-2">Delete Product?</h3>
              <p className="text-gray-400 mb-8 px-4">
                Are you sure you want to delete <span className="text-white font-bold">"{selectedProduct?.name}"</span>? This action cannot be undone.
              </p>
              
              <div className="flex gap-4">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 py-4 rounded-2xl font-bold text-gray-400 bg-dark-900/50 hover:bg-dark-900 transition-all"
                >
                  No, Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="flex-1 py-4 rounded-2xl font-black text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/20 transition-all transform hover:-translate-y-1"
                >
                  Yes, Delete
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
