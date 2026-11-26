import React, { useState } from 'react';
import { api } from '../../services/api';
import { Certificate } from '../../types';
import { CertificateModal } from '../../components/CertificateModal';
import { ShieldCheck, Search, CheckCircle2, AlertCircle, Award, Loader2 } from 'lucide-react';

export const CandidateVerify: React.FC = () => {
  const [certId, setCertId] = useState('AICQB-ST-2026-000123');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [myCertList, setMyCertList] = useState<any[]>([]);

  React.useEffect(() => {
    api.getMyCertificates().then(res => {
      if (res.success && res.certificates && res.certificates.length > 0) {
        setMyCertList(res.certificates);
        if (res.certificates[0].certificateNo) {
          setCertId(res.certificates[0].certificateNo);
          performVerify(res.certificates[0].certificateNo);
        }
      } else {
        performVerify('AICQB-ST-2026-000123');
      }
    }).catch(() => {
      performVerify('AICQB-ST-2026-000123');
    });
  }, []);

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
        message: err.message || 'No record found with this ID.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    performVerify(certId);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header matching Image 2 #7 */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-[#10264B]">Certificate Verification</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Verify the authenticity of any AICQB certificate.
        </p>
      </div>

      {/* Input Box matching Image 2 #7 */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-4">
        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Enter Certificate ID
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={certId}
                onChange={(e) => setCertId(e.target.value)}
                placeholder="e.g. AICQB-ST-2026-000123"
                className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm font-mono bg-slate-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47716]"
              />
            </div>
            {/* Quick selection chips */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Quick Select:</span>
              {myCertList.map(c => (
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
              {['AICQB-ST-2026-000123', 'AICQB-CERT-100567', 'AICQB-PW-2026-000125'].map(id => (
                !myCertList.some(c => c.certificateNo === id) && (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setCertId(id);
                      performVerify(id);
                    }}
                    className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full transition-all cursor-pointer border ${
                      certId === id
                        ? 'bg-orange-50 border-[#F47716] text-[#F47716]'
                        : 'bg-slate-50 border-gray-200 text-slate-600 hover:border-gray-300'
                    }`}
                  >
                    {id}
                  </button>
                )
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#F47716] hover:bg-[#DC660E] text-white font-bold text-xs rounded-lg shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            <span>Verify Certificate</span>
          </button>
        </form>
      </div>

      {/* Result Card matching Image 2 #7 */}
      {result && result.isValid && result.certificate && (
        <div className="bg-white rounded-2xl border-2 border-green-500 p-6 sm:p-8 shadow-lg space-y-6">
          <div className="flex items-center space-x-3 pb-4 border-b border-gray-100">
            <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#10264B]">Certificate Verified ✓</h3>
              <p className="text-[11px] text-green-600 font-semibold">Active Official Credential</p>
            </div>
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

            {/* Details Table matching Image 2 #7 */}
            <div className="space-y-1.5 text-xs flex-1">
              <div className="grid grid-cols-2 gap-2 text-xs">
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
                  <span className="text-gray-400 block text-[10px]">Issued On:</span>
                  <span className="font-medium text-gray-700">
                    {result.certificate.issueDateFormatted || result.certificate.issueDate}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px]">Valid Till:</span>
                  <span className="font-medium text-gray-700">
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
          <h4 className="text-sm font-bold text-gray-800">Verification Failed</h4>
          <p className="text-xs text-gray-500">{result.message || 'No matching record was found.'}</p>
        </div>
      )}

      {showModal && result?.certificate && (
        <CertificateModal certificate={result.certificate} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
};

