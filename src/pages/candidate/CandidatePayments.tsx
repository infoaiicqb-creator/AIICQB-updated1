import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Payment } from '../../types';
import { CreditCard, Download, CheckCircle2, AlertCircle, Clock, FileText, ArrowRight, Loader2 } from 'lucide-react';

export const CandidatePayments: React.FC = () => {
  const { user, candidate } = useAuth();
  const [payments, setPayments] = useState<Payment[]>(() => {
    try {
      const p = localStorage.getItem('aicqb_my_payments');
      return p ? JSON.parse(p) : [];
    } catch (_) {
      return [];
    }
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'history' | 'invoices' | 'methods'>('history');

  const candidateId = candidate?.candidateId || user?.candidateId || '';

  useEffect(() => {
    if (candidateId) {
      loadPayments();
    }
  }, [candidateId]);

  const loadPayments = async () => {
    try {
      const res = await api.getCandidatePayments(candidateId);
      if (res.success && res.payments) {
        setPayments(res.payments);
        try { localStorage.setItem('aicqb_my_payments', JSON.stringify(res.payments)); } catch (_) { }
      }
    } catch (err) {
      console.error('Failed to load payments:', err);
    } finally {
      setLoading(false);
    }
  };

  // Candidate's live payment transactions (Strict fresh data isolation)
  const displayPayments = payments;

  const totalPaid = displayPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

  const handleDownloadInvoice = (payment: Payment) => {
    const invoiceNum = payment.invoiceId || `INV-${(payment.id || 'TXN').slice(-6).toUpperCase()}`;
    const invoiceWindow = window.open('', '_blank');
    if (!invoiceWindow) {
      alert(`Downloading Official GST Invoice: ${invoiceNum}.pdf`);
      return;
    }
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>AIICQB Tax Invoice - ${invoiceNum}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 40px; color: #1e293b; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #10264b; padding-bottom: 20px; }
            .title { font-size: 24px; font-weight: 900; color: #10264b; }
            .subtitle { font-size: 13px; color: #64748b; margin-top: 4px; }
            .invoice-details { margin-top: 30px; display: flex; justify-content: space-between; }
            .box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; font-size: 13px; width: 45%; }
            .table { width: 100%; border-collapse: collapse; margin-top: 30px; font-size: 13px; }
            .table th { background: #10264b; color: white; text-align: left; padding: 10px 14px; font-weight: 700; }
            .table td { padding: 12px 14px; border-bottom: 1px solid #e2e8f0; }
            .total-row { font-weight: 800; font-size: 15px; color: #10264b; }
            .footer { margin-top: 50px; font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 15px; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">AIICQB</div>
              <div class="subtitle">AI International Certification & Qualification Board</div>
              <div class="subtitle">GSTIN: 27AABCA1234F1Z8 | info@aiicqb.org</div>
            </div>
            <div style="text-align: right;">
              <h2 style="margin: 0; color: #f47716;">TAX INVOICE</h2>
              <div style="font-size: 13px; font-weight: bold; margin-top: 5px;">${invoiceNum}</div>
              <div style="font-size: 12px; color: #64748b;">Date: ${payment.date || new Date().toLocaleDateString('en-IN')}</div>
            </div>
          </div>
          <div class="invoice-details">
            <div class="box">
              <strong>Billed To:</strong><br>
              ${user?.fullName || candidate?.fullName || 'Candidate'}<br>
              Candidate ID: ${candidateId || 'N/A'}<br>
              Email: ${user?.email || candidate?.email || 'N/A'}
            </div>
            <div class="box">
              <strong>Payment Summary:</strong><br>
              Payment ID: ${payment.razorpayPaymentId || payment.id || 'N/A'}<br>
              Status: <strong>${payment.status || 'Successful'}</strong><br>
              Payment Gateway: Razorpay Secure
            </div>
          </div>
          <table class="table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Level</th>
                <th>Qty</th>
                <th style="text-align: right;">Amount (INR)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>${payment.certificationName || payment.description || 'International Certification Assessment'}</strong></td>
                <td>${payment.certificationLevel || (payment as any).examLevel || 'Standard'}</td>
                <td>1</td>
                <td style="text-align: right;">₹${(payment.amount || 0).toLocaleString('en-IN')}</td>
              </tr>
              <tr class="total-row">
                <td colspan="3" style="text-align: right;">Total Paid:</td>
                <td style="text-align: right;">₹${(payment.amount || 0).toLocaleString('en-IN')}</td>
              </tr>
            </tbody>
          </table>
          <div class="no-print" style="margin-top: 30px; text-align: center;">
            <button onclick="window.print()" style="background: #10264b; color: white; padding: 10px 24px; border: none; border-radius: 6px; font-weight: bold; cursor: pointer;">Print / Save as PDF</button>
          </div>
          <div class="footer">
            This is a computer-generated tax invoice issued by the AI International Certification & Qualification Board (AIICQB).
          </div>
        </body>
      </html>
    `;
    invoiceWindow.document.write(htmlContent);
    invoiceWindow.document.close();
  };

  return (
    <div className="space-y-6">
      {/* Header matching Image 2 #8 */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-[#10264B]">Payments</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Manage your transactions, invoices and subscriptions.
        </p>
      </div>

      {/* Tabs matching Image 2 #8 */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-3">
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'history'
            ? 'bg-[#F47716] text-white shadow-sm'
            : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
        >
          Transaction History
        </button>
        <button
          onClick={() => setActiveTab('invoices')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'invoices'
            ? 'bg-[#F47716] text-white shadow-sm'
            : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
        >
          Invoices
        </button>
        <button
          onClick={() => setActiveTab('methods')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'methods'
            ? 'bg-[#F47716] text-white shadow-sm'
            : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
        >
          Payment Methods
        </button>
      </div>

      {/* Payments Table matching Image 2 #8 */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-xs">
              <thead className="bg-slate-50 text-gray-600 font-semibold uppercase tracking-wider text-[11px] border-b border-gray-200">
                <tr>
                  <th className="py-3.5 px-6">Date</th>
                  <th className="py-3.5 px-6">Description</th>
                  <th className="py-3.5 px-6">Amount</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {displayPayments.length > 0 ? (
                  displayPayments.map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6 text-gray-600 font-medium">{p.date || 'Today'}</td>
                      <td className="py-4 px-6 font-bold text-[#10264B]">
                        {p.description || p.certificationName || 'AICQB Certification'}
                      </td>
                      <td className="py-4 px-6 font-extrabold text-[#10264B]">
                        ₹ {p.amount ? p.amount.toLocaleString('en-IN') : '0'}
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-200">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          {p.status || 'Successful'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => handleDownloadInvoice(p)}
                          className="p-1.5 rounded-md text-gray-500 hover:text-[#10264B] hover:bg-gray-100 transition-colors"
                          title="Download Invoice PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-gray-500">
                      <CreditCard className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                      <p className="font-bold text-[#10264B] text-sm">No Payment Transactions</p>
                      <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                        Transaction receipts and tax invoices will appear here after you enroll in certification programs.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Bottom Card Summary matching Image 2 #8 */}
          <div className="p-6 bg-slate-50 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#F47716] flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-gray-500 font-medium">Total Payments</p>
                <p className="text-xl font-black text-[#10264B]">₹ {totalPaid.toLocaleString('en-IN')}</p>
              </div>
            </div>

            {displayPayments.length > 0 && (
              <button
                onClick={() => displayPayments[0] && handleDownloadInvoice(displayPayments[0])}
                className="px-5 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-[#10264B] text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center justify-center space-x-2"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Latest Invoice</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Invoices Tab */}
      {activeTab === 'invoices' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {displayPayments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-left text-xs">
                <thead className="bg-slate-50 text-gray-600 font-semibold uppercase tracking-wider text-[11px] border-b border-gray-200">
                  <tr>
                    <th className="py-3.5 px-6">Invoice No</th>
                    <th className="py-3.5 px-6">Issue Date</th>
                    <th className="py-3.5 px-6">Certification Item</th>
                    <th className="py-3.5 px-6">Total Amount</th>
                    <th className="py-3.5 px-6 text-right">Tax Invoice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {displayPayments.map((p, idx) => {
                    const invoiceNum = p.invoiceId || `INV-${(p.id || 'TXN').slice(-6).toUpperCase()}`;
                    return (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-6 font-mono font-bold text-[#10264B]">{invoiceNum}</td>
                        <td className="py-4 px-6 text-gray-600 font-medium">{p.date || 'Today'}</td>
                        <td className="py-4 px-6 font-bold text-[#10264B]">
                          {p.certificationName || p.description || 'AIICQB Assessment'}
                        </td>
                        <td className="py-4 px-6 font-extrabold text-[#10264B]">
                          ₹ {p.amount ? p.amount.toLocaleString('en-IN') : '0'}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => handleDownloadInvoice(p)}
                            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-[#F47716] rounded-md font-bold text-xs transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>PDF</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center space-y-3">
              <FileText className="w-12 h-12 text-gray-300 mx-auto" />
              <h3 className="font-bold text-base text-[#10264B]">No Invoices Found</h3>
              <p className="text-xs text-gray-400 max-w-md mx-auto">
                Official GST-compliant tax invoices are generated automatically upon successful enrollment payment.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Payment Methods Tab */}
      {activeTab === 'methods' && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center space-y-3">
          <CreditCard className="w-10 h-10 text-[#F47716] mx-auto" />
          <h3 className="font-bold text-sm text-[#10264B]">Secured via Razorpay</h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            Payments are processed securely via 256-bit encrypted Razorpay Checkout. Card numbers and CVVs are never stored on AICQB servers.
          </p>
        </div>
      )}
    </div>
  );
};

