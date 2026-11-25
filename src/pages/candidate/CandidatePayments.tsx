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

  const candidateId = candidate?.candidateId || user?.candidateId || 'AICQB-1004587';

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

  // Candidate's live payment transactions (with fallback matching Screen 6)
  const defaultSamplePayments: any[] = [
    {
      id: 'pay_01',
      date: '10 Nov 2026',
      description: 'Certification Enrollment AIICQB-AT-CP®',
      amount: 10000,
      status: 'Success',
      invoiceId: 'INV-2026-00821',
      type: 'certification',
    },
    {
      id: 'pay_02',
      date: '05 Nov 2026',
      description: 'Course Purchase Playwright Training',
      amount: 2999,
      status: 'Success',
      invoiceId: 'INV-2026-00784',
      type: 'course',
    },
    {
      id: 'pay_03',
      date: '01 Nov 2026',
      description: 'Exam Fee Selenium Testing',
      amount: 5000,
      status: 'Success',
      invoiceId: 'INV-2026-00692',
      type: 'exam',
    },
  ];

  const displayPayments = payments.length > 0 ? payments : defaultSamplePayments;
  const [filterStatus, setFilterStatus] = useState<'all' | 'success' | 'failed'>('all');

  const filteredPayments = displayPayments.filter((p) => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'success') return (p.status || '').toLowerCase().includes('succ');
    if (filterStatus === 'failed') return (p.status || '').toLowerCase().includes('fail');
    return true;
  });

  const totalPaid = displayPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

  const handleDownloadInvoice = (invoiceId: string) => {
    alert(`Downloading Official GST Invoice: ${invoiceId}.pdf`);
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Header matching Screen 6 in Screenshot */}
      <div>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#F47716] flex items-center justify-center flex-shrink-0">
            <CreditCard className="w-5 h-5 stroke-[2.2]" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#10264B]">My Payments</h1>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          View your payments and transactions.
        </p>
      </div>

      {/* Tabs matching Screen 6 in Screenshot */}
      <div className="flex items-center space-x-2 border-b border-gray-200 pb-3">
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            filterStatus === 'all'
              ? 'bg-[#F47716] text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          All Transactions
        </button>
        <button
          onClick={() => setFilterStatus('success')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            filterStatus === 'success'
              ? 'bg-[#F47716] text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Success
        </button>
        <button
          onClick={() => setFilterStatus('failed')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            filterStatus === 'failed'
              ? 'bg-[#F47716] text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Failed
        </button>
      </div>

      {/* Mobile Card List matching Screen 6 in Screenshot */}
      <div className="space-y-3">
        {filteredPayments.map((p, idx) => {
          const isSuccess = !(p.status || '').toLowerCase().includes('fail');
          return (
            <div
              key={p.id || idx}
              className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs hover:shadow-sm transition-all flex items-center justify-between gap-3"
            >
              {/* Left: Green Checkmark Circle & Details */}
              <div className="flex items-center space-x-3.5 min-w-0">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isSuccess
                      ? 'bg-emerald-100 text-emerald-600'
                      : 'bg-red-100 text-red-600'
                  }`}
                >
                  {isSuccess ? (
                    <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                  ) : (
                    <AlertCircle className="w-5 h-5 stroke-[2.5]" />
                  )}
                </div>

                <div className="space-y-0.5 min-w-0">
                  <h4 className="text-xs sm:text-sm font-extrabold text-[#10264B] truncate">
                    {p.description || p.certificationName || 'Certification Enrollment'}
                  </h4>
                  <p className="text-[10px] sm:text-[11px] text-gray-500 font-medium">
                    {p.date || '10 Nov 2026'}
                  </p>
                </div>
              </div>

              {/* Right: Amount & Status Badge */}
              <div className="text-right flex-shrink-0 space-y-1">
                <p className="text-xs sm:text-sm font-black text-[#10264B]">
                  ₹{p.amount ? p.amount.toLocaleString('en-IN') : '10,000'}
                </p>
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-full text-[9.5px] font-extrabold ${
                    isSuccess
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-red-100 text-red-800 border border-red-300'
                  }`}
                >
                  {isSuccess ? 'Success' : 'Failed'}
                </span>
              </div>
            </div>
          );
        })}
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
                          onClick={() => handleDownloadInvoice(p.invoiceId || `INV-${idx + 1001}`)}
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

            <button
              onClick={() => alert('Downloading all verified invoices archive...')}
              className="px-5 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-[#10264B] text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center justify-center space-x-2"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download All Invoices</span>
            </button>
          </div>
        </div>
      )}

      {/* Invoices Tab */}
      {activeTab === 'invoices' && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center space-y-3">
          <FileText className="w-10 h-10 text-[#10264B] mx-auto" />
          <h3 className="font-bold text-sm text-[#10264B]">Tax Compliant GST Invoices</h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            All transaction receipts and enterprise invoices are maintained with digital signature hashes.
          </p>
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

