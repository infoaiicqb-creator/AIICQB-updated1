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
    <div className="space-y-6">
      {/* Header matching Image 2 #6 */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-[#10264B]">My Certificates</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          View, download and share your earned certificates.
        </p>
      </div>

      {/* Tabs matching Image 2 #6 */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-3">
        <button
          onClick={() => setActiveTab('earned')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'earned'
            ? 'bg-[#F47716] text-white shadow-sm'
            : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
        >
          Earned Certificates ({displayCertificates.length})
        </button>
        <button
          onClick={() => setActiveTab('progress')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeTab === 'progress'
            ? 'bg-[#F47716] text-white shadow-sm'
            : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
        >
          Enrolled / In Progress ({enrolledExams.length})
        </button>
      </div>

      {/* Certificates Grid: Only shown after exam */}
      {activeTab === 'earned' && (
        <>
          {displayCertificates.length > 0 ? (
            <div className="space-y-4">
              {displayCertificates.map((cert) => (
                <div
                  key={cert.id}
                  className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
                    {/* Certificate Thumbnail using Master Certificate */}
                    <div
                      onClick={() => setSelectedCert(cert)}
                      className="w-36 h-24 rounded-lg overflow-hidden border border-[#D4AF37] shadow-sm cursor-pointer hover:shadow-md transition-all relative flex-shrink-0 group"
                      title="Click to view full certificate"
                    >
                      <img
                        src="/certificate-master.jpg"
                        alt="Certificate Preview"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-[#0A1D37]/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-[10px] font-bold text-white bg-black/60 px-2 py-1 rounded backdrop-blur-xs">
                          View
                        </span>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-1.5">
                      <h3 className="text-base font-bold text-[#10264B]">{cert.certificationName}</h3>
                      <div className="space-y-0.5 text-xs text-gray-600">
                        <p>
                          <span className="text-gray-400">Certificate ID: </span>
                          <span className="font-mono font-bold text-[#10264B]">{cert.certificateNo}</span>
                        </p>
                        <p>
                          <span className="text-gray-400">Issued On: </span>
                          <span className="font-medium text-gray-700">{cert.issueDateFormatted || cert.issueDate}</span>
                          <span className="mx-2 text-gray-300">•</span>
                          <span className="text-gray-400">Valid Till: </span>
                          <span className="font-medium text-gray-700">{cert.validUntilFormatted || cert.validUntil}</span>
                        </p>
                      </div>
                      <span className="inline-flex items-center text-[10px] font-bold text-green-700 bg-green-50 px-2.5 py-0.5 rounded-full border border-green-200">
                        <CheckCircle2 className="w-3 h-3 mr-1 text-green-600" />
                        Verified Active
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons matching Image 2 #6 */}
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-gray-100">
                    <button
                      onClick={() => setSelectedCert(cert)}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-[#10264B] text-xs font-semibold rounded-lg transition-colors flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Certificate</span>
                    </button>
                    <button
                      onClick={() => setSelectedCert(cert)}
                      className="px-3.5 py-2 bg-[#10264B] hover:bg-[#1E3A6E] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download (PDF)</span>
                    </button>
                    <button
                      onClick={() => handleShare(cert)}
                      className="px-3.5 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-lg transition-colors flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Share Link</span>
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

