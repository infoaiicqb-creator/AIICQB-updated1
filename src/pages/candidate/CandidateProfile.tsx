import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  CheckCircle2,
  Edit3,
  ShieldCheck,
  Award,
  Loader2,
  X,
  Save,
  Copy,
  Check,
  Building2,
  Briefcase,
  Sparkles,
  Globe,
  FileText,
} from 'lucide-react';

export const CandidateProfile: React.FC = () => {
  const { user, candidate, updateCandidateState } = useAuth();
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeSection, setActiveSection] = useState<'all' | 'personal' | 'contact' | 'professional'>('all');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [copiedId, setCopiedId] = useState(false);

  // Form fields initialized dynamically from active candidate/user profile
  const [fullName, setFullName] = useState(user?.fullName || candidate?.fullName || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || candidate?.phoneNumber || '');
  const [dateOfBirth, setDateOfBirth] = useState(candidate?.dateOfBirth || '');
  const [gender, setGender] = useState(candidate?.gender || 'Male');
  const [country, setCountry] = useState(candidate?.country || 'India');
  const [address, setAddress] = useState(candidate?.address || '');
  const [aboutMe, setAboutMe] = useState(candidate?.aboutMe || '');
  const [organization, setOrganization] = useState(candidate?.organization || (user as any)?.organization || '');

  const candidateId = candidate?.candidateId || user?.candidateId || '';
  const email = candidate?.email || user?.email || '';

  // Calculate dynamic real profile completion percentage based on actual filled fields
  const computeCompletion = () => {
    let filled = 0;
    const fields = [
      fullName,
      phoneNumber,
      country,
      address,
      gender && gender !== 'Not specified' ? gender : '',
      dateOfBirth,
      aboutMe,
    ];
    fields.forEach((f) => {
      if (f && String(f).trim().length > 0) filled++;
    });
    return Math.min(100, Math.round((filled / fields.length) * 100));
  };

  const completion = computeCompletion();

  // Sync state if candidate or user updates from backend
  useEffect(() => {
    if (candidate) {
      if (candidate.fullName) setFullName(candidate.fullName);
      if (candidate.phoneNumber) setPhoneNumber(candidate.phoneNumber);
      if (candidate.dateOfBirth) setDateOfBirth(candidate.dateOfBirth);
      if (candidate.gender) setGender(candidate.gender);
      if (candidate.country) setCountry(candidate.country);
      if (candidate.address) setAddress(candidate.address);
      if (candidate.aboutMe) setAboutMe(candidate.aboutMe);
      if (candidate.organization) setOrganization(candidate.organization);
    } else if (user) {
      if (user.fullName) setFullName(user.fullName);
      if (user.phoneNumber) setPhoneNumber(user.phoneNumber);
    }
  }, [candidate, user]);

  const handleCopyId = () => {
    if (!candidateId) return;
    navigator.clipboard.writeText(candidateId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const openEditModal = (section: 'all' | 'personal' | 'contact' | 'professional' = 'all') => {
    setActiveSection(section);
    setShowEditModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await api.updateProfile({
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
        dateOfBirth: dateOfBirth.trim(),
        gender,
        country: country.trim(),
        address: address.trim(),
        aboutMe: aboutMe.trim(),
        organization: organization.trim(),
      });

      if (res.success) {
        updateCandidateState(res.candidate);
        setSuccessMsg('Profile updated successfully!');
        setShowEditModal(false);
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6 max-w-6xl mx-auto">
      {/* Toast Notification */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-2xl text-xs sm:text-sm font-semibold flex items-center justify-between shadow-md animate-fadeIn">
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button
            onClick={() => setSuccessMsg('')}
            className="text-emerald-700 hover:text-emerald-900 p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Mobile Profile View matching Screen 7 in Screenshot */}
      <div className="md:hidden space-y-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#F47716] flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 stroke-[2.2]" />
            </div>
            <h1 className="text-xl font-black text-[#10264B]">My Profile</h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Manage your personal and account details.
          </p>
        </div>

        {/* 4 Clean Profile Cards matching Screen 7 */}
        <div className="space-y-2.5 pt-1">
          {/* Card 1: Full Name */}
          <div
            onClick={() => openEditModal('personal')}
            className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs flex items-center justify-between cursor-pointer active:scale-[0.99] transition-all"
          >
            <div className="flex items-center space-x-3.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-slate-100 text-[#10264B] flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10.5px] font-semibold text-gray-500 uppercase tracking-wider block">
                  Full Name
                </span>
                <p className="text-sm font-bold text-[#10264B] truncate">
                  {fullName || 'Pushpak Wani'}
                </p>
              </div>
            </div>
            <button
              type="button"
              className="p-1.5 text-gray-400 hover:text-[#F47716] transition-colors"
              title="Edit Name"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          </div>

          {/* Card 2: Email */}
          <div
            onClick={() => openEditModal('contact')}
            className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs flex items-center justify-between cursor-pointer active:scale-[0.99] transition-all"
          >
            <div className="flex items-center space-x-3.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-slate-100 text-[#10264B] flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10.5px] font-semibold text-gray-500 uppercase tracking-wider block">
                  Email
                </span>
                <p className="text-sm font-bold text-[#10264B] truncate">
                  {email || 'pushpak.wani@gmail.com'}
                </p>
              </div>
            </div>
            <button
              type="button"
              className="p-1.5 text-gray-400 hover:text-[#F47716] transition-colors"
              title="Edit Email"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          </div>

          {/* Card 3: Mobile Number */}
          <div
            onClick={() => openEditModal('contact')}
            className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs flex items-center justify-between cursor-pointer active:scale-[0.99] transition-all"
          >
            <div className="flex items-center space-x-3.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-slate-100 text-[#10264B] flex items-center justify-center flex-shrink-0">
                <Phone className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10.5px] font-semibold text-gray-500 uppercase tracking-wider block">
                  Mobile Number
                </span>
                <p className="text-sm font-bold text-[#10264B] truncate">
                  {phoneNumber || '+91 98765 43210'}
                </p>
              </div>
            </div>
            <button
              type="button"
              className="p-1.5 text-gray-400 hover:text-[#F47716] transition-colors"
              title="Edit Phone"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          </div>

          {/* Card 4: Candidate ID */}
          <div
            onClick={handleCopyId}
            className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs flex items-center justify-between cursor-pointer active:scale-[0.99] transition-all"
          >
            <div className="flex items-center space-x-3.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#F47716] flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10.5px] font-semibold text-gray-500 uppercase tracking-wider block">
                  Candidate ID
                </span>
                <p className="text-sm font-mono font-black text-[#10264B] truncate">
                  {candidateId || 'AIICQB-1004721'}
                </p>
              </div>
            </div>
            <button
              type="button"
              className="p-1.5 text-gray-400 hover:text-[#F47716] transition-colors"
              title="Copy Candidate ID"
            >
              {copiedId ? (
                <Check className="w-4 h-4 text-emerald-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Header Banner */}
      <div className="hidden md:block bg-gradient-to-r from-[#10264B] via-[#163363] to-[#0d1e38] text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-700/60 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center space-x-5">
            {/* Candidate Avatar */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-[#F47716] to-[#DC660E] text-white flex items-center justify-center font-black text-3xl sm:text-4xl shadow-lg border-2 border-white/20 flex-shrink-0">
              {fullName ? fullName.charAt(0).toUpperCase() : 'P'}
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{fullName}</h1>
                <span className="inline-flex items-center text-[10px] font-bold text-emerald-300 bg-emerald-900/60 px-2.5 py-0.5 rounded-full border border-emerald-500/40">
                  <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-400" />
                  Verified Candidate
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
                <div
                  onClick={handleCopyId}
                  className="flex items-center space-x-1.5 font-mono text-xs font-bold text-orange-200 bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-lg border border-white/15 cursor-pointer transition-colors"
                  title="Click to copy Candidate ID"
                >
                  <span>{candidateId}</span>
                  {copiedId ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 opacity-80" />
                  )}
                </div>
                <span>•</span>
                <span className="text-slate-300">{email}</span>
                {country && (
                  <>
                    <span>•</span>
                    <span className="text-slate-300">{country}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Simple Main Action: Edit Profile Button */}
          <div className="flex flex-col sm:items-end gap-3">
            <button
              onClick={() => openEditModal('all')}
              className="px-6 py-3 bg-[#F47716] hover:bg-[#DC660E] text-white font-black text-xs sm:text-sm rounded-2xl shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-95"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Profile</span>
            </button>

            {/* Profile Completion Bar */}
            <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-2xl border border-white/10 flex items-center space-x-3">
              <span className="text-[11px] text-slate-300 font-semibold uppercase tracking-wider">
                Profile Completion
              </span>
              <div className="w-24 h-2 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-green-500 rounded-full transition-all duration-500"
                  style={{ width: `${completion}%` }}
                ></div>
              </div>
              <span className="text-xs font-black text-emerald-300">{completion}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3 Simple Structured Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section 1: Personal Details */}
        <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-7 shadow-sm space-y-5 hover:border-slate-300 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#F47716] flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <h2 className="font-bold text-base text-[#10264B]">Personal Information</h2>
              </div>
              <button
                onClick={() => openEditModal('personal')}
                className="text-xs font-bold text-[#F47716] hover:text-[#DC660E] flex items-center space-x-1 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 text-xs sm:text-sm">
              <div className="space-y-1">
                <span className="text-gray-400 block font-medium">Full Name</span>
                <span className="font-bold text-[#10264B] text-sm sm:text-base">
                  {fullName || <span className="text-gray-400 italic font-normal">Not provided</span>}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-gray-400 block font-medium">Gender</span>
                <span className="font-bold text-[#10264B] text-sm sm:text-base">{gender || 'Male'}</span>
              </div>

              <div className="space-y-1">
                <span className="text-gray-400 block font-medium">Date of Birth</span>
                <span className="font-bold text-[#10264B] text-sm sm:text-base">
                  {dateOfBirth || <span className="text-gray-400 italic font-normal">Not provided</span>}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-gray-400 block font-medium">Country</span>
                <span className="font-bold text-[#10264B] text-sm sm:text-base">{country || 'India'}</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 text-[11px] text-gray-400 flex items-center space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Identity verified under AICQB Candidate Registry</span>
          </div>
        </div>

        {/* Section 2: Contact & Identification */}
        <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-7 shadow-sm space-y-5 hover:border-slate-300 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Mail className="w-5 h-5" />
                </div>
                <h2 className="font-bold text-base text-[#10264B]">Contact & Communication</h2>
              </div>
              <button
                onClick={() => openEditModal('contact')}
                className="text-xs font-bold text-[#F47716] hover:text-[#DC660E] flex items-center space-x-1 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 text-xs sm:text-sm">
              <div className="space-y-1">
                <span className="text-gray-400 block font-medium">Email Address</span>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-[#10264B] text-sm truncate">{email}</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-gray-400 block font-medium">Mobile Number</span>
                <span className="font-bold text-[#10264B] text-sm sm:text-base">
                  {phoneNumber || <span className="text-gray-400 italic font-normal">Not provided</span>}
                </span>
              </div>

              <div className="sm:col-span-2 space-y-1">
                <span className="text-gray-400 block font-medium">Residential / City Address</span>
                <span className="font-bold text-[#10264B] text-sm sm:text-base">
                  {address || <span className="text-gray-400 italic font-normal">No address provided</span>}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 text-[11px] text-gray-400 flex items-center space-x-1.5">
            <Globe className="w-3.5 h-3.5 text-[#F47716]" />
            <span>Used for proctored exam timezone & digital certificates</span>
          </div>
        </div>
      </div>

      {/* Section 3: Professional Background & About Me */}
      <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-5 hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-[#10264B]">Professional Background & Summary</h2>
              <p className="text-xs text-gray-400">Your bio displayed on earned AICQB credentials</p>
            </div>
          </div>
          <button
            onClick={() => openEditModal('professional')}
            className="text-xs font-bold text-[#F47716] hover:text-[#DC660E] flex items-center space-x-1 cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Summary</span>
          </button>
        </div>

        <div className="space-y-4">
          {organization && (
            <div className="flex items-center space-x-3 text-xs sm:text-sm">
              <Building2 className="w-4 h-4 text-slate-400" />
              <span className="text-gray-500 font-medium">Organization / Company:</span>
              <span className="font-bold text-[#10264B]">{organization}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <span className="text-gray-400 block text-xs font-medium">Professional Bio / About Me</span>
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-700 leading-relaxed">
              {aboutMe ? (
                <p className="whitespace-pre-line">{aboutMe}</p>
              ) : (
                <p className="text-gray-400 italic">
                  No professional summary provided. Click "Edit Summary" to add your role, years of experience, testing/AI specialties, and technologies.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SIMPLE EDIT PROFILE MODAL */}
      {/* ========================================================================= */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-[#10264B]/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 my-auto animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#10264B] to-[#163363] text-white p-5 sm:p-6 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-white/10 p-2.5 rounded-xl border border-white/20">
                  <Edit3 className="w-5 h-5 text-[#F47716]" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Edit Candidate Profile</h3>
                  <p className="text-xs text-slate-300">
                    Update your profile information easily. All changes sync in real-time.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="text-slate-300 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="p-6 sm:p-8 space-y-5 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="space-y-1">
                  <label className="block font-semibold text-gray-700">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F47716] focus:bg-white focus:outline-none transition-all"
                  />
                </div>

                {/* Mobile Number */}
                <div className="space-y-1">
                  <label className="block font-semibold text-gray-700">Mobile Number *</label>
                  <input
                    type="text"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F47716] focus:bg-white focus:outline-none transition-all"
                  />
                </div>

                {/* Date of Birth */}
                <div className="space-y-1">
                  <label className="block font-semibold text-gray-700">Date of Birth</label>
                  <input
                    type="text"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F47716] focus:bg-white focus:outline-none transition-all"
                  />
                </div>

                {/* Gender */}
                <div className="space-y-1">
                  <label className="block font-semibold text-gray-700">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F47716] focus:bg-white focus:outline-none transition-all font-medium text-gray-800"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>

                {/* Country */}
                <div className="space-y-1">
                  <label className="block font-semibold text-gray-700">Country</label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F47716] focus:bg-white focus:outline-none transition-all"
                  />
                </div>

                {/* City / Address */}
                <div className="space-y-1">
                  <label className="block font-semibold text-gray-700">City / Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F47716] focus:bg-white focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Organization / Company */}
              <div className="space-y-1">
                <label className="block font-semibold text-gray-700">
                  Organization / Company <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F47716] focus:bg-white focus:outline-none transition-all"
                />
              </div>

              {/* About Me Bio */}
              <div className="space-y-1">
                <label className="block font-semibold text-gray-700">About Me / Professional Bio</label>
                <textarea
                  rows={3}
                  value={aboutMe}
                  onChange={(e) => setAboutMe(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F47716] focus:bg-white focus:outline-none transition-all leading-relaxed"
                />
              </div>

              {/* Modal Buttons */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-[#F47716] hover:bg-[#DC660E] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
