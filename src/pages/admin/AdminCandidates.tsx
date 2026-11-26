import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { CandidateProfile } from '../../types';
import { AdminPagination } from '../../components/AdminPagination';
import { Users, Plus, Search, Eye, Edit3, Trash2, Power, CheckCircle2, X, Loader2, Award, Calendar } from 'lucide-react';

export const AdminCandidates: React.FC = () => {
  const [candidates, setCandidates] = useState<CandidateProfile[]>(() => {
    try {
      const c = localStorage.getItem('aicqb_admin_candidates');
      return c ? JSON.parse(c) : [];
    } catch (_) {
      return [];
    }
  });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedDomain, setSelectedDomain] = useState('All Domains');
  const [activeCandidateDetail, setActiveCandidateDetail] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // CRUD Modals State
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    country: 'India',
    domain: 'Technology & IT',
    status: 'Active',
    rewardPoints: 100,
  });

  useEffect(() => {
    setCurrentPage(1);
    loadCandidates();
  }, [searchTerm, selectedStatus, selectedDomain]);

  const loadCandidates = async () => {
    try {
      if (candidates.length === 0) setLoading(true);
      const res = await api.getAdminCandidates({
        search: searchTerm,
        status: selectedStatus,
        domain: selectedDomain !== 'All Domains' ? selectedDomain : undefined,
      });
      if (res.success && res.candidates) {
        setCandidates(res.candidates);
        try { localStorage.setItem('aicqb_admin_candidates', JSON.stringify(res.candidates)); } catch (_) { }
      }
    } catch (err) {
      console.error('Failed to load candidates:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setFormData({
      fullName: '',
      email: '',
      phoneNumber: '+91 98765 43210',
      country: 'India',
      domain: 'Technology & IT',
      status: 'Active',
      rewardPoints: 100,
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (cand: any) => {
    setEditingCandidate(cand);
    setFormData({
      fullName: cand.fullName || '',
      email: cand.email || '',
      phoneNumber: cand.phoneNumber || '+91 98765 43210',
      country: cand.country || 'India',
      domain: cand.domain || 'Technology & IT',
      status: cand.status || 'Active',
      rewardPoints: cand.rewardPoints || 100,
    });
  };

  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const res = await api.createAdminCandidate(formData);
      if (res.success) {
        setShowAddModal(false);
        loadCandidates();
        showToast('Candidate added successfully!');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to create candidate', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCandidate) return;
    try {
      setActionLoading(true);
      const res = await api.updateAdminCandidate(editingCandidate.candidateId || editingCandidate.id, formData);
      if (res.success) {
        setEditingCandidate(null);
        loadCandidates();
        showToast('Candidate updated successfully!');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update candidate', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCandidate = async (candidateId: string, name: string) => {
    // Instant deletion without any confirmation popup (per user instruction: "do not give delete pop up")
    // Optimistic UI update
    setCandidates((prev) => prev.filter((c) => c.candidateId !== candidateId && c.id !== candidateId));
    showToast(`Candidate ${name || candidateId} deleted successfully.`);

    try {
      await api.deleteAdminCandidate(candidateId);
      loadCandidates();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete candidate', 'error');
      loadCandidates();
    }
  };

  const displayCandidates = candidates;

  const handleViewCandidate = async (candidateId: string) => {
    try {
      setLoadingDetail(true);
      const res = await api.getAdminCandidateDetails(candidateId);
      if (res.success) {
        setActiveCandidateDetail(res);
      }
    } catch (err: any) {
      showToast('Failed to load candidate details.', 'error');
    } finally {
      setLoadingDetail(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification (Replaces Popups) */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-[1000] px-5 py-3.5 rounded-2xl shadow-2xl border text-xs font-bold flex items-center space-x-2.5 animate-in slide-in-from-bottom duration-200 ${toast.type === 'success'
            ? 'bg-emerald-950 text-emerald-100 border-emerald-500/50 shadow-emerald-950/40'
            : 'bg-red-950 text-red-100 border-red-500/50 shadow-red-950/40'
            }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          ) : (
            <X className="w-4 h-4 text-red-400 flex-shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header matching Image 5 #4 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#10264B]">Candidate Management</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage candidate registrations, profiles and exam enrolments.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-[#F47716] hover:bg-[#DC660E] text-white font-bold text-xs rounded-lg shadow-sm transition-all flex items-center space-x-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Candidate</span>
        </button>
      </div>

      {/* Filter Bar matching Image 5 #4 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-col sm:flex-row gap-3 text-xs">
        <select
          value={selectedDomain}
          onChange={(e) => setSelectedDomain(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-gray-300 rounded-lg focus:outline-none text-gray-700 font-medium"
        >
          <option value="All Domains">All Domains</option>
          <option value="Software Testing & Quality Engineering">Software Testing & Quality Engineering</option>
          <option value="Artificial Intelligence & Machine Learning">Artificial Intelligence & Machine Learning</option>
          <option value="Playwright Automation Engineering">Playwright Automation Engineering</option>
          <option value="Data Science & Machine Learning">Data Science & Machine Learning</option>
          <option value="Cybersecurity & Governance">Cybersecurity & Governance</option>
          <option value="Technology & IT">Technology & IT</option>
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-gray-300 rounded-lg focus:outline-none text-gray-700 font-medium"
        >
          <option value="All">Status: All</option>
          <option value="Active">Active</option>
          <option value="Suspended">Suspended</option>
        </select>

        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, email or ID..."
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#F47716]"
          />
        </div>
      </div>

      {/* Candidates Table matching Image 5 #4 */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-gray-600 font-semibold uppercase tracking-wider text-[11px] border-b border-gray-200">
              <tr>
                <th className="py-3.5 px-6">Candidate ID</th>
                <th className="py-3.5 px-6">Name</th>
                <th className="py-3.5 px-6">Email</th>
                <th className="py-3.5 px-6">Domain / Country</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayCandidates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    <Users className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                    <p className="font-semibold text-sm">No Candidate Records Found</p>
                    <p className="text-[11px] mt-0.5">Click "Add Candidate" to register a candidate or wait for candidate signups.</p>
                  </td>
                </tr>
              ) : (
                displayCandidates
                  .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                  .map((c: any) => (
                <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-6 font-mono font-bold text-[#F47716]">{c.candidateId}</td>
                  <td className="py-4 px-6 font-bold text-[#10264B]">{c.fullName}</td>
                  <td className="py-4 px-6 text-gray-600">{c.email}</td>
                  <td className="py-4 px-6 text-gray-600 font-medium">{c.domain || c.country || 'Technology & IT'}</td>
                  <td className="py-4 px-6">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-200">
                      {c.status || 'Active'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right space-x-1.5 whitespace-nowrap">
                    <button
                      onClick={() => handleViewCandidate(c.candidateId)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-[#10264B] hover:bg-slate-100 transition-colors"
                      title="View Profile Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleOpenEdit(c)}
                      className="p-1.5 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors"
                      title="Edit Candidate Information"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCandidate(c.candidateId, c.fullName)}
                      className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                      title="Delete Candidate Record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>

        <AdminPagination
          currentPage={currentPage}
          totalRecords={displayCandidates.length}
          pageSize={pageSize}
          onPageChange={(page) => setCurrentPage(page)}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
          pageSizeOptions={[10, 25, 50, 100]}
        />
      </div>

      {/* Candidate Profile Details Drawer / Modal */}
      {activeCandidateDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm text-[#10264B] flex items-center space-x-2">
                <Users className="w-4 h-4 text-[#F47716]" />
                <span>Candidate Profile Dossier</span>
              </h3>
              <button onClick={() => setActiveCandidateDetail(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-center space-x-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="w-12 h-12 rounded-full bg-[#10264B] text-white flex items-center justify-center font-bold text-base">
                  {activeCandidateDetail.candidate.fullName?.charAt(0) || 'C'}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#10264B]">{activeCandidateDetail.candidate.fullName}</h4>
                  <p className="text-gray-500 font-mono">{activeCandidateDetail.candidate.candidateId}</p>
                  <p className="text-gray-500">{activeCandidateDetail.candidate.email}</p>
                </div>
              </div>

              {/* Enrollments */}
              <div>
                <h5 className="font-bold text-[#10264B] mb-2">Enrollments ({activeCandidateDetail.enrollments?.length || 0})</h5>
                {activeCandidateDetail.enrollments?.length > 0 ? (
                  <div className="space-y-2">
                    {activeCandidateDetail.enrollments.map((enr: any) => (
                      <div key={enr.id} className="p-3 bg-slate-50 border rounded flex justify-between">
                        <span>{enr.certificationName}</span>
                        <span className="font-bold text-green-600">{enr.status}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 italic">No certifications enrolled yet.</p>
                )}
              </div>

              {/* Certificates */}
              <div>
                <h5 className="font-bold text-[#10264B] mb-2">Issued Certificates ({activeCandidateDetail.certificates?.length || 0})</h5>
                {activeCandidateDetail.certificates?.length > 0 ? (
                  <div className="space-y-2">
                    {activeCandidateDetail.certificates.map((cert: any) => (
                      <div key={cert.id} className="p-3 bg-slate-50 border rounded flex justify-between">
                        <span className="font-mono text-[#F47716] font-bold">{cert.certificateNo}</span>
                        <span>{cert.certificationName}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 italic">No certificates issued yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Candidate Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-[#10264B] flex items-center space-x-2">
                <Plus className="w-5 h-5 text-[#F47716]" />
                <span>Add New Candidate</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveAdd} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="e.g. Ramesh Patel"
                  className="w-full p-2.5 border rounded-lg focus:ring-1 focus:ring-[#F47716] focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="ramesh@example.com"
                    className="w-full p-2.5 border rounded-lg focus:ring-1 focus:ring-[#F47716] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="w-full p-2.5 border rounded-lg focus:ring-1 focus:ring-[#F47716] focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Domain</label>
                  <select
                    value={formData.domain}
                    onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                    className="w-full p-2.5 border rounded-lg focus:ring-1 focus:ring-[#F47716] focus:outline-none bg-white"
                  >
                    <option>Technology & IT</option>
                    <option>Data & AI</option>
                    <option>Business & Mgmt</option>
                    <option>Healthcare</option>
                    <option>Cloud Computing</option>
                    <option>Cybersecurity</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full p-2.5 border rounded-lg focus:ring-1 focus:ring-[#F47716] focus:outline-none bg-white"
                  >
                    <option value="Active">Active</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-[#F47716] hover:bg-[#DC660E] text-white font-bold rounded-lg shadow-sm flex items-center space-x-1.5"
                >
                  {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Save Candidate</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Candidate Modal */}
      {editingCandidate && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-[#10264B] flex items-center space-x-2">
                <Edit3 className="w-5 h-5 text-blue-600" />
                <span>Edit Candidate ({editingCandidate.candidateId})</span>
              </h3>
              <button onClick={() => setEditingCandidate(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full p-2.5 border rounded-lg focus:ring-1 focus:ring-[#F47716] focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-2.5 border rounded-lg focus:ring-1 focus:ring-[#F47716] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="w-full p-2.5 border rounded-lg focus:ring-1 focus:ring-[#F47716] focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Country</label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full p-2.5 border rounded-lg focus:ring-1 focus:ring-[#F47716] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Domain</label>
                  <input
                    type="text"
                    value={formData.domain}
                    onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                    className="w-full p-2.5 border rounded-lg focus:ring-1 focus:ring-[#F47716] focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full p-2.5 border rounded-lg focus:ring-1 focus:ring-[#F47716] focus:outline-none bg-white"
                  >
                    <option value="Active">Active</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Reward Points</label>
                  <input
                    type="number"
                    value={formData.rewardPoints}
                    onChange={(e) => setFormData({ ...formData, rewardPoints: Number(e.target.value) })}
                    className="w-full p-2.5 border rounded-lg focus:ring-1 focus:ring-[#F47716] focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setEditingCandidate(null)}
                  className="px-4 py-2 border rounded-lg hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm flex items-center space-x-1.5"
                >
                  {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
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

