import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { AuthLeftBanner } from '../../components/AuthLeftBanner';
import { NetworkStarsBackground } from '../../components/NetworkStarsBackground';
import {
  User,
  Mail,
  Lock,
  Phone,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  X,
  RotateCcw,
} from 'lucide-react';

const COUNTRY_CODES = [
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+1', country: 'USA / Canada', flag: '🇺🇸' },
  { code: '+44', country: 'United Kingdom', flag: '🇬🇧' },
  { code: '+971', country: 'United Arab Emirates', flag: '🇦🇪' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬' },
  { code: '+49', country: 'Germany', flag: '🇩🇪' },
  { code: '+33', country: 'France', flag: '🇫🇷' },
  { code: '+81', country: 'Japan', flag: '🇯🇵' },
  { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '+41', country: 'Switzerland', flag: '🇨🇭' },
  { code: '+31', country: 'Netherlands', flag: '🇳🇱' },
];

export const SignUp: React.FC = () => {
  const { user, register, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (user && !authLoading) {
      navigate('/portal/dashboard', { replace: true });
    }
  }, [user, authLoading, navigate]);

  if (user && !authLoading) {
    return null;
  }

  // Form Fields State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Status & Validation State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // OTP Verification Modal State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [demoOtp, setDemoOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  // Optional Target Certification
  const [certList, setCertList] = useState<any[]>(() => {
    try {
      const c = localStorage.getItem('aicqb_all_certifications');
      return c ? JSON.parse(c) : [];
    } catch (_) {
      return [];
    }
  });
  const [selectedCertificationId, setSelectedCertificationId] = useState('');

  useEffect(() => {
    loadCertifications();
  }, []);

  // Timer for OTP Resend
  useEffect(() => {
    let interval: any = null;
    if (showOtpModal && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    } else if (resendTimer === 0) {
      setCanResend(true);
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showOtpModal, resendTimer]);

  const loadCertifications = async () => {
    try {
      const res = await api.getCertifications();
      if (res.success && res.certifications) {
        setCertList(res.certifications);
        const queryCert = searchParams.get('enroll') || searchParams.get('cert') || '';
        if (queryCert) {
          const matched = res.certifications.find(
            (c: any) =>
              c.id === queryCert ||
              c.code?.toLowerCase() === queryCert.toLowerCase() ||
              c.name?.toLowerCase().includes(queryCert.toLowerCase())
          );
          if (matched) {
            setSelectedCertificationId(matched.id);
          }
        }
      }
    } catch (e) {
      console.error('Failed to load certifications on signup:', e);
    }
  };

  const validateForm = () => {
    if (!fullName.trim()) {
      setError('Please provide your Full Name.');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setError('Please provide a valid email address (e.g. name@example.com).');
      return false;
    }

    const cleanMobile = mobileNumber.replace(/\D/g, '');
    if (!cleanMobile || cleanMobile.length < 7 || cleanMobile.length > 15) {
      setError('Please provide a valid mobile number (7 to 15 digits).');
      return false;
    }

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters in length.');
      return false;
    }

    if (password !== confirmPassword) {
      setError('Confirm Password does not match Password.');
      return false;
    }

    if (!agreeTerms) {
      setError('You must accept the AIICQB Terms & Conditions and Privacy Policy to proceed.');
      return false;
    }

    return true;
  };

  // Step 1: Submit Form -> Send OTP Verification Code
  const handleInitiateSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!validateForm()) return;

    try {
      setLoading(true);
      // Dispatch OTP to email
      const res = await api.sendOtp({ email: email.trim(), fullName: fullName.trim() });
      if (res && res.success) {
        setDemoOtp(res.demoOtp || '');
        setResendTimer(30);
        setCanResend(false);
        setOtpCode('');
        setOtpError('');
        setShowOtpModal(true);
      } else {
        setError(res?.message || 'Unable to send verification code. Please check your email.');
      }
    } catch (err: any) {
      setError(err?.message || 'Registration check failed. An account with this email may already exist.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Resend OTP
  const handleResendOtp = async () => {
    if (!canResend) return;
    try {
      setOtpError('');
      setOtpLoading(true);
      const res = await api.sendOtp({ email: email.trim(), fullName: fullName.trim() });
      if (res && res.success) {
        setDemoOtp(res.demoOtp || '');
        setResendTimer(30);
        setCanResend(false);
      } else {
        setOtpError(res?.message || 'Failed to resend code.');
      }
    } catch (err: any) {
      setOtpError(err?.message || 'Failed to resend verification code.');
    } finally {
      setOtpLoading(false);
    }
  };

  // Step 3: Verify OTP & Activate Registration
  const handleVerifyOtpAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');

    const cleanOtp = otpCode.trim();
    if (!cleanOtp || cleanOtp.length < 6) {
      setOtpError('Please enter the complete 6-digit verification code.');
      return;
    }

    try {
      setOtpLoading(true);

      // Verify OTP on backend
      const otpRes = await api.verifyOtp({ email: email.trim(), otp: cleanOtp });
      if (!otpRes || !otpRes.success) {
        setOtpError(otpRes?.message || 'Invalid verification code. Please try again.');
        setOtpLoading(false);
        return;
      }

      // Finalize Account Registration
      const regRes = await register({
        fullName: fullName.trim(),
        email: email.trim(),
        countryCode,
        phoneNumber: mobileNumber.trim(),
        password,
        confirmPassword,
        agreeTerms,
        selectedCertificationId,
        emailVerified: true,
      });

      if (regRes && regRes.success) {
        setShowOtpModal(false);
        setSuccessMessage('Congratulations! Your AIICQB account has been verified and created successfully.');

        // Navigate candidate to Dashboard or Target certification
        setTimeout(() => {
          const redirect = searchParams.get('redirect');
          if (redirect) {
            navigate(redirect);
          } else if (selectedCertificationId) {
            navigate('/portal/exams');
          } else {
            navigate('/portal/dashboard');
          }
        }, 800);
      } else {
        setOtpError(regRes?.message || 'Registration failed after verification. Please try again.');
      }
    } catch (err: any) {
      setOtpError(err?.message || 'Registration failed. Please check your connection.');
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col lg:flex-row items-center justify-center lg:justify-between relative bg-cover bg-center font-sans overflow-x-hidden"
      style={{ backgroundImage: `url('/login-bg-clean.jpg')` }}
    >
      {/* Dark Subtle Backdrop Overlay for Perfect Contrast */}
      <div className="absolute inset-0 bg-[#06142A]/30 pointer-events-none z-0" />

      {/* Animated Moving Stars & Interconnected International Network Background */}
      <NetworkStarsBackground />

      {/* LEFT COLUMN: Hero Content (Hidden on Mobile/Tablet, Displayed on Large Screens) */}
      <AuthLeftBanner />

      {/* RIGHT COLUMN: Registration Form Container - Mobile First Full Width */}
      <div className="relative w-full lg:w-[48%] xl:w-[45%] min-h-screen flex items-center justify-center px-4 py-8 sm:px-6 lg:p-8 z-10">
        <div className="w-full max-w-[460px] bg-white rounded-2xl sm:rounded-3xl shadow-[0_20px_60px_-15px_rgba(10,30,60,0.25)] border border-gray-100 p-6 sm:p-8 transition-all my-auto backdrop-blur-xs">
          
          {/* AIICQB Official Logo */}
          <div className="flex flex-col items-center mb-3">
            <Link to="/" className="inline-block transition-transform hover:scale-105">
              <img
                src="/aiicqb-full-logo.png"
                alt="AIICQB – AI International Certification & Qualification Board"
                className="h-12 sm:h-14 w-auto object-contain drop-shadow-xs"
              />
            </Link>
          </div>

          {/* Heading & Subtitle */}
          <div className="text-center space-y-1 mb-5">
            <h1 className="text-xl sm:text-2xl font-black text-[#10264B] tracking-tight">
              Create Your Account.
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 font-medium">
              Register for your AIICQB certification portal.
            </p>
          </div>

          {/* Error Message Alert */}
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2 text-rose-700 text-xs font-semibold animate-fadeIn">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span className="flex-1 leading-snug">{error}</span>
            </div>
          )}

          {/* Registration Success Alert */}
          {successMessage && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start space-x-2 text-emerald-800 text-xs font-semibold animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span className="flex-1 leading-snug">{successMessage}</span>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleInitiateSignup} className="space-y-3.5" noValidate>
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Rahul Deshmukh"
                  className="w-full pl-10 pr-4 h-11 sm:h-12 text-sm bg-white border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#10264B] focus:border-transparent transition-all shadow-xs"
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Email Address
              </label>
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
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 h-11 sm:h-12 text-sm bg-white border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#10264B] focus:border-transparent transition-all shadow-xs"
                />
              </div>
            </div>

            {/* Mobile Number with Country Code Selection */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Mobile Number
              </label>
              <div className="flex rounded-xl shadow-xs border border-gray-300 overflow-hidden focus-within:ring-2 focus-within:ring-[#10264B] focus-within:border-transparent bg-white">
                {/* Country Code Select */}
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="h-11 sm:h-12 px-2.5 sm:px-3 text-xs sm:text-sm bg-slate-50 border-r border-gray-200 text-gray-800 font-bold focus:outline-none cursor-pointer"
                  aria-label="Country Code"
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code + c.country} value={c.code}>
                      {c.flag} {c.code}
                    </option>
                  ))}
                </select>

                {/* Mobile Number Input */}
                <div className="relative flex-1">
                  <input
                    type="tel"
                    inputMode="tel"
                    required
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    placeholder="Mobile Number"
                    className="w-full pl-3 pr-3 h-11 sm:h-12 text-sm bg-white text-gray-800 placeholder-gray-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full pl-10 pr-11 h-11 sm:h-12 text-sm bg-white border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#10264B] focus:border-transparent transition-all shadow-xs"
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

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full pl-10 pr-11 h-11 sm:h-12 text-sm bg-white border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#10264B] focus:border-transparent transition-all shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 w-11 h-full flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Optional Target Certification */}
            {certList.length > 0 && (
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Target Certification <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <select
                  value={selectedCertificationId}
                  onChange={(e) => setSelectedCertificationId(e.target.value)}
                  className="w-full h-10 px-3 text-xs bg-slate-50 border border-gray-300 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#10264B] cursor-pointer"
                >
                  <option value="">Select Target Certification (Optional)</option>
                  {certList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Agree Terms Checkbox */}
            <div className="flex items-start space-x-2 pt-1">
              <input
                type="checkbox"
                id="agreeTerms"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-[#10264B] border-gray-300 focus:ring-[#10264B] cursor-pointer"
              />
              <label htmlFor="agreeTerms" className="text-xs text-gray-600 cursor-pointer select-none leading-relaxed">
                I agree to the{' '}
                <Link to="/terms" target="_blank" className="text-[#10264B] font-bold hover:underline">
                  Terms & Conditions
                </Link>{' '}
                and{' '}
                <Link to="/privacy" target="_blank" className="text-[#10264B] font-bold hover:underline">
                  Privacy Policy
                </Link>
                .
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 sm:h-12 bg-[#10264B] hover:bg-[#1B365D] active:bg-[#0A1A33] text-white font-bold text-sm sm:text-base rounded-xl shadow-md flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sending Verification Code...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Login Redirect Link */}
          <div className="mt-5 text-center">
            <p className="text-xs text-gray-600">
              Already have an account?{' '}
              <Link
                to={`/login${searchParams.toString() ? `?${searchParams.toString()}` : ''}`}
                className="font-bold text-[#F47716] hover:text-[#DC660E] hover:underline transition-colors"
              >
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Email OTP Verification Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-[#F47716]" />
                <h3 className="text-sm font-bold text-[#10264B]">Email OTP Verification</h3>
              </div>
              <button
                onClick={() => setShowOtpModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-gray-600 space-y-1">
              <p>We have dispatched a 6-digit verification code to:</p>
              <p className="font-bold text-[#10264B] font-mono break-all">{email}</p>
            </div>

            {demoOtp && (
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs flex items-center justify-between text-amber-900">
                <span>Verification Code: <strong className="font-mono text-sm tracking-wider text-[#F47716]">{demoOtp}</strong></span>
                <button
                  type="button"
                  onClick={() => setOtpCode(demoOtp)}
                  className="px-2 py-1 bg-amber-200/80 hover:bg-amber-300 text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Auto-fill
                </button>
              </div>
            )}

            {otpError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-start space-x-1.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{otpError}</span>
              </div>
            )}

            <form onSubmit={handleVerifyOtpAndRegister} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Enter 6-Digit Code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  autoFocus
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="• • • • • •"
                  className="w-full text-center tracking-widest text-lg font-mono font-bold h-12 bg-slate-50 border border-gray-300 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#10264B]"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Didn't receive code?</span>
                {canResend ? (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="font-bold text-[#F47716] hover:underline cursor-pointer"
                  >
                    Resend Code
                  </button>
                ) : (
                  <span>Resend in {resendTimer}s</span>
                )}
              </div>

              <button
                type="submit"
                disabled={otpLoading || otpCode.length < 6}
                className="w-full h-11 bg-[#10264B] hover:bg-[#1B365D] text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center space-x-1.5 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {otpLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying & Activating...</span>
                  </>
                ) : (
                  <span>Verify & Activate Account</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
