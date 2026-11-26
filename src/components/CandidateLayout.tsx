import React, { useState, useEffect, Suspense } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  User,
  Award,
  CalendarCheck,
  BookOpen,
  FileCheck2,
  ShieldCheck,
  CreditCard,
  Headphones,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

export const CandidateLayout: React.FC = () => {
  const { user, candidate, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const candidateNav = [
    { label: 'Dashboard', path: '/portal/dashboard', icon: LayoutDashboard },
    { label: 'My Profile', path: '/portal/profile', icon: User },
    { label: 'Certifications', path: '/portal/certifications', icon: Award },
    { label: 'My Exams', path: '/portal/exams', icon: CalendarCheck },
    { label: 'My Learning', path: '/portal/learning', icon: BookOpen },
    { label: 'My Certificates', path: '/portal/certificates', icon: FileCheck2 },
    { label: 'Verification', path: '/portal/verification', icon: ShieldCheck },
    { label: 'Payments', path: '/portal/payments', icon: CreditCard },
    { label: 'Support', path: '/portal/support', icon: Headphones },
    { label: 'Settings', path: '/portal/settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const displayName = user?.fullName || candidate?.fullName || 'Candidate';
  const candidateId = user?.candidateId || candidate?.candidateId || (user?.id ? `AICQB-${user.id.slice(0, 6).toUpperCase()}` : '');

  // Preload all candidate portal modules in background for instant silent clicks
  useEffect(() => {
    const prefetch = () => {
      import('../pages/candidate/CandidateDashboard');
      import('../pages/candidate/CandidateProfile');
      import('../pages/candidate/CandidateCertifications');
      import('../pages/candidate/CandidateExams');
      import('../pages/candidate/CandidateLearning');
      import('../pages/candidate/CandidateCertificates');
      import('../pages/candidate/CandidateVerify');
      import('../pages/candidate/CandidatePayments');
      import('../pages/candidate/CandidateSupport');
      import('../pages/candidate/CandidateSettings');
    };
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      (window as any).requestIdleCallback(prefetch);
    } else {
      setTimeout(prefetch, 200);
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex flex-col md:flex-row">
      {/* Mobile Backdrop Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 md:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Header */}
      <div className="md:hidden bg-[#10264B] text-white px-4 py-3 flex items-center justify-between sticky top-0 z-40 border-b border-slate-800 shadow-md">
        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 -ml-1 rounded-lg text-white hover:bg-slate-800 active:scale-95 transition-all cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <Link to="/" className="flex items-center space-x-2">
            <img src="/aicqb-logo.png" alt="AIICQB Logo" className="h-9 w-auto bg-white p-1 rounded-lg object-contain" />
          </Link>
        </div>

        <div className="flex items-center space-x-2">
          {candidateId && (
            <span className="text-[10px] sm:text-xs font-mono font-bold text-[#F47716] bg-[#0A1D37] px-2 py-0.5 rounded border border-slate-700 truncate max-w-[120px] sm:max-w-none">
              {candidateId}
            </span>
          )}
          <div className="w-7 h-7 rounded-full bg-[#F47716] text-white flex items-center justify-center font-bold text-xs ring-1 ring-white/30">
            {displayName.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>

      {/* Candidate Left Sidebar: Slide-over drawer on mobile, sticky w-80 on desktop */}
      <aside
        className={`fixed inset-y-0 left-0 w-80 max-w-[85vw] z-50 bg-[#10264B] text-white flex flex-col justify-between flex-shrink-0 select-none border-r border-slate-800 shadow-2xl transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } md:translate-x-0 md:static md:sticky md:top-0 md:h-screen md:w-80 md:shadow-xl`}
      >
        {/* Top: AICQB Logo Header & Navigation */}
        <div className="flex flex-col flex-1 min-h-0 justify-start">
          <div className="px-5 py-4 border-b border-slate-700/60 flex items-center justify-between">
            <Link
              to="/"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center space-x-2 bg-white px-4 py-2.5 rounded-xl w-full justify-center shadow-md hover:opacity-95 transition-opacity"
            >
              <img src="/aicqb-logo.png" alt="AIICQB Logo" className="h-12 sm:h-14 w-auto object-contain" />
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg ml-2"
              aria-label="Close Sidebar"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation Items: Scrollable on mobile, evenly distributed on desktop */}
          <nav className="p-3 sm:p-4 space-y-1.5 flex-1 overflow-y-auto min-h-0 sidebar-scroll">
            {candidateNav.map((item) => {
              const Icon = item.icon;
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center space-x-3.5 px-4 py-2.5 rounded-xl text-sm sm:text-[15px] font-semibold transition-all ${active
                    ? 'bg-[#F47716] text-white shadow-lg font-bold scale-[1.01]'
                    : 'text-slate-300 hover:bg-[#1E3A6E] hover:text-white'
                    }`}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-white' : 'text-slate-400'}`} />
                  <span className="truncate tracking-wide">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-slate-700/60 bg-[#0d203f]/60 space-y-2 flex-shrink-0">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-red-300 hover:text-red-100 rounded-xl hover:bg-red-900/40 transition-colors font-semibold cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-red-400" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Candidate Topbar */}
        <header className="bg-white border-b border-gray-200 h-14 sm:h-16 flex items-center justify-between px-3 sm:px-6 lg:px-8 sticky top-0 z-20 shadow-xs">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#10264B] bg-slate-100 px-2.5 py-1 rounded-md">
              Candidate Portal
            </span>
            <span className="hidden sm:inline-block text-xs text-slate-500">
              Candidate ID: <span className="font-mono font-bold text-[#F47716]">{candidateId}</span>
            </span>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Candidate User Pill */}
            <div className="flex items-center space-x-2.5 sm:space-x-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#10264B] text-white flex items-center justify-center font-bold text-xs ring-2 ring-orange-200">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-[#10264B] leading-none truncate max-w-[120px] sm:max-w-none">{displayName}</p>
                <p className="text-[10px] sm:text-[11px] text-gray-500 leading-none mt-1">Candidate</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page View Body */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8">
          <Suspense fallback={<div className="h-0.5 w-full bg-gradient-to-r from-transparent via-[#F47716] to-transparent animate-pulse" />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
};
