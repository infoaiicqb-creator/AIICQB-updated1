import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import {
  Users,
  Award,
  CalendarCheck,
  FileCheck2,
  TrendingUp,
  CreditCard,
  CheckCircle2,
  Loader2,
  Clock,
  ShieldCheck,
  Building2,
  Briefcase,
  Share2,
  Globe2,
  AlertTriangle,
  ArrowUpRight,
  Shield,
  HelpCircle,
  RefreshCw,
  Calendar,
  Filter,
  BarChart3,
  PieChart,
  Search,
  X,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(() => {
    try {
      const s = localStorage.getItem('aicqb_admin_stats');
      return s ? JSON.parse(s) : null;
    } catch (_) {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  useEffect(() => {
    loadDashboard(true);
    // Live dynamic polling every 15 seconds to ensure 100% synchronized state
    const interval = setInterval(() => {
      loadDashboard(true);
    }, 15000);
    return () => clearInterval(interval);
  }, [dateFilter, startDate, endDate]);

  const loadDashboard = async (silent = true) => {
    try {
      if (!silent && !stats) setLoading(true);
      else setIsRefreshing(true);

      const params: Record<string, string> = { dateFilter };
      if (dateFilter === 'custom') {
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
      }

      const res = await api.getAdminDashboard(params);
      if (res && res.success && res.stats) {
        setStats(res.stats);
        setLastRefreshed(new Date());
        try { localStorage.setItem('aicqb_admin_stats', JSON.stringify(res.stats)); } catch (_) { }
      }
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Real Enterprise Metrics from Backend Firestore/Database Collections
  const totalCandidates = stats?.totalCandidates ?? 0;
  const totalPaidCandidates = stats?.totalPaidCandidates ?? 0;
  const pendingPayments = stats?.pendingPayments ?? 0;
  const paymentConversion = stats?.paymentConversion ?? (totalCandidates > 0 ? Math.round((totalPaidCandidates / totalCandidates) * 100) : 0);

  const totalExams = stats?.totalExams ?? 0;
  const activeExams = stats?.activeExams ?? 0;
  const completedExams = stats?.completedExams ?? Math.max(0, totalExams - activeExams);

  const passedCandidates = stats?.passedCandidates ?? 0;
  const failedCandidates = stats?.failedCandidates ?? 0;
  const passRate = stats?.passRate ?? (passedCandidates + failedCandidates > 0 ? Math.round((passedCandidates / (passedCandidates + failedCandidates)) * 100) : 0);
  const retakeRate = stats?.retakeRate ?? Math.max(0, 100 - passRate);

  const certificatesIssued = stats?.certificatesIssued ?? 0;
  const certificatesPending = stats?.certificatesPending ?? Math.max(0, passedCandidates - certificatesIssued);

  const totalCertifications = stats?.totalCertifications ?? 0;
  const activeCertifications = stats?.activeCertifications ?? 0;
  const totalVerifications = stats?.totalVerifications ?? 0;

  const totalRevenue = stats?.totalRevenue ?? 0;
  const monthlyRevenue = stats?.monthlyRevenue ?? 0;

  // Real Country Breakdown (Zero Mock Data)
  const countryRegistrations: Array<{ country: string; flag: string; count: number; percent: number }> =
    stats?.countryRegistrations || [];

  // Real Domain Breakdown (Zero Mock Data)
  const domainBreakdown: Array<{ name: string; count: number; percentage: number; color: string }> =
    stats?.domainBreakdown || [];

  // Real 6-Month Trajectory (Zero Mock Data)
  const trajectory: Array<{ month: string; candidateCount: number; revenue: number }> =
    stats?.trajectory || [];

  const maxTrajectoryRevenue = Math.max(...trajectory.map((t) => t.revenue || 0), 1000);

  const formatRevenue = (amount: number) => {
    if (!amount || amount === 0) return '₹0';
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)} Cr`;
    }
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(2)}L`;
    }
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const verificationUptime = stats?.verificationUptime || '100%';
  const recentActivity = stats?.recentActivity || [];

  return (
    <div className="space-y-6">
      {/* Header & Date Range Filter Toolbar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-[#10264B]">
              Super Admin Executive Dashboard
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#10264B]/10 text-[#10264B]">
              Real-Time Live Registry
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            100% dynamic metrics from Firebase Firestore and verified transactions. Zero mock data.
          </p>
        </div>

        {/* Date Filter & Refresh Controls */}
        <div className="flex flex-wrap items-center gap-2.5 self-start xl:self-auto">
          {/* Quick Date Filters */}
          <div className="flex items-center bg-white border border-gray-200 rounded-xl p-1 shadow-xs text-xs font-semibold">
            <div className="flex items-center px-2 text-gray-400">
              <Calendar className="w-3.5 h-3.5 mr-1 text-[#F47716]" />
              <span className="hidden sm:inline text-[11px]">Period:</span>
            </div>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-transparent text-gray-700 font-bold focus:outline-hidden text-xs py-1 px-1 cursor-pointer"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="last7days">Last 7 Days</option>
              <option value="last30days">Last 30 Days</option>
              <option value="thismonth">This Month</option>
              <option value="lastmonth">Last Month</option>
              <option value="thisyear">This Year</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>

          {/* Custom Date Inputs if custom selected */}
          {dateFilter === 'custom' && (
            <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl p-1 shadow-xs text-xs">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2 py-1 text-xs border border-gray-200 rounded-lg text-gray-700 focus:outline-hidden"
              />
              <span className="text-gray-400 text-xs">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2 py-1 text-xs border border-gray-200 rounded-lg text-gray-700 focus:outline-hidden"
              />
            </div>
          )}

          <button
            onClick={() => loadDashboard(false)}
            disabled={loading || isRefreshing}
            className="p-2 bg-white border border-gray-200 hover:border-gray-300 rounded-xl text-gray-600 hover:text-[#10264B] shadow-xs cursor-pointer transition-all"
            title="Refresh Live Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading || isRefreshing ? 'animate-spin text-[#F47716]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Row 1: 4 Primary Executive KPIs (100% Real Database Metrics, Centered & Bold) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Candidates */}
        <div
          onClick={() => navigate('/admin/candidates')}
          className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs flex flex-col items-center justify-center text-center cursor-pointer hover:border-[#F47716] hover:shadow-md transition-all group select-none"
          title="Click to view candidate roster page"
        >
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#F47716] group-hover:bg-[#F47716] group-hover:text-white flex items-center justify-center mb-3 transition-all shadow-xs">
            <Users className="w-6 h-6" />
          </div>
          <span className="text-3xl sm:text-4xl font-black text-[#10264B] block leading-tight font-mono group-hover:text-[#F47716] transition-colors text-center">
            {totalCandidates.toLocaleString('en-IN')}
          </span>
          <span className="text-xs sm:text-sm text-gray-700 font-bold block mt-2 text-center">
            Registered Candidates
          </span>
        </div>

        {/* Real Revenue */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 shadow-xs">
            <CreditCard className="w-6 h-6" />
          </div>
          <span className="text-3xl sm:text-4xl font-black text-[#10264B] block leading-tight font-mono text-center">
            {formatRevenue(totalRevenue)}
          </span>
          <span className="text-xs sm:text-sm text-gray-700 font-bold block mt-2 text-center">
            Total Platform Revenue
          </span>
        </div>

        {/* Real Examinations */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#10264B] flex items-center justify-center mb-3 shadow-xs">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <span className="text-3xl sm:text-4xl font-black text-[#10264B] block leading-tight font-mono text-center">
            {totalExams.toLocaleString('en-IN')}
          </span>
          <span className="text-xs sm:text-sm text-gray-700 font-bold block mt-2 text-center">
            Total Examinations
          </span>
        </div>

        {/* Real Verified Certificates */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3 shadow-xs">
            <FileCheck2 className="w-6 h-6" />
          </div>
          <span className="text-3xl sm:text-4xl font-black text-[#10264B] block leading-tight font-mono text-center">
            {certificatesIssued.toLocaleString('en-IN')}
          </span>
          <span className="text-xs sm:text-sm text-gray-700 font-bold block mt-2 text-center">
            Verified Certificates Issued
          </span>
        </div>
      </div>

      {/* Row 2: Secondary Metric Strip (Centered & Bold Numbers) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-xs flex flex-col items-center justify-center text-center">
          <span className="text-xl sm:text-2xl font-black text-emerald-700 font-mono block">
            {totalPaidCandidates.toLocaleString('en-IN')}
          </span>
          <span className="text-xs font-bold text-gray-600 block mt-1 uppercase tracking-wider">
            Paid Candidates
          </span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-xs flex flex-col items-center justify-center text-center">
          <span className="text-xl sm:text-2xl font-black text-amber-600 font-mono block">
            {pendingPayments.toLocaleString('en-IN')}
          </span>
          <span className="text-xs font-bold text-gray-600 block mt-1 uppercase tracking-wider">
            Pending Payments
          </span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-xs flex flex-col items-center justify-center text-center">
          <span className="text-xl sm:text-2xl font-black text-emerald-600 font-mono block">
            {passedCandidates.toLocaleString('en-IN')}
          </span>
          <span className="text-xs font-bold text-gray-600 block mt-1 uppercase tracking-wider">
            Passed (Honors)
          </span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-xs flex flex-col items-center justify-center text-center">
          <span className="text-xl sm:text-2xl font-black text-[#10264B] font-mono block">
            {activeCertifications}
          </span>
          <span className="text-xs font-bold text-gray-600 block mt-1 uppercase tracking-wider">
            Active Certifications
          </span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-xs flex flex-col items-center justify-center text-center">
          <span className="text-xl sm:text-2xl font-black text-[#10264B] font-mono block">
            {completedExams.toLocaleString('en-IN')}
          </span>
          <span className="text-xs font-bold text-gray-600 block mt-1 uppercase tracking-wider">
            Completed Exams
          </span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-xs flex flex-col items-center justify-center text-center">
          <span className="text-xl sm:text-2xl font-black text-[#F47716] font-mono block">
            {totalVerifications.toLocaleString('en-IN')}
          </span>
          <span className="text-xs font-bold text-gray-600 block mt-1 uppercase tracking-wider">
            Verifications
          </span>
        </div>
      </div>

      {/* Row 3: Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Chart: Real Monthly Revenue & Candidate Registration Trajectory */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h3 className="font-bold text-sm text-[#10264B]">Candidate Registration & Revenue Trajectory</h3>
              <p className="text-[11px] text-gray-400">Monthly candidate volume and certification revenue trend</p>
            </div>
            <span className="text-xs font-mono font-bold text-[#F47716] bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-200">
              2026 Fiscal Year (Live)
            </span>
          </div>

          {trajectory.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-xs text-gray-400 gap-1.5">
              <BarChart3 className="w-8 h-8 text-gray-300" />
              <span>No Activity Recorded in Selected Period</span>
            </div>
          ) : (
            <div className="h-48 flex items-end justify-between gap-4 pt-4 px-2">
              {trajectory.map((bar) => {
                const heightPercent = maxTrajectoryRevenue > 0 ? Math.max(6, Math.round((bar.revenue / maxTrajectoryRevenue) * 100)) : 6;
                return (
                  <div key={bar.month} className="flex-1 flex flex-col items-center gap-1.5 group cursor-pointer">
                    <span className="text-[10px] font-mono font-bold text-gray-500 group-hover:text-[#F47716] transition-colors">
                      {formatRevenue(bar.revenue)}
                    </span>
                    <div
                      className="w-full bg-gradient-to-t from-[#10264B] to-[#F47716] rounded-t-lg group-hover:brightness-110 transition-all shadow-xs"
                      style={{ height: `${heightPercent}%` }}
                      title={`${bar.candidateCount} candidates, ${formatRevenue(bar.revenue)}`}
                    ></div>
                    <span className="text-[11px] font-bold text-gray-700">{bar.month}</span>
                    <span className="text-[9px] text-gray-400 font-mono">+{bar.candidateCount} cand</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Chart: Real Enrollments by Domain & Certification */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="font-bold text-sm text-[#10264B]">Enrollments by Certification</h3>
            <span className="text-xs font-bold text-[#F47716]">
              {(stats?.totalEnrollmentsCount !== undefined ? stats.totalEnrollmentsCount : 0).toLocaleString('en-IN')} Total
            </span>
          </div>

          {domainBreakdown.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-xs text-gray-400 gap-2">
              <PieChart className="w-8 h-8 text-gray-300" />
              <span>No Certification Enrollments Found</span>
            </div>
          ) : (
            <div className="space-y-3.5 pt-1">
              {domainBreakdown.map((d) => (
                <div key={d.name} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-gray-700">
                    <span className="truncate pr-2">{d.name}</span>
                    <span className="font-mono font-bold text-[#10264B]">
                      {d.count} ({d.percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${d.color || 'bg-[#F47716]'} rounded-full transition-all duration-500`}
                      style={{ width: `${Math.max(d.count > 0 ? 5 : 0, d.percentage)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Row 4: Real International Country-Wise Registrations */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center space-x-2">
            <Globe2 className="w-4 h-4 text-[#F47716]" />
            <h3 className="font-bold text-sm text-[#10264B]">International Country-Wise Registrations</h3>
          </div>
          <span className="text-xs text-gray-400">
            {countryRegistrations.length} Active Jurisdictions
          </span>
        </div>

        {countryRegistrations.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-400">
            No country registration records found.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {countryRegistrations.map((c) => (
              <div
                key={c.country}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs"
              >
                <div className="flex items-center space-x-2.5">
                  <span className="text-base">{c.flag}</span>
                  <span className="font-bold text-gray-800">{c.country}</span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-black text-[#10264B] block">
                    {c.count.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-gray-400 font-semibold">{c.percent}% of total</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
