import { Fragment, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Dialog, Transition, Disclosure } from '@headlessui/react'
import { 
  XMarkIcon, 
  ChevronUpIcon, 
  PhotoIcon,
  TagIcon,
  CurrencyDollarIcon,
  CubeIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  PencilSquareIcon
} from '@heroicons/react/24/outline'

export default function EditProductModal({ isOpen, onClose, product, onSave, categories = [] }) {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    cost: '',
    stock: '',
    sku: '',
    status: 'active',
    description: '',
    image: ''
  })
  
  const [isDirty, setIsDirty] = useState(false)
  const [isValid, setIsValid] = useState(true)
  const [errors, setErrors] = useState({})

  // Image Upload Logic
  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result }))
      }
      reader.readAsDataURL(file)
    }
  }

  // Init form
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        category: product.category || '',
        price: product.price || 0,
        cost: product.cost || 0,
        stock: product.stock || 0,
        sku: product.sku || '',
        status: product.status || 'active',
        description: product.description || '',
        image: product.image || ''
      })
      setIsDirty(false)
    }
  }, [product])

  // Validation & Dirty check
  useEffect(() => {
    if (!product) return
    
    const newErrors = {}
    if (!formData.name) newErrors.name = "Name is required"
    if (Number(formData.price) < 0) newErrors.price = "Price cannot be negative"
    if (Number(formData.cost) < 0) newErrors.cost = "Cost cannot be negative"
    if (Number(formData.price) < Number(formData.cost)) newErrors.margin = "Price is lower than cost"
    
    setErrors(newErrors)
    setIsValid(Object.keys(newErrors).length === 0)
    
    // Check if changed
    const hasChanged = JSON.stringify(formData) !== JSON.stringify({
        name: product.name || '',
        category: product.category || '',
        price: product.price || 0,
        cost: product.cost || 0,
        stock: product.stock || 0,
        sku: product.sku || '',
        status: product.status || 'active',
        description: product.description || '',
        image: product.image || ''
    })
    setIsDirty(hasChanged)
  }, [formData, product])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = () => {
    if (isValid) {
      onSave({ ...product, ...formData })
    }
  }

  const modalContent = (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[99999]" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-6xl transform overflow-hidden rounded-3xl bg-dark-900 text-left align-middle shadow-2xl transition-all border border-dark-700 flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-dark-700 bg-dark-800">
                  <div>
                    <Dialog.Title as="h3" className="text-2xl font-black text-white tracking-tight">
                      Edit Product Details
                    </Dialog.Title>
                    <p className="text-gray-400 text-sm mt-1">
                        Update pricing, inventory, and product info
                        {isDirty && <span className="ml-3 text-accent text-xs font-bold uppercase tracking-wider animate-pulse">• Unsaved Changes</span>}
                    </p>
                  </div>
                  <button onClick={onClose} className="p-2 rounded-xl hover:bg-dark-700 text-gray-400 hover:text-white transition-colors">
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                {/* Body - 2 Columns */}
                <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
                    
                    {/* Left: Live Preview (Sticky) */}
                    <div className="w-full lg:w-1/3 bg-dark-900 p-8 border-r border-dark-700 overflow-y-auto custom-scrollbar flex flex-col items-center">
                        <h4 className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-6 w-full text-left flex items-center gap-2">
                            <CubeIcon className="w-4 h-4" /> Live Preview
                        </h4>
                        
                        {/* Preview Card */}
                        <div className="w-full max-w-sm bg-dark-800 rounded-3xl border border-dark-700 shadow-2xl overflow-hidden group relative flex flex-col">
                            <div className="aspect-square w-full bg-dark-700 relative overflow-hidden flex-shrink-0">
                                {formData.image ? (
                                    <div className="w-full h-full relative overflow-hidden">
                                        <img 
                                            src={formData.image} 
                                            alt="Preview" 
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                                        />
                                        {/* Edit Overlay */}
                                        <div 
                                            onClick={() => document.getElementById('image-upload').click()}
                                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer backdrop-blur-[2px]"
                                        >
                                            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/30 shadow-xl mb-2">
                                                <PencilSquareIcon className="w-6 h-6 text-white" />
                                            </div>
                                            <span className="text-white text-xs font-black uppercase tracking-widest">Change Image</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div 
                                        onClick={() => document.getElementById('image-upload').click()}
                                        className="flex flex-col items-center justify-center h-full text-gray-600 cursor-pointer hover:bg-dark-600 transition-colors group"
                                    >
                                        <div className="w-16 h-16 bg-dark-800 rounded-3xl flex items-center justify-center border-2 border-dashed border-gray-700 mb-4 group-hover:border-accent transition-colors">
                                            <PhotoIcon className="w-8 h-8 group-hover:text-accent transition-colors" />
                                        </div>
                                        <span className="text-xs font-bold uppercase tracking-widest">Upload Image</span>
                                    </div>
                                )}
                                
                                {/* Hidden Input */}
                                <input 
                                    id="image-upload"
                                    type="file" 
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="hidden"
                                />

                                <div className="absolute top-4 right-4 z-10">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-2xl border ${
                                        formData.status === 'active' 
                                            ? 'bg-green-500 text-white border-green-400' 
                                            : formData.status === 'out_of_stock'
                                                ? 'bg-red-500 text-white border-red-400'
                                                : 'bg-amber-500 text-white border-amber-400'
                                    }`}>
                                        {formData.status?.replace('_', ' ')}
                                    </span>
                                </div>
                            </div>
                            <div className="p-6 bg-dark-800 relative z-20">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-accent text-xs font-bold uppercase tracking-wider border border-accent/20 bg-accent/10 px-2 py-1 rounded-lg">
                                        {formData.category || 'Uncategorized'}
                                    </span>
                                    <span className="text-gray-500 text-xs font-mono">{formData.sku}</span>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2 line-clamp-2 leading-tight">
                                    {formData.name || 'Product Name'}
                                </h3>
                                <p className="text-gray-400 text-sm mb-4 line-clamp-3 min-h-[3em]">
                                    {formData.description || 'No description provided.'}
                                </p>
                                <div className="flex justify-between items-end border-t border-dark-700 pt-4">
                                    <div>
                                        <p className="text-gray-500 text-xs font-bold uppercase">Price</p>
                                        <p className="text-2xl font-black text-white">₱{Number(formData.price).toLocaleString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-gray-500 text-xs font-bold uppercase">Stock</p>
                                        <p className={`text-lg font-bold ${Number(formData.stock) < 10 ? 'text-red-500' : 'text-green-500'}`}>
                                            {formData.stock} units
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Validation Summary */}
                        {!isValid && (
                            <div className="mt-8 w-full bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                                <h5 className="text-red-500 text-sm font-bold flex items-center gap-2 mb-2">
                                    <ExclamationCircleIcon className="w-5 h-5" /> Attention Needed
                                </h5>
                                <ul className="list-disc list-inside text-red-400 text-xs space-y-1">
                                    {Object.values(errors).map((err, i) => <li key={i}>{err}</li>)}
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Right: Form Sections */}
                    <div className="w-full lg:w-2/3 bg-dark-800 overflow-y-auto custom-scrollbar p-8 space-y-4">
                        
                        {/* Basic Info Section */}
                        <Disclosure defaultOpen>
                            {({ open }) => (
                                <div className={`border ${open ? 'border-accent/50 bg-dark-900/50' : 'border-dark-700 bg-dark-900'} rounded-2xl transition-all`}>
                                    <Disclosure.Button className="flex w-full justify-between items-center px-6 py-4 text-left">
                                        <div className="flex items-center gap-3">
                                            <TagIcon className={`w-5 h-5 ${open ? 'text-accent' : 'text-gray-400'}`} />
                                            <span className={`font-bold ${open ? 'text-white' : 'text-gray-400'}`}>Basic Information</span>
                                        </div>
                                        <ChevronUpIcon className={`${open ? '' : 'rotate-180'} h-5 w-5 text-gray-500 transition-transform`} />
                                    </Disclosure.Button>
                                    <Disclosure.Panel className="px-6 pb-6 pt-2 space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-400 uppercase">Product Name</label>
                                                <input 
                                                    name="name" 
                                                    value={formData.name} 
                                                    onChange={handleChange}
                                                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-3 text-white focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
                                                    placeholder="e.g. Caramel Macchiato"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-400 uppercase">Category</label>
                                                <select 
                                                    name="category" 
                                                    value={formData.category} 
                                                    onChange={handleChange}
                                                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-3 text-white focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all appearance-none"
                                                >
                                                    <option value="" disabled>Select Category</option>
                                                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-400 uppercase">Product Status</label>
                                                <select 
                                                    name="status" 
                                                    value={formData.status} 
                                                    onChange={handleChange}
                                                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-3 text-white focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all appearance-none"
                                                >
                                                  <option value="active">Active</option>
                                                  <option value="out_of_stock">Out of Stock</option>
                                                  <option value="draft">Draft</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-400 uppercase">Description</label>
                                            <textarea 
                                                name="description" 
                                                value={formData.description} 
                                                onChange={handleChange}
                                                rows={3}
                                                className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-3 text-white focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all resize-none"
                                                placeholder="Describe the product..."
                                            />
                                            <div className="text-right text-xs text-gray-600">{formData.description.length}/500</div>
                                        </div>
                                    </Disclosure.Panel>
                                </div>
                            )}
                        </Disclosure>

                        {/* Pricing & Inventory */}
                        <Disclosure defaultOpen>
                            {({ open }) => (
                                <div className={`border ${open ? 'border-accent/50 bg-dark-900/50' : 'border-dark-700 bg-dark-900'} rounded-2xl transition-all`}>
                                    <Disclosure.Button className="flex w-full justify-between items-center px-6 py-4 text-left">
                                        <div className="flex items-center gap-3">
                                            <CurrencyDollarIcon className={`w-5 h-5 ${open ? 'text-accent' : 'text-gray-400'}`} />
                                            <span className={`font-bold ${open ? 'text-white' : 'text-gray-400'}`}>Pricing & Inventory</span>
                                        </div>
                                        <ChevronUpIcon className={`${open ? '' : 'rotate-180'} h-5 w-5 text-gray-500 transition-transform`} />
                                    </Disclosure.Button>
                                    <Disclosure.Panel className="px-6 pb-6 pt-2 space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-400 uppercase">Selling Price (₱)</label>
                                                <input 
                                                    name="price" 
                                                    type="number"
                                                    value={formData.price} 
                                                    onChange={handleChange}
                                                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-3 text-white focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all font-mono"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-400 uppercase">Cost Price (₱)</label>
                                                <input 
                                                    name="cost" 
                                                    type="number"
                                                    value={formData.cost} 
                                                    onChange={handleChange}
                                                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-3 text-white focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all font-mono"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-400 uppercase">Stock Level</label>
                                                <input 
                                                    name="stock" 
                                                    type="number"
                                                    value={formData.stock} 
                                                    onChange={handleChange}
                                                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-3 text-white focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all font-mono"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-400 uppercase">SKU</label>
                                                <input 
                                                    name="sku" 
                                                    value={formData.sku} 
                                                    onChange={handleChange}
                                                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-3 text-white focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all font-mono uppercase"
                                                />
                                            </div>
                                        </div>
                                    </Disclosure.Panel>
                                </div>
                            )}
                        </Disclosure>

                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-dark-700 bg-dark-800 flex justify-end items-center">
                    <button 
                        onClick={handleSubmit}
                        disabled={!isValid || !isDirty}
                        className={`px-8 py-3 rounded-xl font-bold text-white shadow-lg transition-all transform active:scale-95 flex items-center gap-2 ${
                            !isValid || !isDirty 
                                ? 'bg-gray-600 cursor-not-allowed opacity-50' 
                                : 'bg-gradient-to-r from-accent to-orange-600 hover:shadow-accent/30'
                        }`}
                    >
                        <CheckCircleIcon className="w-5 h-5" />
                        Publish Changes
                    </button>
                </div>

              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );

  return createPortal(modalContent, document.body);
}

