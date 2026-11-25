import React, { useState } from 'react';
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
} from 'lucide-react';

export interface ExamLevelOption {
  id: 'foundation' | 'professional' | 'expert';
  name: string;
  badge: string;
  badgeType: 'beginner' | 'popular' | 'advanced';
  mcqs: number;
  durationMinutes: number;
  difficulty: string;
  certificateSuffix: string;
  certificateTitle: string;
  feeINR: number;
  feeUSD: number;
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
  initialLevelId?: 'foundation' | 'professional' | 'expert';
  onContinue: (selectedLevel: {
    levelId: string;
    levelName: string;
    code: string;
    amount: number;
    amountUSD: number;
    durationMinutes: number;
    mcqs: number;
  }) => void;
  onClose: () => void;
}

export const SelectExamLevelModal: React.FC<SelectExamLevelModalProps> = ({
  certification,
  initialLevelId,
  onContinue,
  onClose,
}) => {
  // Base code manipulation, e.g. "AIICQB-AT-CP" -> "AIICQB-AT"
  const cleanCode = certification.code.replace(/®/g, '').trim();
  const baseCodePrefix = cleanCode.includes('-')
    ? cleanCode.substring(0, cleanCode.lastIndexOf('-'))
    : cleanCode;

  const defaultProfessionalFee = certification.examFee || 9999;
  const defaultProfessionalFeeUSD = certification.examFeeUSD || 119;

  // Level Options matching screenshot
  const levels: ExamLevelOption[] = [
    {
      id: 'foundation',
      name: 'Foundation Level',
      badge: 'Beginner',
      badgeType: 'beginner',
      mcqs: 50,
      durationMinutes: 60,
      difficulty: 'Easy',
      certificateSuffix: 'CF',
      certificateTitle: 'Certified Foundation',
      feeINR: 4500,
      feeUSD: 59,
    },
    {
      id: 'professional',
      name: 'Professional Level',
      badge: '★ Most Popular',
      badgeType: 'popular',
      mcqs: 75,
      durationMinutes: 90,
      difficulty: 'Medium',
      certificateSuffix: 'CP',
      certificateTitle: 'Certified Professional',
      feeINR: defaultProfessionalFee,
      feeUSD: defaultProfessionalFeeUSD,
    },
    {
      id: 'expert',
      name: 'Expert Level',
      badge: 'Advanced',
      badgeType: 'advanced',
      mcqs: 100,
      durationMinutes: 120,
      difficulty: 'Advanced',
      certificateSuffix: 'CE',
      certificateTitle: 'Certified Expert',
      feeINR: 13999,
      feeUSD: 169,
    },
  ];

  // Default selected level is "Professional Level" matching screenshot, or initialLevelId if passed
  const [selectedLevelId, setSelectedLevelId] = useState<'foundation' | 'professional' | 'expert'>(
    initialLevelId || 'professional'
  );

  const selectedLevel = levels.find((l) => l.id === selectedLevelId) || levels[1];

  const handleContinue = () => {
    const finalCertCode = `${baseCodePrefix}-${selectedLevel.certificateSuffix}®`;
    onContinue({
      levelId: selectedLevel.id,
      levelName: selectedLevel.name,
      code: finalCertCode,
      amount: selectedLevel.feeINR,
      amountUSD: selectedLevel.feeUSD,
      durationMinutes: selectedLevel.durationMinutes,
      mcqs: selectedLevel.mcqs,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-[490px] w-full p-4 sm:p-5 relative my-auto animate-scaleUp border border-slate-100">
        {/* Close Button Top-Right Matching Screenshot */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3.5 top-3.5 sm:right-4 sm:top-4 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#F47716] hover:bg-[#E35D00] text-white flex items-center justify-center transition-all cursor-pointer shadow-md hover:scale-105"
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
            Choose the exam level for this certification based on your experience and career goal.
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

        {/* Level Options Cards */}
        <div className="mt-2.5 space-y-2">
          {levels.map((lvl) => {
            const isSelected = selectedLevelId === lvl.id;
            const certCodeDisplay = `${baseCodePrefix}-${lvl.certificateSuffix}® (${lvl.certificateTitle})`;

            return (
              <div
                key={lvl.id}
                onClick={() => setSelectedLevelId(lvl.id)}
                className={`rounded-xl p-2.5 sm:p-3 border transition-all cursor-pointer flex items-center justify-between gap-2.5 select-none ${
                  isSelected
                    ? 'border-2 border-[#F47716] bg-[#FFF8F3] shadow-xs'
                    : lvl.id === 'foundation'
                    ? 'border-blue-200 bg-white hover:border-blue-300 hover:bg-blue-50/20'
                    : lvl.id === 'expert'
                    ? 'border-purple-200 bg-white hover:border-purple-300 hover:bg-purple-50/20'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                {/* Left: Radio + Icon + Info */}
                <div className="flex items-center space-x-2.5 min-w-0">
                  {/* Radio Indicator */}
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      isSelected ? 'border-[#F47716]' : 'border-slate-300'
                    }`}
                  >
                    {isSelected && (
                      <div className="w-2 h-2 rounded-full bg-[#F47716]" />
                    )}
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
                    <div className="flex items-center space-x-1.5">
                      <span className="text-xs sm:text-[13px] font-extrabold text-[#10264B]">
                        {lvl.name}
                      </span>
                      {/* Badge */}
                      {lvl.badgeType === 'beginner' && (
                        <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-[#DCEAFE] text-[#1E40AF]">
                          {lvl.badge}
                        </span>
                      )}
                      {lvl.badgeType === 'popular' && (
                        <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-[#F47716] text-white shadow-xs">
                          {lvl.badge}
                        </span>
                      )}
                      {lvl.badgeType === 'advanced' && (
                        <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-[#E9D5FF] text-[#6B21A8]">
                          {lvl.badge}
                        </span>
                      )}
                    </div>

                    {/* Metadata: MCQs | Duration | Difficulty */}
                    <div className="flex items-center space-x-1.5 text-[9.5px] text-slate-500 font-medium">
                      <span className="flex items-center space-x-0.5">
                        <FileText className="w-2.5 h-2.5 text-slate-400" />
                        <span>{lvl.mcqs} MCQs</span>
                      </span>
                      <span className="text-slate-300">|</span>
                      <span className="flex items-center space-x-0.5">
                        <Clock className="w-2.5 h-2.5 text-slate-400" />
                        <span>{lvl.durationMinutes} Minutes</span>
                      </span>
                      <span className="text-slate-300">|</span>
                      <span className="flex items-center space-x-0.5">
                        <BarChart className="w-2.5 h-2.5 text-slate-400" />
                        <span>{lvl.difficulty}</span>
                      </span>
                    </div>

                    {/* Certificate Code */}
                    <p className="text-[9px] text-slate-500 truncate font-medium">
                      Certificate: <span className="font-semibold text-slate-700">{certCodeDisplay}</span>
                    </p>
                  </div>
                </div>

                {/* Right: Divider & Exam Fee */}
                <div className="text-right pl-2.5 sm:pl-3 border-l border-slate-200 flex-shrink-0 min-w-[70px]">
                  <span className="text-[8.5px] text-slate-500 font-semibold block uppercase tracking-wider">
                    Exam Fee
                  </span>
                  <span className="text-sm sm:text-base font-black text-[#10264B]">
                    ₹{lvl.feeINR.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* 4 Feature Strip Icons with Dividers (Matching Screenshot) */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 grid grid-cols-4 divide-x divide-slate-200 text-center">
          <div className="px-1 space-y-0.5">
            <div className="w-5 h-5 mx-auto text-[#F47716] flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 stroke-[2.2]" />
            </div>
            <p className="text-[8.5px] font-bold text-slate-800 leading-tight">
              Industry Recognized Certificate
            </p>
          </div>

          <div className="px-1 space-y-0.5">
            <div className="w-5 h-5 mx-auto text-[#F47716] flex items-center justify-center">
              <BarChart3 className="w-4 h-4 stroke-[2.2]" />
            </div>
            <p className="text-[8.5px] font-bold text-slate-800 leading-tight">
              Role Based Skill Validation
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
              Career & Placement Advantage
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
            className="w-2/3 py-2 sm:py-2.5 px-4 rounded-xl bg-[#F47716] hover:bg-[#E35D00] text-white font-black text-xs sm:text-sm transition-all shadow-md hover:shadow-orange-500/25 flex items-center justify-center space-x-1.5 cursor-pointer hover:scale-[1.01]"
          >
            <span>Continue to Enrollment</span>
            <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
};
