import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { AdminPagination } from '../../components/AdminPagination';
import {
  CreditCard,
  DollarSign,
  ArrowUpRight,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Download,
  Filter,
  Search,
  Globe2,
  Clock,
  XCircle,
  FileSpreadsheet,
  Trash2,
  Edit2,
  Eye,
  Plus,
  X,
  RefreshCw,
  Building2,
  User,
  ShieldCheck,
} from 'lucide-react';

export const AdminFinance: React.FC = () => {
  const [financeData, setFinanceData] = useState<any>(() => {
    try {
      const c = localStorage.getItem('aicqb_admin_finance');
      return c ? JSON.parse(c) : null;
    } catch (_) {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filterTab, setFilterTab] = useState<'all' | 'success' | 'failed' | 'pending' | 'inr' | 'usd'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<any | null>(null);
  const [viewingPayment, setViewingPayment] = useState<any | null>(null);

  // Toast notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Add / Edit Form State
  const [formData, setFormData] = useState({
    candidateName: '',
    candidateEmail: '',
    country: 'India',
    certificationName: 'AICQB Certified AI Professional',
    certificationLevel: 'Professional Level',
    amount: 4500,
    currency: 'INR',
    paymentStatus: 'success',
    razorpayOrderId: '',
    razorpayPaymentId: '',
  });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    loadFinance();
  }, []);

  const loadFinance = async () => {
    try {
      if (!financeData) setLoading(true);
      const res = await api.getAdminPayments();
      if (res.success) {
        setFinanceData(res);
        try { localStorage.setItem('aicqb_admin_finance', JSON.stringify(res)); } catch (_) { }
      }
    } catch (err) {
      console.error('Failed to load finance data:', err);
      showToast('Failed to load real finance records', 'error');
    } finally {
      setLoading(false);
    }
  };

  const rawPayments = financeData?.payments || [];

  // Dynamic real-time revenue computation from real database payments
  const successfulPayments = rawPayments.filter((p: any) => {
    const s = (p.paymentStatus || p.payment_status || p.status || '').toLowerCase();
    return s === 'success' || s === 'successful';
  });

  const totalRevenue = successfulPayments.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const thisMonthRevenue = successfulPayments
    .filter((p: any) => {
      const d = p.paidAt || p.createdAt || p.created_at;
      if (!d) return false;
      const dt = new Date(d);
      return dt.getMonth() === currentMonth && dt.getFullYear() === currentYear;
    })
    .reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);

  const totalTransactions = rawPayments.length;

  // Filter payments according to required tabs & search query
  const filteredPayments = rawPayments.filter((p: any) => {
    const matchesSearch =
      searchTerm === '' ||
      (p.candidateName || p.candidate_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.candidateEmail || p.candidate_email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.paymentId || p.payment_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.certificationName || p.certification_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.razorpayOrderId || p.razorpay_order_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.razorpayPaymentId || p.razorpay_payment_id || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    const status = (p.paymentStatus || p.payment_status || p.status || '').toLowerCase();
    const isSuccess = status === 'success' || status === 'successful';
    const isFailed = status === 'failed';
    const isPending = status === 'pending';
    const isINR = (p.currency || 'INR').toUpperCase() === 'INR' || (p.country || '').toLowerCase() === 'india';
    const isUSD = (p.currency || '').toUpperCase() === 'USD' || (p.country && p.country.toLowerCase() !== 'india');

    if (filterTab === 'success') return isSuccess;
    if (filterTab === 'failed') return isFailed;
    if (filterTab === 'pending') return isPending;
    if (filterTab === 'inr') return isINR;
    if (filterTab === 'usd') return isUSD;
    return true; // 'all'
  });

  // DELETE Payment (Instant deletion without popup, optimistic UI + toast)
  const handleDeletePayment = async (payment: any) => {
    const targetId = payment.id || payment.paymentId || payment.razorpayOrderId || payment.razorpayPaymentId;
    if (!targetId) return;

    // Optimistic UI update
    setFinanceData((prev: any) => ({
      ...prev,
      payments: (prev?.payments || []).filter(
        (p: any) =>
          p.id !== targetId &&
          p.paymentId !== targetId &&
          p.razorpayOrderId !== targetId &&
          p.razorpayPaymentId !== targetId
      ),
    }));

    showToast(`Payment record ${payment.razorpayPaymentId || targetId} deleted successfully.`);

    try {
      const res = await api.deleteAdminPayment(targetId);
      if (!res.success) {
        showToast(res.message || 'Failed to delete payment from server', 'error');
        await loadFinance();
      }
    } catch (err: any) {
      console.error('Delete error:', err);
      showToast(err.message || 'Error deleting payment record', 'error');
      await loadFinance();
    }
  };

  // Open Edit Payment Modal
  const handleOpenEdit = (p: any) => {
    setEditingPayment(p);
    const curStatus = (p.paymentStatus || p.payment_status || p.status || 'pending').toLowerCase();
    setFormData({
      candidateName: p.candidateName || p.candidate_name || '',
      candidateEmail: p.candidateEmail || p.candidate_email || '',
      country: p.country || 'India',
      certificationName: p.certificationName || p.certification_name || 'AICQB Certified AI Professional',
      certificationLevel: p.certificationLevel || p.certification_level || 'Professional Level',
      amount: Number(p.amount) || 4500,
      currency: (p.currency || 'INR').toUpperCase(),
      paymentStatus: curStatus === 'successful' ? 'success' : curStatus,
      razorpayOrderId: p.razorpayOrderId || p.razorpay_order_id || '',
      razorpayPaymentId: p.razorpayPaymentId || p.razorpay_payment_id || '',
    });
  };

  // Save Edited Payment
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPayment) return;

    const targetId = editingPayment.id || editingPayment.paymentId;
    try {
      setSaving(true);
      const res = await api.updateAdminPayment(targetId, {
        ...formData,
        status: formData.paymentStatus === 'success' ? 'Successful' : formData.paymentStatus === 'failed' ? 'Failed' : 'Pending',
      });
      if (res.success) {
        showToast('Payment record updated successfully!');
        setEditingPayment(null);
        await loadFinance();
      } else {
        showToast(res.message || 'Failed to update payment', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error updating payment', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Open Record Manual Payment Modal
  const handleOpenAdd = () => {
    const ts = Date.now();
    setFormData({
      candidateName: '',
      candidateEmail: '',
      country: 'India',
      certificationName: 'AICQB Certified AI Professional',
      certificationLevel: 'Professional Level',
      amount: 4500,
      currency: 'INR',
      paymentStatus: 'success',
      razorpayOrderId: `order_man_${ts}`,
      razorpayPaymentId: `pay_man_${ts}`,
    });
    setIsAddOpen(true);
  };

  // Save New Manual Payment
  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.candidateName.trim() || !formData.candidateEmail.trim()) {
      showToast('Candidate name and email are required', 'error');
      return;
    }

    try {
      setSaving(true);
      const res = await api.createAdminPayment(formData);
      if (res.success) {
        showToast('Payment recorded successfully!');
        setIsAddOpen(false);
        await loadFinance();
      } else {
        showToast(res.message || 'Failed to record payment', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error recording payment', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleRefund = async (paymentId: string) => {
    const reason = prompt('Enter reason for processing refund via Razorpay:');
    if (!reason) return;
    try {
      await api.processRefund({ paymentId, reason });
      showToast('Refund processed successfully');
      loadFinance();
    } catch (err: any) {
      showToast(err.message || 'Refund failed', 'error');
    }
  };

  // Export to Excel / CSV format
  const handleExportExcel = () => {
    if (!filteredPayments || filteredPayments.length === 0) {
      showToast('No payment records to export.', 'error');
      return;
    }

    const headers = [
      'Candidate Name',
      'Email',
      'Country',
      'Certification',
      'Certification Level',
      'Payment Amount',
      'Currency',
      'Razorpay Order ID',
      'Razorpay Payment ID',
      'Payment Status',
      'Transaction Date',
    ];

    const rows = filteredPayments.map((p: any) => [
      `"${p.candidateName || p.candidate_name || 'Candidate'}"`,
      `"${p.candidateEmail || p.candidate_email || 'N/A'}"`,
      `"${p.country || 'India'}"`,
      `"${p.certificationName || p.certification_name || 'N/A'}"`,
      `"${p.certificationLevel || p.certification_level || 'Professional Level'}"`,
      p.amount || 0,
      p.currency || 'INR',
      `"${p.razorpayOrderId || p.razorpay_order_id || 'N/A'}"`,
      `"${p.razorpayPaymentId || p.razorpay_payment_id || 'N/A'}"`,
      `"${p.paymentStatus || p.payment_status || p.status || 'pending'}"`,
      `"${p.paidAt || p.createdAt || p.created_at || 'N/A'}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `AICQB_Payments_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-[1000] px-5 py-3.5 rounded-2xl shadow-2xl border text-xs font-bold flex items-center space-x-2.5 animate-in slide-in-from-bottom duration-200 ${toast.type === 'success'
            ? 'bg-emerald-950 text-emerald-100 border-emerald-500/50 shadow-emerald-950/40'
            : 'bg-red-950 text-red-100 border-red-500/50 shadow-red-950/40'
            }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-[#10264B]">Finance & Payment Management</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#10264B]/10 text-[#10264B]">
              CRUD Active
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Monitor real-time Razorpay orders, international payments, candidate enrollments, and reconciliation.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            onClick={loadFinance}
            disabled={loading}
            className="p-2 sm:p-2.5 bg-white border border-gray-300 hover:border-[#10264B] text-gray-600 rounded-xl hover:text-[#10264B] transition-all cursor-pointer shadow-xs"
            title="Refresh Payments"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-3.5 sm:px-4 py-2 sm:py-2.5 bg-[#F47716] hover:bg-[#DC660E] text-white font-extrabold text-xs rounded-xl shadow-md hover:shadow-orange-500/25 transition-all flex items-center space-x-1.5 cursor-pointer border border-orange-400"
          >
            <Plus className="w-4 h-4" />
            <span>Record Payment</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="px-3.5 sm:px-4 py-2 sm:py-2.5 bg-[#0A1D37] hover:bg-[#142f56] text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Export to Excel</span>
            <span className="sm:hidden">Export</span>
          </button>
        </div>
      </div>

      {/* 3 Metric Summary Cards (Responsive Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Revenue</span>
            <CreditCard className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-[#10264B]">
            ₹ {totalRevenue.toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-green-600 font-bold flex items-center">
            <ArrowUpRight className="w-3 h-3 mr-0.5" /> Live Verified Collections
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-bold uppercase tracking-wider">This Month</span>
            <DollarSign className="w-4 h-4 text-[#F47716]" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-[#F47716]">
            ₹ {thisMonthRevenue.toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-gray-400 font-semibold">Active monthly run-rate</span>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-xs space-y-1 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Transactions</span>
            <Clock className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-purple-700">
            {totalTransactions.toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-green-600 font-bold flex items-center">
            <CheckCircle2 className="w-3 h-3 mr-0.5" />
            {successfulPayments.length} Successful • {rawPayments.length - successfulPayments.length} Pending/Other
          </span>
        </div>
      </div>

      {/* Payment Management Section */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Table Controls: Search + Filter Tabs */}
        <div className="p-4 sm:p-5 border-b border-gray-100 space-y-3 sm:space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-[#10264B]">
                Razorpay Payment Records & Registry
              </h3>
              <p className="text-xs text-gray-400">
                Showing {filteredPayments.length} of {rawPayments.length} total transaction entries
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search candidate, email, ID..."
                className="w-full pl-9 pr-3.5 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#F47716] font-medium bg-slate-50"
              />
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-1 border-t border-gray-100">
            {[
              { id: 'all', label: 'All Payments', count: rawPayments.length },
              {
                id: 'success',
                label: 'Successful',
                count: rawPayments.filter((p: any) => {
                  const s = (p.paymentStatus || p.payment_status || p.status || '').toLowerCase();
                  return s === 'success' || s === 'successful';
                }).length,
              },
              {
                id: 'pending',
                label: 'Pending',
                count: rawPayments.filter((p: any) => {
                  const s = (p.paymentStatus || p.payment_status || p.status || '').toLowerCase();
                  return s === 'pending';
                }).length,
              },
              {
                id: 'failed',
                label: 'Failed',
                count: rawPayments.filter((p: any) => {
                  const s = (p.paymentStatus || p.payment_status || p.status || '').toLowerCase();
                  return s === 'failed';
                }).length,
              },
              {
                id: 'inr',
                label: 'INR (₹)',
                count: rawPayments.filter((p: any) => {
                  return (p.currency || 'INR').toUpperCase() === 'INR' || (p.country || '').toLowerCase() === 'india';
                }).length,
              },
              {
                id: 'usd',
                label: 'USD ($)',
                count: rawPayments.filter((p: any) => {
                  return (p.currency || '').toUpperCase() === 'USD' || (p.country && p.country.toLowerCase() !== 'india');
                }).length,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${filterTab === tab.id
                  ? 'bg-[#10264B] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${filterTab === tab.id ? 'bg-white/20 text-white' : 'bg-white text-slate-700'
                    }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Transactions Table: Fully Responsive with Horizontal Scroll */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs whitespace-nowrap min-w-[950px]">
            <thead className="bg-slate-50 text-gray-600 font-semibold uppercase tracking-wider text-[10.5px] border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">Candidate Details</th>
                <th className="py-3 px-4">Country</th>
                <th className="py-3 px-4">Certification</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Order / Payment ID</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Actions (CRUD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    <Loader2 className="w-8 h-8 animate-spin text-[#F47716] mx-auto mb-2" />
                    <p className="text-xs font-semibold">Loading real payment records...</p>
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    <p className="text-sm font-semibold">No payment records matching this filter.</p>
                  </td>
                </tr>
              ) : (
                filteredPayments
                  .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                  .map((p: any, idx: number) => {
                    const status = (p.paymentStatus || p.payment_status || p.status || 'pending').toLowerCase();
                    const isSuccess = status === 'success' || status === 'successful';
                    const isFailed = status === 'failed';
                    const isPending = status === 'pending';
                    const cur = (p.currency || 'INR').toUpperCase();
                    const symbol = cur === 'INR' ? '₹' : '$';

                    return (
                      <tr key={p.id || p.paymentId || idx} className="hover:bg-slate-50/80 transition-colors">
                        {/* Candidate Name & Email */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-[#10264B] text-[13px]">
                            {p.candidateName || p.candidate_name || 'Candidate'}
                          </div>
                          <div className="text-gray-500 font-mono text-[11px]">
                            {p.candidateEmail || p.candidate_email || '—'}
                          </div>
                        </td>

                        {/* Country */}
                        <td className="py-3.5 px-4 font-medium text-slate-700">
                          <span className="inline-flex items-center space-x-1">
                            {p.country?.toLowerCase() === 'india' || !p.country ? (
                              <span>🇮🇳 India</span>
                            ) : (
                              <span>🌐 {p.country}</span>
                            )}
                          </span>
                        </td>

                        {/* Certification */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-[#10264B] max-w-[220px] truncate" title={p.certificationName || p.certification_name}>
                            {p.certificationName || p.certification_name || 'AI Certification'}
                          </div>
                          <span className="px-1.5 py-0.5 rounded text-[9.5px] font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                            {p.certificationLevel || p.certification_level || 'Professional Level'}
                          </span>
                        </td>

                        {/* Payment Amount & Currency */}
                        <td className="py-3.5 px-4">
                          <span className="font-black text-[#F47716] text-sm">
                            {symbol} {(p.amount || 0).toLocaleString(cur === 'INR' ? 'en-IN' : 'en-US')}
                          </span>
                          <span className="text-[10px] text-gray-400 font-bold ml-1">{cur}</span>
                        </td>

                        {/* Razorpay Order & Payment ID */}
                        <td className="py-3.5 px-4 font-mono text-[11px]">
                          <div className="text-slate-800 font-bold">
                            {p.razorpayPaymentId || p.razorpay_payment_id || p.paymentId || '—'}
                          </div>
                          <div className="text-slate-400 text-[10px]">
                            {p.razorpayOrderId || p.razorpay_order_id || '—'}
                          </div>
                        </td>

                        {/* Payment Status */}
                        <td className="py-3.5 px-4">
                          {isSuccess ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-200 inline-flex items-center space-x-1">
                              <CheckCircle2 className="w-3 h-3 text-green-600" />
                              <span>Successful</span>
                            </span>
                          ) : isFailed ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200 inline-flex items-center space-x-1">
                              <XCircle className="w-3 h-3 text-red-600" />
                              <span>Failed</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center space-x-1">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>Pending</span>
                            </span>
                          )}
                        </td>

                        {/* Transaction Date */}
                        <td className="py-3.5 px-4 text-gray-500 text-[11px] font-medium">
                          {p.paidAt || p.createdAt || p.created_at
                            ? new Date(p.paidAt || p.createdAt || p.created_at).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })
                            : '—'}
                        </td>

                        {/* Actions: View, Edit, Delete, Refund */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end space-x-1">
                            {/* View Audit */}
                            <button
                              onClick={() => setViewingPayment(p)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-[#10264B] hover:bg-slate-100 transition-colors cursor-pointer"
                              title="View Transaction Breakdown"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Edit Record */}
                            <button
                              onClick={() => handleOpenEdit(p)}
                              className="p-1.5 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors cursor-pointer"
                              title="Edit Payment Record"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            {/* Delete Record (Instant delete without popup) */}
                            <button
                              onClick={() => handleDeletePayment(p)}
                              className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                              title="Delete Payment Record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>

                            {/* Refund Button for Successful Payments */}
                            {isSuccess && (
                              <button
                                onClick={() => handleRefund(p.paymentId || p.id)}
                                className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-[10px] font-bold flex items-center space-x-1 cursor-pointer transition-colors"
                                title="Process Razorpay Refund"
                              >
                                <RotateCcw className="w-3 h-3 text-amber-600" />
                                <span>Refund</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
              )}
            </tbody>
          </table>
        </div>

        <AdminPagination
          currentPage={currentPage}
          totalRecords={filteredPayments.length}
          pageSize={pageSize}
          onPageChange={(page) => setCurrentPage(page)}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
          pageSizeOptions={[10, 25, 50, 100]}
        />
      </div>

      {/* ======================================================== */}
      {/* ADD / RECORD MANUAL PAYMENT MODAL                        */}
      {/* ======================================================== */}
      {isAddOpen && (
        <div className="fixed inset-0 z-[10000] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden transform animate-in zoom-in-95 duration-150">
            <div className="bg-[#10264B] px-6 py-5 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-[#F47716]/20 border border-[#F47716]/40 flex items-center justify-center text-[#F47716]">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white leading-tight">Record Payment Transaction</h3>
                  <p className="text-xs text-slate-300">Add an offline, direct, or verified Razorpay order</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdd} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Candidate Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.candidateName}
                    onChange={(e) => setFormData({ ...formData, candidateName: e.target.value })}
                    placeholder="e.g. Rahul Deshmukh"
                    className="w-full px-3 py-2 bg-slate-50 border border-gray-300 rounded-xl font-medium focus:outline-none focus:ring-1 focus:ring-[#F47716]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Candidate Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.candidateEmail}
                    onChange={(e) => setFormData({ ...formData, candidateEmail: e.target.value })}
                    placeholder="e.g. candidate@gmail.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-gray-300 rounded-xl font-medium focus:outline-none focus:ring-1 focus:ring-[#F47716]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Certification Name</label>
                  <select
                    value={formData.certificationName}
                    onChange={(e) => setFormData({ ...formData, certificationName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-gray-300 rounded-xl font-medium focus:outline-none focus:ring-1 focus:ring-[#F47716]"
                  >
                    <option value="AICQB Certified AI Professional">AICQB Certified AI Professional</option>
                    <option value="AICQB Certified Software Tester">AICQB Certified Software Tester</option>
                    <option value="AICQB Certified Playwright Automation">AICQB Certified Playwright Automation</option>
                    <option value="AICQB Certified Data Science Professional">AICQB Certified Data Science Professional</option>
                    <option value="AICQB Certified Cybersecurity Specialist">AICQB Certified Cybersecurity Specialist</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Certification Level</label>
                  <select
                    value={formData.certificationLevel}
                    onChange={(e) => setFormData({ ...formData, certificationLevel: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-gray-300 rounded-xl font-medium focus:outline-none focus:ring-1 focus:ring-[#F47716]"
                  >
                    <option value="Professional Level">Professional Level</option>
                    <option value="Foundation Level">Foundation Level</option>
                    <option value="Expert Level">Expert Level</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Amount *</label>
                  <input
                    type="number"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-gray-300 rounded-xl font-bold font-mono focus:outline-none focus:ring-1 focus:ring-[#F47716]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Currency</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-gray-300 rounded-xl font-bold focus:outline-none focus:ring-1 focus:ring-[#F47716]"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Payment Status</label>
                  <select
                    value={formData.paymentStatus}
                    onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-gray-300 rounded-xl font-bold focus:outline-none focus:ring-1 focus:ring-[#F47716]"
                  >
                    <option value="success">Successful</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Razorpay Order ID</label>
                  <input
                    type="text"
                    value={formData.razorpayOrderId}
                    onChange={(e) => setFormData({ ...formData, razorpayOrderId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-gray-300 rounded-xl font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-[#F47716]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Razorpay Payment ID</label>
                  <input
                    type="text"
                    value={formData.razorpayPaymentId}
                    onChange={(e) => setFormData({ ...formData, razorpayPaymentId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-gray-300 rounded-xl font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-[#F47716]"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-[#F47716] hover:bg-[#DC660E] text-white font-bold rounded-xl shadow-md transition-all disabled:opacity-50"
                >
                  {saving ? 'Recording...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* EDIT PAYMENT MODAL                                       */}
      {/* ======================================================== */}
      {editingPayment && (
        <div className="fixed inset-0 z-[10000] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden transform animate-in zoom-in-95 duration-150">
            <div className="bg-[#10264B] px-6 py-5 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white leading-tight">Edit Payment Record</h3>
                  <p className="text-xs text-slate-300">
                    Modifying {editingPayment.razorpayPaymentId || editingPayment.paymentId}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingPayment(null)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Candidate Name</label>
                  <input
                    type="text"
                    required
                    value={formData.candidateName}
                    onChange={(e) => setFormData({ ...formData, candidateName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-gray-300 rounded-xl font-medium focus:outline-none focus:ring-1 focus:ring-[#F47716]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Candidate Email</label>
                  <input
                    type="email"
                    required
                    value={formData.candidateEmail}
                    onChange={(e) => setFormData({ ...formData, candidateEmail: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-gray-300 rounded-xl font-medium focus:outline-none focus:ring-1 focus:ring-[#F47716]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Amount</label>
                  <input
                    type="number"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-gray-300 rounded-xl font-bold font-mono focus:outline-none focus:ring-1 focus:ring-[#F47716]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Currency</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-gray-300 rounded-xl font-bold focus:outline-none focus:ring-1 focus:ring-[#F47716]"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.paymentStatus}
                    onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-gray-300 rounded-xl font-bold focus:outline-none focus:ring-1 focus:ring-[#F47716]"
                  >
                    <option value="success">Successful</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Razorpay Order ID</label>
                  <input
                    type="text"
                    value={formData.razorpayOrderId}
                    onChange={(e) => setFormData({ ...formData, razorpayOrderId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-gray-300 rounded-xl font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-[#F47716]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Razorpay Payment ID</label>
                  <input
                    type="text"
                    value={formData.razorpayPaymentId}
                    onChange={(e) => setFormData({ ...formData, razorpayPaymentId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-gray-300 rounded-xl font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-[#F47716]"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingPayment(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Update Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW PAYMENT AUDIT DETAILS MODAL                         */}
      {/* ======================================================== */}
      {viewingPayment && (
        <div className="fixed inset-0 z-[10000] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden transform animate-in zoom-in-95 duration-150">
            <div className="bg-[#10264B] px-6 py-5 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white leading-tight">Payment Audit & Registry</h3>
                  <p className="text-xs text-slate-300">
                    {viewingPayment.razorpayPaymentId || viewingPayment.paymentId}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingPayment(null)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase block">Candidate</span>
                  <strong className="text-sm text-[#10264B] block">{viewingPayment.candidateName}</strong>
                  <span className="text-gray-500 font-mono text-[11px]">{viewingPayment.candidateEmail}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase block">Amount Paid</span>
                  <strong className="text-base font-black text-[#F47716] block">
                    {(viewingPayment.currency || 'INR').toUpperCase() === 'INR' ? '₹' : '$'}{' '}
                    {(viewingPayment.amount || 0).toLocaleString()} {viewingPayment.currency || 'INR'}
                  </strong>
                  <span className="text-emerald-700 font-bold text-[10px]">
                    Status: {viewingPayment.paymentStatus || viewingPayment.status}
                  </span>
                </div>
              </div>

              <div className="space-y-2 border-t pt-3">
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500 font-medium">Certification:</span>
                  <span className="font-bold text-[#10264B]">{viewingPayment.certificationName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500 font-medium">Credential Level:</span>
                  <span className="font-semibold text-slate-700">{viewingPayment.certificationLevel || 'Professional Level'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500 font-medium">Country / Jurisdiction:</span>
                  <span className="font-semibold text-slate-700">{viewingPayment.country || 'India'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100 font-mono text-[11px]">
                  <span className="text-gray-500 font-medium font-sans">Razorpay Order ID:</span>
                  <span className="text-slate-800 font-bold">{viewingPayment.razorpayOrderId || '—'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100 font-mono text-[11px]">
                  <span className="text-gray-500 font-medium font-sans">Razorpay Payment ID:</span>
                  <span className="text-slate-800 font-bold">{viewingPayment.razorpayPaymentId || '—'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-500 font-medium">Transaction Date:</span>
                  <span className="font-semibold text-slate-700">
                    {viewingPayment.paidAt || viewingPayment.createdAt
                      ? new Date(viewingPayment.paidAt || viewingPayment.createdAt).toLocaleString()
                      : '—'}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setViewingPayment(null)}
                  className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
