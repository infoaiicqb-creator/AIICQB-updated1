import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AuthLeftBanner } from '../../components/AuthLeftBanner';
import { NetworkStarsBackground } from '../../components/NetworkStarsBackground';
import { api } from '../../services/api';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Loader2,
  CheckCircle2,
  X,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';

export const Login: React.FC = () => {
  const { user, loading: authLoading, login, googleLogin } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect');
  const message = searchParams.get('message');
  const certName = searchParams.get('certName');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  // Google OAuth Modal state
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');

  // Condition: Do not redirect logged-in users to the login page again
  useEffect(() => {
    if (user && !authLoading) {
      if (user.role === 'Super Admin' || user.role !== 'Candidate') {
        navigate('/admin/dashboard', { replace: true });
      } else if (redirect) {
        navigate(redirect, { replace: true });
      } else {
        navigate('/portal/dashboard', { replace: true });
      }
    }
  }, [user, authLoading, redirect, navigate]);

  // Prevent flash of login screen if session is already active
  if (user && !authLoading) {
    return null;
  }

  // Pre-load admin credentials if requested
  useEffect(() => {
    if (searchParams.get('role') === 'admin' || redirect?.startsWith('/admin')) {
      setEmail('admin@aicqb.org');
      setPassword('Admin@123456');
    }
  }, [searchParams, redirect]);

  const validateEmailFormat = (val: string) => {
    // Allows valid email or mobile number with digits
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isMobile = /^\+?[0-9]{7,15}$/.test(val.replace(/[\s-]/g, ''));
    return emailRegex.test(val) || isMobile;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setForgotSuccess('');

    const cleanInput = email.trim();
    if (!cleanInput) {
      setError('Please enter your email address or mobile number.');
      return;
    }

    if (!validateEmailFormat(cleanInput)) {
      setError('Please provide a valid email format (e.g. name@example.com) or phone number.');
      return;
    }

    if (!password) {
      setError('Please enter your account password.');
      return;
    }

    try {
      setLoading(true);
      const res = await login({ email: cleanInput, password });
      if (res && res.success) {
        if (res.user.role === 'Super Admin' || res.user.role !== 'Candidate') {
          navigate('/admin/dashboard');
        } else if (redirect) {
          navigate(redirect);
        } else {
          navigate('/portal/dashboard');
        }
      } else {
        setError(res?.message || 'Invalid email or password. Please check your credentials.');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleEmail.trim()) {
      setError('Please provide your Google email address.');
      return;
    }
    try {
      setGoogleLoading(true);
      setError('');
      const res = await googleLogin({
        email: googleEmail.trim(),
        fullName: googleName.trim() || googleEmail.split('@')[0],
      });
      setShowGoogleModal(false);
      if (res && res.success) {
        if (res.user.role === 'Super Admin' || res.user.role !== 'Candidate') {
          navigate('/admin/dashboard');
        } else if (redirect) {
          navigate(redirect);
        } else {
          navigate('/portal/dashboard');
        }
      } else {
        setError(res?.message || 'Google sign-in failed. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    try {
      setForgotLoading(true);
      await api.forgotPassword(forgotEmail.trim());
      setShowForgotModal(false);
      setForgotSuccess(`Password reset instructions have been dispatched to ${forgotEmail.trim()}. Please check your inbox.`);
      setError('');
    } catch (_) {
      setShowForgotModal(false);
      setForgotSuccess(`If an account exists with ${forgotEmail.trim()}, a password reset link has been dispatched.`);
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col lg:flex-row items-center justify-center lg:justify-between relative bg-[#FFF9F5] lg:bg-cover lg:bg-center font-sans overflow-x-hidden"
      style={{ backgroundImage: `url('/login-bg-clean.jpg')` }}
    >
      {/* Dark Subtle Backdrop Overlay on Large Screens */}
      <div className="absolute inset-0 bg-[#06142A]/30 pointer-events-none z-0 hidden lg:block" />

      {/* Animated Moving Stars & Interconnected International Network Background on Desktop */}
      <div className="hidden lg:block">
        <NetworkStarsBackground />
      </div>

      {/* LEFT COLUMN: Hero Content (Hidden on Mobile/Tablet, Displayed on Large Screens) */}
      <AuthLeftBanner />

      {/* RIGHT COLUMN: Authentication Container - Matching Screen 1 exactly on mobile */}
      <div className="relative w-full lg:w-[48%] xl:w-[45%] min-h-screen flex items-center justify-center px-4 py-8 sm:px-6 lg:p-8 z-10">
        
        {/* Mobile Decorative Top Curved Orange Wave */}
        <div className="lg:hidden absolute top-0 left-0 right-0 h-28 sm:h-36 overflow-hidden pointer-events-none z-0">
          <svg viewBox="0 0 500 150" preserveAspectRatio="none" className="w-full h-full">
            <path d="M0,0 L500,0 L500,50 C360,130 180,30 0,95 Z" fill="url(#orangeGradTopMobile)" />
            <defs>
              <linearGradient id="orangeGradTopMobile" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F47716" />
                <stop offset="50%" stopColor="#FF933B" />
                <stop offset="100%" stopColor="#FFA654" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Mobile Decorative Bottom Curved Orange Wave */}
        <div className="lg:hidden absolute bottom-0 left-0 right-0 h-24 sm:h-32 overflow-hidden pointer-events-none z-0">
          <svg viewBox="0 0 500 150" preserveAspectRatio="none" className="w-full h-full">
            <path d="M0,110 C160,50 320,140 500,75 L500,150 L0,150 Z" fill="url(#orangeGradBottomMobile)" />
            <defs>
              <linearGradient id="orangeGradBottomMobile" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFA654" />
                <stop offset="50%" stopColor="#FF8C2E" />
                <stop offset="100%" stopColor="#F47716" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="relative w-full max-w-[420px] bg-white rounded-3xl shadow-[0_15px_50px_-10px_rgba(244,119,22,0.12)] lg:shadow-[0_20px_60px_-15px_rgba(10,30,60,0.25)] border border-orange-100/60 lg:border-gray-100 p-6 sm:p-8 transition-all my-auto backdrop-blur-xs z-10">
          
          {/* AIICQB Official Logo matching Screenshot */}
          <div className="flex flex-col items-center mb-4">
            <Link to="/" className="inline-block transition-transform hover:scale-105">
              <img
                src="/aiicqb-full-logo.png"
                alt="AIICQB – AI International Certification & Qualification Board"
                className="h-14 sm:h-16 w-auto object-contain drop-shadow-xs"
              />
            </Link>
          </div>

          {/* Heading & Subtitle matching Screenshot */}
          <div className="text-center space-y-1 mb-6">
            <h1 className="text-2xl sm:text-[26px] font-black text-[#10264B] tracking-tight">
              Welcome Back
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 font-medium">
              Sign in to your AIICQB account
            </p>
          </div>

          {/* Enrollment Login Prompt if redirected */}
          {message && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-start space-x-2.5">
              <ShieldAlert className="w-4 h-4 text-[#10264B] flex-shrink-0 mt-0.5" />
              <div className="flex-1 text-xs text-[#10264B]">
                <p className="font-bold">{message}</p>
                {certName && (
                  <p className="text-[11px] text-gray-600 mt-0.5">
                    Target Certification: <span className="font-semibold">{certName}</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Error Message Alert */}
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2 text-rose-700 text-xs font-semibold animate-fadeIn">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span className="flex-1 leading-snug">{error}</span>
            </div>
          )}

          {/* Forgot Password Success Feedback */}
          {forgotSuccess && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start space-x-2 text-emerald-800 text-xs font-semibold animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span className="flex-1 leading-snug">{forgotSuccess}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Email Address Input */}
            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  inputMode="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  className="w-full pl-10 pr-4 h-12 text-sm bg-white border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F47716] focus:border-transparent transition-all shadow-xs"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full pl-10 pr-11 h-12 text-sm bg-white border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F47716] focus:border-transparent transition-all shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 w-11 h-full flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between pt-0.5 text-xs">
              <label className="flex items-center space-x-2 cursor-pointer select-none py-1">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-[#F47716] border-gray-300 focus:ring-[#F47716]"
                />
                <span className="text-gray-500 font-medium">Remember me</span>
              </label>

              <button
                type="button"
                onClick={() => {
                  setForgotEmail(email);
                  setShowForgotModal(true);
                }}
                className="font-bold text-[#F47716] hover:text-[#DC660E] transition-colors py-1 cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>

            {/* Sign In Primary Button - Bright Orange matching Screenshot */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-[#F47716] hover:bg-[#E35D00] active:bg-[#C95000] text-white font-bold text-base rounded-xl shadow-md hover:shadow-orange-500/25 flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          {/* OR Divider matching Screenshot */}
          <div className="relative my-4 sm:my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-white text-gray-400 font-bold uppercase tracking-wider">OR</span>
            </div>
          </div>

          {/* Continue with Google Button matching Screenshot */}
          <div>
            <button
              type="button"
              onClick={() => setShowGoogleModal(true)}
              className="w-full h-12 flex items-center justify-center space-x-2.5 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-xl text-sm font-bold text-gray-700 shadow-xs transition-all cursor-pointer"
            >
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.04h3.88c2.27-2.09 3.665-5.17 3.665-9.14z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.04c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.13C3.26 21.36 7.33 24 12 24z" />
                <path fill="#FBBC05" d="M5.28 14.28c-.25-.72-.38-1.49-.38-2.28s.14-1.56.38-2.28V6.59H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.41l4.03-3.13z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.59l4.03 3.13c.95-2.83 3.6-4.97 6.72-4.97z" />
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>

          {/* Quick Test Demo Logins (Subtle footer row) */}
          <div className="flex items-center justify-center gap-2 mt-3 pt-2 text-[11px] text-gray-400">
            <span>Quick fill:</span>
            <button
              type="button"
              onClick={() => {
                setEmail('candidate@aicqb.org');
                setPassword('Candidate@123');
              }}
              className="text-[#10264B] font-semibold hover:underline cursor-pointer"
            >
              Candidate
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => {
                setEmail('admin@aicqb.org');
                setPassword('Admin@123456');
              }}
              className="text-[#10264B] font-semibold hover:underline cursor-pointer"
            >
              Admin
            </button>
          </div>

          {/* Sign Up Redirect Link matching Screenshot */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-600">
              Don’t have an account?{' '}
              <Link
                to={`/signup${searchParams.toString() ? `?${searchParams.toString()}` : ''}`}
                className="font-bold text-[#F47716] hover:text-[#DC660E] hover:underline transition-colors ml-1"
              >
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#10264B]">Reset Password</h3>
              <button
                onClick={() => setShowForgotModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Enter your registered email address to receive password reset instructions.
            </p>
            <form onSubmit={handleForgotPasswordSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Registered Email Address
                </label>
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10264B]"
                />
              </div>
              <button
                type="submit"
                disabled={forgotLoading}
                className="w-full py-2.5 bg-[#10264B] hover:bg-[#1B365D] text-white font-bold text-xs rounded-lg shadow-sm flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
              >
                {forgotLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <span>Send Reset Link</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Google OAuth Modal */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.04h3.88c2.27-2.09 3.665-5.17 3.665-9.14z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.04c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.13C3.26 21.36 7.33 24 12 24z" />
                  <path fill="#FBBC05" d="M5.28 14.28c-.25-.72-.38-1.49-.38-2.28s.14-1.56.38-2.28V6.59H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.41l4.03-3.13z" />
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.59l4.03 3.13c.95-2.83 3.6-4.97 6.72-4.97z" />
                </svg>
                <h3 className="text-sm font-bold text-gray-900">Sign in with Google</h3>
              </div>
              <button
                onClick={() => setShowGoogleModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Authenticate into the AIICQB candidate portal using your Google account.
            </p>
            <form onSubmit={handleGoogleSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Google Email Address
                </label>
                <input
                  type="email"
                  required
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  placeholder="candidate@gmail.com"
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10264B]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Full Name (optional)
                </label>
                <input
                  type="text"
                  value={googleName}
                  onChange={(e) => setGoogleName(e.target.value)}
                  placeholder="e.g. Rahul Deshmukh"
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10264B]"
                />
              </div>
              <button
                type="submit"
                disabled={googleLoading}
                className="w-full py-2.5 bg-[#4285F4] hover:bg-[#3367D6] text-white font-bold text-xs rounded-lg shadow-sm flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                {googleLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <span>Continue with Google</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
