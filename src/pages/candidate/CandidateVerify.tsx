import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { CertificateModal } from '../../components/CertificateModal';
import { ShieldCheck, Search, CheckCircle2, AlertCircle, Award, Loader2, ArrowRight, ExternalLink } from 'lucide-react';

export const CandidateVerify: React.FC = () => {
  const { user, candidate } = useAuth();
  const [certId, setCertId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [myCertList, setMyCertList] = useState<any[]>([]);
  const [publicSamples, setPublicSamples] = useState<any[]>([]);
  const [initialChecked, setInitialChecked] = useState(false);

  const candidateName = user?.fullName || candidate?.fullName || 'Candidate';
  const candidateId = user?.candidateId || candidate?.candidateId || '';

  useEffect(() => {
    let isMounted = true;

    const fetchInitialData = async () => {
      try {
        const [certRes, pubRes] = await Promise.all([
          api.getMyCertificates().catch(() => ({ success: false, certificates: [] })),
          api.getPublicRegistry().catch(() => ({ success: false, certificates: [] })),
        ]);

        if (!isMounted) return;

        if (pubRes && pubRes.success && pubRes.certificates) {
          setPublicSamples(pubRes.certificates);
        }

        if (certRes && certRes.success && certRes.certificates && certRes.certificates.length > 0) {
          setMyCertList(certRes.certificates);
          const firstCertNo = certRes.certificates[0].certificateNo || certRes.certificates[0].certificateNumber;
          if (firstCertNo) {
            setCertId(firstCertNo);
            performVerify(firstCertNo);
          }
        } else if (candidateId) {
          // If candidate has candidateId, set it as default search query
          setCertId(candidateId);
          // Try verifying candidateId in case they already have records
          performVerify(candidateId);
        }
      } catch (err) {
        console.error('Error loading verification data:', err);
      } finally {
        if (isMounted) setInitialChecked(true);
      }
    };

    fetchInitialData();

    return () => {
      isMounted = false;
    };
  }, [user, candidate]);

  const performVerify = async (idToVerify: string) => {
    if (!idToVerify || !idToVerify.trim()) return;

    try {
      setLoading(true);
      setResult(null);
      const res = await api.verifyCertificate(idToVerify.trim());
      setResult(res);
    } catch (err: any) {
      setResult({
        isValid: false,
        message: err.message || 'No record matching this Certificate ID or Candidate ID was found in the official registry.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    performVerify(certId);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-[#10264B]">Certificate Verification</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Verify the authenticity and active standing of any AICQB certificate or candidate credential.
        </p>
      </div>

      {/* Candidate Notice if no certificates earned yet */}
      {initialChecked && myCertList.length === 0 && (
        <div className="bg-gradient-to-r from-orange-50 via-amber-50 to-white rounded-2xl border border-orange-200/80 p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-orange-100/80 text-[#F47716] flex items-center justify-center flex-shrink-0 mt-0.5">
              <Award className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-[#10264B]">
                {candidateName} {candidateId ? `(${candidateId})` : ''}
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                You do not have any issued certificates yet. Pass your proctored certification exam with 70%+ score to earn an official digitally signed credential.
              </p>
            </div>
          </div>
          <Link
            to="/portal/exams"
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-[#F47716] hover:bg-[#DC660E] text-white text-xs font-bold rounded-lg shadow-sm transition-all whitespace-nowrap flex-shrink-0"
          >
            <span>Take Exam</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Input Box */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-4">
        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Enter Certificate ID or Candidate ID
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={certId}
                onChange={(e) => setCertId(e.target.value)}
                placeholder="e.g. AICQB-ST-2026-000123 or AICQB-1004704"
                className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm font-mono bg-slate-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47716]"
              />
            </div>

            {/* Quick selection chips */}
            {myCertList.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 mt-3">
                <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                  My Certificates:
                </span>
                {myCertList.map((c) => {
                  const no = c.certificateNo || c.certificateNumber;
                  return (
                    <button
                      key={no}
                      type="button"
                      onClick={() => {
                        setCertId(no);
                        performVerify(no);
                      }}
                      className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full transition-all cursor-pointer border ${
                        certId === no
                          ? 'bg-orange-50 border-[#F47716] text-[#F47716]'
                          : 'bg-slate-50 border-gray-200 text-slate-600 hover:border-gray-300'
                      }`}
                    >
                      {no}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Public Verified Sample Chips */}
            {publicSamples.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                  Public Registry Samples:
                </span>
                {publicSamples.slice(0, 4).map((c) => (
                  <button
                    key={c.certificateNo}
                    type="button"
                    onClick={() => {
                      setCertId(c.certificateNo);
                      performVerify(c.certificateNo);
                    }}
                    className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full transition-all cursor-pointer border ${
                      certId === c.certificateNo
                        ? 'bg-orange-50 border-[#F47716] text-[#F47716]'
                        : 'bg-slate-50 border-gray-200 text-slate-600 hover:border-gray-300'
                    }`}
                  >
                    {c.certificateNo}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !certId.trim()}
            className="w-full py-3 bg-[#F47716] hover:bg-[#DC660E] text-white font-bold text-xs rounded-lg shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            <span>Verify Credential</span>
          </button>
        </form>
      </div>

      {/* Result Card */}
      {result && result.isValid && result.certificate && (
        <div className="bg-white rounded-2xl border-2 border-green-500 p-6 sm:p-8 shadow-lg space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#10264B]">Certificate Verified ✓</h3>
                <p className="text-[11px] text-green-600 font-semibold">Active Official Credential</p>
              </div>
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="px-3.5 py-2 bg-[#10264B] hover:bg-[#1E3A6E] text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center space-x-1.5 cursor-pointer self-start sm:self-auto"
            >
              <Award className="w-4 h-4 text-[#F47716]" />
              <span>View Full Certificate</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
            {/* Thumbnail */}
            <div
              onClick={() => setShowModal(true)}
              className="w-32 h-24 bg-slate-50 border-2 border-[#D4AF37] rounded-lg p-2 flex flex-col justify-between cursor-pointer shadow-sm hover:shadow-md transition-shadow flex-shrink-0"
            >
              <div className="flex justify-between items-center text-[7px] text-gray-400 font-bold uppercase">
                <span>AICQB</span>
                <span>CERTIFIED</span>
              </div>
              <div className="text-center">
                <p className="text-[8px] font-bold text-[#10264B] leading-tight truncate">
                  {result.certificate.certificationName}
                </p>
                <p className="text-[7px] text-[#F47716] font-mono">{result.certificate.certificationCode}</p>
              </div>
              <div className="text-center text-[6px] text-gray-400 border-t border-gray-200 pt-0.5">
                View Full
              </div>
            </div>

            {/* Details Table */}
            <div className="space-y-1.5 text-xs flex-1">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-gray-400 block text-[10px]">Candidate Name:</span>
                  <span className="font-bold text-[#10264B]">{result.certificate.candidateName}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px]">Certification:</span>
                  <span className="font-bold text-[#10264B]">{result.certificate.certificationName}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px]">Certificate ID:</span>
                  <span className="font-mono font-bold text-[#F47716]">{result.certificate.certificateNo}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px]">Candidate ID:</span>
                  <span className="font-mono font-medium text-gray-700">{result.certificate.candidateId || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px]">Issued On:</span>
                  <span className="font-medium text-gray-700">
                    {result.certificate.issueDateFormatted || result.certificate.issueDate}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px]">Valid Till:</span>
                  <span className="font-medium text-green-700 font-semibold">
                    {result.certificate.validUntilFormatted || result.certificate.validUntil}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {result && !result.isValid && (
        <div className="bg-white rounded-xl border border-red-200 p-6 text-center space-y-2">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
          <h4 className="text-sm font-bold text-gray-800">Verification Not Found</h4>
          <p className="text-xs text-gray-500">{result.message || 'No matching record was found in the official registry.'}</p>
        </div>
      )}

      {showModal && result?.certificate && (
        <CertificateModal certificate={result.certificate} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
};
