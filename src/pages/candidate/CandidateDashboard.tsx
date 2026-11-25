import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { CertificateModal } from '../../components/CertificateModal';
import { Certificate, ExamSchedule } from '../../types';
import {
  Award,
  CalendarCheck,
  FileCheck2,
  BookOpen,
  Coins,
  ChevronRight,
  ArrowRight,
  Download,
  Share2,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Clock,
  Sparkles,
} from 'lucide-react';

export const CandidateDashboard: React.FC = () => {
  const { user, candidate } = useAuth();
  const navigate = useNavigate();

  const [activeCertificates, setActiveCertificates] = useState<Certificate[]>(() => {
    try {
      const c = localStorage.getItem('aicqb_my_certs');
      return c ? JSON.parse(c) : [];
    } catch (_) {
      return [];
    }
  });
  const [upcomingExams, setUpcomingExams] = useState<ExamSchedule[]>(() => {
    try {
      const s = localStorage.getItem('aicqb_my_schedules');
      return s ? JSON.parse(s) : [];
    } catch (_) {
      return [];
    }
  });
  const [completedExams, setCompletedExams] = useState<any[]>([]);
  const [enrolledCount, setEnrolledCount] = useState<number>(0);
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [certRes, examRes, statusRes] = await Promise.all([
        api.getMyCertificates().catch(() => ({ success: true, certificates: [] })),
        api.getMySchedules().catch(() => ({ success: true, upcoming: [], completed: [] })),
        api.getCandidateCertificationStatus().catch(() => ({ success: true, enrolledCertIds: [], completedCertIds: [] })),
      ]);

      if (certRes.success && certRes.certificates) {
        setActiveCertificates(certRes.certificates);
        try { localStorage.setItem('aicqb_my_certs', JSON.stringify(certRes.certificates)); } catch (_) { }
      }
      if (examRes.success) {
        if (examRes.upcoming) {
          setUpcomingExams(examRes.upcoming);
          try { localStorage.setItem('aicqb_my_schedules', JSON.stringify(examRes.upcoming)); } catch (_) { }
        }
        if (examRes.completed) {
          setCompletedExams(examRes.completed);
        }
      }
      if (statusRes.success && statusRes.enrolledCertIds) {
        setEnrolledCount(statusRes.enrolledCertIds.length);
      }
    } catch (err) {
      console.error('Failed to load candidate dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const displayName = user?.fullName || candidate?.fullName || 'pushpak Wani';
  const candidateId = user?.candidateId || candidate?.candidateId || 'AICQB-1004581';
  const rewardPoints = candidate?.rewardPoints || 100;

  // Real dynamic counts from candidate's profile, schedules, enrollments, and certificates
  const upcomingCount = upcomingExams.length;
  const earnedCertsCount = Math.max(activeCertificates.length, completedExams.length, candidate?.certificatesEarnedCount || 0);
  const activeCertsCount = Math.max(upcomingCount, enrolledCount, candidate?.activeCertificationsCount || 0);
  const coursesInProgressCount = activeCertsCount > 0 ? activeCertsCount : (upcomingCount > 0 ? upcomingCount : 0);

  return (
    <div className="space-y-6">
      {/* Welcome Banner matching Screen 1 in Screenshot */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-[#10264B] flex items-center space-x-1.5">
          <span>Welcome Back!</span>
          <span className="text-xl sm:text-2xl">👋</span>
        </h1>
        <p className="text-xs text-gray-500 mt-0.5 leading-snug">
          Manage your certifications, exams, learning and certificates in one place.
        </p>
      </div>

      {/* 5 Top Stat Cards matching Image 2 #1 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Stat 1 */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-2xl font-black text-[#10264B]">{activeCertsCount}</p>
            <p className="text-[11px] font-medium text-gray-500 leading-tight mt-0.5">Active Certification</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-orange-50 text-[#F47716] flex items-center justify-center flex-shrink-0">
            <Award className="w-5 h-5" />
          </div>
        </div>

        {/* Stat 2 */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-2xl font-black text-[#10264B]">{upcomingCount}</p>
            <p className="text-[11px] font-medium text-gray-500 leading-tight mt-0.5">Upcoming Exams</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#10264B] flex items-center justify-center flex-shrink-0">
            <CalendarCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Stat 3 */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-2xl font-black text-[#10264B]">{earnedCertsCount}</p>
            <p className="text-[11px] font-medium text-gray-500 leading-tight mt-0.5">Certificates Earned</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center flex-shrink-0">
            <FileCheck2 className="w-5 h-5" />
          </div>
        </div>

        {/* Stat 4 */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-2xl font-black text-[#10264B]">{coursesInProgressCount}</p>
            <p className="text-[11px] font-medium text-gray-500 leading-tight mt-0.5">Courses in Progress</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        {/* Stat 5 */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center justify-between col-span-2 sm:col-span-1">
          <div>
            <p className="text-2xl font-black text-[#10264B]">{rewardPoints}</p>
            <p className="text-[11px] font-medium text-gray-500 leading-tight mt-0.5">Reward Points</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
            <Coins className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Middle Row: Progress and Upcoming Exam (Dynamic for New & Existing Candidates) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Progress Card */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-[#10264B] flex items-center space-x-2">
              <Award className="w-4 h-4 text-[#F47716]" />
              <span>My Certification Progress</span>
            </h3>
            {upcomingExams.length > 0 && (
              <span className="text-[11px] text-[#F47716] font-bold">
                {upcomingExams[0]?.certificationCode}
              </span>
            )}
          </div>

          {upcomingExams.length > 0 ? (
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Circular Progress Badge */}
              <div className="relative w-28 h-28 flex items-center justify-center flex-shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-gray-100"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-[#F47716]"
                    strokeDasharray="50, 100"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="text-xl font-black text-[#10264B] block leading-none">50%</span>
                  <span className="text-[9px] text-gray-400 font-semibold uppercase">Exam Ready</span>
                </div>
              </div>

              {/* Details & Stage Steps */}
              <div className="space-y-4 flex-1">
                <div>
                  <h4 className="text-sm font-bold text-[#10264B]">{upcomingExams[0]?.examName}</h4>
                  <p className="text-xs text-gray-500 font-mono">({upcomingExams[0]?.certificationCode})</p>
                </div>

                {/* Progress Milestones */}
                <div className="grid grid-cols-4 gap-1 text-center text-[10px] font-semibold text-gray-600">
                  <div className="space-y-1">
                    <div className="w-full h-1.5 bg-[#F47716] rounded-full"></div>
                    <span className="text-[#F47716]">Enrolled</span>
                  </div>
                  <div className="space-y-1">
                    <div className="w-full h-1.5 bg-[#F47716] rounded-full"></div>
                    <span className="text-[#F47716]">Learning</span>
                  </div>
                  <div className="space-y-1">
                    <div className="w-full h-1.5 bg-orange-300 rounded-full"></div>
                    <span className="text-gray-700">Exam Ready</span>
                  </div>
                  <div className="space-y-1">
                    <div className="w-full h-1.5 bg-gray-200 rounded-full"></div>
                    <span className="text-gray-400">Certification</span>
                  </div>
                </div>

                <div className="pt-1">
                  <Link
                    to="/portal/learning"
                    className="inline-flex items-center space-x-1.5 px-4 py-2 bg-[#F47716] hover:bg-[#DC660E] text-white text-xs font-bold rounded-lg shadow-sm transition-all"
                  >
                    <span>View Learning Modules</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ) : activeCertificates.length > 0 ? (
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Circular Progress Badge Completed 100% */}
              <div className="relative w-28 h-28 flex items-center justify-center flex-shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-gray-100"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-emerald-500"
                    strokeDasharray="100, 100"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="text-xl font-black text-emerald-600 block leading-none">100%</span>
                  <span className="text-[9px] text-emerald-700 font-semibold uppercase">Certified</span>
                </div>
              </div>

              {/* Details & Stage Steps */}
              <div className="space-y-4 flex-1">
                <div>
                  <h4 className="text-sm font-bold text-[#10264B]">{activeCertificates[0]?.certificationName}</h4>
                  <p className="text-xs text-gray-500 font-mono">({activeCertificates[0]?.certificationCode || activeCertificates[0]?.certificateNo})</p>
                </div>

                {/* Progress Milestones */}
                <div className="grid grid-cols-4 gap-1 text-center text-[10px] font-semibold text-gray-600">
                  <div className="space-y-1">
                    <div className="w-full h-1.5 bg-emerald-500 rounded-full"></div>
                    <span className="text-emerald-600">Enrolled</span>
                  </div>
                  <div className="space-y-1">
                    <div className="w-full h-1.5 bg-emerald-500 rounded-full"></div>
                    <span className="text-emerald-600">Learned</span>
                  </div>
                  <div className="space-y-1">
                    <div className="w-full h-1.5 bg-emerald-500 rounded-full"></div>
                    <span className="text-emerald-600">Passed</span>
                  </div>
                  <div className="space-y-1">
                    <div className="w-full h-1.5 bg-emerald-500 rounded-full"></div>
                    <span className="text-emerald-600 font-bold">Certified ✓</span>
                  </div>
                </div>

                <div className="pt-1 flex items-center space-x-2">
                  <button
                    onClick={() => setSelectedCert(activeCertificates[0])}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer"
                  >
                    <span>View Official Certificate</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center space-y-3">
              <Award className="w-10 h-10 text-gray-300 mx-auto" />
              <p className="text-xs font-bold text-[#10264B]">No Active Certification In Progress</p>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                Explore the AICQB certification catalog and enroll in high-demand international programs to start your certification journey.
              </p>
              <Link
                to="/portal/certifications"
                className="inline-flex items-center space-x-1 px-4 py-2 bg-[#F47716] hover:bg-[#DC660E] text-white text-xs font-bold rounded-lg shadow-sm"
              >
                <span>Browse Certifications</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>

        {/* Right Upcoming Exam Card */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-sm text-[#10264B] flex items-center space-x-2">
                <CalendarCheck className="w-4 h-4 text-[#F47716]" />
                <span>Upcoming Exam</span>
              </h3>
              <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${upcomingExams.length > 0 ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                {upcomingExams.length > 0 ? 'Scheduled' : 'None'}
              </span>
            </div>

            {upcomingExams.length > 0 ? (
              <div className="flex items-start space-x-4">
                {/* Date Box */}
                <div className="w-16 h-16 rounded-xl bg-orange-50 border border-orange-200 text-center flex flex-col items-center justify-center flex-shrink-0">
                  <span className="text-xl font-black text-[#F47716] leading-none">
                    {upcomingExams[0]?.scheduledDateDay || (upcomingExams[0]?.scheduledDate ? new Date(upcomingExams[0].scheduledDate).getDate() : '16')}
                  </span>
                  <span className="text-[10px] font-bold text-gray-600 uppercase mt-0.5">
                    {upcomingExams[0]?.scheduledDateMonth || (upcomingExams[0]?.scheduledDate ? new Date(upcomingExams[0].scheduledDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Nov 2026')}
                  </span>
                </div>

                <div className="space-y-1">
                  <h4 className="text-xs sm:text-sm font-bold text-[#10264B] leading-snug">
                    {upcomingExams[0]?.examName}
                  </h4>
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    <span>{upcomingExams[0]?.scheduledTime || '10:00 AM – 11:30 AM (IST)'}</span>
                  </div>
                  <span className="inline-block text-[11px] text-[#F47716] font-mono font-semibold">
                    {upcomingExams[0]?.certificationCode}
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center space-y-2">
                <CalendarCheck className="w-8 h-8 text-gray-300 mx-auto" />
                <p className="text-xs font-bold text-[#10264B]">No Upcoming Exams Scheduled</p>
                <p className="text-xs text-gray-400">Enroll in a certification to book your proctored session.</p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-gray-100">
            <Link
              to="/portal/exams"
              className="w-full py-2.5 bg-slate-50 hover:bg-[#10264B] hover:text-white text-[#10264B] text-xs font-bold rounded-lg border border-gray-200 transition-colors flex items-center justify-center space-x-1"
            >
              <span>{upcomingExams.length > 0 ? 'View Details & Guidelines' : 'Go to My Exams'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Row: My Certificates & Explore More banner matching Image 2 #1 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left My Certificates Preview */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-[#10264B] flex items-center space-x-2">
              <Award className="w-4 h-4 text-[#F47716]" />
              <span>My Certificates</span>
            </h3>
            <Link to="/portal/certificates" className="text-xs font-bold text-[#F47716] hover:underline flex items-center">
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {(activeCertificates.length > 0 || completedExams.length > 0) ? (
            <div className="space-y-3">
              {(activeCertificates.length > 0
                ? activeCertificates
                : completedExams.map((ce, idx) => ({
                    id: ce.id || `comp_cert_${idx}`,
                    certificateNo:
                      ce.certificateNo ||
                      `AICQB-${(ce.certificationCode || 'AI').replace(/[^A-Z]/g, '')}-2026-000125`,
                    certificationName: ce.examName || ce.certificationName,
                    certificationCode: ce.certificationCode,
                    candidateName: displayName,
                    candidateId: candidateId,
                    credentialLevel: 'Professional Level',
                    grade: 'Grade A+ (Distinction)',
                    score: ce.score || ce.percentage || 94,
                    issueDateFormatted: ce.scheduledDateFormatted || '10 Oct 2026',
                    validUntilFormatted: '10 Oct 2029',
                    status: 'Issued',
                    verificationUrl: `${window.location.origin}/verify?id=${encodeURIComponent(
                      ce.certificateNo ||
                        `AICQB-${(ce.certificationCode || 'AI').replace(/[^A-Z]/g, '')}-2026-000125`
                    )}`,
                  }))
              ).slice(0, 3).map((cert: any) => (
                <div
                  key={cert.id}
                  className="p-4 rounded-xl border border-gray-200 bg-slate-50 flex items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-[#10264B]">{cert.certificationName}</h4>
                    <p className="text-[11px] text-gray-500 font-mono">Certificate ID: {cert.certificateNo}</p>
                    <p className="text-[10px] text-gray-500">
                      Issued On: {cert.issueDateFormatted || cert.issueDate || '10 Oct 2026'} • Valid Till: {cert.validUntilFormatted || cert.validUntil || '10 Oct 2029'}
                    </p>
                    <span className="inline-flex items-center text-[10px] text-green-600 font-semibold">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Verified Active
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() =>
                        setSelectedCert({
                          ...cert,
                          candidateName: cert.candidateName || displayName,
                          candidateId: cert.candidateId || candidateId,
                          grade: cert.grade || 'Grade A+ (Distinction)',
                        })
                      }
                      className="px-3.5 py-1.5 bg-[#10264B] text-white rounded text-xs font-semibold hover:bg-[#1E3A6E] cursor-pointer"
                    >
                      View Certificate
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 rounded-xl border border-dashed border-gray-300 bg-slate-50/60 text-center space-y-2">
              <Award className="w-8 h-8 text-gray-400 mx-auto" />
              <p className="text-xs font-bold text-[#10264B]">No Certificates Earned Yet</p>
              <p className="text-[11px] text-gray-500 max-w-sm mx-auto leading-relaxed">
                Official verified certificates with cryptographic QR authentication are issued immediately after completing and passing your proctored certification exam.
              </p>
              <div className="pt-2">
                <Link
                  to="/portal/exams"
                  className="inline-flex items-center space-x-1.5 px-4 py-2 bg-[#F47716] hover:bg-[#DC660E] text-white text-xs font-bold rounded-lg shadow-sm transition-all"
                >
                  <span>Go to My Exams</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Right Promo Banner matching Image 2 #1 */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#10264B] to-[#1E3A6E] text-white rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <span className="px-2 py-0.5 bg-[#F47716] text-white font-bold text-[10px] uppercase rounded">
              Expand Your Credentials
            </span>
            <h3 className="text-base sm:text-lg font-black leading-snug">
              Explore More Certifications
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Advance your career with AICQB's global professional certifications in Data Science, Cloud, DevOps, and Cybersecurity.
            </p>
          </div>

          <Link
            to="/portal/certifications"
            className="w-full py-2.5 bg-[#F47716] hover:bg-[#DC660E] text-white font-bold text-xs rounded-lg shadow transition-colors flex items-center justify-center space-x-1.5"
          >
            <span>Browse Certifications &gt;</span>
          </Link>
        </div>
      </div>

      {/* Certificate Modal View */}
      {selectedCert && (
        <CertificateModal certificate={selectedCert} onClose={() => setSelectedCert(null)} />
      )}
    </div>
  );
};

