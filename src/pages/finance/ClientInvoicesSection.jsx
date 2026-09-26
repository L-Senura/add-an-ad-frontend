import React, { useState, useEffect } from 'react';
import {
  Receipt,
  CreditCard,
  CheckCircle2,
  Loader2,
  X,
} from 'lucide-react';
import { getInvoicesByClientId, recordInvoicePayment } from './financeApi';

export default function ClientInvoicesSection({ clientId = 1, companyName = 'Your Agency' }) {
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [payingInvoice, setPayingInvoice] = useState(null);
  const [paymentRemarks, setPaymentRemarks] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchClientInvoices() {
      try {
        const list = await getInvoicesByClientId(clientId);
        if (isMounted) {
          setInvoices(list || []);
        }
      } catch (err) {
        console.warn('Error loading client invoices:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    fetchClientInvoices();
    return () => {
      isMounted = false;
    };
  }, [clientId]);

  const handlePay = async (e) => {
    e.preventDefault();
    if (!payingInvoice) return;

    setIsProcessing(true);
    try {
      await recordInvoicePayment(payingInvoice.invoiceId, paymentRemarks || 'Online settlement');
      setNotification({
        type: 'success',
        text: `Invoice #${payingInvoice.invoiceId} successfully settled and marked as PAID!`,
      });
      setPayingInvoice(null);
      setPaymentRemarks('');
      const updatedList = await getInvoicesByClientId(clientId);
      setInvoices(updatedList || []);
    } catch (err) {
      setNotification({
        type: 'error',
        text: err.message || 'Payment processing failed.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const totalBilled = invoices.reduce((sum, i) => sum + (i.categoryPrice || 0), 0);
  const pendingAmount = invoices
    .filter((i) => i.paymentStatus !== 'PAID')
    .reduce((sum, i) => sum + (i.categoryPrice || 0), 0);

  return (
    <div
      className="rounded-[32px] p-6 sm:p-8 bg-white border border-gray-200 shadow-md transition-all"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-gray-100 gap-2">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2 text-[#252A34]">
            <Receipt className="w-5 h-5 text-[#08D9D6]" />
            Agency Invoices & Billing Overview
          </h3>
          <p className="text-xs text-gray-500">
            Platform service fees and multi-channel campaign charges generated for {companyName}.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div>
            <span className="text-gray-400 mr-1">Total Billed:</span>
            <span className="font-bold text-[#252A34]">Rs. {totalBilled.toLocaleString()}</span>
          </div>
          <div className="px-3 py-1 rounded-full bg-[#FF2E63]/10 border border-[#FF2E63]/25">
            <span className="text-gray-500 mr-1">Pending:</span>
            <span className="font-extrabold text-[#FF2E63]">
              Rs. {pendingAmount.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div
          className={`mb-4 p-3.5 rounded-2xl flex items-center justify-between border text-xs ${
            notification.type === 'success'
              ? 'bg-[#08D9D6]/10 border-[#08D9D6] text-[#252A34]'
              : 'bg-[#FF2E63]/10 border-[#FF2E63] text-[#FF2E63]'
          }`}
        >
          <div className="flex items-center gap-2 font-semibold">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-[#08D9D6]" />
            ) : (
              <X className="w-4 h-4 text-[#FF2E63]" />
            )}
            <span>{notification.text}</span>
          </div>
          <button type="button" onClick={() => setNotification(null)} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Invoices List */}
      {isLoading ? (
        <div className="py-12 text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#08D9D6]" />
          <p className="text-xs text-gray-400 mt-2">Loading invoice details...</p>
        </div>
      ) : invoices.length === 0 ? (
        <div className="py-8 text-center text-gray-400 text-xs">
          No invoices have been issued yet. Invoices will automatically generate when campaigns and platform services are activated.
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map((inv) => {
            const isPaid = inv.paymentStatus === 'PAID';
            return (
              <div
                key={inv.invoiceId}
                className="p-4 rounded-2xl border border-gray-200 bg-[#EAEAEA]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-xs text-[#252A34]">
                      Invoice #{inv.invoiceId}
                    </span>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-[#08D9D6]/15 text-[#252A34] border border-[#08D9D6]/30"
                    >
                      {inv.chargedCategory}
                    </span>
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                        isPaid ? 'bg-[#08D9D6]/20 text-[#252A34] border border-[#08D9D6]/40' : 'bg-[#FF2E63]/15 text-[#FF2E63] border border-[#FF2E63]/30'
                      }`}
                    >
                      {inv.paymentStatus}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">
                    {inv.clientDescription || 'Platform advertising charges'}
                  </p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-200">
                  <span className={`text-base font-extrabold ${isPaid ? 'text-[#252A34]' : 'text-[#FF2E63]'}`}>
                    Rs. {(inv.categoryPrice || 0).toLocaleString()}
                  </span>

                  {!isPaid && (
                    <button
                      type="button"
                      onClick={() => {
                        setPayingInvoice(inv);
                        setPaymentRemarks(`Settlement for invoice #${inv.invoiceId}`);
                      }}
                      className="px-4 py-1.5 rounded-xl font-bold text-xs text-[#252A34] shadow-xs hover:shadow-sm"
                      style={{
                        background: 'linear-gradient(135deg, #08D9D6 0%, #00b4b1 100%)',
                      }}
                    >
                      Pay Now
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pay Modal */}
      {payingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="rounded-[32px] p-6 sm:p-8 bg-white border border-gray-200 shadow-2xl max-w-md w-full relative">
            <button
              type="button"
              onClick={() => setPayingInvoice(null)}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold mb-1 text-[#252A34]">
              Confirm Payment Settlement
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Invoice #{payingInvoice.invoiceId} • {payingInvoice.chargedCategory}
            </p>

            <div className="p-4 rounded-2xl bg-[#EAEAEA]/50 border border-gray-200 mb-4 text-xs">
              <div className="flex justify-between mb-1">
                <span className="text-gray-500">Amount Due:</span>
                <span className="font-extrabold text-base text-[#FF2E63]">
                  Rs. {(payingInvoice.categoryPrice || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Category:</span>
                <span>{payingInvoice.chargedCategory}</span>
              </div>
            </div>

            <form onSubmit={handlePay} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-[#252A34]">
                  Payment Reference / Remarks
                </label>
                <input
                  type="text"
                  value={paymentRemarks}
                  onChange={(e) => setPaymentRemarks(e.target.value)}
                  placeholder="e.g. Bank card payment / Corporate settlement"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-[#08D9D6] text-[#252A34]"
                />
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-3 rounded-xl text-[#252A34] font-bold text-xs shadow-md flex items-center justify-center gap-2 hover:shadow-lg transition-all"
                style={{
                  background: 'linear-gradient(135deg, #08D9D6 0%, #00b4b1 100%)',
                }}
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                Complete Payment (Rs. {(payingInvoice.categoryPrice || 0).toLocaleString()})
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
