import React from 'react';
import { useSettings } from "../contexts/SettingsContext";
import { QrCodeIcon } from "@heroicons/react/24/outline";

// Format currency helper
const formatCurrency = (amount) => {
  return `₱${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Format date helper
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString("en-US", {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const PrintableReceipt = React.forwardRef(({ transaction }, ref) => {
  const { settings } = useSettings();
  
  if (!transaction) return null;

  return (
    <div ref={ref} className="bg-white px-4 py-4 max-w-[80mm] mx-auto text-black font-sans text-xs leading-snug print:px-4 print:py-2 print:max-w-none print:w-full">
      {/* Header */}
      <div className="text-center mb-4">
        <div className="mb-2 flex justify-center">
          {/* Logo Placeholder */}
          <div className="w-10 h-10 bg-black text-white flex items-center justify-center rounded-full font-bold text-lg">
            SV
          </div>
        </div>
        <h1 className="text-lg font-bold uppercase tracking-wide mb-1">SAMOKI VALLEY</h1>
        <div className="text-[10px] text-gray-600 space-y-0.5 leading-tight">
          <p>123 Mountain View Road, Baguio City</p>
          <p>TIN: 123-456-789-000</p>
          <p>Tel: (074) 442-1234</p>
        </div>
      </div>

      {/* Transaction Info - 2 Column Grid */}
      <div className="grid grid-cols-2 gap-x-4 text-[10px] mb-4 text-gray-600 border-b border-gray-200 pb-3">
        <div>
          <p className="font-bold text-gray-800">Date/Time</p>
          <p>{formatDate(transaction.createdAt)}</p>
        </div>
        <div className="text-right">
          <p className="font-bold text-gray-800">Transaction ID</p>
          <p className="truncate">{transaction.transactionId}</p>
        </div>
        <div className="mt-2">
          <p className="font-bold text-gray-800">Cashier</p>
          <p>{transaction.cashier?.fullName || "Staff"}</p>
        </div>
        <div className="mt-2 text-right">
          <p className="font-bold text-gray-800">Customer</p>
          <p className="truncate">{transaction.customerName || transaction.customer?.fullName || "Walk-in"}</p>
        </div>
      </div>

      {/* Itemized Table */}
      <div className="mb-4">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-[10px] font-bold text-gray-500 uppercase border-b border-gray-300">
              <th className="pb-2 w-[50%]">Item</th>
              <th className="pb-2 text-center w-[20%]">Qty</th>
              <th className="pb-2 text-right w-[30%]">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {transaction.items?.map((item, idx) => (
              <tr key={idx} className="align-top">
                <td className="py-2 pr-1">
                  <div className="font-bold text-gray-900 text-sm">{item.product?.name || "Unknown"}</div>
                  <div className="text-[10px] text-gray-500 font-light">@{formatCurrency(item.price)}</div>
                </td>
                <td className="py-2 text-center align-top text-gray-800 font-medium pt-2.5">{item.quantity}</td>
                <td className="py-2 text-right font-bold align-top text-gray-900 pt-2.5">{formatCurrency(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals Section */}
      <div className="border-t-2 border-gray-800 pt-3 mb-6 space-y-1.5">
        <div className="flex justify-between text-[11px] text-gray-600">
          <span>Subtotal</span>
          <span className="font-medium">{formatCurrency(transaction.totalAmount)}</span>
        </div>
        <div className="flex justify-between text-[11px] text-gray-600">
          <span>VAT ({transaction.taxRate ?? settings?.taxRate ?? 0}%)</span>
          <span className="font-medium">{formatCurrency(transaction.tax || 0)}</span>
        </div>
        
        <div className="flex justify-between items-end mt-2 pt-2 border-t border-gray-200">
          <span className="font-bold text-lg text-gray-900">TOTAL</span>
          <span className="font-black text-2xl text-gray-900">{formatCurrency(transaction.netAmount || (transaction.totalAmount + (transaction.tax || 0)))}</span>
        </div>
      </div>

      {/* Payment & Change */}
      <div className="mb-8 space-y-1 text-[11px]">
        <div className="flex justify-between">
          <span className="text-gray-600 uppercase">Payment Method</span>
          <span className="font-bold uppercase text-gray-900">{transaction.paymentMethod}</span>
        </div>
        {/* Placeholder for change calculation if available in future */}
        {/* <div className="flex justify-between">
          <span className="text-gray-600 uppercase">Change</span>
          <span className="font-bold text-gray-900">P0.00</span>
        </div> */}
      </div>

      {/* Footer */}
      <div className="text-center space-y-4">
        <p className="font-medium text-gray-800 italic">Thank you for dining with us!</p>
        
        <p className="text-[8px] text-gray-400 mt-4">System Generated Receipt • {transaction.transactionId}</p>
      </div>
    </div>
  );
});

export default PrintableReceipt;
