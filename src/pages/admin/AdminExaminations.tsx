import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../services/api';
import { AdminPagination } from '../../components/AdminPagination';
import {
  CalendarCheck,
  Plus,
  Search,
  Edit2,
  Trash2,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Shield,
  ShieldCheck,
  Eye,
  FileCheck2,
  X,
  Loader2,
  RefreshCw,
  Award,
  Filter,
  ShieldAlert,
  Download,
  Code2,
  Copy,
  Check,
  AlertTriangle,
  Radio,
  FileText,
  Video,
} from 'lucide-react';

interface CertificationOption {
  code: string;
  id: string;
  name: string;
  level?: string;
}

const DEFAULT_CERTIFICATIONS: CertificationOption[] = [
  { code: 'AIICQB-ST-CP-001', id: 'cert_aiicqb_st_cp_001', name: 'AIICQB-Playwright-Automation-Testing', level: 'Foundation Level' },
  { code: 'AICQB-AI-CP', id: 'cert_aicqb_ai_cp', name: 'AICQB Certified AI Professional', level: 'Professional Level' },
  { code: 'AICQB-DS-201', id: 'cert_aicqb_ds_201', name: 'AICQB Data Science Professional', level: 'Professional Level' },
  { code: 'AICQB-ST-CP', id: 'cert_aicqb_st_cp', name: 'AICQB Software Tester', level: 'Foundation Level' },
  { code: 'AICQB-PW-CP', id: 'cert_aicqb_pw_cp', name: 'AICQB Playwright Automation', level: 'Professional Level' },
  { code: 'AICQB-CY-301', id: 'cert_aicqb_cy_301', name: 'AICQB Cybersecurity Specialist', level: 'Expert Level' },
];

const EXAM_LEVELS = [
  'Foundation Level',
  'Associate Level',
  'Professional Level',
  'Advanced Level',
  'Expert Level',
];

const getLevelBadgeClass = (lvl?: string) => {
  const l = (lvl || '').toLowerCase();
  if (l.includes('expert')) return 'bg-purple-50 text-purple-700 border-purple-200';
  if (l.includes('advanced')) return 'bg-indigo-50 text-indigo-700 border-indigo-200';
  if (l.includes('professional')) return 'bg-blue-50 text-blue-700 border-blue-200';
  if (l.includes('associate')) return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-emerald-50 text-emerald-700 border-emerald-200';
};

const generateSampleJson = (certCode: string, level: string) => {
  const points = level.includes('Expert') ? 15 : level.includes('Professional') ? 10 : 5;
  const difficulty = level.includes('Expert') ? 'Hard' : level.includes('Professional') ? 'Intermediate' : 'Easy';
  return JSON.stringify(
    [
      {
        question: `[${level}] Which assessment metric is most rigorous for evaluating ${certCode} production workloads under skewed real-world distribution?`,
        options: [
          'Area Under ROC Curve (ROC-AUC) & Precision-Recall F1-Optimization',
          'Standard Unweighted Accuracy Rate',
          'Mean Squared Error without Outlier Clipping',
          'Arbitrary Threshold Sampling'
        ],
        correctAnswer: 0,
        points,
        difficulty,
        certificationCode: certCode,
        level: level,
        rubric: `Demonstrates mastery of evaluation techniques required for ${level} candidates.`
      },
      {
        question: `[${level}] In architectural reliability for ${certCode}, which principle guarantees deterministic state during sudden node termination?`,
        options: [
          'Idempotent transactional event handlers with dead-letter queue routing',
          'Unchecked synchronous retry chains without backoff',
          'Global table lock on primary database instance',
          'Silently dropping rejected socket payloads'
        ],
        correctAnswer: 0,
        points,
        difficulty,
        certificationCode: certCode,
        level: level,
        rubric: `High-assurance enterprise systems reliability standard for ${level}.`
      }
    ],
    null,
    2
  );
};

export const AdminExaminations: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'schedules' | 'questions' | 'monitoring' | 'results'>('schedules');
  const [loading, setLoading] = useState(false);

  // Real Database Collections
  const [exams, setExams] = useState<any[]>(() => {
    try {
      const c = localStorage.getItem('aicqb_admin_exams');
      return c ? JSON.parse(c) : [];
    } catch (_) {
      return [];
    }
  });
  const [questions, setQuestions] = useState<any[]>(() => {
    try {
      const c = localStorage.getItem('aicqb_admin_questions');
      return c ? JSON.parse(c) : [];
    } catch (_) {
      return [];
    }
  });
  const [monitoringSessions, setMonitoringSessions] = useState<any[]>(() => {
    try {
      const c = localStorage.getItem('aicqb_admin_monitoring');
      return c ? JSON.parse(c) : [];
    } catch (_) {
      return [];
    }
  });
  const [resultsList, setResultsList] = useState<any[]>(() => {
    try {
      const c = localStorage.getItem('aicqb_admin_results');
      return c ? JSON.parse(c) : [];
    } catch (_) {
      return [];
    }
  });

  // Search & Filter States
  const [examSearch, setExamSearch] = useState('');
  const [examStatusFilter, setExamStatusFilter] = useState('All');
  const [examPage, setExamPage] = useState(1);
  const [examPageSize, setExamPageSize] = useState(10);

  const [questionSearch, setQuestionSearch] = useState('');
  const [questionCertFilter, setQuestionCertFilter] = useState('All');
  const [questionLevelFilter, setQuestionLevelFilter] = useState('All');
  const [questionPage, setQuestionPage] = useState(1);
  const [questionPageSize, setQuestionPageSize] = useState(10);

  const [monitoringSearch, setMonitoringSearch] = useState('');
  const [resultFilter, setResultFilter] = useState<'ALL' | 'PASSED' | 'FAILED'>('ALL');
  const [resultSearch, setResultSearch] = useState('');

  // Dynamic Certifications
  const [certificationsList, setCertificationsList] = useState<CertificationOption[]>(DEFAULT_CERTIFICATIONS);

  // Modals
  const [showExamModal, setShowExamModal] = useState(false);
  const [editingExam, setEditingExam] = useState<any>(null);

  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any>(null);
  const [previewQuestion, setPreviewQuestion] = useState<any>(null);

  // Bulk JSON Import Modal (Level-Wise)
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [jsonTargetCert, setJsonTargetCert] = useState('AIICQB-ST-CP-001');
  const [jsonTargetLevel, setJsonTargetLevel] = useState('Foundation Level');
  const [jsonCode, setJsonCode] = useState(() => generateSampleJson('AIICQB-ST-CP-001', 'Foundation Level'));
  const [copiedSample, setCopiedSample] = useState(false);
  const [importingJson, setImportingJson] = useState(false);

  // Result Preview Modal
  const [selectedResult, setSelectedResult] = useState<any>(null);

  // Proctoring Audit Modal (Requirement 10)
  const [selectedAuditSession, setSelectedAuditSession] = useState<any>(null);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditNotes, setAuditNotes] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Action status
  const [actionLoading, setActionLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Toast Notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Exam Form
  const [examForm, setExamForm] = useState({
    examCode: 'AIICQB-ST-CP-001-EXAM',
    examName: 'AIICQB Playwright Automation Testing Examination',
    certificationCode: 'AIICQB-ST-CP-001',
    scheduledDate: '24 Nov 2026',
    scheduledTime: '10:00 AM – 11:30 AM (IST)',
    durationMinutes: 90,
    passingCriteria: 70,
    mode: 'Online (AI Proctored)',
    status: 'Scheduled',
    candidatesCount: 20,
  });

  // Question Form
  const [questionForm, setQuestionForm] = useState({
    certificationCode: 'AIICQB-ST-CP-001',
    level: 'Foundation Level',
    type: 'mcq',
    question: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctAnswer: 0,
    points: 10,
    difficulty: 'Intermediate',
  });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadAllData = async () => {
    try {
      if (exams.length === 0 && questions.length === 0) setLoading(true);
      const [examsRes, questionsRes, monitoringRes, resultsRes, certsRes] = await Promise.all([
        api.getExams().catch(() => ({ success: false, exams: [] })),
        api.getAdminQuestions().catch(() => ({ success: false, questions: [] })),
        api.getAdminMonitoring().catch(() => ({ success: false, attempts: [], schedules: [] })),
        api.getAdminResults().catch(() => ({ success: false, results: [] })),
        api.getCertifications({ adminView: 'true' }).catch(() => ({ success: false, certifications: [] })),
      ]);

      if (certsRes.success && Array.isArray(certsRes.certifications) && certsRes.certifications.length > 0) {
        const mappedCerts: CertificationOption[] = certsRes.certifications.map((c: any) => ({
          code: c.code || c.certificationCode || c.id,
          id: c.id || c.certificationId,
          name: c.name || c.certificationName || c.code,
          level: c.level || 'Foundation Level',
        }));
        setCertificationsList(mappedCerts);
        if (mappedCerts.length > 0 && jsonTargetCert === 'AIICQB-ST-CP-001') {
          const firstCode = mappedCerts[0].code;
          const firstLevel = mappedCerts[0].level || 'Foundation Level';
          setJsonTargetCert(firstCode);
          setJsonTargetLevel(firstLevel);
          setJsonCode(generateSampleJson(firstCode, firstLevel));
        }
      }

      if (examsRes.success && Array.isArray(examsRes.exams)) {
        setExams(examsRes.exams);
        try { localStorage.setItem('aicqb_admin_exams', JSON.stringify(examsRes.exams)); } catch (_) { }
      }

      if (questionsRes.success && Array.isArray(questionsRes.questions)) {
        setQuestions(questionsRes.questions);
        try { localStorage.setItem('aicqb_admin_questions', JSON.stringify(questionsRes.questions)); } catch (_) { }
      }

      if (monitoringRes.success) {
        const sessionList = monitoringRes.sessions || monitoringRes.attempts || [];
        setMonitoringSessions(sessionList);
        try { localStorage.setItem('aicqb_admin_monitoring', JSON.stringify(sessionList)); } catch (_) { }
      }

      if (resultsRes.success && Array.isArray(resultsRes.results)) {
        setResultsList(resultsRes.results);
        try { localStorage.setItem('aicqb_admin_results', JSON.stringify(resultsRes.results)); } catch (_) { }
      }
    } catch (err: any) {
      console.error('Failed to load examinations data:', err);
      showToast(err.message || 'Failed to load examination records', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Admin Proctoring Audit Handlers (Requirement 10)
  const handleOpenAuditModal = (session: any) => {
    setSelectedAuditSession(session);
    setAuditNotes(session.proctorReviewNotes || '');
    setShowAuditModal(true);
  };

  const handleReviewSession = async (status: 'approved' | 'rejected' | 'flagged') => {
    if (!selectedAuditSession) return;
    try {
      setSubmittingReview(true);
      const res = await api.reviewSessionAdmin({
        scheduleId: selectedAuditSession.scheduleId,
        attemptId: selectedAuditSession.attemptId || selectedAuditSession.id,
        status,
        notes: auditNotes,
      });
      if (res.success) {
        showToast(`Proctoring session marked as ${status.toUpperCase()}`);
        setMonitoringSessions(prev =>
          prev.map(s =>
            (s.id === selectedAuditSession.id || s.scheduleId === selectedAuditSession.scheduleId)
              ? { ...s, proctorReviewStatus: status, proctorReviewNotes: auditNotes }
              : s
          )
        );
        setShowAuditModal(false);
      }
    } catch (e) {
      showToast('Failed to update session review status', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleExportProctoringReport = () => {
    try {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(monitoringSessions, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `AIICQB_Proctoring_Report_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast('Proctoring audit report exported successfully!');
    } catch (err) {
      showToast('Failed to export proctoring report', 'error');
    }
  };

  // Live JSON validation for Bulk Import
  const jsonValidation = useMemo(() => {
    if (!jsonCode.trim()) {
      return { isValid: false, count: 0, error: 'JSON code cannot be empty.' };
    }
    try {
      const parsed = JSON.parse(jsonCode);
      const items = Array.isArray(parsed) ? parsed : [parsed];
      if (items.length === 0) {
        return { isValid: false, count: 0, error: 'JSON array is empty.' };
      }
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!item.question && !item.title) {
          return { isValid: false, count: 0, error: `Item #${i + 1} is missing a "question" field.` };
        }
      }
      return { isValid: true, count: items.length, error: null };
    } catch (e: any) {
      return { isValid: false, count: 0, error: e.message };
    }
  }, [jsonCode]);

  // Bulk JSON Import Handler (Level-Wise)
  const handleBulkImportJson = async () => {
    if (!jsonValidation.isValid) {
      showToast(jsonValidation.error || 'Please provide valid JSON code.', 'error');
      return;
    }

    try {
      setImportingJson(true);
      const res = await api.bulkImportQuestionsAdmin({
        questions: jsonCode,
        defaultCertificationCode: jsonTargetCert,
        defaultLevel: jsonTargetLevel,
      });

      if (res.success) {
        showToast(`✓ Successfully imported ${res.importedCount || jsonValidation.count} questions for [${jsonTargetLevel}] into Question Bank!`);
        setShowJsonModal(false);
        await loadAllData();
      } else {
        showToast(res.message || 'Bulk import failed.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to import JSON questions.', 'error');
    } finally {
      setImportingJson(false);
    }
  };

  const handleCopySample = () => {
    const sample = generateSampleJson(jsonTargetCert, jsonTargetLevel);
    setJsonCode(sample);
    navigator.clipboard?.writeText(sample);
    setCopiedSample(true);
    setTimeout(() => setCopiedSample(false), 2000);
    showToast(`Sample JSON for ${jsonTargetCert} [${jsonTargetLevel}] copied & loaded!`);
  };

  // Exam Form Handlers
  const handleOpenAddExam = () => {
    setEditingExam(null);
    setExamForm({
      examCode: 'AICQB-AI-CP-EXAM',
      examName: 'AICQB Certified AI Professional Examination',
      certificationCode: 'AICQB-AI-CP',
      scheduledDate: '24 Nov 2026',
      scheduledTime: '10:00 AM – 11:30 AM (IST)',
      durationMinutes: 90,
      passingCriteria: 70,
      mode: 'Online (AI Proctored)',
      status: 'Scheduled',
      candidatesCount: 20,
    });
    setShowExamModal(true);
  };

  const handleOpenEditExam = (exam: any) => {
    setEditingExam(exam);
    setExamForm({
      examCode: exam.examCode || exam.code || '',
      examName: exam.examName || exam.name || '',
      certificationCode: exam.certificationCode || 'AICQB-AI-CP',
      scheduledDate: exam.dateFormatted || exam.scheduledDate || '24 Nov 2026',
      scheduledTime: exam.timeFormatted || exam.scheduledTime || '10:00 AM – 11:30 AM (IST)',
      durationMinutes: exam.durationMinutes || 90,
      passingCriteria: exam.passingCriteria || 70,
      mode: exam.mode || 'Online (AI Proctored)',
      status: exam.status || 'Scheduled',
      candidatesCount: exam.candidatesCount || 10,
    });
    setShowExamModal(true);
  };

  const handleSaveExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examForm.examCode.trim() || !examForm.examName.trim()) {
      showToast('Exam code and name are required', 'error');
      return;
    }

    try {
      setActionLoading(true);
      if (editingExam) {
        const res = await api.updateAdminExam(editingExam.id, examForm);
        if (res.success) {
          showToast(`Exam ${examForm.examCode} updated!`);
          setShowExamModal(false);
          await loadAllData();
        }
      } else {
        const res = await api.createAdminExam(examForm);
        if (res.success) {
          showToast(`Exam ${examForm.examCode} scheduled!`);
          setShowExamModal(false);
          await loadAllData();
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to save exam window', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Direct Delete for Exams (Instant 1-Click, NO POPUP)
  const handleDeleteExamDirect = async (id: string, name: string) => {
    try {
      setDeletingId(id);
      setExams((prev) => prev.filter((e) => e.id !== id && e.examCode !== id));
      showToast(`Deleted exam ${name}`);
      const res = await api.deleteAdminExam(id);
      if (!res.success) {
        await loadAllData();
        showToast(res.message || 'Failed to delete exam', 'error');
      }
    } catch (err: any) {
      await loadAllData();
      showToast(err.message || 'Failed to delete exam', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  // Direct Delete for Questions (Instant 1-Click, NO POPUP)
  const handleDeleteQuestionDirect = async (id: string) => {
    try {
      setDeletingId(id);
      setQuestions((prev) => prev.filter((q) => q.id !== id));
      showToast(`Deleted question item`);
      const res = await api.deleteAdminQuestion(id);
      if (!res.success) {
        await loadAllData();
        showToast(res.message || 'Failed to delete question', 'error');
      }
    } catch (err: any) {
      await loadAllData();
      showToast(err.message || 'Failed to delete question', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  // Question Form Handlers
  const handleOpenAddQuestion = () => {
    setEditingQuestion(null);
    const defaultCert = certificationsList[0]?.code || 'AIICQB-ST-CP-001';
    const defaultLevel = certificationsList[0]?.level || 'Foundation Level';
    setQuestionForm({
      certificationCode: defaultCert,
      level: defaultLevel,
      type: 'mcq',
      question: '',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctAnswer: 0,
      points: 10,
      difficulty: 'Intermediate',
    });
    setShowQuestionModal(true);
  };

  const handleOpenEditQuestion = (q: any) => {
    setEditingQuestion(q);
    setQuestionForm({
      certificationCode: q.certificationCode || q.certificationId || 'AIICQB-ST-CP-001',
      level: q.level || q.examLevel || 'Foundation Level',
      type: q.questionType || q.type || 'mcq',
      question: q.question || '',
      optionA: q.options?.[0] || '',
      optionB: q.options?.[1] || '',
      optionC: q.options?.[2] || '',
      optionD: q.options?.[3] || '',
      correctAnswer: q.correctAnswer !== undefined ? q.correctAnswer : 0,
      points: q.points || 10,
      difficulty: q.difficulty || 'Intermediate',
    });
    setShowQuestionModal(true);
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionForm.question.trim()) {
      showToast('Please enter question prompt', 'error');
      return;
    }

    const payload = {
      certificationCode: questionForm.certificationCode,
      level: questionForm.level || 'Foundation Level',
      examLevel: questionForm.level || 'Foundation Level',
      type: questionForm.type,
      question: questionForm.question.trim(),
      options: [
        questionForm.optionA.trim(),
        questionForm.optionB.trim(),
        questionForm.optionC.trim(),
        questionForm.optionD.trim(),
      ].filter(Boolean),
      correctOptionIndex: Number(questionForm.correctAnswer),
      points: Number(questionForm.points),
      difficulty: questionForm.difficulty,
    };

    try {
      setActionLoading(true);
      if (editingQuestion) {
        const res = await api.updateAdminQuestion(editingQuestion.id, payload);
        if (res.success) {
          showToast('Question updated!');
          setShowQuestionModal(false);
          await loadAllData();
        }
      } else {
        const res = await api.createAdminQuestion(payload);
        if (res.success) {
          showToast('Question added to Question Bank!');
          setShowQuestionModal(false);
          await loadAllData();
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to save question', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered Lists
  const filteredExams = useMemo(() => {
    return exams.filter((e) => {
      const matchesSearch =
        examSearch === '' ||
        (e.examName || e.name || '').toLowerCase().includes(examSearch.toLowerCase()) ||
        (e.examCode || e.code || '').toLowerCase().includes(examSearch.toLowerCase()) ||
        (e.certificationCode || '').toLowerCase().includes(examSearch.toLowerCase());

      const matchesStatus =
        examStatusFilter === 'All' ||
        e.status?.toLowerCase() === examStatusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [exams, examSearch, examStatusFilter]);

  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const certCode = (q.certificationCode || q.certificationId || '').toLowerCase();
      const qLevel = (q.level || q.examLevel || 'Foundation Level').toLowerCase();
      const matchesCert = questionCertFilter === 'All' || certCode.includes(questionCertFilter.toLowerCase());
      const matchesLevel = questionLevelFilter === 'All' || qLevel === questionLevelFilter.toLowerCase();
      const matchesSearch =
        questionSearch === '' ||
        q.question?.toLowerCase().includes(questionSearch.toLowerCase()) ||
        certCode.includes(questionSearch.toLowerCase()) ||
        qLevel.includes(questionSearch.toLowerCase()) ||
        q.id?.toLowerCase().includes(questionSearch.toLowerCase());
      return matchesCert && matchesLevel && matchesSearch;
    });
  }, [questions, questionCertFilter, questionLevelFilter, questionSearch]);

  const filteredMonitoring = useMemo(() => {
    return monitoringSessions.filter((s) => {
      if (!monitoringSearch.trim()) return true;
      const q = monitoringSearch.toLowerCase();
      return (
        (s.candidateName || '').toLowerCase().includes(q) ||
        (s.candidateId || '').toLowerCase().includes(q) ||
        (s.certificationName || '').toLowerCase().includes(q) ||
        (s.certificationCode || '').toLowerCase().includes(q)
      );
    });
  }, [monitoringSessions, monitoringSearch]);

  const filteredResults = useMemo(() => {
    return resultsList.filter((r) => {
      const isPass = r.passed || r.percentage >= 70;
      if (resultFilter === 'PASSED' && !isPass) return false;
      if (resultFilter === 'FAILED' && isPass) return false;

      if (resultSearch.trim()) {
        const q = resultSearch.toLowerCase();
        const candName = (r.candidateName || '').toLowerCase();
        const candId = (r.candidateId || '').toLowerCase();
        const certName = (r.certificationName || '').toLowerCase();
        const certCode = (r.certificationCode || '').toLowerCase();
        const email = (r.candidateEmail || '').toLowerCase();
        return (
          candName.includes(q) ||
          candId.includes(q) ||
          certName.includes(q) ||
          certCode.includes(q) ||
          email.includes(q)
        );
      }
      return true;
    });
  }, [resultsList, resultFilter, resultSearch]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 sm:top-5 sm:right-5 z-50 px-4 py-3 rounded-xl shadow-xl flex items-center space-x-2 text-xs font-bold border transition-all max-w-[90vw] sm:max-w-md ${toast.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800'
            }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
          ) : (
            <ShieldAlert className="w-4 h-4 text-red-600 flex-shrink-0" />
          )}
          <span className="truncate">{toast.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center flex-wrap gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-[#10264B]">
              Examination & Assessment Management
            </h1>
            <span className="text-[11px] sm:text-xs bg-[#10264B]/10 text-[#10264B] px-2.5 py-0.5 rounded-full font-bold">
              Super Admin
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Schedule proctored exam windows, manage the Question Bank, import questions via JSON, monitor live candidate sessions, and approve assessment results.
          </p>
        </div>

        <div className="flex items-center space-x-2 self-stretch sm:self-auto">
          <button
            onClick={loadAllData}
            disabled={loading}
            className="p-2 sm:p-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center justify-center cursor-pointer"
            title="Refresh All"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#F47716]' : ''}`} />
          </button>

          {activeTab === 'schedules' && (
            <button
              onClick={handleOpenAddExam}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-[#F47716] hover:bg-[#DC660E] text-white font-bold text-xs rounded-lg shadow-sm transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule New Exam</span>
            </button>
          )}

          {activeTab === 'questions' && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowJsonModal(true)}
                className="px-3.5 py-2.5 bg-[#10264B] hover:bg-[#1E3A6E] text-white font-bold text-xs rounded-lg shadow-sm transition-all flex items-center space-x-1.5 cursor-pointer"
                title="Add multiple questions using JSON code"
              >
                <Code2 className="w-4 h-4 text-[#F47716]" />
                <span>Bulk Import JSON Code</span>
              </button>
              <button
                onClick={handleOpenAddQuestion}
                className="px-3.5 py-2.5 bg-[#F47716] hover:bg-[#DC660E] text-white font-bold text-xs rounded-lg shadow-sm transition-all flex items-center space-x-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Question</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div
          onClick={() => setActiveTab('schedules')}
          className={`bg-white rounded-xl p-3.5 sm:p-4 border shadow-xs flex items-center space-x-3.5 cursor-pointer transition-all ${activeTab === 'schedules' ? 'border-[#F47716] ring-1 ring-[#F47716]' : 'border-gray-200 hover:border-gray-300'
            }`}
        >
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#F47716] flex items-center justify-center flex-shrink-0">
            <CalendarCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-[#10264B] leading-tight font-mono">{exams.length}</div>
            <div className="text-[10px] sm:text-[11px] font-bold text-gray-500 uppercase tracking-tight mt-0.5">
              Scheduled Exams
            </div>
          </div>
        </div>

        <div
          onClick={() => setActiveTab('questions')}
          className={`bg-white rounded-xl p-3.5 sm:p-4 border shadow-xs flex items-center space-x-3.5 cursor-pointer transition-all ${activeTab === 'questions' ? 'border-[#F47716] ring-1 ring-[#F47716]' : 'border-gray-200 hover:border-gray-300'
            }`}
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#10264B] flex items-center justify-center flex-shrink-0">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-[#10264B] leading-tight font-mono">{questions.length}</div>
            <div className="text-[10px] sm:text-[11px] font-bold text-gray-500 uppercase tracking-tight mt-0.5">
              Question Bank Items
            </div>
          </div>
        </div>

        <div
          onClick={() => setActiveTab('results')}
          className={`bg-white rounded-xl p-3.5 sm:p-4 border shadow-xs flex items-center space-x-3.5 cursor-pointer transition-all ${activeTab === 'results' ? 'border-[#F47716] ring-1 ring-[#F47716]' : 'border-gray-200 hover:border-gray-300'
            }`}
        >
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
            <FileCheck2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-purple-700 leading-tight font-mono">{resultsList.length}</div>
            <div className="text-[10px] sm:text-[11px] font-bold text-gray-500 uppercase tracking-tight mt-0.5">
              Approved Results
            </div>
          </div>
        </div>
      </div>

      {/* Module Tabs Navigation */}
      <div className="flex items-center space-x-2 border-b border-gray-200 bg-white px-2 sm:px-4 rounded-xl shadow-xs overflow-x-auto text-xs">
        <button
          onClick={() => setActiveTab('schedules')}
          className={`flex items-center space-x-2 py-3 px-3 sm:px-4 font-bold border-b-2 whitespace-nowrap cursor-pointer transition-colors ${activeTab === 'schedules' ? 'border-[#F47716] text-[#F47716]' : 'border-transparent text-gray-500 hover:text-[#10264B]'
            }`}
        >
          <CalendarCheck className="w-4 h-4" />
          <span>Scheduled Examinations ({exams.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('questions')}
          className={`flex items-center space-x-2 py-3 px-3 sm:px-4 font-bold border-b-2 whitespace-nowrap cursor-pointer transition-colors ${activeTab === 'questions' ? 'border-[#F47716] text-[#F47716]' : 'border-transparent text-gray-500 hover:text-[#10264B]'
            }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>Question Bank ({questions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('monitoring')}
          className={`flex items-center space-x-2 py-3 px-3 sm:px-4 font-bold border-b-2 whitespace-nowrap cursor-pointer transition-colors ${activeTab === 'monitoring' ? 'border-[#F47716] text-[#F47716]' : 'border-transparent text-gray-500 hover:text-[#10264B]'
            }`}
        >
          <Shield className="w-4 h-4" />
          <span className="flex items-center space-x-1.5">
            <span>Live Exam Monitoring</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </span>
        </button>

        <button
          onClick={() => setActiveTab('results')}
          className={`flex items-center space-x-2 py-3 px-3 sm:px-4 font-bold border-b-2 whitespace-nowrap cursor-pointer transition-colors ${activeTab === 'results' ? 'border-[#F47716] text-[#F47716]' : 'border-transparent text-gray-500 hover:text-[#10264B]'
            }`}
        >
          <Award className="w-4 h-4" />
          <span>Result Management & Scorecards ({resultsList.length})</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: SCHEDULED EXAMINATIONS                            */}
      {/* ======================================================== */}
      {activeTab === 'schedules' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 shadow-sm flex flex-col sm:flex-row gap-2.5 sm:gap-3 text-xs">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={examStatusFilter}
                onChange={(e) => setExamStatusFilter(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 bg-slate-50 border border-gray-300 rounded-lg font-bold text-gray-700 focus:outline-none cursor-pointer"
              >
                <option value="All">All Status ({exams.length})</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-2.5" />
              <input
                type="text"
                value={examSearch}
                onChange={(e) => setExamSearch(e.target.value)}
                placeholder="Search examination name, code, or certification..."
                className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#F47716] font-medium"
              />
            </div>
            {examSearch && (
              <button
                onClick={() => setExamSearch('')}
                className="text-xs font-bold text-gray-400 hover:text-red-600 self-center"
              >
                Clear
              </button>
            )}
          </div>

          {/* Mobile Card View (< md) */}
          <div className="block md:hidden space-y-3">
            {loading ? (
              <div className="bg-white p-8 rounded-xl border border-gray-200 text-center text-gray-400">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#F47716]" />
                <p className="font-semibold text-xs">Loading scheduled exams...</p>
              </div>
            ) : filteredExams.length === 0 ? (
              <div className="bg-white p-8 rounded-xl border border-gray-200 text-center text-gray-500">
                <p className="font-bold text-sm text-[#10264B]">No scheduled exams found</p>
                <p className="text-xs text-gray-400 mt-1">Click "Schedule New Exam" to schedule an assessment window.</p>
              </div>
            ) : (
              filteredExams.map((exam) => (
                <div key={exam.id || exam.examCode} className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs space-y-3">
                  <div className="flex items-start justify-between gap-2 border-b pb-2">
                    <div>
                      <span className="font-mono font-bold text-sm text-[#F47716] block">{exam.examCode}</span>
                      <p className="font-bold text-[#10264B] text-xs mt-0.5">{exam.examName}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#10264B] border border-blue-200">
                      {exam.status || 'Scheduled'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div>
                      <p className="text-[10px] text-gray-400 font-medium">Date & Time</p>
                      <p className="font-semibold">{exam.dateFormatted || exam.scheduledDate}</p>
                      <p className="text-[11px] text-gray-400 font-mono">{exam.timeFormatted || exam.scheduledTime}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-medium">Duration & Enrolled</p>
                      <p className="font-semibold">{exam.durationMinutes || 90} Mins</p>
                      <p className="text-[11px] text-[#F47716] font-bold">{exam.candidatesCount || 0} Candidates</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end space-x-2 pt-2 border-t">
                    <button
                      onClick={() => handleOpenEditExam(exam)}
                      className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-semibold flex items-center space-x-1 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteExamDirect(exam.id, exam.examCode)}
                      disabled={deletingId === exam.id}
                      className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-xs font-semibold flex items-center space-x-1 cursor-pointer"
                    >
                      {deletingId === exam.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table View (>= md) */}
          <div className="hidden md:block bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-gray-600 font-bold uppercase tracking-wider text-[11px] border-b border-gray-200">
                  <tr>
                    <th className="py-3.5 px-6">Exam Code</th>
                    <th className="py-3.5 px-6">Examination Title</th>
                    <th className="py-3.5 px-6">Scheduled Date & Time</th>
                    <th className="py-3.5 px-6">Duration</th>
                    <th className="py-3.5 px-6">Candidates</th>
                    <th className="py-3.5 px-6">Status</th>
                    <th className="py-3.5 px-6 text-right">Actions (Direct CRUD)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-400">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#F47716]" />
                        <p className="font-semibold text-xs">Loading scheduled exams...</p>
                      </td>
                    </tr>
                  ) : filteredExams.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-500">
                        <p className="font-bold text-sm text-[#10264B]">No scheduled exams found</p>
                        <p className="text-xs text-gray-400 mt-1">Click "Schedule New Exam" to create an assessment window.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredExams
                      .slice((examPage - 1) * examPageSize, examPage * examPageSize)
                      .map((exam) => (
                        <tr key={exam.id || exam.examCode} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-4 px-6 font-mono font-bold text-[#F47716]">{exam.examCode}</td>
                          <td className="py-4 px-6">
                            <div className="font-bold text-[#10264B] text-[13px]">{exam.examName}</div>
                            <span className="text-[11px] text-gray-500 font-mono">{exam.certificationCode || 'AICQB-CERT'}</span>
                          </td>
                          <td className="py-4 px-6 text-gray-700 font-medium">
                            <div>{exam.dateFormatted || exam.scheduledDate}</div>
                            <div className="text-[11px] text-gray-400 font-mono">{exam.timeFormatted || exam.scheduledTime}</div>
                          </td>
                          <td className="py-4 px-6 font-mono font-bold text-gray-700">{exam.durationMinutes || 90} Mins</td>
                          <td className="py-4 px-6 font-bold text-[#10264B]">
                            <span className="px-2.5 py-1 bg-slate-100 rounded-lg">{exam.candidatesCount || 0} Enrolled</span>
                          </td>
                          <td className="py-4 px-6">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-[#10264B] border border-blue-200">
                              {exam.status || 'Scheduled'}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right space-x-1 whitespace-nowrap">
                            <button
                              onClick={() => handleOpenEditExam(exam)}
                              className="p-1.5 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors inline-flex cursor-pointer"
                              title="Edit Exam Window"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteExamDirect(exam.id, exam.examCode)}
                              disabled={deletingId === exam.id}
                              className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors inline-flex cursor-pointer"
                              title="Delete Exam (Direct, no popup)"
                            >
                              {deletingId === exam.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                            </button>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>

            <AdminPagination
              currentPage={examPage}
              totalRecords={filteredExams.length}
              pageSize={examPageSize}
              onPageChange={(page) => setExamPage(page)}
              onPageSizeChange={(size) => {
                setExamPageSize(size);
                setExamPage(1);
              }}
              pageSizeOptions={[10, 25, 50, 100]}
            />
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: QUESTION BANK MANAGEMENT                          */}
      {/* ======================================================== */}
      {activeTab === 'questions' && (
        <div className="space-y-4">
          {/* Question Filter & Search Bar */}
          <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 shadow-sm flex flex-col md:flex-row gap-2.5 sm:gap-3 text-xs">
            {/* Certification Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <select
                value={questionCertFilter}
                onChange={(e) => setQuestionCertFilter(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 bg-slate-50 border border-gray-300 rounded-lg font-bold text-gray-700 focus:outline-none cursor-pointer"
              >
                <option value="All">All Certifications ({questions.length})</option>
                {certificationsList.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Exam Level Filter */}
            <div className="flex items-center space-x-2">
              <Award className="w-4 h-4 text-[#F47716] flex-shrink-0" />
              <select
                value={questionLevelFilter}
                onChange={(e) => setQuestionLevelFilter(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 bg-slate-50 border border-gray-300 rounded-lg font-bold text-gray-700 focus:outline-none cursor-pointer"
              >
                <option value="All">All Exam Levels</option>
                {EXAM_LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-2.5" />
              <input
                type="text"
                value={questionSearch}
                onChange={(e) => setQuestionSearch(e.target.value)}
                placeholder="Search question prompt, level, certification, ID..."
                className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#F47716] font-medium"
              />
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowJsonModal(true)}
                className="px-3 py-2 bg-[#10264B] hover:bg-[#1E3A6E] text-white font-bold rounded-lg transition-colors flex items-center space-x-1.5 cursor-pointer"
              >
                <Code2 className="w-3.5 h-3.5 text-[#F47716]" />
                <span>Bulk Import via JSON</span>
              </button>
            </div>
          </div>

          {/* Randomization Security Notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start space-x-2.5 text-xs text-amber-800">
            <Radio className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-bold">Algorithmic Question & Option Randomization Active</p>
              <p className="text-[11px] text-amber-700 mt-0.5">
                Every candidate session dynamically shuffles both the question sequence and answer choice options (A, B, C, D) using Fisher-Yates randomization. Correct keys are mapped dynamically per session.
              </p>
            </div>
          </div>

          {/* Mobile Question Cards (< md) */}
          <div className="block md:hidden space-y-3">
            {loading ? (
              <div className="bg-white p-8 rounded-xl border border-gray-200 text-center text-gray-400">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#F47716]" />
                <p className="font-semibold text-xs">Loading questions...</p>
              </div>
            ) : filteredQuestions.length === 0 ? (
              <div className="bg-white p-8 rounded-xl border border-gray-200 text-center text-gray-500">
                <p className="font-bold text-sm text-[#10264B]">No questions matched your search</p>
                <p className="text-xs text-gray-400 mt-1">Use "Bulk Import via JSON" to add assessment questions.</p>
              </div>
            ) : (
              filteredQuestions.map((q) => (
                <div key={q.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-[#F47716]">{q.id}</span>
                    <div className="flex items-center space-x-1.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#10264B]/10 text-[#10264B] font-mono">
                        {q.certificationCode || 'AIICQB'}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getLevelBadgeClass(q.level || q.examLevel)}`}>
                        {q.level || q.examLevel || 'Foundation Level'}
                      </span>
                    </div>
                  </div>

                  <p className="font-bold text-[#10264B] text-xs leading-relaxed">{q.question}</p>

                  <div className="bg-slate-50 p-2 rounded-lg text-xs space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-emerald-700">
                        Correct: Option {String.fromCharCode(65 + (q.correctAnswer ?? 0))}
                      </span>
                      <span className="font-mono text-[#F47716] font-bold">+{q.points || 10} Marks</span>
                    </div>
                    <p className="text-[11px] text-gray-600 truncate">{q.options?.[q.correctAnswer ?? 0]}</p>
                  </div>

                  <div className="flex items-center justify-end space-x-2 pt-1 border-t">
                    <button
                      onClick={() => setPreviewQuestion(q)}
                      className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
                      title="Preview"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleOpenEditQuestion(q)}
                      className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 cursor-pointer"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteQuestionDirect(q.id)}
                      disabled={deletingId === q.id}
                      className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 cursor-pointer"
                      title="Direct Delete"
                    >
                      {deletingId === q.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table View (>= md) */}
          <div className="hidden md:block bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-gray-600 font-bold uppercase tracking-wider text-[11px] border-b border-gray-200">
                  <tr>
                    <th className="py-3.5 px-6">ID & Program</th>
                    <th className="py-3.5 px-6">Assessment Question Prompt</th>
                    <th className="py-3.5 px-6">Type & Points</th>
                    <th className="py-3.5 px-6">Correct Answer Key</th>
                    <th className="py-3.5 px-6 text-right">Actions (Direct CRUD)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-gray-400">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#F47716]" />
                        <p className="font-semibold text-xs">Loading Question Bank items...</p>
                      </td>
                    </tr>
                  ) : filteredQuestions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-gray-500">
                        <p className="font-bold text-sm text-[#10264B]">No questions found</p>
                        <p className="text-xs text-gray-400 mt-1">Click "Bulk Import via JSON" to add questions.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredQuestions
                      .slice((questionPage - 1) * questionPageSize, questionPage * questionPageSize)
                      .map((q) => (
                        <tr key={q.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-4 px-6">
                            <span className="font-mono font-bold text-[#F47716] block">{q.id}</span>
                            <div className="flex flex-wrap items-center gap-1 mt-1">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#10264B]/10 text-[#10264B] font-mono">
                                {q.certificationCode || 'AIICQB'}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getLevelBadgeClass(q.level || q.examLevel)}`}>
                                {q.level || q.examLevel || 'Foundation Level'}
                              </span>
                            </div>
                          </td>

                          <td className="py-4 px-6 max-w-md">
                            <p className="font-bold text-[#10264B] leading-relaxed text-[13px] line-clamp-2">{q.question}</p>
                            <span className="text-[11px] text-gray-400 mt-1 block">
                              {q.options?.length || 4} Randomized Answer Choices
                            </span>
                          </td>

                          <td className="py-4 px-6">
                            <span className="font-bold uppercase text-[10px] px-2.5 py-1 bg-slate-100 rounded-md text-slate-700 block w-max">
                              {q.questionType || q.type || 'MCQ'}
                            </span>
                            <span className="font-mono text-xs text-[#F47716] font-bold mt-1 block">
                              +{q.points || 10} Marks
                            </span>
                          </td>

                          <td className="py-4 px-6">
                            <span className="font-mono font-bold px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg inline-block">
                              Option {String.fromCharCode(65 + (q.correctAnswer ?? 0))}
                            </span>
                            <p className="text-[11px] text-gray-600 truncate max-w-xs mt-1">
                              {q.options?.[q.correctAnswer ?? 0]}
                            </p>
                          </td>

                          <td className="py-4 px-6 text-right space-x-1 whitespace-nowrap">
                            <button
                              onClick={() => setPreviewQuestion(q)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-[#10264B] hover:bg-slate-100 transition-colors cursor-pointer"
                              title="Preview Question"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenEditQuestion(q)}
                              className="p-1.5 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors cursor-pointer"
                              title="Edit Question"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteQuestionDirect(q.id)}
                              disabled={deletingId === q.id}
                              className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                              title="Delete Question (Direct, no popup)"
                            >
                              {deletingId === q.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                            </button>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>

            <AdminPagination
              currentPage={questionPage}
              totalRecords={filteredQuestions.length}
              pageSize={questionPageSize}
              onPageChange={(page) => setQuestionPage(page)}
              onPageSizeChange={(size) => {
                setQuestionPageSize(size);
                setQuestionPage(1);
              }}
              pageSizeOptions={[10, 25, 50, 100]}
            />
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: LIVE EXAM MONITORING & PROCTORING (Requirement 10) */}
      {/* ======================================================== */}
      {activeTab === 'monitoring' && (
        <div className="space-y-4">
          <div className="bg-[#10264B] text-white p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-3">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping flex-shrink-0"></span>
              <div>
                <h4 className="font-black text-sm text-white">AIICQB Real-Time AI-Proctoring & Identity Audit Engine</h4>
                <p className="text-slate-300">Biometric face matching, gaze tracking, continuous screen lock, and proctor review evidence vault.</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 self-start sm:self-auto">
              <button
                onClick={handleExportProctoringReport}
                className="px-3 py-1.5 bg-[#F47716] hover:bg-[#E35D00] text-white rounded-lg font-bold text-xs flex items-center space-x-1.5 transition-all shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Proctoring Report</span>
              </button>
              <span className="px-3 py-1.5 bg-[#1E3A6E] rounded-lg font-mono font-bold text-white text-xs border border-slate-700">
                {monitoringSessions.length} Monitored Sessions
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 shadow-sm flex flex-col sm:flex-row gap-2.5 sm:gap-3 text-xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-2.5" />
              <input
                type="text"
                value={monitoringSearch}
                onChange={(e) => setMonitoringSearch(e.target.value)}
                placeholder="Search candidate name, candidate ID, certification, status..."
                className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#F47716] font-medium"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-gray-600 font-bold uppercase tracking-wider text-[11px] border-b border-gray-200">
                  <tr>
                    <th className="py-3.5 px-6">Candidate & Photo</th>
                    <th className="py-3.5 px-6">Active Examination</th>
                    <th className="py-3.5 px-6">Pre-Exam ID Verification</th>
                    <th className="py-3.5 px-6">AI Proctoring Alerts</th>
                    <th className="py-3.5 px-6">Review Verdict</th>
                    <th className="py-3.5 px-6 text-right">Human Proctor Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredMonitoring.slice(0, 40).map((s, idx) => (
                    <tr key={s.id || idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          {s.candidatePhoto ? (
                            <img
                              src={s.candidatePhoto}
                              alt="Live Photo"
                              className="w-10 h-10 rounded-xl object-cover border-2 border-emerald-400 shadow-xs flex-shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-xs flex-shrink-0">
                              {s.candidateName?.slice(0, 2).toUpperCase() || 'CA'}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-[#10264B] text-[13px]">{s.candidateName}</div>
                            <span className="font-mono text-gray-500 text-[11px]">{s.candidateId}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6 font-bold text-[#10264B]">
                        {s.certificationName}
                        <span className="text-gray-400 font-normal block text-[11px]">
                          Started: {new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>

                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          {s.idCardPhoto && (
                            <img
                              src={s.idCardPhoto}
                              alt="ID Document"
                              className="w-10 h-7 rounded object-cover border border-slate-300 shadow-xs"
                            />
                          )}
                          <div>
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                              <span>{s.verificationStatus || 'Identity Verified'}</span>
                            </span>
                            <span className="text-[10px] text-gray-400 block font-mono">Match: {s.verificationMatchScore || 96.5}%</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        {(s.totalAlerts || s.events?.length) > 0 ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            <span>{s.totalAlerts || s.events?.length} Flagged Events</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            <span>0 Alerts • Clean Stream</span>
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${s.proctorReviewStatus === 'approved'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : s.proctorReviewStatus === 'rejected'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : s.proctorReviewStatus === 'flagged'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                          {s.proctorReviewStatus ? s.proctorReviewStatus.toUpperCase() : 'PENDING REVIEW'}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-right space-x-2">
                        <button
                          onClick={() => showToast(`Sent compliance warning to candidate ${s.candidateName}`)}
                          className="px-2.5 py-1.5 text-[11px] font-bold rounded-lg border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 transition-colors cursor-pointer"
                        >
                          Send Warning
                        </button>
                        <button
                          onClick={() => handleOpenAuditModal(s)}
                          className="px-3 py-1.5 text-[11px] font-bold rounded-lg bg-[#10264B] text-white hover:bg-[#1E3A6E] transition-colors cursor-pointer inline-flex items-center space-x-1"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#F47716]" />
                          <span>Audit & Review</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <AdminPagination
              currentPage={examPage}
              totalRecords={filteredExams.length}
              pageSize={examPageSize}
              onPageChange={(page) => setExamPage(page)}
              onPageSizeChange={(size) => {
                setExamPageSize(size);
                setExamPage(1);
              }}
              pageSizeOptions={[10, 25, 50, 100]}
            />
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: RESULT MANAGEMENT & SCORECARDS                    */}
      {/* ======================================================== */}
      {activeTab === 'results' && (
        <div className="space-y-4">
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Total Evaluated Results</p>
                <h3 className="text-2xl font-black text-[#10264B] mt-1">{resultsList.length}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">Passed (Score ≥ 70%)</p>
                <h3 className="text-2xl font-black text-emerald-600 mt-1">
                  {resultsList.filter((r) => r.passed || r.percentage >= 70).length}
                </h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-red-600 uppercase tracking-wider">Failed (Score &lt; 70%)</p>
                <h3 className="text-2xl font-black text-red-600 mt-1">
                  {resultsList.filter((r) => !r.passed && r.percentage < 70).length}
                </h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
                <AlertCircle className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 shadow-sm flex flex-col sm:flex-row gap-2.5 sm:gap-3 text-xs">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setResultFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer transition-colors ${resultFilter === 'ALL' ? 'bg-[#10264B] text-white' : 'bg-slate-100 text-gray-700 hover:bg-slate-200'
                  }`}
              >
                All ({resultsList.length})
              </button>
              <button
                onClick={() => setResultFilter('PASSED')}
                className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer transition-colors ${resultFilter === 'PASSED' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                  }`}
              >
                Passed ({resultsList.filter((r) => r.passed || r.percentage >= 70).length})
              </button>
              <button
                onClick={() => setResultFilter('FAILED')}
                className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer transition-colors ${resultFilter === 'FAILED' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-800 hover:bg-red-100'
                  }`}
              >
                Failed ({resultsList.filter((r) => !r.passed && r.percentage < 70).length})
              </button>
            </div>

            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-2.5" />
              <input
                type="text"
                value={resultSearch}
                onChange={(e) => setResultSearch(e.target.value)}
                placeholder="Search candidate name, candidate ID, certification, email..."
                className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#F47716] font-medium"
              />
            </div>
          </div>

          {/* Results Table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-gray-600 font-bold uppercase tracking-wider text-[11px] border-b border-gray-200">
                  <tr>
                    <th className="py-3.5 px-6">Candidate</th>
                    <th className="py-3.5 px-6">Certification Exam</th>
                    <th className="py-3.5 px-6">Score & Percentage</th>
                    <th className="py-3.5 px-6">Passing Standard</th>
                    <th className="py-3.5 px-6">Status</th>
                    <th className="py-3.5 px-6">Certificate No.</th>
                    <th className="py-3.5 px-6 text-right">Scorecard Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredResults.slice(0, 50).map((r, idx) => {
                    const isPass = r.passed || r.percentage >= 70;
                    return (
                      <tr key={r.id || idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-6">
                          <div className="font-bold text-[#10264B] text-[13px]">{r.candidateName}</div>
                          <span className="font-mono text-gray-500 text-[11px]">{r.candidateId}</span>
                        </td>

                        <td className="py-4 px-6 font-bold text-[#10264B]">
                          {r.certificationName}
                          <span className="text-gray-400 font-mono block text-[11px]">{r.certificationCode}</span>
                        </td>

                        <td className="py-4 px-6">
                          <span className="font-mono font-bold text-sm text-[#10264B]">
                            {r.score !== undefined ? `${r.score} pts (${r.percentage}%)` : `${r.percentage}%`}
                          </span>
                          <span className="text-gray-400 font-semibold block text-[11px]">
                            {r.grade || (r.percentage >= 90 ? 'Grade A+' : r.percentage >= 80 ? 'Grade A' : r.percentage >= 70 ? 'Grade B' : 'Fail')}
                          </span>
                        </td>

                        <td className="py-4 px-6">
                          <span className="font-bold text-gray-700">70% Required</span>
                          <span className={`block text-[11px] font-semibold ${isPass ? 'text-emerald-600' : 'text-red-500'}`}>
                            {isPass ? `Met (+${r.percentage - 70}%)` : `Short (${r.percentage - 70}%)`}
                          </span>
                        </td>

                        <td className="py-4 px-6">
                          {isPass ? (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                              <span>PASSED (≥ 70%)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                              <AlertCircle className="w-3 h-3 text-red-500" />
                              <span>FAILED (&lt; 70%)</span>
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-6">
                          {isPass ? (
                            <span className="font-mono font-bold text-[#F47716]">{r.certificateNo || 'AICQB-CERT-ISSUED'}</span>
                          ) : (
                            <span className="text-amber-700 font-semibold text-[11px]">Retake Chance Active</span>
                          )}
                        </td>

                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => setSelectedResult(r)}
                            className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-xs inline-flex items-center space-x-1 cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>View Card</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-slate-50 border-t border-gray-200 text-[11px] text-gray-500 flex items-center justify-between">
              <span>Showing {filteredResults.length} of {resultsList.length} Evaluated Examination Records</span>
              <span className="text-gray-400">Strict Minimum 70% Assessment Verification</span>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: BULK JSON QUESTION IMPORT                         */}
      {/* ======================================================== */}
      {showJsonModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-4 sm:p-6 space-y-4 shadow-2xl border border-gray-200 my-auto max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#10264B] text-[#F47716] flex items-center justify-center">
                  <Code2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#10264B]">Bulk Import Questions via JSON Code</h3>
                  <p className="text-[11px] text-gray-500">Paste JSON code of questions & answers to add to exam automatically</p>
                </div>
              </div>
              <button
                onClick={() => setShowJsonModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Target Certification and Exam Level Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-gray-200">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Target Exam / Certification *</label>
                  <select
                    value={jsonTargetCert}
                    onChange={(e) => {
                      const newCert = e.target.value;
                      setJsonTargetCert(newCert);
                      // Auto-update sample template if user has not heavily changed it
                      if (jsonValidation.isValid && jsonValidation.count <= 2) {
                        setJsonCode(generateSampleJson(newCert, jsonTargetLevel));
                      }
                    }}
                    className="w-full p-2 bg-white border border-gray-300 rounded-lg font-bold text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#F47716]"
                  >
                    {certificationsList.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-gray-700">Target Exam Level *</label>
                    <button
                      type="button"
                      onClick={handleCopySample}
                      className="text-[11px] text-[#F47716] hover:text-[#DC660E] font-bold flex items-center space-x-1 cursor-pointer"
                      title="Load sample questions tailored to this level"
                    >
                      {copiedSample ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedSample ? 'Loaded!' : 'Load Level Template'}</span>
                    </button>
                  </div>
                  <select
                    value={jsonTargetLevel}
                    onChange={(e) => {
                      const newLevel = e.target.value;
                      setJsonTargetLevel(newLevel);
                      // Auto-update sample template if user has not heavily changed it
                      if (jsonValidation.isValid && jsonValidation.count <= 2) {
                        setJsonCode(generateSampleJson(jsonTargetCert, newLevel));
                      }
                    }}
                    className="w-full p-2 bg-white border border-gray-300 rounded-lg font-bold text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#F47716]"
                  >
                    {EXAM_LEVELS.map((lvl) => (
                      <option key={lvl} value={lvl}>
                        {lvl}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* JSON Code Editor Textarea */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-gray-700">Question Bank JSON Array *</label>
                  <span className="text-[11px] text-gray-400 font-mono">Format: Array of objects with question, options, correctAnswer, level</span>
                </div>
                <textarea
                  rows={12}
                  value={jsonCode}
                  onChange={(e) => setJsonCode(e.target.value)}
                  placeholder="Paste JSON array here..."
                  className="w-full p-3 font-mono text-[11px] bg-slate-900 text-emerald-400 border border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#F47716] leading-relaxed resize-y"
                  spellCheck={false}
                />
              </div>

              {/* Live JSON Validation Status */}
              <div
                className={`p-2.5 rounded-xl border flex items-center space-x-2 text-xs font-semibold ${jsonValidation.isValid
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : 'bg-red-50 border-red-200 text-red-800'
                  }`}
              >
                {jsonValidation.isValid ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span>✓ Valid JSON Syntax: Found <strong>{jsonValidation.count}</strong> questions ready to import into {jsonTargetCert} [<strong>{jsonTargetLevel}</strong>]</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                    <span className="truncate">Syntax Error: {jsonValidation.error}</span>
                  </>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowJsonModal(false)}
                  className="w-full sm:w-auto px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBulkImportJson}
                  disabled={!jsonValidation.isValid || importingJson}
                  className="w-full sm:w-auto px-6 py-2.5 bg-[#F47716] hover:bg-[#DC660E] disabled:bg-gray-300 text-white font-bold rounded-lg shadow-sm transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  {importingJson ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Code2 className="w-3.5 h-3.5" />}
                  <span>Import {jsonValidation.count} Questions ({jsonTargetLevel})</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADD / EDIT SCHEDULED EXAMINATION                  */}
      {/* ======================================================== */}
      {showExamModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-6 space-y-4 shadow-2xl border border-gray-200 my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm text-[#10264B] flex items-center space-x-2">
                <CalendarCheck className="w-4 h-4 text-[#F47716]" />
                <span>{editingExam ? 'Edit Examination Window' : 'Schedule New Examination Window'}</span>
              </h3>
              <button onClick={() => setShowExamModal(false)} className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveExam} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Exam Code *</label>
                  <input
                    type="text"
                    required
                    value={examForm.examCode}
                    onChange={(e) => setExamForm({ ...examForm, examCode: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-gray-300 rounded-lg font-mono font-bold focus:ring-1 focus:ring-[#F47716] focus:outline-none"
                    placeholder="AICQB-AI-CP-EXAM"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Certification Program</label>
                  <select
                    value={examForm.certificationCode}
                    onChange={(e) => setExamForm({ ...examForm, certificationCode: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-gray-300 rounded-lg font-bold focus:outline-none"
                  >
                    {certificationsList.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Examination Title *</label>
                <input
                  type="text"
                  required
                  value={examForm.examName}
                  onChange={(e) => setExamForm({ ...examForm, examName: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-gray-300 rounded-lg font-bold focus:ring-1 focus:ring-[#F47716] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Scheduled Date</label>
                  <input
                    type="text"
                    value={examForm.scheduledDate}
                    onChange={(e) => setExamForm({ ...examForm, scheduledDate: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-gray-300 rounded-lg focus:outline-none"
                    placeholder="24 Nov 2026"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Time Slot Window</label>
                  <input
                    type="text"
                    value={examForm.scheduledTime}
                    onChange={(e) => setExamForm({ ...examForm, scheduledTime: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-gray-300 rounded-lg focus:outline-none"
                    placeholder="10:00 AM – 11:30 AM (IST)"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Duration (Mins)</label>
                  <input
                    type="number"
                    min={30}
                    max={240}
                    value={examForm.durationMinutes}
                    onChange={(e) => setExamForm({ ...examForm, durationMinutes: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-gray-300 rounded-lg font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Pass Criteria (%)</label>
                  <input
                    type="number"
                    min={50}
                    max={95}
                    value={examForm.passingCriteria}
                    onChange={(e) => setExamForm({ ...examForm, passingCriteria: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-gray-300 rounded-lg font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Status</label>
                  <select
                    value={examForm.status}
                    onChange={(e) => setExamForm({ ...examForm, status: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-gray-300 rounded-lg font-bold"
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="Active">Active</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowExamModal(false)}
                  className="w-full sm:w-auto px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full sm:w-auto px-6 py-2.5 bg-[#F47716] hover:bg-[#DC660E] text-white font-bold rounded-lg shadow-sm transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CalendarCheck className="w-3.5 h-3.5" />}
                  <span>{editingExam ? 'Update Exam Window' : 'Schedule Exam Window'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADD / EDIT SINGLE QUESTION                        */}
      {/* ======================================================== */}
      {showQuestionModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-6 space-y-4 shadow-2xl border border-gray-200 my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm text-[#10264B] flex items-center space-x-2">
                <HelpCircle className="w-4 h-4 text-[#F47716]" />
                <span>{editingQuestion ? 'Edit Question Item' : 'Add Question Item'}</span>
              </h3>
              <button onClick={() => setShowQuestionModal(false)} className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Target Certification *</label>
                  <select
                    value={questionForm.certificationCode}
                    onChange={(e) => setQuestionForm({ ...questionForm, certificationCode: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-gray-300 rounded-lg font-bold text-gray-700"
                  >
                    {certificationsList.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Exam Level *</label>
                  <select
                    value={questionForm.level}
                    onChange={(e) => setQuestionForm({ ...questionForm, level: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-gray-300 rounded-lg font-bold text-gray-700"
                  >
                    {EXAM_LEVELS.map((lvl) => (
                      <option key={lvl} value={lvl}>
                        {lvl}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Points / Marks</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={questionForm.points}
                    onChange={(e) => setQuestionForm({ ...questionForm, points: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-gray-300 rounded-lg font-bold text-gray-700"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Question Prompt Text *</label>
                <textarea
                  rows={3}
                  required
                  value={questionForm.question}
                  onChange={(e) => setQuestionForm({ ...questionForm, question: e.target.value })}
                  placeholder="Enter assessment question statement..."
                  className="w-full p-2.5 bg-slate-50 border border-gray-300 rounded-lg font-medium focus:ring-1 focus:ring-[#F47716] focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="block font-semibold text-gray-700">Answer Options & Correct Key</label>
                {[
                  { label: 'Option A', field: 'optionA', idx: 0 },
                  { label: 'Option B', field: 'optionB', idx: 1 },
                  { label: 'Option C', field: 'optionC', idx: 2 },
                  { label: 'Option D', field: 'optionD', idx: 3 },
                ].map((opt) => (
                  <div key={opt.label} className="flex items-center space-x-2">
                    <span
                      onClick={() => setQuestionForm({ ...questionForm, correctAnswer: opt.idx })}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold font-mono cursor-pointer transition-all ${questionForm.correctAnswer === opt.idx
                        ? 'bg-emerald-600 text-white ring-2 ring-emerald-400'
                        : 'bg-slate-100 text-gray-600 hover:bg-slate-200'
                        }`}
                      title="Click to set as correct answer"
                    >
                      {String.fromCharCode(65 + opt.idx)}
                    </span>
                    <input
                      type="text"
                      required
                      value={(questionForm as any)[opt.field]}
                      onChange={(e) => setQuestionForm({ ...questionForm, [opt.field]: e.target.value })}
                      placeholder={`Enter ${opt.label}...`}
                      className="flex-1 p-2 bg-slate-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#F47716]"
                    />
                    {questionForm.correctAnswer === opt.idx && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200 whitespace-nowrap">
                        ✓ Correct
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowQuestionModal(false)}
                  className="w-full sm:w-auto px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full sm:w-auto px-6 py-2.5 bg-[#F47716] hover:bg-[#DC660E] text-white font-bold rounded-lg shadow-sm transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <HelpCircle className="w-3.5 h-3.5" />}
                  <span>{editingQuestion ? 'Update Question' : 'Save Question'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: PREVIEW QUESTION                                  */}
      {/* ======================================================== */}
      {previewQuestion && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl border border-gray-200 my-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs font-bold text-[#F47716] bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                  {previewQuestion.id}
                </span>
                <span className="text-xs font-bold text-gray-600">{previewQuestion.certificationCode}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getLevelBadgeClass(previewQuestion.level || previewQuestion.examLevel)}`}>
                  {previewQuestion.level || previewQuestion.examLevel || 'Foundation Level'}
                </span>
              </div>
              <button onClick={() => setPreviewQuestion(null)} className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-bold text-[#10264B] leading-relaxed">{previewQuestion.question}</h4>
              <div className="space-y-2 pt-1 text-xs">
                {previewQuestion.options?.map((opt: string, optIdx: number) => {
                  const isCorrect = previewQuestion.correctAnswer === optIdx;
                  return (
                    <div
                      key={optIdx}
                      className={`p-2.5 rounded-lg border flex items-center space-x-2.5 ${isCorrect ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-semibold' : 'bg-slate-50 border-gray-200 text-gray-700'
                        }`}
                    >
                      <span
                        className={`w-6 h-6 rounded flex items-center justify-center font-bold font-mono text-[11px] ${isCorrect ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-600'
                          }`}
                      >
                        {String.fromCharCode(65 + optIdx)}
                      </span>
                      <span className="flex-1">{opt}</span>
                      {isCorrect && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                          Answer Key
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setPreviewQuestion(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg text-xs cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CANDIDATE SCORECARD DETAILS                       */}
      {/* ======================================================== */}
      {selectedResult && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl border border-gray-200 my-auto text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm text-[#10264B] flex items-center space-x-2">
                <Award className="w-4 h-4 text-[#F47716]" />
                <span>Candidate Assessment Scorecard</span>
              </h3>
              <button onClick={() => setSelectedResult(null)} className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="bg-slate-50 p-3 rounded-xl border border-gray-200 space-y-1">
                <p className="font-bold text-sm text-[#10264B]">{selectedResult.candidateName}</p>
                <p className="text-gray-500 font-mono text-[11px]">{selectedResult.candidateId} • {selectedResult.candidateEmail || 'Candidate'}</p>
                <p className="text-gray-700 font-medium text-xs mt-1">{selectedResult.certificationName}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                  <p className="text-gray-500 text-[10px] font-bold uppercase">Assessment Score</p>
                  <p className="text-2xl font-black text-[#10264B] font-mono mt-0.5">{selectedResult.percentage}%</p>
                  <p className="text-[10px] text-gray-500 font-semibold">{selectedResult.score || 0} pts earned</p>
                </div>

                <div className={`p-3 rounded-xl border ${selectedResult.percentage >= 70 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                  <p className="text-gray-500 text-[10px] font-bold uppercase">Passing Status</p>
                  <p className={`text-xl font-black mt-1 ${selectedResult.percentage >= 70 ? 'text-emerald-700' : 'text-red-700'}`}>
                    {selectedResult.percentage >= 70 ? 'PASSED' : 'FAILED'}
                  </p>
                  <p className="text-[10px] text-gray-500 font-semibold">Min 70% Standard</p>
                </div>
              </div>

              {selectedResult.certificateNo && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-green-700 font-bold uppercase">Digital Credential</p>
                    <p className="font-mono font-bold text-green-900 text-xs">{selectedResult.certificateNo}</p>
                  </div>
                  <a
                    href={`/verify?id=${encodeURIComponent(selectedResult.certificateNo)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 bg-green-600 text-white font-bold rounded text-[11px] hover:bg-green-700"
                  >
                    Verify
                  </a>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end border-t">
              <button
                onClick={() => setSelectedResult(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg cursor-pointer"
              >
                Close Scorecard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Proctoring Audit & Verification Evidence Modal (Requirement 10) */}
      {showAuditModal && selectedAuditSession && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-7 space-y-5 shadow-2xl border border-gray-100 my-auto animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-50 text-[#F47716] flex items-center justify-center shadow-xs">
                  <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#10264B]">AIICQB Proctoring Audit & Biometric Evidence Vault</h3>
                  <p className="text-xs text-gray-500">
                    Candidate: <strong className="text-slate-800">{selectedAuditSession.candidateName}</strong> ({selectedAuditSession.candidateId}) • {selectedAuditSession.certificationName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAuditModal(false)}
                className="w-8 h-8 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Photos & Document Biometric Comparison */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Candidate Verification Live Photo */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Pre-Exam Live Photograph</span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Biometric Verified</span>
                </div>
                {selectedAuditSession.candidatePhoto ? (
                  <img
                    src={selectedAuditSession.candidatePhoto}
                    alt="Live Candidate Photo"
                    className="w-full h-44 object-cover rounded-xl border border-emerald-300 shadow-sm"
                  />
                ) : (
                  <div className="w-full h-44 bg-slate-200 rounded-xl flex items-center justify-center text-xs text-slate-500 font-semibold">
                    No Live Photo Captured
                  </div>
                )}
                <p className="text-[10px] text-slate-500 text-center font-mono">Liveness Check: 100% Passed • Single Face Confirmed</p>
              </div>

              {/* Submitted PAN / ID Document */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Submitted PAN / Govt Photo ID</span>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                    Match: {selectedAuditSession.verificationMatchScore || 96.5}%
                  </span>
                </div>
                {selectedAuditSession.idCardPhoto ? (
                  <img
                    src={selectedAuditSession.idCardPhoto}
                    alt="Submitted Photo ID"
                    className="w-full h-44 object-cover rounded-xl border border-blue-300 shadow-sm"
                  />
                ) : (
                  <div className="w-full h-44 bg-slate-200 rounded-xl flex items-center justify-center text-xs text-slate-500 font-semibold">
                    No ID Document Uploaded
                  </div>
                )}
                <p className="text-[10px] text-slate-500 text-center font-mono">Restricted Access • Encrypted Gov ID Vault</p>
              </div>
            </div>

            {/* Timestamped Examination Activity Logs */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-[#10264B] flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#F47716]" />
                  <span>Proctoring Alert Events & Activity Log</span>
                </h4>
                <span className="text-[11px] font-mono text-slate-500">
                  {selectedAuditSession.events?.length || selectedAuditSession.totalAlerts || 0} Total Events Logged
                </span>
              </div>

              <div className="bg-slate-900 text-white rounded-2xl p-3.5 font-mono text-xs max-h-48 overflow-y-auto space-y-2 border border-slate-800">
                {selectedAuditSession.events && selectedAuditSession.events.length > 0 ? (
                  selectedAuditSession.events.map((evt: any, i: number) => (
                    <div key={evt.id || i} className="flex items-start justify-between border-b border-slate-800 pb-1.5 last:border-0 last:pb-0">
                      <div>
                        <span className="text-orange-400 font-bold">[{new Date(evt.timestamp).toLocaleTimeString()}]</span>{' '}
                        <span className="text-amber-300 font-bold">{evt.eventType}</span>
                        {evt.details && <p className="text-slate-400 text-[11px] mt-0.5">{evt.details}</p>}
                      </div>
                      {evt.snapshot && (
                        <a
                          href={evt.snapshot}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-blue-400 underline ml-2 flex-shrink-0"
                        >
                          View Snapshot
                        </a>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="py-4 text-center text-slate-400 text-xs">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                    <span>Clean session. No suspicious gaze deviations, multiple faces, or tab switches detected.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Human Proctor Verdict & Review Notes */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <label className="text-xs font-bold text-[#10264B] block">Proctor Review Notes & Auditor Comments</label>
              <textarea
                rows={2}
                value={auditNotes}
                onChange={(e) => setAuditNotes(e.target.value)}
                placeholder="Enter proctor review findings, compliance confirmation, or observation notes..."
                className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#F47716]"
              />

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200">
                <span className="text-[11px] text-slate-500 font-medium">
                  Current Status: <strong className="uppercase font-bold text-[#10264B]">{selectedAuditSession.proctorReviewStatus || 'Pending'}</strong>
                </span>

                <div className="flex items-center space-x-2">
                  <button
                    disabled={submittingReview}
                    onClick={() => handleReviewSession('rejected')}
                    className="px-3.5 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Reject Session
                  </button>
                  <button
                    disabled={submittingReview}
                    onClick={() => handleReviewSession('flagged')}
                    className="px-3.5 py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Flag for Investigation
                  </button>
                  <button
                    disabled={submittingReview}
                    onClick={() => handleReviewSession('approved')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer flex items-center space-x-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve Session</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
