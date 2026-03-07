import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { 
  MagnifyingGlassIcon, 
  FunnelIcon,
  ArrowPathIcon,
  EyeIcon,
  BanknotesIcon,
  CreditCardIcon,
  QrCodeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  XMarkIcon,
  ReceiptPercentIcon,
  UserIcon,
  PrinterIcon
} from "@heroicons/react/24/outline";
import { useNotification } from "../contexts/NotificationContext";
import api from "../services/api";
import { useSocket } from "../contexts/SocketContext";
import { useReactToPrint } from "react-to-print";
import PrintableReceipt from "../components/PrintableReceipt";

const formatPeso = (amount) => {
  return `₱${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString("en-US", {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const StatusBadge = ({ status }) => {
  const styles = {
    completed: "bg-green-500/10 text-green-500 border-green-500/20",
    pending: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    cancelled: "bg-red-500/10 text-red-500 border-red-500/20",
    refunded: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  };

  const icons = {
    completed: CheckCircleIcon,
    pending: ClockIcon,
    cancelled: XCircleIcon,
    refunded: ArrowPathIcon,
  };

  const Icon = icons[status] || ClockIcon;

  return (
    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${styles[status] || styles.pending}`}>
      <Icon className="w-3.5 h-3.5" />
      {status}
    </span>
  );
};

const PaymentMethodIcon = ({ method }) => {
  switch (method) {
    case "cash": return <BanknotesIcon className="w-4 h-4" />;
    case "card": return <CreditCardIcon className="w-4 h-4" />;
    case "gcash": 
    case "paymaya": return <QrCodeIcon className="w-4 h-4" />;
    default: return <BanknotesIcon className="w-4 h-4" />;
  }
};

export default function Transactions() {
  const { showNotification } = useNotification();
  const socket = useSocket();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const componentRef = useRef(null);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Receipt-${selectedTransaction?.transactionId || 'txn'}`,
  });
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchTransactions = async () => {
    try {
      const res = await api.get("/transactions");
      setTransactions(res.data);
    } catch (err) {
      console.error("Failed to fetch transactions:", err);
      showNotification("Failed to load transactions", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // Real-time Updates
  useEffect(() => {
    if (!socket) return;

    const handleNewTransaction = (newTransaction) => {
      setTransactions(prev => {
        if (prev.find(t => t._id === newTransaction._id)) return prev;
        return [newTransaction, ...prev];
      });
    };

    const handleUpdatedTransaction = (updatedTransaction) => {
      setTransactions(prev => prev.map(t => t._id === updatedTransaction._id ? updatedTransaction : t));
    };

    const handleDeletedTransaction = (deletedId) => {
      setTransactions(prev => prev.filter(t => t._id !== deletedId));
    };

    socket.on("transaction_created", handleNewTransaction);
    socket.on("transaction_updated", handleUpdatedTransaction);
    socket.on("transaction_deleted", handleDeletedTransaction);

    return () => {
      socket.off("transaction_created", handleNewTransaction);
      socket.off("transaction_updated", handleUpdatedTransaction);
      socket.off("transaction_deleted", handleDeletedTransaction);
    };
  }, [socket]);

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await api.patch(`/transactions/${id}`, { status: newStatus });
      showNotification(`Transaction marked as ${newStatus}`, "success");
      // Manual optimistic update for immediate feedback
      setTransactions(prev => prev.map(t => t._id === id ? { ...t, status: newStatus } : t));
      if (selectedTransaction && selectedTransaction._id === id) {
        setSelectedTransaction(prev => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      console.error("Failed to update status:", err);
      showNotification("Failed to update transaction status", "error");
    }
  };

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = 
      t.transactionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.customer?.fullName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.cashier?.fullName || "").toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === "all" || t.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="p-2 space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">Transactions</h2>
          <p className="text-gray-400 mt-1">Monitor sales and order history</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={fetchTransactions}
            className="p-3 bg-dark-800 rounded-xl text-gray-400 hover:text-white border border-dark-700 hover:border-accent transition-all"
          >
            <ArrowPathIcon className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Header & Filter */}
      <div className="bg-dark-800 p-6 rounded-3xl border border-dark-700 shadow-xl flex items-center gap-4">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search Transaction ID, Customer, or Cashier..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-dark-900 text-white pl-12 pr-4 py-3 rounded-2xl border border-dark-700 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all placeholder:text-gray-600"
          />
        </div>
        
        <div className="relative group">
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`p-3.5 rounded-2xl border transition-all flex items-center justify-center cursor-pointer ${
              filterStatus !== 'all' 
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
                {["all", "completed", "pending", "cancelled", "refunded"].map(status => (
                  <button
                    key={status}
                    onClick={() => {
                      setFilterStatus(status);
                      setIsFilterOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 text-sm font-bold capitalize tracking-wider transition-colors ${
                      filterStatus === status
                        ? 'bg-accent/10 text-accent'
                        : 'text-gray-400 hover:bg-dark-800 hover:text-white'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-dark-800 rounded-3xl border border-dark-700 shadow-xl overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-dark-900/50 border-b border-dark-700">
                <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Transaction ID</th>
                <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Date & Time</th>
                <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Customer</th>
                <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Items</th>
                <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Total</th>
                <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Payment</th>
                <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700/50">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <ArrowPathIcon className="w-6 h-6 animate-spin text-accent" />
                      <span className="font-bold text-sm">Loading transactions...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                    <p className="font-bold">No transactions found</p>
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map(t => (
                  <tr key={t._id} className="hover:bg-dark-700/30 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="font-mono font-bold text-accent text-sm">{t.transactionId}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-white font-bold text-sm">{formatDate(t.createdAt).split(',')[0]}</span>
                        <span className="text-gray-500 text-xs">{formatDate(t.createdAt).split(',')[1]}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-white">
                        {t.customerName || t.customer?.fullName || "Walk-in Customer"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-400 text-sm font-bold">{t.items.length} items</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-white font-black text-sm">{formatPeso(t.totalAmount)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase">
                        <PaymentMethodIcon method={t.paymentMethod} />
                        {t.paymentMethod}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {t.status === 'pending' && (
                          <>
                            <button 
                              onClick={() => handleStatusUpdate(t._id, 'completed')}
                              className="p-2 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white transition-colors"
                              title="Mark as Completed"
                            >
                              <CheckCircleIcon className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={() => handleStatusUpdate(t._id, 'cancelled')}
                              className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                              title="Cancel Transaction"
                            >
                              <XCircleIcon className="w-5 h-5" />
                            </button>
                          </>
                        )}
                        <button 
                          onClick={() => setSelectedTransaction(t)}
                          className="p-2 rounded-lg hover:bg-dark-700 text-gray-500 hover:text-white transition-colors" 
                          title="View Details"
                        >
                          <EyeIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
                {/* Pagination Controls */}
        {!loading && filteredTransactions.length > 0 && (
          <div className="flex items-center justify-between p-4 border-t border-dark-700 bg-dark-800">
            <div className="text-sm text-gray-500 font-bold">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} of {filteredTransactions.length} entries
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors ${
                  currentPage === 1 
                    ? "text-gray-600 bg-dark-900 cursor-not-allowed" 
                    : "text-white bg-dark-700 hover:bg-accent hover:text-white"
                }`}
              >
                Previous
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let startPage = Math.max(1, currentPage - 2);
                  let endPage = Math.min(totalPages, startPage + 4);
                  
                  if (endPage - startPage < 4) {
                    startPage = Math.max(1, endPage - 4);
                  }
                  
                  const pageNum = startPage + i;
                  if (pageNum > totalPages) return null;

                  return (
                    <button
                      key={pageNum}
                      onClick={() => goToPage(pageNum)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                        currentPage === pageNum
                          ? "bg-accent text-white shadow-lg shadow-accent/20"
                          : "text-gray-500 hover:bg-dark-700 hover:text-white"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button 
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors ${
                  currentPage === totalPages 
                    ? "text-gray-600 bg-dark-900 cursor-not-allowed" 
                    : "text-white bg-dark-700 hover:bg-accent hover:text-white"
                }`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Transaction Details Modal */}
      {selectedTransaction && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-dark-900 w-full max-w-3xl rounded-[2rem] shadow-2xl border border-dark-700 flex flex-col max-h-[90vh] overflow-hidden animate-scale-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-dark-800 bg-dark-800/50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-accent/10 rounded-2xl">
                  <ReceiptPercentIcon className="w-8 h-8 text-accent" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white tracking-tight">Transaction Details</h3>
                  <div className="flex items-center gap-2 text-gray-400 text-sm font-bold">
                    <span>{selectedTransaction.transactionId}</span>
                    <span>•</span>
                    <span>{formatDate(selectedTransaction.createdAt)}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={handlePrint}
                  className="p-2 rounded-xl bg-dark-800 hover:bg-dark-700 text-gray-400 hover:text-white transition-colors border border-dark-700"
                  title="Print Receipt"
                >
                  <PrinterIcon className="w-6 h-6" />
                </button>
                <button 
                  onClick={() => setSelectedTransaction(null)}
                  className="p-2 rounded-xl hover:bg-dark-700 text-gray-400 hover:text-white transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Hidden Printable Receipt */}
            <div className="hidden">
              <PrintableReceipt 
                ref={componentRef} 
                transaction={selectedTransaction} 
              />
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
              {/* Status & Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-dark-800/50 p-4 rounded-2xl border border-dark-700/50">
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 font-bold uppercase text-xs tracking-wider">Current Status:</span>
                  <StatusBadge status={selectedTransaction.status} />
                </div>
                
                {selectedTransaction.status === 'pending' && (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleStatusUpdate(selectedTransaction._id, 'completed')}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white rounded-xl font-bold transition-all border border-green-500/20"
                    >
                      <CheckCircleIcon className="w-5 h-5" />
                      Complete Order
                    </button>
                    <button 
                      onClick={() => handleStatusUpdate(selectedTransaction._id, 'cancelled')}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl font-bold transition-all border border-red-500/20"
                    >
                      <XCircleIcon className="w-5 h-5" />
                      Cancel Order
                    </button>
                  </div>
                )}
              </div>

              {/* Order Items */}
              <div className="space-y-4">
                <h4 className="text-white font-bold text-lg">Order Items</h4>
                <div className="bg-dark-800 rounded-2xl border border-dark-700 overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-dark-900/50 border-b border-dark-700">
                      <tr>
                        <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest">Product</th>
                        <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest text-center">Qty</th>
                        <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest text-right">Price</th>
                        <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-700/50">
                      {selectedTransaction.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-dark-700/30">
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="text-white font-bold">{item.product?.name || "Unknown Product"}</span>
                              <span className="text-xs text-gray-500 font-mono">{item.product?.sku || "NO SKU"}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center font-bold text-gray-300">
                            {item.quantity}
                          </td>
                          <td className="px-6 py-4 text-right text-gray-400 font-mono text-sm">
                            {formatPeso(item.price)}
                          </td>
                          <td className="px-6 py-4 text-right font-black text-white font-mono text-sm">
                            {formatPeso(item.subtotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-dark-900/30 border-t border-dark-700">
                      <tr>
                        <td colSpan="3" className="px-6 py-4 text-right text-sm font-bold text-gray-400 uppercase tracking-wider">Subtotal</td>
                        <td className="px-6 py-4 text-right font-black text-white">{formatPeso(selectedTransaction.totalAmount)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Transaction Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-white font-bold text-lg">Payment Details</h4>
                  <div className="bg-dark-800 p-5 rounded-2xl border border-dark-700 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 font-medium text-sm">Payment Method</span>
                      <div className="flex items-center gap-2 text-white font-bold uppercase">
                        <PaymentMethodIcon method={selectedTransaction.paymentMethod} />
                        {selectedTransaction.paymentMethod}
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-dark-700/50">
                      <span className="text-gray-500 font-medium text-sm">Total Amount</span>
                      <span className="text-2xl font-black text-accent">{formatPeso(selectedTransaction.totalAmount)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-white font-bold text-lg">Customer & Cashier</h4>
                  <div className="bg-dark-800 p-5 rounded-2xl border border-dark-700 space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-dark-700 flex items-center justify-center text-gray-400">
                        <UserIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Customer</p>
                        <p className="text-white font-bold">{selectedTransaction.customerName || selectedTransaction.customer?.fullName || "Walk-in Customer"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 pt-4 border-t border-dark-700/50">
                      <div className="w-10 h-10 rounded-full bg-dark-700 flex items-center justify-center text-gray-400">
                        <UserIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Cashier</p>
                        <p className="text-white font-bold">{selectedTransaction.cashier?.fullName || "Unknown Cashier"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
