import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Play,
  Award,
  FileText,
  HelpCircle,
  X,
  Download,
  Code2,
  Check,
  Clock,
  ArrowRight,
  ChevronLeft,
  CalendarCheck,
  Loader2,
  Copy,
  CheckCheck,
} from 'lucide-react';
import { CertificateModal } from '../../components/CertificateModal';

interface CourseModule {
  id: string;
  title: string;
  duration: string;
  completed: boolean;
  content: {
    summary: string;
    keyPoints: string[];
    codeSnippet?: string;
    readingTime: string;
  };
}

interface CourseItem {
  id: string;
  title: string;
  code: string;
  progress: number;
  status: 'In Progress' | 'Completed';
  actionText: 'Continue' | 'Review';
  actionColor: string;
  certificateNo?: string;
  modules: CourseModule[];
}

const CURRICULUM_TEMPLATES: Record<string, CourseModule[]> = {
  'AICQB-AI-CP': [
    {
      id: 'm1_1',
      title: 'Module 1: Foundations of Deep Learning & Transformers',
      duration: '4h 30m',
      completed: false,
      content: {
        readingTime: '25 min read',
        summary:
          'Mathematical foundations of neural representations, backpropagation algorithms, multi-head self-attention mechanisms, and positional embeddings in transformer architectures.',
        keyPoints: [
          'Vector embeddings and high-dimensional semantic clustering.',
          'Scaled dot-product attention: Attention(Q, K, V) = softmax(QK^T / sqrt(d_k)) * V.',
          'Layer normalization vs batch normalization in transformer blocks.',
          'Gradient vanishing mitigation through residual skip connections.',
        ],
        codeSnippet: `import torch
import torch.nn as nn

class TransformerAttention(nn.Module):
    def __init__(self, d_model=512, n_heads=8):
        super().__init__()
        self.attn = nn.MultiheadAttention(embed_dim=d_model, num_heads=n_heads)
        self.norm = nn.LayerNorm(d_model)

    def forward(self, query, key, value):
        attn_out, _ = self.attn(query, key, value)
        return self.norm(query + attn_out)`,
      },
    },
    {
      id: 'm1_2',
      title: 'Module 2: Model Evaluation, Imbalance & ROC/PR Metrics',
      duration: '5h 15m',
      completed: false,
      content: {
        readingTime: '30 min read',
        summary:
          'Evaluation methodologies for production machine learning under severe class skew, including Precision-Recall AUC, Cost-sensitive matrices, and calibration curves.',
        keyPoints: [
          'Why overall accuracy misleads on imbalanced distributions (accuracy paradox).',
          'Precision-Recall AUC vs ROC-AUC when minority class representation is < 5%.',
          'Threshold calibration via F-beta scores (weighting recall over precision for critical risk domains).',
          'Brier score calculation for probability calibration verification.',
        ],
        codeSnippet: `from sklearn.metrics import precision_recall_curve, auc

def evaluate_imbalance(y_true, y_probs):
    precision, recall, _ = precision_recall_curve(y_true, y_probs)
    pr_auc = auc(recall, precision)
    return {"PR_AUC": round(pr_auc, 4)}`,
      },
    },
    {
      id: 'm1_3',
      title: 'Module 3: Generative AI, LLMs & Retrieval-Augmented Generation (RAG)',
      duration: '6h 00m',
      completed: false,
      content: {
        readingTime: '35 min read',
        summary:
          'Architecting enterprise RAG workflows: vector indexing (HNSW), chunking strategies, cross-encoder re-ranking, and hallucination reduction guardrails.',
        keyPoints: [
          'Hierarchical sliding window chunking with semantic overlap.',
          'Dense retrieval using cosine similarity and hybrid BM25 lexical fusion.',
          'Re-ranking top-K passages with cross-encoder neural scorers.',
          'Hallucination mitigation via source citation grounding and prompt sandboxing.',
        ],
        codeSnippet: `async function generateGroundedResponse(query, vectorStore) {
  const docs = await vectorStore.similaritySearch(query, { k: 4 });
  const context = docs.map(d => d.pageContent).join('\\n---\\n');
  return { context, passages: docs.length };
}`,
      },
    },
    {
      id: 'm1_4',
      title: 'Module 4: Secure AI Sandboxing & Production MLOps',
      duration: '4h 45m',
      completed: false,
      content: {
        readingTime: '20 min read',
        summary:
          'Operationalizing models with automated drift detection, input sanitization against prompt injection, and isolated runtime execution containers.',
        keyPoints: [
          'Data drift monitoring using Population Stability Index (PSI) and KS-tests.',
          'Prompt injection defense layers and system prompt boundaries.',
          'Latency SLAs, quantization (FP16/INT8), and horizontal worker auto-scaling.',
        ],
        codeSnippet: `docker run --rm --security-opt=no-new-privileges --cpus=2.0 --memory=4g aicqb-model:v1`,
      },
    },
  ],
  'AICQB-ST-CP': [
    {
      id: 'm2_1',
      title: 'Module 1: Core QA Principles, SDLC & STLC Benchmarks',
      duration: '3h 45m',
      completed: false,
      content: {
        readingTime: '20 min read',
        summary:
          'Verification vs validation, IEEE 829 test documentation benchmarks, STLC phases, and shift-left testing methodologies.',
        keyPoints: [
          'Differences between static analysis, code walkthroughs, inspection, and dynamic execution.',
          'Requirements Traceability Matrix (RTM) linking user stories to test suites.',
          'Defect prevention strategies during requirement refinement ceremonies.',
        ],
      },
    },
    {
      id: 'm2_2',
      title: 'Module 2: Black-box, Boundary Value & Combinatorial Testing',
      duration: '4h 30m',
      completed: false,
      content: {
        readingTime: '25 min read',
        summary:
          'Equivalence partitioning, 2-value vs 3-value boundary analysis, decision tables, state transition diagrams, and pairwise testing.',
        keyPoints: [
          'Identifying valid and invalid equivalence classes for numeric and textual inputs.',
          'Testing min, min-1, min+1, max, max-1, max+1 boundary values.',
          'All-pairs orthogonal array generation for multi-variable configuration matrices.',
        ],
        codeSnippet: `// 2-value boundary test specification [18, 65]
test('Validate input boundary [18, 65]', () => {
  expect(isEligible(17)).toBe(false); // min - 1
  expect(isEligible(18)).toBe(true);  // min
  expect(isEligible(65)).toBe(true);  // max
  expect(isEligible(66)).toBe(false); // max + 1
});`,
      },
    },
    {
      id: 'm2_3',
      title: 'Module 3: Test Automation Architectures & Reporting',
      duration: '5h 00m',
      completed: false,
      content: {
        readingTime: '30 min read',
        summary:
          'Designing modular test automation frameworks, data-driven patterns, parallel execution, and CI/CD reporting integrations.',
        keyPoints: [
          'Separation of concerns: test logic, page objects, and test fixture definitions.',
          'Flaky test triage: auto-retry mechanisms and deterministic locator strategies.',
          'JUnit XML and Allure test artifact archiving in automated CI pipelines.',
        ],
      },
    },
    {
      id: 'm2_4',
      title: 'Module 4: Production Defect Triaging & ISO/IEC 29119 Standards',
      duration: '3h 30m',
      completed: false,
      content: {
        readingTime: '25 min read',
        summary:
          'Root cause analysis (RCA), defect triage severity vs priority scoring, and international compliance under ISO/IEC/IEEE 29119 software testing standards.',
        keyPoints: [
          'ISO/IEC/IEEE 29119 process model: Organizational test policy to incident management.',
          'Defect triage matrix: High Severity / Low Priority vs High Priority / Low Severity.',
          'Post-mortem reporting and preventative action loops.',
        ],
      },
    },
  ],
  'AICQB-PW-CP': [
    {
      id: 'm3_1',
      title: 'Module 1: Playwright Test Runner & Locator Strategies',
      duration: '4h 00m',
      completed: false,
      content: {
        readingTime: '25 min read',
        summary:
          'Playwright core engine, browser contexts, user-facing semantic locators (getByRole, getByLabel), auto-waiting mechanics, and web-first assertions.',
        keyPoints: [
          'Why getByRole and getByLabel are resilient to underlying CSS/HTML refactoring.',
          'Auto-waiting for actionability: visible, stable, enabled, and editable.',
          'Soft assertions: expect.soft() for non-terminating multi-check validation.',
        ],
        codeSnippet: `import { test, expect } from '@playwright/test';

test('Verify candidate exam dashboard navigation', async ({ page }) => {
  await page.goto('/portal/exams');
  await expect(page.getByRole('heading', { name: 'My Exams' })).toBeVisible();
  await page.getByRole('button', { name: 'Join Exam' }).first().click();
});`,
      },
    },
    {
      id: 'm3_2',
      title: 'Module 2: Fixtures, Page Object Model & Parallel Runs',
      duration: '5h 15m',
      completed: false,
      content: {
        readingTime: '30 min read',
        summary:
          'Structuring robust test suites with custom fixtures, isolated browser storage states, Page Object Model patterns, and multi-worker execution.',
        keyPoints: [
          'Custom test fixtures with automatic setup and teardown hooks.',
          'Page Object Model (POM) encapsulation to prevent test fragility.',
          'StorageState reuse for instantaneous pre-authenticated sessions.',
        ],
        codeSnippet: `export class ExamPage {
  constructor(private page) {}

  async submitAnswers() {
    await this.page.getByRole('button', { name: 'Submit Final' }).click();
  }
}`,
      },
    },
    {
      id: 'm3_3',
      title: 'Module 3: API Interception, Mocking & Visual Regression',
      duration: '4h 45m',
      completed: false,
      content: {
        readingTime: '25 min read',
        summary:
          'Mocking network calls via page.route(), HAR replay, visual snapshot comparisons with expect(page).toHaveScreenshot(), and fault tolerance.',
        keyPoints: [
          'Network routing: page.route() to mock backend errors and network delays.',
          'Pixel-by-pixel visual regression testing with threshold tolerances.',
          'Testing offline recovery states in web applications.',
        ],
      },
    },
    {
      id: 'm3_4',
      title: 'Module 4: CI/CD Pipelines & Real-time Trace Viewer',
      duration: '3h 30m',
      completed: false,
      content: {
        readingTime: '20 min read',
        summary:
          'GitHub Actions CI integration, containerized headless Chromium, shard splitting across workers, and debugging with Playwright Trace Viewer.',
        keyPoints: [
          'Configuring playwright.config.ts for CI retries and video capture on failure.',
          'Trace file (.zip) analysis: DOM snapshots, console logs, and network timelines.',
          'Publishing HTML reports to static hosting dashboards.',
        ],
      },
    },
  ],
};

function getDefaultModules(code: string, title: string): CourseModule[] {
  if (CURRICULUM_TEMPLATES[code]) {
    return JSON.parse(JSON.stringify(CURRICULUM_TEMPLATES[code]));
  }
  return [
    {
      id: `${code}_m1`,
      title: `Module 1: Foundations & Theoretical Frameworks`,
      duration: '4h 00m',
      completed: false,
      content: {
        readingTime: '25 min read',
        summary: `Core principles, international methodologies, foundational mathematics, and standard taxonomy for ${title}.`,
        keyPoints: [
          'Introduction to core architectural paradigms and governing standards.',
          'Key terminology, lifecycle phases, and operational prerequisites.',
          'Compliance frameworks and industry-recognized benchmarks.',
        ],
      },
    },
    {
      id: `${code}_m2`,
      title: `Module 2: Applied Techniques & Practical Workflows`,
      duration: '5h 00m',
      completed: false,
      content: {
        readingTime: '30 min read',
        summary: `In-depth implementation strategies, system design patterns, and case study walk-throughs for ${title}.`,
        keyPoints: [
          'Scenario-driven problem solving and analysis.',
          'Hands-on implementation recipes and execution steps.',
          'Performance optimization and reliability benchmarks.',
        ],
      },
    },
    {
      id: `${code}_m3`,
      title: `Module 3: Industry Benchmarking & Case Studies`,
      duration: '4h 30m',
      completed: false,
      content: {
        readingTime: '30 min read',
        summary: `Enterprise case studies, failure recovery patterns, and high-availability operations in ${title}.`,
        keyPoints: [
          'Production trade-offs and edge case mitigations.',
          'Continuous monitoring and automated metrics collection.',
          'Cross-functional operational governance.',
        ],
      },
    },
    {
      id: `${code}_m4`,
      title: `Module 4: Certification Review & Practice Labs`,
      duration: '3h 30m',
      completed: false,
      content: {
        readingTime: '25 min read',
        summary: `Exam preparation drill, diagnostic mock scenarios, and compliance standards for ${title}.`,
        keyPoints: [
          'Full-length examination syllabus alignment.',
          'Scenario review and key formulas cheat-sheet.',
          'Certification readiness self-evaluation.',
        ],
      },
    },
  ];
}

export const CandidateLearning: React.FC = () => {
  const navigate = useNavigate();
  const { user, candidate } = useAuth();
  const candidateName = candidate?.fullName || user?.fullName || 'Candidate';
  const candidateId = candidate?.candidateId || user?.candidateId || '';

  const [activeTab, setActiveTab] = useState<'courses' | 'materials' | 'tests'>('courses');
  const [activeCourseModal, setActiveCourseModal] = useState<CourseItem | null>(null);
  const [activeModuleIndex, setActiveModuleIndex] = useState(0);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const [courses, setCourses] = useState<CourseItem[]>(() => {
    try {
      const c = localStorage.getItem('aicqb_my_courses');
      return c ? JSON.parse(c) : [];
    } catch (_) {
      return [];
    }
  });
  const [loading, setLoading] = useState(false);

  // Load candidate's real enrolled courses and certificates dynamically
  useEffect(() => {
    let isMounted = true;
    async function loadCourses() {
      try {
        if (courses.length === 0) setLoading(true);
        const [schedRes, certRes] = await Promise.all([
          api.getMySchedules().catch(() => ({ schedules: [], upcoming: [], completed: [] })),
          api.getMyCertificates().catch(() => ({ certificates: [] })),
        ]);

        if (!isMounted) return;

        const allSchedules = [
          ...(schedRes.schedules || []),
          ...(schedRes.upcoming || []),
          ...(schedRes.completed || []),
        ];
        const allCertificates = certRes.certificates || [];

        // Build list of unique certifications
        const certMap = new Map<string, { code: string; title: string; certNo?: string; isCertified: boolean }>();

        // Add certified courses
        for (const cert of allCertificates) {
          const code = cert.certificationCode || 'AICQB-CERT';
          certMap.set(code, {
            code,
            title: cert.certificationName || cert.certificationTitle || 'AICQB Professional Certification',
            certNo: cert.certificateNo,
            isCertified: true,
          });
        }

        // Add scheduled / enrolled courses
        for (const s of allSchedules) {
          const code = s.certificationCode || (s.examCode ? s.examCode.replace('-EXAM', '') : 'AICQB-CERT');
          if (!certMap.has(code)) {
            certMap.set(code, {
              code,
              title: s.certificationName || s.certificationTitle || 'AICQB Professional Certification',
              isCertified: false,
            });
          }
        }

        const courseItems: CourseItem[] = [];
        const userUid = user?.uid || user?.id || 'guest';

        certMap.forEach((info, code) => {
          const defaultMods = getDefaultModules(code, info.title);
          let modules = defaultMods;
          let progress = 0;
          let status: 'In Progress' | 'Completed' = 'In Progress';
          let actionText: 'Continue' | 'Review' = 'Continue';
          let actionColor = 'bg-[#F47716]';

          if (info.isCertified) {
            modules = defaultMods.map(m => ({ ...m, completed: true }));
            progress = 100;
            status = 'Completed';
            actionText = 'Review';
            actionColor = 'bg-[#10264B]';
          } else {
            // Check local storage for candidate's own saved module progress
            try {
              const saved = localStorage.getItem(`aicqb_learn_${userUid}_${code}`);
              if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) {
                  modules = defaultMods.map((m, idx) => ({
                    ...m,
                    completed: !!parsed[idx],
                  }));
                  const compCount = modules.filter(m => m.completed).length;
                  progress = Math.round((compCount / modules.length) * 100);
                  if (progress === 100) {
                    status = 'Completed';
                    actionText = 'Review';
                    actionColor = 'bg-[#10264B]';
                  }
                }
              }
            } catch (_) { }
          }

          courseItems.push({
            id: `course_${code}`,
            title: info.title,
            code,
            progress,
            status,
            actionText,
            actionColor,
            certificateNo: info.certNo,
            modules,
          });
        });

        setCourses(courseItems);
        try { localStorage.setItem('aicqb_my_courses', JSON.stringify(courseItems)); } catch (_) { }
      } catch (err) {
        console.error('Failed to load candidate learning courses:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadCourses();
    return () => {
      isMounted = false;
    };
  }, [user, candidate]);

  const handleOpenCourse = (course: CourseItem) => {
    setActiveCourseModal(course);
    const firstUncompleted = course.modules.findIndex((m) => !m.completed);
    setActiveModuleIndex(firstUncompleted !== -1 ? firstUncompleted : 0);
  };

  const handleToggleModuleComplete = (courseId: string, moduleIndex: number) => {
    setCourses((prevCourses) => {
      return prevCourses.map((c) => {
        if (c.id !== courseId) return c;
        const newModules = [...c.modules];
        const currentMod = newModules[moduleIndex];
        const newCompleted = !currentMod.completed;
        newModules[moduleIndex] = { ...currentMod, completed: newCompleted };

        const completedCount = newModules.filter((m) => m.completed).length;
        const newProgress = Math.round((completedCount / newModules.length) * 100);
        const isNowCompleted = newProgress === 100;

        const userUid = user?.uid || user?.id || 'guest';
        try {
          localStorage.setItem(`aicqb_learn_${userUid}_${c.code}`, JSON.stringify(newModules.map(m => m.completed)));
        } catch (_) { }

        const updatedCourse: CourseItem = {
          ...c,
          modules: newModules,
          progress: newProgress,
          status: isNowCompleted ? 'Completed' : 'In Progress',
          actionText: isNowCompleted ? 'Review' : 'Continue',
          actionColor: isNowCompleted ? 'bg-[#10264B]' : 'bg-[#F47716]',
        };

        if (activeCourseModal && activeCourseModal.id === courseId) {
          setActiveCourseModal(updatedCourse);
        }

        return updatedCourse;
      });
    });
  };

  const handleCopyCode = (codeText: string) => {
    navigator.clipboard.writeText(codeText);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const activeModule = activeCourseModal?.modules[activeModuleIndex];

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Header matching Screen 4 in Screenshot */}
      <div>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#F47716] flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-5 h-5 stroke-[2.2]" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#10264B]">My Courses</h1>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Learn, upskill and prepare for your certifications.
        </p>
      </div>

      {/* Filter Tabs matching Screen 4 */}
      <div className="flex items-center space-x-2 border-b border-gray-200 pb-3">
        <button
          onClick={() => setActiveTab('courses')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'courses'
              ? 'bg-[#F47716] text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          All Courses ({courses.length})
        </button>
        <button
          onClick={() => setActiveTab('materials')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'materials'
              ? 'bg-[#F47716] text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          In Progress
        </button>
      </div>

      {/* 1. COURSES TAB matching Screen 4 */}
      {(activeTab === 'courses' || activeTab === 'materials') && (
        <div className="space-y-3">
          {loading ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
              <Loader2 className="w-6 h-6 text-[#F47716] animate-spin mx-auto mb-2" />
              <p className="text-xs text-gray-500">Loading courses...</p>
            </div>
          ) : courses.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center space-y-3">
              <BookOpen className="w-8 h-8 text-gray-400 mx-auto" />
              <h3 className="font-bold text-gray-800 text-sm">No Enrolled Courses</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                You are not enrolled in any certification courses yet. Explore our certifications to get started.
              </p>
              <button
                onClick={() => navigate('/portal/certifications')}
                className="px-4 py-2 bg-[#F47716] text-white rounded-xl text-xs font-bold hover:bg-[#DC660E] cursor-pointer"
              >
                Browse Certifications
              </button>
            </div>
          ) : (
            courses.map((course) => (
              <div
                key={course.id}
                onClick={() => handleOpenCourse(course)}
                className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-xs hover:shadow-md transition-all flex items-center justify-between gap-3 cursor-pointer group"
              >
                {/* Course Icon & Details matching Screen 4 */}
                <div className="flex items-center space-x-3.5 min-w-0 flex-1">
                  <div className="w-11 h-11 rounded-xl bg-orange-50 border border-orange-100 text-[#F47716] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                    {course.code.includes('PW') ? (
                      <span className="text-xl">🎭</span>
                    ) : course.code.includes('ST') || course.code.includes('SE') ? (
                      <div className="w-7 h-7 rounded-md bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                        Se
                      </div>
                    ) : (
                      <BookOpen className="w-5 h-5 stroke-[2.2]" />
                    )}
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <h4 className="text-xs sm:text-sm font-extrabold text-[#10264B] truncate">
                      {course.title}
                    </h4>
                    <p className="text-[10px] sm:text-[11px] text-gray-500 font-medium">
                      <span>{course.modules?.length || 20} Lessons</span>
                      <span className="mx-1.5 text-gray-300">|</span>
                      <span>8 Hours</span>
                    </p>

                    {/* Progress Bar with Percentage matching Screen 4 */}
                    <div className="flex items-center space-x-2 pt-0.5 max-w-xs">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            course.progress === 100 ? 'bg-emerald-500' : 'bg-[#F47716]'
                          }`}
                          style={{ width: `${course.progress || 40}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-gray-600 min-w-[28px]">
                        {course.progress || 40}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Circular Play Button matching Screen 4 */}
                <div className="flex items-center pl-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenCourse(course);
                    }}
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#F47716] hover:bg-[#E35D00] text-white flex items-center justify-center transition-all shadow-sm hover:scale-105 cursor-pointer"
                    title="Start Course"
                  >
                    <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-white translate-x-0.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 2. STUDY MATERIALS TAB */}
      {activeTab === 'materials' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#F47716] flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-[#10264B]">AI Professional Curriculum Guide</h4>
                <p className="text-xs text-gray-400">PDF • 4.8 MB • Official Syllabus</p>
              </div>
            </div>
            <button
              onClick={() => alert('Official Syllabus PDF download initiated.')}
              className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-[#10264B] font-bold text-xs rounded-xl border border-slate-200 flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#F47716]" />
              <span>Download PDF</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-[#10264B]">Software Testing ISO 29119 Guide</h4>
                <p className="text-xs text-gray-400">PDF • 3.4 MB • Official Syllabus</p>
              </div>
            </div>
            <button
              onClick={() => alert('Official Syllabus PDF download initiated.')}
              className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-[#10264B] font-bold text-xs rounded-xl border border-slate-200 flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#F47716]" />
              <span>Download PDF</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-[#10264B]">Playwright Automation Blueprint</h4>
                <p className="text-xs text-gray-400">PDF • 5.1 MB • Official Syllabus</p>
              </div>
            </div>
            <button
              onClick={() => alert('Official Syllabus PDF download initiated.')}
              className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-[#10264B] font-bold text-xs rounded-xl border border-slate-200 flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#F47716]" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. PRACTICE TESTS TAB */}
      {activeTab === 'tests' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <span className="font-mono text-[10px] font-bold text-[#F47716] bg-orange-50 px-2 py-0.5 rounded">
                AICQB-AI-CP-MOCK
              </span>
              <h4 className="font-bold text-sm text-[#10264B]">AI Professional Practice Exam</h4>
              <p className="text-xs text-gray-500">40 questions • 60 Minutes • 70% passing mark</p>
            </div>
            <button
              onClick={() => navigate('/portal/exams')}
              className="w-full py-2 bg-[#F47716] hover:bg-[#DC660E] text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Launch Practice Test</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                AICQB-PW-CP-MOCK
              </span>
              <h4 className="font-bold text-sm text-[#10264B]">Playwright Practice Exam</h4>
              <p className="text-xs text-gray-500">30 questions • 45 Minutes • 70% passing mark</p>
            </div>
            <button
              onClick={() => navigate('/portal/exams')}
              className="w-full py-2 bg-[#10264B] hover:bg-[#1E3A6E] text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Launch Practice Test</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SIMPLE SYLLABUS & READING MODAL */}
      {/* ========================================================================= */}
      {activeCourseModal && (
        <div className="fixed inset-0 z-50 bg-[#10264B]/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-gray-200">
            {/* Simple Modal Header */}
            <div className="bg-[#10264B] text-white p-4 sm:p-5 flex items-center justify-between flex-shrink-0">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <h2 className="text-base sm:text-lg font-bold text-white">{activeCourseModal.title}</h2>
                  <span className="font-mono text-[10px] bg-[#F47716] text-white px-2 py-0.5 rounded">
                    {activeCourseModal.code}
                  </span>
                </div>
                <div className="text-xs text-slate-300">
                  Course Status: <strong>{activeCourseModal.status}</strong> • {activeCourseModal.progress}% Completed
                </div>
              </div>
              <button
                onClick={() => setActiveCourseModal(null)}
                className="text-slate-300 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Syllabus on Left + Content on Right */}
            <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
              {/* Left Column: Modules Stepper */}
              <div className="w-full md:w-72 bg-slate-50 border-r border-gray-200 flex flex-col flex-shrink-0 overflow-y-auto">
                <div className="p-3 border-b border-gray-200 text-xs font-bold text-[#10264B]">
                  Course Syllabus ({activeCourseModal.modules.length} Modules)
                </div>

                <div className="divide-y divide-gray-100 flex-1">
                  {activeCourseModal.modules.map((mod, idx) => {
                    const isCurrent = idx === activeModuleIndex;
                    return (
                      <div
                        key={mod.id}
                        onClick={() => setActiveModuleIndex(idx)}
                        className={`p-3.5 cursor-pointer transition-colors text-xs ${isCurrent
                          ? 'bg-orange-50 border-l-4 border-[#F47716] font-bold text-[#10264B]'
                          : 'hover:bg-gray-100 text-gray-700'
                          }`}
                      >
                        <div className="flex items-start space-x-2">
                          <span className="text-gray-400 font-mono text-[11px] mt-0.5">{idx + 1}.</span>
                          <div className="flex-1 min-w-0">
                            <p className="line-clamp-2 leading-snug">{mod.title}</p>
                            <span className="text-[10px] text-gray-400 mt-1 block">
                              {mod.duration} • {mod.completed ? 'Completed ✓' : 'In Progress'}
                            </span>
                          </div>
                          {mod.completed && <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Module Reader Content */}
              <div className="flex-1 p-5 sm:p-6 overflow-y-auto space-y-4">
                {activeModule ? (
                  <div className="space-y-4">
                    <div className="border-b border-gray-100 pb-3">
                      <span className="text-[11px] font-bold text-[#F47716] uppercase">
                        Module {activeModuleIndex + 1} of {activeCourseModal.modules.length}
                      </span>
                      <h3 className="text-lg font-bold text-[#10264B] mt-1">{activeModule.title}</h3>
                      <p className="text-xs text-gray-600 mt-2 leading-relaxed">{activeModule.content.summary}</p>
                    </div>

                    {/* Key Points */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-[#10264B] uppercase">Key Learning Points</h4>
                      <ul className="space-y-1.5 text-xs text-gray-700">
                        {activeModule.content.keyPoints.map((point, pIdx) => (
                          <li key={pIdx} className="flex items-start space-x-2">
                            <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Code Snippet if any */}
                    {activeModule.content.codeSnippet && (
                      <div className="bg-slate-900 text-slate-100 rounded-xl overflow-hidden border border-slate-800">
                        <div className="bg-slate-800/80 px-3.5 py-1.5 text-[11px] font-mono text-slate-400 flex items-center justify-between">
                          <span>Example Code</span>
                          <button
                            onClick={() => handleCopyCode(activeModule.content.codeSnippet || '')}
                            className="text-[11px] text-slate-300 hover:text-white flex items-center space-x-1 cursor-pointer"
                          >
                            {copiedCode ? <CheckCheck className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                        <pre className="p-4 text-xs font-mono text-emerald-300 overflow-x-auto">
                          <code>{activeModule.content.codeSnippet}</code>
                        </pre>
                      </div>
                    )}

                    {/* Module Navigation Footer */}
                    <div className="pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
                      <button
                        onClick={() => handleToggleModuleComplete(activeCourseModal.id, activeModuleIndex)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeModule.completed
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          }`}
                      >
                        {activeModule.completed ? 'Module Completed ✓' : 'Mark as Completed'}
                      </button>

                      <div className="flex items-center space-x-2">
                        <button
                          disabled={activeModuleIndex === 0}
                          onClick={() => setActiveModuleIndex((prev) => Math.max(0, prev - 1))}
                          className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-30 cursor-pointer"
                        >
                          Previous
                        </button>
                        <button
                          disabled={activeModuleIndex === activeCourseModal.modules.length - 1}
                          onClick={() => setActiveModuleIndex((prev) => Math.min(activeCourseModal.modules.length - 1, prev + 1))}
                          className="px-3 py-1.5 bg-[#10264B] text-white rounded-lg text-xs font-medium hover:bg-[#1E3A6E] disabled:opacity-30 cursor-pointer"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400 text-xs">Select a module from the syllabus to view content.</div>
                )}
              </div>
            </div>

            {/* Simple Modal Footer */}
            <div className="bg-gray-50 p-3 sm:p-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
              <span className="text-gray-500">
                Candidate: <strong className="text-gray-800">{candidateName}</strong> ({candidateId})
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setActiveCourseModal(null);
                    navigate('/portal/exams');
                  }}
                  className="px-3.5 py-1.5 bg-[#10264B] text-white rounded-lg text-xs font-bold hover:bg-[#1E3A6E] cursor-pointer"
                >
                  Go to Exams
                </button>
                <button
                  onClick={() => setActiveCourseModal(null)}
                  className="px-3.5 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-300 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Official Certificate Modal */}
      {showCertificateModal && activeCourseModal && (
        <CertificateModal
          certificate={{
            id: `cert_${activeCourseModal.code.toLowerCase()}`,
            certificateNo: activeCourseModal.certificateNo || `AICQB-${activeCourseModal.code.split('-')[1] || 'CERT'}-2026-000132`,
            candidateUid: user?.uid || 'usr_candidate',
            candidateName: candidateName,
            candidateId: candidateId || user?.candidateId || 'AICQB-1004586',
            certificationId: activeCourseModal.id,
            certificationName: activeCourseModal.title,
            certificationCode: activeCourseModal.code,
            grade: 'Grade A+ (Distinction)',
            credentialLevel: 'Professional Level 3',
            issueDate: '2026-11-08',
            issueDateFormatted: 'November 08, 2026',
            validUntil: '2029-11-08',
            validUntilFormatted: 'November 08, 2029',
            expiryDate: '2029-11-08',
            status: 'Issued',
            verificationUrl: `${window.location.origin}/verify?id=${activeCourseModal.certificateNo || 'AICQB-AI-2026-000132'}`,
            qrCodeDataUrl: '',
            ceoName: 'Pushpak Wani',
            ceo: 'Pushpak Wani',
            directorName: 'Dr. Neha Kulkarni',
            director: 'Dr. Neha Kulkarni',
          }}
          onClose={() => setShowCertificateModal(false)}
        />
      )}
    </div>
  );
};
