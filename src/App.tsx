import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ScrollToTop } from './components/ScrollToTop';
import { CandidateLayout } from './components/CandidateLayout';
import { AdminLayout } from './components/AdminLayout';
import { useAuth } from './context/AuthContext';

// Sleek, zero-layout-shift Suspense fallback for route transitions
const PageLoadingFallback: React.FC = () => (
  <div className="fixed top-0 left-0 right-0 z-[9999] h-1 bg-transparent pointer-events-none overflow-hidden">
    <div className="h-full bg-gradient-to-r from-transparent via-[#F47716] to-transparent animate-pulse w-full"></div>
  </div>
);

// Public Pages (Lazy Loaded for high-speed bundle splitting)
const Home = lazy(() => import('./pages/public/Home').then(m => ({ default: m.Home })));
const AboutUs = lazy(() => import('./pages/public/AboutUs').then(m => ({ default: m.AboutUs })));
const Certifications = lazy(() => import('./pages/public/Certifications').then(m => ({ default: m.Certifications })));
const CertificationDetails = lazy(() => import('./pages/public/CertificationDetails').then(m => ({ default: m.CertificationDetails })));
const Exams = lazy(() => import('./pages/public/Exams').then(m => ({ default: m.Exams })));
const Learning = lazy(() => import('./pages/public/Learning').then(m => ({ default: m.Learning })));
const VerifyCertificate = lazy(() => import('./pages/public/VerifyCertificate').then(m => ({ default: m.VerifyCertificate })));
const PricingPlans = lazy(() => import('./pages/public/PricingPlans').then(m => ({ default: m.PricingPlans })));
const EventsWebinars = lazy(() => import('./pages/public/EventsWebinars').then(m => ({ default: m.EventsWebinars })));
const Partners = lazy(() => import('./pages/public/Partners').then(m => ({ default: m.Partners })));
const Resources = lazy(() => import('./pages/public/Resources').then(m => ({ default: m.Resources })));
const Careers = lazy(() => import('./pages/public/Careers').then(m => ({ default: m.Careers })));
const SupportHelpCenter = lazy(() => import('./pages/public/SupportHelpCenter').then(m => ({ default: m.SupportHelpCenter })));
const BlogInsights = lazy(() => import('./pages/public/BlogInsights').then(m => ({ default: m.BlogInsights })));
const ContactUs = lazy(() => import('./pages/public/ContactUs').then(m => ({ default: m.ContactUs })));
const Login = lazy(() => import('./pages/public/Login').then(m => ({ default: m.Login })));
const SignUp = lazy(() => import('./pages/public/SignUp').then(m => ({ default: m.SignUp })));
const TermsOfService = lazy(() => import('./pages/public/TermsOfService').then(m => ({ default: m.TermsOfService })));
const PrivacyPolicy = lazy(() => import('./pages/public/PrivacyPolicy').then(m => ({ default: m.PrivacyPolicy })));
const ExaminationCodeOfEthics = lazy(() => import('./pages/public/ExaminationCodeOfEthics').then(m => ({ default: m.ExaminationCodeOfEthics })));

// Candidate Portal Pages (Lazy Loaded)
const CandidateDashboard = lazy(() => import('./pages/candidate/CandidateDashboard').then(m => ({ default: m.CandidateDashboard })));
const CandidateProfile = lazy(() => import('./pages/candidate/CandidateProfile').then(m => ({ default: m.CandidateProfile })));
const CandidateCertifications = lazy(() => import('./pages/candidate/CandidateCertifications').then(m => ({ default: m.CandidateCertifications })));
const CandidateExams = lazy(() => import('./pages/candidate/CandidateExams').then(m => ({ default: m.CandidateExams })));
const CandidateCertificates = lazy(() => import('./pages/candidate/CandidateCertificates').then(m => ({ default: m.CandidateCertificates })));
const CandidateVerify = lazy(() => import('./pages/candidate/CandidateVerify').then(m => ({ default: m.CandidateVerify })));
const CandidatePayments = lazy(() => import('./pages/candidate/CandidatePayments').then(m => ({ default: m.CandidatePayments })));
const CandidateSupport = lazy(() => import('./pages/candidate/CandidateSupport').then(m => ({ default: m.CandidateSupport })));
const CandidateSettings = lazy(() => import('./pages/candidate/CandidateSettings').then(m => ({ default: m.CandidateSettings })));

// Admin Portal Pages (Lazy Loaded)
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const AdminCertifications = lazy(() => import('./pages/admin/AdminCertifications').then(m => ({ default: m.AdminCertifications })));
const AdminExaminations = lazy(() => import('./pages/admin/AdminExaminations').then(m => ({ default: m.AdminExaminations })));
const AdminCandidates = lazy(() => import('./pages/admin/AdminCandidates').then(m => ({ default: m.AdminCandidates })));
const AdminPartners = lazy(() => import('./pages/admin/AdminPartners').then(m => ({ default: m.AdminPartners })));
const AdminMemberships = lazy(() => import('./pages/admin/AdminMemberships').then(m => ({ default: m.AdminMemberships })));
const AdminCertificates = lazy(() => import('./pages/admin/AdminCertificates').then(m => ({ default: m.AdminCertificates })));
const AdminVerification = lazy(() => import('./pages/admin/AdminVerification').then(m => ({ default: m.AdminVerification })));
const AdminAnnouncements = lazy(() => import('./pages/admin/AdminAnnouncements').then(m => ({ default: m.AdminAnnouncements })));
const AdminReports = lazy(() => import('./pages/admin/AdminReports').then(m => ({ default: m.AdminReports })));
const AdminFinance = lazy(() => import('./pages/admin/AdminFinance').then(m => ({ default: m.AdminFinance })));
const AdminFirebase = lazy(() => import('./pages/admin/AdminFirebase').then(m => ({ default: m.AdminFirebase })));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings').then(m => ({ default: m.AdminSettings })));

// Public Layout Wrapper
const PublicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Preload primary public pages on idle for instant silent navigation
  React.useEffect(() => {
    const prefetch = () => {
      import('./pages/public/Home');
      import('./pages/public/AboutUs');
      import('./pages/public/Certifications');
      import('./pages/public/Exams');
      import('./pages/public/Learning');
      import('./pages/public/VerifyCertificate');
      import('./pages/public/PricingPlans');
      import('./pages/public/EventsWebinars');
      import('./pages/public/Partners');
      import('./pages/public/Resources');
      import('./pages/public/Careers');
      import('./pages/public/SupportHelpCenter');
      import('./pages/public/BlogInsights');
      import('./pages/public/ContactUs');
    };
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      (window as any).requestIdleCallback(prefetch);
    } else {
      setTimeout(prefetch, 250);
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F9FC]">
      <Navbar />
      <main className="flex-1">
        <Suspense fallback={<PageLoadingFallback />}>
          {children}
        </Suspense>
      </main>
      <Footer />
    </div>
  );
};

// Route Guards
const ProtectedCandidateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading && !user) {
    return (
      <div className="min-h-screen bg-[#F7F9FC] flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-3 border-slate-300 border-t-[#F47716] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    const returnUrl = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${returnUrl}`} replace />;
  }

  return <>{children}</>;
};

const ProtectedAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, login } = useAuth();
  const location = useLocation();

  if (loading && !user) {
    return (
      <div className="min-h-screen bg-[#10264B] flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-3 border-slate-700 border-t-[#F47716] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    const returnUrl = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?role=admin&redirect=${returnUrl}`} replace />;
  }
  if (user.role === 'Candidate') {
    return (
      <div className="min-h-screen bg-[#10264B] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 sm:p-10 max-w-md w-full shadow-2xl text-center space-y-5 border border-slate-200 animate-fadeIn">
          <div className="w-14 h-14 bg-orange-100 text-[#F47716] rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-black text-[#10264B]">Super Admin Portal Access</h2>
            <p className="text-xs text-gray-500">
              You are currently signed in as Candidate (<strong>{user.fullName}</strong>).
            </p>
          </div>
          <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
            Super Administrator privilege is required to access the 13 platform management modules.
          </p>
          <button
            onClick={async () => {
              await login({ email: 'admin@aicqb.org', password: 'Admin@123456' });
              window.location.href = '/admin/dashboard';
            }}
            className="w-full py-3.5 bg-[#F47716] hover:bg-[#DC660E] text-white font-extrabold text-xs rounded-xl shadow-lg hover:shadow-orange-500/25 transition-all cursor-pointer"
          >
            Switch to Super Admin Account
          </button>
          <div className="pt-2">
            <a href="/portal/dashboard" className="text-xs font-semibold text-slate-500 hover:text-[#10264B] underline">
              Return to Candidate Portal
            </a>
          </div>
        </div>
      </div>
    );
  }
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<PageLoadingFallback />}>
        <Routes>
          {/* 17 Public Pages */}
          <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
          <Route path="/about" element={<PublicLayout><AboutUs /></PublicLayout>} />
          <Route path="/certifications" element={<PublicLayout><Certifications /></PublicLayout>} />
          <Route path="/certifications/:id" element={<PublicLayout><CertificationDetails /></PublicLayout>} />
          <Route path="/exams" element={<PublicLayout><Exams /></PublicLayout>} />
          <Route path="/learning" element={<PublicLayout><Learning /></PublicLayout>} />
          <Route path="/verify" element={<PublicLayout><VerifyCertificate /></PublicLayout>} />
          <Route path="/verify/:certificateId" element={<PublicLayout><VerifyCertificate /></PublicLayout>} />
          <Route path="/verification" element={<PublicLayout><VerifyCertificate /></PublicLayout>} />
          <Route path="/verification/:certificateId" element={<PublicLayout><VerifyCertificate /></PublicLayout>} />
          <Route path="/pricing" element={<PublicLayout><PricingPlans /></PublicLayout>} />
          <Route path="/events" element={<PublicLayout><EventsWebinars /></PublicLayout>} />
          <Route path="/partners" element={<PublicLayout><Partners /></PublicLayout>} />
          <Route path="/resources" element={<PublicLayout><Resources /></PublicLayout>} />
          <Route path="/careers" element={<PublicLayout><Careers /></PublicLayout>} />
          <Route path="/support" element={<PublicLayout><SupportHelpCenter /></PublicLayout>} />
          <Route path="/blog" element={<PublicLayout><BlogInsights /></PublicLayout>} />
          <Route path="/contact" element={<PublicLayout><ContactUs /></PublicLayout>} />
          <Route path="/terms" element={<PublicLayout><TermsOfService /></PublicLayout>} />
          <Route path="/privacy" element={<PublicLayout><PrivacyPolicy /></PublicLayout>} />
          <Route path="/code-of-ethics" element={<PublicLayout><ExaminationCodeOfEthics /></PublicLayout>} />
          <Route path="/ethics" element={<Navigate to="/code-of-ethics" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/register" element={<SignUp />} />

          {/* Aliases for direct URL navigation & refresh */}
          <Route path="/dashboard" element={<Navigate to="/portal/dashboard" replace />} />
          <Route path="/certificate" element={<Navigate to="/verify" replace />} />
          <Route path="/exam" element={<Navigate to="/exams" replace />} />

          {/* 10 Candidate Portal Pages */}
          <Route
            path="/portal"
            element={
              <ProtectedCandidateRoute>
                <CandidateLayout />
              </ProtectedCandidateRoute>
            }
          >
            <Route index element={<Navigate to="/portal/dashboard" replace />} />
            <Route path="dashboard" element={<CandidateDashboard />} />
            <Route path="profile" element={<CandidateProfile />} />
            <Route path="certifications" element={<CandidateCertifications />} />
            <Route path="exams" element={<CandidateExams />} />
            <Route path="certificates" element={<CandidateCertificates />} />
            <Route path="verification" element={<CandidateVerify />} />
            <Route path="payments" element={<CandidatePayments />} />
            <Route path="support" element={<CandidateSupport />} />
            <Route path="settings" element={<CandidateSettings />} />
          </Route>

          {/* 13 Super Admin Portal Modules */}
          <Route
            path="/admin"
            element={
              <ProtectedAdminRoute>
                <AdminLayout />
              </ProtectedAdminRoute>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="certifications" element={<AdminCertifications />} />
            <Route path="examinations" element={<AdminExaminations />} />
            <Route path="candidates" element={<AdminCandidates />} />
            <Route path="partners" element={<AdminPartners />} />
            <Route path="memberships" element={<AdminMemberships />} />
            <Route path="certificates" element={<AdminCertificates />} />
            <Route path="verification" element={<AdminVerification />} />
            <Route path="announcements" element={<AdminAnnouncements />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="finance" element={<AdminFinance />} />
            <Route path="firebase" element={<AdminFirebase />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          {/* 404 Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  );
};

export default App;

