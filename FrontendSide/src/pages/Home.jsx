import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ComposedChart,
  Legend,
} from "recharts";
import {
  BanknotesIcon,
  ChartBarIcon,
  ClockIcon,
  CreditCardIcon,
  CubeIcon,
  FunnelIcon,
  ShoppingBagIcon,
} from "@heroicons/react/24/outline";
import api from "../services/api";
import { useSocket } from "../contexts/SocketContext";
import DashboardSkeleton from "../components/skeletons/DashboardSkeleton";

const formatPeso = (value) =>
  `₱${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

const startOfDay = (d) => {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const endOfDay = (d) => {
  const copy = new Date(d);
  copy.setHours(23, 59, 59, 999);
  return copy;
};

const toDateInputValue = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getPresetRange = (preset) => {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  if (preset === "today") return { start: todayStart, end: todayEnd };
  if (preset === "yesterday") {
    const y = new Date(now);
    y.setDate(y.getDate() - 1);
    return { start: startOfDay(y), end: endOfDay(y) };
  }
  if (preset === "last7") {
    const s = new Date(now);
    s.setDate(s.getDate() - 6);
    return { start: startOfDay(s), end: todayEnd };
  }
  if (preset === "last30") {
    const s = new Date(now);
    s.setDate(s.getDate() - 29);
    return { start: startOfDay(s), end: todayEnd };
  }
  if (preset === "thisMonth") {
    const s = new Date(now.getFullYear(), now.getMonth(), 1);
    return { start: startOfDay(s), end: todayEnd };
  }
  return { start: todayStart, end: todayEnd };
};

const CATEGORY_PALETTE = ["#f97316", "#ea580c", "#dc2626", "#f59e0b", "#fb7185", "#22c55e", "#06b6d4", "#8b5cf6", "#38bdf8"];
const PRODUCT_PALETTE = ["#38bdf8", "#22c55e", "#f97316", "#fb7185", "#a78bfa", "#f59e0b", "#06b6d4", "#ef4444", "#84cc16"];

const PAYMENT_COLORS = {
  CASH: "#22c55e",
  CARD: "#38bdf8",
  GCASH: "#06b6d4",
  PAYMAYA: "#8b5cf6",
};

const hashString = (value) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
};

const colorForKey = (key, palette) => {
  const safe = String(key || "");
  if (!safe) return palette[0];
  return palette[hashString(safe) % palette.length];
};

const paymentColor = (name) => {
  const key = String(name || "").toUpperCase();
  return PAYMENT_COLORS[key] || colorForKey(key, CATEGORY_PALETTE);
};

const CustomTooltip = ({ active, payload, label, formatter }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-dark-950/95 backdrop-blur-xl border border-dark-700 rounded-2xl px-4 py-3 shadow-2xl">
      <div className="text-xs font-black text-gray-400 uppercase tracking-widest">{label}</div>
      <div className="mt-2 space-y-1">
        {payload.map((p) => (
          <div key={p.dataKey} className="flex items-center justify-between gap-6 text-sm">
            <span className="text-gray-300 font-bold">{p.name}</span>
            <span className="text-white font-black">{formatter ? formatter(p.value, p.name) : p.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function Home() {
  const socket = useSocket();
  const [preset, setPreset] = useState("last7");
  const [granularity, setGranularity] = useState("day");
  const [customStart, setCustomStart] = useState(() => toDateInputValue(getPresetRange("last7").start));
  const [customEnd, setCustomEnd] = useState(() => toDateInputValue(getPresetRange("last7").end));
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    summary: { totalRevenue: 0, totalProfit: 0, totalTransactions: 0, avgTicket: 0 },
    trends: [],
    topProducts: [],
    salesByCategory: [],
    peakHours: [],
    paymentMethods: [],
  });

  const range = useMemo(() => {
    if (preset !== "custom") return getPresetRange(preset);
    const start = startOfDay(new Date(customStart));
    const end = endOfDay(new Date(customEnd));
    return { start, end };
  }, [preset, customStart, customEnd]);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        start: range.start.toISOString(),
        end: range.end.toISOString(),
        granularity,
      });
      const res = await api.get(`/transactions/dashboard?${params.toString()}`);
      setData(res.data);
    } finally {
      setLoading(false);
    }
  }, [granularity, range.end, range.start]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  useEffect(() => {
    if (!socket) return;
    const handler = () => fetchDashboard();
    socket.on("transaction_created", handler);
    socket.on("transaction_updated", handler);
    return () => {
      socket.off("transaction_created", handler);
      socket.off("transaction_updated", handler);
    };
  }, [socket, fetchDashboard]);

  const peakHoursFilled = useMemo(() => {
    const map = new Map(data.peakHours.map((h) => [h.hour, h]));
    return Array.from({ length: 24 }, (_, hour) => ({
      hour,
      sales: map.get(hour)?.sales || 0,
      transactions: map.get(hour)?.transactions || 0,
    }));
  }, [data.peakHours]);

  const paymentData = useMemo(() => {
    return data.paymentMethods.map((p) => ({
      name: (p.method || "").toUpperCase(),
      value: p.amount || 0,
      transactions: p.transactions || 0,
    }));
  }, [data.paymentMethods]);

  const categoryChartData = useMemo(() => {
    return data.salesByCategory.map((c) => ({ name: c.category, value: c.sales }));
  }, [data.salesByCategory]);

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="p-2 space-y-8 animate-fade-in">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">Dashboard</h2>
          <p className="text-gray-400 mt-1">Real-time performance overview ng store</p>
        </div>

        <div className="bg-dark-800 rounded-3xl border border-dark-700 shadow-xl p-4 flex flex-col sm:flex-row gap-4 sm:items-center">
          <div className="flex items-center gap-2 text-gray-500 font-black uppercase tracking-widest text-xs">
            <FunnelIcon className="w-4 h-4" />
            Date Range
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { id: "today", label: "Today" },
              { id: "yesterday", label: "Yesterday" },
              { id: "last7", label: "Last 7 Days" },
              { id: "last30", label: "Last 30 Days" },
              { id: "thisMonth", label: "This Month" },
              { id: "custom", label: "Custom" },
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => setPreset(opt.id)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                  preset === opt.id
                    ? "bg-accent text-white border-accent shadow-lg shadow-accent/20"
                    : "bg-dark-900 text-gray-500 border-dark-700 hover:text-white hover:bg-dark-700"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {preset === "custom" && (
            <div className="flex flex-wrap gap-2">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="bg-dark-900 text-white px-4 py-2 rounded-xl border border-dark-700 focus:border-accent outline-none text-xs font-bold"
              />
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="bg-dark-900 text-white px-4 py-2 rounded-xl border border-dark-700 focus:border-accent outline-none text-xs font-bold"
              />
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="bg-dark-800 rounded-3xl border border-dark-700 shadow-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-black text-gray-500 uppercase tracking-widest">Total Revenue</div>
              <div className="text-3xl font-black text-white mt-2">{formatPeso(data.summary.totalRevenue)}</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
              <BanknotesIcon className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-dark-800 rounded-3xl border border-dark-700 shadow-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-black text-gray-500 uppercase tracking-widest">Total Profit</div>
              <div className="text-3xl font-black text-white mt-2">{formatPeso(data.summary.totalProfit)}</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-500">
              <ChartBarIcon className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-dark-800 rounded-3xl border border-dark-700 shadow-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-black text-gray-500 uppercase tracking-widest">Transactions</div>
              <div className="text-3xl font-black text-white mt-2">{Number(data.summary.totalTransactions || 0).toLocaleString()}</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500">
              <ShoppingBagIcon className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-dark-800 rounded-3xl border border-dark-700 shadow-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-black text-gray-500 uppercase tracking-widest">Avg Ticket</div>
              <div className="text-3xl font-black text-white mt-2">{formatPeso(data.summary.avgTicket)}</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <CreditCardIcon className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-dark-800 rounded-3xl border border-dark-700 shadow-xl overflow-hidden">
          <div className="p-6 border-b border-dark-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-white font-black text-lg">Sales Trends</div>
              <div className="text-gray-500 text-sm">Daily / Weekly / Monthly</div>
            </div>
            <div className="flex gap-2">
              {["day", "week", "month"].map((g) => (
                <button
                  key={g}
                  onClick={() => setGranularity(g)}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                    granularity === g
                      ? "bg-accent text-white border-accent shadow-lg shadow-accent/20"
                      : "bg-dark-900 text-gray-500 border-dark-700 hover:text-white hover:bg-dark-700"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
          <div className="h-80 p-4">
            {loading ? (
              <div className="h-full flex items-center justify-center text-gray-500 font-bold">Loading...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.trends}>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 700 }} />
                  <YAxis yAxisId="money" tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 700 }} />
                  <YAxis yAxisId="count" orientation="right" tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 700 }} />
                  <Tooltip content={<CustomTooltip formatter={(v, n) => (n === "Transactions" ? Number(v).toLocaleString() : formatPeso(v))} />} />
                  <Legend />
                  <Line yAxisId="money" type="monotone" dataKey="revenue" name="Revenue" stroke="#f97316" strokeWidth={3} dot={false} />
                  <Line yAxisId="money" type="monotone" dataKey="profit" name="Profit" stroke="#22c55e" strokeWidth={3} dot={false} />
                  <Line yAxisId="count" type="monotone" dataKey="transactions" name="Transactions" stroke="#38bdf8" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-dark-800 rounded-3xl border border-dark-700 shadow-xl overflow-hidden">
          <div className="p-6 border-b border-dark-700">
            <div className="text-white font-black text-lg">Revenue vs Profit</div>
            <div className="text-gray-500 text-sm">Gross revenue vs net profit</div>
          </div>
          <div className="h-80 p-4">
            {loading ? (
              <div className="h-full flex items-center justify-center text-gray-500 font-bold">Loading...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data.trends}>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 700 }} />
                  <YAxis yAxisId="left" tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 700 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 700 }} />
                  <Tooltip content={<CustomTooltip formatter={(v) => formatPeso(v)} />} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="revenue" name="Revenue" fill="rgba(249,115,22,0.35)" stroke="#f97316" radius={[10, 10, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="profit" name="Profit" stroke="#22c55e" strokeWidth={3} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="bg-dark-800 rounded-3xl border border-dark-700 shadow-xl overflow-hidden xl:col-span-2">
          <div className="p-6 border-b border-dark-700">
            <div className="text-white font-black text-lg">Top Selling Products</div>
            <div className="text-gray-500 text-sm">Popular items</div>
          </div>
          <div className="h-96 p-2">
            {loading ? (
              <div className="h-full flex items-center justify-center text-gray-500 font-bold">Loading...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.topProducts} layout="vertical" margin={{ left: 2 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 700 }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={140}
                    tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 11, fontWeight: 800 }}
                  />
                  <Tooltip content={<CustomTooltip formatter={(v) => Number(v).toLocaleString()} />} />
                  <Bar dataKey="qty" name="Qty Sold" radius={[0, 12, 12, 0]}>
                    {data.topProducts.map((p) => (
                      <Cell key={p.productId} fill={colorForKey(p.productId, PRODUCT_PALETTE)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-dark-800 rounded-3xl border border-dark-700 shadow-xl overflow-hidden">
          <div className="p-6 border-b border-dark-700">
            <div className="text-white font-black text-lg">Sales by Category</div>
            <div className="text-gray-500 text-sm">Revenue Distribution</div>
          </div>
          <div className="h-96 p-4">
            {loading ? (
              <div className="h-full flex items-center justify-center text-gray-500 font-bold">Loading...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<CustomTooltip formatter={(v) => formatPeso(v)} />} />
                  <Pie
                    data={categoryChartData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={2}
                  >
                    {categoryChartData.map((c) => (
                      <Cell key={c.name} fill={colorForKey(c.name, CATEGORY_PALETTE)} />
                    ))}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-dark-800 rounded-3xl border border-dark-700 shadow-xl overflow-hidden">
          <div className="p-6 border-b border-dark-700 flex items-center justify-between">
            <div>
              <div className="text-white font-black text-lg">Peak Hours</div>
              <div className="text-gray-500 text-sm">Busy times (area chart)</div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-dark-900 border border-dark-700 flex items-center justify-center text-gray-400">
              <ClockIcon className="w-6 h-6" />
            </div>
          </div>
          <div className="h-80 p-4">
            {loading ? (
              <div className="h-full flex items-center justify-center text-gray-500 font-bold">Loading...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={peakHoursFilled}>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="hour" tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 700 }} />
                  <YAxis tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 700 }} />
                  <Tooltip content={<CustomTooltip formatter={(v) => formatPeso(v)} />} />
                  <Area type="monotone" dataKey="sales" name="Sales" stroke="#8b5cf6" fill="rgba(139,92,246,0.22)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-dark-800 rounded-3xl border border-dark-700 shadow-xl overflow-hidden">
          <div className="p-6 border-b border-dark-700 flex items-center justify-between">
            <div>
              <div className="text-white font-black text-lg">Payment Method Distribution</div>
              <div className="text-gray-500 text-sm">Cash vs GCash/Maya vs Card</div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-dark-900 border border-dark-700 flex items-center justify-center text-gray-400">
              <CubeIcon className="w-6 h-6" />
            </div>
          </div>
          <div className="h-80 p-4">
            {loading ? (
              <div className="h-full flex items-center justify-center text-gray-500 font-bold">Loading...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<CustomTooltip formatter={(v) => formatPeso(v)} />} />
                  <Pie data={paymentData} dataKey="value" nameKey="name" innerRadius={70} outerRadius={110} paddingAngle={2}>
                    {paymentData.map((p) => (
                      <Cell key={p.name} fill={paymentColor(p.name)} />
                    ))}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
