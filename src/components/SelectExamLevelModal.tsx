import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  GraduationCap,
  X,
  Code2,
  FileText,
  Clock,
  BarChart,
  ShieldCheck,
  BarChart3,
  Globe,
  Award,
  ArrowRight,
  Loader2,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';

export interface DynamicExamLevelOption {
  id: string; // 'foundation' | 'professional' | 'advanced'
  levelId: string;
  name: string;
  badge: string;
  badgeType: 'foundation' | 'professional' | 'advanced';
  mcqs: number;
  durationMinutes: number;
  passingPercentage: number;
  allowedAttempts: number;
  difficulty: string;
  certificateSuffix: string;
  certificateTitle: string;
  feeINR: number;
  feeUSD: number;
  syllabus: string[];
  eligibility: string;
  details: string;
}

interface SelectExamLevelModalProps {
  certification: {
    id: string;
    code: string;
    name: string;
    domain: string;
    examFee?: number;
    examFeeUSD?: number;
    currency?: string;
  };
  initialLevelId?: string;
  onContinue: (selectedLevel: {
    levelId: string;
    levelName: string;
    code: string;
    amount: number;
    amountUSD: number;
    durationMinutes: number;
    mcqs: number;
    passingPercentage?: number;
    allowedAttempts?: number;
  }) => void;
  onClose: () => void;
}

export const SelectExamLevelModal: React.FC<SelectExamLevelModalProps> = ({
  certification,
  initialLevelId,
  onContinue,
  onClose,
}) => {
  const cleanCode = certification.code.replace(/®/g, '').trim();
  const baseCodePrefix = cleanCode.includes('-')
    ? cleanCode.substring(0, cleanCode.lastIndexOf('-'))
    : cleanCode;

  const defaultProfessionalFee = certification.examFee || 9999;
  const defaultProfessionalFeeUSD = certification.examFeeUSD || 119;

  const [loading, setLoading] = useState(true);
  const [dbLevels, setDbLevels] = useState<any[]>([]);

  // Standard 3 Levels fallback while fetching
  const defaultLevels: DynamicExamLevelOption[] = [
    {
      id: 'foundation',
      levelId: 'lvl_fnd',
      name: 'Foundation Level',
      badge: 'Beginner',
      badgeType: 'foundation',
      mcqs: 50,
      durationMinutes: 60,
      passingPercentage: 70,
      allowedAttempts: 3,
      difficulty: 'Easy',
      certificateSuffix: 'CF',
      certificateTitle: 'Certified Foundation',
      feeINR: 4500,
      feeUSD: 59,
      syllabus: ['Core Principles', 'Basic Architecture', 'Fundamental Verification'],
      eligibility: 'Open to all candidates and graduates.',
      details: 'Fundamental qualification validating baseline technical knowledge.',
    },
    {
      id: 'professional',
      levelId: 'lvl_prf',
      name: 'Professional Level',
      badge: '★ Most Popular',
      badgeType: 'professional',
      mcqs: 75,
      durationMinutes: 90,
      passingPercentage: 70,
      allowedAttempts: 3,
      difficulty: 'Medium',
      certificateSuffix: 'CP',
      certificateTitle: 'Certified Professional',
      feeINR: defaultProfessionalFee,
      feeUSD: defaultProfessionalFeeUSD,
      syllabus: ['Applied Architecture', 'Real-world Frameworks', 'Production Workflows'],
      eligibility: '1+ years practitioner experience.',
      details: 'Industry standard professional credential validating applied expertise.',
    },
    {
      id: 'advanced',
      levelId: 'lvl_adv',
      name: 'Advanced Level',
      badge: 'Advanced',
      badgeType: 'advanced',
      mcqs: 100,
      durationMinutes: 120,
      passingPercentage: 70,
      allowedAttempts: 3,
      difficulty: 'Advanced',
      certificateSuffix: 'CA',
      certificateTitle: 'Certified Advanced',
      feeINR: 13999,
      feeUSD: 169,
      syllabus: ['Enterprise Scaling', 'Zero-Trust Security', 'Architectural Governance'],
      eligibility: '3+ years engineering experience or lead QA role.',
      details: 'Elite credential demonstrating enterprise architectural mastery.',
    },
  ];

  const [levelOptions, setLevelOptions] = useState<DynamicExamLevelOption[]>(defaultLevels);

  // Default selected level is "Professional Level" or initialLevelId
  const normalizeInitialId = (id?: string) => {
    if (!id) return 'professional';
    const l = id.toLowerCase();
    if (l.includes('found')) return 'foundation';
    if (l.includes('adv') || l.includes('exp')) return 'advanced';
    return 'professional';
  };

  const [selectedLevelId, setSelectedLevelId] = useState<string>(() =>
    normalizeInitialId(initialLevelId)
  );

  // Fetch dynamic levels from Firebase Firestore backend API
  useEffect(() => {
    let isMounted = true;
    const fetchLevels = async () => {
      try {
        setLoading(true);
        const res = await api.getExamLevels(certification.id);
        if (res && res.success && Array.isArray(res.levels) && res.levels.length > 0) {
          if (!isMounted) return;
          setDbLevels(res.levels);

          // Map dynamic database levels to presentation options
          const mapped: DynamicExamLevelOption[] = res.levels.map((item: any) => {
            const nameLower = (item.levelName || '').toLowerCase();
            const isFnd = nameLower.includes('foundation');
            const isAdv = nameLower.includes('advanced') || nameLower.includes('expert');
            const idKey = isFnd ? 'foundation' : isAdv ? 'advanced' : 'professional';

            return {
              id: idKey,
              levelId: item.levelId || (isFnd ? 'lvl_fnd' : isAdv ? 'lvl_adv' : 'lvl_prf'),
              name: item.levelName || (isFnd ? 'Foundation Level' : isAdv ? 'Advanced Level' : 'Professional Level'),
              badge: isFnd ? 'Beginner' : isAdv ? 'Advanced' : '★ Most Popular',
              badgeType: isFnd ? 'foundation' : isAdv ? 'advanced' : 'professional',
              mcqs: Number(item.totalQuestions) || (isFnd ? 50 : isAdv ? 100 : 75),
              durationMinutes: Number(item.examDuration) || (isFnd ? 60 : isAdv ? 120 : 90),
              passingPercentage: Number(item.passingPercentage) || 70,
              allowedAttempts: Number(item.allowedAttempts) || 3,
              difficulty: isFnd ? 'Easy' : isAdv ? 'Advanced' : 'Medium',
              certificateSuffix: isFnd ? 'CF' : isAdv ? 'CA' : 'CP',
              certificateTitle: isFnd ? 'Certified Foundation' : isAdv ? 'Certified Advanced' : 'Certified Professional',
              feeINR: Number(item.examFee) || (isFnd ? 4500 : isAdv ? 13999 : defaultProfessionalFee),
              feeUSD: Number(item.examFeeUSD) || (isFnd ? 59 : isAdv ? 169 : defaultProfessionalFeeUSD),
              syllabus: Array.isArray(item.examSyllabus) ? item.examSyllabus : ['Comprehensive Syllabus & Objectives'],
              eligibility: item.examEligibility || 'Open to all candidates.',
              details: item.certificationDetails || 'AICQB Official Examination.',
            };
          });

          // Ensure standard order: Foundation -> Professional -> Advanced
          const order = ['foundation', 'professional', 'advanced'];
          mapped.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
          setLevelOptions(mapped);
        }
      } catch (err) {
        console.warn('Failed to load dynamic levels from Firestore:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchLevels();
    return () => {
      isMounted = false;
    };
  }, [certification.id]);

  const selectedLevel = levelOptions.find((l) => l.id === selectedLevelId) || levelOptions[1] || levelOptions[0];

  const handleContinue = () => {
    const finalCertCode = `${baseCodePrefix}-${selectedLevel.certificateSuffix}®`;
    onContinue({
      levelId: selectedLevel.levelId,
      levelName: selectedLevel.name,
      code: finalCertCode,
      amount: selectedLevel.feeINR,
      amountUSD: selectedLevel.feeUSD,
      durationMinutes: selectedLevel.durationMinutes,
      mcqs: selectedLevel.mcqs,
      passingPercentage: selectedLevel.passingPercentage,
      allowedAttempts: selectedLevel.allowedAttempts,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-[510px] w-full p-4 sm:p-5 relative my-auto animate-scaleUp border border-slate-100 max-h-[92vh] overflow-y-auto">
        {/* Close Button Top-Right */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3.5 top-3.5 sm:right-4 sm:top-4 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#F47716] hover:bg-[#E35D00] text-white flex items-center justify-center transition-all cursor-pointer shadow-md hover:scale-105 z-10"
          title="Close"
        >
          <X className="w-4 h-4 stroke-[3]" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-1 pt-0.5 pr-6 sm:pr-0">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#F47716] text-white flex items-center justify-center shadow-xs">
              <GraduationCap className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.5]" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              <span className="text-[#10264B]">Select </span>
              <span className="text-[#F47716]">Exam Level</span>
            </h2>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-500 font-medium max-w-sm mx-auto leading-tight">
            Choose the examination tier for this certification. Fees and criteria update dynamically.
          </p>
        </div>

        {/* Selected Certification Banner */}
        <div className="mt-2.5 bg-[#F0F4FD] border border-[#DCE4F8] rounded-xl p-2.5 sm:p-3 flex items-center space-x-2.5 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-[#F47716] text-white flex items-center justify-center font-mono font-bold text-xs flex-shrink-0 shadow-xs">
            <Code2 className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs sm:text-sm font-extrabold text-[#10264B] truncate">
              {certification.name}
            </h4>
            <p className="text-[10px] text-slate-600 truncate mt-0.5">
              <span className="font-semibold text-slate-700">Code: {certification.code}</span>
              <span className="mx-1.5 text-slate-300">|</span>
              <span>Domain: {certification.domain}</span>
            </p>
          </div>
        </div>

        {/* Loading Indicator while fetching dynamic levels */}
        {loading && (
          <div className="py-8 flex flex-col items-center justify-center space-y-2">
            <Loader2 className="w-6 h-6 text-[#F47716] animate-spin" />
            <span className="text-xs font-semibold text-slate-500">
              Fetching dynamic examination levels from database...
            </span>
          </div>
        )}

        {/* Level Options Cards */}
        {!loading && (
          <div className="mt-2.5 space-y-2">
            {levelOptions.map((lvl) => {
              const isSelected = selectedLevelId === lvl.id;
              const certCodeDisplay = `${baseCodePrefix}-${lvl.certificateSuffix}® (${lvl.certificateTitle})`;

              return (
                <div
                  key={lvl.id}
                  onClick={() => setSelectedLevelId(lvl.id)}
                  className={`rounded-xl p-2.5 sm:p-3 border transition-all cursor-pointer flex flex-col gap-2 select-none ${
                    isSelected
                      ? 'border-2 border-[#F47716] bg-[#FFF8F3] shadow-xs'
                      : lvl.id === 'foundation'
                      ? 'border-blue-200 bg-white hover:border-blue-300 hover:bg-blue-50/20'
                      : lvl.id === 'advanced'
                      ? 'border-purple-200 bg-white hover:border-purple-300 hover:bg-purple-50/20'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2.5">
                    {/* Left: Radio + Icon + Info */}
                    <div className="flex items-center space-x-2.5 min-w-0">
                      {/* Radio Indicator */}
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                          isSelected ? 'border-[#F47716]' : 'border-slate-300'
                        }`}
                      >
                        {isSelected && <div className="w-2 h-2 rounded-full bg-[#F47716]" />}
                      </div>

                      {/* Level Graduation Cap Icon */}
                      <div
                        className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${
                          lvl.id === 'foundation'
                            ? 'text-blue-600'
                            : lvl.id === 'professional'
                            ? 'text-[#F47716]'
                            : 'text-purple-600'
                        }`}
                      >
                        <GraduationCap className="w-5 h-5 stroke-[2]" />
                      </div>

                      {/* Details */}
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center space-x-1.5 flex-wrap">
                          <span className="text-xs sm:text-[13px] font-extrabold text-[#10264B]">
                            {lvl.name}
                          </span>

                          {/* Level Badges matching UI/UX requirements: Foundation = Blue, Professional = Orange, Advanced = Purple */}
                          {lvl.badgeType === 'foundation' && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              Foundation (Blue)
                            </span>
                          )}
                          {lvl.badgeType === 'professional' && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-[#F47716] text-white shadow-xs">
                              Professional (Orange)
                            </span>
                          )}
                          {lvl.badgeType === 'advanced' && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                              Advanced (Purple)
                            </span>
                          )}
                        </div>

                        {/* Metadata: MCQs | Duration | Pass % | Attempts */}
                        <div className="flex flex-wrap items-center gap-1.5 text-[9.5px] text-slate-500 font-medium">
                          <span className="flex items-center space-x-0.5">
                            <FileText className="w-2.5 h-2.5 text-slate-400" />
                            <span>{lvl.mcqs} MCQs</span>
                          </span>
                          <span className="text-slate-300">|</span>
                          <span className="flex items-center space-x-0.5">
                            <Clock className="w-2.5 h-2.5 text-slate-400" />
                            <span>{lvl.durationMinutes} Mins</span>
                          </span>
                          <span className="text-slate-300">|</span>
                          <span className="text-emerald-700 font-bold">Pass: {lvl.passingPercentage}%</span>
                          <span className="text-slate-300">|</span>
                          <span className="text-slate-600 font-semibold">{lvl.allowedAttempts} Attempts</span>
                        </div>

                        {/* Certificate Code */}
                        <p className="text-[9px] text-slate-500 truncate font-medium">
                          Certificate: <span className="font-semibold text-slate-700">{certCodeDisplay}</span>
                        </p>
                      </div>
                    </div>

                    {/* Right: Divider & Exam Fee */}
                    <div className="text-right pl-2.5 sm:pl-3 border-l border-slate-200 flex-shrink-0 min-w-[75px]">
                      <span className="text-[8.5px] text-slate-500 font-semibold block uppercase tracking-wider">
                        Exam Fee
                      </span>
                      <span className="text-sm sm:text-base font-black text-[#10264B]">
                        ₹{lvl.feeINR.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Expanded Level Syllabus & Eligibility if Selected */}
                  {isSelected && (
                    <div className="mt-1 pt-1.5 border-t border-orange-100/80 text-[10px] space-y-1 animate-fadeIn">
                      <div className="flex items-start space-x-1.5 text-slate-600">
                        <BookOpen className="w-3 h-3 text-[#F47716] flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-slate-800">Syllabus Highlights: </span>
                          <span>{lvl.syllabus.slice(0, 2).join(' • ')}</span>
                        </div>
                      </div>
                      <div className="flex items-start space-x-1.5 text-slate-600">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-slate-800">Eligibility: </span>
                          <span>{lvl.eligibility}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 4 Feature Strip Icons with Dividers */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 grid grid-cols-4 divide-x divide-slate-200 text-center">
          <div className="px-1 space-y-0.5">
            <div className="w-5 h-5 mx-auto text-[#F47716] flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 stroke-[2.2]" />
            </div>
            <p className="text-[8.5px] font-bold text-slate-800 leading-tight">
              Industry Recognized
            </p>
          </div>

          <div className="px-1 space-y-0.5">
            <div className="w-5 h-5 mx-auto text-[#F47716] flex items-center justify-center">
              <BarChart3 className="w-4 h-4 stroke-[2.2]" />
            </div>
            <p className="text-[8.5px] font-bold text-slate-800 leading-tight">
              Role-Based Validation
            </p>
          </div>

          <div className="px-1 space-y-0.5">
            <div className="w-5 h-5 mx-auto text-[#F47716] flex items-center justify-center">
              <Globe className="w-4 h-4 stroke-[2.2]" />
            </div>
            <p className="text-[8.5px] font-bold text-slate-800 leading-tight">
              Global Credibility
            </p>
          </div>

          <div className="px-1 space-y-0.5">
            <div className="w-5 h-5 mx-auto text-[#F47716] flex items-center justify-center">
              <Award className="w-4 h-4 stroke-[2.2]" />
            </div>
            <p className="text-[8.5px] font-bold text-slate-800 leading-tight">
              Career Advantage
            </p>
          </div>
        </div>

        {/* Bottom Action Buttons */}
        <div className="mt-3.5 pt-1 flex items-center gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="w-1/3 py-2 sm:py-2.5 px-3 rounded-xl border-2 border-[#10264B] text-[#10264B] font-extrabold text-xs hover:bg-slate-50 transition-colors cursor-pointer text-center shadow-xs"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleContinue}
            disabled={loading}
            className="w-2/3 py-2 sm:py-2.5 px-4 rounded-xl bg-[#F47716] hover:bg-[#E35D00] text-white font-black text-xs sm:text-sm transition-all shadow-md hover:shadow-orange-500/25 flex items-center justify-center space-x-1.5 cursor-pointer hover:scale-[1.01] disabled:opacity-50"
          >
            <span>Continue to Enrollment</span>
            <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
};
