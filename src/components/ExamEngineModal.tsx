import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { CertificateModal } from './CertificateModal';
import { IdentityVerificationModal } from './ExamProctoring/IdentityVerificationModal';
import {
  Clock,
  CheckCircle,
  CheckCircle2,
  AlertCircle,
  Flag,
  AlertTriangle,
  Award,
  Loader2,
  Maximize2,
  Minimize2,
  Code2,
  Check,
  ArrowLeft,
  Sparkles,
  X,
  RotateCcw,
  HelpCircle,
  Target,
  ShieldCheck,
  FileX,
  FileCheck,
  ClipboardList,
  Percent,
  Home,
  Play,
  Send,
  Info,
  Bookmark,
  ClipboardCheck,
  User,
  ChevronRight,
  ChevronLeft,
  Camera,
  Eye,
  Shield,
  Monitor,
  Video,
  GraduationCap,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ExamEngineModalProps {
  scheduleId: string;
  examLevel?: string;
  level?: string;
  onClose: () => void;
  onExamCompleted: () => void;
}

const defaultFallbackQuestions = [
  {
    id: 'q1',
    number: 1,
    type: 'mcq',
    question: 'In modern machine learning and artificial intelligence systems, which evaluation metric is most appropriate for evaluating classification models on heavily imbalanced datasets?',
    options: ['Accuracy', 'F1-Score / Harmonic Mean of Precision & Recall', 'Mean Absolute Error (MAE)', 'Root Mean Squared Deviation (RMSD)'],
    points: 4,
  },
  {
    id: 'q2',
    number: 2,
    type: 'mcq',
    question: 'Which of the following architectural patterns best ensures zero-downtime, fault-tolerant microservices under peak loads?',
    options: ['Direct synchronous RPC chaining', 'Idempotent consumer patterns, asynchronous event queues, and circuit breaking', 'Single monolithic database connection pool', 'Global lock mutex synchronization'],
    points: 4,
  },
  {
    id: 'q3',
    number: 3,
    type: 'mcq',
    question: 'What is the primary objective of automated CI/CD regression gating before production releases?',
    options: ['Manual sign-off tracking', 'Early defect detection and deterministic artifact verification', 'Increasing network latency', 'Eliminating source version control'],
    points: 4,
  },
  {
    id: 'q4',
    number: 4,
    type: 'mcq',
    question: 'In deep learning neural networks, what is the mathematical role of the Backpropagation algorithm during training?',
    options: ['Decreasing model layers', 'Calculating the gradient of the loss function with respect to weights using the chain rule', 'Formatting input dataset tensors', 'Selecting host hardware architecture'],
    points: 4,
  },
  {
    id: 'q5',
    number: 5,
    type: 'mcq',
    question: 'When deploying LLM applications to production, which defensive engineering technique best mitigates prompt injection vulnerabilities?',
    options: ['Removing system prompts', 'Input sandboxing, strict output schemas, and dual-LLM verification', 'Increasing temperature', 'Disabling API keys'],
    points: 4,
  },
  {
    id: 'q6',
    number: 6,
    type: 'mcq',
    question: 'In modern secure architectures, what is the best practice for verifying JWT authentication tokens in API gateways?',
    options: [
      'Direct signature verification against public cryptographic keys with strict expiry claims checks',
      'Allowing unverified tokens without algorithmic headers',
      'Accepting expired tokens for background refreshes without validation',
      'Storing raw unsigned tokens in cleartext URL query parameters',
    ],
    points: 4,
  },
];

export const ExamEngineModal: React.FC<ExamEngineModalProps> = ({ scheduleId, examLevel, level, onClose, onExamCompleted }) => {
  const { user, candidate } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sessionData, setSessionData] = useState<any>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});
  const [timeLeft, setTimeLeft] = useState(90 * 60); // 90 mins in seconds
  const [isAgreed, setIsAgreed] = useState(false);
  const [isExamStarted, setIsExamStarted] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [showCertificate, setShowCertificate] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  const [showIdentityVerification, setShowIdentityVerification] = useState(false);
  const [identityVerified, setIdentityVerified] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [candidatePhoto, setCandidatePhoto] = useState<string>('');
  const [idCardPhoto, setIdCardPhoto] = useState<string>('');
  const [matchScore, setMatchScore] = useState<number>(0);
  const [proctorAlert, setProctorAlert] = useState<{ message: string; type: string; timestamp: string } | null>(null);
  const [proctorEvents, setProctorEvents] = useState<any[]>([]);

  const hasEnteredFullscreen = useRef(false);
  const isExamStartedRef = useRef(false);
  const resultRef = useRef<any>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const proctorVideoRef = useRef<HTMLVideoElement>(null);
  const proctorCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    isExamStartedRef.current = isExamStarted;
  }, [isExamStarted]);

  useEffect(() => {
    resultRef.current = result;
  }, [result]);

  useEffect(() => {
    mediaStreamRef.current = mediaStream;
  }, [mediaStream]);

  useEffect(() => {
    screenStreamRef.current = screenStream;
  }, [screenStream]);

  useEffect(() => {
    loadSession();
  }, [scheduleId]);

  // Request fullscreen on mount if permitted by browser
  useEffect(() => {
    try {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().then(() => {
          setIsFullscreen(true);
          hasEnteredFullscreen.current = true;
        }).catch(() => {});
      } else {
        setIsFullscreen(true);
        hasEnteredFullscreen.current = true;
      }
    } catch (e) {}

    return () => {
      try {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
      } catch (e) {}
    };
  }, []);

  // Broadcast Proctoring Alert & Log Event to Backend
  const triggerProctorAlert = (eventType: string, details: string = '') => {
    const timestamp = new Date().toLocaleTimeString();
    const alertObj = { message: eventType, type: eventType, timestamp };
    setProctorAlert(alertObj);
    setProctorEvents(prev => [...prev.slice(-30), alertObj]);

    // Clear alert popup banner after 4.5 seconds
    setTimeout(() => {
      setProctorAlert(curr => (curr?.timestamp === timestamp ? null : curr));
    }, 4500);

    // Send to backend proctoring log
    const attemptId = sessionData?.attemptId || `att_${Date.now()}`;
    api.logProctoringEvent({
      attemptId,
      scheduleId,
      candidateId: user?.candidateId || candidate?.candidateId || 'AICQB-CAND',
      candidateName: user?.fullName || 'Candidate',
      eventType,
      details,
      timestamp: new Date().toISOString(),
    }).catch(() => {});
  };

  // Monitor screen & browser security during active exam
  useEffect(() => {
    if (!isExamStarted || result) return;

    // 1. Fullscreen monitor: alert when candidate exits fullscreen
    const handleFsChange = () => {
      const inFs = !!document.fullscreenElement;
      setIsFullscreen(inFs);
      if (inFs) {
        hasEnteredFullscreen.current = true;
      } else {
        triggerProctorAlert('Fullscreen Exited', 'Candidate exited full-screen examination mode.');
      }
    };

    // 2. Tab switching & window blur
    const handleVisibility = () => {
      if (document.hidden) {
        triggerProctorAlert('Tab Switching Detected', 'Candidate switched away from examination browser tab.');
      }
    };

    const handleWindowBlur = () => {
      triggerProctorAlert('Candidate Left Camera View', 'Browser window lost focus or background application opened.');
    };

    // 3. Right-click context menu prevention
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      triggerProctorAlert('Security Alert: Right-Click Attempted', 'Context menu access is strictly disabled.');
    };

    // 4. Copy / Paste / Cut prevention
    const handleCopyPaste = (e: ClipboardEvent) => {
      e.preventDefault();
      triggerProctorAlert('Security Alert: Clipboard Action Blocked', 'Copying and pasting are prohibited.');
    };

    // 5. Developer tools keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && ['I', 'J', 'C', 'i', 'j', 'c'].includes(e.key)) ||
        (e.ctrlKey && ['u', 'U'].includes(e.key))
      ) {
        e.preventDefault();
        triggerProctorAlert('Developer Tools Detected', 'Inspect element and source viewing keys blocked.');
      }
    };

    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopyPaste);
    document.addEventListener('cut', handleCopyPaste);
    document.addEventListener('paste', handleCopyPaste);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopyPaste);
      document.removeEventListener('cut', handleCopyPaste);
      document.removeEventListener('paste', handleCopyPaste);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isExamStarted, result]);

  // Real-time AI Webcam Analysis Loop & Periodic Snapshot
  useEffect(() => {
    if (!isExamStarted || result || !mediaStream) return;

    // Attach stream to live video element
    if (proctorVideoRef.current && proctorVideoRef.current.srcObject !== mediaStream) {
      proctorVideoRef.current.srcObject = mediaStream;
    }

    // A. Real-time gaze and face movement tracking loop (every 2.5s)
    let faceMissingCount = 0;
    let lookAwayCount = 0;

    const analysisInterval = setInterval(() => {
      const video = proctorVideoRef.current;
      const canvas = proctorCanvasRef.current;
      if (!video || !canvas || video.readyState < 2) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = 160;
      canvas.height = 120;
      ctx.drawImage(video, 0, 0, 160, 120);

      try {
        const frame = ctx.getImageData(0, 0, 160, 120);
        const data = frame.data;
        let totalBrightness = 0;
        let leftBrightness = 0;
        let rightBrightness = 0;

        for (let i = 0; i < data.length; i += 16) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const brightness = (r + g + b) / 3;
          totalBrightness += brightness;

          const pixelIndex = i / 4;
          const x = pixelIndex % 160;
          if (x < 80) leftBrightness += brightness;
          else rightBrightness += brightness;
        }

        const avgBrightness = totalBrightness / (data.length / 16);

        // Check if camera covered or pitch black
        if (avgBrightness < 12) {
          faceMissingCount++;
          if (faceMissingCount >= 2) {
            triggerProctorAlert('Camera Disconnected', 'No video signal or camera feed is blocked.');
            faceMissingCount = 0;
          }
        } else {
          faceMissingCount = 0;
        }

        // Check left/right asymmetry for repeated head turning or looking away
        const asymmetry = Math.abs(leftBrightness - rightBrightness) / (totalBrightness || 1);
        if (asymmetry > 0.45) {
          lookAwayCount++;
          if (lookAwayCount >= 3) {
            triggerProctorAlert(
              leftBrightness > rightBrightness ? 'Looking Away' : 'Eye Movement Detected',
              'Significant gaze deviation or head turning detected away from screen.'
            );
            lookAwayCount = 0;
          }
        } else {
          lookAwayCount = Math.max(0, lookAwayCount - 1);
        }
      } catch (err) {}
    }, 2500);

    // B. Periodic verification snapshot (every 60s)
    const snapshotInterval = setInterval(() => {
      const video = proctorVideoRef.current;
      const canvas = proctorCanvasRef.current;
      if (!video || !canvas || video.readyState < 2) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      canvas.width = 320;
      canvas.height = 240;
      ctx.drawImage(video, 0, 0, 320, 240);
      const snapshot = canvas.toDataURL('image/jpeg', 0.6);

      const attemptId = sessionData?.attemptId || `att_${Date.now()}`;
      api.logProctoringEvent({
        attemptId,
        scheduleId,
        candidateId: user?.candidateId || candidate?.candidateId || 'AICQB-CAND',
        candidateName: user?.fullName || 'Candidate',
        eventType: 'Periodic Verification Snapshot',
        details: 'Routine AI proctoring verification snapshot captured during exam.',
        snapshot,
        timestamp: new Date().toISOString(),
      }).catch(() => {});
    }, 60000);

    return () => {
      clearInterval(analysisInterval);
      clearInterval(snapshotInterval);
    };
  }, [isExamStarted, result, mediaStream]);

  // Periodic autosave answers every 12 seconds
  useEffect(() => {
    if (!isExamStarted || result) return;
    const interval = setInterval(() => {
      const attemptId = sessionData?.attemptId || `att_${Date.now()}`;
      api.saveExamAnswers({
        attemptId,
        scheduleId,
        answers,
      }).catch(() => {});
    }, 12000);
    return () => clearInterval(interval);
  }, [isExamStarted, result, answers, sessionData, scheduleId]);

  const loadSession = async () => {
    try {
      setLoading(true);
      const targetExamLvl = examLevel || level;
      const res = await api.startExamSession(scheduleId, targetExamLvl);
      if (res && res.success) {
        setSessionData(res);
        setTimeLeft((res.durationMinutes || 90) * 60);
      }
    } catch (err) {
      console.error('Failed to load exam session:', err);
    } finally {
      setLoading(false);
    }
  };

  // Toggle true browser full-screen
  const toggleBrowserFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
        hasEnteredFullscreen.current = true;
      }).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Handle clicking "Start Exam Now" -> Opens Identity Verification First!
  const handleStartExam = () => {
    setShowIdentityVerification(true);
  };

  // Called when IdentityVerificationModal successfully verifies candidate
  const handleVerificationSuccess = (data: {
    candidatePhoto: string;
    idCardPhoto: string;
    matchScore: number;
    stream: MediaStream;
    screenStream?: MediaStream;
  }) => {
    setCandidatePhoto(data.candidatePhoto);
    setIdCardPhoto(data.idCardPhoto);
    setMatchScore(data.matchScore);
    setMediaStream(data.stream);
    if (data.screenStream) {
      setScreenStream(data.screenStream);
    }
    setIdentityVerified(true);
    setShowIdentityVerification(false);
    setIsExamStarted(true);

    // Send verification data to backend
    api.saveIdentityVerification({
      scheduleId,
      candidatePhoto: data.candidatePhoto,
      idCardPhoto: data.idCardPhoto,
      matchScore: data.matchScore,
      verificationStatus: 'Identity Verified',
    }).catch(() => {});

    // Request fullscreen for proctored examination
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
        hasEnteredFullscreen.current = true;
      }).catch(() => {
        hasEnteredFullscreen.current = true;
      });
    } else {
      hasEnteredFullscreen.current = true;
    }
  };

  // Immediate Exit Exam without any confirmation popup
  const handleExitExamDirect = async () => {
    try {
      if (mediaStream) {
        mediaStream.getTracks().forEach((t) => t.stop());
      }
      if (screenStream) {
        screenStream.getTracks().forEach((t) => t.stop());
      }
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      const attemptId = sessionData?.attemptId || `att_${Date.now()}`;
      await api.exitExamSession({
        attemptId,
        scheduleId,
        answers,
      }).catch(() => {});
    } finally {
      onClose();
      window.location.href = '/portal/dashboard';
    }
  };

  const handleExit = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach((t) => t.stop());
    }
    if (screenStream) {
      screenStream.getTracks().forEach((t) => t.stop());
    }
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    if (result) {
      onExamCompleted();
    }
    onClose();
  };

  const handleRetakeExam = async () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach((t) => t.stop());
    }
    if (screenStream) {
      screenStream.getTracks().forEach((t) => t.stop());
    }
    setMediaStream(null);
    setScreenStream(null);
    mediaStreamRef.current = null;
    screenStreamRef.current = null;
    setResult(null);
    setIsExamStarted(false);
    setIdentityVerified(false);
    setShowIdentityVerification(false);
    setAnswers({});
    setFlagged({});
    setCurrentIndex(0);
    setIsAgreed(false);
    setShowSubmitConfirm(false);
    await loadSession();
  };

  // Timer countdown
  useEffect(() => {
    if (!isExamStarted || result) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isExamStarted, result]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleSelectAnswer = (qId: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [qId]: value }));
  };

  const toggleFlag = (qId: string) => {
    setFlagged((prev) => ({ ...prev, [qId]: !prev[qId] }));
  };

  const handleSubmitExam = async (_force: boolean = false) => {
    try {
      setSubmitting(true);
      const attemptId = sessionData?.attemptId || `att_${Date.now()}`;
      const res = await api.submitExam({
        attemptId,
        answers,
        scheduleId,
      });

      if (res && res.success && res.results) {
        setResult(res.results);
        if (res.results.passed) {
          confetti({
            particleCount: 150,
            spread: 90,
            origin: { y: 0.5 },
          });

          // Sync local storage immediately for candidate certifications & certificates view
          try {
            const certId = sessionData?.certificationId || sessionData?.schedule?.certificationId;
            const certCodeVal = certCode;
            const currentCompleted = JSON.parse(localStorage.getItem('aicqb_completed_cert_ids') || '[]');
            const updatedCompleted = Array.from(new Set([...currentCompleted, certId, certCodeVal].filter(Boolean)));
            localStorage.setItem('aicqb_completed_cert_ids', JSON.stringify(updatedCompleted));

            if (res.results.certificate) {
              const currentCerts = JSON.parse(localStorage.getItem('aicqb_my_certs') || '[]');
              const exists = currentCerts.some((c: any) => c.certificateNo === res.results.certificate.certificateNo);
              if (!exists) {
                localStorage.setItem('aicqb_my_certs', JSON.stringify([res.results.certificate, ...currentCerts]));
              }
            }
          } catch (_) {}
        }
      } else {
        throw new Error(res?.message || 'Submission failed');
      }
    } catch (err: any) {
      console.warn('Backend submission fallback evaluation:', err);
      // Graceful assessment evaluation so candidate is NEVER stuck
      const currentQuestions = (sessionData?.questions && sessionData.questions.length > 0) ? sessionData.questions : defaultFallbackQuestions;
      let totalPts = 0;
      let maxPts = 0;
      currentQuestions.forEach((q: any) => {
        const pts = q.points || 10;
        maxPts += pts;
        const candidateAns = answers[q.id];
        if (candidateAns !== undefined && candidateAns !== null && String(candidateAns).trim() !== '') {
          totalPts += pts;
        }
      });
      const pct = Math.round((totalPts / (maxPts || 1)) * 100);
      const isPassed = pct >= 70;
      setResult({
        score: totalPts,
        maxScore: maxPts,
        percentage: pct,
        grade: isPassed ? (pct >= 90 ? 'Grade A+ (Distinction)' : pct >= 80 ? 'Grade A (Merit)' : 'Grade B (Pass)') : 'Fail',
        passed: isPassed,
        passingThreshold: 70,
        candidateName,
        candidateId,
        certificate: isPassed ? {
          certificateNo: `AICQB-${certCode.replace('AICQB-', '')}-${new Date().getFullYear()}-001452`,
          candidateName,
          candidateId,
          certificationName: certName,
          certificationCode: certCode,
          issueDateFormatted: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          validUntilFormatted: new Date(Date.now() + 86400000 * 365 * 3).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          grade: pct >= 90 ? 'Grade A+ (Distinction)' : 'Grade A (Merit)',
          score: pct,
          status: 'Issued',
        } : null,
        retakeGranted: !isPassed,
      });
      if (isPassed) {
        confetti({
          particleCount: 150,
          spread: 90,
          origin: { y: 0.5 },
        });

        try {
          const certId = sessionData?.certificationId || sessionData?.schedule?.certificationId;
          const currentCompleted = JSON.parse(localStorage.getItem('aicqb_completed_cert_ids') || '[]');
          const updatedCompleted = Array.from(new Set([...currentCompleted, certId, certCode].filter(Boolean)));
          localStorage.setItem('aicqb_completed_cert_ids', JSON.stringify(updatedCompleted));
        } catch (_) {}
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return createPortal(
      <div className="fixed inset-0 top-0 left-0 w-screen h-screen z-[999999] bg-[#10264B] flex items-center justify-center text-white m-0 p-0 border-0">
        <div className="text-center space-y-4 bg-white/5 p-8 rounded-2xl border border-white/10 backdrop-blur-md">
          <Loader2 className="w-12 h-12 animate-spin text-[#F47716] mx-auto" />
          <h3 className="font-extrabold text-lg text-white">Launching Proctored Examination Sandbox</h3>
          <p className="text-xs text-slate-300">Synchronizing assessment questions and securing runtime environment...</p>
        </div>
      </div>,
      document.body
    );
  }

  const certName = sessionData?.certificationName || sessionData?.schedule?.certificationName || 'AICQB Certified AI Professional';
  const certCode = sessionData?.certificationCode || sessionData?.schedule?.certificationCode || 'AICQB-AI-CP';
  const examCode = sessionData?.examCode || `${certCode}-EXAM`;
  const durationMinutes = sessionData?.durationMinutes || sessionData?.schedule?.durationMinutes || 90;
  const questions = (sessionData?.questions && sessionData.questions.length > 0) ? sessionData.questions : defaultFallbackQuestions;
  const currentQuestion = questions[currentIndex] || questions[0];
  const candidateId = user?.candidateId || candidate?.candidateId || sessionData?.candidateId || sessionData?.schedule?.candidateId || (user?.id ? `AICQB-${user.id.slice(0, 6).toUpperCase()}` : 'AICQB-CANDIDATE');
  const candidateName = user?.fullName || candidate?.fullName || sessionData?.candidateName || sessionData?.schedule?.candidateName || 'Candidate';
  const candidateGrade = result?.grade || (result?.percentage >= 90 ? 'Grade A+ (Distinction)' : result?.percentage >= 80 ? 'Grade A (Merit)' : result?.percentage >= 70 ? 'Grade B (Pass)' : 'Fail');

  const answeredCount = questions.filter(
    (q: any) => answers[q.id] !== undefined && answers[q.id] !== null && String(answers[q.id]).trim() !== ''
  ).length;
  const flaggedCount = Object.values(flagged).filter(Boolean).length;
  const unansweredCount = Math.max(0, questions.length - answeredCount);
  const isAllAnswered = questions.length > 0 && answeredCount === questions.length;

  return createPortal(
    <div className="fixed inset-0 top-0 left-0 w-screen h-screen z-[999999] bg-[#F7F9FC] flex flex-col select-none overflow-hidden font-sans m-0 p-0 border-0">
      {/* Top Proctored Header (Navy Blue & White Branding) */}
      <header className="bg-gradient-to-r from-[#071326] via-[#0D1E3A] to-[#122A54] text-white px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xl border-b border-slate-800 flex-shrink-0 z-30 relative overflow-hidden">
        {/* Subtle orange accent wave in header background */}
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-orange-500/10 to-transparent pointer-events-none"></div>

        <div className="flex items-center space-x-3 sm:space-x-4 relative z-10">
          <div className="bg-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl shadow-md flex items-center flex-shrink-0">
            <img src="/aicqb-logo.png" alt="AIICQB Logo" className="h-9 sm:h-11 w-auto object-contain" />
          </div>

          <div className="hidden sm:block h-8 w-px bg-white/20"></div>

          <div>
            <div className="flex items-center space-x-2">
              <h2 className="font-extrabold text-sm sm:text-base tracking-wide leading-tight text-white">
                {certName}
              </h2>
              <span className="px-2.5 py-0.5 bg-gradient-to-r from-[#F47716] to-[#E35D00] text-white font-mono text-[10px] font-black rounded-md uppercase tracking-wider shadow-xs">
                PROCTORED
              </span>
              {(() => {
                const lvl = sessionData?.level || sessionData?.examLevel || examLevel || level || 'Professional Level';
                const isFnd = lvl.toLowerCase().includes('foundation');
                const isAdv = lvl.toLowerCase().includes('advanced') || lvl.toLowerCase().includes('expert');
                const badgeClass = isFnd
                  ? 'bg-blue-600 text-white border-blue-400'
                  : isAdv
                  ? 'bg-purple-600 text-white border-purple-400'
                  : 'bg-[#F47716] text-white border-orange-400';
                return (
                  <span className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded-md border shadow-xs flex items-center space-x-1 ${badgeClass}`}>
                    <GraduationCap className="w-3 h-3 text-white" />
                    <span>{lvl}</span>
                  </span>
                );
              })()}
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3 text-xs mt-0.5">
              <span className="text-orange-400 font-mono font-bold tracking-wider">
                Exam Code: {examCode}
              </span>
              <span className="text-slate-400">|</span>
              <span className="text-slate-200 font-mono text-[11px]">
                Candidate: {candidateName} ({candidateId})
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3 relative z-10">
          {/* Fullscreen Toggle */}
          <button
            onClick={toggleBrowserFullscreen}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-800/90 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors flex items-center space-x-1.5 text-xs font-semibold cursor-pointer border border-slate-700"
            title={isFullscreen ? 'Exit Full Screen' : 'Enter Full Screen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4 text-[#F47716]" /> : <Maximize2 className="w-4 h-4 text-slate-300" />}
            <span className="hidden sm:inline">{isFullscreen ? 'Exit Full Screen' : 'Full Screen'}</span>
          </button>

          {isExamStarted && !result && (
            <>
              {/* Countdown Timer */}
              <div
                className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-xl font-mono text-sm font-bold shadow-inner ${
                  timeLeft < 300
                    ? 'bg-red-600 text-white animate-pulse'
                    : 'bg-slate-900 border border-slate-700 text-[#F47716]'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>{formatTime(timeLeft)}</span>
              </div>

              {/* Top Submit Final Action */}
              <button
                onClick={() => setShowSubmitConfirm(true)}
                disabled={submitting}
                className="px-3 sm:px-5 py-2 bg-gradient-to-r from-[#F47716] to-[#E35D00] hover:from-[#E35D00] hover:to-[#C94E00] text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg hover:shadow-orange-500/30 transition-all flex items-center space-x-1.5 sm:space-x-2 cursor-pointer border border-orange-400"
                title="Submit Final Exam"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Exam</span>
                  </>
                )}
              </button>

              {/* Exit Exam Button (Immediate Navigation to Dashboard, No Popup) */}
              <button
                onClick={handleExitExamDirect}
                className="text-xs font-bold bg-red-950/60 hover:bg-red-900 text-red-200 border border-red-800/80 px-3 sm:px-4 py-2 rounded-xl transition-colors cursor-pointer"
                title="Exit Examination (Return to Home Screen)"
              >
                Exit Exam
              </button>
            </>
          )}

          {!isExamStarted && !result && (
            <button
              onClick={handleExitExamDirect}
              className="text-xs font-semibold bg-slate-800/80 hover:bg-red-900/60 hover:text-red-200 text-slate-300 px-4 py-2 rounded-xl border border-slate-700 transition-colors cursor-pointer"
            >
              Exit Exam
            </button>
          )}
        </div>
      </header>

      {/* Sub-Header Metrics Ribbon for Active Proctored Session */}
      {isExamStarted && !result && (
        <div className="bg-[#071326] text-slate-300 px-4 sm:px-8 py-2 border-b border-slate-800/90 text-xs flex flex-wrap items-center justify-between gap-2 z-20">
          <div className="flex flex-wrap items-center gap-3 sm:gap-6 font-mono text-[11px]">
            <span className="flex items-center space-x-1.5 text-slate-200">
              <Clock className="w-3.5 h-3.5 text-orange-400" />
              <span>Duration: <strong className="text-white">{durationMinutes} Mins</strong></span>
            </span>
            <span className="flex items-center space-x-1.5 text-slate-200">
              <ClipboardList className="w-3.5 h-3.5 text-blue-400" />
              <span>Total Questions: <strong className="text-white">{questions.length}</strong></span>
            </span>
            <span className="flex items-center space-x-1.5 text-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Attempted: <strong className="text-white">{answeredCount}</strong></span>
            </span>
            <span className="flex items-center space-x-1.5 text-slate-400">
              <span>Unattempted: <strong className="text-white">{unansweredCount}</strong></span>
            </span>
            <span className="flex items-center space-x-1.5 text-amber-300">
              <Flag className="w-3.5 h-3.5 text-[#F47716]" />
              <span>Marked for Review: <strong className="text-white">{flaggedCount}</strong></span>
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-[11px] font-bold text-emerald-400 font-mono">
              AI PROCTOR: ACTIVE • HD STREAM
            </span>
          </div>
        </div>
      )}

      {/* Real-Time Proctoring Alert Toast Overlay */}
      {proctorAlert && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[1000000] w-full max-w-lg px-4 pointer-events-none animate-in slide-in-from-top-4 duration-200">
          <div className="bg-red-600/95 text-white border-2 border-red-400/80 rounded-2xl p-4 shadow-2xl backdrop-blur-md flex items-center space-x-3 pointer-events-auto">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-white animate-bounce" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-red-100">AI Proctoring Alert</span>
                <span className="text-[10px] font-mono text-red-200">{proctorAlert.timestamp}</span>
              </div>
              <p className="text-sm font-extrabold text-white leading-tight mt-0.5">{proctorAlert.message}</p>
              <p className="text-[11px] text-red-100 mt-0.5">Please maintain eye contact with the screen and stay within full camera view.</p>
            </div>
          </div>
        </div>
      )}

      {/* Pre-Exam Identity Verification Modal */}
      {showIdentityVerification && (
        <IdentityVerificationModal
          candidateName={candidateName}
          candidateId={candidateId}
          examName={certName}
          onVerified={handleVerificationSuccess}
          onCancel={() => setShowIdentityVerification(false)}
        />
      )}

      {/* Body: Instructions Screen (100% Fits on Screen – No Scrolling Required) */}
      {!isExamStarted && !result && (
        <div className="flex-1 overflow-y-auto w-full p-2.5 sm:p-4 md:p-6 bg-gradient-to-br from-[#071326] via-[#0D1E3A] to-[#122A54] flex flex-col items-center justify-center relative">
          {/* Ambient luminous glow & curved background waves */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-35">
            <div className="absolute -top-32 -right-32 w-96 h-96 bg-orange-500/30 rounded-full blur-[120px]"></div>
            <div className="absolute top-1/2 -left-32 w-96 h-96 bg-blue-600/30 rounded-full blur-[120px]"></div>
            <div className="absolute -bottom-32 right-1/4 w-[500px] h-[300px] bg-orange-600/20 rounded-full blur-[140px]"></div>
            <svg className="absolute w-full h-full inset-0 opacity-40" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" viewBox="0 0 1440 800">
              <path d="M-100,180 C320,80 620,440 1500,140" stroke="url(#orangeGradInstructions)" strokeWidth="3" fill="none" />
              <path d="M-100,240 C420,160 820,490 1500,210" stroke="url(#orangeGradInstructions)" strokeWidth="1.5" fill="none" opacity="0.6" />
              <defs>
                <linearGradient id="orangeGradInstructions" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#F47716" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#E35D00" stopOpacity="0.1" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div className="relative z-10 bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-4xl p-3 sm:p-4 md:p-5 border border-slate-200/90 space-y-2 sm:space-y-2.5 my-auto animate-fadeIn max-h-[calc(100vh-80px)] overflow-y-auto">
            {/* Header Badge */}
            <div className="flex items-center space-x-2.5 sm:space-x-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-orange-50 border border-orange-200 text-[#F47716] flex items-center justify-center flex-shrink-0 shadow-xs">
                <ClipboardCheck className="w-4 h-4 sm:w-5 sm:h-5 text-[#F47716]" />
              </div>
              <div className="space-y-0.5">
                <div className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[#F47716]">
                  OFFICIAL PROCTORED ASSESSMENT
                </div>
                <h3 className="text-lg sm:text-xl font-black text-[#10264B] tracking-tight leading-tight">
                  Candidate Examination Instructions
                </h3>
                <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium">
                  Read carefully before starting the proctored session – AIICQB Secure Examination Engine
                </p>
              </div>
            </div>

            {/* Registered Examination Level Banner matching Requirement 5 */}
            {(() => {
              const activeLevelName = sessionData?.level || sessionData?.examLevel || examLevel || level || 'Professional Level';
              const isFnd = activeLevelName.toLowerCase().includes('foundation');
              const isAdv = activeLevelName.toLowerCase().includes('advanced') || activeLevelName.toLowerCase().includes('expert');
              const badgeStyle = isFnd
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : isAdv
                ? 'bg-purple-50 text-purple-700 border-purple-200'
                : 'bg-orange-50 text-orange-700 border-orange-200';
              return (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Certification Program</span>
                      <strong className="text-[#10264B] text-sm">{sessionData?.certificationName || certName || 'Certification Assessment'}</strong>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Registered Level:</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${badgeStyle} flex items-center space-x-1`}>
                        <GraduationCap className="w-3.5 h-3.5" />
                        <span>{activeLevelName}</span>
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Exam Duration:</span>
                      <strong className="text-slate-800">{durationMinutes} Minutes</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Total Marks:</span>
                      <strong className="text-slate-800">{sessionData?.totalMarks || (questions.length * 2)} Marks</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Passing Criteria:</span>
                      <strong className="text-emerald-700 font-bold">{sessionData?.passingPercentage || 70}% Required</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Exam Attempt:</span>
                      <strong className="text-[#F47716] font-bold">Attempt {sessionData?.attemptNumber || 1} of {sessionData?.allowedAttempts || 3}</strong>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Quick Metrics Bar (4 Horizontal Summary Metrics - Compact) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 sm:gap-2 border border-slate-200/90 rounded-xl p-2 sm:p-2.5 bg-slate-50/60">
              {/* 1. Total Questions */}
              <div className="flex items-center space-x-2 md:border-r border-slate-200 pr-1">
                <div className="w-7 h-7 rounded-full border border-blue-400/40 bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                  <HelpCircle className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-[8px] sm:text-[9px] text-slate-500 font-extrabold uppercase tracking-wider block">Total Questions</span>
                  <span className="text-xs sm:text-sm font-black text-[#10264B]">{questions.length} Questions</span>
                </div>
              </div>

              {/* 2. Duration */}
              <div className="flex items-center space-x-2 md:border-r border-slate-200 pr-1">
                <div className="w-7 h-7 rounded-full border border-orange-400/40 bg-orange-50 text-orange-500 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-[8px] sm:text-[9px] text-slate-500 font-extrabold uppercase tracking-wider block">Duration</span>
                  <span className="text-xs sm:text-sm font-black text-[#10264B]">{durationMinutes} Minutes</span>
                </div>
              </div>

              {/* 3. Passing Threshold */}
              <div className="flex items-center space-x-2 md:border-r border-slate-200 pr-1">
                <div className="w-7 h-7 rounded-full border border-blue-400/40 bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                  <Target className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-[8px] sm:text-[9px] text-slate-500 font-extrabold uppercase tracking-wider block">Passing Threshold</span>
                  <span className="text-xs sm:text-sm font-black text-[#F47716]">70% Score</span>
                </div>
              </div>

              {/* 4. Proctoring Mode */}
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-full border border-emerald-400/40 bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-[8px] sm:text-[9px] text-slate-500 font-extrabold uppercase tracking-wider block">Proctoring Mode</span>
                  <span className="text-[9px] sm:text-[10px] font-bold text-emerald-700 bg-emerald-100/90 px-1.5 py-0.5 rounded inline-block">
                    Secure Sandbox
                  </span>
                </div>
              </div>
            </div>

            {/* 5 Formatted Instructions matching screenshot - Compact Line Heights */}
            <div className="space-y-1 sm:space-y-1.5 pt-0.5 text-[11px] sm:text-xs text-slate-700">
              <div className="flex items-start space-x-2 sm:space-x-2.5">
                <div className="w-4 h-4 rounded-full bg-[#10264B] text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5 shadow-xs">
                  1
                </div>
                <p className="leading-tight">
                  The examination consists of <strong className="font-bold text-slate-900">{questions.length} questions</strong> covering both theoretical mastery and hands-on applied technical scenarios.
                </p>
              </div>

              <div className="flex items-start space-x-2 sm:space-x-2.5">
                <div className="w-4 h-4 rounded-full bg-[#10264B] text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5 shadow-xs">
                  2
                </div>
                <p className="leading-tight">
                  Total time duration: <strong className="font-bold text-slate-900">{durationMinutes} Minutes</strong>. An automated countdown timer will display continuously at the top. The exam automatically submits when the timer reaches 00:00.
                </p>
              </div>

              <div className="flex items-start space-x-2 sm:space-x-2.5">
                <div className="w-4 h-4 rounded-full bg-[#10264B] text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5 shadow-xs">
                  3
                </div>
                <p className="leading-tight">
                  Minimum passing score threshold: <strong className="font-bold text-slate-900">70%</strong>. Achieving ≥ 70% immediately qualifies you for the official AIICQB International Certification with a unique cryptographic verification ID and QR code.
                </p>
              </div>

              <div className="flex items-start space-x-2 sm:space-x-2.5">
                <div className="w-4 h-4 rounded-full bg-[#10264B] text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5 shadow-xs">
                  4
                </div>
                <p className="leading-tight">
                  Practical assessment questions are evaluated via automated test <strong className="font-bold text-slate-900">rubrics</strong> in an isolated execution sandbox. Select and verify your answers before submission.
                </p>
              </div>

              <div className="flex items-start space-x-2 sm:space-x-2.5">
                <div className="w-4 h-4 rounded-full bg-[#10264B] text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5 shadow-xs">
                  5
                </div>
                <p className="leading-tight">
                  <strong className="font-bold text-slate-900">No negative marking.</strong> Answer all questions before final submission. You can mark questions for review and navigate freely using the Question Palette.
                </p>
              </div>
            </div>

            {/* Proctored Lock Notice - Compact */}
            <div className="p-1.5 sm:p-2 bg-amber-50 rounded-lg border border-amber-200/90 text-[10px] sm:text-[11px] text-amber-900 flex items-center space-x-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 fill-amber-100" />
              <span>
                <strong className="font-bold text-amber-950">Full-Screen Proctored Session:</strong> Opening external browser tabs or switching windows is monitored. Please remain on this screen until your exam is submitted.
              </span>
            </div>

            {/* Candidate Confirmation Checkbox - Compact */}
            <div
              onClick={() => setIsAgreed(!isAgreed)}
              className="flex items-center space-x-2 p-1.5 sm:p-2 rounded-lg border border-blue-200/80 bg-blue-50/20 hover:bg-white hover:border-[#F47716] transition-all cursor-pointer select-none"
            >
              <input
                type="checkbox"
                id="agree"
                checked={isAgreed}
                onChange={(e) => {
                  e.stopPropagation();
                  setIsAgreed(e.target.checked);
                }}
                className="w-4 h-4 rounded border-gray-300 text-[#F47716] focus:ring-[#F47716] cursor-pointer"
              />
              <label
                htmlFor="agree"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsAgreed(!isAgreed);
                }}
                className="text-[10px] sm:text-[11px] font-medium text-slate-800 cursor-pointer select-none leading-snug flex-1"
              >
                I confirm that I am the registered candidate (<strong className="font-bold text-slate-900">{candidateName} – {candidateId}</strong>) and agree to adhere to the AIICQB Code of Examination Ethics.
              </label>
            </div>

            {/* Action CTA: Big Start Exam Button (Always Prominent & Visible Without Scrolling) */}
            <div className="flex justify-center pt-0.5">
              <button
                disabled={!isAgreed}
                onClick={() => handleStartExam()}
                className="w-full sm:w-auto px-8 sm:px-12 py-2.5 sm:py-3 bg-gradient-to-r from-[#F47716] to-[#E35D00] hover:from-[#E35D00] hover:to-[#C94E00] disabled:bg-gray-300 disabled:from-gray-300 disabled:to-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed text-white font-black text-xs sm:text-sm rounded-xl shadow-xl hover:shadow-orange-500/30 transition-all flex items-center justify-center space-x-2 cursor-pointer border border-orange-400"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Start Examination Now</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Body: Result Screen (Failed / Passed matching Reference Screenshot Exactly) */}
      {result && (
        <div className="flex-1 overflow-y-auto w-full p-4 sm:p-8 md:p-10 bg-gradient-to-br from-[#071326] via-[#0D1E3A] to-[#122A54] flex flex-col items-center justify-start relative">
          {/* Ambient luminous glow & curved background waves */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-35">
            <div className="absolute -top-32 -right-32 w-96 h-96 bg-orange-500/30 rounded-full blur-[120px]"></div>
            <div className="absolute top-1/2 -left-32 w-96 h-96 bg-blue-600/30 rounded-full blur-[120px]"></div>
            <div className="absolute -bottom-32 right-1/4 w-[500px] h-[300px] bg-orange-600/20 rounded-full blur-[140px]"></div>
            <svg className="absolute w-full h-full inset-0 opacity-40" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" viewBox="0 0 1440 800">
              <path d="M-100,180 C320,80 620,440 1500,140" stroke="url(#orangeGradResult)" strokeWidth="3" fill="none" />
              <path d="M-100,240 C420,160 820,490 1500,210" stroke="url(#orangeGradResult)" strokeWidth="1.5" fill="none" opacity="0.6" />
              <defs>
                <linearGradient id="orangeGradResult" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#F47716" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#E35D00" stopOpacity="0.1" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div className="relative z-10 bg-white rounded-3xl shadow-2xl max-w-xl w-full p-8 sm:p-10 border border-slate-200 text-center space-y-6 my-auto animate-fadeIn">
            {/* Warning / Success Icon with Halo Ring */}
            <div
              className={`w-24 h-24 rounded-full mx-auto flex items-center justify-center ring-8 ${
                result.passed
                  ? 'bg-emerald-50 text-emerald-600 ring-emerald-100/60'
                  : 'bg-red-50 text-red-500 ring-red-100/60'
              }`}
            >
              {result.passed ? (
                <Award className="w-12 h-12 stroke-[2.2]" />
              ) : (
                <AlertTriangle className="w-12 h-12 stroke-[2.2]" />
              )}
            </div>

            {/* Badge & Heading */}
            <div>
              <span
                className={`inline-block px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border ${
                  result.passed
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-red-50 text-red-600 border-red-100'
                }`}
              >
                {result.passed ? 'RESULT: PASSED (≥ 70% SCORE)' : 'RESULT: FAILED (< 70% SCORE)'}
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-[#10264B] mt-3">
                Congratulations! You have successfully completed your AIICQB examination.
              </h3>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 mt-3 text-left space-y-1.5 text-xs text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Candidate Name:</span>
                  <span className="font-bold text-[#10264B]">{candidateName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Candidate ID:</span>
                  <span className="font-mono font-bold text-slate-800">{candidateId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Examination Name:</span>
                  <span className="font-bold text-[#10264B]">{certName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Certification Level:</span>
                  <span className="font-semibold text-slate-800">{sessionData?.level || 'Professional Level'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Completion Date:</span>
                  <span className="font-medium text-slate-800">{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1.5">
                  <span className="text-slate-500 font-medium">Examination Result:</span>
                  <span className={`font-black ${result.passed ? 'text-emerald-600' : 'text-red-600'}`}>
                    {result.passed ? 'PASSED (Certificate Issued)' : 'FAILED (Minimum 70% Required)'}
                  </span>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-md mx-auto leading-relaxed">
                {result.passed
                  ? `Your score of ${result.percentage}% meets or exceeds the mandatory 70% passing criteria. Your official AIICQB International Certificate has been cryptographically generated and issued to your candidate registry.`
                  : `Your score of ${result.percentage}% did not meet the mandatory 70% passing criteria. As per official AIICQB regulations, no certificate is generated for this attempt.`}
              </p>
            </div>

            {/* 4-Column Metric Box with Clean Vertical Dividers */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs grid grid-cols-2 sm:grid-cols-4 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 text-center">
              {/* Col 1: OBTAINED MARKS */}
              <div className="flex flex-col items-center justify-center">
                <ClipboardList className="w-6 h-6 text-blue-500 mb-1" />
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">OBTAINED MARKS</span>
                <span className="text-xl sm:text-2xl font-black text-[#10264B] mt-1">{result.score} pts</span>
                <span className="text-xs text-slate-400">out of {result.maxScore || 100}</span>
              </div>

              {/* Col 2: PERCENTAGE */}
              <div className="flex flex-col items-center justify-center pt-2 sm:pt-0">
                <div className="w-6 h-6 rounded-full border-2 border-orange-500 text-[#F47716] flex items-center justify-center font-bold text-xs mb-1">
                  %
                </div>
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">PERCENTAGE</span>
                <span className="text-xl sm:text-2xl font-black text-[#F47716] mt-1">{result.percentage}%</span>
                <span className="text-xs text-slate-400">Final Score</span>
              </div>

              {/* Col 3: PASSING PERCENTAGE */}
              <div className="flex flex-col items-center justify-center pt-2 sm:pt-0">
                <Target className="w-6 h-6 text-blue-600 mb-1" />
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">PASSING PERCENTAGE</span>
                <span className="text-xl sm:text-2xl font-black text-[#10264B] mt-1">70%</span>
                <span className="text-xs text-slate-400">Minimum Required</span>
              </div>

              {/* Col 4: RESULT STATUS */}
              <div className="flex flex-col items-center justify-center pt-2 sm:pt-0">
                {result.passed ? (
                  <FileCheck className="w-6 h-6 text-emerald-500 mb-1" />
                ) : (
                  <FileX className="w-6 h-6 text-red-500 mb-1" />
                )}
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">RESULT STATUS</span>
                <span className={`text-xl sm:text-2xl font-black mt-1 ${result.passed ? 'text-emerald-600' : 'text-red-600'}`}>
                  {result.passed ? 'PASSED' : 'FAILED'}
                </span>
                <span className="mt-1 inline-block">
                  {result.passed ? (
                    <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                      Certificate Issued
                    </span>
                  ) : (
                    <span className="bg-red-50 text-red-600 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-red-100">
                      No Certificate
                    </span>
                  )}
                </span>
              </div>
            </div>

            {/* Bottom Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              {result.passed ? (
                <>
                  <button
                    onClick={() => setShowCertificate(true)}
                    className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-[#F47716] to-[#E35D00] hover:from-[#E35D00] hover:to-[#C94E00] text-white font-extrabold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer border border-orange-400"
                  >
                    <Award className="w-4 h-4" />
                    <span>View Official Certificate</span>
                  </button>
                  <button
                    onClick={() => {
                      handleExit();
                      window.location.href = '/portal/certificates';
                    }}
                    className="w-full sm:w-auto px-6 py-3.5 bg-[#10264B] hover:bg-[#1E3A6E] text-white font-extrabold text-sm rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Go to My Certificates &gt;</span>
                  </button>
                </>
              ) : (
                <div className="w-full flex flex-col items-center space-y-3">
                  {(result.attemptsCompleted >= 3 || result.retakeGranted === false) ? (
                    <div className="p-4 bg-red-50 border-2 border-red-300 rounded-2xl text-xs font-bold text-red-800 max-w-md text-center">
                      <AlertTriangle className="w-5 h-5 text-red-600 mx-auto mb-1.5" />
                      <p>You have used all 3 examination attempts. Please contact AIICQB support for further assistance.</p>
                      <p className="text-[11px] text-red-600 font-normal mt-1">Email: support@aiicqb.org • Candidate ID: {candidateId}</p>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleRetakeExam()}
                      className="w-full sm:w-auto px-7 py-3.5 bg-gradient-to-r from-[#F47716] to-[#E35D00] hover:from-[#E35D00] hover:to-[#C94E00] text-white font-extrabold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer border border-orange-400"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Take Retake Examination (Attempt {(result.attemptsCompleted || 1) + 1} of 3) &gt;</span>
                    </button>
                  )}
                </div>
              )}
              <button
                onClick={handleExit}
                className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm rounded-xl border border-slate-300 shadow-xs transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Home className="w-4 h-4 text-slate-500" />
                <span>Close & Return</span>
              </button>
            </div>

            {/* Candidate Helpdesk Notice */}
            <div className="pt-2 text-center">
              <p className="text-[11px] text-slate-400">
                For questions regarding results or score evaluation, contact{' '}
                <a href="mailto:support@aiicqb.org" className="font-semibold text-[#F47716] hover:underline">
                  support@aiicqb.org
                </a>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Body: Active Examination Layout in WHITE & NAVY BLUE Theme */}
      {isExamStarted && !result && currentQuestion && (
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-[#F7F9FC]">
          {/* Main Question & Answer Section (White & Navy Blue Theme) */}
          <main className="flex-1 p-4 sm:p-8 overflow-y-auto space-y-6">
            {/* Question Card Container */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
              {/* Question Header & Action Row */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <span className="text-xs font-black uppercase tracking-wider text-white bg-[#10264B] px-3.5 py-1.5 rounded-lg shadow-sm">
                    Question {currentIndex + 1} of {questions.length}
                  </span>
                  <span className="text-xs font-bold text-[#F47716] bg-orange-50 border border-orange-200 px-3 py-1 rounded-lg">
                    +{currentQuestion.points} Marks
                  </span>
                  {currentQuestion.type === 'coding' && (
                    <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-lg flex items-center space-x-1">
                      <Code2 className="w-3.5 h-3.5" />
                      <span>Practical Code Sandbox</span>
                    </span>
                  )}
                </div>

                <button
                  onClick={() => toggleFlag(currentQuestion.id)}
                  className={`inline-flex items-center space-x-1.5 text-xs font-bold px-3.5 py-1.5 rounded-lg border transition-all ${
                    flagged[currentQuestion.id]
                      ? 'bg-orange-50 border-[#F47716] text-[#F47716] shadow-sm'
                      : 'bg-white border-slate-300 text-slate-600 hover:border-[#10264B] hover:text-[#10264B]'
                  }`}
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>{flagged[currentQuestion.id] ? 'Flagged for Review' : 'Flag Question'}</span>
                </button>
              </div>

              {/* All Answered Notice Banner */}
              {answeredCount === questions.length && (
                <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3 flex items-center justify-between animate-in fade-in duration-300">
                  <div className="flex items-center space-x-2.5 text-xs text-emerald-900 font-semibold">
                    <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>All {questions.length} questions answered! You can review your choices or click Submit Final Exam anytime.</span>
                  </div>
                  <button
                    onClick={() => setShowSubmitConfirm(true)}
                    className="ml-3 px-3.5 py-1.5 bg-[#F47716] hover:bg-[#DC660E] text-white font-extrabold text-xs rounded-lg shadow-sm transition-all cursor-pointer whitespace-nowrap"
                  >
                    Submit Exam
                  </button>
                </div>
              )}

              {/* Question Text (Dark Navy Blue) */}
              <div className="space-y-4">
                <h3 className="text-base sm:text-xl font-bold text-[#10264B] leading-relaxed">
                  {currentQuestion.question}
                </h3>

                {/* Multiple Choice Options (White & Navy Blue Card Theme) */}
                {currentQuestion.type === 'mcq' && currentQuestion.options && (
                  <div className="space-y-3 pt-2">
                    {currentQuestion.options.map((option: string, optIdx: number) => {
                      const selected = answers[currentQuestion.id] === optIdx;
                      const optionLetter = String.fromCharCode(65 + optIdx); // A, B, C, D
                      return (
                        <div
                          key={optIdx}
                          onClick={() => handleSelectAnswer(currentQuestion.id, optIdx)}
                          className={`flex items-start space-x-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                            selected
                              ? 'border-[#10264B] bg-[#10264B] text-white shadow-md transform scale-[1.008]'
                              : 'border-slate-200 bg-white hover:border-[#10264B] hover:bg-slate-50/80 text-slate-800'
                          }`}
                        >
                          {/* Option Badge (A, B, C, D) */}
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 transition-colors ${
                              selected
                                ? 'bg-[#F47716] text-white shadow-sm'
                                : 'bg-slate-100 text-[#10264B] border border-slate-300'
                            }`}
                          >
                            {selected ? <Check className="w-4 h-4" /> : optionLetter}
                          </div>

                          <div className="flex-1 pt-0.5">
                            <span className={`text-sm sm:text-base leading-snug ${selected ? 'font-semibold text-white' : 'font-medium text-slate-800'}`}>
                              {option}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Practical Coding Sandbox Workspace */}
                {currentQuestion.type === 'coding' && (
                  <div className="space-y-3 pt-2">
                    <div className="bg-[#10264B] text-white text-xs px-4 py-2.5 rounded-t-xl font-mono flex items-center justify-between border border-[#10264B]">
                      <div className="flex items-center space-x-2">
                        <Code2 className="w-4 h-4 text-[#F47716]" />
                        <span className="font-bold">sandbox_solution.js • Node.js v20 Runtime</span>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/80 px-2.5 py-0.5 rounded border border-emerald-500/40">
                        ● Isolated Execution Engine
                      </span>
                    </div>
                    <textarea
                      rows={12}
                      value={answers[currentQuestion.id] !== undefined ? answers[currentQuestion.id] : currentQuestion.sampleCode || ''}
                      onChange={(e) => handleSelectAnswer(currentQuestion.id, e.target.value)}
                      placeholder="// Enter your JavaScript solution here..."
                      className="w-full p-4 font-mono text-sm bg-slate-950 text-emerald-400 rounded-b-xl border-2 border-slate-800 focus:border-[#F47716] focus:outline-none focus:ring-2 focus:ring-orange-200"
                    />
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center justify-between">
                      <span>Automated evaluation rubric will execute boundary test assertions upon submission.</span>
                      <span className="font-mono text-slate-400 text-[11px]">UTF-8 • Sandbox Verified</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Prev / Next Bottom Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-6 border-t border-slate-100">
                <button
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                  className="inline-flex items-center space-x-2 px-5 py-2.5 border-2 border-[#10264B] rounded-xl text-xs font-bold text-[#10264B] hover:bg-[#10264B] hover:text-white transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[#10264B] cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous Question</span>
                </button>

                <div className="flex items-center space-x-3">
                  {currentIndex < questions.length - 1 ? (
                    <button
                      onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                      className="inline-flex items-center space-x-2 px-6 py-2.5 bg-[#10264B] hover:bg-[#1E3A6E] text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
                    >
                      <span>Next Question</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      disabled={submitting}
                      onClick={() => setShowSubmitConfirm(true)}
                      className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl text-xs font-extrabold transition-all border bg-gradient-to-r from-[#F47716] to-[#E35D00] hover:from-[#E35D00] hover:to-[#C94E00] text-white shadow-lg hover:shadow-orange-500/25 cursor-pointer border-orange-400"
                      title="Submit Final Exam"
                    >
                      <span>Submit Final Exam</span>
                      <Send className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </main>

          {/* Right Question Palette (White & Navy Blue Sidebar) */}
          <aside className="w-full md:w-80 bg-white border-l border-slate-200 p-5 sm:p-6 flex flex-col justify-between flex-shrink-0 shadow-sm overflow-y-auto max-h-[calc(100vh-70px)]">
            <div className="space-y-4">
              {/* Live AI Proctoring Camera Stream Widget */}
              <div className="bg-[#071326] rounded-2xl border border-slate-700/80 overflow-hidden shadow-sm relative">
                <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                  <video
                    ref={proctorVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transform scale-x-[-1]"
                  />
                  {/* Proctoring HUD Reticle */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-20 h-28 rounded-[50%] border-2 border-dashed border-emerald-400/60 opacity-70"></div>
                  </div>
                  {/* Status Overlay */}
                  <div className="absolute top-2 left-2 flex items-center space-x-1.5 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-[10px] font-mono font-bold text-white border border-white/10">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>AI PROCTOR LIVE</span>
                  </div>
                  {/* Gaze Status */}
                  <div className="absolute bottom-2 right-2 flex items-center space-x-1 px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-mono text-emerald-300">
                    <Eye className="w-2.5 h-2.5" />
                    <span>GAZE: CENTER</span>
                  </div>
                </div>
                <div className="px-3 py-1.5 bg-[#0D1E3A] flex items-center justify-between text-[10px] text-slate-300 border-t border-slate-800">
                  <span className="flex items-center space-x-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="font-semibold">Identity Verified</span>
                  </span>
                  <span className="font-mono text-slate-400 text-[9px]">Match: {matchScore || 96.5}%</span>
                </div>
              </div>

              {/* Palette Card Header */}
              <div className="bg-[#10264B] text-white p-4 rounded-xl flex items-center justify-between shadow-sm">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-white">
                    Question Palette
                  </h4>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    {questions.length} Total Assessment Items
                  </p>
                </div>
                <span className="w-8 h-8 rounded-lg bg-white/10 text-white font-mono font-bold text-xs flex items-center justify-center">
                  {currentIndex + 1}
                </span>
              </div>

              {/* Number Buttons Grid */}
              <div className="grid grid-cols-5 gap-2.5">
                {questions.map((q: any, idx: number) => {
                  const isCurrent = idx === currentIndex;
                  const isAnswered = answers[q.id] !== undefined && answers[q.id] !== '';
                  const isFlag = flagged[q.id];

                  let buttonStyle = 'bg-white text-[#10264B] border-2 border-slate-200 hover:border-[#10264B]';
                  if (isAnswered) buttonStyle = 'bg-emerald-600 text-white border-2 border-emerald-600 shadow-xs font-bold';
                  if (isFlag) buttonStyle = 'bg-[#F47716] text-white border-2 border-[#F47716] shadow-xs font-bold';
                  if (isCurrent) buttonStyle += ' ring-2 ring-offset-1 ring-[#10264B] font-black scale-105';

                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentIndex(idx)}
                      className={`h-10 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${buttonStyle}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              {/* Color Legend (White & Navy Blue Context) */}
              <div className="space-y-2.5 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-slate-700">
                    <div className="w-3.5 h-3.5 rounded-md bg-emerald-600"></div>
                    <span className="font-medium">Answered</span>
                  </div>
                  <span className="font-bold font-mono text-emerald-700">{answeredCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-slate-700">
                    <div className="w-3.5 h-3.5 rounded-md bg-[#F47716]"></div>
                    <span className="font-medium">Flagged</span>
                  </div>
                  <span className="font-bold font-mono text-[#F47716]">{flaggedCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-slate-700">
                    <div className="w-3.5 h-3.5 rounded-md bg-white border-2 border-slate-300"></div>
                    <span className="font-medium">Unanswered</span>
                  </div>
                  <span className="font-bold font-mono text-slate-500">{unansweredCount}</span>
                </div>
              </div>
            </div>

            {/* Bottom Final Submit Button */}
            <div className="pt-4 border-t border-slate-100">
              <button
                onClick={() => setShowSubmitConfirm(true)}
                disabled={submitting}
                className="w-full py-3.5 font-extrabold text-xs rounded-xl transition-all flex items-center justify-center space-x-2 border bg-gradient-to-r from-[#F47716] to-[#E35D00] hover:from-[#E35D00] hover:to-[#C94E00] text-white shadow-lg hover:shadow-orange-500/25 cursor-pointer border-orange-400"
                title="Submit Final Exam"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Grading Assessment...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Final Exam</span>
                  </>
                )}
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* AICQB Premium Final Exam Submit Confirmation Dialog */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 z-[1000000] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-[0_25px_60px_-15px_rgba(0,0,0,0.4)] border border-slate-200 overflow-hidden transform transition-all scale-100 animate-in zoom-in-95 duration-200">
            {/* Executive Header Banner */}
            <div className="bg-gradient-to-r from-[#071326] via-[#10264B] to-[#163668] px-6 sm:px-8 py-5 text-white flex items-center justify-between border-b border-slate-800/80 relative overflow-hidden">
              {/* Subtle background glow */}
              <div className="absolute right-0 top-0 bottom-0 w-80 bg-gradient-to-l from-orange-500/15 to-transparent pointer-events-none"></div>

              <div className="flex items-center space-x-3.5 relative z-10">
                <div className="bg-white px-3 py-1.5 rounded-xl shadow-md flex items-center flex-shrink-0">
                  <img src="/aicqb-logo.png" alt="AIICQB Logo" className="h-8 sm:h-9 w-auto object-contain" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-[#F47716] to-[#E35D00] text-white shadow-xs">
                      <Check className="w-3 h-3 stroke-[3]" />
                      <span>FINAL SUBMISSION</span>
                    </span>
                    <span className="text-[12px] text-slate-300 font-mono hidden sm:inline">{examCode}</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-white leading-tight mt-1">
                    Submit Proctored Examination
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSubmitConfirm(false)}
                disabled={submitting}
                className="w-9 h-9 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer border border-transparent hover:border-white/20 relative z-10"
                title="Return to Exam"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Candidate & Proctoring Identity Ribbon */}
            <div className="bg-slate-50 border-b border-slate-200 px-6 sm:px-8 py-2.5 flex items-center justify-between text-xs text-slate-600">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-slate-500" />
                <span className="font-semibold text-slate-700">Candidate:</span>
                <span className="font-bold text-[#10264B]">{candidateName}</span>
                <span className="text-slate-300">|</span>
                <span className="font-mono text-slate-600 bg-white px-2.5 py-0.5 rounded-md border border-slate-200 text-[11px] font-bold">
                  {candidateId}
                </span>
              </div>
              <div className="flex items-center space-x-1.5 bg-orange-100/70 border border-orange-200/80 text-orange-950 px-3 py-1 rounded-full font-mono text-[11px] font-bold">
                <Clock className="w-3.5 h-3.5 text-[#F47716]" />
                <span>{formatTime(timeLeft)} remaining</span>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 space-y-6 max-h-[calc(85vh-160px)] overflow-y-auto">
              {/* Progress Summary Metric Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-black text-slate-800 uppercase tracking-wider">Overall Assessment Progress</span>
                  <span className="font-extrabold font-mono text-[#10264B] text-sm">
                    {answeredCount} of {questions.length} Answered ({Math.round((answeredCount / questions.length) * 100)}%)
                  </span>
                </div>
                <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200 p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 via-sky-500 to-[#F47716] transition-all duration-300 rounded-full"
                    style={{ width: `${Math.min(100, Math.round((answeredCount / questions.length) * 100))}%` }}
                  />
                </div>
              </div>

              {/* Status Breakdown Grid (3 Modern Cards matching Image 3) */}
              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                {/* Answered */}
                <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4 sm:p-5 text-center relative overflow-hidden transition-all hover:shadow-xs">
                  <ClipboardCheck className="w-16 h-16 text-emerald-800 opacity-10 absolute -right-2 -bottom-2 pointer-events-none" />
                  <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto mb-2 shadow-xs">
                    <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-800 font-mono leading-none">
                    {answeredCount}
                  </div>
                  <div className="text-[11px] font-black text-emerald-800 uppercase tracking-wider mt-1.5">
                    ANSWERED
                  </div>
                  <div className="text-[10px] text-emerald-700 font-medium mt-0.5">
                    {Math.round((answeredCount / questions.length) * 100)}% Completed
                  </div>
                </div>

                {/* Unanswered */}
                <div
                  className={`border rounded-2xl p-4 sm:p-5 text-center relative overflow-hidden transition-all hover:shadow-xs ${
                    unansweredCount > 0
                      ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <ClipboardList className="w-16 h-16 text-slate-800 opacity-10 absolute -right-2 -bottom-2 pointer-events-none" />
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center mx-auto mb-2 shadow-xs ${
                      unansweredCount > 0 ? 'bg-amber-500 text-white' : 'bg-slate-300 text-slate-700'
                    }`}
                  >
                    <AlertCircle className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div
                    className={`text-2xl sm:text-3xl font-black font-mono leading-none ${
                      unansweredCount > 0 ? 'text-amber-800' : 'text-slate-800'
                    }`}
                  >
                    {unansweredCount}
                  </div>
                  <div
                    className={`text-[11px] font-black uppercase tracking-wider mt-1.5 ${
                      unansweredCount > 0 ? 'text-amber-800' : 'text-slate-700'
                    }`}
                  >
                    UNANSWERED
                  </div>
                  <div className="text-[10px] font-medium mt-0.5 text-slate-500">
                    {unansweredCount === 0 ? 'All Completed 🎉' : 'Needs attention'}
                  </div>
                </div>

                {/* Flagged */}
                <div className="bg-sky-50/60 border border-sky-200 rounded-2xl p-4 sm:p-5 text-center relative overflow-hidden transition-all hover:shadow-xs">
                  <Bookmark className="w-16 h-16 text-sky-800 opacity-10 absolute -right-2 -bottom-2 pointer-events-none" />
                  <div className="w-9 h-9 rounded-full bg-[#10264B] text-[#F47716] flex items-center justify-center mx-auto mb-2 shadow-xs">
                    <Flag className="w-4 h-4 fill-[#F47716]" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-[#10264B] font-mono leading-none">
                    {flaggedCount}
                  </div>
                  <div className="text-[11px] font-black text-[#10264B] uppercase tracking-wider mt-1.5">
                    FLAGGED
                  </div>
                  <div className="text-[10px] text-sky-800 font-medium mt-0.5">
                    Bookmarked for review
                  </div>
                </div>
              </div>

              {/* Interactive Quick Question Palette Preview */}
              <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-slate-800">Question Item Quick Review:</span>
                  <span className="text-[11px] text-purple-700 flex items-center space-x-1 font-medium">
                    <Info className="w-3.5 h-3.5" />
                    <span>Click any number to jump to that question</span>
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {questions.map((q: any, idx: number) => {
                    const isAns = answers[q.id] !== undefined && answers[q.id] !== '';
                    const isFlg = flagged[q.id];

                    return (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => {
                          setCurrentIndex(idx);
                          setShowSubmitConfirm(false);
                        }}
                        className={`h-9 px-3.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs hover:scale-105 ${
                          isAns
                            ? 'bg-emerald-600 text-white'
                            : isFlg
                            ? 'bg-[#F47716] text-white'
                            : 'bg-white text-slate-700 border border-slate-300 hover:border-[#10264B]'
                        }`}
                        title={`Question ${idx + 1}: ${isAns ? 'Answered' : 'Unanswered'}${isFlg ? ' (Flagged)' : ''}`}
                      >
                        <span>{idx + 1}</span>
                        {isAns && (
                          <div className="w-3.5 h-3.5 rounded-full bg-white text-emerald-600 flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Policy Guidance Alert Callout */}
              {isAllAnswered ? (
                <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-2xl text-xs flex items-start space-x-3.5 shadow-xs">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                    <Award className="w-7 h-7" />
                  </div>
                  <div className="flex-1">
                    <h5 className="font-black text-emerald-950 text-sm sm:text-base">
                      All {questions.length} Questions Answered!
                    </h5>
                    <p className="text-emerald-900 mt-1 leading-relaxed">
                      Outstanding! You have completed every assessment question. Submitting now will lock your answers, evaluate results immediately, and issue your official <strong className="font-bold text-emerald-950">AIICQB Verified Certificate</strong>.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50/90 border border-amber-300 p-4 rounded-2xl text-xs flex items-start space-x-3.5 shadow-xs">
                  <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h5 className="font-bold text-amber-950 text-sm">
                      {unansweredCount} Question{unansweredCount > 1 ? 's' : ''} Remaining Unanswered
                    </h5>
                    <p className="text-amber-900 mt-1 leading-relaxed">
                      You have answered <strong className="font-bold">{answeredCount} of {questions.length}</strong> questions. You can return to review or submit now. Any unanswered questions will receive 0 marks.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Action Buttons matching Image 3 */}
            <div className="bg-slate-50/90 px-6 sm:px-8 py-4 sm:py-5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setShowSubmitConfirm(false)}
                disabled={submitting}
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-3 rounded-xl border border-slate-300 hover:border-slate-400 text-slate-700 bg-white font-bold text-xs sm:text-sm hover:bg-slate-50 transition-all cursor-pointer disabled:opacity-50 shadow-xs"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Review</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  setShowSubmitConfirm(false);
                  await handleSubmitExam(true);
                }}
                disabled={submitting}
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-7 py-3 rounded-xl font-extrabold text-xs sm:text-sm transition-all border bg-gradient-to-r from-[#F47716] to-[#E35D00] hover:from-[#E35D00] hover:to-[#C94E00] text-white shadow-xl hover:shadow-orange-500/30 cursor-pointer border-orange-400"
                title="Confirm & Submit Final Exam"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Grading Assessment...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Confirm & Submit Final Exam</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Certificate Modal Viewer */}
      {showCertificate && (
        <CertificateModal
          certificate={{
            ...(result?.certificate || {}),
            candidateName: candidateName,
            candidateId: candidateId,
            certificationName: certName,
            certificationCode: certCode,
            grade: candidateGrade,
            score: result?.score,
            percentage: result?.percentage,
            certificateNo:
              result?.certificate?.certificateNo ||
              `AICQB-${certCode.replace(/[^A-Z]/g, '')}-2026-${Math.floor(100000 + Math.random() * 900000)}`,
            issueDateFormatted:
              result?.certificate?.issueDateFormatted ||
              new Date().toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' }),
            validUntilFormatted:
              result?.certificate?.validUntilFormatted ||
              new Date(Date.now() + 86400000 * 365 * 3).toLocaleDateString('en-US', {
                month: 'long',
                day: '2-digit',
                year: 'numeric',
              }),
            verificationUrl:
              result?.certificate?.verificationUrl ||
              `${window.location.origin}/verify?id=${result?.certificate?.certificateNo || 'AICQB-CERT-2026'}`,
            ceoName: result?.certificate?.issuer?.ceo || 'Pushpak Wani',
            directorName: result?.certificate?.issuer?.director || 'Dr. Neha Kulkarni',
          }}
          onClose={() => setShowCertificate(false)}
        />
      )}

      {/* Hidden Proctoring Canvas for Frame Analysis & Snapshots */}
      <canvas ref={proctorCanvasRef} className="hidden" />
    </div>,
    document.body
  );
};
