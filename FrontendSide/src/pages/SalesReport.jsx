import { useState, useEffect, useRef } from "react";
import { 
  BanknotesIcon, 
  ShoppingCartIcon, 
  CalendarIcon,
  ArrowPathIcon,
  PrinterIcon
} from "@heroicons/react/24/outline";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";
import api from "../services/api";
import PrintableReport from "../components/PrintableReport";
import { useAuth } from "../contexts/AuthContext";
import { useReactToPrint } from "react-to-print";
import { useSocket } from "../contexts/SocketContext";

export default function SalesReport() {
  const { user } = useAuth();
  const socket = useSocket();
  const [period, setPeriod] = useState("week"); // day, week, month, year
  const [data, setData] = useState({ totalSales: 0, totalTransactions: 0, chartData: [] });
  const [loading, setLoading] = useState(true);
  const componentRef = useRef(null);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Sales Report - ${new Date().toLocaleDateString()}`,
  });

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/reports/sales?period=${period}`);
      setData(res.data);
    } catch (err) {
      console.error("Failed to fetch sales report", err);
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
  }, [socket, period]); // Re-bind when period changes to fetch correct range

  const formatCurrency = (val) => `₱${Number(val).toLocaleString()}`;

  return (
    <div className="p-2 space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">Sales Report</h2>
          <p className="text-gray-400 mt-1">Overview of your business performance</p>
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
          title="Sales Report"
          subtitle={`Period: ${period.toUpperCase()}`}
          date={new Date().toLocaleString()}
          preparedBy={user?.fullName || "Admin"}
          type="sales"
          data={data}
        />
      </div>

      <div className="space-y-6 p-4 bg-dark-900">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2 print:gap-4">
          <div className="bg-dark-800 print:bg-white print:border-gray-300 p-6 rounded-3xl border border-dark-700 shadow-xl flex items-center gap-4">
            <div className="p-4 bg-green-500/10 print:bg-gray-100 rounded-2xl text-green-500 print:text-black">
              <BanknotesIcon className="w-8 h-8" />
            </div>
            <div>
              <p className="text-gray-400 print:text-gray-600 text-sm font-bold uppercase tracking-wider">Total Sales</p>
              <h3 className="text-3xl font-black text-white print:text-black">{formatCurrency(data.totalSales)}</h3>
            </div>
          </div>

          <div className="bg-dark-800 print:bg-white print:border-gray-300 p-6 rounded-3xl border border-dark-700 shadow-xl flex items-center gap-4">
            <div className="p-4 bg-blue-500/10 print:bg-gray-100 rounded-2xl text-blue-500 print:text-black">
              <ShoppingCartIcon className="w-8 h-8" />
            </div>
            <div>
              <p className="text-gray-400 print:text-gray-600 text-sm font-bold uppercase tracking-wider">Total Transactions</p>
              <h3 className="text-3xl font-black text-white print:text-black">{data.totalTransactions}</h3>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-dark-800 print:bg-white print:border-gray-300 p-6 rounded-3xl border border-dark-700 shadow-xl h-[400px]">
          <h3 className="text-xl font-bold text-white print:text-black mb-6 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-accent print:text-black" />
            Sales Trend
          </h3>
          
          {loading ? (
            <div className="h-full flex items-center justify-center text-gray-500">
              <ArrowPathIcon className="w-6 h-6 animate-spin mr-2" />
              Loading chart...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="85%">
              <AreaChart data={data.chartData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#9ca3af" 
                  tick={{fontSize: 12}} 
                  tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                />
                <YAxis stroke="#9ca3af" tick={{fontSize: 12}} tickFormatter={(val) => `₱${val/1000}k`} />
                <Tooltip 
                  contentStyle={{backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '12px', color: '#fff'}}
                  itemStyle={{color: '#f59e0b'}}
                  formatter={(val) => [`₱${Number(val).toLocaleString()}`, "Sales"]}
                  labelFormatter={(label) => new Date(label).toLocaleDateString()}
                />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#f59e0b" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorSales)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
