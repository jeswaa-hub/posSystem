import { useState, useEffect, useRef } from "react";
import { 
  IdentificationIcon, 
  ArrowPathIcon,
  ChartBarIcon,
  PrinterIcon
} from "@heroicons/react/24/outline";
import api from "../services/api";
import PrintableReport from "../components/PrintableReport";
import { useAuth } from "../contexts/AuthContext";
import { useReactToPrint } from "react-to-print";
import { useSocket } from "../contexts/SocketContext";

export default function CashierReport() {
  const { user } = useAuth();
  const socket = useSocket();
  const [period, setPeriod] = useState("month");
  const [data, setData] = useState({ cashiers: [] });
  const [loading, setLoading] = useState(true);
  const componentRef = useRef(null);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Cashier Report - ${new Date().toLocaleDateString()}`,
  });

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/reports/cashiers?period=${period}`);
      setData(res.data);
    } catch (err) {
      console.error("Failed to fetch cashier report", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [period]);

  // Real-time updates
  useEffect(() => {
    if (!socket) return;
    const handler = () => fetchReport();
    socket.on("transaction_created", handler);
    return () => socket.off("transaction_created", handler);
  }, [socket, period]);

  const formatCurrency = (val) => `₱${Number(val).toLocaleString()}`;

  return (
    <div className="p-2 space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">Cashier Report</h2>
          <p className="text-gray-400 mt-1">Staff performance and sales contribution</p>
        </div>
        
        <div className="flex gap-4">
          <div className="flex bg-dark-800 p-1 rounded-xl border border-dark-700">
            {["day", "week", "month", "year"].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all ${
                  period === p 
                    ? "bg-accent text-white shadow-lg" 
                    : "text-gray-400 hover:text-white hover:bg-dark-700"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <button 
            onClick={handlePrint}
            className="p-3 bg-dark-800 text-white rounded-xl border border-dark-700 hover:bg-dark-700 transition-all shadow-lg"
            title="Print Report"
          >
            <PrinterIcon className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="hidden">
        <PrintableReport
          ref={componentRef}
          title="Cashier Report"
          subtitle={`Period: ${period.toUpperCase()}`}
          date={new Date().toLocaleString()}
          preparedBy={user?.fullName || "Admin"}
          type="cashier"
          data={data}
        />
      </div>

      <div className="space-y-6 p-4 bg-dark-900">
        {/* Stats Table */}
        <div className="bg-dark-800 rounded-3xl border border-dark-700 shadow-xl overflow-hidden">
          <div className="p-6 border-b border-dark-700 print:border-gray-300">
            <h3 className="text-xl font-bold text-white print:text-black flex items-center gap-2">
              <ChartBarIcon className="w-5 h-5 text-blue-500" />
              Sales by Cashier
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-dark-900/50 print:bg-gray-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-black text-gray-500 print:text-black uppercase tracking-widest">Cashier Name</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-500 print:text-black uppercase tracking-widest text-center">Transactions Processed</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-500 print:text-black uppercase tracking-widest text-right">Total Sales Generated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700 print:divide-gray-300">
                {loading ? (
                  <tr>
                    <td colSpan="3" className="px-6 py-8 text-center text-gray-500 font-medium animate-pulse">
                      Loading data...
                    </td>
                  </tr>
                ) : data.cashiers.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="px-6 py-8 text-center text-gray-500 font-medium">
                      No cashier data found for this period.
                    </td>
                  </tr>
                ) : (
                  data.cashiers.map((cashier, idx) => (
                    <tr key={idx} className="hover:bg-dark-700/50 transition-colors print:text-black">
                      <td className="px-6 py-4 font-bold text-white print:text-black flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-dark-700 print:bg-gray-200 flex items-center justify-center text-gray-400 print:text-gray-600">
                          <IdentificationIcon className="w-4 h-4" />
                        </div>
                        {cashier.name}
                      </td>
                      <td className="px-6 py-4 text-center font-mono text-gray-400 print:text-black">{cashier.transactions}</td>
                      <td className="px-6 py-4 text-right font-mono text-green-500 font-bold">{formatCurrency(cashier.totalSales)}</td>
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
