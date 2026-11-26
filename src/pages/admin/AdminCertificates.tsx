import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../services/api';
import { Certificate } from '../../types';
import { CertificateModal } from '../../components/CertificateModal';
import { AdminPagination } from '../../components/AdminPagination';
import {
  FileCheck2,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  AlertOctagon,
  RotateCcw,
  ExternalLink,
  Loader2,
  X,
  Award,
  CheckCircle2,
  ShieldAlert,
  Filter,
  RefreshCw,
  Calendar,
  User,
  GraduationCap,
} from 'lucide-react';

interface CertificationOption {
  id: string;
  code: string;
  name: string;
  level: string;
  domainCode: string;
}

const CERTIFICATION_OPTIONS: CertificationOption[] = [
  {
    id: 'cert_aicqb_ai_cp',
    code: 'AICQB-AI-CP',
    name: 'AICQB Certified AI Professional',
    level: 'Professional Level',
    domainCode: 'AI',
  },
  {
    id: 'cert_aicqb_st_cp',
    code: 'AICQB-ST-CP',
    name: 'AICQB Certified Software Tester',
    level: 'Professional Level',
    domainCode: 'ST',
  },
  {
    id: 'cert_aicqb_pw_cp',
    code: 'AICQB-PW-CP',
    name: 'AICQB Certified Playwright Automation',
    level: 'Advance Level',
    domainCode: 'PW',
  },
  {
    id: 'cert_aicqb_ds_201',
    code: 'AICQB-DS-201',
    name: 'AICQB Certified Data Science Professional',
    level: 'Professional Level',
    domainCode: 'DS',
  },
  {
    id: 'cert_aicqb_cy_301',
    code: 'AICQB-CY-301',
    name: 'AICQB Certified Cybersecurity Specialist',
    level: 'Advanced Level',
    domainCode: 'CY',
  },
];

export const AdminCertificates: React.FC = () => {
  const [certificates, setCertificates] = useState<Certificate[]>(() => {
    try {
      const c = localStorage.getItem('aicqb_admin_certificates');
      return c ? JSON.parse(c) : [];
    } catch (_) {
      return [];
    }
  });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All Status' | 'Issued' | 'Revoked'>('All Status');
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Issue Modal State
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [candidateId, setCandidateId] = useState('');
  const [selectedCertProgram, setSelectedCertProgram] = useState(CERTIFICATION_OPTIONS[0].id);
  const [credentialLevel, setCredentialLevel] = useState('Professional Level');
  const [grade, setGrade] = useState('Grade A+ (Distinction)');
  const [score, setScore] = useState<number>(90);
  const [customCertNo, setCustomCertNo] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [issuing, setIssuing] = useState(false);

  // Edit Modal State
  const [editingCert, setEditingCert] = useState<any | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  // Direct action in progress (for buttons)
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Notification / Feedback State
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadCertificates();
  }, []);

  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3500);
  };

  const loadCertificates = async () => {
    try {
      if (certificates.length === 0) setLoading(true);
      const res = await api.getAdminCertificates();
      if (res.success && Array.isArray(res.certificates)) {
        setCertificates(res.certificates);
        try { localStorage.setItem('aicqb_admin_certificates', JSON.stringify(res.certificates)); } catch (_) { }
      } else if (certificates.length === 0) {
        setCertificates([]);
      }
    } catch (err: any) {
      console.error('Failed to load certificates:', err);
      showToast('error', err.message || 'Failed to load real certificates.');
    } finally {
      setLoading(false);
    }
  };

  // Filtered Certificates
  const filteredCertificates = useMemo(() => {
    return certificates.filter((cert: any) => {
      // Status filter
      if (statusFilter !== 'All Status' && cert.status !== statusFilter) {
        return false;
      }

      // Search query filter
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const no = (cert.certificateNo || cert.certificateNumber || '').toLowerCase();
        const name = (cert.candidateName || '').toLowerCase();
        const email = (cert.candidateEmail || '').toLowerCase();
        const certName = (cert.certificationName || '').toLowerCase();
        const certCode = (cert.certificationCode || '').toLowerCase();
        const candId = (cert.candidateId || '').toLowerCase();

        return (
          no.includes(q) ||
          name.includes(q) ||
          email.includes(q) ||
          certName.includes(q) ||
          certCode.includes(q) ||
          candId.includes(q)
        );
      }

      return true;
    });
  }, [certificates, statusFilter, searchTerm]);

  // Statistics
  const stats = useMemo(() => {
    const total = certificates.length;
    const issued = certificates.filter((c: any) => c.status === 'Issued').length;
    const revoked = certificates.filter((c: any) => c.status === 'Revoked').length;
    return { total, issued, revoked };
  }, [certificates]);

  // Handle Manual Issue
  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateName.trim() || !candidateEmail.trim()) {
      showToast('error', 'Candidate name and email are required.');
      return;
    }

    try {
      setIssuing(true);
      const res = await api.issueCertificateAdmin({
        candidateName: candidateName.trim(),
        candidateEmail: candidateEmail.trim(),
        candidateId: candidateId.trim() || undefined,
        certificationId: selectedCertProgram,
        credentialLevel,
        grade,
        score: Number(score) || 85,
        certificateNo: customCertNo.trim() || undefined,
        issueDate: issueDate || undefined,
        forceNew: true,
      });

      if (res.success) {
        showToast('success', `Certificate issued: ${res.certificate?.certificateNo || ''}`);
        setShowIssueModal(false);
        setCandidateName('');
        setCandidateEmail('');
        setCandidateId('');
        setCustomCertNo('');
        setScore(90);
        await loadCertificates();
      }
    } catch (err: any) {
      showToast('error', err.message || 'Failed to issue certificate.');
    } finally {
      setIssuing(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (cert: any) => {
    setEditingCert({
      ...cert,
      candidateName: cert.candidateName || '',
      candidateEmail: cert.candidateEmail || '',
      candidateId: cert.candidateId || '',
      certificateNo: cert.certificateNo || cert.certificateNumber || '',
      certificationName: cert.certificationName || '',
      certificationCode: cert.certificationCode || '',
      credentialLevel: cert.credentialLevel || 'Professional Level',
      grade: cert.grade || 'Grade A',
      score: cert.score !== undefined ? cert.score : 85,
      issueDateFormatted: cert.issueDateFormatted || cert.issueDate || '',
      validUntilFormatted: cert.validUntilFormatted || cert.validUntil || '',
      status: cert.status || 'Issued',
      revocationReason: cert.revocationReason || '',
    });
  };

  // Save Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCert) return;

    try {
      setSavingEdit(true);
      const res = await api.updateAdminCertificate(editingCert.id, {
        candidateName: editingCert.candidateName,
        candidateEmail: editingCert.candidateEmail,
        candidateId: editingCert.candidateId,
        certificateNo: editingCert.certificateNo,
        certificationName: editingCert.certificationName,
        certificationCode: editingCert.certificationCode,
        credentialLevel: editingCert.credentialLevel,
        grade: editingCert.grade,
        score: Number(editingCert.score),
        issueDateFormatted: editingCert.issueDateFormatted,
        validUntilFormatted: editingCert.validUntilFormatted,
        status: editingCert.status,
        revocationReason: editingCert.status === 'Revoked' ? editingCert.revocationReason : null,
      });

      if (res.success) {
        showToast('success', `Certificate ${editingCert.certificateNo} updated successfully.`);
        setEditingCert(null);
        await loadCertificates();
      }
    } catch (err: any) {
      showToast('error', err.message || 'Failed to update certificate.');
    } finally {
      setSavingEdit(false);
    }
  };

  // Direct 1-Click Delete (NO POPUP)
  const handleDeleteDirect = async (id: string, certNo: string) => {
    try {
      setDeletingId(id);
      // Instant optimistic UI update
      setCertificates((prev) => prev.filter((c: any) => c.id !== id && c.certificateNo !== certNo));
      showToast('success', `Deleted certificate ${certNo}`);

      const res = await api.deleteAdminCertificate(id);
      if (!res.success) {
        // Rollback if server returned failure
        await loadCertificates();
        showToast('error', res.message || 'Failed to delete certificate.');
      }
    } catch (err: any) {
      await loadCertificates();
      showToast('error', err.message || 'Failed to delete certificate.');
    } finally {
      setDeletingId(null);
    }
  };

  // Direct Revoke / Reinstate
  const handleRevoke = async (id: string, certNo: string) => {
    try {
      const res = await api.revokeCertificate(id, 'Revoked by compliance administrator.');
      if (res.success) {
        showToast('success', `Certificate ${certNo} marked as Revoked.`);
        await loadCertificates();
      }
    } catch (err: any) {
      showToast('error', err.message || 'Failed to revoke certificate.');
    }
  };

  const handleReinstate = async (id: string, certNo: string) => {
    try {
      const res = await api.reinstateCertificate(id);
      if (res.success) {
        showToast('success', `Certificate ${certNo} reinstated to active Issued.`);
        await loadCertificates();
      }
    } catch (err: any) {
      showToast('error', err.message || 'Failed to reinstate certificate.');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 sm:top-5 sm:right-5 z-50 px-4 py-3 rounded-xl shadow-xl flex items-center space-x-2 text-xs font-bold border transition-all max-w-[90vw] sm:max-w-md ${notification.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800'
            }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
          ) : (
            <ShieldAlert className="w-4 h-4 text-red-600 flex-shrink-0" />
          )}
          <span className="truncate">{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center flex-wrap gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-[#10264B]">Certificate Management</h1>
            <span className="text-[11px] sm:text-xs bg-[#10264B]/10 text-[#10264B] px-2.5 py-0.5 rounded-full font-bold">
              Real DB: {certificates.length}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Issue, manage, verify, edit, and direct-delete digital credentials & cryptographic QR registries.
          </p>
        </div>

        <div className="flex items-center space-x-2 self-stretch sm:self-auto">
          <button
            onClick={loadCertificates}
            disabled={loading}
            className="p-2 sm:p-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center justify-center cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#F47716]' : ''}`} />
          </button>
          <button
            onClick={() => setShowIssueModal(true)}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-[#F47716] hover:bg-[#DC660E] text-white font-bold text-xs rounded-lg shadow-sm transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Issue Certificate</span>
          </button>
        </div>
      </div>

      {/* Metric Cards (Responsive Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Total Registered</p>
            <p className="text-xl sm:text-2xl font-black text-[#10264B] mt-0.5">{stats.total}</p>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-green-600">Active / Issued</p>
            <p className="text-xl sm:text-2xl font-black text-green-700 mt-0.5">{stats.issued}</p>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-red-500">Revoked Credentials</p>
            <p className="text-xl sm:text-2xl font-black text-red-600 mt-0.5">{stats.revoked}</p>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 shadow-sm flex flex-col sm:flex-row gap-2.5 sm:gap-3 text-xs">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <select
            value={statusFilter}
            onChange={(e: any) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 bg-slate-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#F47716] text-gray-700 font-semibold cursor-pointer"
          >
            <option value="All Status">All Status ({certificates.length})</option>
            <option value="Issued">Issued ({stats.issued})</option>
            <option value="Revoked">Revoked ({stats.revoked})</option>
          </select>
        </div>

        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by certificate no., candidate name, email, certification..."
            className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#F47716]"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* MOBILE CARD VIEW (< md screens) */}
      <div className="block md:hidden space-y-3">
        {loading ? (
          <div className="bg-white p-8 rounded-2xl border border-gray-200 text-center text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#F47716]" />
            <p className="font-semibold text-xs">Loading real certificates...</p>
          </div>
        ) : filteredCertificates.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-gray-200 text-center text-gray-500">
            <p className="font-bold text-sm text-[#10264B]">No certificates matched</p>
            <p className="text-xs text-gray-400 mt-1">Try clearing your search query</p>
          </div>
        ) : (
          filteredCertificates
            .slice((currentPage - 1) * pageSize, currentPage * pageSize)
            .map((cert: any) => (
            <div
              key={cert.id || cert.certificateNo}
              className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs space-y-3 transition-shadow hover:shadow-md"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-2 border-b border-gray-100 pb-2.5">
                <div>
                  <button
                    onClick={() => setSelectedCert(cert)}
                    className="font-mono font-bold text-sm text-[#F47716] hover:underline text-left cursor-pointer"
                  >
                    {cert.certificateNo || cert.certificateNumber}
                  </button>
                  {cert.candidateId && (
                    <p className="text-[10px] text-gray-400 font-mono">{cert.candidateId}</p>
                  )}
                </div>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${cert.status === 'Issued'
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                    }`}
                >
                  {cert.status}
                </span>
              </div>

              {/* Candidate Info */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-[10px] text-gray-400 font-medium">Candidate</p>
                  <p className="font-bold text-[#10264B] truncate">{cert.candidateName}</p>
                  {cert.candidateEmail && (
                    <p className="text-[10px] text-gray-400 truncate">{cert.candidateEmail}</p>
                  )}
                </div>

                <div>
                  <p className="text-[10px] text-gray-400 font-medium">Certification</p>
                  <p className="font-medium text-gray-800 truncate">{cert.certificationName}</p>
                  <p className="text-[10px] text-gray-500 font-mono">{cert.certificationCode}</p>
                </div>
              </div>

              {/* Issue Date & Grade */}
              <div className="flex items-center justify-between text-[11px] bg-slate-50 p-2 rounded-lg text-gray-600">
                <span className="flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  <span>{cert.issueDateFormatted || cert.issueDate?.split('T')[0]}</span>
                </span>
                {cert.grade && (
                  <span className="font-bold text-[#10264B] bg-white px-2 py-0.5 rounded border border-gray-200 text-[10px]">
                    {cert.grade}
                  </span>
                )}
              </div>

              {/* Action Buttons: Touch-friendly */}
              <div className="flex items-center justify-between gap-1 pt-1 border-t border-gray-100">
                <div className="flex items-center space-x-1">
                  {/* View */}
                  <button
                    onClick={() => setSelectedCert(cert)}
                    className="p-2 rounded-lg bg-slate-100 text-[#10264B] hover:bg-slate-200 transition-colors"
                    title="View Certificate"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>

                  {/* Edit */}
                  <button
                    onClick={() => handleOpenEdit(cert)}
                    className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                    title="Edit Certificate"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>

                  {/* Verify Link */}
                  <a
                    href={`/verify?id=${encodeURIComponent(cert.certificateNo || cert.certificateNumber)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                    title="Public Verification"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  {/* Revoke / Reinstate */}
                  {cert.status === 'Issued' ? (
                    <button
                      onClick={() => handleRevoke(cert.id, cert.certificateNo || cert.certificateNumber)}
                      className="p-2 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors"
                      title="Revoke Certificate"
                    >
                      <AlertOctagon className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleReinstate(cert.id, cert.certificateNo || cert.certificateNumber)}
                      className="p-2 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                      title="Reinstate to Active"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Direct Delete (No popup) */}
                <button
                  onClick={() => handleDeleteDirect(cert.id, cert.certificateNo || cert.certificateNumber)}
                  disabled={deletingId === cert.id}
                  className="px-2.5 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors text-xs font-semibold flex items-center space-x-1 cursor-pointer"
                  title="Direct Delete without popup"
                >
                  {deletingId === cert.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* DESKTOP TABLE VIEW (>= md screens) */}
      <div className="hidden md:block bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-gray-600 font-bold uppercase tracking-wider text-[11px] border-b border-gray-200">
              <tr>
                <th className="py-3.5 px-6">Certificate No.</th>
                <th className="py-3.5 px-6">Candidate Name</th>
                <th className="py-3.5 px-6">Certification</th>
                <th className="py-3.5 px-6">Issued On</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Actions (Direct CRUD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#F47716]" />
                    <p className="font-semibold text-xs">Loading real certificates from AICQB database...</p>
                  </td>
                </tr>
              ) : filteredCertificates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500">
                    <p className="font-bold text-sm text-[#10264B]">No certificates matched your criteria</p>
                    <p className="text-xs text-gray-400 mt-1">Try clearing your search query or filter</p>
                  </td>
                </tr>
              ) : (
                filteredCertificates
                  .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                  .map((cert: any) => (
                  <tr key={cert.id || cert.certificateNo} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-[#F47716]">
                      <button
                        onClick={() => setSelectedCert(cert)}
                        className="hover:underline flex items-center space-x-1.5 cursor-pointer text-left"
                        title="Click to view full credential"
                      >
                        <span>{cert.certificateNo || cert.certificateNumber}</span>
                      </button>
                      {cert.candidateId && (
                        <p className="text-[10px] text-gray-400 font-mono font-normal">{cert.candidateId}</p>
                      )}
                    </td>

                    <td className="py-4 px-6">
                      <p className="font-bold text-[#10264B]">{cert.candidateName}</p>
                      {cert.candidateEmail && (
                        <p className="text-[11px] text-gray-400">{cert.candidateEmail}</p>
                      )}
                    </td>

                    <td className="py-4 px-6">
                      <p className="text-gray-800 font-medium">{cert.certificationName}</p>
                      <p className="text-[10px] text-gray-500 font-mono">{cert.certificationCode || cert.credentialLevel}</p>
                    </td>

                    <td className="py-4 px-6 text-gray-600">
                      <p>{cert.issueDateFormatted || cert.issueDate?.split('T')[0]}</p>
                      {cert.grade && (
                        <span className="text-[10px] text-slate-500 font-semibold">{cert.grade}</span>
                      )}
                    </td>

                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${cert.status === 'Issued'
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                      >
                        {cert.status}
                      </span>
                      {cert.status === 'Revoked' && cert.revocationReason && (
                        <p className="text-[10px] text-red-500 italic mt-0.5 max-w-xs truncate" title={cert.revocationReason}>
                          {cert.revocationReason}
                        </p>
                      )}
                    </td>

                    <td className="py-4 px-6 text-right space-x-1 whitespace-nowrap">
                      {/* VIEW / PREVIEW */}
                      <button
                        onClick={() => setSelectedCert(cert)}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-[#10264B] hover:bg-slate-100 transition-colors inline-flex cursor-pointer"
                        title="View Official Certificate"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {/* EDIT (UPDATE) */}
                      <button
                        onClick={() => handleOpenEdit(cert)}
                        className="p-1.5 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors inline-flex cursor-pointer"
                        title="Edit Certificate Details"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      {/* PUBLIC VERIFICATION LINK */}
                      <a
                        href={`/verify?id=${encodeURIComponent(cert.certificateNo || cert.certificateNumber)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors inline-flex cursor-pointer"
                        title="Verify in Public Registry"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>

                      {/* REVOKE OR REINSTATE */}
                      {cert.status === 'Issued' ? (
                        <button
                          onClick={() => handleRevoke(cert.id, cert.certificateNo || cert.certificateNumber)}
                          className="p-1.5 rounded-lg text-amber-500 hover:text-amber-700 hover:bg-amber-50 transition-colors inline-flex cursor-pointer"
                          title="Revoke Certificate"
                        >
                          <AlertOctagon className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleReinstate(cert.id, cert.certificateNo || cert.certificateNumber)}
                          className="p-1.5 rounded-lg text-green-600 hover:text-green-800 hover:bg-green-50 transition-colors inline-flex cursor-pointer"
                          title="Reinstate to Active Issued Status"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* DIRECT DELETE (NO POPUP) */}
                      <button
                        onClick={() => handleDeleteDirect(cert.id, cert.certificateNo || cert.certificateNumber)}
                        disabled={deletingId === cert.id}
                        className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors inline-flex cursor-pointer"
                        title="Direct Delete (Instant, no popup)"
                      >
                        {deletingId === cert.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <AdminPagination
          currentPage={currentPage}
          totalRecords={filteredCertificates.length}
          pageSize={pageSize}
          onPageChange={(page) => setCurrentPage(page)}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
          pageSizeOptions={[10, 25, 50, 100]}
        />
      </div>

      {/* CREATE / ISSUE MODAL */}
      {showIssueModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-6 space-y-4 shadow-2xl border border-gray-200 my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm text-[#10264B] flex items-center space-x-2">
                <FileCheck2 className="w-4 h-4 text-[#F47716]" />
                <span>Issue Real Digital Certificate</span>
              </h3>
              <button
                onClick={() => setShowIssueModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleIssue} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Candidate Full Name *</label>
                  <input
                    type="text"
                    required
                    value={candidateName}
                    onChange={(e) => setCandidateName(e.target.value)}
                    placeholder="e.g. Ramesh Patil"
                    className="w-full p-2.5 bg-slate-50 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#F47716] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Candidate Email *</label>
                  <input
                    type="email"
                    required
                    value={candidateEmail}
                    onChange={(e) => setCandidateEmail(e.target.value)}
                    placeholder="candidate@example.com"
                    className="w-full p-2.5 bg-slate-50 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#F47716] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Certification Program *</label>
                <select
                  value={selectedCertProgram}
                  onChange={(e) => setSelectedCertProgram(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#F47716] focus:outline-none font-medium"
                >
                  {CERTIFICATION_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.name} ({opt.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Credential Level</label>
                  <select
                    value={credentialLevel}
                    onChange={(e) => setCredentialLevel(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#F47716] focus:outline-none"
                  >
                    <option>Professional Level</option>
                    <option>Advanced Level</option>
                    <option>Executive Professional Level</option>
                    <option>Associate Level</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Grade</label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#F47716] focus:outline-none"
                  >
                    <option>Grade A+ (Distinction)</option>
                    <option>Grade A (Merit)</option>
                    <option>Grade B (Pass)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Score / Percentage</label>
                  <input
                    type="number"
                    min="70"
                    max="100"
                    value={score}
                    onChange={(e) => setScore(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#F47716] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Custom Certificate No. <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={customCertNo}
                    onChange={(e) => setCustomCertNo(e.target.value)}
                    placeholder="Leave blank for auto-seq"
                    className="w-full p-2 bg-slate-50 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#F47716] focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Issue Date</label>
                  <input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#F47716] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  className="w-full sm:w-auto px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={issuing}
                  className="w-full sm:w-auto px-6 py-2.5 bg-[#F47716] hover:bg-[#DC660E] text-white font-bold rounded-lg shadow-sm transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  {issuing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>Issue & Cryptographically Sign</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPDATE / EDIT MODAL */}
      {editingCert && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-6 space-y-4 shadow-2xl border border-gray-200 my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm text-[#10264B] flex items-center space-x-2">
                <Edit className="w-4 h-4 text-blue-600" />
                <span>Edit Digital Credential ({editingCert.certificateNo})</span>
              </h3>
              <button
                onClick={() => setEditingCert(null)}
                className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Candidate Full Name *</label>
                  <input
                    type="text"
                    required
                    value={editingCert.candidateName}
                    onChange={(e) => setEditingCert({ ...editingCert, candidateName: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#F47716] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Candidate Email</label>
                  <input
                    type="email"
                    value={editingCert.candidateEmail}
                    onChange={(e) => setEditingCert({ ...editingCert, candidateEmail: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#F47716] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Certificate No. *</label>
                  <input
                    type="text"
                    required
                    value={editingCert.certificateNo}
                    onChange={(e) => setEditingCert({ ...editingCert, certificateNo: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#F47716] focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Candidate ID</label>
                  <input
                    type="text"
                    value={editingCert.candidateId}
                    onChange={(e) => setEditingCert({ ...editingCert, candidateId: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#F47716] focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Certification Name</label>
                <input
                  type="text"
                  required
                  value={editingCert.certificationName}
                  onChange={(e) => setEditingCert({ ...editingCert, certificationName: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#F47716] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Credential Level</label>
                  <input
                    type="text"
                    value={editingCert.credentialLevel}
                    onChange={(e) => setEditingCert({ ...editingCert, credentialLevel: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#F47716] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Grade</label>
                  <input
                    type="text"
                    value={editingCert.grade}
                    onChange={(e) => setEditingCert({ ...editingCert, grade: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#F47716] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Score</label>
                  <input
                    type="number"
                    value={editingCert.score}
                    onChange={(e) => setEditingCert({ ...editingCert, score: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#F47716] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Issued On</label>
                  <input
                    type="text"
                    value={editingCert.issueDateFormatted}
                    onChange={(e) => setEditingCert({ ...editingCert, issueDateFormatted: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#F47716] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Valid Until</label>
                  <input
                    type="text"
                    value={editingCert.validUntilFormatted}
                    onChange={(e) => setEditingCert({ ...editingCert, validUntilFormatted: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#F47716] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Status</label>
                  <select
                    value={editingCert.status}
                    onChange={(e) => setEditingCert({ ...editingCert, status: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#F47716] focus:outline-none font-bold"
                  >
                    <option value="Issued">Issued (Active)</option>
                    <option value="Revoked">Revoked</option>
                  </select>
                </div>
              </div>

              {editingCert.status === 'Revoked' && (
                <div>
                  <label className="block font-semibold text-red-600 mb-1">Revocation Reason</label>
                  <input
                    type="text"
                    value={editingCert.revocationReason || ''}
                    onChange={(e) => setEditingCert({ ...editingCert, revocationReason: e.target.value })}
                    placeholder="Enter reason for revocation"
                    className="w-full p-2 bg-red-50 border border-red-200 rounded-lg focus:ring-1 focus:ring-red-400 focus:outline-none text-red-800"
                  />
                </div>
              )}

              <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setEditingCert(null)}
                  className="w-full sm:w-auto px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  {savingEdit ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Edit className="w-3.5 h-3.5" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OFFICIAL CERTIFICATE PREVIEW MODAL */}
      {selectedCert && (
        <CertificateModal certificate={selectedCert} onClose={() => setSelectedCert(null)} />
      )}
    </div>
  );
};
