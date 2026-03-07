import React from 'react';
import { useSettings } from "../contexts/SettingsContext";

// Format currency helper
const formatCurrency = (amount) => {
  return `₱${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Format date helper
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString();
};

const PrintableReport = React.forwardRef(({ title, subtitle, date, preparedBy, type, data }, ref) => {
  const { settings } = useSettings();
  
  return (
    <div ref={ref} className="bg-white p-8 max-w-[210mm] mx-auto text-black print:p-8 print:max-w-none print:w-full font-sans">
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-gray-800 pb-6 mb-8">
        <div className="flex items-center gap-4">
          {/* Dynamic Logo */}
          <div 
            className="w-16 h-16 flex items-center justify-center rounded-lg text-2xl font-black text-white"
            style={{ 
              background: `linear-gradient(to bottom right, ${settings?.logoColorStart || '#f59e0b'}, ${settings?.logoColorEnd || '#dc2626'})` 
            }}
          >
            {settings?.logoChar || "S"}
          </div>
          <div>
            <h1 className="text-2xl font-bold uppercase tracking-tight text-gray-900">{settings?.appName || "POS System"}</h1>
            <p className="text-sm text-gray-600">{settings?.appSubtitle || "Official Business Report"}</p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-600 font-medium mt-1">{subtitle}</p>
          <p className="text-xs text-gray-500 mt-2">Generated: {date}</p>
          {preparedBy && <p className="text-xs text-gray-500">Prepared by: {preparedBy}</p>}
        </div>
      </div>

      {/* Content based on Report Type */}
      
      {/* SALES REPORT */}
      {type === 'sales' && (
        <div>
          {/* Summary Cards */}
          <div className="flex gap-6 mb-8">
            <div className="flex-1 p-4 border border-gray-200 rounded-lg bg-gray-50">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Revenue</p>
              <p className="text-2xl font-black text-gray-900 mt-1">{formatCurrency(data.totalSales)}</p>
            </div>
            <div className="flex-1 p-4 border border-gray-200 rounded-lg bg-gray-50">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Transactions</p>
              <p className="text-2xl font-black text-gray-900 mt-1">{data.totalTransactions}</p>
            </div>
          </div>

          {/* Breakdown Table */}
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-100 border-b-2 border-gray-300">
              <tr>
                <th className="py-3 px-4 text-xs font-bold text-gray-700 uppercase tracking-wider">Date</th>
                <th className="py-3 px-4 text-xs font-bold text-gray-700 uppercase tracking-wider text-right">Sales Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.chartData?.map((item, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="py-2 px-4 text-sm font-medium text-gray-900">{formatDate(item.date)}</td>
                  <td className="py-2 px-4 text-sm font-medium text-gray-900 text-right">{formatCurrency(item.amount)}</td>
                </tr>
              ))}
              {/* Total Row */}
              <tr className="border-t-2 border-gray-300 bg-gray-100 font-bold">
                <td className="py-3 px-4 text-sm text-gray-900 uppercase">Total</td>
                <td className="py-3 px-4 text-sm text-gray-900 text-right">{formatCurrency(data.totalSales)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* INVENTORY REPORT */}
      {type === 'inventory' && (
        <div>
          {/* Summary Cards */}
          <div className="flex gap-6 mb-8">
            <div className="flex-1 p-4 border border-gray-200 rounded-lg bg-gray-50">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Stock Value</p>
              <p className="text-2xl font-black text-gray-900 mt-1">{formatCurrency(data.totalValue)}</p>
            </div>
            <div className="flex-1 p-4 border border-gray-200 rounded-lg bg-gray-50">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Items</p>
              <p className="text-2xl font-black text-gray-900 mt-1">{data.totalItems}</p>
            </div>
            <div className="flex-1 p-4 border border-gray-200 rounded-lg bg-gray-50">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Low Stock Alerts</p>
              <p className="text-2xl font-black text-red-600 mt-1">{data.lowStockCount}</p>
            </div>
          </div>

          {/* Table */}
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-100 border-b-2 border-gray-300">
              <tr>
                <th className="py-3 px-4 text-xs font-bold text-gray-700 uppercase tracking-wider">Product</th>
                <th className="py-3 px-4 text-xs font-bold text-gray-700 uppercase tracking-wider">SKU</th>
                <th className="py-3 px-4 text-xs font-bold text-gray-700 uppercase tracking-wider text-right">Unit Cost</th>
                <th className="py-3 px-4 text-xs font-bold text-gray-700 uppercase tracking-wider text-center">Stock Level</th>
                <th className="py-3 px-4 text-xs font-bold text-gray-700 uppercase tracking-wider text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.items?.map((item, index) => {
                const isLowStock = item.stockOnHand <= item.reorderPoint;
                return (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="py-2 px-4 text-sm font-bold text-gray-900">{item.product?.name || "Unknown"}</td>
                    <td className="py-2 px-4 text-sm font-mono text-gray-600">{item.product?.sku || "-"}</td>
                    <td className="py-2 px-4 text-sm text-gray-900 text-right">{formatCurrency(item.product?.cost || 0)}</td>
                    <td className="py-2 px-4 text-sm font-bold text-gray-900 text-center">{item.stockOnHand}</td>
                    <td className="py-2 px-4 text-center">
                      {isLowStock ? (
                        <span className="text-xs font-bold text-red-700 uppercase border border-red-300 bg-red-50 px-2 py-1 rounded">Reorder</span>
                      ) : (
                        <span className="text-xs font-bold text-green-700 uppercase border border-green-300 bg-green-50 px-2 py-1 rounded">Good</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* CASHIER REPORT */}
      {type === 'cashier' && (
        <div>
          <table className="w-full text-left border-collapse mt-4">
            <thead className="bg-gray-100 border-b-2 border-gray-300">
              <tr>
                <th className="py-3 px-4 text-xs font-bold text-gray-700 uppercase tracking-wider">Cashier Name</th>
                <th className="py-3 px-4 text-xs font-bold text-gray-700 uppercase tracking-wider text-center">Transactions</th>
                <th className="py-3 px-4 text-xs font-bold text-gray-700 uppercase tracking-wider text-right">Total Sales</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.cashiers?.map((cashier, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="py-3 px-4 text-sm font-bold text-gray-900">{cashier.name}</td>
                  <td className="py-3 px-4 text-sm text-gray-900 text-center">{cashier.transactions}</td>
                  <td className="py-3 px-4 text-sm font-bold text-gray-900 text-right">{formatCurrency(cashier.totalSales)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* PROFIT & LOSS REPORT */}
      {type === 'profit-loss' && (
        <div>
          <div className="max-w-xl mx-auto border border-gray-300 rounded-lg overflow-hidden mt-4">
            {/* Header */}
            <div className="bg-gray-100 px-6 py-4 border-b border-gray-300">
              <h3 className="text-lg font-bold text-gray-900">Financial Summary</h3>
            </div>
            
            {/* Revenue */}
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <div>
                <p className="text-sm font-bold text-gray-700 uppercase">Total Revenue</p>
                <p className="text-xs text-gray-500">Gross Sales Income</p>
              </div>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(data.totalRevenue)}</p>
            </div>

            {/* Expenses */}
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-red-50/30">
              <div>
                <p className="text-sm font-bold text-red-800 uppercase">Total Expenses</p>
                <p className="text-xs text-red-600">Cost of Goods Sold (COGS)</p>
              </div>
              <p className="text-xl font-bold text-red-700">({formatCurrency(data.totalCost)})</p>
            </div>

            {/* Net Income */}
            <div className="px-6 py-6 bg-gray-50 flex justify-between items-center">
              <div>
                <p className="text-base font-black text-gray-900 uppercase tracking-wider">Net Income</p>
                <p className="text-xs text-gray-500">Gross Profit</p>
              </div>
              <div className="text-right">
                <p className={`text-2xl font-black ${data.grossProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {formatCurrency(data.grossProfit)}
                </p>
                <p className={`text-xs font-bold ${data.margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {data.margin.toFixed(1)}% Margin
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-12 pt-8 border-t border-gray-200 text-center text-xs text-gray-500">
        <p>This report was generated automatically by the system.</p>
        <p className="mt-1">Page 1 of 1</p>
      </div>
    </div>
  );
});

export default PrintableReport;
