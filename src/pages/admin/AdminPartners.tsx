import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { AdminPagination } from '../../components/AdminPagination';
import {
  Building2,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  Eye,
  X,
  Globe,
  Mail,
  Phone,
  MapPin,
  AlertTriangle,
  Loader2,
  RefreshCw,
  BookOpen,
  Filter,
} from 'lucide-react';

interface TrainingPartner {
  id: string;
  partnerId: string;
  name: string;
  location: string;
  country: string;
  programsCount: number;
  status: 'Active' | 'Pending' | 'Inactive';
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const AdminPartners: React.FC = () => {
  const [partners, setPartners] = useState<TrainingPartner[]>(() => {
    try {
      const c = localStorage.getItem('aicqb_admin_partners');
      return c ? JSON.parse(c) : [];
    } catch (_) {
      return [];
    }
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [countryFilter, setCountryFilter] = useState('All');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals state
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<TrainingPartner | null>(null);
  const [viewingPartner, setViewingPartner] = useState<TrainingPartner | null>(null);

  // Toast notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    partnerId: '',
    name: '',
    location: '',
    country: 'India',
    programsCount: 5,
    status: 'Active' as 'Active' | 'Pending' | 'Inactive',
    contactPerson: '',
    contactEmail: '',
    contactPhone: '',
    website: '',
  });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchPartners = async () => {
    try {
      if (partners.length === 0) setLoading(true);
      const res = await api.getAdminPartners();
      if (res.success && Array.isArray(res.partners)) {
        setPartners(res.partners);
        try { localStorage.setItem('aicqb_admin_partners', JSON.stringify(res.partners)); } catch (_) { }
      }
    } catch (err) {
      console.error('Failed to load training partners:', err);
      showToast('Failed to load training partners from server', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  const openAddModal = () => {
    setEditingPartner(null);
    const nextNumber = partners.length + 1001;
    setFormData({
      partnerId: `TP${nextNumber}`,
      name: '',
      location: 'Pune, India',
      country: 'India',
      programsCount: 5,
      status: 'Active',
      contactPerson: '',
      contactEmail: '',
      contactPhone: '',
      website: '',
    });
    setIsAddEditOpen(true);
  };

  const openEditModal = (partner: TrainingPartner) => {
    setEditingPartner(partner);
    setFormData({
      partnerId: partner.partnerId || '',
      name: partner.name || '',
      location: partner.location || '',
      country: partner.country || 'India',
      programsCount: partner.programsCount || 5,
      status: partner.status || 'Active',
      contactPerson: partner.contactPerson || '',
      contactEmail: partner.contactEmail || '',
      contactPhone: partner.contactPhone || '',
      website: partner.website || '',
    });
    setIsAddEditOpen(true);
  };

  const handleSavePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Please provide a partner name', 'error');
      return;
    }

    try {
      setSaving(true);
      if (editingPartner) {
        // UPDATE
        const res = await api.updateAdminPartner(editingPartner.id, formData);
        if (res.success) {
          showToast(`Partner "${formData.name}" updated successfully!`);
          setIsAddEditOpen(false);
          await fetchPartners();
        } else {
          showToast(res.message || 'Failed to update partner', 'error');
        }
      } else {
        // CREATE
        const res = await api.addAdminPartner(formData);
        if (res.success) {
          showToast(`Partner "${formData.name}" registered successfully!`);
          setIsAddEditOpen(false);
          await fetchPartners();
        } else {
          showToast(res.message || 'Failed to add partner', 'error');
        }
      }
    } catch (err: any) {
      console.error('Error saving partner:', err);
      showToast(err.message || 'An error occurred while saving partner', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePartner = async (partner: TrainingPartner) => {
    // Instant deletion without confirmation popup (optimistic UI + toast)
    setPartners((prev) => prev.filter((p) => p.id !== partner.id && p.partnerId !== partner.partnerId));
    showToast(`Partner "${partner.name}" deleted successfully.`);

    try {
      const res = await api.deleteAdminPartner(partner.id);
      if (!res.success) {
        showToast(res.message || 'Failed to delete partner', 'error');
        await fetchPartners();
      }
    } catch (err: any) {
      console.error('Error deleting partner:', err);
      showToast(err.message || 'An error occurred while deleting partner', 'error');
      await fetchPartners();
    }
  };

  const handleQuickToggleStatus = async (partner: TrainingPartner) => {
    const newStatus = partner.status === 'Active' ? 'Pending' : 'Active';
    try {
      const res = await api.updateAdminPartner(partner.id, { status: newStatus });
      if (res.success) {
        showToast(`Status changed to ${newStatus} for ${partner.name}`);
        setPartners((prev) =>
          prev.map((p) => (p.id === partner.id ? { ...p, status: newStatus } : p))
        );
      }
    } catch (err) {
      showToast('Failed to update status', 'error');
    }
  };

  // Extract unique countries
  const countries = ['All', ...Array.from(new Set(partners.map((p) => p.country || 'India')))];

  // Filtered partners
  const filteredPartners = partners.filter((p) => {
    const matchesSearch =
      searchQuery === '' ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.partnerId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.contactEmail && p.contactEmail.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    const matchesCountry = countryFilter === 'All' || p.country === countryFilter;

    return matchesSearch && matchesStatus && matchesCountry;
  });

  const totalPartners = partners.length;
  const activePartners = partners.filter((p) => p.status === 'Active').length;
  const pendingPartners = partners.filter((p) => p.status === 'Pending').length;
  const totalPrograms = partners.reduce((sum, p) => sum + (Number(p.programsCount) || 0), 0);

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
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-[#10264B]">
              Training Partner Management
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#10264B]/10 text-[#10264B]">
              Admin Panel
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage authorized training, curriculum institutions, and global testing partners.
          </p>
        </div>

        <div className="flex items-center space-x-2.5 self-start sm:self-auto">
          <button
            onClick={fetchPartners}
            disabled={loading}
            className="p-2.5 bg-white border border-gray-300 hover:border-[#10264B] text-gray-600 rounded-xl hover:text-[#10264B] transition-all cursor-pointer shadow-xs"
            title="Refresh Partners"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={openAddModal}
            className="px-4 py-2.5 bg-[#F47716] hover:bg-[#DC660E] text-white font-extrabold text-xs rounded-xl shadow-md hover:shadow-orange-500/25 transition-all flex items-center space-x-2 cursor-pointer border border-orange-400"
          >
            <Plus className="w-4 h-4" />
            <span>Add Training Partner</span>
          </button>
        </div>
      </div>

      {/* 4 Overview Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#10264B] flex items-center justify-center flex-shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-[#10264B] font-mono leading-tight">
              {totalPartners}
            </div>
            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-tight mt-0.5">
              Total Partners
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-700 font-mono leading-tight">
              {activePartners}
            </div>
            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-tight mt-0.5">
              Active Authorized
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-amber-700 font-mono leading-tight">
              {pendingPartners}
            </div>
            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-tight mt-0.5">
              Pending Review
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-orange-50 text-[#F47716] flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-[#F47716] font-mono leading-tight">
              {totalPrograms}
            </div>
            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-tight mt-0.5">
              Curriculum Programs
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm flex flex-col sm:flex-row gap-3 text-xs">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-gray-300 rounded-xl focus:outline-none text-gray-700 font-bold cursor-pointer"
          >
            <option value="All">Status: All</option>
            <option value="Active">Active</option>
            <option value="Pending">Pending</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        <select
          value={countryFilter}
          onChange={(e) => setCountryFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-gray-300 rounded-xl focus:outline-none text-gray-700 font-bold cursor-pointer"
        >
          {countries.map((c) => (
            <option key={c} value={c}>
              Country: {c}
            </option>
          ))}
        </select>

        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search partner name, ID, location, or contact..."
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#F47716] font-medium"
          />
        </div>

        {(searchQuery || statusFilter !== 'All' || countryFilter !== 'All') && (
          <button
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('All');
              setCountryFilter('All');
            }}
            className="px-3.5 py-2 text-xs font-bold text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Main Partners Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#F47716] mx-auto" />
            <p className="text-xs text-gray-500 font-medium">Loading training partners...</p>
          </div>
        ) : filteredPartners.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Building2 className="w-12 h-12 text-gray-300 mx-auto" />
            <h4 className="text-sm font-bold text-gray-700">No training partners found</h4>
            <p className="text-xs text-gray-500">
              Try adjusting your search criteria or add a new training partner.
            </p>
            <button
              onClick={openAddModal}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-[#F47716] hover:bg-[#DC660E] text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Partner Now</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-gray-600 font-semibold uppercase tracking-wider text-[11px] border-b border-gray-200">
                <tr>
                  <th className="py-3.5 px-6">Partner ID</th>
                  <th className="py-3.5 px-6">Partner Details</th>
                  <th className="py-3.5 px-6">Location</th>
                  <th className="py-3.5 px-6">Programs</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPartners
                  .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                  .map((p) => (
                  <tr key={p.id || p.partnerId} className="hover:bg-slate-50/80 transition-colors">
                    {/* Partner ID */}
                    <td className="py-4 px-6 font-mono font-bold text-[#F47716]">
                      {p.partnerId}
                    </td>

                    {/* Name & Contact */}
                    <td className="py-4 px-6">
                      <div className="font-bold text-[#10264B] text-[13px]">{p.name}</div>
                      {p.contactEmail && (
                        <div className="text-[11px] text-gray-500 flex items-center space-x-1.5 mt-0.5">
                          <Mail className="w-3 h-3 text-gray-400" />
                          <span>{p.contactEmail}</span>
                        </div>
                      )}
                    </td>

                    {/* Location */}
                    <td className="py-4 px-6">
                      <div className="text-gray-700 font-medium flex items-center space-x-1.5">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span>{p.location}</span>
                      </div>
                      <span className="text-[10px] text-gray-400 ml-5 font-medium">{p.country}</span>
                    </td>

                    {/* Programs Count */}
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-slate-100 rounded-lg font-mono font-bold text-[#10264B]">
                        <BookOpen className="w-3 h-3 text-[#F47716]" />
                        <span>{p.programsCount || 0} Programs</span>
                      </span>
                    </td>

                    {/* Status with Quick Toggle */}
                    <td className="py-4 px-6">
                      <button
                        onClick={() => handleQuickToggleStatus(p)}
                        className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${p.status === 'Active'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          : p.status === 'Pending'
                            ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                            : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                          }`}
                        title="Click to toggle status"
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${p.status === 'Active' ? 'bg-emerald-500' : 'bg-amber-500'
                            }`}
                        />
                        <span>{p.status}</span>
                      </button>
                    </td>

                    {/* Actions: View, Edit, Delete */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        {/* View */}
                        <button
                          onClick={() => setViewingPartner(p)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-[#10264B] hover:bg-slate-100 transition-colors cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-1.5 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors cursor-pointer"
                          title="Edit Partner"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDeletePartner(p)}
                          className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Delete Partner"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <AdminPagination
          currentPage={currentPage}
          totalRecords={filteredPartners.length}
          pageSize={pageSize}
          onPageChange={(page) => setCurrentPage(page)}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
          pageSizeOptions={[10, 25, 50, 100]}
        />
      </div>

      {/* ======================================================== */}
      {/* ADD / EDIT TRAINING PARTNER MODAL DIALOG                 */}
      {/* ======================================================== */}
      {isAddEditOpen && (
        <div className="fixed inset-0 z-[10000] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden transform animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-[#10264B] px-6 py-5 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-[#F47716]/20 border border-[#F47716]/40 flex items-center justify-center text-[#F47716]">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white leading-tight">
                    {editingPartner ? 'Edit Training Partner' : 'Onboard New Training Partner'}
                  </h3>
                  <p className="text-xs text-slate-300">
                    {editingPartner ? `Updating ${editingPartner.partnerId}` : 'Register an authorized learning institution'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddEditOpen(false)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSavePartner} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Partner ID */}
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Partner ID *</label>
                  <input
                    type="text"
                    required
                    value={formData.partnerId}
                    onChange={(e) => setFormData({ ...formData, partnerId: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-300 rounded-xl font-mono font-bold focus:outline-none focus:ring-1 focus:ring-[#F47716]"
                    placeholder="e.g. TP1005"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Accreditation Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-300 rounded-xl font-bold focus:outline-none focus:ring-1 focus:ring-[#F47716] cursor-pointer"
                  >
                    <option value="Active">Active (Accredited)</option>
                    <option value="Pending">Pending (Under Review)</option>
                    <option value="Inactive">Inactive / Suspended</option>
                  </select>
                </div>
              </div>

              {/* Partner Name */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Institution / Partner Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-300 rounded-xl font-bold focus:outline-none focus:ring-1 focus:ring-[#F47716]"
                  placeholder="e.g. Cambridge Tech Academy"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Location */}
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Location / City *</label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#F47716]"
                    placeholder="e.g. Pune, India"
                  />
                </div>

                {/* Country */}
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Country</label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#F47716]"
                    placeholder="e.g. India, Singapore, USA"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Programs Count */}
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Offered Curriculum Programs
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={formData.programsCount}
                    onChange={(e) => setFormData({ ...formData, programsCount: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-300 rounded-xl font-bold focus:outline-none focus:ring-1 focus:ring-[#F47716]"
                  />
                </div>

                {/* Contact Person */}
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Principal / Contact Person</label>
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#F47716]"
                    placeholder="e.g. Dr. Ramesh Sharma"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Email */}
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Contact Email</label>
                  <input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#F47716]"
                    placeholder="partner@academy.edu"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#F47716]"
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>

              {/* Website URL */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">Official Website URL</label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#F47716]"
                  placeholder="https://www.academy.edu"
                />
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-gray-200 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddEditOpen(false)}
                  disabled={saving}
                  className="px-4 py-2.5 rounded-xl border border-gray-300 hover:bg-gray-100 font-bold text-gray-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-[#F47716] hover:bg-[#DC660E] text-white font-extrabold shadow-md hover:shadow-orange-500/25 transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Partner...</span>
                    </>
                  ) : (
                    <span>{editingPartner ? 'Update Partner' : 'Register Partner'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW DETAILS MODAL                                      */}
      {/* ======================================================== */}
      {viewingPartner && (
        <div className="fixed inset-0 z-[10000] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden transform animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-[#10264B] p-6 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-[#F47716]">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <span className="font-mono text-xs font-bold text-[#F47716] bg-orange-950/50 px-2 py-0.5 rounded border border-orange-500/30">
                    {viewingPartner.partnerId}
                  </span>
                  <h3 className="text-base font-black text-white leading-tight mt-1">
                    {viewingPartner.name}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setViewingPartner(null)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Details Content */}
            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                    Status
                  </span>
                  <div className="mt-1 font-bold text-gray-800 flex items-center space-x-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${viewingPartner.status === 'Active' ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                    />
                    <span>{viewingPartner.status}</span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                    Location
                  </span>
                  <p className="mt-1 font-bold text-gray-800">{viewingPartner.location}</p>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                    Country
                  </span>
                  <p className="mt-1 font-bold text-gray-800">{viewingPartner.country}</p>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                    Accredited Programs
                  </span>
                  <p className="mt-1 font-bold text-[#F47716] font-mono">
                    {viewingPartner.programsCount} Programs
                  </p>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-2 border border-slate-100 rounded-2xl p-4">
                <h5 className="font-bold text-gray-700 uppercase text-[11px] tracking-wider">
                  Contact Information
                </h5>
                <div className="space-y-1.5 text-gray-600">
                  {viewingPartner.contactPerson && (
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-gray-800 w-24">Contact Person:</span>
                      <span>{viewingPartner.contactPerson}</span>
                    </div>
                  )}
                  {viewingPartner.contactEmail && (
                    <div className="flex items-center space-x-2">
                      <Mail className="w-3.5 h-3.5 text-gray-400" />
                      <a
                        href={`mailto:${viewingPartner.contactEmail}`}
                        className="text-[#F47716] hover:underline"
                      >
                        {viewingPartner.contactEmail}
                      </a>
                    </div>
                  )}
                  {viewingPartner.contactPhone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      <span>{viewingPartner.contactPhone}</span>
                    </div>
                  )}
                  {viewingPartner.website && (
                    <div className="flex items-center space-x-2">
                      <Globe className="w-3.5 h-3.5 text-gray-400" />
                      <a
                        href={viewingPartner.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {viewingPartner.website}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-between">
                <button
                  onClick={() => {
                    const toEdit = viewingPartner;
                    setViewingPartner(null);
                    openEditModal(toEdit);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center space-x-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Partner</span>
                </button>
                <button
                  onClick={() => setViewingPartner(null)}
                  className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
