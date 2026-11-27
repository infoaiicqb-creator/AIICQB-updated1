import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Certification, CertificationDomain, CertificationLevel, CertificationAuditLog } from '../../types';
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
  Archive,
  RotateCcw,
  Globe,
  Layers,
  History,
  Lock,
  ArrowUpDown,
  BookOpen,
  Filter,
  Sparkles,
} from 'lucide-react';

export const AdminCertifications: React.FC = () => {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'certifications' | 'domains' | 'levels' | 'archived' | 'audit'>('certifications');

  // Main Data States
  const [certifications, setCertifications] = useState<Certification[]>(() => {
    try {
      const c = localStorage.getItem('aicqb_admin_certifications');
      return c ? JSON.parse(c) : [];
    } catch (_) {
      return [];
    }
  });
  const [archivedCertifications, setArchivedCertifications] = useState<Certification[]>([]);
  const [domains, setDomains] = useState<CertificationDomain[]>([]);
  const [levels, setLevels] = useState<CertificationLevel[]>([]);
  const [auditLogs, setAuditLogs] = useState<CertificationAuditLog[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    archived: 0,
    totalDomains: 0,
    totalLevels: 0,
    usdExchangeRate: 85,
  });

  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Filters & Sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('All');
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [sortBy, setSortBy] = useState<'name' | 'code' | 'fee' | 'createdAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCert, setEditingCert] = useState<any>(null);
  const [showDomainModal, setShowDomainModal] = useState(false);
  const [editingDomain, setEditingDomain] = useState<CertificationDomain | null>(null);
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [editingLevel, setEditingLevel] = useState<CertificationLevel | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<Certification | null>(null);

  // New/Edit Certification Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [domain, setDomain] = useState('');
  const [domainId, setDomainId] = useState('');
  const [level, setLevel] = useState('');
  const [levelId, setLevelId] = useState('');
  const [examFee, setExamFee] = useState<number | string>(4500);
  const [examFeeUSD, setExamFeeUSD] = useState<number | string>(52.94);
  const [exchangeRate, setExchangeRate] = useState<number>(85);
  const [duration, setDuration] = useState('90');
  const [durationUnit, setDurationUnit] = useState('Minutes');
  const [passingCriteria, setPassingCriteria] = useState<number | string>(70);
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'Active' | 'Inactive' | 'Published' | 'Draft'>('Active');
  const [eligibility, setEligibility] = useState('');
  const [examPattern, setExamPattern] = useState('');
  const [generatingCode, setGeneratingCode] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Domain Form State
  const [domainName, setDomainName] = useState('');
  const [domainCodePrefix, setDomainCodePrefix] = useState('');
  const [domainDescription, setDomainDescription] = useState('');
  const [domainStatus, setDomainStatus] = useState<'Active' | 'Inactive'>('Active');

  // Level Form State
  const [levelName, setLevelName] = useState('');
  const [levelCode, setLevelCode] = useState('');
  const [levelDefaultFee, setLevelDefaultFee] = useState<number | string>(4500);
  const [levelDescription, setLevelDescription] = useState('');
  const [levelStatus, setLevelStatus] = useState<'Active' | 'Inactive'>('Active');

  const showFeedback = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback(null);
    }, 4500);
  };

  // Initial Load & Global Event Listener for Instant Real-Time Sync
  useEffect(() => {
    loadDomains();
    loadLevels();

    const handleGlobalSync = (e: any) => {
      if (e.detail) {
        setCertifications((prev) =>
          prev.map((c) => (c.id === e.detail.id || c.code === e.detail.code ? { ...c, ...e.detail } : c))
        );
      }
    };
    window.addEventListener('aicqb_certifications_updated', handleGlobalSync);
    return () => {
      window.removeEventListener('aicqb_certifications_updated', handleGlobalSync);
    };
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    if (activeTab === 'certifications') {
      loadCertifications();
    } else if (activeTab === 'archived') {
      loadArchivedCertifications();
    } else if (activeTab === 'audit') {
      loadAuditLogs();
    }
  }, [searchTerm, selectedDomain, selectedLevel, selectedStatus, sortBy, sortOrder, activeTab]);

  // Load Certifications
  const loadCertifications = async () => {
    try {
      if (certifications.length === 0) setLoading(true);
      const params: any = {
        search: searchTerm,
        sortBy,
        sortOrder,
      };
      if (selectedDomain && selectedDomain !== 'All') params.domain = selectedDomain;
      if (selectedLevel && selectedLevel !== 'All') params.level = selectedLevel;
      if (selectedStatus && selectedStatus !== 'All') params.status = selectedStatus;

      const res = await api.getCertifications(params);
      if (res.success && res.certifications) {
        setCertifications(res.certifications);
        if (res.stats) {
          setStats(res.stats);
          if (res.stats.usdExchangeRate) setExchangeRate(res.stats.usdExchangeRate);
        }
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

  // Load Archived Certifications
  const loadArchivedCertifications = async () => {
    try {
      setLoading(true);
      const res = await api.getCertifications({ status: 'Archived', search: searchTerm });
      if (res.success && res.certifications) {
        setArchivedCertifications(res.certifications);
      }
    } catch (err) {
      console.error('Failed to load archived certifications:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load Domains
  const loadDomains = async () => {
    try {
      const res = await api.getCertificationDomains();
      if (res.success && res.domains) {
        setDomains(res.domains);
        if (!domain && res.domains.length > 0) {
          setDomain(res.domains[0].name);
          setDomainId(res.domains[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load domains:', err);
    }
  };

  // Load Levels
  const loadLevels = async () => {
    try {
      const res = await api.getCertificationLevels();
      if (res.success && res.levels) {
        setLevels(res.levels);
        if (!level && res.levels.length > 0) {
          setLevel(res.levels[0].name);
          setLevelId(res.levels[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load levels:', err);
    }
  };

  // Load Audit Logs
  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      const res = await api.getCertificationAuditLogs();
      if (res.success && res.logs) {
        setAuditLogs(res.logs);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  // Auto Generate Code when Domain Changes in Add Modal
  const handleDomainChange = async (newDomainName: string) => {
    setDomain(newDomainName);
    const selected = domains.find((d) => d.name === newDomainName);
    if (selected) {
      setDomainId(selected.id);
      fetchAutoGeneratedCode(selected.name, selected.codePrefix);
    } else {
      fetchAutoGeneratedCode(newDomainName);
    }
  };

  const handleLevelChange = (newLevelName: string) => {
    setLevel(newLevelName);
    const foundLevel = levels.find((l) => l.name === newLevelName);
    if (foundLevel) {
      setLevelId(foundLevel.id);
      // Auto-populate default level fee
      if (foundLevel.defaultExamFeeINR) {
        const fee = Number(foundLevel.defaultExamFeeINR);
        setExamFee(fee);
        const rate = exchangeRate || 85;
        setExamFeeUSD(Math.round((fee / rate) * 100) / 100);
      }
    }
  };

  const fetchAutoGeneratedCode = async (domainNameVal: string, prefixVal?: string) => {
    try {
      setGeneratingCode(true);
      const res = await api.generateCertificationCode({
        domain: domainNameVal,
        domainPrefix: prefixVal,
      });
      if (res.success && res.code) {
        setCode(res.code);
      }
    } catch (err) {
      console.error('Failed to generate code:', err);
    } finally {
      setGeneratingCode(false);
    }
  };

  // Calculation for USD Exam Fee
  const handleINRChange = (val: number | string) => {
    setExamFee(val);
    const inr = Number(val) || 0;
    const rate = exchangeRate || 85;
    const calculated = Math.round((inr / rate) * 100) / 100;
    setExamFeeUSD(calculated);
  };

  // Toggle Status
  const handleToggleStatus = async (id: string) => {
    try {
      let nextStatus: 'Active' | 'Inactive' = 'Active';
      let updatedCert: any = null;

      // 1. INSTANT OPTIMISTIC STATE UPDATE (0ms) - table row changes immediately
      setCertifications((prev) =>
        prev.map((c) => {
          if (c.id === id || c.code === id) {
            nextStatus = c.status === 'Active' ? 'Inactive' : 'Active';
            updatedCert = { ...c, status: nextStatus };
            return updatedCert;
          }
          return c;
        })
      );

      // 2. Instant Stats Update
      setStats((prev) => ({
        ...prev,
        active: nextStatus === 'Active' ? prev.active + 1 : Math.max(0, prev.active - 1),
        inactive: nextStatus === 'Inactive' ? prev.inactive + 1 : Math.max(0, prev.inactive - 1),
      }));

      // 3. Instant Local Storage Update
      try {
        const current = JSON.parse(localStorage.getItem('aicqb_admin_certifications') || '[]');
        const updatedCache = current.map((c: any) =>
          c.id === id || c.code === id ? { ...c, status: nextStatus } : c
        );
        localStorage.setItem('aicqb_admin_certifications', JSON.stringify(updatedCache));
      } catch (_) {}

      showFeedback(`Status changed to ${nextStatus}!`);

      // 4. Background Sync with Server
      const res = await api.toggleCertificationStatus(id);
      if (res.success && res.certification) {
        window.dispatchEvent(new CustomEvent('aicqb_certifications_updated', { detail: res.certification }));
      }
    } catch (err: any) {
      showFeedback(err.message || 'Failed to toggle status', 'error');
      loadCertifications();
    }
  };

  // Archive Certification (Soft Delete)
  const handleArchiveCertification = async () => {
    if (!archiveTarget) return;
    const target = archiveTarget;
    try {
      setSubmitting(true);

      // 1. INSTANT STATE UPDATE (0ms) - removed from active list, added to archived list
      setCertifications((prev) => prev.filter((c) => c.id !== target.id && c.code !== target.code));
      setArchivedCertifications((prev) => [{ ...target, isDeleted: true, status: 'Archived' as any }, ...prev]);
      setStats((prev) => ({
        ...prev,
        total: Math.max(0, prev.total - 1),
        archived: prev.archived + 1,
        active: target.status === 'Active' ? Math.max(0, prev.active - 1) : prev.active,
        inactive: target.status === 'Inactive' ? Math.max(0, prev.inactive - 1) : prev.inactive,
      }));

      try {
        const current = JSON.parse(localStorage.getItem('aicqb_admin_certifications') || '[]');
        localStorage.setItem(
          'aicqb_admin_certifications',
          JSON.stringify(current.filter((c: any) => c.id !== target.id && c.code !== target.code))
        );
      } catch (_) {}

      setArchiveTarget(null);
      showFeedback(`Certification "${target.code}" moved to Archived.`);

      const res = await api.archiveCertification(target.id);
      if (!res.success) {
        showFeedback(res.message || 'Failed to archive certification', 'error');
        loadCertifications();
      }
    } catch (err: any) {
      showFeedback(err.message || 'Failed to archive certification', 'error');
      loadCertifications();
    } finally {
      setSubmitting(false);
    }
  };

  // Restore Archived Certification
  const handleRestoreCertification = async (id: string, certCode: string) => {
    try {
      const target = archivedCertifications.find((c) => c.id === id || c.code === certCode);
      const restored: Certification = target ? ({ ...target, isDeleted: false, status: 'Active' as any } as any) : ({} as any);

      // 1. INSTANT STATE UPDATE (0ms)
      setArchivedCertifications((prev) => prev.filter((c) => c.id !== id && c.code !== certCode));
      if (target) {
        setCertifications((prev) => [restored, ...prev]);
        setStats((prev) => ({
          ...prev,
          total: prev.total + 1,
          archived: Math.max(0, prev.archived - 1),
          active: prev.active + 1,
        }));
      }

      showFeedback(`Certification "${certCode}" restored to Active successfully!`);

      const res = await api.restoreCertification(id);
      if (!res.success) {
        showFeedback(res.message || 'Failed to restore certification', 'error');
        loadArchivedCertifications();
        loadCertifications();
      }
    } catch (err: any) {
      showFeedback(err.message || 'Failed to restore certification', 'error');
      loadArchivedCertifications();
      loadCertifications();
    }
  };

  // Permanent Delete Certification (Safe Check)
  const handleDeleteCertification = async (id: string, certCode: string, certName: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete certification "${certName}" (${certCode})? This action cannot be undone.`)) {
      return;
    }
    try {
      // 1. INSTANT STATE UPDATE (0ms)
      setCertifications((prev) => prev.filter((c) => c.id !== id && c.code !== certCode));
      setArchivedCertifications((prev) => prev.filter((c) => c.id !== id && c.code !== certCode));
      setStats((prev) => ({ ...prev, total: Math.max(0, prev.total - 1) }));

      try {
        const current = JSON.parse(localStorage.getItem('aicqb_admin_certifications') || '[]');
        localStorage.setItem(
          'aicqb_admin_certifications',
          JSON.stringify(current.filter((c: any) => c.id !== id && c.code !== certCode))
        );
      } catch (_) {}

      showFeedback(`Certification "${certCode}" deleted permanently.`);

      const res = await api.deleteCertification(id);
      if (!res.success) {
        showFeedback(res.message || 'Failed to delete certification', 'error');
        loadCertifications();
      }
    } catch (err: any) {
      showFeedback(err.message || 'Failed to delete certification', 'error');
      loadCertifications();
    }
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    const defaultDomain = domains.length > 0 ? domains[0] : null;
    const defaultLevel = levels.length > 0 ? levels[0] : null;

    setName('');
    const dName = defaultDomain ? defaultDomain.name : 'AI & Machine Learning';
    setDomain(dName);
    setDomainId(defaultDomain ? defaultDomain.id : '');
    const lName = defaultLevel ? defaultLevel.name : 'Professional Level';
    setLevel(lName);
    setLevelId(defaultLevel ? defaultLevel.id : '');

    const initialFee = defaultLevel?.defaultExamFeeINR || 4500;
    setExamFee(initialFee);
    setExamFeeUSD(Math.round((initialFee / (exchangeRate || 85)) * 100) / 100);
    setDuration('90');
    setDurationUnit('Minutes');
    setPassingCriteria(70);
    setDescription('');
    setStatus('Active');
    setEligibility('Open to professionals, students, QA analysts, and software practitioners worldwide.');
    setExamPattern('Online proctored examination, 60 MCQ questions, 90 minutes duration.');

    setShowAddModal(true);
    fetchAutoGeneratedCode(dName, defaultDomain?.codePrefix);
  };

  // Open Edit Modal
  const handleOpenEdit = (cert: Certification) => {
    setEditingCert(cert);
    setName(cert.name || '');
    setCode(cert.code || '');
    setDomain(cert.domain || 'AI & Machine Learning');
    setDomainId(cert.domainId || '');
    setLevel(cert.level || 'Professional Level');
    setLevelId(cert.levelId || '');
    setExamFee(cert.examFee !== undefined ? cert.examFee : 4500);
    setExamFeeUSD(
      cert.examFeeUSD !== undefined
        ? cert.examFeeUSD
        : Math.round(((cert.examFee || 4500) / (exchangeRate || 85)) * 100) / 100
    );
    setDuration(cert.duration ? cert.duration.replace(/[^0-9]/g, '') || '90' : '90');
    setDurationUnit('Minutes');
    setPassingCriteria(cert.passingCriteria !== undefined ? cert.passingCriteria : 70);
    setDescription(cert.description || '');
    setStatus(cert.status as any || 'Active');
    setEligibility(cert.eligibility || '');
    setExamPattern(cert.examPattern || '');
  };

  // Create Certification (Instant 0ms reflection without refresh)
  const handleCreateCertification = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const parsedFee = Number(examFee) || 0;
      const parsedUSD = Number(examFeeUSD) || Math.round((parsedFee / (exchangeRate || 85)) * 100) / 100;
      const parsedPassing = Number(passingCriteria) || 70;

      const payload = {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        domain,
        domainId,
        level,
        levelId,
        examFee: parsedFee,
        examFeeUSD: parsedUSD,
        exchangeRate: exchangeRate || 85,
        duration: `${duration.trim()} ${durationUnit}`,
        durationUnit,
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

      // 1. Close modal immediately for smooth UX
      setShowAddModal(false);

      // 2. Optimistic instant state update (prepended at top of table immediately)
      const optimisticNewCert: Certification = {
        ...payload,
        id: `cert_${payload.code.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
        createdAt: new Date().toISOString(),
      } as any;

      setCertifications((prev) => [
        optimisticNewCert,
        ...prev.filter((c) => c.code !== optimisticNewCert.code),
      ]);

      // 3. Update dashboard statistics immediately
      setStats((prev) => ({
        ...prev,
        total: prev.total + 1,
        active: optimisticNewCert.status === 'Active' ? prev.active + 1 : prev.active,
        inactive: optimisticNewCert.status === 'Inactive' ? prev.inactive + 1 : prev.inactive,
      }));

      // 4. Update localStorage immediately
      try {
        const current = JSON.parse(localStorage.getItem('aicqb_admin_certifications') || '[]');
        localStorage.setItem('aicqb_admin_certifications', JSON.stringify([optimisticNewCert, ...current]));
      } catch (_) {}

      showFeedback(`New Certification "${payload.code}" published successfully!`);

      // 5. Persist to server in background
      const res = await api.createCertification(payload);
      if (res.success && res.certification) {
        // Replace with canonical server record
        setCertifications((prev) =>
          prev.map((c) => (c.code === res.certification.code ? res.certification : c))
        );
        window.dispatchEvent(new CustomEvent('aicqb_certifications_updated', { detail: res.certification }));
      } else if (!res.success) {
        showFeedback(res.message || 'Failed to create certification.', 'error');
        loadCertifications();
      }
    } catch (err: any) {
      showFeedback(err.message || 'Failed to create certification.', 'error');
      loadCertifications();
    } finally {
      setSubmitting(false);
    }
  };

  // Update Certification (Instant 0ms reflection without refresh)
  const handleUpdateCertification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCert) return;
    try {
      setSubmitting(true);
      const parsedFee = Number(examFee) || 0;
      const parsedUSD = Number(examFeeUSD) || Math.round((parsedFee / (exchangeRate || 85)) * 100) / 100;
      const parsedPassing = Number(passingCriteria) || 70;

      const payload = {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        domain,
        domainId,
        level,
        levelId,
        examFee: parsedFee,
        examFeeUSD: parsedUSD,
        exchangeRate: exchangeRate || 85,
        duration: `${duration.trim()} ${durationUnit}`,
        durationUnit,
        passingCriteria: parsedPassing,
        description: description.trim(),
        status,
        eligibility: eligibility.trim(),
        examPattern: examPattern.trim(),
      };

      // 1. Close modal immediately so table row is visible
      const targetId = editingCert.id;
      const targetCode = editingCert.code;
      const prevStatus = editingCert.status;
      setEditingCert(null);

      // 2. INSTANT STATE UPDATE (0ms) - table row, fee, status, level update immediately
      setCertifications((prev) =>
        prev.map((c) => {
          if (c.id === targetId || c.code === targetCode) {
            return { ...c, ...payload } as Certification;
          }
          return c;
        })
      );

      // 3. Update dashboard statistics immediately if status changed
      if (prevStatus !== status) {
        setStats((prev) => ({
          ...prev,
          active: status === 'Active' ? prev.active + 1 : Math.max(0, prev.active - 1),
          inactive: status === 'Inactive' ? prev.inactive + 1 : Math.max(0, prev.inactive - 1),
        }));
      }

      // 4. Update localStorage immediately
      try {
        const current = JSON.parse(localStorage.getItem('aicqb_admin_certifications') || '[]');
        const updatedCache = current.map((c: any) =>
          c.id === targetId || c.code === targetCode ? { ...c, ...payload } : c
        );
        localStorage.setItem('aicqb_admin_certifications', JSON.stringify(updatedCache));
      } catch (_) {}

      showFeedback(`Certification "${payload.code}" updated successfully! Fee: ₹${parsedFee.toLocaleString('en-IN')}`);

      // 5. Persist to server in background
      const res = await api.updateCertification(targetId, payload);
      if (res.success && res.certification) {
        setCertifications((prev) =>
          prev.map((c) => (c.id === targetId || c.code === targetCode ? res.certification : c))
        );
        window.dispatchEvent(new CustomEvent('aicqb_certifications_updated', { detail: res.certification }));
      } else if (!res.success) {
        showFeedback(res.message || 'Failed to update certification', 'error');
        loadCertifications();
      }
    } catch (err: any) {
      showFeedback(err.message || 'Failed to update certification', 'error');
      loadCertifications();
    } finally {
      setSubmitting(false);
    }
  };

  // Domain Management Handlers (Instant 0ms reflection without refresh)
  const handleSaveDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload = {
        name: domainName.trim(),
        codePrefix: domainCodePrefix.trim().toUpperCase(),
        description: domainDescription.trim(),
        status: domainStatus,
      };

      setShowDomainModal(false);

      if (editingDomain) {
        const targetId = editingDomain.id;
        setEditingDomain(null);
        // Instant update
        setDomains((prev) =>
          prev.map((d) => (d.id === targetId ? ({ ...d, ...payload } as CertificationDomain) : d))
        );
        showFeedback(`Domain "${payload.name}" updated successfully!`);

        const res = await api.updateCertificationDomain(targetId, payload);
        if (res.success && res.domain) {
          setDomains((prev) => prev.map((d) => (d.id === targetId ? res.domain : d)));
        }
      } else {
        const tempId = `dom_${payload.codePrefix.toLowerCase()}_${Date.now()}`;
        const newDom = { ...payload, id: tempId, domainId: tempId } as CertificationDomain;
        // Instant update
        setDomains((prev) => [...prev, newDom]);
        setStats((prev) => ({ ...prev, totalDomains: prev.totalDomains + 1 }));
        showFeedback(`Domain "${payload.name}" created successfully!`);

        const res = await api.createCertificationDomain(payload);
        if (res.success && res.domain) {
          setDomains((prev) => prev.map((d) => (d.id === tempId ? res.domain : d)));
        }
      }
    } catch (err: any) {
      showFeedback(err.message || 'Operation failed', 'error');
      loadDomains();
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleDomain = async (id: string) => {
    try {
      let nextStatus: 'Active' | 'Inactive' = 'Active';
      // Instant update
      setDomains((prev) =>
        prev.map((d) => {
          if (d.id === id) {
            nextStatus = d.status === 'Active' ? 'Inactive' : 'Active';
            return { ...d, status: nextStatus };
          }
          return d;
        })
      );
      showFeedback(`Domain status changed to ${nextStatus}!`);

      const res = await api.toggleCertificationDomainStatus(id);
      if (!res.success) loadDomains();
    } catch (err: any) {
      showFeedback(err.message || 'Failed to toggle status', 'error');
      loadDomains();
    }
  };

  const handleDeleteDomain = async (id: string, nameVal: string) => {
    if (!window.confirm(`Delete domain "${nameVal}"? This cannot be undone.`)) return;
    try {
      // Instant update
      setDomains((prev) => prev.filter((d) => d.id !== id));
      setStats((prev) => ({ ...prev, totalDomains: Math.max(0, prev.totalDomains - 1) }));
      showFeedback(`Domain "${nameVal}" deleted successfully.`);

      const res = await api.deleteCertificationDomain(id);
      if (!res.success) {
        showFeedback(res.message || 'Failed to delete domain', 'error');
        loadDomains();
      }
    } catch (err: any) {
      showFeedback(err.message || 'Failed to delete domain', 'error');
      loadDomains();
    }
  };

  // Level Management Handlers (Instant 0ms reflection without refresh)
  const handleSaveLevel = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload = {
        name: levelName.trim(),
        levelCode: levelCode.trim().toUpperCase(),
        defaultExamFeeINR: Number(levelDefaultFee) || 4500,
        description: levelDescription.trim(),
        status: levelStatus,
      };

      setShowLevelModal(false);

      if (editingLevel) {
        const targetId = editingLevel.id;
        setEditingLevel(null);
        // Instant update
        setLevels((prev) =>
          prev.map((l) => (l.id === targetId ? ({ ...l, ...payload } as CertificationLevel) : l))
        );
        showFeedback(`Level "${payload.name}" updated successfully!`);

        const res = await api.updateCertificationLevel(targetId, payload);
        if (res.success && res.level) {
          setLevels((prev) => prev.map((l) => (l.id === targetId ? res.level : l)));
        }
      } else {
        const tempId = `lvl_${Date.now()}`;
        const newLvl = { ...payload, id: tempId, levelId: tempId } as CertificationLevel;
        // Instant update
        setLevels((prev) => [...prev, newLvl]);
        setStats((prev) => ({ ...prev, totalLevels: prev.totalLevels + 1 }));
        showFeedback(`Level "${payload.name}" created successfully!`);

        const res = await api.createCertificationLevel(payload);
        if (res.success && res.level) {
          setLevels((prev) => prev.map((l) => (l.id === tempId ? res.level : l)));
        }
      }
    } catch (err: any) {
      showFeedback(err.message || 'Operation failed', 'error');
      loadLevels();
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleLevel = async (id: string) => {
    try {
      let nextStatus: 'Active' | 'Inactive' = 'Active';
      // Instant update
      setLevels((prev) =>
        prev.map((l) => {
          if (l.id === id) {
            nextStatus = l.status === 'Active' ? 'Inactive' : 'Active';
            return { ...l, status: nextStatus };
          }
          return l;
        })
      );
      showFeedback(`Level status changed to ${nextStatus}!`);

      const res = await api.toggleCertificationLevelStatus(id);
      if (!res.success) loadLevels();
    } catch (err: any) {
      showFeedback(err.message || 'Failed to toggle status', 'error');
      loadLevels();
    }
  };

  const handleDeleteLevel = async (id: string, nameVal: string) => {
    if (!window.confirm(`Delete level "${nameVal}"? This cannot be undone.`)) return;
    try {
      // Instant update
      setLevels((prev) => prev.filter((l) => l.id !== id));
      setStats((prev) => ({ ...prev, totalLevels: Math.max(0, prev.totalLevels - 1) }));
      showFeedback(`Level "${nameVal}" deleted successfully.`);

      const res = await api.deleteCertificationLevel(id);
      if (!res.success) {
        showFeedback(res.message || 'Failed to delete level', 'error');
        loadLevels();
      }
    } catch (err: any) {
      showFeedback(err.message || 'Failed to delete level', 'error');
      loadLevels();
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
          <button onClick={() => setFeedback(null)} className="text-gray-400 hover:text-gray-600 p-1">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-black text-[#10264B]">Certification Management</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-[#F47716]">
              AIICQB Super Admin
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Create and manage certification programs, active statuses, levels, and examination pricing.
          </p>
        </div>
        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 bg-[#F47716] hover:bg-[#DC660E] text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Certification</span>
          </button>
        </div>
      </div>

      {/* 1. Dynamic Dashboard Statistics (Calculated from Firestore) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white rounded-xl p-3.5 border border-gray-200 shadow-xs flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-500">Total Programs</div>
            <div className="text-lg font-black text-[#10264B]">{stats.total || certifications.length}</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-gray-200 shadow-xs flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-green-50 text-green-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-500">Active</div>
            <div className="text-lg font-black text-green-700">{stats.active}</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-gray-200 shadow-xs flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center font-bold">
            <Power className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-500">Inactive</div>
            <div className="text-lg font-black text-gray-700">{stats.inactive}</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-gray-200 shadow-xs flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Archive className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-500">Archived</div>
            <div className="text-lg font-black text-amber-700">{stats.archived}</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-gray-200 shadow-xs flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-500">Total Domains</div>
            <div className="text-lg font-black text-purple-700">{domains.length || stats.totalDomains}</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-gray-200 shadow-xs flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-500">Total Levels</div>
            <div className="text-lg font-black text-indigo-700">{levels.length || stats.totalLevels}</div>
          </div>
        </div>
      </div>

      {/* Module Navigation Tabs */}
      <div className="flex border-b border-gray-200 bg-white px-2 pt-2 rounded-t-xl overflow-x-auto text-xs font-bold text-gray-600">
        <button
          onClick={() => setActiveTab('certifications')}
          className={`py-3 px-4 border-b-2 transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === 'certifications'
              ? 'border-[#F47716] text-[#F47716]'
              : 'border-transparent hover:text-gray-900'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Certifications Catalog ({certifications.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('domains')}
          className={`py-3 px-4 border-b-2 transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === 'domains'
              ? 'border-[#F47716] text-[#F47716]'
              : 'border-transparent hover:text-gray-900'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Domain Management ({domains.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('levels')}
          className={`py-3 px-4 border-b-2 transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === 'levels'
              ? 'border-[#F47716] text-[#F47716]'
              : 'border-transparent hover:text-gray-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Level & Pricing Matrix ({levels.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('archived')}
          className={`py-3 px-4 border-b-2 transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === 'archived'
              ? 'border-[#F47716] text-[#F47716]'
              : 'border-transparent hover:text-gray-900'
          }`}
        >
          <Archive className="w-4 h-4" />
          <span>Archived Programs ({stats.archived})</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`py-3 px-4 border-b-2 transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === 'audit'
              ? 'border-[#F47716] text-[#F47716]'
              : 'border-transparent hover:text-gray-900'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Admin Audit Logs</span>
        </button>
      </div>

      {/* TAB 1: CERTIFICATIONS MAIN LIST */}
      {activeTab === 'certifications' && (
        <div className="space-y-4">
          {/* Dynamic Filter Bar */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs flex flex-col md:flex-row gap-3">
            {/* Dynamic Domain Dropdown from Firestore */}
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-gray-300 rounded-lg focus:outline-none text-gray-700 font-semibold cursor-pointer"
            >
              <option value="All">All Domains</option>
              {domains.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>

            {/* Dynamic Level Dropdown from Firestore */}
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-gray-300 rounded-lg focus:outline-none text-gray-700 font-semibold cursor-pointer"
            >
              <option value="All">All Levels</option>
              {levels.map((lvl) => (
                <option key={lvl.id} value={lvl.name}>
                  {lvl.name}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-gray-300 rounded-lg focus:outline-none text-gray-700 font-semibold cursor-pointer"
            >
              <option value="All">Status: All</option>
              <option value="Active">Active Only</option>
              <option value="Inactive">Inactive Only</option>
            </select>

            <select
              value={`${sortBy}_${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split('_');
                setSortBy(sb as any);
                setSortOrder(so as any);
              }}
              className="px-3 py-2 text-xs bg-slate-50 border border-gray-300 rounded-lg focus:outline-none text-gray-700 font-semibold cursor-pointer"
            >
              <option value="createdAt_desc">Sort: Newest First</option>
              <option value="createdAt_asc">Sort: Oldest First</option>
              <option value="name_asc">Sort: Name (A-Z)</option>
              <option value="fee_desc">Sort: Fee (High to Low)</option>
              <option value="fee_asc">Sort: Fee (Low to High)</option>
            </select>

            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by code, title, domain, or level..."
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
                    <th className="py-3.5 px-6">Certification Code</th>
                    <th className="py-3.5 px-6">Certification Name</th>
                    <th className="py-3.5 px-6">Domain</th>
                    <th className="py-3.5 px-6">Level</th>
                    <th className="py-3.5 px-6">Exam Fee (INR)</th>
                    <th className="py-3.5 px-6">Exam Fee (USD)</th>
                    <th className="py-3.5 px-6">Status</th>
                    <th className="py-3.5 px-6">Created Date</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading && certifications.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-gray-400">
                        <Loader2 className="w-8 h-8 mx-auto animate-spin text-[#F47716] mb-2" />
                        <p className="font-semibold text-sm">Loading Certification Programs...</p>
                      </td>
                    </tr>
                  ) : certifications.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-gray-400">
                        <Award className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                        <p className="font-semibold text-sm">No Certification Programs Found</p>
                        <p className="text-[11px] mt-0.5">Click "Add Certification" to publish a new program.</p>
                      </td>
                    </tr>
                  ) : (
                    certifications
                      .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                      .map((cert) => (
                        <tr key={cert.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-4 px-6 font-mono font-bold text-[#F47716] whitespace-nowrap">{cert.code}</td>
                          <td className="py-4 px-6 font-bold text-[#10264B] max-w-xs">{cert.name}</td>
                          <td className="py-4 px-6 text-gray-700 font-medium">
                            <span className="px-2.5 py-1 bg-slate-100 rounded-md text-[11px]">{cert.domain}</span>
                          </td>
                          <td className="py-4 px-6 text-gray-600 font-medium">{cert.level}</td>
                          <td className="py-4 px-6 font-black text-[#10264B] whitespace-nowrap">
                            ₹{Number(cert.examFee || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="py-4 px-6 font-bold text-gray-700 whitespace-nowrap">
                            ${Number(cert.examFeeUSD || Math.round(((cert.examFee || 0) / 85) * 100) / 100).toFixed(2)}
                          </td>
                          <td className="py-4 px-6">
                            {/* Interactive Status Button */}
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(cert.id)}
                              className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer flex items-center space-x-1.5 shadow-xs ${
                                cert.status === 'Active'
                                  ? 'bg-green-50 text-green-700 border border-green-300 hover:bg-green-100'
                                  : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200'
                              }`}
                              title={`Click to change status to ${cert.status === 'Active' ? 'Inactive' : 'Active'}`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  cert.status === 'Active' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                                }`}
                              />
                              <span>{cert.status === 'Active' ? 'Active' : 'Inactive'}</span>
                            </button>
                          </td>
                          <td className="py-4 px-6 text-gray-500 text-[11px] whitespace-nowrap">
                            {cert.createdAt ? new Date(cert.createdAt).toLocaleDateString('en-GB') : '2026-01-15'}
                          </td>
                          <td className="py-4 px-6 text-right space-x-1.5 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(cert.id)}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                cert.status === 'Active'
                                  ? 'text-green-600 hover:bg-green-50 border border-green-200'
                                  : 'text-gray-400 hover:bg-gray-100'
                              }`}
                              title={cert.status === 'Active' ? 'Deactivate Program' : 'Activate Program'}
                            >
                              <Power className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(cert)}
                              className="p-1.5 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50 border border-blue-200 transition-colors cursor-pointer"
                              title="Edit Certification Details"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setArchiveTarget(cert)}
                              className="p-1.5 rounded-lg text-amber-600 hover:text-amber-800 hover:bg-amber-50 border border-amber-200 transition-colors cursor-pointer"
                              title="Archive Certification"
                            >
                              <Archive className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCertification(cert.id, cert.code, cert.name)}
                              className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 border border-red-200 transition-colors cursor-pointer"
                              title="Permanently Delete Program"
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
        </div>
      )}

      {/* TAB 2: DOMAIN MANAGEMENT */}
      {activeTab === 'domains' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200">
            <div>
              <h2 className="text-sm font-bold text-[#10264B]">Dynamic Certification Domains</h2>
              <p className="text-xs text-gray-500">
                Manage certification domain categories and code prefixes (stored in Firestore).
              </p>
            </div>
            <button
              onClick={() => {
                setEditingDomain(null);
                setDomainName('');
                setDomainCodePrefix('');
                setDomainDescription('');
                setDomainStatus('Active');
                setShowDomainModal(true);
              }}
              className="px-3.5 py-2 bg-[#F47716] hover:bg-[#DC660E] text-white font-bold text-xs rounded-lg transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Domain</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-gray-600 font-semibold uppercase tracking-wider text-[11px] border-b border-gray-200">
                <tr>
                  <th className="py-3 px-6">Code Prefix</th>
                  <th className="py-3 px-6">Domain Name</th>
                  <th className="py-3 px-6">Description</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {domains.map((dom) => (
                  <tr key={dom.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-6 font-mono font-bold text-[#F47716]">{dom.codePrefix}</td>
                    <td className="py-3.5 px-6 font-bold text-[#10264B]">{dom.name}</td>
                    <td className="py-3.5 px-6 text-gray-600 max-w-sm">{dom.description || '—'}</td>
                    <td className="py-3.5 px-6">
                      <button
                        onClick={() => handleToggleDomain(dom.id)}
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold cursor-pointer ${
                          dom.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {dom.status}
                      </button>
                    </td>
                    <td className="py-3.5 px-6 text-right space-x-2">
                      <button
                        onClick={() => {
                          setEditingDomain(dom);
                          setDomainName(dom.name);
                          setDomainCodePrefix(dom.codePrefix);
                          setDomainDescription(dom.description || '');
                          setDomainStatus(dom.status || 'Active');
                          setShowDomainModal(true);
                        }}
                        className="p-1 rounded text-blue-600 hover:bg-blue-50 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteDomain(dom.id, dom.name)}
                        className="p-1 rounded text-red-500 hover:bg-red-50 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: LEVEL & PRICING MATRIX */}
      {activeTab === 'levels' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200">
            <div>
              <h2 className="text-sm font-bold text-[#10264B]">Certification Levels & Default Pricing</h2>
              <p className="text-xs text-gray-500">
                Configure baseline examination pricing for each proficiency tier.
              </p>
            </div>
            <button
              onClick={() => {
                setEditingLevel(null);
                setLevelName('');
                setLevelCode('');
                setLevelDefaultFee(4500);
                setLevelDescription('');
                setLevelStatus('Active');
                setShowLevelModal(true);
              }}
              className="px-3.5 py-2 bg-[#F47716] hover:bg-[#DC660E] text-white font-bold text-xs rounded-lg transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Level</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-gray-600 font-semibold uppercase tracking-wider text-[11px] border-b border-gray-200">
                <tr>
                  <th className="py-3 px-6">Level Code</th>
                  <th className="py-3 px-6">Level Name</th>
                  <th className="py-3 px-6">Default Exam Fee (INR)</th>
                  <th className="py-3 px-6">Estimated USD ($)</th>
                  <th className="py-3 px-6">Description</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {levels.map((lvl) => (
                  <tr key={lvl.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-6 font-mono font-bold text-[#F47716]">{lvl.levelCode || '—'}</td>
                    <td className="py-3.5 px-6 font-bold text-[#10264B]">{lvl.name}</td>
                    <td className="py-3.5 px-6 font-black text-gray-900">
                      ₹{Number(lvl.defaultExamFeeINR || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-6 font-bold text-gray-600">
                      ${Math.round((Number(lvl.defaultExamFeeINR || 0) / (exchangeRate || 85)) * 100) / 100}
                    </td>
                    <td className="py-3.5 px-6 text-gray-600 max-w-sm">{lvl.description || '—'}</td>
                    <td className="py-3.5 px-6">
                      <button
                        onClick={() => handleToggleLevel(lvl.id)}
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold cursor-pointer ${
                          lvl.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {lvl.status}
                      </button>
                    </td>
                    <td className="py-3.5 px-6 text-right space-x-2">
                      <button
                        onClick={() => {
                          setEditingLevel(lvl);
                          setLevelName(lvl.name);
                          setLevelCode(lvl.levelCode || '');
                          setLevelDefaultFee(lvl.defaultExamFeeINR || 4500);
                          setLevelDescription(lvl.description || '');
                          setLevelStatus(lvl.status || 'Active');
                          setShowLevelModal(true);
                        }}
                        className="p-1 rounded text-blue-600 hover:bg-blue-50 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteLevel(lvl.id, lvl.name)}
                        className="p-1 rounded text-red-500 hover:bg-red-50 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: ARCHIVED PROGRAMS */}
      {activeTab === 'archived' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <h2 className="text-sm font-bold text-[#10264B]">Archived Certification Programs</h2>
            <p className="text-xs text-gray-500">
              Soft-deleted certifications preserved for historical candidate enrollments and certificate verification.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-gray-600 font-semibold uppercase tracking-wider text-[11px] border-b border-gray-200">
                <tr>
                  <th className="py-3 px-6">Code</th>
                  <th className="py-3 px-6">Certification Name</th>
                  <th className="py-3 px-6">Domain</th>
                  <th className="py-3 px-6">Level</th>
                  <th className="py-3 px-6">Archived Status</th>
                  <th className="py-3 px-6 text-right">Restore Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {archivedCertifications.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-400">
                      <Archive className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                      <p className="font-semibold text-sm">No Archived Programs</p>
                      <p className="text-[11px] mt-0.5">All active and inactive certifications are currently in the live catalog.</p>
                    </td>
                  </tr>
                ) : (
                  archivedCertifications.map((cert) => (
                    <tr key={cert.id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-6 font-mono font-bold text-amber-600">{cert.code}</td>
                      <td className="py-3.5 px-6 font-bold text-[#10264B]">{cert.name}</td>
                      <td className="py-3.5 px-6 text-gray-600">{cert.domain}</td>
                      <td className="py-3.5 px-6 text-gray-600">{cert.level}</td>
                      <td className="py-3.5 px-6">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          Archived
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => handleRestoreCertification(cert.id, cert.code)}
                          className="px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 border border-green-300 rounded-lg text-xs font-bold transition-colors inline-flex items-center space-x-1 cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Restore</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCertification(cert.id, cert.code, cert.name)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
                          title="Permanently Delete"
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
        </div>
      )}

      {/* TAB 5: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#10264B]">Administrative Audit Logs</h2>
              <p className="text-xs text-gray-500">
                Immutable event stream of certification creations, fee modifications, and status changes.
              </p>
            </div>
            <button
              onClick={loadAuditLogs}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-gray-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              Refresh Logs
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-gray-600 font-semibold uppercase tracking-wider text-[11px] border-b border-gray-200">
                <tr>
                  <th className="py-3 px-6">Timestamp</th>
                  <th className="py-3 px-6">Action</th>
                  <th className="py-3 px-6">Program / Entity</th>
                  <th className="py-3 px-6">Admin Email</th>
                  <th className="py-3 px-6">Snapshot Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-gray-400">
                      <History className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                      <p className="font-semibold text-sm">No Audit Logs Recorded Yet</p>
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.logId || log.id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-6 font-mono text-gray-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString('en-GB')}
                      </td>
                      <td className="py-3.5 px-6 font-bold text-[#10264B]">
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-mono text-[10px]">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 font-mono font-bold text-[#F47716]">
                        {log.certificationCode || log.certificationId || '—'}
                      </td>
                      <td className="py-3.5 px-6 text-gray-600">{log.adminEmail || 'admin@aicqb.org'}</td>
                      <td className="py-3.5 px-6 text-gray-500 font-mono text-[10px] max-w-xs truncate">
                        {log.updatedData ? JSON.stringify(log.updatedData) : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. ADD CERTIFICATION MODAL (TWO-COLUMN DESKTOP, RESPONSIVE MOBILE) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-gray-200 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#F47716] flex items-center justify-center font-bold">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-[#10264B]">Create New Certification Program</h3>
                  <p className="text-[11px] text-gray-500">AIICQB Official Certification Registry & Pricing Authority</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCertification} className="space-y-4 text-xs">
              {/* SECTION A: Basic Certification Information */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 border-b pb-1">
                  A. Basic Certification Information
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Certification Name *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. AIICQB Certified DevOps Practitioner"
                      className="w-full p-2.5 bg-slate-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47716] focus:outline-none font-medium text-gray-900"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-bold text-gray-700">Program Code (Auto-Generated) *</label>
                      <button
                        type="button"
                        onClick={() => fetchAutoGeneratedCode(domain)}
                        className="text-[10px] text-[#F47716] hover:underline flex items-center space-x-0.5 cursor-pointer"
                        title="Regenerate unique code"
                      >
                        {generatingCode ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                        <span>Auto-Generate</span>
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        readOnly
                        value={code}
                        className="w-full p-2.5 bg-slate-100 border border-gray-300 rounded-lg font-mono font-bold text-[#F47716] cursor-not-allowed select-all pr-8"
                      />
                      <Lock className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-3" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Domain *</label>
                    <select
                      value={domain}
                      onChange={(e) => handleDomainChange(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47716] focus:outline-none font-semibold text-gray-800 cursor-pointer"
                    >
                      {domains.map((dom) => (
                        <option key={dom.id} value={dom.name}>
                          {dom.name} ({dom.codePrefix})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Level *</label>
                    <select
                      value={level}
                      onChange={(e) => handleLevelChange(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47716] focus:outline-none font-semibold text-gray-800 cursor-pointer"
                    >
                      {levels.map((lvl) => (
                        <option key={lvl.id} value={lvl.name}>
                          {lvl.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Status *</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className={`w-full p-2.5 bg-slate-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47716] focus:outline-none font-bold cursor-pointer ${
                        status === 'Active' ? 'text-green-700' : 'text-gray-600'
                      }`}
                    >
                      <option value="Active">Active (Published)</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Draft">Draft</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION B: Examination Pricing */}
              <div className="bg-orange-50/60 border border-orange-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 font-bold text-orange-950">
                    <DollarSign className="w-4 h-4 text-[#F47716]" />
                    <span>B. Examination Pricing Authority</span>
                  </div>
                  <div className="text-[10px] text-gray-600 bg-white px-2 py-0.5 rounded border border-orange-200 font-mono">
                    Rate: 1 USD = ₹{exchangeRate.toFixed(2)} INR
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Exam Fee (₹ INR) *</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={examFee}
                      onChange={(e) => handleINRChange(e.target.value)}
                      className="w-full p-2.5 bg-white border border-orange-300 rounded-lg font-black text-sm text-[#10264B] focus:ring-2 focus:ring-[#F47716] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      Exam Fee ($ USD) <span className="font-normal text-gray-500">(Auto-calculated: INR / Rate)</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      value={examFeeUSD}
                      onChange={(e) => setExamFeeUSD(e.target.value)}
                      className="w-full p-2.5 bg-white border border-orange-300 rounded-lg font-black text-sm text-[#10264B] focus:ring-2 focus:ring-[#F47716] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION C: Examination Configuration */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 border-b pb-1">
                  C. Examination Configuration
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Exam Duration (Minutes) *</label>
                    <input
                      type="number"
                      required
                      min={10}
                      max={300}
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      placeholder="90"
                      className="w-full p-2.5 bg-slate-50 border border-gray-300 rounded-lg font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Passing Threshold (%) *</label>
                    <input
                      type="number"
                      required
                      min={0}
                      max={100}
                      value={passingCriteria}
                      onChange={(e) => setPassingCriteria(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-gray-300 rounded-lg font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Program Description *</label>
                  <textarea
                    rows={3}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe syllabus, practical goals, and industry competencies..."
                    className="w-full p-2.5 bg-slate-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47716] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Eligibility Criteria</label>
                    <textarea
                      rows={2}
                      value={eligibility}
                      onChange={(e) => setEligibility(e.target.value)}
                      placeholder="e.g. Fresh graduates, QA analysts, software developers..."
                      className="w-full p-2.5 bg-slate-50 border border-gray-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Exam Pattern & Format</label>
                    <textarea
                      rows={2}
                      value={examPattern}
                      onChange={(e) => setExamPattern(e.target.value)}
                      placeholder="e.g. Online proctored examination, 50 MCQ questions, 90 minutes."
                      className="w-full p-2.5 bg-slate-50 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION D: Form Buttons */}
              <div className="flex items-center space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-[#F47716] hover:bg-[#DC660E] text-white font-bold rounded-xl shadow-sm transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-60"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span>{submitting ? 'Publishing Program...' : 'Publish Certification'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT CERTIFICATION MODAL */}
      {editingCert && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-gray-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-[#10264B]">
                    Edit Certification Program ({editingCert.code})
                  </h3>
                  <p className="text-[11px] text-gray-500">Update parameters, pricing authority, and syllabus format</p>
                </div>
              </div>
              <button
                onClick={() => setEditingCert(null)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateCertification} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Certification Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47716] font-medium text-gray-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Program Code</label>
                  <input
                    type="text"
                    readOnly
                    value={code}
                    className="w-full p-2.5 bg-slate-100 border border-gray-300 rounded-lg font-mono font-bold text-[#F47716] cursor-not-allowed select-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Domain</label>
                  <select
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-gray-300 rounded-lg font-semibold"
                  >
                    {domains.map((dom) => (
                      <option key={dom.id} value={dom.name}>
                        {dom.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Level</label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-gray-300 rounded-lg font-semibold"
                  >
                    {levels.map((lvl) => (
                      <option key={lvl.id} value={lvl.name}>
                        {lvl.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className={`w-full p-2.5 bg-slate-50 border border-gray-300 rounded-lg font-bold cursor-pointer ${
                      status === 'Active' ? 'text-green-700' : 'text-gray-600'
                    }`}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Price Authority */}
              <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 font-bold text-amber-950">
                    <DollarSign className="w-4 h-4 text-[#F47716]" />
                    <span>Examination Pricing Authority (Live Firestore)</span>
                  </div>
                  <div className="text-[10px] text-gray-600 bg-white px-2 py-0.5 rounded border border-amber-200 font-mono">
                    Rate: 1 USD = ₹{exchangeRate.toFixed(2)} INR
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Exam Fee (₹ INR) *</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={examFee}
                      onChange={(e) => handleINRChange(e.target.value)}
                      className="w-full p-2.5 bg-white border border-amber-300 rounded-lg font-black text-sm text-[#10264B] focus:ring-2 focus:ring-[#F47716]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Exam Fee ($ USD)</label>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      value={examFeeUSD}
                      onChange={(e) => setExamFeeUSD(e.target.value)}
                      className="w-full p-2.5 bg-white border border-amber-300 rounded-lg font-black text-sm text-[#10264B] focus:ring-2 focus:ring-[#F47716]"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Exam Duration (Minutes)</label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-gray-300 rounded-lg font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Passing Threshold (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={passingCriteria}
                    onChange={(e) => setPassingCriteria(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-gray-300 rounded-lg font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Program Description</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Eligibility Criteria</label>
                  <textarea
                    rows={2}
                    value={eligibility}
                    onChange={(e) => setEligibility(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Exam Pattern & Format</label>
                  <textarea
                    rows={2}
                    value={examPattern}
                    onChange={(e) => setExamPattern(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-60"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Edit2 className="w-4 h-4" />}
                  <span>{submitting ? 'Saving Changes...' : 'Save Program Changes'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditingCert(null)}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DOMAIN CREATE / EDIT MODAL */}
      {showDomainModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm text-[#10264B] flex items-center space-x-2">
                <Globe className="w-4 h-4 text-[#F47716]" />
                <span>{editingDomain ? 'Edit Domain' : 'Create New Domain'}</span>
              </h3>
              <button onClick={() => setShowDomainModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDomain} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Domain Name *</label>
                <input
                  type="text"
                  required
                  value={domainName}
                  onChange={(e) => setDomainName(e.target.value)}
                  placeholder="e.g. AI & Machine Learning"
                  className="w-full p-2.5 bg-slate-50 border rounded-lg focus:ring-1 focus:ring-[#F47716]"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Code Prefix (2-4 letters) *</label>
                <input
                  type="text"
                  required
                  maxLength={4}
                  value={domainCodePrefix}
                  onChange={(e) => setDomainCodePrefix(e.target.value.toUpperCase())}
                  placeholder="e.g. AI, ST, DS, CY, CL"
                  className="w-full p-2.5 bg-slate-50 border rounded-lg font-mono font-bold text-[#F47716]"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={domainDescription}
                  onChange={(e) => setDomainDescription(e.target.value)}
                  placeholder="Domain syllabus overview..."
                  className="w-full p-2.5 bg-slate-50 border rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Status</label>
                <select
                  value={domainStatus}
                  onChange={(e) => setDomainStatus(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border rounded-lg font-bold"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="flex items-center space-x-2 pt-3 border-t">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#F47716] hover:bg-[#DC660E] text-white font-bold rounded-lg cursor-pointer"
                >
                  {submitting ? 'Saving...' : editingDomain ? 'Update Domain' : 'Create Domain'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDomainModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 font-bold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LEVEL CREATE / EDIT MODAL */}
      {showLevelModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm text-[#10264B] flex items-center space-x-2">
                <Layers className="w-4 h-4 text-[#F47716]" />
                <span>{editingLevel ? 'Edit Certification Level' : 'Create New Level'}</span>
              </h3>
              <button onClick={() => setShowLevelModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveLevel} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Level Name *</label>
                <input
                  type="text"
                  required
                  value={levelName}
                  onChange={(e) => setLevelName(e.target.value)}
                  placeholder="e.g. Expert Level"
                  className="w-full p-2.5 bg-slate-50 border rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Level Code</label>
                <input
                  type="text"
                  value={levelCode}
                  onChange={(e) => setLevelCode(e.target.value.toUpperCase())}
                  placeholder="e.g. EXP"
                  className="w-full p-2.5 bg-slate-50 border rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Default Exam Fee (₹ INR) *</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={levelDefaultFee}
                  onChange={(e) => setLevelDefaultFee(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border rounded-lg font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={levelDescription}
                  onChange={(e) => setLevelDescription(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Status</label>
                <select
                  value={levelStatus}
                  onChange={(e) => setLevelStatus(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border rounded-lg font-bold"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="flex items-center space-x-2 pt-3 border-t">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#F47716] hover:bg-[#DC660E] text-white font-bold rounded-lg cursor-pointer"
                >
                  {submitting ? 'Saving...' : editingLevel ? 'Update Level' : 'Create Level'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowLevelModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 font-bold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM ARCHIVE MODAL */}
      {archiveTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-gray-200">
            <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <Archive className="w-5 h-5" />
            </div>
            <div className="text-center">
              <h3 className="font-black text-sm text-[#10264B]">Archive Certification Program?</h3>
              <p className="text-xs text-gray-500 mt-1">
                "{archiveTarget.name}" ({archiveTarget.code}) will be hidden from candidate enrollment but preserved for certificate verification. You can restore it anytime.
              </p>
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <button
                type="button"
                onClick={handleArchiveCertification}
                disabled={submitting}
                className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                {submitting ? 'Archiving...' : 'Yes, Archive'}
              </button>
              <button
                type="button"
                onClick={() => setArchiveTarget(null)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
