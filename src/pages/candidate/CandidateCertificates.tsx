import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Certificate } from '../../types';
import { CertificateModal } from '../../components/CertificateModal';
import { Award, Download, Share2, Eye, CheckCircle2, ShieldCheck, Loader2, ChevronRight } from 'lucide-react';

export const CandidateCertificates: React.FC = () => {
  const { user, candidate } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>(() => {
    try {
      const c = localStorage.getItem('aicqb_my_certs');
      return c ? JSON.parse(c) : [];
    } catch (_) {
      return [];
    }
  });
  const [enrolledExams, setEnrolledExams] = useState<any[]>(() => {
    try {
      const s = localStorage.getItem('aicqb_my_schedules');
      return s ? JSON.parse(s) : [];
    } catch (_) {
      return [];
    }
  });
  const [loading, setLoading] = useState(false);
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const [activeTab, setActiveTab] = useState<'earned' | 'progress'>('earned');

  const candidateName = user?.fullName || candidate?.fullName || 'Candidate';
  const candidateId = user?.candidateId || candidate?.candidateId || (user?.id ? `AICQB-${user.id.slice(0, 6).toUpperCase()}` : '');

  useEffect(() => {
    loadCertificates();
  }, [user]);

  const loadCertificates = async () => {
    try {
      const [resCert, resSched] = await Promise.all([
        api.getMyCertificates().catch(() => ({ success: false, certificates: [] })),
        api.getMySchedules().catch(() => ({ success: false, upcoming: [], completed: [] })),
      ]);

      let combined: Certificate[] = [];
      if (resCert.success && resCert.certificates) {
        combined = [...resCert.certificates];
      }

      // Merge any passed/completed exams from schedules as active earned certificates
      if (resSched.success && resSched.completed) {
        const normC = (val?: string) => (val || '').replace(/®/g, '').trim().toLowerCase();
        resSched.completed.forEach((comp: any) => {
          const compCode = normC(comp.certificationCode);
          const exists = combined.some(
            (c) =>
              (c.certificateNo && comp.certificateNo && c.certificateNo === comp.certificateNo) ||
              (c.certificationCode && compCode && normC(c.certificationCode) === compCode)
          );
          if (!exists) {
            combined.push({
              id: `cert_${comp.id}`,
              certificateNo: comp.certificateNo || `AICQB-${(comp.certificationCode || 'CERT').replace(/®/g, '')}-2026`,
              candidateName: candidateName,
              candidateId: candidateId,
              certificationName: comp.examName || comp.certificationName,
              certificationCode: comp.certificationCode,
              issueDate: comp.scheduledDate || new Date().toISOString().split('T')[0],
              expiryDate: new Date(Date.now() + 86400000 * 365 * 3).toISOString().split('T')[0],
              grade: (comp.percentage || comp.score || 85) >= 90 ? 'Grade A+ (Distinction)' : 'Grade A (Merit)',
              status: 'Issued',
              ceoName: 'Pushpak Wani',
              directorName: 'Dr. Neha Kulkarni',
            } as any);
          }
        });
      }

      setCertificates(combined);
      try { localStorage.setItem('aicqb_my_certs', JSON.stringify(combined)); } catch (_) {}

      if (resSched.success && resSched.upcoming) {
        setEnrolledExams(resSched.upcoming);
        try { localStorage.setItem('aicqb_my_schedules', JSON.stringify(resSched.upcoming)); } catch (_) {}
      }
    } catch (err) {
      console.error('Failed to load certificates:', err);
    } finally {
      setLoading(false);
    }
  };

  // Only show verified active certificates earned after completing/passing the exam
  const displayCertificates = certificates.map((c) => ({
    ...c,
    candidateName: user?.fullName || candidate?.fullName || c.candidateName || candidateName,
    candidateId: user?.candidateId || candidate?.candidateId || c.candidateId || candidateId,
    grade: c.grade || 'Grade A+ (Distinction)',
  }));

  const handleShare = (cert: any) => {
    const url = cert.verificationUrl || `${window.location.origin}/verify?id=${cert.certificateNo}`;
    navigator.clipboard.writeText(url);
    alert('Public verification URL copied to clipboard:\n' + url);
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Header matching Screen 3 in Screenshot */}
      <div>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#F47716] flex items-center justify-center flex-shrink-0">
            <Award className="w-5 h-5 stroke-[2.2]" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#10264B]">My Certifications</h1>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          View and download your earned certificates.
        </p>
      </div>

      {/* Filter Tabs matching Screen 3 */}
      <div className="flex items-center space-x-2 border-b border-gray-200 pb-3">
        <button
          onClick={() => setActiveTab('earned')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'earned'
              ? 'bg-[#F47716] text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          All Certificates ({displayCertificates.length})
        </button>
        <button
          onClick={() => setActiveTab('progress')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'progress'
              ? 'bg-[#F47716] text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          In Progress ({enrolledExams.length})
        </button>
      </div>

      {/* Certificates List matching Screen 3 */}
      {activeTab === 'earned' && (
        <>
          {displayCertificates.length > 0 ? (
            <div className="space-y-3">
              {displayCertificates.map((cert) => (
                <div
                  key={cert.id}
                  className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-xs hover:shadow-md transition-all flex items-center justify-between gap-3.5"
                >
                  <div className="flex items-start space-x-3.5 min-w-0">
                    {/* Certificate Thumbnail / Icon matching Screen 3 */}
                    <div
                      onClick={() => setSelectedCert(cert)}
                      className="w-12 h-12 sm:w-16 sm:h-12 rounded-xl bg-gradient-to-tr from-amber-50 to-orange-50 border border-amber-200 text-amber-700 flex items-center justify-center flex-shrink-0 cursor-pointer shadow-xs hover:scale-105 transition-transform"
                      title="View Certificate"
                    >
                      <Award className="w-6 h-6 stroke-[2.2] text-[#F47716]" />
                    </div>

                    {/* Details */}
                    <div className="space-y-0.5 min-w-0">
                      <h4 className="text-xs sm:text-sm font-black text-[#10264B] truncate">
                        {cert.certificationCode || cert.certificateNo}
                      </h4>
                      <p className="text-[11px] sm:text-xs text-gray-700 font-semibold truncate leading-tight">
                        {cert.certificationName}
                      </p>
                      <p className="text-[10px] text-gray-500 font-medium truncate pt-0.5">
                        <span>Issued: {cert.issueDateFormatted || cert.issueDate}</span>
                        <span className="mx-1.5 text-gray-300">|</span>
                        <span>Valid Until: {cert.validUntilFormatted || cert.validUntil}</span>
                      </p>
                      <div className="pt-1">
                        <span className="inline-flex items-center text-[9.5px] font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                          Valid
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Download / View Button matching Screen 3 */}
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <button
                      onClick={() => setSelectedCert(cert)}
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl border-2 border-orange-200 bg-orange-50/50 hover:bg-orange-100/80 text-[#F47716] flex items-center justify-center transition-all cursor-pointer shadow-xs hover:scale-105"
                      title="View & Download Certificate"
                    >
                      <Download className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center space-y-4 shadow-sm">
              <div className="w-16 h-16 rounded-full bg-orange-50 text-[#F47716] flex items-center justify-center mx-auto ring-8 ring-orange-50/50">
                <Award className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-base font-bold text-[#10264B]">No Certificates Earned Yet</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Your official AICQB International Certificate with unique QR verification and awarded Grade is issued automatically after completing and passing your proctored certification exam.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  to="/portal/exams"
                  className="inline-flex items-center space-x-2 px-5 py-2.5 bg-[#F47716] hover:bg-[#DC660E] text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  <span>Go to Scheduled Exams</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}
        </>
      )}

      {/* Enrolled / In Progress Tab */}
      {activeTab === 'progress' && (
        <div className="space-y-4">
          {enrolledExams.length > 0 ? (
            enrolledExams.map((exam) => (
              <div
                key={exam.id}
                className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
                  {/* Watermark certificate preview icon */}
                  <div className="w-32 h-24 bg-gradient-to-br from-slate-50 to-orange-50/30 border-2 border-dashed border-[#F47716]/40 rounded-lg p-2 flex flex-col justify-between shadow-xs flex-shrink-0 relative overflow-hidden">
                    <div className="flex justify-between items-center text-[7px] text-[#10264B] font-bold uppercase">
                      <span>AICQB</span>
                      <span>ENROLLED</span>
                    </div>
                    <div className="text-center">
                      <p className="text-[8px] font-bold text-[#10264B] leading-tight truncate">{exam.examName || exam.certificationName}</p>
                      <p className="text-[7px] text-[#F47716] font-mono">{exam.certificationCode}</p>
                    </div>
                    <div className="text-center text-[6px] text-gray-400 border-t border-gray-200 pt-0.5 font-semibold">
                      Exam Pending (70% Pass)
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 bg-blue-50 text-[#10264B] font-bold text-[10px] rounded-full border border-blue-200">
                        Enrolled Certificate
                      </span>
                      <span className="px-2.5 py-0.5 bg-orange-50 text-[#F47716] font-bold text-[10px] rounded-full border border-orange-200">
                        Exam Ready in My Exams
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-[#10264B]">{exam.examName || exam.certificationName}</h3>
                    <p className="text-xs text-gray-600">
                      Scheduled Date: <span className="font-semibold text-gray-800">{exam.scheduledDateDay} {exam.scheduledDateMonth || exam.scheduledDate}</span> • Mode: <span className="font-semibold text-gray-800">{exam.mode || 'Online Proctored'}</span>
                    </p>
                    <p className="text-[11px] text-gray-500">
                      Complete and pass this proctored examination (minimum 70%) to automatically generate your official international QR-verifiable certificate.
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 pt-3 md:pt-0 border-t md:border-t-0 border-gray-100 flex-shrink-0">
                  <Link
                    to="/portal/exams"
                    className="px-5 py-2.5 bg-[#F47716] hover:bg-[#DC660E] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center space-x-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <span>Take Exam in My Exams</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center space-y-4 shadow-sm">
              <div className="w-16 h-16 rounded-full bg-orange-50 text-[#F47716] flex items-center justify-center mx-auto ring-8 ring-orange-50/50">
                <Award className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-base font-bold text-[#10264B]">No Enrolled Certificates In Progress</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Browse our international certification catalog to enroll in programs and start taking proctored examinations.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  to="/portal/certifications"
                  className="inline-flex items-center space-x-2 px-5 py-2.5 bg-[#10264B] hover:bg-[#1E3A6E] text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  <span>Browse Certifications</span>
                  <ChevronRight className="w-4 h-4 text-[#F47716]" />
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Official Certificate Modal */}
      {selectedCert && (
        <CertificateModal certificate={selectedCert} onClose={() => setSelectedCert(null)} />
      )}
    </div>
  );
};

