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
import TableSkeleton from "../components/skeletons/TableSkeleton";
import EditProductModal from "../components/modals/EditProductModal";

export default function Products() {
  const navigate = useNavigate();
  const socket = useSocket();
  const { showNotification } = useNotification();
  const { categories: dbCategories } = useSettings();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch products from API
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get("products");
      setProducts(res.data);
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
      setProducts(prev => {
        if (prev.find(p => p._id === newProduct._id)) return prev;
        return [...prev, newProduct];
      });
    });

    socket.on("product_updated", (updatedProduct) => {
      setProducts(prev => prev.map(p => p._id === updatedProduct._id ? updatedProduct : p));
      
      // Conflict detection: If this product is currently being edited
      if (isEditModalOpen && selectedProduct?._id === updatedProduct._id) {
        showNotification("This product was updated by another user.", "warning");
        // Optionally update the selected product or just let the user know
      }
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
    setIsEditModalOpen(true);
  };

  // Handle Delete Click
  const handleDeleteClick = (product) => {
    setSelectedProduct(product);
    setIsDeleteModalOpen(true);
  };

  // Save Edit
  const handleSaveEdit = async (updatedProduct) => {
    const backup = [...products];
    try {
      // Optimistic update
      setProducts(prev => prev.map(p => p._id === updatedProduct._id ? updatedProduct : p));
      setIsEditModalOpen(false);
      
      await api.patch(`/products/${updatedProduct._id}`, updatedProduct);
      showNotification("Product updated successfully", "success");
    } catch (err) {
      console.error("Failed to update product:", err);
      // Rollback
      setProducts(backup);
      showNotification("Failed to update product", "error");
    }
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    const backup = [...products];
    try {
      // Optimistic update
      setProducts(prev => prev.filter(p => p._id !== selectedProduct._id));
      setIsDeleteModalOpen(false);
      
      await api.delete(`/products/${selectedProduct._id}`);
      showNotification("Product deleted successfully", "success");
    } catch (err) {
      console.error("Failed to delete product:", err);
      // Rollback
      setProducts(backup);
      showNotification("Failed to delete product", "error");
    }
  };

  if (loading) return <TableSkeleton headers={7} rows={8} />;

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
      <div className="bg-dark-800 p-6 rounded-3xl border border-dark-700 shadow-xl flex flex-col md:flex-row gap-4 md:items-center">
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
                  <td className="px-6 py-4 text-xs font-black uppercase tracking-wider">
                    {product.status === 'active' ? (
                      <span className="flex items-center gap-1.5 text-green-500">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                        Active
                      </span>
                    ) : product.status === 'out_of_stock' ? (
                      <span className="flex items-center gap-1.5 text-red-500">
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                        Out of Stock
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-amber-500">
                        <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                        Draft
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
      <EditProductModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        product={selectedProduct}
        onSave={handleSaveEdit}
        categories={dbCategories.map(c => c.name)}
      />

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
