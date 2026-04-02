import { useState, useEffect, useRef } from "react";
import { 
  PhotoIcon, 
  ArrowUpTrayIcon, 
  XMarkIcon, 
  BanknotesIcon, 
  ArchiveBoxIcon, 
  TagIcon, 
  InformationCircleIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ChevronRightIcon,
  ArrowLeftIcon,
  CurrencyDollarIcon,
  CubeIcon,
  TruckIcon,
  DocumentTextIcon
} from "@heroicons/react/24/outline";
import { useNotification } from "../contexts/NotificationContext";
import { useSettings } from "../contexts/SettingsContext";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function AddProduct() {
  const { showNotification } = useNotification();
  const { categories: dbCategories } = useSettings();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [activeSection, setActiveSection] = useState("basic");
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);

  // Fetch products to calculate next SKU
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.get("products");
        setProducts(response.data);
      } catch (err) {
        console.error("Failed to fetch products for SKU generation:", err);
      }
    };
    fetchProducts();
  }, []);

  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem("draft_product");
    return saved ? JSON.parse(saved) : {
      name: "",
      category: "",
      price: "",
      cost: "",
      description: "",
      status: "active",
      sku: ""
    };
  });

  // Dynamic title based on active section
  useEffect(() => {
    const handleScroll = () => {
      const sectionIds = sections.map(s => s.id);
      for (const id of sectionIds.reverse()) {
        const element = document.getElementById(id);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 200) {
            setActiveSection(id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-save to localStorage
  useEffect(() => {
    const timeout = setTimeout(() => {
      localStorage.setItem("draft_product", JSON.stringify(formData));
    }, 1000);
    return () => clearTimeout(timeout);
  }, [formData]);

  const categories = [...dbCategories.map(c => c.name), "Others"];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Auto SKU Generation Logic
    if (name === "category" && value) {
      const prefix = value.substring(0, 3).toUpperCase();
      const categoryProducts = products.filter(p => p.category === value);
      
      // Find the highest current number for this prefix
      let maxNum = 0;
      categoryProducts.forEach(p => {
        if (p.sku && p.sku.startsWith(`${prefix}-`)) {
          const numPart = parseInt(p.sku.split('-')[1]);
          if (!isNaN(numPart) && numPart > maxNum) maxNum = numPart;
        }
      });
      
      const nextNum = (maxNum + 1).toString().padStart(3, '0');
      const generatedSku = `${prefix}-${nextNum}`;
      
      setFormData(prev => ({ 
        ...prev, 
        [name]: value,
        sku: generatedSku 
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = "Product name is required";
    if (!formData.category) newErrors.category = "Category is required";
    if (!formData.price || formData.price <= 0) newErrors.price = "Valid price is required";
    if (!formData.cost || formData.cost < 0) newErrors.cost = "Valid cost is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showNotification("Image size should be less than 2MB", "error");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
        setFormData(prev => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
        setFormData(prev => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setPreviewImage(null);
    setFormData(prev => ({ ...prev, image: null }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      showNotification("Please fix the errors before saving", "error");
      return;
    }

    setLoading(true);
    try {
      await api.post("products", formData);
      showNotification("Product created successfully!", "success");
      localStorage.removeItem("draft_product");
      navigate("/products/all");
    } catch (err) {
      console.error("Failed to create product:", err);
      showNotification(err.response?.data?.message || "Failed to create product", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (window.confirm("Are you sure you want to clear all fields? This will delete your draft.")) {
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
      localStorage.removeItem("draft_product");
      showNotification("Form cleared", "info");
    }
  };

  const sections = [
    { id: "basic", label: "Basic Info", icon: DocumentTextIcon },
    { id: "pricing", label: "Pricing", icon: BanknotesIcon },
    { id: "media", label: "Media", icon: PhotoIcon },
  ];

  return (
    <div className="max-w-7xl mx-auto p-4 pb-20 animate-fade-in font-sans">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-3xl font-black text-white tracking-tight uppercase">
              {sections.find(s => s.id === activeSection)?.label || "Add New Product"}
            </h2>
            <div className="flex items-center gap-2 mt-1">
               <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
               <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Auto-saving to draft...</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
           <button
             type="button"
             onClick={handleReset}
             className="px-6 py-4 rounded-2xl font-bold text-gray-500 hover:text-red-400 hover:bg-red-400/5 transition-all flex items-center gap-2"
           >
             <ArrowPathIcon className="w-5 h-5" />
             <span>Reset Form</span>
           </button>
           <button
             onClick={handleSubmit}
             disabled={loading}
             className={`px-8 py-4 rounded-2xl font-black text-white shadow-2xl transition-all flex items-center gap-3 ${
               loading ? "bg-gray-700 cursor-not-allowed" : "bg-accent hover:bg-orange-600 shadow-accent/20 hover:-translate-y-1 active:scale-95"
             }`}
           >
             {loading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <CheckCircleIcon className="w-6 h-6" />}
             <span>{loading ? "Creating..." : "Publish Product"}</span>
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-3 sticky top-28 space-y-2">
          {sections.map(section => (
            <button
              key={section.id}
              onClick={() => {
                setActiveSection(section.id);
                document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }}
              className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl transition-all duration-300 group ${
                activeSection === section.id 
                ? "bg-accent text-white shadow-xl shadow-accent/20 translate-x-2" 
                : "text-gray-500 hover:bg-dark-800 hover:text-gray-300"
              }`}
            >
              <div className="flex items-center gap-4">
                <section.icon className={`w-5 h-5 ${activeSection === section.id ? "text-white" : "text-gray-600 group-hover:text-accent"}`} />
                <span className="font-bold text-sm tracking-wide">{section.label}</span>
              </div>
              <ChevronRightIcon className={`w-4 h-4 transition-transform ${activeSection === section.id ? "opacity-100" : "opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"}`} />
            </button>
          ))}
        </div>

          {/* Form Content */}
        <div className="lg:col-span-9 space-y-8">
          {/* Basic Information Section */}
          <div id="basic" className="bg-dark-800 rounded-[2.5rem] p-10 border border-white/[0.05] shadow-2xl transition-all hover:border-accent/10 group">
            <div className="flex items-center justify-between mb-8">
               <h3 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                 <div className="p-2 bg-accent/10 rounded-xl">
                   <DocumentTextIcon className="w-6 h-6 text-accent" />
                 </div>
                 Basic Information
               </h3>
               <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest bg-dark-900 px-3 py-1 rounded-lg">Section 01</span>
            </div>
            
            <div className="grid grid-cols-1 gap-8">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Product Name</label>
                  {errors.name && <span className="text-[10px] font-bold text-red-500 animate-pulse uppercase tracking-tighter flex items-center gap-1"><ExclamationCircleIcon className="w-3 h-3" /> {errors.name}</span>}
                </div>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full bg-dark-950/50 text-white px-6 py-5 rounded-[1.5rem] border transition-all duration-500 outline-none placeholder:text-gray-700 font-bold text-lg ${
                    errors.name ? "border-red-500/50 focus:border-red-500" : "border-white/[0.05] focus:border-accent focus:ring-1 focus:ring-accent/20"
                  }`}
                  placeholder="What's the product called?"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Product Description</label>
                  <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest bg-dark-900 px-2 py-0.5 rounded-md">{formData.description.length}/500</span>
                </div>
                <div className="relative group/text">
                  <textarea
                    rows={5}
                    name="description"
                    maxLength={500}
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full bg-dark-950/50 text-white px-6 py-5 rounded-[1.5rem] border border-white/[0.05] focus:border-accent focus:ring-1 focus:ring-accent/20 outline-none transition-all placeholder:text-gray-700 resize-none font-medium leading-relaxed"
                    placeholder="Provide a detailed description of your product..."
                  />
                  {/* Tooltip Example */}
                  <div className="absolute top-4 right-4 group-hover/text:opacity-100 opacity-0 transition-opacity cursor-help">
                    <div className="relative group/tooltip">
                      <InformationCircleIcon className="w-5 h-5 text-gray-600 hover:text-accent transition-colors" />
                      <div className="absolute right-0 bottom-full mb-2 w-48 p-2 bg-dark-950 text-white text-[10px] rounded-xl opacity-0 group-hover/tooltip:opacity-100 transition-all pointer-events-none z-50 shadow-2xl border border-white/5 font-bold">
                        A good description helps customers understand your product better.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-3">
                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Category</label>
                    <div className="relative">
                      <TagIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className={`w-full bg-dark-950/50 text-white pl-14 pr-6 py-5 rounded-[1.5rem] border transition-all duration-500 outline-none appearance-none cursor-pointer font-bold [&>option]:text-black ${
                          errors.category ? "border-red-500/50" : "border-white/[0.05] focus:border-accent"
                        }`}
                      >
                        <option value="" disabled className="text-black">Choose a Category</option>
                        {categories.map(cat => (
                          <option key={cat} value={cat} className="text-black">{cat}</option>
                        ))}
                      </select>
                      <ChevronRightIcon className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 rotate-90 pointer-events-none" />
                    </div>
                 </div>
                 <div className="space-y-3">
                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">SKU (Stock Keeping Unit)</label>
                    <div className="relative">
                      <ArchiveBoxIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
                      <input
                        type="text"
                        name="sku"
                        value={formData.sku}
                        onChange={handleInputChange}
                        className="w-full bg-dark-950/50 text-white pl-14 pr-6 py-5 rounded-[1.5rem] border border-white/[0.05] focus:border-accent outline-none transition-all font-mono font-bold"
                        placeholder="e.g. BEV-001"
                      />
                    </div>
                 </div>
              </div>
            </div>
          </div>

          {/* Pricing Section */}
          <div id="pricing" className="bg-dark-800 rounded-[2.5rem] p-10 border border-white/[0.05] shadow-2xl transition-all hover:border-accent/10 group">
            <div className="flex items-center justify-between mb-8">
               <h3 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                 <div className="p-2 bg-accent/10 rounded-xl">
                   <BanknotesIcon className="w-6 h-6 text-accent" />
                 </div>
                 Pricing Details
               </h3>
               <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest bg-dark-900 px-3 py-1 rounded-lg">Section 02</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Cost Price</label>
                  {errors.cost && <span className="text-[10px] font-bold text-red-500 uppercase tracking-tighter">{errors.cost}</span>}
                </div>
                <div className="relative group/price">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 font-black text-lg group-focus-within/price:text-accent transition-colors">₱</span>
                  <input
                    type="number"
                    name="cost"
                    value={formData.cost}
                    onChange={handleInputChange}
                    className={`w-full bg-dark-950/50 text-white pl-12 pr-6 py-5 rounded-[1.5rem] border transition-all duration-500 outline-none font-black text-2xl tracking-tighter ${
                      errors.cost ? "border-red-500/50" : "border-white/[0.05] focus:border-accent"
                    }`}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Selling Price</label>
                  {errors.price && <span className="text-[10px] font-bold text-red-500 uppercase tracking-tighter">{errors.price}</span>}
                </div>
                <div className="relative group/price">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 font-black text-lg group-focus-within/price:text-accent transition-colors">₱</span>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    className={`w-full bg-dark-950/50 text-white pl-12 pr-6 py-5 rounded-[1.5rem] border transition-all duration-500 outline-none font-black text-2xl tracking-tighter ${
                      errors.price ? "border-red-500/50" : "border-white/[0.05] focus:border-accent"
                    }`}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Inventory Section - REMOVED */}

          {/* Media Section */}
          <div id="media" className="bg-dark-800 rounded-[2.5rem] p-10 border border-white/[0.05] shadow-2xl transition-all hover:border-accent/10 group">
            <div className="flex items-center justify-between mb-8">
               <h3 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                 <div className="p-2 bg-accent/10 rounded-xl">
                   <PhotoIcon className="w-6 h-6 text-accent" />
                 </div>
                 Product Media
               </h3>
               <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest bg-dark-900 px-3 py-1 rounded-lg">Section 03</span>
            </div>
            
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative rounded-[2rem] border-2 border-dashed transition-all duration-500 group/drop ${
                isDragging ? "border-accent bg-accent/10 scale-[0.98]" : "border-white/10 hover:border-accent/30 hover:bg-white/[0.02]"
              }`}
            >
              {previewImage ? (
                <div className="p-4 relative">
                  <div className="relative aspect-video w-full rounded-[1.5rem] overflow-hidden shadow-2xl group/preview">
                    <img src={previewImage} alt="Preview" className="w-full h-full object-cover transition-transform duration-1000 group-hover/preview:scale-110" />
                    <div className="absolute inset-0 bg-dark-950/60 opacity-0 group-hover/preview:opacity-100 transition-all flex items-center justify-center backdrop-blur-sm">
                      <button 
                        type="button"
                        onClick={removeImage}
                        className="bg-red-500 hover:bg-red-600 p-4 rounded-full text-white transform hover:scale-110 active:scale-95 transition-all shadow-2xl flex items-center gap-2"
                      >
                        <XMarkIcon className="w-6 h-6" />
                        <span className="font-bold text-sm">Remove Image</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center py-20 cursor-pointer">
                  <div className="w-20 h-20 bg-dark-950/50 rounded-[2rem] flex items-center justify-center mb-6 border border-white/5 group-hover/drop:scale-110 transition-transform shadow-2xl">
                    <ArrowUpTrayIcon className="w-10 h-10 text-accent" />
                  </div>
                  <h4 className="text-xl font-black text-white uppercase tracking-tighter mb-2">Drag & Drop Image</h4>
                  <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">or click to browse files</p>
                  <p className="text-gray-600 text-[10px] font-bold mt-4 uppercase tracking-[0.2em]">Max size: 2MB | PNG, JPG, WEBP</p>
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleImageChange} 
                  />
                </label>
              )}
            </div>
          </div>

          {/* Shipping Section - REMOVED */}

          {/* Form Actions (Bottom Fixed for Mobile) */}
          <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 pb-10 sm:pb-0">
             <button
               onClick={handleReset}
               className="w-full sm:w-auto px-10 py-5 rounded-[1.5rem] font-bold text-gray-500 hover:text-white bg-dark-800 border border-white/5 hover:bg-dark-700 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
             >
               <ArrowPathIcon className="w-5 h-5" />
               Reset All Fields
             </button>
             <button
               onClick={handleSubmit}
               disabled={loading}
               className={`w-full sm:flex-1 py-5 rounded-[1.5rem] font-black text-white shadow-2xl transition-all flex items-center justify-center gap-4 uppercase tracking-[0.2em] ${
                 loading ? "bg-gray-700 cursor-not-allowed" : "bg-accent hover:bg-orange-600 shadow-accent/40 hover:-translate-y-1 active:scale-95"
               }`}
             >
               {loading ? (
                 <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin" />
               ) : (
                 <>
                   <CheckCircleIcon className="w-6 h-6" />
                   <span>Create Product Now</span>
                 </>
               )}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
