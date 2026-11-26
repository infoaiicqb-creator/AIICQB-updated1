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
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCert, setEditingCert] = useState<any>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // New/Edit Certification Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [domain, setDomain] = useState('AI & Machine Learning');
  const [level, setLevel] = useState('Professional Level');
  const [examFee, setExamFee] = useState(4500);
  const [duration, setDuration] = useState('90 Minutes');
  const [passingCriteria, setPassingCriteria] = useState(70);
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    setCurrentPage(1);
    loadCertifications();
  }, [searchTerm, selectedDomain]);

  const loadCertifications = async () => {
    try {
      if (certifications.length === 0) setLoading(true);
      const res = await api.getCertifications({
        search: searchTerm,
        domain: selectedDomain,
      });
      if (res.success) {
        setCertifications(res.certifications);
        try { localStorage.setItem('aicqb_admin_certifications', JSON.stringify(res.certifications)); } catch (_) {}
      }
    } catch (err) {
      console.error('Failed to load certifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await api.toggleCertificationStatus(id);
      loadCertifications();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle status');
    }
  };

  const handleDeleteCertification = async (id: string, certCode: string, certName: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete certification "${certName}" (${certCode})?`)) return;
    try {
      const res = await api.deleteCertification(id);
      if (res.success) {
        loadCertifications();
        alert('Certification deleted successfully.');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete certification');
    }
  };

  const handleOpenEdit = (cert: Certification) => {
    setEditingCert(cert);
    setName(cert.name);
    setCode(cert.code);
    setDomain(cert.domain);
    setLevel(cert.level);
    setExamFee(cert.examFee || 4500);
    setDuration(cert.duration || '90 Minutes');
    setPassingCriteria(cert.passingCriteria || 70);
    setDescription(cert.description || '');
  };

  const handleUpdateCertification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCert) return;
    try {
      setCreating(true);
      const res = await api.updateCertification(editingCert.id, {
        name,
        code,
        domain,
        level,
        examFee: Number(examFee),
        duration,
        passingCriteria: Number(passingCriteria),
        description,
      });
      if (res.success) {
        setEditingCert(null);
        loadCertifications();
        alert('Certification updated successfully!');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update certification');
    } finally {
      setCreating(false);
    }
  };

  const handleCreateCertification = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreating(true);
      const res = await api.createCertification({
        name,
        code,
        domain,
        level,
        examFee: Number(examFee),
        duration,
        passingCriteria: Number(passingCriteria),
        description,
        learningObjectives: ['Core conceptual mastery', 'Practical applied assessment'],
        syllabus: [
          { title: 'Module 1: Principles & Fundamentals', hours: 10, topics: ['Overview', 'Architecture'] },
          { title: 'Module 2: Advanced Implementation', hours: 15, topics: ['Hands-on', 'Case Studies'] },
        ],
      });

      if (res.success) {
        setShowAddModal(false);
        // Reset form
        setName('');
        setCode('');
        setDescription('');
        loadCertifications();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to create certification.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header matching Image 5 #2 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#10264B]">Certification Management</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Create and manage certification programs, domains, levels and syllabus.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-[#F47716] hover:bg-[#DC660E] text-white font-bold text-xs rounded-lg shadow-sm transition-all flex items-center space-x-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Certification</span>
        </button>
      </div>

      {/* Filter Bar matching Image 5 #2 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-col sm:flex-row gap-3">
        <select
          value={selectedDomain}
          onChange={(e) => setSelectedDomain(e.target.value)}
          className="px-3 py-2 text-xs bg-slate-50 border border-gray-300 rounded-lg focus:outline-none text-gray-700 font-medium"
        >
          <option value="All">All Domains</option>
          <option value="AI & Machine Learning">AI & Machine Learning</option>
          <option value="Data Science & Analytics">Data & Analytics</option>
          <option value="Software Testing & Quality Engineering">Software Testing</option>
          <option value="Cybersecurity">Cybersecurity</option>
          <option value="Cloud Computing">Cloud Computing</option>
          <option value="Business & Management">Business & Mgmt</option>
        </select>

        <select className="px-3 py-2 text-xs bg-slate-50 border border-gray-300 rounded-lg focus:outline-none text-gray-700 font-medium">
          <option>All Levels</option>
          <option>Foundation</option>
          <option>Professional</option>
          <option>Advanced</option>
        </select>

        <select className="px-3 py-2 text-xs bg-slate-50 border border-gray-300 rounded-lg focus:outline-none text-gray-700 font-medium">
          <option>Status: All</option>
          <option>Active</option>
          <option>Inactive</option>
        </select>

        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search certification..."
            className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#F47716]"
          />
        </div>
      </div>

      {/* Table matching Image 5 #2 */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-gray-600 font-semibold uppercase tracking-wider text-[11px] border-b border-gray-200">
              <tr>
                <th className="py-3.5 px-6">Code</th>
                <th className="py-3.5 px-6">Certification Name</th>
                <th className="py-3.5 px-6">Domain</th>
                <th className="py-3.5 px-6">Level</th>
                <th className="py-3.5 px-6">Fee</th>
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
                  <td className="py-4 px-6 font-bold text-[#10264B]">₹{cert.examFee.toLocaleString('en-IN')}</td>
                  <td className="py-4 px-6">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        cert.status === 'Active'
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {cert.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right space-x-1.5 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleStatus(cert.id)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        cert.status === 'Active'
                          ? 'text-green-600 hover:bg-green-50'
                          : 'text-gray-400 hover:bg-gray-100'
                      }`}
                      title={cert.status === 'Active' ? 'Deactivate Certification' : 'Activate Certification'}
                    >
                      <Power className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleOpenEdit(cert)}
                      className="p-1.5 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors"
                      title="Edit Certification Details"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCertification(cert.id, cert.code, cert.name)}
                      className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                      title="Delete Certification Program"
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
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
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
                  <label className="block font-semibold text-gray-700 mb-1">Exam Fee (₹)</label>
                  <input
                    type="number"
                    required
                    value={examFee}
                    onChange={(e) => setExamFee(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border rounded focus:ring-1 focus:ring-[#F47716] focus:outline-none"
                  />
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

              <div className="flex items-center space-x-3 pt-3 border-t">
                <button
                  type="submit"
                  disabled={creating}
                  className="px-6 py-2.5 bg-[#F47716] hover:bg-[#DC660E] text-white font-bold rounded shadow transition-colors flex items-center space-x-1.5"
                >
                  {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>Publish Certification</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded"
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
              <button onClick={() => setEditingCert(null)} className="text-gray-400 hover:text-gray-600">
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
                    className="w-full p-2.5 bg-slate-50 border rounded font-mono"
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
                  <label className="block font-semibold text-gray-700 mb-1">Exam Fee (₹)</label>
                  <input
                    type="number"
                    required
                    value={examFee}
                    onChange={(e) => setExamFee(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border rounded"
                  />
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

              <div className="flex items-center space-x-3 pt-3 border-t">
                <button
                  type="submit"
                  disabled={creating}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded shadow transition-colors flex items-center space-x-1.5"
                >
                  {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Edit2 className="w-3.5 h-3.5" />}
                  <span>Save Program Changes</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditingCert(null)}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded"
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

