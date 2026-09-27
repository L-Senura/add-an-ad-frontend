import React, { useState, useEffect } from 'react';
import {
  Receipt,
  CreditCard,
  CheckCircle2,
  Loader2,
  X,
  Printer,
  Sparkles,
  Megaphone,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { getInvoicesByClientId, recordInvoicePayment } from './financeApi';

export default function ClientInvoicesSection({ clientId = 1, companyName = 'Your Agency' }) {
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Pay Modal State
  const [payingInvoice, setPayingInvoice] = useState(null);
  const [paymentRemarks, setPaymentRemarks] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [notification, setNotification] = useState(null);

  // Receipt Preview Modal
  const [viewingReceipt, setViewingReceipt] = useState(null);

  const fetchClientInvoices = async () => {
    setIsLoading(true);
    try {
      const list = await getInvoicesByClientId(clientId);
      setInvoices(list || []);
    } catch (err) {
      console.warn('Error loading client invoices:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClientInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  const handlePay = async (e) => {
    e.preventDefault();
    if (!payingInvoice) return;

    setIsProcessing(true);
    try {
      await recordInvoicePayment(
        payingInvoice.invoiceId,
        paymentRemarks || `Client online settlement for Invoice #${payingInvoice.invoiceId}`
      );
      setNotification({
        type: 'success',
        text: `Invoice #${payingInvoice.invoiceId} successfully settled and marked as PAID!`,
      });
      setPayingInvoice(null);
      setPaymentRemarks('');
      await fetchClientInvoices();
    } catch (err) {
      setNotification({
        type: 'error',
        text: err.message || 'Payment processing failed.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Aggregated totals for this client
  const totalBilled = invoices.reduce((sum, i) => sum + (Number(i.categoryPrice) || 0), 0);
  const pendingAmount = invoices
    .filter((i) => i.paymentStatus?.toUpperCase() !== 'PAID')
    .reduce((sum, i) => sum + (Number(i.categoryPrice) || 0), 0);
  const platformAmount = invoices
    .filter((i) => i.chargedCategory === 'Platform Charges')
    .reduce((sum, i) => sum + (Number(i.categoryPrice) || 0), 0);
  const campaignAmount = invoices
    .filter((i) => i.chargedCategory === 'Campaign Charges')
    .reduce((sum, i) => sum + (Number(i.categoryPrice) || 0), 0);

  // Filtered invoices
  const displayedInvoices = invoices.filter((inv) => {
    const matchesCategory =
      filterCategory === 'ALL' || inv.chargedCategory === filterCategory;
    const matchesStatus =
      filterStatus === 'ALL' || inv.paymentStatus?.toUpperCase() === filterStatus;
    return matchesCategory && matchesStatus;
  });

  return (
    <div className="rounded-[32px] p-6 sm:p-8 bg-white border border-gray-200 shadow-md transition-all">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 mb-5 border-b border-gray-100 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-[#08D9D6]" />
            <h3 className="text-xl font-bold text-[#252A34]">
              Client Billing & Invoices Portal
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#08D9D6]/15 text-[#008280] border border-[#08D9D6]/30 uppercase">
              Client #{clientId}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Platform service fees and multi-channel campaign charges generated for {companyName}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200">
            <span className="text-gray-400 mr-1.5">Total Billed:</span>
            <span className="font-extrabold text-[#252A34]">
              Rs. {totalBilled.toLocaleString()}
            </span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-[#FF2E63]/10 border border-[#FF2E63]/25">
            <span className="text-gray-500 mr-1.5">Pending Balance:</span>
            <span className="font-extrabold text-[#FF2E63]">
              Rs. {pendingAmount.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Mini Category Spend Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase text-gray-500">Invoices</span>
            <Receipt className="w-3.5 h-3.5 text-gray-400" />
          </div>
          <span className="text-lg font-bold text-[#252A34]">{invoices.length}</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#08D9D6]/5 border border-[#08D9D6]/20">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase text-gray-500">Platform Fees</span>
            <Sparkles className="w-3.5 h-3.5 text-[#08D9D6]" />
          </div>
          <span className="text-lg font-bold text-[#252A34]">
            Rs. {platformAmount.toLocaleString()}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#FF2E63]/5 border border-[#FF2E63]/20">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase text-gray-500">Campaign Spend</span>
            <Megaphone className="w-3.5 h-3.5 text-[#FF2E63]" />
          </div>
          <span className="text-lg font-bold text-[#252A34]">
            Rs. {campaignAmount.toLocaleString()}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-gray-200">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase text-gray-500">Settled Invoices</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-[#008280]" />
          </div>
          <span className="text-lg font-bold text-[#008280]">
            {invoices.filter((i) => i.paymentStatus?.toUpperCase() === 'PAID').length} Paid
          </span>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div
          className={`mb-4 p-3.5 rounded-2xl flex items-center justify-between border text-xs animate-fade-in ${
            notification.type === 'success'
              ? 'bg-[#08D9D6]/10 border-[#08D9D6] text-[#252A34]'
              : 'bg-[#FF2E63]/10 border-[#FF2E63] text-[#FF2E63]'
          }`}
        >
          <div className="flex items-center gap-2 font-semibold">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-[#08D9D6]" />
            ) : (
              <AlertCircle className="w-4 h-4 text-[#FF2E63]" />
            )}
            <span>{notification.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter Options */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold bg-gray-50 text-[#252A34]"
          >
            <option value="ALL">All Categories</option>
            <option value="Platform Charges">Platform Charges</option>
            <option value="Campaign Charges">Campaign Charges</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold bg-gray-50 text-[#252A34]"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">PENDING</option>
            <option value="PAID">PAID</option>
          </select>
        </div>

        <button
          type="button"
          onClick={fetchClientInvoices}
          disabled={isLoading}
          className="text-xs font-semibold text-gray-500 hover:text-[#252A34] cursor-pointer"
        >
          Refresh Invoices
        </button>
      </div>

      {/* Invoices List */}
      {isLoading ? (
        <div className="py-12 text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#08D9D6]" />
          <p className="text-xs text-gray-400 mt-2">Loading invoice records...</p>
        </div>
      ) : displayedInvoices.length === 0 ? (
        <div className="py-8 text-center text-gray-400 text-xs">
          No invoices match the selected filter. Invoices will automatically generate when campaigns and platform services are activated.
        </div>
      ) : (
        <div className="space-y-3">
          {displayedInvoices.map((inv) => {
            const isPaid = inv.paymentStatus?.toUpperCase() === 'PAID';
            return (
              <div
                key={inv.invoiceId}
                className="p-4 rounded-2xl border border-gray-200 bg-[#EAEAEA]/30 hover:bg-[#EAEAEA]/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-extrabold text-xs text-[#252A34]">
                      Invoice #{inv.invoiceId}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                        inv.chargedCategory === 'Platform Charges'
                          ? 'bg-[#08D9D6]/15 text-[#252A34] border-[#08D9D6]/30'
                          : 'bg-[#FF2E63]/10 text-[#FF2E63] border-[#FF2E63]/25'
                      }`}
                    >
                      {inv.chargedCategory}
                    </span>
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                        isPaid
                          ? 'bg-[#08D9D6]/20 text-[#008280] border border-[#08D9D6]/40'
                          : 'bg-[#FF2E63]/15 text-[#FF2E63] border border-[#FF2E63]/30'
                      }`}
                    >
                      {inv.paymentStatus}
                    </span>
                  </div>

                  <p className="text-xs text-gray-600">
                    {inv.clientDescription || 'Platform advertising charges'}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-400">
                    {inv.campaignId && <span>Campaign #{inv.campaignId}</span>}
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : 'Recent'}
                    </span>
                    {inv.payedDatetime && (
                      <span className="text-[#008280]">
                        Paid on {new Date(inv.payedDatetime).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-200">
                  <span
                    className={`text-base font-extrabold ${
                      isPaid ? 'text-[#252A34]' : 'text-[#FF2E63]'
                    }`}
                  >
                    Rs. {(inv.categoryPrice || 0).toLocaleString()}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {/* View Receipt */}
                    <button
                      type="button"
                      onClick={() => setViewingReceipt(inv)}
                      className="px-2.5 py-1 rounded-xl text-xs font-semibold border border-gray-300 hover:border-[#08D9D6] text-[#252A34] hover:bg-white flex items-center gap-1 cursor-pointer"
                      title="View Receipt"
                    >
                      <Receipt className="w-3.5 h-3.5 text-[#08D9D6]" />
                      <span className="hidden sm:inline">Receipt</span>
                    </button>

                    {/* Pay Now Button */}
                    {!isPaid && (
                      <button
                        type="button"
                        onClick={() => {
                          setPayingInvoice(inv);
                          setPaymentRemarks(`Client settlement for Invoice #${inv.invoiceId}`);
                        }}
                        className="px-3.5 py-1 rounded-xl font-bold text-xs text-[#252A34] shadow-xs hover:shadow-sm cursor-pointer"
                        style={{
                          background: 'linear-gradient(135deg, #08D9D6 0%, #00b4b1 100%)',
                        }}
                      >
                        Pay Now
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pay Settlement Modal (PUT /api/finance/invoice/{invoiceId}/pay) */}
      {payingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="rounded-[32px] p-6 sm:p-8 bg-white border border-gray-200 shadow-2xl max-w-md w-full relative">
            <button
              type="button"
              onClick={() => setPayingInvoice(null)}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 cursor-pointer"
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
                className="w-full py-3 rounded-xl text-[#252A34] font-bold text-xs shadow-md flex items-center justify-center gap-2 hover:shadow-lg transition-all cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, #08D9D6 0%, #00b4b1 100%)',
                }}
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CreditCard className="w-4 h-4" />
                )}
                <span>
                  Complete Payment (Rs. {(payingInvoice.categoryPrice || 0).toLocaleString()})
                </span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {viewingReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="rounded-[32px] p-6 sm:p-8 bg-white border border-gray-200 shadow-2xl max-w-lg w-full relative">
            <button
              type="button"
              onClick={() => setViewingReceipt(null)}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center pb-4 border-b border-gray-200 mb-4">
              <div
                className="w-10 h-10 mx-auto rounded-xl flex items-center justify-center font-bold text-[#252A34] mb-2"
                style={{ background: 'linear-gradient(135deg, #08D9D6 0%, #FF2E63 100%)' }}
              >
                AD
              </div>
              <h3 className="font-extrabold text-lg text-[#252A34]">Add-an-Ad Agency Receipt</h3>
              <p className="text-xs text-gray-500">Official Platform & Campaign Billing Document</p>
            </div>

            <div className="space-y-2 text-xs mb-6">
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Invoice Number:</span>
                <span className="font-bold text-[#252A34]">#INV-{viewingReceipt.invoiceId}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Billed Agency Client:</span>
                <span className="font-bold text-[#252A34]">{companyName} (Client #{clientId})</span>
              </div>
              {viewingReceipt.campaignId && (
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Associated Campaign:</span>
                  <span className="font-bold text-[#252A34]">
                    Campaign #{viewingReceipt.campaignId}
                  </span>
                </div>
              )}
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Charge Category:</span>
                <span className="font-bold text-[#252A34]">{viewingReceipt.chargedCategory}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Payment Status:</span>
                <span
                  className="font-bold uppercase px-2 py-0.5 rounded-full text-[10px]"
                  style={{
                    backgroundColor:
                      viewingReceipt.paymentStatus?.toUpperCase() === 'PAID'
                        ? 'rgba(8, 217, 214, 0.2)'
                        : 'rgba(255, 46, 99, 0.15)',
                    color:
                      viewingReceipt.paymentStatus?.toUpperCase() === 'PAID' ? '#008280' : '#FF2E63',
                  }}
                >
                  {viewingReceipt.paymentStatus}
                </span>
              </div>
              {viewingReceipt.payedDatetime && (
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Paid On:</span>
                  <span className="text-gray-700">
                    {new Date(viewingReceipt.payedDatetime).toLocaleString()}
                  </span>
                </div>
              )}
              <div className="pt-2">
                <span className="text-gray-500 block mb-1">Description:</span>
                <p className="p-3 rounded-xl bg-[#EAEAEA]/50 border border-gray-200 text-gray-700">
                  {viewingReceipt.clientDescription || 'Advertising agency services rendered.'}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#EAEAEA]/50 border border-gray-200 mb-6 flex items-center justify-between">
              <span className="font-bold text-sm text-[#252A34]">Total Amount:</span>
              <span className="text-2xl font-extrabold text-[#FF2E63]">
                Rs. {(viewingReceipt.categoryPrice || 0).toLocaleString()}
              </span>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 font-bold text-xs flex items-center justify-center gap-2 hover:bg-gray-50 text-[#252A34] cursor-pointer"
              >
                <Printer className="w-4 h-4 text-[#252A34]" />
                Print Slip
              </button>
              <button
                type="button"
                onClick={() => setViewingReceipt(null)}
                className="flex-1 py-2.5 rounded-xl font-bold text-xs text-white bg-[#252A34] hover:bg-[#1a1e26] transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
