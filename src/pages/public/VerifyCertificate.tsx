import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import { Certificate } from '../../types';
import { CertificateModal } from '../../components/CertificateModal';
import { ShieldCheck, Search, CheckCircle2, AlertCircle, Award, Calendar, ExternalLink, Loader2 } from 'lucide-react';

export const VerifyCertificate: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [certificateId, setCertificateId] = useState(searchParams.get('id') || '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ isValid: boolean; certificate?: Certificate; message?: string } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [publicRegistry, setPublicRegistry] = useState<any[]>([]);

  useEffect(() => {
    // Dynamically fetch public registry sample IDs from backend
    api.getPublicRegistry()
      .then(res => {
        if (res.success && res.certificates && res.certificates.length > 0) {
          setPublicRegistry(res.certificates);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const idFromQuery = searchParams.get('id');
    if (idFromQuery) {
      setCertificateId(idFromQuery);
      performVerify(idFromQuery);
    }
  }, [searchParams]);

  const performVerify = async (idToVerify: string) => {
    if (!idToVerify.trim()) return;
    try {
      setLoading(true);
      setResult(null);
      const res = await api.verifyCertificate(idToVerify.trim());
      setResult(res);
    } catch (err: any) {
      setResult({
        isValid: false,
        message: err.message || 'No record matching this certificate ID was found in the official registry.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performVerify(certificateId);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      {/* Title */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center space-x-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-semibold border border-green-200">
          <ShieldCheck className="w-4 h-4 text-green-600" />
          <span>Central Certificate Verification Registry</span>
        </div>
        <h1 className="text-3xl font-extrabold text-[#10264B]">Verify AICQB Certificate</h1>
        <p className="text-xs sm:text-sm text-gray-500 max-w-lg mx-auto">
          Validate the authenticity and active standing of any AICQB professional credential.
        </p>
      </div>

      {/* Verification Input Box */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-md p-6 sm:p-8 space-y-4">
        <form onSubmit={handleFormSubmit} className="space-y-3">
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
            Enter Certificate ID or Candidate ID
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-gray-400 absolute left-4 top-3.5" />
              <input
                type="text"
                value={certificateId}
                onChange={(e) => setCertificateId(e.target.value)}
                placeholder="e.g., AICQB-ST-2026-000123 or AICQB-1004704"
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-gray-300 rounded-xl text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#F47716]"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading || !certificateId.trim()}
              className="px-8 py-3 bg-[#F47716] hover:bg-[#DC660E] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              <span>Verify Certificate</span>
            </button>
          </div>

          {/* Quick Verified Examples - Dynamically loaded */}
          {publicRegistry.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">Recent Verified IDs:</span>
              {publicRegistry.slice(0, 5).map((c) => {
                const id = c.certificateNo;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setCertificateId(id);
                      performVerify(id);
                    }}
                    className={`text-xs font-mono font-bold px-3 py-1 rounded-full transition-all cursor-pointer border ${
                      certificateId === id
                        ? 'bg-orange-50 border-[#F47716] text-[#F47716]'
                        : 'bg-slate-50 border-gray-200 text-slate-600 hover:border-[#F47716] hover:text-[#F47716]'
                    }`}
                  >
                    {id}
                  </button>
                );
              })}
            </div>
          )}
        </form>
      </div>

      {/* Verification Result Display */}
      {result && (
        <div className="transition-all animate-fadeIn">
          {result.isValid && result.certificate ? (
            <div className="bg-white rounded-2xl border-2 border-green-500/50 p-6 sm:p-8 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-green-600 uppercase tracking-wider">Authentic Record</span>
                    <h3 className="text-xl font-black text-[#10264B]">Certificate Verified ✓</h3>
                  </div>
                </div>

                <button
                  onClick={() => setShowModal(true)}
                  className="px-4 py-2 bg-[#10264B] hover:bg-[#1E3A6E] text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center space-x-2 cursor-pointer"
                >
                  <Award className="w-4 h-4 text-[#F47716]" />
                  <span>View Official Certificate</span>
                </button>
              </div>

              {/* Data Table */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-gray-400 block font-medium">Candidate Name</span>
                  <span className="text-sm font-bold text-[#10264B]">{result.certificate.candidateName}</span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-gray-400 block font-medium">Certification Title</span>
                  <span className="text-sm font-bold text-[#10264B]">{result.certificate.certificationName}</span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-gray-400 block font-medium">Certificate ID</span>
                  <span className="text-sm font-mono font-bold text-[#F47716]">{result.certificate.certificateNo}</span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-gray-400 block font-medium">Candidate ID</span>
                  <span className="text-sm font-mono font-bold text-[#10264B]">{result.certificate.candidateId || 'N/A'}</span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-gray-400 block font-medium">Credential Level</span>
                  <span className="text-sm font-bold text-[#10264B]">{result.certificate.credentialLevel}</span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-gray-400 block font-medium">Date of Issue</span>
                  <span className="text-sm font-bold text-gray-700">
                    {result.certificate.issueDateFormatted || result.certificate.issueDate}
                  </span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 sm:col-span-2">
                  <span className="text-gray-400 block font-medium">Validity Standing</span>
                  <span className="text-sm font-bold text-green-600">
                    Active • Valid until {result.certificate.validUntilFormatted || result.certificate.validUntil}
                  </span>
                </div>
              </div>

              {/* Legal Verification Notice */}
              <p className="text-[11px] text-gray-400 italic text-center pt-2">
                This verification check confirms that the credential was awarded by AICQB under its independent professional
                assessment framework.
              </p>
            </div>
          ) : (result as any)?.status === 'Revoked' || (result as any)?.isRevoked ? (
            <div className="bg-white rounded-2xl border-2 border-red-500/50 p-6 sm:p-8 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-red-100 gap-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-red-600 uppercase tracking-wider">Credential Status: Revoked</span>
                    <h3 className="text-xl font-black text-[#10264B]">Certificate Invalid / Revoked</h3>
                  </div>
                </div>
                <span className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-full">Revoked by Board</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 bg-red-50/50 rounded-lg border border-red-200">
                  <span className="text-gray-400 block font-medium">Certificate ID</span>
                  <span className="text-sm font-mono font-bold text-red-800">{certificateId}</span>
                </div>
                <div className="p-3.5 bg-red-50/50 rounded-lg border border-red-200">
                  <span className="text-gray-400 block font-medium">Candidate Name</span>
                  <span className="text-sm font-bold text-gray-800">{result.certificate?.candidateName || 'Unknown / Expired'}</span>
                </div>
                <div className="p-3.5 bg-red-50/50 rounded-lg border border-red-200 sm:col-span-2">
                  <span className="text-gray-400 block font-medium">Reason for Revocation</span>
                  <span className="text-sm text-red-700 font-medium">
                    {(result as any).revocationReason || 'This credential has been formally revoked by the AICQB Ethics & Certification Standards Committee and is invalid.'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-red-200 p-8 text-center space-y-4 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#10264B]">No Verified Credential Found</h3>
              <p className="text-xs text-gray-600 max-w-md mx-auto">
                {result.message || 'The specified Certificate ID or Candidate ID does not match any active record in the AICQB central database.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Modal View */}
      {showModal && result?.certificate && (
        <CertificateModal certificate={result.certificate} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
};
