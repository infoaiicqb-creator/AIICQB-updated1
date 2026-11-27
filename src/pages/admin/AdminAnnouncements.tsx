import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../services/api';
import { AdminPagination } from '../../components/AdminPagination';
import {
  Megaphone,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  X,
  Loader2,
  RefreshCw,
  Send,
  Users,
  Calendar,
} from 'lucide-react';

export const AdminAnnouncements: React.FC = () => {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [audienceFilter, setAudienceFilter] = useState('All');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '',
    audience: 'All Users',
    content: '',
    status: 'Published',
  });

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await api.getAdminAnnouncements();
      if (res && res.success && Array.isArray(res.announcements)) {
        setAnnouncements(res.announcements);
      }
    } catch (err) {
      console.error('Failed to load announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setForm({
      title: '',
      audience: 'All Users',
      content: '',
      status: 'Published',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (a: any) => {
    setEditingId(a.id);
    setForm({
      title: a.title || '',
      audience: a.audience || 'All Users',
      content: a.content || '',
      status: a.status || 'Published',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      showToast('Announcement title is required.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      if (editingId) {
        const res = await api.updateAdminAnnouncement(editingId, form);
        if (res && res.success) {
          showToast('Announcement updated successfully!');
          setIsModalOpen(false);
          await loadAnnouncements();
        } else {
          showToast(res?.message || 'Failed to update announcement.', 'error');
        }
      } else {
        const res = await api.createAdminAnnouncement(form);
        if (res && res.success) {
          showToast('Announcement created and broadcasted!');
          setIsModalOpen(false);
          await loadAnnouncements();
        } else {
          showToast(res?.message || 'Failed to create announcement.', 'error');
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Error saving announcement', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete announcement "${title}"?`)) return;
    try {
      const res = await api.deleteAdminAnnouncement(id);
      if (res && res.success) {
        showToast('Announcement deleted successfully!');
        setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      } else {
        showToast(res?.message || 'Failed to delete announcement', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error deleting announcement', 'error');
    }
  };

  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((a) => {
      const matchesSearch =
        !searchTerm.trim() ||
        (a.title && a.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (a.content && a.content.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesAudience = audienceFilter === 'All' || a.audience === audienceFilter;
      return matchesSearch && matchesAudience;
    });
  }, [announcements, searchTerm, audienceFilter]);

  const paginatedAnnouncements = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAnnouncements.slice(start, start + pageSize);
  }, [filteredAnnouncements, currentPage, pageSize]);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#10264B] flex items-center space-x-2">
            <Megaphone className="w-6 h-6 text-[#F47716]" />
            <span>Communication & Announcements</span>
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Broadcast platform updates, exam schedules, and policies to candidates and partners.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={loadAnnouncements}
            disabled={loading}
            className="p-2.5 bg-white border border-gray-300 hover:border-[#10264B] text-gray-600 rounded-xl hover:text-[#10264B] transition-all cursor-pointer shadow-xs"
            title="Refresh Announcements"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-[#F47716] hover:bg-[#DC660E] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Announcement</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs flex flex-col sm:flex-row gap-3">
        <select
          value={audienceFilter}
          onChange={(e) => {
            setAudienceFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="px-3 py-2 text-xs bg-slate-50 border border-gray-300 rounded-lg focus:outline-hidden text-gray-700 font-medium cursor-pointer"
        >
          <option value="All">All Audiences</option>
          <option value="All Users">All Users</option>
          <option value="Candidates">Candidates</option>
          <option value="Training Partners">Training Partners</option>
          <option value="Members">Members</option>
        </select>

        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search announcements..."
            className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-gray-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-[#F47716]"
          />
        </div>
      </div>

      {/* Table with Global Pagination */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-gray-600 font-semibold uppercase tracking-wider text-[11px] border-b border-gray-200">
              <tr>
                <th className="py-3.5 px-6">Title & Message</th>
                <th className="py-3.5 px-6">Audience</th>
                <th className="py-3.5 px-6">Scheduled / Sent</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#F47716] mb-2" />
                    <span>Loading announcements...</span>
                  </td>
                </tr>
              ) : paginatedAnnouncements.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400">
                    <Megaphone className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                    <p className="font-semibold text-sm">No Announcements Found</p>
                    <p className="text-[11px] mt-0.5">Click "Create Announcement" to broadcast a new notice.</p>
                  </td>
                </tr>
              ) : (
                paginatedAnnouncements.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6">
                      <span className="font-bold text-[#10264B] text-xs block">{a.title}</span>
                      {a.content && <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{a.content}</p>}
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        <Users className="w-3 h-3 mr-1" />
                        {a.audience || 'All Users'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-gray-600 font-mono text-[11px]">
                      {a.scheduledDate || (a.createdAt ? new Date(a.createdAt).toLocaleDateString() : 'Recent')}
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-200">
                        {a.status || 'Published'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => handleOpenEdit(a)}
                        className="p-1.5 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors cursor-pointer"
                        title="Edit Announcement"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(a.id, a.title)}
                        className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Delete Announcement"
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

        {/* Global AdminPagination */}
        <AdminPagination
          currentPage={currentPage}
          totalRecords={filteredAnnouncements.length}
          pageSize={pageSize}
          onPageChange={(page) => setCurrentPage(page)}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
          pageSizeOptions={[10, 25, 50, 100]}
        />
      </div>

      {/* Add / Edit Announcement Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-sm text-[#10264B] flex items-center space-x-2">
                <Megaphone className="w-4 h-4 text-[#F47716]" />
                <span>{editingId ? 'Edit Announcement' : 'Compose New Announcement'}</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-gray-700 block">Title <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. AIICQB November Certification Schedules Released"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-hidden focus:border-[#F47716]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700 block">Target Audience</label>
                  <select
                    value={form.audience}
                    onChange={(e) => setForm({ ...form, audience: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-hidden"
                  >
                    <option value="All Users">All Users</option>
                    <option value="Candidates">Candidates</option>
                    <option value="Training Partners">Training Partners</option>
                    <option value="Members">Members</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700 block">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-hidden"
                  >
                    <option value="Published">Published</option>
                    <option value="Draft">Draft</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700 block">Message Content</label>
                <textarea
                  rows={4}
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  placeholder="Enter detailed notice message..."
                  className="w-full p-3 border border-gray-300 rounded-xl focus:outline-hidden focus:border-[#F47716]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-xl font-bold text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-[#F47716] hover:bg-[#DC660E] disabled:opacity-50 text-white rounded-xl font-bold cursor-pointer transition-all flex items-center space-x-1.5"
                >
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>{editingId ? 'Update Notice' : 'Broadcast Now'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
