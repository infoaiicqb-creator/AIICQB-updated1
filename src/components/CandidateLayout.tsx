import React, { useState, useEffect, Suspense } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  GraduationCap,
  Award,
  BookOpen,
  CreditCard,
  User,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  Headphones,
  Check,
} from 'lucide-react';

export const CandidateLayout: React.FC = () => {
  const { user, candidate, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Exact navigation items matching Mobile Drawer in Screenshot (Screen 5)
  const candidateNav = [
    { label: 'Dashboard', path: '/portal/dashboard', icon: LayoutDashboard },
    { label: 'My Exams', path: '/portal/exams', icon: GraduationCap },
    { label: 'My Certifications', path: '/portal/certificates', icon: Award },
    { label: 'My Courses', path: '/portal/learning', icon: BookOpen },
    { label: 'My Payments', path: '/portal/payments', icon: CreditCard },
    { label: 'My Profile', path: '/portal/profile', icon: User },
    { label: 'Notifications', path: '/portal/notifications', icon: Bell },
    { label: 'Settings', path: '/portal/settings', icon: Settings },
  ];

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    logout();
    navigate('/login');
  };

  const displayName = user?.fullName || candidate?.fullName || 'pushpak Wani';
  const candidateId =
    user?.candidateId || candidate?.candidateId || 'AICQB-1004721';
  const initial = displayName.charAt(0).toUpperCase() || 'P';

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
      import('../pages/candidate/CandidateNotifications');
    };
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      (window as any).requestIdleCallback(prefetch);
    } else {
      setTimeout(prefetch, 200);
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#F4F6FB] flex flex-col md:flex-row antialiased">
      {/* Mobile Backdrop Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs z-40 md:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Top App Bar (Unified header matching all 10 screens in screenshot) */}
      <div className="md:hidden bg-[#10264B] text-white px-3.5 py-2.5 flex items-center justify-between sticky top-0 z-40 border-b border-slate-800 shadow-sm">
        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 -ml-1 text-white hover:bg-slate-800 rounded-lg active:scale-95 transition-all cursor-pointer"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-6 h-6 stroke-[2.2]" />
          </button>
          <Link
            to="/portal/dashboard"
            className="bg-white px-2.5 py-1 rounded-lg flex items-center shadow-xs"
          >
            <img
              src="/aicqb-logo.png"
              alt="AICQB Logo"
              className="h-6 w-auto object-contain"
            />
          </Link>
        </div>

        <div className="flex items-center space-x-2">
          {candidateId && (
            <div className="text-[10.5px] font-mono font-bold text-[#F47716] bg-[#0A1D37] px-2.5 py-1 rounded-md border border-slate-700/80 shadow-xs">
              {candidateId}
            </div>
          )}
          <Link
            to="/portal/profile"
            className="w-7 h-7 rounded-full bg-[#F47716] text-white flex items-center justify-center font-bold text-xs ring-2 ring-white/20 shadow-xs cursor-pointer"
            title={displayName}
          >
            {initial}
          </Link>
        </div>
      </div>

      {/* Candidate Left Sidebar: Slide-over drawer on mobile (matching Screen 5), sticky on desktop */}
      <aside
        className={`fixed inset-y-0 left-0 w-72 max-w-[85vw] z-50 bg-[#0B1E3B] text-white flex flex-col justify-between flex-shrink-0 select-none border-r border-slate-800/80 shadow-2xl transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 md:static md:sticky md:top-0 md:h-screen md:w-72 md:shadow-xl`}
      >
        {/* Top: AICQB Logo Header & Navigation */}
        <div className="flex flex-col flex-1 min-h-0 justify-start">
          <div className="px-4 py-3.5 border-b border-slate-800/80 flex items-center justify-between">
            <Link
              to="/portal/dashboard"
              onClick={() => setSidebarOpen(false)}
              className="bg-white px-3 py-1.5 rounded-xl flex items-center shadow-md hover:opacity-95 transition-opacity"
            >
              <img
                src="/aicqb-logo.png"
                alt="AICQB Logo"
                className="h-8 w-auto object-contain"
              />
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-1.5 text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-lg cursor-pointer"
              aria-label="Close Sidebar"
            >
              <X className="w-6 h-6 stroke-[2.2]" />
            </button>
          </div>

          {/* Navigation Items: Exactly matching Mobile Drawer Screen 5 */}
          <nav className="p-3 space-y-1 flex-1 overflow-y-auto min-h-0 sidebar-scroll">
            {candidateNav.map((item) => {
              const Icon = item.icon;
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    active
                      ? 'bg-[#F47716] text-white shadow-md font-bold'
                      : 'text-slate-200 hover:bg-[#1E3A6E]/60 hover:text-white'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 flex-shrink-0 ${
                      active ? 'text-white' : 'text-slate-300'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}

            {/* Logout Trigger matching Drawer Screen 5 */}
            <button
              onClick={() => {
                setSidebarOpen(false);
                setShowLogoutModal(true);
              }}
              className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-200 hover:bg-red-950/40 hover:text-red-200 transition-all cursor-pointer text-left"
            >
              <LogOut className="w-5 h-5 flex-shrink-0 text-slate-300" />
              <span>Logout</span>
            </button>
          </nav>
        </div>

        {/* Desktop Candidate Info Footer */}
        <div className="hidden md:block p-3.5 border-t border-slate-800/80 bg-[#07152B]/60 flex-shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-[#F47716] text-white flex items-center justify-center font-bold text-xs ring-1 ring-white/30">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">
                {displayName}
              </p>
              <p className="text-[10px] font-mono text-slate-400 truncate">
                {candidateId}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop Topbar Header (hidden on mobile) */}
        <header className="hidden md:flex bg-white border-b border-gray-200 h-16 items-center justify-between px-6 lg:px-8 sticky top-0 z-20 shadow-xs">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#10264B] bg-slate-100 px-3 py-1 rounded-md">
              Candidate Portal
            </span>
            <span className="text-xs text-slate-500">
              Candidate ID:{' '}
              <span className="font-mono font-bold text-[#F47716]">
                {candidateId}
              </span>
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <Link
              to="/portal/notifications"
              className="p-2 text-slate-500 hover:text-[#10264B] hover:bg-slate-100 rounded-lg transition-colors relative"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#F47716]" />
            </Link>

            <Link
              to="/portal/profile"
              className="flex items-center space-x-3 hover:opacity-90 transition-opacity"
            >
              <div className="w-8 h-8 rounded-full bg-[#F47716] text-white flex items-center justify-center font-bold text-xs ring-2 ring-orange-200">
                {initial}
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-[#10264B] leading-none truncate max-w-[140px]">
                  {displayName}
                </p>
                <p className="text-[10px] text-gray-500 leading-none mt-1">
                  Candidate
                </p>
              </div>
            </Link>
          </div>
        </header>

        {/* Page Content Body */}
        <main className="flex-1 p-3.5 sm:p-5 lg:p-7 max-w-6xl w-full mx-auto">
          <Suspense
            fallback={
              <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-[#F47716] to-transparent animate-pulse" />
            }
          >
            <Outlet />
          </Suspense>
        </main>
      </div>

      {/* Logout Confirmation Modal (Matching Screen 10 in Screenshot) */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xs sm:max-w-sm w-full p-6 text-center relative animate-scaleUp border border-slate-100">
            {/* Close Button Top-Right */}
            <button
              onClick={() => setShowLogoutModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Logout Icon matching Screen 10 */}
            <div className="w-14 h-14 rounded-2xl bg-orange-50 border border-orange-100 text-[#F47716] flex items-center justify-center mx-auto shadow-xs">
              <LogOut className="w-7 h-7 stroke-[2.2] translate-x-0.5" />
            </div>

            <h3 className="text-lg sm:text-xl font-black text-[#10264B] mt-4">
              Logout
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
              Are you sure you want to logout from your account?
            </p>

            <div className="mt-5 space-y-2.5">
              <button
                type="button"
                onClick={handleConfirmLogout}
                className="w-full py-2.5 px-4 rounded-xl bg-[#F47716] hover:bg-[#E35D00] text-white font-black text-sm shadow-md transition-all cursor-pointer"
              >
                Yes, Logout
              </button>
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default CandidateLayout;
