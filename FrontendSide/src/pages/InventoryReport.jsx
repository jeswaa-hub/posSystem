import { useState, useEffect, useRef } from "react";
import { 
  BanknotesIcon, 
  CubeIcon, 
  ExclamationTriangleIcon,
  ArrowPathIcon,
  PrinterIcon
} from "@heroicons/react/24/outline";
import api from "../services/api";
import PrintableReport from "../components/PrintableReport";
import { useAuth } from "../contexts/AuthContext";
import { useReactToPrint } from "react-to-print";
import { useSocket } from "../contexts/SocketContext";

export default function InventoryReport() {
  const { user } = useAuth();
  const socket = useSocket();
  const [data, setData] = useState({ totalValue: 0, totalItems: 0, lowStockCount: 0, lowStockItems: [], items: [] });
  const [loading, setLoading] = useState(true);
  const componentRef = useRef(null);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Inventory Report - ${new Date().toLocaleDateString()}`,
  });

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await api.get("/reports/inventory");
      // Fetch full inventory for print table
      const fullInv = await api.get("/inventory");
      setData({ ...res.data, items: fullInv.data });
    } catch (err) {
      console.error("Failed to fetch inventory report", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  // Real-time updates
  useEffect(() => {
    if (!socket) return;
    const handler = () => fetchReport();
    // Listen for any inventory changes
    socket.on("inventory_updated", handler);
    socket.on("inventory_created", handler);
    socket.on("inventory_deleted", handler);
    socket.on("product_updated", handler);
    
    return () => {
      socket.off("inventory_updated", handler);
      socket.off("inventory_created", handler);
      socket.off("inventory_deleted", handler);
      socket.off("product_updated", handler);
    };
  }, [socket]);

  const formatCurrency = (val) => `₱${Number(val).toLocaleString()}`;

  return (
    <div className="p-2 space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">Inventory Report</h2>
          <p className="text-gray-400 mt-1">Stock valuation and health check</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={fetchReport} 
            className="p-2 bg-dark-800 rounded-xl hover:bg-dark-700 text-gray-400 hover:text-white transition-colors border border-dark-700"
            title="Refresh Data"
          >
            <ArrowPathIcon className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button 
            onClick={handlePrint} 
            className="p-2 bg-dark-800 rounded-xl hover:bg-dark-700 text-gray-400 hover:text-white transition-colors border border-dark-700"
            title="Print Report"
          >
            <PrinterIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="hidden">
        <PrintableReport
          ref={componentRef}
          title="Inventory Report"
          subtitle="Full Stock Status"
          date={new Date().toLocaleString()}
          preparedBy={user?.fullName || "Admin"}
          type="inventory"
          data={data}
        />
      </div>

      <div className="space-y-6 p-4 bg-dark-900">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:grid-cols-3 print:gap-4">
          <div className="bg-dark-800 print:bg-white print:border-gray-300 p-6 rounded-3xl border border-dark-700 shadow-xl flex items-center gap-4">
            <div className="p-4 bg-purple-500/10 print:bg-gray-100 rounded-2xl text-purple-500 print:text-black">
              <BanknotesIcon className="w-8 h-8" />
            </div>
            <div>
              <p className="text-gray-400 print:text-gray-600 text-sm font-bold uppercase tracking-wider">Total Stock Value</p>
              <h3 className="text-3xl font-black text-white print:text-black">{formatCurrency(data.totalValue)}</h3>
            </div>
          </div>

          <div className="bg-dark-800 print:bg-white print:border-gray-300 p-6 rounded-3xl border border-dark-700 shadow-xl flex items-center gap-4">
            <div className="p-4 bg-blue-500/10 print:bg-gray-100 rounded-2xl text-blue-500 print:text-black">
              <CubeIcon className="w-8 h-8" />
            </div>
            <div>
              <p className="text-gray-400 print:text-gray-600 text-sm font-bold uppercase tracking-wider">Total Items</p>
              <h3 className="text-3xl font-black text-white print:text-black">{data.totalItems}</h3>
            </div>
          </div>

          <div className="bg-dark-800 print:bg-white print:border-gray-300 p-6 rounded-3xl border border-dark-700 shadow-xl flex items-center gap-4">
            <div className="p-4 bg-red-500/10 print:bg-gray-100 rounded-2xl text-red-500 print:text-black">
              <ExclamationTriangleIcon className="w-8 h-8" />
            </div>
            <div>
              <p className="text-gray-400 print:text-gray-600 text-sm font-bold uppercase tracking-wider">Low Stock Alerts</p>
              <h3 className="text-3xl font-black text-white print:text-black">{data.lowStockCount}</h3>
            </div>
          </div>
        </div>

        {/* Low Stock Table */}
        <div className="bg-dark-800 print:bg-white print:border-gray-300 rounded-3xl border border-dark-700 shadow-xl overflow-hidden">
          <div className="p-6 border-b border-dark-700 print:border-gray-300">
            <h3 className="text-xl font-bold text-white print:text-black flex items-center gap-2">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
              Critical Stock Levels
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-dark-900/50 print:bg-gray-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-black text-gray-500 print:text-black uppercase tracking-widest">Product Name</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-500 print:text-black uppercase tracking-widest text-center">Current Stock</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-500 print:text-black uppercase tracking-widest text-center">Reorder Point</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-500 print:text-black uppercase tracking-widest text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700 print:divide-gray-300">
                {data.lowStockItems.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-gray-500 font-medium">
                      No critical stock items found. Good job!
                    </td>
                  </tr>
                ) : (
                  data.lowStockItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-dark-700/50 transition-colors print:text-black">
                      <td className="px-6 py-4 font-bold text-white print:text-black">{item.name}</td>
                      <td className="px-6 py-4 text-center font-mono text-red-400 font-bold">{item.stock}</td>
                      <td className="px-6 py-4 text-center font-mono text-gray-400 print:text-black">{item.reorderPoint}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="bg-red-500/10 text-red-500 border border-red-500/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider print:border-red-500">
                          Critical
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
