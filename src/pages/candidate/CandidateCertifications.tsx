import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Certification, Certificate } from '../../types';
import { RazorpayModal } from '../../components/RazorpayModal';
import { CertificateModal } from '../../components/CertificateModal';
import { SelectExamLevelModal } from '../../components/SelectExamLevelModal';
import {
  Search,
  Award,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  GraduationCap,
  Loader2,
  Sparkles,
  CalendarCheck,
  FileCheck2,
  ExternalLink,
  BookOpen,
  X,
} from 'lucide-react';

export const CandidateCertifications: React.FC = () => {
  const navigate = useNavigate();
  const { user, candidate } = useAuth();

  const [certifications, setCertifications] = useState<Certification[]>(() => {
    try {
      const c = localStorage.getItem('aicqb_all_certifications');
      return c ? JSON.parse(c) : [];
    } catch (_) {
      return [];
    }
  });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('All');
  const [activeTab, setActiveTab] = useState<'all' | 'enrolled' | 'completed'>('all');
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<'All' | 'foundation' | 'professional' | 'expert'>('All');
  const [showLevelMenu, setShowLevelMenu] = useState(false);
  const [initialLevelModalId, setInitialLevelModalId] = useState<'foundation' | 'professional' | 'expert'>('professional');

  // Candidate status (Enrolled & Completed)
  const [enrolledCertIds, setEnrolledCertIds] = useState<string[]>(() => {
    try {
      const c = localStorage.getItem('aicqb_enrolled_cert_ids');
      return c ? JSON.parse(c) : [];
    } catch (_) {
      return [];
    }
  });
  const [completedCertIds, setCompletedCertIds] = useState<string[]>(() => {
    try {
      const c = localStorage.getItem('aicqb_completed_cert_ids');
      return c ? JSON.parse(c) : [];
    } catch (_) {
      return [];
    }
  });
  const [candidateCertificates, setCandidateCertificates] = useState<Certificate[]>([]);

  // Modals
  const [selectedForLevelModal, setSelectedForLevelModal] = useState<Certification | null>(null);
  const [selectedForEnroll, setSelectedForEnroll] = useState<any>(null);
  const [selectedCertificateModal, setSelectedCertificateModal] = useState<Certificate | null>(null);
  const [enrolledSuccessBanner, setEnrolledSuccessBanner] = useState<{ name: string; code: string } | null>(null);

  useEffect(() => {
    loadData();
  }, [searchTerm, selectedDomain]);

  const loadData = async () => {
    try {
      if (certifications.length === 0) setLoading(true);
      const [certRes, statusRes] = await Promise.all([
        api.getCertifications({
          search: searchTerm,
          domain: selectedDomain === 'All Categories' ? 'All' : selectedDomain,
          publicOnly: 'true',
        }).catch(() => ({ success: false, certifications: [] })),
        api.getCandidateCertificationStatus().catch(() => ({ success: false, enrolledCertIds: [], completedCertIds: [] })),
      ]);

      if (certRes.success && Array.isArray(certRes.certifications)) {
        setCertifications(certRes.certifications);
        try { localStorage.setItem('aicqb_all_certifications', JSON.stringify(certRes.certifications)); } catch (_) { }
      }

      if (statusRes.success) {
        setEnrolledCertIds(statusRes.enrolledCertIds || []);
        setCompletedCertIds(statusRes.completedCertIds || []);
        try {
          localStorage.setItem('aicqb_enrolled_cert_ids', JSON.stringify(statusRes.enrolledCertIds || []));
          localStorage.setItem('aicqb_completed_cert_ids', JSON.stringify(statusRes.completedCertIds || []));
        } catch (_) { }
        if (Array.isArray(statusRes.certificates)) {
          setCandidateCertificates(statusRes.certificates);
        }
      }
    } catch (err) {
      console.error('Failed to load certifications data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Dynamically derive category domains from active catalog
  const domainOptions = [
    'All Categories',
    ...Array.from(new Set(certifications.map((c) => c.domain).filter(Boolean))),
  ];

  // Helper matchers
  const normalize = (val?: string) => (val || '').replace(/®/g, '').trim().toLowerCase();

  const isCertCompleted = (cert: Certification) => {
    const certCodeClean = normalize(cert.code);
    const certNameClean = normalize(cert.name);
    return (
      completedCertIds.some(
        (id) =>
          id === cert.id ||
          normalize(id) === certCodeClean ||
          (certCodeClean && normalize(id).includes(certCodeClean)) ||
          (certCodeClean && certCodeClean.includes(normalize(id)))
      ) ||
      candidateCertificates.some(
        (c) =>
          c.certificationId === cert.id ||
          normalize(c.certificationCode) === certCodeClean ||
          normalize(c.certificationName) === certNameClean ||
          (certCodeClean && normalize(c.certificationCode).includes(certCodeClean))
      )
    );
  };

  const isCertEnrolled = (cert: Certification) => {
    const certCodeClean = normalize(cert.code);
    return (
      !isCertCompleted(cert) &&
      enrolledCertIds.some(
        (id) =>
          id === cert.id ||
          normalize(id) === certCodeClean ||
          (certCodeClean && normalize(id).includes(certCodeClean)) ||
          (certCodeClean && certCodeClean.includes(normalize(id)))
      )
    );
  };

  const getCertificateForCert = (cert: Certification) => {
    const certCodeClean = normalize(cert.code);
    const certNameClean = normalize(cert.name);
    return candidateCertificates.find(
      (c) =>
        c.certificationId === cert.id ||
        normalize(c.certificationCode) === certCodeClean ||
        normalize(c.certificationName) === certNameClean ||
        (c.certificationCode && certCodeClean.includes(normalize(c.certificationCode))) ||
        (certCodeClean && normalize(c.certificationCode).includes(certCodeClean))
    );
  };

  // Dynamic filter collections
  const enrolledCerts = certifications.filter((c) => isCertEnrolled(c));
  const completedCerts = certifications.filter((c) => isCertCompleted(c));

  const displayCertifications =
    activeTab === 'enrolled'
      ? enrolledCerts
      : activeTab === 'completed'
        ? completedCerts
        : certifications;

  return (
    <div className="space-y-6">
      {/* Title matching Image 2 #3 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#10264B]">Certifications</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Explore and enroll in AICQB professional certifications.
          </p>
        </div>
      </div>

      {/* Real-time Enrolled & Exam Added Alert Banner */}
      {enrolledSuccessBanner && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-950">
                Payment Confirmed & Exam Scheduled!
              </p>
              <p className="text-xs text-emerald-800">
                You are enrolled in <span className="font-bold">{enrolledSuccessBanner.name} ({enrolledSuccessBanner.code})</span>. The examination has been automatically added to your <strong>My Exams</strong> section!
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0">
            <button
              onClick={() => navigate('/portal/exams')}
              className="px-4 py-2 bg-[#10264B] hover:bg-[#1E3A6E] text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <span>View in My Exams</span>
              <ChevronRight className="w-4 h-4 text-[#F47716]" />
            </button>
            <button
              onClick={() => setEnrolledSuccessBanner(null)}
              className="p-1.5 text-emerald-700 hover:text-emerald-900 rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Search and Filters matching Image 2 #3 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search certifications by name, code, domain..."
              className="w-full pl-10 pr-3.5 py-2 text-xs bg-slate-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#F47716]"
            />
          </div>
          <select
            value={selectedDomain}
            onChange={(e) => setSelectedDomain(e.target.value)}
            className="px-3.5 py-2 text-xs bg-slate-50 border border-gray-300 rounded-lg focus:outline-none font-medium text-gray-700 sm:w-64 cursor-pointer"
          >
            {domainOptions.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* Tab Pills matching Image 2 #3 - 100% Dynamic Counts & Real Filtering */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeTab === 'all'
              ? 'bg-[#F47716] text-white shadow-sm'
              : 'bg-slate-100 text-gray-600 hover:bg-slate-200'
              }`}
          >
            All Certifications ({certifications.length})
          </button>
          <button
            onClick={() => setActiveTab('enrolled')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${activeTab === 'enrolled'
              ? 'bg-[#10264B] text-white shadow-sm'
              : 'bg-slate-100 text-gray-600 hover:bg-slate-200'
              }`}
          >
            <span>Enrolled</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === 'enrolled' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-800'
                }`}
            >
              {enrolledCerts.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${activeTab === 'completed'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'bg-slate-100 text-gray-600 hover:bg-slate-200'
              }`}
          >
            <span>Completed</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === 'completed' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
                }`}
            >
              {completedCerts.length}
            </span>
          </button>

          {/* Level of Exam Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowLevelMenu(!showLevelMenu)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 border shadow-2xs ${
                selectedLevelFilter !== 'All'
                  ? 'bg-gradient-to-r from-[#F47716] to-[#FF8C38] text-white border-orange-600'
                  : 'bg-slate-100 text-[#10264B] border-slate-200 hover:bg-slate-200'
              }`}
            >
              <GraduationCap className={`w-3.5 h-3.5 ${selectedLevelFilter !== 'All' ? 'text-white' : 'text-[#F47716]'}`} />
              <span>
                {selectedLevelFilter === 'All'
                  ? 'Level of Exam'
                  : selectedLevelFilter === 'foundation'
                  ? 'Foundation Level'
                  : selectedLevelFilter === 'professional'
                  ? 'Professional Level'
                  : 'Expert Level'}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showLevelMenu ? 'rotate-180' : ''}`} />
            </button>

            {showLevelMenu && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setShowLevelMenu(false)}
                />
                <div className="absolute left-0 sm:left-auto sm:right-0 mt-1.5 w-64 bg-white rounded-xl shadow-xl border border-gray-200 p-2 z-30 animate-scaleUp">
                  <div className="px-2.5 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between border-b border-gray-100 pb-1.5">
                    <span>Filter by Exam Level</span>
                    {selectedLevelFilter !== 'All' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLevelFilter('All');
                          setShowLevelMenu(false);
                        }}
                        className="text-[10px] text-[#F47716] font-bold hover:underline cursor-pointer"
                      >
                        Reset
                      </button>
                    )}
                  </div>

                  {/* Guide CTA */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowLevelMenu(false);
                      const targetCert = certifications[0];
                      if (targetCert) {
                        setInitialLevelModalId(
                          selectedLevelFilter !== 'All' ? selectedLevelFilter : 'professional'
                        );
                        setSelectedForLevelModal(targetCert);
                      }
                    }}
                    className="w-full mt-1.5 mb-1.5 p-2 rounded-lg bg-orange-50 hover:bg-orange-100/80 border border-orange-200 text-left transition-colors flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-full bg-[#F47716] text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                        <GraduationCap className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#10264B] group-hover:text-[#F47716]">
                          Exam Levels Guide
                        </p>
                        <p className="text-[10px] text-gray-500">View CF, CP, CE & Fees</p>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-orange-500" />
                  </button>

                  <div className="space-y-1 pt-1 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedLevelFilter('All');
                        setShowLevelMenu(false);
                      }}
                      className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-medium text-left flex items-center justify-between transition-colors cursor-pointer ${
                        selectedLevelFilter === 'All'
                          ? 'bg-orange-50 text-[#10264B] font-bold'
                          : 'text-gray-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 rounded-full bg-gray-400" />
                        <span>All Exam Levels</span>
                      </div>
                      <span className="text-[10px] text-gray-400">All</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedLevelFilter('foundation');
                        setShowLevelMenu(false);
                      }}
                      className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-medium text-left flex items-center justify-between transition-colors cursor-pointer ${
                        selectedLevelFilter === 'foundation'
                          ? 'bg-blue-50 text-blue-900 font-bold'
                          : 'text-gray-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        <span>Foundation Level</span>
                      </div>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#DCEAFE] text-[#1E40AF]">
                        Beginner
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedLevelFilter('professional');
                        setShowLevelMenu(false);
                      }}
                      className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-medium text-left flex items-center justify-between transition-colors cursor-pointer ${
                        selectedLevelFilter === 'professional'
                          ? 'bg-orange-50 text-orange-950 font-bold'
                          : 'text-gray-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 rounded-full bg-[#F47716]" />
                        <span>Professional Level</span>
                      </div>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-[#F47716] text-white">
                        ★ Popular
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedLevelFilter('expert');
                        setShowLevelMenu(false);
                      }}
                      className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-medium text-left flex items-center justify-between transition-colors cursor-pointer ${
                        selectedLevelFilter === 'expert'
                          ? 'bg-purple-50 text-purple-900 font-bold'
                          : 'text-gray-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 rounded-full bg-purple-500" />
                        <span>Expert Level</span>
                      </div>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#E9D5FF] text-[#6B21A8]">
                        Advanced
                      </span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Certification Rows matching Image 2 #3 */}
      {loading ? (
        <div className="py-16 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#F47716] mx-auto" />
          <p className="text-xs text-gray-500 mt-2">Loading catalog...</p>
        </div>
      ) : displayCertifications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#F47716] flex items-center justify-center mx-auto">
            <Award className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-[#10264B]">
            {activeTab === 'enrolled'
              ? 'No enrolled certifications yet'
              : activeTab === 'completed'
                ? 'No completed certifications yet'
                : 'No matching certifications found'}
          </h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            {activeTab === 'enrolled'
              ? 'Browse the All Certifications catalog and click "Enroll Now" to register for international exams.'
              : activeTab === 'completed'
                ? 'Take your scheduled examinations to pass and unlock verifiable international digital credentials.'
                : 'Try clearing your search query or selecting "All Categories" from the domain filter.'}
          </p>
          {activeTab !== 'all' && (
            <button
              onClick={() => setActiveTab('all')}
              className="px-4 py-2 bg-[#F47716] hover:bg-[#DC660E] text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              Browse All Certifications
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3.5">
          {displayCertifications.map((cert) => {
            const completed = isCertCompleted(cert);
            const enrolled = isCertEnrolled(cert);
            const matchedCertificate = getCertificateForCert(cert);

            return (
              <div
                key={cert.id}
                className={`bg-white rounded-xl border p-5 shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${completed
                  ? 'border-emerald-200 bg-emerald-50/10'
                  : enrolled
                    ? 'border-blue-200 bg-blue-50/10'
                    : 'border-gray-200'
                  }`}
              >
                <div className="flex items-start space-x-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${completed
                      ? 'bg-emerald-100 text-emerald-700'
                      : enrolled
                        ? 'bg-blue-100 text-[#10264B]'
                        : 'bg-slate-100 text-[#10264B]'
                      }`}
                  >
                    <Award className="w-6 h-6 text-[#F47716]" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-bold text-[#10264B]">{cert.name}</h3>
                      <span className="text-[11px] font-mono text-gray-500 font-semibold">
                        ({cert.code})
                      </span>
                      {completed ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Certified ✓</span>
                        </span>
                      ) : enrolled ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                          <CalendarCheck className="w-3 h-3 text-blue-600" />
                          <span>Enrolled</span>
                        </span>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-gray-500">
                      <span className="font-medium text-gray-700">{cert.domain}</span>
                      <span>•</span>
                      <span>{cert.duration}</span>
                      <span>•</span>
                      <span className="text-green-600 font-medium">
                        Pass: {cert.passingCriteria}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Side: Level, Price & Action matching Image 2 #3 */}
                <div className="flex flex-wrap sm:flex-nowrap items-center justify-between sm:justify-end gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-gray-100">
                  <button
                    type="button"
                    onClick={() => {
                      setInitialLevelModalId(
                        selectedLevelFilter !== 'All' ? selectedLevelFilter : 'professional'
                      );
                      setSelectedForLevelModal(cert);
                    }}
                    title="Click to view or change exam level"
                    className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 text-[11px] font-semibold rounded-md border border-purple-200 flex items-center space-x-1 transition-colors cursor-pointer"
                  >
                    <GraduationCap className="w-3.5 h-3.5 text-purple-600" />
                    <span>
                      {selectedLevelFilter === 'foundation'
                        ? 'Foundation Level'
                        : selectedLevelFilter === 'professional'
                        ? 'Professional Level'
                        : selectedLevelFilter === 'expert'
                        ? 'Expert Level'
                        : cert.level || 'Professional Level'}
                    </span>
                  </button>

                  <div className="text-right">
                    <span className="text-base font-black text-[#10264B]">
                      ₹{
                        (selectedLevelFilter === 'foundation'
                          ? 4500
                          : selectedLevelFilter === 'expert'
                          ? 13999
                          : (cert.examFee || 9999)
                        ).toLocaleString('en-IN')
                      }
                    </span>
                  </div>

                  {/* Dynamic Action Button depending on Candidate Status */}
                  {completed ? (
                    <button
                      onClick={() => {
                        const loggedName = user?.fullName || candidate?.fullName || 'Candidate';
                        const loggedId = user?.candidateId || candidate?.candidateId || 'AICQB-CAND';
                        const targetCert = matchedCertificate || {
                          id: `cert_view_${cert.id}`,
                          certificateNo: `AICQB-${cert.code.replace(/[^A-Z]/g, '')}-2026-001248`,
                          candidateName: loggedName,
                          candidateId: loggedId,
                          certificationId: cert.id,
                          certificationName: cert.name,
                          certificationCode: cert.code,
                          credentialLevel: cert.level,
                          grade: 'Grade A+ (Distinction)',
                          score: 90,
                          status: 'Issued',
                          issueDateFormatted: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
                          validUntilFormatted: new Date(Date.now() + 86400000 * 365 * 3).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
                          verificationUrl: `${window.location.origin}/verify?id=${encodeURIComponent(`AICQB-${cert.code.replace(/[^A-Z]/g, '')}-2026-001248`)}`,
                        };
                        setSelectedCertificateModal({
                          ...targetCert,
                          candidateName: loggedName || targetCert.candidateName,
                          candidateId: loggedId || targetCert.candidateId,
                        } as any);
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm transition-all flex items-center space-x-1 cursor-pointer"
                    >
                      <FileCheck2 className="w-3.5 h-3.5" />
                      <span>View Certificate &gt;</span>
                    </button>
                  ) : enrolled ? (
                    <button
                      onClick={() => {
                        const targetLevel =
                          selectedLevelFilter === 'foundation'
                            ? 'Foundation Level'
                            : selectedLevelFilter === 'professional'
                            ? 'Professional Level'
                            : selectedLevelFilter === 'expert'
                            ? 'Expert Level'
                            : (cert.level || 'Professional Level');
                        navigate(`/portal/exams?level=${encodeURIComponent(targetLevel)}`, {
                          state: { level: targetLevel, certificationCode: cert.code }
                        });
                      }}
                      className="px-4 py-2 bg-[#10264B] hover:bg-[#1E3A6E] text-white font-bold text-xs rounded-lg shadow-sm transition-all flex items-center space-x-1 cursor-pointer"
                    >
                      <CalendarCheck className="w-3.5 h-3.5 text-[#F47716]" />
                      <span>Schedule Exam &gt;</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setInitialLevelModalId(
                          selectedLevelFilter !== 'All' ? selectedLevelFilter : 'professional'
                        );
                        setSelectedForLevelModal(cert);
                      }}
                      className="px-4 py-2 bg-[#F47716] hover:bg-[#DC660E] text-white font-bold text-xs rounded-lg shadow-sm transition-all cursor-pointer"
                    >
                      Enroll Now &gt;
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Select Exam Level Modal (Matching Screenshot) */}
      {selectedForLevelModal && (
        <SelectExamLevelModal
          certification={selectedForLevelModal}
          initialLevelId={initialLevelModalId}
          onClose={() => setSelectedForLevelModal(null)}
          onContinue={(selectedLevel) => {
            const targetCert = selectedForLevelModal;
            setSelectedForLevelModal(null);
            if (isCertEnrolled(targetCert)) {
              navigate(`/portal/exams?level=${encodeURIComponent(selectedLevel.levelName)}`, {
                state: { level: selectedLevel.levelName, certificationCode: targetCert.code },
              });
              return;
            }
            setSelectedForEnroll({
              ...targetCert,
              level: selectedLevel.levelName,
              code: selectedLevel.code,
              examFee: selectedLevel.amount,
              examFeeUSD: selectedLevel.amountUSD,
              duration: `${selectedLevel.durationMinutes} Minutes`,
              mcqs: selectedLevel.mcqs,
            });
          }}
        />
      )}

      {/* Razorpay Checkout Trigger */}
      {selectedForEnroll && (
        <RazorpayModal
          certificationId={selectedForEnroll.id}
          certificationName={selectedForEnroll.name}
          certificationCode={selectedForEnroll.code}
          certificationLevel={selectedForEnroll.level}
          amount={selectedForEnroll.examFee}
          amountUSD={selectedForEnroll.examFeeUSD}
          currency={selectedForEnroll.currency}
          onSuccess={() => {
            const enrolledItem = selectedForEnroll;
            setSelectedForEnroll(null);
            if (enrolledItem) {
              setEnrolledSuccessBanner({
                name: enrolledItem.name,
                code: enrolledItem.code,
              });

              // Instantly update local enrolled states
              setEnrolledCertIds((prev) => {
                const next = Array.from(new Set([...prev, enrolledItem.id, enrolledItem.code]));
                try {
                  localStorage.setItem('aicqb_enrolled_cert_ids', JSON.stringify(next));
                } catch (_) {}
                return next;
              });

              // Pre-populate upcoming exams in localStorage immediately so My Exams displays it on Frame 0
              try {
                const existingUpcoming = JSON.parse(localStorage.getItem('aicqb_my_upcoming') || '[]');
                const alreadyThere = existingUpcoming.some(
                  (u: any) => u.certificationId === enrolledItem.id || u.certificationCode === enrolledItem.code
                );
                if (!alreadyThere) {
                  const examDate = new Date();
                  examDate.setDate(examDate.getDate() + 7);
                  const day = String(examDate.getDate()).padStart(2, '0');
                  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                  const monthYear = `${monthNames[examDate.getMonth()]} ${examDate.getFullYear()}`;
                  const newSchedule = {
                    id: `sch_${Date.now()}`,
                    scheduleId: `sch_${Date.now()}`,
                    certificationId: enrolledItem.id,
                    certificationName: enrolledItem.name,
                    certificationCode: enrolledItem.code,
                    examId: `exam_${enrolledItem.id}`,
                    examName: enrolledItem.name,
                    examCode: `${enrolledItem.code}-EXAM`,
                    scheduledDate: examDate.toISOString().split('T')[0],
                    scheduledDateDay: day,
                    scheduledDateMonth: monthYear,
                    scheduledDateFormatted: `${day} ${monthYear}`,
                    scheduledTime: '10:00 AM – 11:30 AM (IST)',
                    mode: 'Online Proctored',
                    durationMinutes: enrolledItem.duration ? parseInt(enrolledItem.duration) : 90,
                    status: 'scheduled',
                    instructions: [
                      'Ensure a stable high-speed internet connection.',
                      'Keep your camera and microphone enabled for AI proctoring.',
                      'No external tabs or notes permitted during the examination.',
                      'Exam will auto-submit when the countdown timer reaches 00:00.',
                    ],
                  };
                  localStorage.setItem('aicqb_my_upcoming', JSON.stringify([newSchedule, ...existingUpcoming]));
                }
              } catch (_) {}

              // Refresh schedules from server in background
              api.getMySchedules().then((res) => {
                if (res?.success && res.upcoming) {
                  try {
                    localStorage.setItem('aicqb_my_upcoming', JSON.stringify(res.upcoming));
                  } catch (_) {}
                }
              }).catch(() => {});
            }
            loadData();
          }}
          onClose={() => setSelectedForEnroll(null)}
        />
      )}

      {/* Full Certificate Modal */}
      {selectedCertificateModal && (
        <CertificateModal
          certificate={selectedCertificateModal}
          onClose={() => setSelectedCertificateModal(null)}
        />
      )}
    </div>
  );
};
