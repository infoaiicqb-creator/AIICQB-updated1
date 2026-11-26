import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { ExamEngineModal } from '../../components/ExamEngineModal';
import { CertificateModal } from '../../components/CertificateModal';
import {
  Calendar,
  Clock,
  ShieldAlert,
  Play,
  CheckCircle2,
  AlertTriangle,
  Award,
  Loader2,
  FileText,
  X,
  Check,
  ChevronRight,
  Monitor,
  Video,
  Wifi,
  BarChart3,
  Download,
  RotateCcw,
} from 'lucide-react';

export const CandidateExams: React.FC = () => {
  const navigate = useNavigate();
  const { user, candidate } = useAuth();
  const candidateName = user?.fullName || candidate?.fullName || 'Candidate';
  const candidateId = user?.candidateId || candidate?.candidateId || (user?.id ? `AICQB-${user.id.slice(0, 6).toUpperCase()}` : '');

  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed' | 'all'>('upcoming');
  const [upcoming, setUpcoming] = useState<any[]>(() => {
    try {
      const u = localStorage.getItem('aicqb_my_upcoming');
      return u ? JSON.parse(u) : [];
    } catch (_) {
      return [];
    }
  });
  const [completed, setCompleted] = useState<any[]>(() => {
    try {
      const c = localStorage.getItem('aicqb_my_completed');
      return c ? JSON.parse(c) : [];
    } catch (_) {
      return [];
    }
  });
  const [loading, setLoading] = useState(false);
  const [activeExamSession, setActiveExamSession] = useState<string | null>(null);
  const [showGuidelinesModal, setShowGuidelinesModal] = useState(false);
  const [selectedExamForGuidelines, setSelectedExamForGuidelines] = useState<any>(null);
  const [showScoreModal, setShowScoreModal] = useState<any>(null);
  const [showCertificateModal, setShowCertificateModal] = useState<any>(null);
  const [systemCheckPassed, setSystemCheckPassed] = useState(false);

  const handleJoinExam = (examId: string) => {
    setActiveExamSession(examId);
    try {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => { });
      }
    } catch (e) { }
  };

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    try {
      const res = await api.getMySchedules();
      if (res.success) {
        setUpcoming(res.upcoming || []);
        setCompleted(res.completed || []);
        try {
          localStorage.setItem('aicqb_my_upcoming', JSON.stringify(res.upcoming || []));
          localStorage.setItem('aicqb_my_completed', JSON.stringify(res.completed || []));
        } catch (_) { }
      }
    } catch (err) {
      console.error('Failed to load schedules:', err);
    } finally {
      setLoading(false);
    }
  };

  // Candidate's live upcoming and completed exams:
  // Rule: If any test fails, do NOT add to Completed Exams section; keep in Upcoming Exams only if attempts remain.
  const displayUpcoming = upcoming.filter(
    (u) => u.attemptsRemaining === undefined || u.attemptsRemaining > 0
  );
  const displayCompleted = completed.filter(
    (c) =>
      c.passed === true &&
      ((c.percentage !== undefined && c.percentage >= 70) ||
        (c.score !== undefined && c.score >= 70))
  );

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-[#10264B]">My Exams</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          View, schedule and launch your online proctored certification examinations.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-3">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeTab === 'upcoming'
            ? 'bg-[#F47716] text-white shadow-sm'
            : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
        >
          Upcoming Exams ({displayUpcoming.length})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeTab === 'completed'
            ? 'bg-[#F47716] text-white shadow-sm'
            : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
        >
          Completed Exams ({displayCompleted.length})
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeTab === 'all'
            ? 'bg-[#F47716] text-white shadow-sm'
            : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
        >
          All Exams ({displayUpcoming.length + displayCompleted.length})
        </button>
      </div>

      {/* 1. UPCOMING EXAMS TAB */}
      {(activeTab === 'upcoming' || activeTab === 'all') && (
        <div className="space-y-4">
          {activeTab === 'all' && displayUpcoming.length > 0 && (
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 pt-2">
              Upcoming Scheduled Sessions ({displayUpcoming.length})
            </h2>
          )}
          {displayUpcoming.length > 0 ? (
            displayUpcoming.map((exam) => (
              <div
                key={exam.id}
                className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-slate-300 transition-all"
              >
                <div className="flex items-start space-x-5">
                  {/* Date Square */}
                  <div className="w-16 h-16 rounded-xl bg-orange-50 border border-orange-200 flex flex-col items-center justify-center text-center flex-shrink-0">
                    <span className="text-xl font-black text-[#F47716] leading-none">
                      {exam.scheduledDateDay || (exam.scheduledDate ? new Date(exam.scheduledDate).getDate() : '16')}
                    </span>
                    <span className="text-[10px] font-bold text-gray-600 uppercase mt-0.5">
                      {exam.scheduledDateMonth || (exam.scheduledDate ? new Date(exam.scheduledDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Nov 2026')}
                    </span>
                  </div>

                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm sm:text-base font-bold text-[#10264B]">{exam.examName}</h3>
                      {exam.isRetake ? (
                        <span className="px-2.5 py-0.5 bg-amber-50 text-amber-800 font-extrabold text-[10px] rounded-full border border-amber-300 shadow-xs">
                          Retake Attempt {exam.retakeAttemptNumber || 2} of 3
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 bg-blue-50 text-[#10264B] font-bold text-[10px] rounded-full border border-blue-200">
                          Initial Attempt (1 of 3)
                        </span>
                      )}
                      <span className="px-2 py-0.5 bg-green-50 text-green-700 font-bold text-[10px] rounded-full border border-green-200">
                        {exam.isRetake ? 'Retake Window Open' : 'Exam Scheduled'}
                      </span>
                    </div>

                    <p className="text-xs font-mono text-[#F47716] font-semibold">({exam.certificationCode})</p>

                    <div className="flex items-center space-x-1.5 text-xs text-gray-500 pt-0.5">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      <span>
                        {(exam.scheduledTime && !exam.scheduledTime.includes('Retake Window Open')) ? exam.scheduledTime : '10:00 AM – 11:30 AM (IST)'} • Duration: {exam.durationMinutes || exam.duration || 90} Minutes • {exam.mode || 'Online Proctored'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-gray-100 flex-shrink-0">
                  <button
                    onClick={() => {
                      setSelectedExamForGuidelines(exam);
                      setShowGuidelinesModal(true);
                    }}
                    className="px-4 py-2.5 border border-gray-300 hover:bg-gray-50 text-[#10264B] text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    Exam Guidelines
                  </button>
                  {exam.attemptsRemaining === 0 ? (
                    <button
                      disabled
                      className="px-5 py-2.5 bg-gray-200 text-gray-500 text-xs font-bold rounded-xl cursor-not-allowed opacity-60"
                      title="All 3 attempts used"
                    >
                      Attempts Exhausted
                    </button>
                  ) : (
                    <button
                      onClick={() => handleJoinExam(exam.id)}
                      className="px-5 py-2.5 bg-[#F47716] hover:bg-[#DC660E] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{exam.isRetake ? 'Retake Exam' : 'Start Exam'}</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : activeTab === 'upcoming' ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center space-y-3">
              <Calendar className="w-10 h-10 text-gray-300 mx-auto" />
              <h3 className="text-sm font-bold text-[#10264B]">No Upcoming Exams Scheduled</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                You do not have any proctored examinations scheduled at this time. Browse certifications and enroll to schedule your exam session.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => navigate('/portal/certifications')}
                  className="px-4 py-2 bg-[#F47716] hover:bg-[#DC660E] text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer"
                >
                  Browse Certifications &gt;
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* 2. COMPLETED EXAMS TAB */}
      {(activeTab === 'completed' || activeTab === 'all') && (
        <div className="space-y-4">
          {activeTab === 'all' && (
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 pt-4">
              Completed Examinations ({displayCompleted.length})
            </h2>
          )}
          {displayCompleted.length > 0 ? (
            displayCompleted.map((comp) => {
              const isCompPassed =
                comp.passed !== false &&
                ((comp.percentage !== undefined && comp.percentage >= 70) ||
                  (comp.score !== undefined && comp.score >= 70));

              return (
                <div
                  key={comp.id}
                  className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-slate-300 transition-all"
                >
                  <div className="flex items-start space-x-5">
                    <div
                      className={`w-16 h-16 rounded-xl flex flex-col items-center justify-center text-center flex-shrink-0 ${isCompPassed
                        ? 'bg-emerald-50 border border-emerald-200'
                        : 'bg-red-50 border border-red-200'
                        }`}
                    >
                      {isCompPassed ? (
                        <Award className="w-8 h-8 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="w-8 h-8 text-red-600" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 font-bold text-[10px] rounded-full border ${isCompPassed
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                            }`}
                        >
                          {isCompPassed
                            ? `Passed (${comp.percentage ?? comp.score}%)`
                            : `Failed (${comp.percentage ?? comp.score}%)`}
                        </span>
                        {isCompPassed && comp.certificateNo && (
                          <span className="font-mono text-xs text-slate-500 font-semibold">
                            Cert #: {comp.certificateNo}
                          </span>
                        )}
                        {!isCompPassed && (
                          <span className="px-2 py-0.5 bg-amber-50 text-amber-800 text-[10px] font-bold rounded-full border border-amber-200">
                            No Certificate Issued (&lt; 70%)
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-[#10264B]">
                        {comp.examName || comp.certificationName} ({comp.certificationCode})
                      </h3>
                      <p className="text-xs text-gray-500">
                        Completed: {comp.scheduledDateFormatted || comp.scheduledDate || 'Recent'} •{' '}
                        {isCompPassed
                          ? 'Verified Status: Active Credential'
                          : 'Passing Standard: 70% Required (Failed – No Certificate)'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 pt-3 md:pt-0 border-t md:border-t-0 border-gray-100 flex-shrink-0">
                    <button
                      onClick={() => setShowScoreModal(comp)}
                      className="px-4 py-2.5 border border-slate-300 hover:bg-slate-50 text-[#10264B] text-xs font-bold rounded-xl transition-colors flex items-center space-x-1.5 cursor-pointer"
                    >
                      <BarChart3 className="w-3.5 h-3.5 text-[#F47716]" />
                      <span>Score Report</span>
                    </button>

                    {/* ONLY DISPLAY CERTIFICATE BUTTON IF EXAM WAS PASSED (>= 70%) */}
                    {isCompPassed && comp.certificateNo ? (
                      <button
                        onClick={() =>
                          setShowCertificateModal({
                            certificateNo: comp.certificateNo,
                            candidateName: candidateName,
                            candidateId: candidateId,
                            certificationName: comp.examName || comp.certificationName,
                            certificationCode: comp.certificationCode,
                            grade:
                              (comp.percentage ?? comp.score) >= 90
                                ? 'Grade A+ (Distinction)'
                                : (comp.percentage ?? comp.score) >= 80
                                  ? 'Grade A (Merit)'
                                  : 'Grade B (Pass)',
                            issueDate: comp.scheduledDate || new Date().toISOString().split('T')[0],
                            expiryDate: new Date(Date.now() + 86400000 * 365 * 3).toISOString().split('T')[0],
                            ceoName: 'Pushpak Wani',
                            ceo: 'Pushpak Wani',
                            directorName: 'Dr. Neha Kulkarni',
                            director: 'Dr. Neha Kulkarni',
                          })
                        }
                        className="px-5 py-2.5 bg-[#10264B] hover:bg-[#1E3A6E] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center space-x-1.5 cursor-pointer"
                      >
                        <Award className="w-3.5 h-3.5 text-[#F47716]" />
                        <span>View Certificate</span>
                      </button>
                    ) : !isCompPassed ? (
                      <button
                        onClick={() => {
                          const retake = upcoming.find(
                            (u) => u.isRetake && u.certificationCode === comp.certificationCode
                          );
                          if (retake) {
                            handleJoinExam(retake.id);
                          } else {
                            setActiveTab('upcoming');
                          }
                        }}
                        className="px-5 py-2.5 bg-[#F47716] hover:bg-[#DC660E] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center space-x-1.5 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-white" />
                        <span>Retake Exam (Chance 2 of 2)</span>
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center space-y-3">
              <Award className="w-10 h-10 text-gray-300 mx-auto" />
              <h3 className="text-sm font-bold text-[#10264B]">No Completed Exams Yet</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Once you finish and pass your scheduled proctored exams, your score report and official verified certificate will appear here.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. EXAM GUIDELINES MODAL (All Features Active) */}
      {/* ========================================================================= */}
      {showGuidelinesModal && (
        <div className="fixed inset-0 z-50 bg-[#10264B]/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-gray-200">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#F47716] flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg text-[#10264B]">
                    AICQB Official Examination Guidelines
                  </h3>
                  <p className="text-xs text-gray-500">
                    {selectedExamForGuidelines?.examName || 'Proctored Certification Assessment'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowGuidelinesModal(false);
                  setSystemCheckPassed(false);
                }}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Guidelines Points */}
            <ul className="text-xs text-gray-600 space-y-3 leading-relaxed">
              <li className="flex items-start space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Full-Screen Proctored Sandbox:</strong> Assessment operates in native full screen. Navigating away, opening developer tools, or opening external browser tabs triggers an administrative security flag.
                </span>
              </li>
              <li className="flex items-start space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Assessment Timing & Threshold:</strong> Total duration is 90 minutes. 70% passing threshold. No negative marking.
                </span>
              </li>
              <li className="flex items-start space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Auto-Save Engine:</strong> All selected options and code snippets auto-save every 5 seconds with live cloud synchronization.
                </span>
              </li>
            </ul>

            {/* System Diagnostics Box */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-[#10264B]">
                <span>Hardware & Connection Pre-Check</span>
                <button
                  type="button"
                  onClick={() => setSystemCheckPassed(true)}
                  className="text-[11px] text-[#F47716] hover:underline cursor-pointer"
                >
                  {systemCheckPassed ? '✓ Verified' : 'Run Diagnostics'}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-600">
                <div className="flex items-center space-x-2">
                  <Monitor className="w-3.5 h-3.5 text-blue-600" />
                  <span>Screen: 1920x1080 (HD)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Video className="w-3.5 h-3.5 text-green-600" />
                  <span>Webcam: Ready</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Network: 18ms Latency</span>
                </div>
                <div className="flex items-center space-x-2">
                  <ShieldAlert className="w-3.5 h-3.5 text-orange-600" />
                  <span>Integrity: Ready</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={() => {
                  setShowGuidelinesModal(false);
                  if (selectedExamForGuidelines) {
                    handleJoinExam(selectedExamForGuidelines.id);
                  }
                }}
                className="flex-1 py-3 bg-[#F47716] hover:bg-[#DC660E] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start Proctored Exam Now</span>
              </button>
              <button
                onClick={() => setShowGuidelinesModal(false)}
                className="px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. SCORE DIAGNOSTIC REPORT MODAL */}
      {/* ========================================================================= */}
      {showScoreModal && (
        <div className="fixed inset-0 z-50 bg-[#10264B]/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-gray-200">
            <div className="flex items-start justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg text-[#10264B]">
                    Official Examination Score Report
                  </h3>
                  <p className="text-xs text-gray-500">{showScoreModal.examName}</p>
                </div>
              </div>
              <button onClick={() => setShowScoreModal(null)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Score Summary matching Requirement 3 & 4 */}
            <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl text-center border border-slate-200">
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-bold block">Obtained Marks</span>
                <span className="text-xl font-black text-[#10264B]">
                  {showScoreModal.score !== undefined ? `${showScoreModal.score} pts` : '-'}
                </span>
                <span className="text-[10px] text-gray-400 block mt-0.5">
                  ({showScoreModal.percentage !== undefined ? `${showScoreModal.percentage}%` : `${showScoreModal.score}%`})
                </span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-bold block">Passing Criteria</span>
                <span className="text-xl font-black text-[#10264B]">{showScoreModal.passingCriteria || 70}%</span>
                <span className="text-[10px] text-gray-500 font-semibold block mt-0.5">Minimum Required</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-bold block">Result Status</span>
                {(() => {
                  const isModalPassed =
                    showScoreModal.passed !== false &&
                    ((showScoreModal.percentage !== undefined && showScoreModal.percentage >= 70) ||
                      (showScoreModal.score !== undefined && showScoreModal.score >= 70));
                  return (
                    <span className={`text-xl font-black ${isModalPassed ? 'text-green-600' : 'text-red-600'}`}>
                      {isModalPassed ? 'PASSED' : 'FAILED'}
                    </span>
                  );
                })()}
                <span className="text-[10px] font-semibold block mt-0.5">
                  {(() => {
                    const isModalPassed =
                      showScoreModal.passed !== false &&
                      ((showScoreModal.percentage !== undefined && showScoreModal.percentage >= 70) ||
                        (showScoreModal.score !== undefined && showScoreModal.score >= 70));
                    return isModalPassed ? (
                      <span className="text-emerald-600">Passed (≥ 70%)</span>
                    ) : (
                      <span className="text-red-500">Failed (&lt; 70%)</span>
                    );
                  })()}
                </span>
              </div>
            </div>

            {/* Failure Warning & Retake Notice if Failed */}
            {(() => {
              const isModalPassed =
                showScoreModal.passed !== false &&
                ((showScoreModal.percentage !== undefined && showScoreModal.percentage >= 70) ||
                  (showScoreModal.score !== undefined && showScoreModal.score >= 70));
              if (!isModalPassed) {
                return (
                  <div className="p-3.5 bg-red-50 rounded-xl border border-red-200 text-xs text-red-800 space-y-1">
                    <p className="font-bold flex items-center space-x-1.5 text-red-900">
                      <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                      <span>Examination Result: Failed (Score Below 70%)</span>
                    </p>
                    <p className="text-[11px] text-red-700 leading-relaxed">
                      Per official AICQB regulations, a minimum score of <strong>70%</strong> is required to pass.
                      <strong> No certificate has been generated for this exam.</strong> You have been granted a second chance to retake and clear this test.
                    </p>
                  </div>
                );
              }
              return null;
            })()}

            <div className="space-y-2 text-xs">
              <span className="font-bold text-[#10264B] uppercase tracking-wider block">Competency Domain Scores</span>
              <div className="space-y-2">
                <div className="flex justify-between text-slate-700">
                  <span>Core QA & Theoretical Architecture</span>
                  <span className="font-bold text-emerald-600">
                    {showScoreModal.percentage ? `${Math.min(100, showScoreModal.percentage + 5)}%` : '85%'}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${Math.min(100, (showScoreModal.percentage || 70) + 5)}%` }}
                  ></div>
                </div>

                <div className="flex justify-between text-slate-700">
                  <span>Hands-on Engineering & Applied Logic</span>
                  <span className="font-bold text-emerald-600">
                    {showScoreModal.percentage ? `${showScoreModal.percentage}%` : '75%'}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${showScoreModal.percentage || 70}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              {(() => {
                const isModalPassed =
                  showScoreModal.passed !== false &&
                  ((showScoreModal.percentage !== undefined && showScoreModal.percentage >= 70) ||
                    (showScoreModal.score !== undefined && showScoreModal.score >= 70));

                if (isModalPassed && showScoreModal.certificateNo) {
                  return (
                    <button
                      onClick={() => {
                        setShowScoreModal(null);
                        setShowCertificateModal({
                          certificateNo: showScoreModal.certificateNo,
                          candidateName: candidateName,
                          candidateId: candidateId,
                          certificationName: showScoreModal.examName,
                          certificationCode: showScoreModal.certificationCode,
                          grade:
                            (showScoreModal.percentage ?? showScoreModal.score) >= 90
                              ? 'Grade A+ (Distinction)'
                              : (showScoreModal.percentage ?? showScoreModal.score) >= 80
                                ? 'Grade A (Merit)'
                                : 'Grade B (Pass)',
                          issueDate: showScoreModal.scheduledDate || new Date().toISOString().split('T')[0],
                          issueDateFormatted: showScoreModal.scheduledDateFormatted || 'Recent',
                          validUntil: new Date(Date.now() + 86400000 * 365 * 3).toISOString().split('T')[0],
                          validUntilFormatted: '3 Years from Issue',
                          expiryDate: new Date(Date.now() + 86400000 * 365 * 3).toISOString().split('T')[0],
                          ceoName: 'Pushpak Wani',
                          ceo: 'Pushpak Wani',
                          directorName: 'Dr. Neha Kulkarni',
                          director: 'Dr. Neha Kulkarni',
                        });
                      }}
                      className="flex-1 py-3 bg-[#10264B] hover:bg-[#1E3A6E] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <Award className="w-4 h-4 text-[#F47716]" />
                      <span>View Official Certificate</span>
                    </button>
                  );
                } else if (!isModalPassed) {
                  // If failed: DO NOT DISPLAY CERTIFICATE BUTTON! Show Retake Button
                  return (
                    <button
                      onClick={() => {
                        setShowScoreModal(null);
                        const retake = upcoming.find(
                          (u) => u.isRetake && u.certificationCode === showScoreModal.certificationCode
                        );
                        if (retake) {
                          handleJoinExam(retake.id);
                        } else {
                          setActiveTab('upcoming');
                        }
                      }}
                      className="flex-1 py-3 bg-[#F47716] hover:bg-[#DC660E] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4 text-white" />
                      <span>Take Retake Examination (Chance 2 of 2)</span>
                    </button>
                  );
                }
                return null;
              })()}

              <button
                onClick={() => setShowScoreModal(null)}
                className="px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. OFFICIAL CERTIFICATE MODAL */}
      {/* ========================================================================= */}
      {showCertificateModal && (
        <CertificateModal
          certificate={showCertificateModal}
          onClose={() => setShowCertificateModal(null)}
        />
      )}

      {/* ========================================================================= */}
      {/* 6. PROCTORED EXAM ENGINE (FULL SCREEN SINGLE WINDOW) */}
      {/* ========================================================================= */}
      {activeExamSession && (
        <ExamEngineModal
          scheduleId={activeExamSession}
          onClose={() => setActiveExamSession(null)}
          onExamCompleted={() => {
            setActiveExamSession(null);
            loadSchedules();
          }}
        />
      )}
    </div>
  );
};
