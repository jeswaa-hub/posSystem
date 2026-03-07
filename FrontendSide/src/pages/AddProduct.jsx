import { useState } from "react";
import { 
  PhotoIcon, 
  ArrowUpTrayIcon, 
  XMarkIcon, 
  BanknotesIcon,
  ArchiveBoxIcon,
  TagIcon,
  InformationCircleIcon
} from "@heroicons/react/24/outline";
import { useNotification } from "../contexts/NotificationContext";
import { useSettings } from "../contexts/SettingsContext";
import api from "../services/api";

export default function AddProduct() {
  const { showNotification } = useNotification();
  const { categories: dbCategories } = useSettings();
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    price: "",
    cost: "",
    description: "",
    status: "active",
    sku: ""
  });

  const categories = [...dbCategories.map(c => c.name), "Others"];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === "category") {
      // Generate Auto SKU
      const categoryCode = value.substring(0, 3).toUpperCase();
      const randomNum = Math.floor(100 + Math.random() * 900); // Simple random for now
      // In a real app, you'd fetch the latest count from DB, but this works for client-side suggestion
      // Let's just generate a random one, user can edit.
      const generatedSKU = `${categoryCode}-${randomNum}`;
      
      setFormData(prev => ({ ...prev, [name]: value, sku: generatedSKU }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setPreviewImage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Price Validation
    if (Number(formData.price) <= Number(formData.cost)) {
      showNotification("Selling price must be higher than the cost price", "warning");
      return;
    }

    setLoading(true);
    
    try {
      const payload = {
        ...formData,
        price: Number(formData.price),
        cost: Number(formData.cost),
        stock: 0, // Default to 0, managed in Inventory
        image: previewImage,
        type: 'product'
      };

      await api.post("/products", payload);
      
      showNotification(`${formData.name} has been added! Go to Inventory to set stock.`, "success");
      setFormData({
        name: "",
        category: "",
        price: "",
        cost: "",
        description: "",
        status: "active",
        sku: ""
      });
      setPreviewImage(null);
    } catch (err) {
      console.error("Failed to add product:", err);
      showNotification(err.response?.data?.message || "Failed to add product", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 pb-12 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">New Product</h2>
          <p className="text-gray-400 mt-1">Create a new item in your store inventory</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Product Details */}
        <div className="lg:col-span-2 space-y-8">
          {/* General Information */}
          <div className="bg-dark-800 rounded-3xl p-8 border border-dark-700 shadow-xl">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <InformationCircleIcon className="w-6 h-6 text-accent" />
              General Information
            </h3>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-400">Product Name</label>
                <input
                  required
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full bg-dark-900 text-white px-5 py-4 rounded-2xl border border-dark-700 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all placeholder:text-gray-600"
                  placeholder="e.g. Caramel Macchiato"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-400">Description</label>
                <textarea
                  rows={4}
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full bg-dark-900 text-white px-5 py-4 rounded-2xl border border-dark-700 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all placeholder:text-gray-600 resize-none"
                  placeholder="Describe your product features, taste, or ingredients..."
                />
              </div>
            </div>
          </div>

          {/* Pricing & Inventory */}
          <div className="bg-dark-800 rounded-3xl p-8 border border-dark-700 shadow-xl">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <BanknotesIcon className="w-6 h-6 text-accent" />
              Pricing & Inventory
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-400">Cost (₱)</label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₱</span>
                  <input
                    required
                    type="number"
                    name="cost"
                    value={formData.cost}
                    onChange={handleInputChange}
                    className="w-full bg-dark-900 text-white pl-10 pr-5 py-4 rounded-2xl border border-dark-700 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-400">Selling Price (₱)</label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₱</span>
                  <input
                    required
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    className="w-full bg-dark-900 text-white pl-10 pr-5 py-4 rounded-2xl border border-dark-700 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Stock field removed - Managed in Inventory */}

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-400">SKU (Stock Keeping Unit)</label>
                <div className="relative">
                  <InformationCircleIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="sku"
                    value={formData.sku}
                    onChange={handleInputChange}
                    className="w-full bg-dark-900 text-white pl-12 pr-5 py-4 rounded-2xl border border-dark-700 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all placeholder:text-gray-600"
                    placeholder="e.g. HOT-001"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-400">Category</label>
                <div className="relative">
                  <TagIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select
                    required
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full bg-dark-900 text-white pl-12 pr-5 py-4 rounded-2xl border border-dark-700 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value="" disabled>Select Category</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Media & Actions */}
        <div className="space-y-8">
          {/* Image Upload */}
          <div className="bg-dark-800 rounded-3xl p-8 border border-dark-700 shadow-xl">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <PhotoIcon className="w-6 h-6 text-accent" />
              Product Image
            </h3>
            
            <div className="relative">
              {previewImage ? (
                <div className="relative group rounded-2xl overflow-hidden border-2 border-accent/50 aspect-square">
                  <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button 
                      type="button"
                      onClick={removeImage}
                      className="bg-red-500 p-3 rounded-full text-white transform hover:scale-110 transition-transform"
                    >
                      <XMarkIcon className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center aspect-square rounded-2xl border-2 border-dashed border-dark-600 hover:border-accent hover:bg-accent/5 transition-all cursor-pointer group">
                  <div className="bg-dark-900 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform shadow-lg">
                    <ArrowUpTrayIcon className="w-8 h-8 text-accent" />
                  </div>
                  <span className="text-white font-bold">Upload Image</span>
                  <span className="text-xs text-gray-500 mt-2">Recommended: 800x800 PNG/JPG</span>
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                </label>
              )}
            </div>
          </div>

          {/* Status & Save */}
          <div className="bg-dark-800 rounded-3xl p-8 border border-dark-700 shadow-xl space-y-6">
            <div className="space-y-4">
              <label className="text-sm font-bold text-gray-400">Status</label>
              <div className="flex p-1.5 bg-dark-900 rounded-2xl border border-dark-700">
                {['active', 'draft'].map(status => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, status }))}
                    className={`flex-1 py-3.5 rounded-xl font-bold capitalize transition-all duration-300 ${
                      formData.status === status 
                      ? "bg-accent text-white shadow-lg shadow-accent/30 scale-[1.02]" 
                      : "text-gray-500 hover:text-gray-300"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            <button
              disabled={loading}
              type="submit"
              className={`w-full py-5 rounded-2xl font-black text-lg shadow-2xl transition-all duration-300 transform active:scale-95 flex items-center justify-center gap-3 mt-4 ${
                loading 
                ? "bg-gray-700 cursor-not-allowed" 
                : "bg-gradient-to-br from-accent via-orange-500 to-red-600 text-white hover:shadow-accent/40 hover:-translate-y-1 shadow-accent/20"
              }`}
            >
              {loading ? (
                <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                "Save Product"
              )}
            </button>

            <button
              type="button"
              className="w-full py-4 rounded-2xl font-bold text-gray-500 hover:text-white bg-dark-900/50 hover:bg-dark-900 border border-transparent hover:border-dark-700 transition-all duration-300"
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
