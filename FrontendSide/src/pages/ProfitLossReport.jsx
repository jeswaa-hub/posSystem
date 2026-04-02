import { useState, useEffect, useRef } from "react";
import { 
  BanknotesIcon, 
  ArrowPathIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ScaleIcon,
  PrinterIcon
} from "@heroicons/react/24/outline";
import api from "../services/api";
import PrintableReport from "../components/PrintableReport";
import { useAuth } from "../contexts/AuthContext";
import { useReactToPrint } from "react-to-print";
import { useSocket } from "../contexts/SocketContext";
import ReportSkeleton from "../components/skeletons/ReportSkeleton";

export default function ProfitLossReport() {
  const { user } = useAuth();
  const socket = useSocket();
  const [period, setPeriod] = useState("month");
  const [data, setData] = useState({ totalRevenue: 0, totalCost: 0, grossProfit: 0, margin: 0 });
  const [loading, setLoading] = useState(true);
  const componentRef = useRef(null);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Profit & Loss Report - ${new Date().toLocaleDateString()}`,
  });

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/reports/profit-loss?period=${period}`);
      setData(res.data);
    } catch (err) {
      console.error("Failed to fetch profit/loss report", err);
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

  if (loading) return <ReportSkeleton />;

  const formatCurrency = (val) => `₱${Number(val).toLocaleString()}`;

  return (
    <div className="p-2 space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">Profit & Loss</h2>
          <p className="text-gray-400 mt-1">Financial performance analysis</p>
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
          title="Profit & Loss Report"
          subtitle={`Period: ${period.toUpperCase()}`}
          date={new Date().toLocaleString()}
          preparedBy={user?.fullName || "Admin"}
          type="profit-loss"
          data={data}
        />
      </div>

      <div className="space-y-6 p-4 bg-dark-900">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Revenue */}
          <div className="bg-dark-800 p-6 rounded-3xl border border-dark-700 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <BanknotesIcon className="w-24 h-24 text-green-500" />
            </div>
            <div className="relative z-10">
              <p className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-2">Total Revenue</p>
              <h3 className="text-3xl font-black text-white">{formatCurrency(data.totalRevenue)}</h3>
              <p className="text-xs text-green-500 mt-2 font-bold flex items-center gap-1">
                <ArrowTrendingUpIcon className="w-3 h-3" />
                Sales Income
              </p>
            </div>
          </div>

          {/* Cost */}
          <div className="bg-dark-800 p-6 rounded-3xl border border-dark-700 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <ScaleIcon className="w-24 h-24 text-red-500" />
            </div>
            <div className="relative z-10">
              <p className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-2">Total Cost</p>
              <h3 className="text-3xl font-black text-white">{formatCurrency(data.totalCost)}</h3>
              <p className="text-xs text-red-500 mt-2 font-bold flex items-center gap-1">
                <ArrowTrendingDownIcon className="w-3 h-3" />
                Expenses (COGS)
              </p>
            </div>
          </div>

          {/* Gross Profit */}
          <div className="bg-dark-800 p-6 rounded-3xl border border-dark-700 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <BanknotesIcon className="w-24 h-24 text-accent" />
            </div>
            <div className="relative z-10">
              <p className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-2">Gross Profit</p>
              <h3 className={`text-3xl font-black ${data.grossProfit >= 0 ? "text-accent" : "text-red-500"}`}>
                {formatCurrency(data.grossProfit)}
              </h3>
              <p className="text-xs text-gray-500 mt-2 font-bold">
                Revenue - Cost
              </p>
            </div>
          </div>

          {/* Margin */}
          <div className="bg-dark-800 p-6 rounded-3xl border border-dark-700 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <ArrowTrendingUpIcon className="w-24 h-24 text-blue-500" />
            </div>
            <div className="relative z-10">
              <p className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-2">Profit Margin</p>
              <h3 className="text-3xl font-black text-white">{data.margin.toFixed(1)}%</h3>
              <p className="text-xs text-blue-500 mt-2 font-bold">
                Profitability Ratio
              </p>
            </div>
          </div>
        </div>

        {/* Breakdown/Summary */}
        <div className="bg-dark-800 rounded-3xl border border-dark-700 shadow-xl p-8">
          <h3 className="text-xl font-bold text-white mb-4">Financial Summary</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-dark-900 rounded-2xl border border-dark-700">
              <span className="text-gray-400 font-bold">Total Sales Revenue</span>
              <span className="text-white font-mono font-bold text-lg">{formatCurrency(data.totalRevenue)}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-dark-900 rounded-2xl border border-dark-700">
              <span className="text-gray-400 font-bold">Cost of Goods Sold (COGS)</span>
              <span className="text-red-400 font-mono font-bold text-lg">- {formatCurrency(data.totalCost)}</span>
            </div>
            <div className="border-t border-dark-600 my-2"></div>
            <div className="flex justify-between items-center p-4 bg-accent/10 rounded-2xl border border-accent/20">
              <span className="text-accent font-black uppercase tracking-widest">Net Profit</span>
              <span className="text-accent font-mono font-black text-2xl">{formatCurrency(data.grossProfit)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
