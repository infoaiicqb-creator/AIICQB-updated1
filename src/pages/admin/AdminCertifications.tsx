import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Certification } from '../../types';
import { AdminPagination } from '../../components/AdminPagination';
import {
  Award,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  X,
  Loader2,
  Power,
  DollarSign,
  AlertCircle,
} from 'lucide-react';

export const AdminCertifications: React.FC = () => {
  const [certifications, setCertifications] = useState<Certification[]>(() => {
    try {
      const c = localStorage.getItem('aicqb_admin_certifications');
      return c ? JSON.parse(c) : [];
    } catch (_) {
      return [];
    }
  });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('All');
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCert, setEditingCert] = useState<any>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // New/Edit Certification Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [domain, setDomain] = useState('AI & Machine Learning');
  const [level, setLevel] = useState('Professional Level');
  const [examFee, setExamFee] = useState<number | string>(4500);
  const [examFeeUSD, setExamFeeUSD] = useState<number | string>(79);
  const [duration, setDuration] = useState('90 Minutes');
  const [passingCriteria, setPassingCriteria] = useState<number | string>(70);
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'Active' | 'Inactive' | 'Published'>('Active');
  const [eligibility, setEligibility] = useState('');
  const [examPattern, setExamPattern] = useState('');
  const [creating, setCreating] = useState(false);

  const showFeedback = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback(null);
    }, 4500);
  };

  useEffect(() => {
    setCurrentPage(1);
    loadCertifications();
  }, [searchTerm, selectedDomain, selectedLevel, selectedStatus]);

  const loadCertifications = async () => {
    try {
      if (certifications.length === 0) setLoading(true);
      const params: any = {
        search: searchTerm,
      };
      if (selectedDomain && selectedDomain !== 'All') params.domain = selectedDomain;
      if (selectedLevel && selectedLevel !== 'All') params.level = selectedLevel;
      if (selectedStatus && selectedStatus !== 'All') params.status = selectedStatus;

      const res = await api.getCertifications(params);
      if (res.success && res.certifications) {
        setCertifications(res.certifications);
        try {
          localStorage.setItem('aicqb_admin_certifications', JSON.stringify(res.certifications));
        } catch (_) {}
      }
    } catch (err) {
      console.error('Failed to load certifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      // Optimistic update for instant feedback
      let nextStatus: 'Active' | 'Inactive' = 'Active';
      setCertifications((prev) =>
        prev.map((c) => {
          if (c.id === id || c.code === id) {
            nextStatus = c.status === 'Active' ? 'Inactive' : 'Active';
            return { ...c, status: nextStatus };
          }
          return c;
        })
      );

      const res = await api.toggleCertificationStatus(id);
      if (res.success) {
        showFeedback(res.message || `Status changed to ${nextStatus}!`);
        loadCertifications();
      } else {
        showFeedback(res.message || 'Failed to toggle status', 'error');
        loadCertifications();
      }
    } catch (err: any) {
      showFeedback(err.message || 'Failed to toggle status', 'error');
      loadCertifications();
    }
  };

  const handleDeleteCertification = async (id: string, certCode: string, certName: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete certification "${certName}" (${certCode})?`)) return;
    try {
      const res = await api.deleteCertification(id);
      if (res.success) {
        showFeedback(`Certification "${certCode}" deleted successfully.`);
        loadCertifications();
      }
    } catch (err: any) {
      showFeedback(err.message || 'Failed to delete certification', 'error');
    }
  };

  const handleOpenEdit = (cert: Certification) => {
    setEditingCert(cert);
    setName(cert.name || '');
    setCode(cert.code || '');
    setDomain(cert.domain || 'AI & Machine Learning');
    setLevel(cert.level || 'Professional Level');
    setExamFee(cert.examFee !== undefined ? cert.examFee : 4500);
    setExamFeeUSD(cert.examFeeUSD !== undefined ? cert.examFeeUSD : Math.round((cert.examFee || 4500) / 65) || 79);
    setDuration(cert.duration || '90 Minutes');
    setPassingCriteria(cert.passingCriteria !== undefined ? cert.passingCriteria : 70);
    setDescription(cert.description || '');
    setStatus(cert.status || 'Active');
    setEligibility(cert.eligibility || '');
    setExamPattern(cert.examPattern || '');
  };

  const handleUpdateCertification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCert) return;
    try {
      setCreating(true);
      const parsedFee = Number(examFee) || 0;
      const parsedUSD = Number(examFeeUSD) || Math.round(parsedFee / 65) || 79;
      const parsedPassing = Number(passingCriteria) || 70;

      const payload = {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        domain,
        level,
        examFee: parsedFee,
        examFeeUSD: parsedUSD,
        duration: duration.trim(),
        passingCriteria: parsedPassing,
        description: description.trim(),
        status: status as 'Active' | 'Inactive' | 'Published',
        eligibility: eligibility.trim(),
        examPattern: examPattern.trim(),
      };

      const res = await api.updateCertification(editingCert.id, payload);
      if (res.success) {
        // Immediate local state update so price and details update on screen
        setCertifications((prev) =>
          prev.map((c) =>
            c.id === editingCert.id || c.code === editingCert.code
              ? ({ ...c, ...payload } as Certification)
              : c
          )
        );
        try {
          const stored = localStorage.getItem('aicqb_admin_certifications');
          if (stored) {
            const parsed = JSON.parse(stored);
            const updated = parsed.map((c: any) =>
              c.id === editingCert.id || c.code === editingCert.code
                ? { ...c, ...payload }
                : c
            );
            localStorage.setItem('aicqb_admin_certifications', JSON.stringify(updated));
          }
        } catch (_) {}

        setEditingCert(null);
        showFeedback(`Certification "${payload.code}" updated successfully! Exam fee set to ₹${parsedFee.toLocaleString('en-IN')}`);
        await loadCertifications();
      } else {
        showFeedback(res.message || 'Failed to update certification', 'error');
      }
    } catch (err: any) {
      showFeedback(err.message || 'Failed to update certification', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleCreateCertification = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreating(true);
      const parsedFee = Number(examFee) || 0;
      const parsedUSD = Number(examFeeUSD) || Math.round(parsedFee / 65) || 79;
      const parsedPassing = Number(passingCriteria) || 70;

      const payload = {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        domain,
        level,
        examFee: parsedFee,
        examFeeUSD: parsedUSD,
        duration: duration.trim(),
        passingCriteria: parsedPassing,
        description: description.trim(),
        status,
        eligibility: eligibility.trim(),
        examPattern: examPattern.trim(),
        learningObjectives: ['Core conceptual mastery', 'Practical applied assessment'],
        syllabus: [
          { title: 'Module 1: Principles & Fundamentals', hours: 10, topics: ['Overview', 'Architecture'] },
          { title: 'Module 2: Advanced Implementation', hours: 15, topics: ['Hands-on', 'Case Studies'] },
        ],
      };

      const res = await api.createCertification(payload);

      if (res.success) {
        setShowAddModal(false);
        // Reset form
        setName('');
        setCode('');
        setDescription('');
        setEligibility('');
        setExamPattern('');
        showFeedback(`New Certification "${payload.code}" published successfully!`);
        await loadCertifications();
      } else {
        showFeedback(res.message || 'Failed to create certification.', 'error');
      }
    } catch (err: any) {
      showFeedback(err.message || 'Failed to create certification.', 'error');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback Notification Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between shadow-sm animate-fadeIn ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}
        >
          <div className="flex items-center space-x-2.5 text-xs font-bold">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#10264B]">Certification Management</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Create and manage certification programs, active statuses, levels, and exam pricing.
          </p>
        </div>
        <button
          onClick={() => {
            setName('');
            setCode('');
            setDomain('AI & Machine Learning');
            setLevel('Professional Level');
            setExamFee(4500);
            setExamFeeUSD(79);
            setDuration('90 Minutes');
            setPassingCriteria(70);
            setDescription('');
            setStatus('Active');
            setEligibility('');
            setExamPattern('');
            setShowAddModal(true);
          }}
          className="px-4 py-2.5 bg-[#F47716] hover:bg-[#DC660E] text-white font-bold text-xs rounded-lg shadow-sm transition-all flex items-center space-x-1.5 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Certification</span>
        </button>
      </div>

      {/* Dynamic Filter Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-col sm:flex-row gap-3">
        <select
          value={selectedDomain}
          onChange={(e) => setSelectedDomain(e.target.value)}
          className="px-3 py-2 text-xs bg-slate-50 border border-gray-300 rounded-lg focus:outline-none text-gray-700 font-medium cursor-pointer"
        >
          <option value="All">All Domains</option>
          <option value="AI & Machine Learning">AI & Machine Learning</option>
          <option value="Data Science & Analytics">Data & Analytics</option>
          <option value="Software Testing & Quality Engineering">Software Testing</option>
          <option value="Cybersecurity">Cybersecurity</option>
          <option value="Cloud Computing">Cloud Computing</option>
          <option value="DevOps">DevOps</option>
          <option value="Business & Management">Business & Mgmt</option>
        </select>

        <select
          value={selectedLevel}
          onChange={(e) => setSelectedLevel(e.target.value)}
          className="px-3 py-2 text-xs bg-slate-50 border border-gray-300 rounded-lg focus:outline-none text-gray-700 font-medium cursor-pointer"
        >
          <option value="All">All Levels</option>
          <option value="Foundation Level">Foundation Level</option>
          <option value="Professional Level">Professional Level</option>
          <option value="Advance Level">Advance Level</option>
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-2 text-xs bg-slate-50 border border-gray-300 rounded-lg focus:outline-none text-gray-700 font-medium cursor-pointer"
        >
          <option value="All">Status: All</option>
          <option value="Active">Active Only</option>
          <option value="Inactive">Inactive Only</option>
        </select>

        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by code, title, domain..."
            className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#F47716]"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-gray-600 font-semibold uppercase tracking-wider text-[11px] border-b border-gray-200">
              <tr>
                <th className="py-3.5 px-6">Code</th>
                <th className="py-3.5 px-6">Certification Name</th>
                <th className="py-3.5 px-6">Domain</th>
                <th className="py-3.5 px-6">Level</th>
                <th className="py-3.5 px-6">Fee (INR)</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {certifications.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    <Award className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                    <p className="font-semibold text-sm">No Certification Programs Found</p>
                    <p className="text-[11px] mt-0.5">Click "Add Certification" to create a new program.</p>
                  </td>
                </tr>
              ) : (
                certifications
                  .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                  .map((cert) => (
                    <tr key={cert.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6 font-mono font-bold text-[#F47716]">{cert.code}</td>
                      <td className="py-4 px-6 font-bold text-[#10264B]">{cert.name}</td>
                      <td className="py-4 px-6 text-gray-600 font-medium">{cert.domain}</td>
                      <td className="py-4 px-6 text-gray-600">{cert.level}</td>
                      <td className="py-4 px-6 font-bold text-[#10264B]">
                        ₹{Number(cert.examFee || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-4 px-6">
                        {/* Interactive Active / Inactive Status Button */}
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(cert.id)}
                          className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer flex items-center space-x-1.5 shadow-xs ${
                            cert.status === 'Active'
                              ? 'bg-green-50 text-green-700 border border-green-300 hover:bg-green-100 hover:border-green-400'
                              : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200 hover:text-gray-800'
                          }`}
                          title={`Status is ${cert.status || 'Active'}. Click to toggle status.`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              cert.status === 'Active' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                            }`}
                          />
                          <span>{cert.status === 'Active' ? 'Active' : 'Inactive'}</span>
                        </button>
                      </td>
                      <td className="py-4 px-6 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(cert.id)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            cert.status === 'Active'
                              ? 'text-green-600 hover:bg-green-50 border border-green-200'
                              : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700'
                          }`}
                          title={cert.status === 'Active' ? 'Deactivate Program' : 'Activate Program'}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(cert)}
                          className="p-1.5 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors cursor-pointer"
                          title="Edit Certification Details"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCertification(cert.id, cert.code, cert.name)}
                          className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Delete Certification Program"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>

        <AdminPagination
          currentPage={currentPage}
          totalRecords={certifications.length}
          pageSize={pageSize}
          onPageChange={(page) => setCurrentPage(page)}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
          pageSizeOptions={[10, 25, 50, 100]}
        />
      </div>

      {/* Add Certification Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 space-y-4 shadow-2xl border border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm text-[#10264B] flex items-center space-x-2">
                <Award className="w-4 h-4 text-[#F47716]" />
                <span>Create New Certification Program</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCertification} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Certification Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. AICQB Certified DevOps Practitioner"
                    className="w-full p-2.5 bg-slate-50 border rounded focus:ring-1 focus:ring-[#F47716] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Program Code</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. AICQB-DO-501"
                    className="w-full p-2.5 bg-slate-50 border rounded focus:ring-1 focus:ring-[#F47716] focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Domain</label>
                  <select
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border rounded focus:ring-1 focus:ring-[#F47716] focus:outline-none"
                  >
                    <option>AI & Machine Learning</option>
                    <option>Data Science & Analytics</option>
                    <option>Software Testing & Quality Engineering</option>
                    <option>Cybersecurity</option>
                    <option>Cloud Computing</option>
                    <option>DevOps</option>
                    <option>Business & Management</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Level</label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border rounded focus:ring-1 focus:ring-[#F47716] focus:outline-none"
                  >
                    <option>Foundation Level</option>
                    <option>Professional Level</option>
                    <option>Advance Level</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'Active' | 'Inactive')}
                    className="w-full p-2.5 bg-slate-50 border rounded focus:ring-1 focus:ring-[#F47716] focus:outline-none font-semibold text-emerald-700"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Exam Fee (₹ INR)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={examFee}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setExamFee(val);
                      setExamFeeUSD(Math.round(val / 65) || 79);
                    }}
                    className="w-full p-2.5 bg-slate-50 border rounded focus:ring-1 focus:ring-[#F47716] focus:outline-none font-bold text-[#10264B]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Exam Fee ($ USD)</label>
                  <input
                    type="number"
                    min={0}
                    value={examFeeUSD}
                    onChange={(e) => setExamFeeUSD(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border rounded focus:ring-1 focus:ring-[#F47716] focus:outline-none font-bold text-[#10264B]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Exam Duration</label>
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="e.g. 90 Minutes"
                    className="w-full p-2.5 bg-slate-50 border rounded"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Passing Threshold (%)</label>
                  <input
                    type="number"
                    min={40}
                    max={100}
                    value={passingCriteria}
                    onChange={(e) => setPassingCriteria(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Program Description</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Overview of syllabus, practical goals and industry competencies..."
                  className="w-full p-2.5 bg-slate-50 border rounded"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Eligibility Criteria</label>
                  <input
                    type="text"
                    value={eligibility}
                    onChange={(e) => setEligibility(e.target.value)}
                    placeholder="e.g. Fresh graduates, QA analysts, software developers..."
                    className="w-full p-2.5 bg-slate-50 border rounded"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Exam Pattern & Format</label>
                  <input
                    type="text"
                    value={examPattern}
                    onChange={(e) => setExamPattern(e.target.value)}
                    placeholder="e.g. Online proctored exam, 50 MCQ questions, 75 minutes."
                    className="w-full p-2.5 bg-slate-50 border rounded"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-3 border-t">
                <button
                  type="submit"
                  disabled={creating}
                  className="px-6 py-2.5 bg-[#F47716] hover:bg-[#DC660E] text-white font-bold rounded shadow transition-colors flex items-center space-x-1.5 cursor-pointer disabled:opacity-60"
                >
                  {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>{creating ? 'Publishing...' : 'Publish Certification'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Certification Modal */}
      {editingCert && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 space-y-4 shadow-2xl border border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm text-[#10264B] flex items-center space-x-2">
                <Edit2 className="w-4 h-4 text-blue-600" />
                <span>Edit Certification Program ({editingCert.code})</span>
              </h3>
              <button onClick={() => setEditingCert(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateCertification} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Certification Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border rounded focus:ring-1 focus:ring-[#F47716] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Program Code</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border rounded font-mono font-bold text-[#F47716]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Domain</label>
                  <select
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border rounded"
                  >
                    <option>AI & Machine Learning</option>
                    <option>Data Science & Analytics</option>
                    <option>Software Testing & Quality Engineering</option>
                    <option>Cybersecurity</option>
                    <option>Cloud Computing</option>
                    <option>DevOps</option>
                    <option>Business & Management</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Level</label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border rounded"
                  >
                    <option>Foundation Level</option>
                    <option>Professional Level</option>
                    <option>Advance Level</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Program Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'Active' | 'Inactive')}
                    className={`w-full p-2.5 bg-slate-50 border rounded font-bold ${
                      status === 'Active' ? 'text-green-700' : 'text-gray-600'
                    }`}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Price Editing Inputs (INR & USD) */}
              <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-900">
                  <DollarSign className="w-4 h-4 text-[#F47716]" />
                  <span>Certification Pricing Authority (Live DB)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Exam Fee (₹ INR) *</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={examFee}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setExamFee(val);
                        setExamFeeUSD(Math.round(val / 65) || 79);
                      }}
                      className="w-full p-2.5 bg-white border border-amber-300 rounded font-black text-sm text-[#10264B] focus:ring-2 focus:ring-[#F47716] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Exam Fee ($ USD)</label>
                    <input
                      type="number"
                      min={0}
                      value={examFeeUSD}
                      onChange={(e) => setExamFeeUSD(Number(e.target.value))}
                      className="w-full p-2.5 bg-white border border-amber-300 rounded font-black text-sm text-[#10264B] focus:ring-2 focus:ring-[#F47716] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Duration</label>
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border rounded"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Passing Threshold (%)</label>
                  <input
                    type="number"
                    min={40}
                    max={100}
                    value={passingCriteria}
                    onChange={(e) => setPassingCriteria(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Program Description</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border rounded"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Eligibility Criteria</label>
                  <input
                    type="text"
                    value={eligibility}
                    onChange={(e) => setEligibility(e.target.value)}
                    placeholder="e.g. Degree or 1+ year practical QA/coding experience"
                    className="w-full p-2.5 bg-slate-50 border rounded"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Exam Pattern & Format</label>
                  <input
                    type="text"
                    value={examPattern}
                    onChange={(e) => setExamPattern(e.target.value)}
                    placeholder="e.g. Online proctored exam, 60 MCQs, 90 minutes."
                    className="w-full p-2.5 bg-slate-50 border rounded"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-3 border-t">
                <button
                  type="submit"
                  disabled={creating}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded shadow transition-colors flex items-center space-x-1.5 cursor-pointer disabled:opacity-60"
                >
                  {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Edit2 className="w-3.5 h-3.5" />}
                  <span>{creating ? 'Saving Changes...' : 'Save Program Changes'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditingCert(null)}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
