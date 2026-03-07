import { useState, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { UserIcon, XMarkIcon, BanknotesIcon } from "@heroicons/react/24/outline";

export default function CheckoutModal({ isOpen, onClose, onConfirm, totalAmount, cartItems = [] }) {
  const [customerName, setCustomerName] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(customerName || "Walk-in Customer");
    setCustomerName(""); // Reset for next time
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[1000]" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-dark-900 border border-dark-700 p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex justify-between items-center mb-6">
                  <Dialog.Title as="h3" className="text-xl font-black text-white flex items-center gap-2">
                    <BanknotesIcon className="w-6 h-6 text-accent" />
                    Confirm Order
                  </Dialog.Title>
                  <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                <div className="mb-6 bg-dark-800 p-4 rounded-xl border border-dark-700 text-center">
                  <p className="text-gray-400 text-sm font-bold uppercase">Total Amount Due</p>
                  <p className="text-3xl font-black text-white mt-1">₱{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>

                {/* Order Summary Preview */}
                <div className="mb-6">
                  <p className="text-gray-400 text-xs font-bold uppercase mb-2">Order Summary</p>
                  <div className="bg-dark-800 rounded-xl border border-dark-700 max-h-40 overflow-y-auto custom-scrollbar p-2">
                    {cartItems.length === 0 ? (
                      <p className="text-gray-500 text-center text-xs py-2">No items</p>
                    ) : (
                      <table className="w-full text-left">
                        <tbody className="divide-y divide-dark-700/50">
                          {cartItems.map((item, idx) => (
                            <tr key={idx} className="text-xs">
                              <td className="py-2 pl-2 text-white font-medium">
                                <div className="truncate w-32">{item.name}</div>
                              </td>
                              <td className="py-2 text-center text-gray-400">x{item.quantity}</td>
                              <td className="py-2 pr-2 text-right text-accent font-bold">
                                ₱{(item.price * item.quantity).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wide">
                      Customer Name <span className="text-gray-600 font-normal normal-case">(Optional)</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <UserIcon className="h-5 w-5 text-gray-500" />
                      </div>
                      <input
                        type="text"
                        className="w-full bg-dark-800 border border-dark-700 text-white text-sm rounded-xl focus:ring-accent focus:border-accent block pl-10 p-3 placeholder-gray-500 font-bold"
                        placeholder="Walk-in Customer"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      className="flex-1 bg-dark-800 hover:bg-dark-700 text-gray-300 font-bold py-3 rounded-xl transition-colors border border-dark-700"
                      onClick={onClose}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-accent hover:bg-orange-600 text-white font-black py-3 rounded-xl shadow-lg shadow-accent/20 transition-all"
                    >
                      Confirm Payment
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
