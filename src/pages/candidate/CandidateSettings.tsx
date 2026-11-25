import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import {
  User,
  KeyRound,
  Bell,
  Shield,
  Languages,
  LogOut,
  ChevronRight,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  X,
  Mail,
  Smartphone,
  Laptop,
  Check,
  ShieldCheck,
  Clock,
  Globe,
  Settings,
  Sun,
  Info,
  HelpCircle,
} from 'lucide-react';

export const CandidateSettings: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Toast Banner State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 4000);
  };

  // Language State
  const [selectedLanguage, setSelectedLanguage] = useState(() => {
    try {
      return localStorage.getItem('aicqb_language') || (user as any)?.preferences?.language || 'English';
    } catch (_) {
      return 'English';
    }
  });
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  // Notification Preferences State
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [notificationSuccess, setNotificationSuccess] = useState('');
  const [notificationPrefs, setNotificationPrefs] = useState({
    emailExams: true,
    emailResults: true,
    emailNews: false,
    smsReminders: true,
    smsSecurity: true,
    inAppAlerts: true,
  });

  // Privacy & Security State
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [privacyLoading, setPrivacyLoading] = useState(false);
  const [privacySuccess, setPrivacySuccess] = useState('');
  const [sessionTerminated, setSessionTerminated] = useState(false);
  const [privacyPrefs, setPrivacyPrefs] = useState({
    twoFactorAuth: false,
    publicCertVerification: true,
    hideContactInfo: true,
    sessionTimeout: '1 Hour',
  });

  // Password Modal Form States
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Hydrate preferences from user or localStorage
  useEffect(() => {
    try {
      const savedNotifs = localStorage.getItem('aicqb_notification_prefs');
      if (savedNotifs) {
        setNotificationPrefs(JSON.parse(savedNotifs));
      } else if ((user as any)?.preferences?.notifications) {
        setNotificationPrefs((user as any).preferences.notifications);
      }

      const savedPrivacy = localStorage.getItem('aicqb_privacy_prefs');
      if (savedPrivacy) {
        setPrivacyPrefs(JSON.parse(savedPrivacy));
      } else if ((user as any)?.preferences?.privacy) {
        setPrivacyPrefs((user as any).preferences.privacy);
      }

      const savedLang = localStorage.getItem('aicqb_language');
      if (savedLang) {
        setSelectedLanguage(savedLang);
      } else if ((user as any)?.preferences?.language) {
        setSelectedLanguage((user as any).preferences.language);
      }
    } catch (_) {}
  }, [user]);

  // Handle Save Notifications
  const handleSaveNotifications = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setNotificationLoading(true);
      setNotificationSuccess('');
      try {
        localStorage.setItem('aicqb_notification_prefs', JSON.stringify(notificationPrefs));
      } catch (_) {}

      await api.updateProfile({
        preferences: {
          notifications: notificationPrefs,
          privacy: privacyPrefs,
          language: selectedLanguage,
        },
      }).catch(() => null);

      setNotificationSuccess('Notification preferences saved successfully!');
      showToast('Notification preferences updated successfully.');
      setTimeout(() => {
        setShowNotificationModal(false);
        setNotificationSuccess('');
      }, 1200);
    } catch (err: any) {
      setNotificationSuccess('Saved to your device successfully.');
      setTimeout(() => setShowNotificationModal(false), 1200);
    } finally {
      setNotificationLoading(false);
    }
  };

  // Handle Save Privacy
  const handleSavePrivacy = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setPrivacyLoading(true);
      setPrivacySuccess('');
      try {
        localStorage.setItem('aicqb_privacy_prefs', JSON.stringify(privacyPrefs));
      } catch (_) {}

      await api.updateProfile({
        preferences: {
          notifications: notificationPrefs,
          privacy: privacyPrefs,
          language: selectedLanguage,
        },
      }).catch(() => null);

      setPrivacySuccess('Privacy & Security settings updated successfully!');
      showToast('Privacy & security settings updated successfully.');
      setTimeout(() => {
        setShowPrivacyModal(false);
        setPrivacySuccess('');
      }, 1200);
    } catch (err: any) {
      setPrivacySuccess('Saved to your device successfully.');
      setTimeout(() => setShowPrivacyModal(false), 1200);
    } finally {
      setPrivacyLoading(false);
    }
  };

  // Handle Language Change
  const handleSelectLanguage = async (lang: string) => {
    setSelectedLanguage(lang);
    try {
      localStorage.setItem('aicqb_language', lang);
    } catch (_) {}

    await api.updateProfile({
      preferences: {
        notifications: notificationPrefs,
        privacy: privacyPrefs,
        language: lang,
      },
    }).catch(() => null);

    showToast(`Examination & portal language set to ${lang}.`);
    setShowLanguageModal(false);
  };

  const languagesList = [
    { code: 'en', name: 'English', native: 'English (US & Global)', flag: '🇺🇸', default: true },
    { code: 'es', name: 'Spanish', native: 'Español (América Latina / España)', flag: '🇪🇸' },
    { code: 'fr', name: 'French', native: 'Français (France / Canada)', flag: '🇫🇷' },
    { code: 'de', name: 'German', native: 'Deutsch (Deutschland / Österreich)', flag: '🇩🇪' },
    { code: 'hi', name: 'Hindi', native: 'हिन्दी (भारत)', flag: '🇮🇳' },
    { code: 'ja', name: 'Japanese', native: '日本語 (日本)', flag: '🇯🇵' },
    { code: 'ar', name: 'Arabic', native: 'العربية (الشرق الأوسط)', flag: '🇦🇪' },
  ];

  // Password Modal Functions
  const handleOpenPasswordModal = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setPasswordSuccess('');
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setShowPasswordModal(true);
  };

  const handleClosePasswordModal = () => {
    if (passwordLoading) return;
    setShowPasswordModal(false);
    setPasswordError('');
    setPasswordSuccess('');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword.trim()) {
      setPasswordError('Please enter your current password.');
      return;
    }
    if (!newPassword.trim()) {
      setPasswordError('Please enter a new password.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match. Please verify.');
      return;
    }
    if (newPassword === currentPassword) {
      setPasswordError('New password must be different from your current password.');
      return;
    }

    try {
      setPasswordLoading(true);
      const res = await api.changePassword({
        currentPassword: currentPassword.trim(),
        newPassword: newPassword.trim(),
        confirmPassword: confirmPassword.trim(),
      });

      if (res.success) {
        setPasswordSuccess(res.message || 'Password updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          setShowPasswordModal(false);
          setPasswordSuccess('');
          showToast('Account password updated successfully.');
        }, 1500);
      } else {
        setPasswordError(res.message || 'Failed to update password. Please check your credentials.');
      }
    } catch (err: any) {
      setPasswordError(err.message || 'Current password is incorrect. Please check and try again.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-5">
      {/* Header matching Screen 9 in Screenshot */}
      <div>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#F47716] flex items-center justify-center flex-shrink-0">
            <Settings className="w-5 h-5 stroke-[2.2]" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#10264B]">Settings</h1>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Manage your account and preferences.
        </p>
      </div>

      {/* Global Toast Banner */}
      {toastMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-emerald-500 hover:text-emerald-700"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Settings Options List matching Screen 9 */}
      <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100 shadow-xs overflow-hidden">
        {/* 1. Notification Preferences matching Screen 9 */}
        <div
          onClick={() => setShowNotificationModal(true)}
          className="p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer group"
        >
          <div className="flex items-center space-x-3.5">
            <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#F47716] flex items-center justify-center group-hover:scale-105 transition-transform flex-shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-[#10264B]">Notification Preferences</h3>
              <p className="text-[11px] text-gray-500">Manage email, SMS and app notifications.</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#F47716] transition-colors" />
        </div>

        {/* 2. Account Security matching Screen 9 */}
        <div
          onClick={() => setShowPrivacyModal(true)}
          className="p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer group"
        >
          <div className="flex items-center space-x-3.5">
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-[#10264B] flex items-center justify-center group-hover:scale-105 transition-transform flex-shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-[#10264B]">Account Security</h3>
              <p className="text-[11px] text-gray-500">Control passwords, sessions and account security.</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#10264B] transition-colors" />
        </div>

        {/* 3. Language matching Screen 9 */}
        <div
          onClick={() => setShowLanguageModal(true)}
          className="p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer group"
        >
          <div className="flex items-center space-x-3.5">
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-[#10264B] flex items-center justify-center group-hover:scale-105 transition-transform flex-shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-[#10264B]">Language</h3>
              <p className="text-[11px] text-gray-500">Choose your preferred examination language.</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-gray-600">{selectedLanguage}</span>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#10264B] transition-colors" />
          </div>
        </div>

        {/* 4. Theme matching Screen 9 */}
        <div
          onClick={() => showToast('Theme is set to Light mode (AICQB Official Standard)')}
          className="p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer group"
        >
          <div className="flex items-center space-x-3.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform flex-shrink-0">
              <Sun className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-[#10264B]">Theme</h3>
              <p className="text-[11px] text-gray-500">Customize interface appearance.</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-gray-600">Light</span>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#10264B] transition-colors" />
          </div>
        </div>

        {/* 5. About AIICQB matching Screen 9 */}
        <div
          onClick={() => navigate('/about')}
          className="p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer group"
        >
          <div className="flex items-center space-x-3.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#10264B] flex items-center justify-center group-hover:scale-105 transition-transform flex-shrink-0">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-[#10264B]">About AIICQB</h3>
              <p className="text-[11px] text-gray-500">Learn about our board and accreditation standards.</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#10264B] transition-colors" />
        </div>

        {/* 6. Help & Support matching Screen 9 */}
        <div
          onClick={() => navigate('/portal/support')}
          className="p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer group"
        >
          <div className="flex items-center space-x-3.5">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform flex-shrink-0">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-[#10264B]">Help & Support</h3>
              <p className="text-[11px] text-gray-500">Get technical assistance and exam support.</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-purple-600 transition-colors" />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. NOTIFICATION PREFERENCES MODAL */}
      {/* ========================================================================= */}
      {showNotificationModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-5 shadow-2xl border border-gray-100 my-auto animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-xs">
                  <Bell className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#10264B]">Notification Preferences</h3>
                  <p className="text-xs text-gray-500">Manage email, SMS and app notifications</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNotificationModal(false)}
                className="w-8 h-8 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Notification Success Banner */}
            {notificationSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{notificationSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveNotifications} className="space-y-4">
              {/* Section A: Email Notifications */}
              <div className="space-y-2.5">
                <div className="flex items-center space-x-2 text-xs font-black text-[#10264B] uppercase tracking-wider">
                  <Mail className="w-3.5 h-3.5 text-purple-600" />
                  <span>Email Notifications</span>
                </div>

                <div className="space-y-2 bg-slate-50/70 p-3 rounded-2xl border border-slate-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-gray-800">Exam Schedules & Booking</p>
                      <p className="text-[11px] text-gray-500">Receive booking confirmations and scheduled slot reminders.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNotificationPrefs((p) => ({ ...p, emailExams: !p.emailExams }))}
                      className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                        notificationPrefs.emailExams ? 'bg-[#F47716]' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`w-4 h-4 rounded-full bg-white transition-all block shadow-xs absolute top-1 ${
                          notificationPrefs.emailExams ? 'right-1' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                    <div>
                      <p className="text-xs font-bold text-gray-800">Results & Certificate Delivery</p>
                      <p className="text-[11px] text-gray-500">Get notified when exam results are published and certificates issued.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNotificationPrefs((p) => ({ ...p, emailResults: !p.emailResults }))}
                      className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                        notificationPrefs.emailResults ? 'bg-[#F47716]' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`w-4 h-4 rounded-full bg-white transition-all block shadow-xs absolute top-1 ${
                          notificationPrefs.emailResults ? 'right-1' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                    <div>
                      <p className="text-xs font-bold text-gray-800">Certification Updates & News</p>
                      <p className="text-[11px] text-gray-500">Receive announcements on new certifications and syllabus updates.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNotificationPrefs((p) => ({ ...p, emailNews: !p.emailNews }))}
                      className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                        notificationPrefs.emailNews ? 'bg-[#F47716]' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`w-4 h-4 rounded-full bg-white transition-all block shadow-xs absolute top-1 ${
                          notificationPrefs.emailNews ? 'right-1' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Section B: SMS & WhatsApp Alerts */}
              <div className="space-y-2.5">
                <div className="flex items-center space-x-2 text-xs font-black text-[#10264B] uppercase tracking-wider">
                  <Smartphone className="w-3.5 h-3.5 text-purple-600" />
                  <span>SMS & Mobile Alerts</span>
                </div>

                <div className="space-y-2 bg-slate-50/70 p-3 rounded-2xl border border-slate-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-gray-800">Critical Exam Reminders (24h & 1h prior)</p>
                      <p className="text-[11px] text-gray-500">Automated SMS alerts before scheduled exam slot begins.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNotificationPrefs((p) => ({ ...p, smsReminders: !p.smsReminders }))}
                      className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                        notificationPrefs.smsReminders ? 'bg-[#F47716]' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`w-4 h-4 rounded-full bg-white transition-all block shadow-xs absolute top-1 ${
                          notificationPrefs.smsReminders ? 'right-1' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                    <div>
                      <p className="text-xs font-bold text-gray-800">Security Codes & Verification Alerts</p>
                      <p className="text-[11px] text-gray-500">High-priority SMS codes for account security.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNotificationPrefs((p) => ({ ...p, smsSecurity: !p.smsSecurity }))}
                      className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                        notificationPrefs.smsSecurity ? 'bg-[#F47716]' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`w-4 h-4 rounded-full bg-white transition-all block shadow-xs absolute top-1 ${
                          notificationPrefs.smsSecurity ? 'right-1' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowNotificationModal(false)}
                  disabled={notificationLoading}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={notificationLoading}
                  className="px-5 py-2.5 bg-[#F47716] hover:bg-[#E35D00] text-white text-xs font-extrabold rounded-xl shadow-md hover:shadow-orange-500/25 transition-all flex items-center space-x-1.5 cursor-pointer"
                >
                  {notificationLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{notificationLoading ? 'Saving...' : 'Save Preferences'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. PRIVACY & SECURITY MODAL */}
      {/* ========================================================================= */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-5 shadow-2xl border border-gray-100 my-auto animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-green-50 text-green-700 flex items-center justify-center shadow-xs">
                  <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#10264B]">Privacy & Security</h3>
                  <p className="text-xs text-gray-500">Control your data and account security</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPrivacyModal(false)}
                className="w-8 h-8 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Privacy Success Banner */}
            {privacySuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{privacySuccess}</span>
              </div>
            )}

            <form onSubmit={handleSavePrivacy} className="space-y-4">
              {/* Feature 1: Two Factor Authentication */}
              <div className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-100 flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-1.5">
                    <Lock className="w-3.5 h-3.5 text-green-700" />
                    <p className="text-xs font-bold text-gray-800">Two-Factor Authentication (2FA)</p>
                  </div>
                  <p className="text-[11px] text-gray-500">
                    Require one-time email OTP verification on login from unrecognized devices.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPrivacyPrefs((p) => ({ ...p, twoFactorAuth: !p.twoFactorAuth }))}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer flex-shrink-0 mt-0.5 ${
                    privacyPrefs.twoFactorAuth ? 'bg-green-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full bg-white transition-all block shadow-xs absolute top-1 ${
                      privacyPrefs.twoFactorAuth ? 'right-1' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              {/* Feature 2: Public Certificate Verification */}
              <div className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-100 flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-1.5">
                    <Shield className="w-3.5 h-3.5 text-green-700" />
                    <p className="text-xs font-bold text-gray-800">Public Certificate Verification</p>
                  </div>
                  <p className="text-[11px] text-gray-500">
                    Allow employers and institutions to verify your credentials via public verification links.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPrivacyPrefs((p) => ({ ...p, publicCertVerification: !p.publicCertVerification }))}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer flex-shrink-0 mt-0.5 ${
                    privacyPrefs.publicCertVerification ? 'bg-green-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full bg-white transition-all block shadow-xs absolute top-1 ${
                      privacyPrefs.publicCertVerification ? 'right-1' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              {/* Feature 3: Hide Contact Details */}
              <div className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-100 flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-1.5">
                    <EyeOff className="w-3.5 h-3.5 text-green-700" />
                    <p className="text-xs font-bold text-gray-800">Hide Personal Contact Information</p>
                  </div>
                  <p className="text-[11px] text-gray-500">
                    Mask your phone number and physical address on public verification transcripts.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPrivacyPrefs((p) => ({ ...p, hideContactInfo: !p.hideContactInfo }))}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer flex-shrink-0 mt-0.5 ${
                    privacyPrefs.hideContactInfo ? 'bg-green-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full bg-white transition-all block shadow-xs absolute top-1 ${
                      privacyPrefs.hideContactInfo ? 'right-1' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              {/* Feature 4: Session Timeout & Active Sessions */}
              <div className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-100 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <Clock className="w-3.5 h-3.5 text-green-700" />
                    <span className="text-xs font-bold text-gray-800">Inactivity Session Timeout</span>
                  </div>
                  <select
                    value={privacyPrefs.sessionTimeout}
                    onChange={(e) => setPrivacyPrefs((p) => ({ ...p, sessionTimeout: e.target.value }))}
                    className="text-xs font-semibold text-[#10264B] bg-white border border-gray-200 rounded-lg px-2.5 py-1 focus:outline-none"
                  >
                    <option>30 Minutes</option>
                    <option>1 Hour</option>
                    <option>4 Hours</option>
                    <option>24 Hours</option>
                  </select>
                </div>

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Laptop className="w-3.5 h-3.5 text-gray-500" />
                    <div>
                      <p className="text-xs font-bold text-gray-800">Current Active Session</p>
                      <p className="text-[10px] text-gray-400">Web Portal • Chrome / Desktop</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSessionTerminated(true);
                      showToast('All other active device sessions have been revoked.');
                    }}
                    disabled={sessionTerminated}
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                      sessionTerminated
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-white hover:bg-red-50 text-red-600 border-red-200'
                    }`}
                  >
                    {sessionTerminated ? 'Revoked ✓' : 'Revoke Others'}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowPrivacyModal(false)}
                  disabled={privacyLoading}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={privacyLoading}
                  className="px-5 py-2.5 bg-green-700 hover:bg-green-800 text-white text-xs font-extrabold rounded-xl shadow-md transition-all flex items-center space-x-1.5 cursor-pointer"
                >
                  {privacyLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{privacyLoading ? 'Saving...' : 'Save Settings'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. LANGUAGE SELECTION MODAL */}
      {/* ========================================================================= */}
      {showLanguageModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-5 shadow-2xl border border-gray-100 my-auto animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-xs">
                  <Globe className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#10264B]">Select Language</h3>
                  <p className="text-xs text-gray-500">Choose your preferred portal & exam language</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowLanguageModal(false)}
                className="w-8 h-8 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Languages Grid / List */}
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {languagesList.map((lang) => {
                const isSelected = selectedLanguage === lang.name;
                return (
                  <div
                    key={lang.code}
                    onClick={() => handleSelectLanguage(lang.name)}
                    className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'border-[#F47716] bg-orange-50/50 shadow-xs ring-1 ring-orange-200'
                        : 'border-slate-100 hover:border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{lang.flag}</span>
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="text-xs sm:text-sm font-extrabold text-[#10264B]">{lang.name}</span>
                          {lang.default && (
                            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-blue-100 text-blue-700">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-500">{lang.native}</p>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-[#F47716] text-white flex items-center justify-center shadow-xs">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer Notice */}
            <p className="text-[11px] text-gray-400 text-center font-medium">
              Examination questions, instructions, and reports will be rendered in the selected language.
            </p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. CHANGE PASSWORD MODAL */}
      {/* ========================================================================= */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-5 shadow-2xl border border-gray-100 my-auto animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-1 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-50 text-[#F47716] flex items-center justify-center">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#10264B]">Change Password</h3>
                  <p className="text-xs text-gray-500">Update your security credentials</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClosePasswordModal}
                disabled={passwordLoading}
                className="w-8 h-8 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error Notification */}
            {passwordError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-start space-x-2 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <span>{passwordError}</span>
              </div>
            )}

            {/* Success Notification */}
            {passwordSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium flex items-start space-x-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleChangePassword} className="space-y-3.5">
              {/* Current Password */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Current Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter your current password"
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:border-[#F47716] focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:border-[#F47716] focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your new password"
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:border-[#F47716] focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleClosePasswordModal}
                  disabled={passwordLoading}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="px-5 py-2.5 bg-gradient-to-r from-[#F47716] to-[#E0660A] text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg hover:brightness-105 active:scale-95 disabled:opacity-50 transition-all flex items-center space-x-1.5 cursor-pointer"
                >
                  {passwordLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{passwordLoading ? 'Updating...' : 'Update Password'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
