import React, { useRef, useState } from 'react';
import { Certificate } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  X,
  Download,
  Share2,
  Printer,
  Shield,
  CheckCircle2,
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface CertificateModalProps {
  certificate: Certificate | null;
  onClose: () => void;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({ certificate, onClose }) => {
  const certificateRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const { user, candidate } = useAuth();

  if (!certificate) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    const element = certificateRef.current;
    if (!element) return;

    try {
      setIsExporting(true);

      // Ensure all custom fonts (Cinzel, Playfair Display, Montserrat, Libre Baskerville, Great Vibes) are loaded
      if (document.fonts) {
        await document.fonts.ready;
      }

      // High-resolution capture at 3.5x scale with fixed desktop viewport emulation
      const canvas = await html2canvas(element, {
        scale: 3.5,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1280,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      // A4 Landscape: 297mm x 210mm
      // Canvas aspect ratio: 1024 / 683 = 1.499268
      // Height for 297mm width: 297 / 1.499268 = 198.1mm
      // Vertical margin: (210 - 198.1) / 2 = 5.95mm (Centered edge-to-edge)
      pdf.addImage(imgData, 'JPEG', 0, 5.95, 297, 198.1, undefined, 'FAST');
      pdf.save(`${certificate.certificateNo || 'AIICQB-Certificate'}.pdf`);
    } catch (err) {
      console.error('High-res PDF export fallback:', err);
      window.print();
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyLink = () => {
    const url =
      certificate.verificationUrl ||
      `${window.location.origin}/verify?id=${certificate.certificateNo || certificate.id || ''}`;
    navigator.clipboard.writeText(url);
    alert('Public verification URL copied to clipboard:\n' + url);
  };

  // DYNAMIC CERTIFICATE FIELDS:
  // 1. Candidate Name: ALWAYS display the name officially allocated to this specific certificate
  const candidateName =
    certificate.candidateName &&
    certificate.candidateName.trim() !== '' &&
    certificate.candidateName !== 'Henry Thomas' &&
    certificate.candidateName !== 'Candidate'
      ? certificate.candidateName
      : (user?.fullName || candidate?.fullName || 'Certified Candidate');

  // 2. Certificate Specialization / Title
  const rawCertName = certificate.certificationName || 'Certified AI Practitioner';
  const cleanQualificationTitle = (
    rawCertName
      .replace(/^(AIICQB|AICQB)\s*(Certified)?\s*/i, '')
      .replace(/^Certified\s+/i, '')
      .trim() || rawCertName
  ).toUpperCase();

  // 3. Date of Issue
  const issueDateText =
    certificate.issueDateFormatted || certificate.issueDate || '17 Nov 2026';

  // 4. Valid Till
  const validUntilText =
    certificate.validUntilFormatted || certificate.validUntil || '17 Nov 2029';

  // 5. Certificate ID
  const certificateIdText =
    certificate.certificateNo || certificate.id || 'AIICQB-PW-2026-000152';

  // 6. Signatory Name
  const signatoryName =
    certificate.issuer?.authorizedSignatory ||
    certificate.issuer?.ceo ||
    'Pushpak Wani';

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl 2xl:max-w-7xl w-full overflow-hidden border border-gray-200 my-auto flex flex-col max-h-[96vh]">
        {/* Modal Header Panel (Pinned, Never Overlapping) */}
        <div className="bg-[#0A1D37] text-white px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between border-b border-slate-700/80 flex-shrink-0 z-10 shadow-sm">
          <div className="flex items-center space-x-3 min-w-0 pr-2">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-tr from-[#D4AF37] to-[#F47716] flex items-center justify-center shadow-md flex-shrink-0 ring-1 ring-amber-400/40">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm sm:text-base md:text-lg tracking-wide text-white truncate font-montserrat">
                Official AIICQB™ Professional Certificate
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-300 font-montserrat mt-0.5 flex items-center space-x-2 truncate">
                <span>{certificateIdText}</span>
                <span className="text-slate-500">•</span>
                <span className="inline-flex items-center text-emerald-400 font-montserrat font-semibold text-[10px] sm:text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1 animate-pulse"></span>
                  Verified Credential
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 flex-shrink-0">
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center space-x-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg transition-colors border border-slate-600 shadow-xs cursor-pointer whitespace-nowrap font-montserrat"
              title="Copy verification link"
            >
              <Share2 className="w-3.5 h-3.5 text-slate-300" />
              <span className="hidden sm:inline">Share</span>
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center space-x-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg transition-colors border border-slate-600 shadow-xs cursor-pointer whitespace-nowrap font-montserrat"
              title="Print certificate"
            >
              <Printer className="w-3.5 h-3.5 text-slate-300" />
              <span className="hidden sm:inline">Print</span>
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={isExporting}
              className="inline-flex items-center space-x-1.5 text-xs bg-[#F47716] hover:bg-[#DC660E] disabled:opacity-60 text-white font-bold px-2.5 sm:px-3.5 py-1.5 rounded-lg shadow-md transition-all cursor-pointer whitespace-nowrap font-montserrat"
              title="Download high-resolution 300 DPI PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isExporting ? 'Exporting...' : 'Download (PDF)'}</span>
              <span className="sm:hidden">{isExporting ? '...' : 'PDF'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1 cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Canvas Area */}
        <div className="p-3 sm:p-5 bg-slate-200/90 overflow-auto flex justify-center items-start flex-1 min-h-0">
          {/* Certificate Container: Canonical 1024x683 Ratio with Exact Typography Point Sizing */}
          <div
            ref={certificateRef}
            className="relative w-full shadow-2xl rounded-sm overflow-hidden select-none bg-white flex-shrink-0 my-auto"
            style={{
              aspectRatio: '1024 / 683',
              maxWidth: 'min(1120px, calc((90vh - 130px) * (1024 / 683)), 94vw)',
              maxHeight: 'calc(90vh - 130px)',
              boxShadow: '0 20px 45px -10px rgba(10, 29, 55, 0.45), 0 0 0 1px rgba(10, 29, 55, 0.12)',
            }}
          >
            {/* Background: Subtle Light-Blue World Map Watermark with Golden Border */}
            <img
              src="/certificate-bg.jpg"
              alt="AIICQB Certificate Background"
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              crossOrigin="anonymous"
            />

            {/* 1. TOP BRANDING SECTION */}
            {/* AIICQB Logo */}
            <div
              className="absolute left-1/2 -translate-x-1/2 pointer-events-none flex justify-center"
              style={{ top: '3.0%', width: '46%', height: '8.8%' }}
            >
              <img
                src="/aiicqb-logo-cert.png"
                alt="AIICQB Logo"
                className="w-full h-full object-contain"
                crossOrigin="anonymous"
              />
            </div>

            {/* Main Heading: Cinzel Bold (27-32 pt equivalent) */}
            <div
              className="absolute left-1/2 -translate-x-1/2 pointer-events-none text-center"
              style={{ top: '13.2%', width: '85%' }}
            >
              <h1
                className="font-cinzel font-bold tracking-[0.22em] text-[#0A1D37] text-sm sm:text-lg md:text-xl lg:text-2xl xl:text-[27px] uppercase leading-tight"
                style={{
                  textShadow: '0 1px 1px rgba(255, 255, 255, 0.9)',
                }}
              >
                PROFESSIONAL CERTIFICATION
              </h1>
            </div>

            {/* 2. CERTIFICATE CONTENT SECTION */}
            {/* "This is to certify that": Libre Baskerville italic (with generous gap below stars) */}
            <div
              className="absolute left-1/2 -translate-x-1/2 pointer-events-none text-center"
              style={{ top: '21.5%', width: '70%' }}
            >
              <p className="font-baskerville italic text-slate-700 text-xs sm:text-sm md:text-base lg:text-[18px] leading-none">
                This is to certify that
              </p>
            </div>

            {/* Candidate Name: Playfair Display Bold (with generous gap below "This is to certify that") */}
            <div
              className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none text-center flex items-center justify-center"
              style={{ top: '28.2%', width: '85%' }}
            >
              <h2
                className="font-playfair font-bold text-[#0A1D37] text-lg sm:text-2xl md:text-3xl lg:text-[32px] xl:text-[36px] tracking-wide leading-tight whitespace-nowrap"
                style={{
                  textShadow: '0 1px 2px rgba(255, 255, 255, 0.95)',
                }}
              >
                {candidateName}
              </h2>
            </div>

            {/* Description text: Libre Baskerville (generous gap below candidate name) */}
            <div
              className="absolute left-1/2 -translate-x-1/2 pointer-events-none text-center"
              style={{ top: '33.8%', width: '82%' }}
            >
              <p className="font-baskerville text-slate-700 text-[8.5px] sm:text-[10px] md:text-xs lg:text-[13px] leading-relaxed mx-auto font-normal">
                has successfully completed the prescribed training, assessment and evaluation requirements and is hereby awarded the
              </p>
            </div>

            {/* Certificate Title Ribbon: Montserrat Bold */}
            <div
              className="absolute left-1/2 -translate-x-1/2 pointer-events-none flex items-center justify-center"
              style={{ top: '40.2%', width: '45%' }}
            >
              <div className="relative inline-flex items-center justify-center">
                {/* Left Folded Ribbon Wing */}
                <div className="hidden sm:block absolute -left-3.5 w-4 h-full bg-[#07162C] border-y border-l border-[#D4AF37] transform skew-y-6 -z-10 rounded-l-[1px]" />

                {/* Central Navy & Gold Ribbon Plate */}
                <div className="bg-gradient-to-r from-[#07162C] via-[#0A1D37] to-[#07162C] border-y-2 border-[#D4AF37] px-6 sm:px-10 py-1 sm:py-1.5 shadow-md flex items-center justify-center rounded-[2px]">
                  <span className="font-montserrat font-bold text-amber-300 tracking-[0.24em] text-[10px] sm:text-xs md:text-sm lg:text-[16px] uppercase leading-none drop-shadow-xs whitespace-nowrap">
                    CERTIFICATE IN
                  </span>
                </div>

                {/* Right Folded Ribbon Wing */}
                <div className="hidden sm:block absolute -right-3.5 w-4 h-full bg-[#07162C] border-y border-r border-[#D4AF37] transform -skew-y-6 -z-10 rounded-r-[1px]" />
              </div>
            </div>

            {/* Actual Certificate/Course Name: Montserrat Bold (Moved slightly down from 'CERTIFICATE IN' ribbon) */}
            <div
              className="absolute left-1/2 -translate-x-1/2 pointer-events-none text-center flex flex-col items-center justify-center"
              style={{ top: '49.2%', width: '86%', height: '8.5%' }}
            >
              <h3
                className="font-montserrat font-bold text-[#0A1D37] text-sm sm:text-base md:text-lg lg:text-xl xl:text-[23px] tracking-wider uppercase leading-tight text-center"
                style={{
                  textShadow: '0 1px 1px rgba(255, 255, 255, 0.95)',
                }}
              >
                {cleanQualificationTitle}
              </h3>
              <p className="font-baskerville text-slate-500 text-[8px] sm:text-[9.5px] md:text-[10.5px] italic mt-0.5">
                in recognition of demonstrated knowledge, practical skills and professional competence.
              </p>
            </div>

            {/* 3. LOWER SECTION: SIGNATORY (LEFT) - In One Clean Line without Name */}
            <div
              className="absolute pointer-events-none flex flex-col items-center text-center justify-end"
              style={{ top: '62.5%', left: '16.5%', width: '26%', height: '27%' }}
            >
              {/* Jay Thomas Authentic Blue Ink Signature */}
              <div className="h-10 sm:h-12 md:h-14 lg:h-16 flex items-end justify-center pb-0.5">
                <img
                  src="/certificate-signature.png"
                  alt="Jay Thomas Signature"
                  className="h-9 sm:h-11 md:h-13 lg:h-15 w-auto object-contain filter drop-shadow-xs"
                  crossOrigin="anonymous"
                />
              </div>
              {/* Gold separator line */}
              <div className="w-32 sm:w-40 md:w-48 h-[1.5px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent my-1 sm:my-1.5" />
              {/* Designation & Board in One Single Clean Line */}
              <p className="font-montserrat font-bold text-[8.5px] sm:text-[10px] md:text-[11.5px] text-[#0A1D37] tracking-wider uppercase leading-tight whitespace-nowrap">
                Authorized Signatory AIICQB
              </p>
            </div>

            {/* 3. LOWER SECTION: GOLD SEAL (CENTER) */}
            <div
              className="absolute left-1/2 -translate-x-1/2 pointer-events-none flex flex-col items-center justify-end"
              style={{ top: '61.8%', width: '22%', height: '28%' }}
            >
              <img
                src="/aiicqb-gold-seal.png"
                alt="AIICQB Certified Professional Seal"
                className="w-20 sm:w-26 md:w-32 lg:w-34 xl:w-36 h-auto object-contain filter drop-shadow-md"
                crossOrigin="anonymous"
              />
            </div>

            {/* 3. LOWER SECTION: CERTIFICATE DETAILS (RIGHT) - Safely Inset Inside Border */}
            <div
              className="absolute pointer-events-none flex flex-col justify-center text-left"
              style={{ top: '60.5%', right: '5.5%' }}
            >
              <table className="border-separate" style={{ borderSpacing: '0 5px' }}>
                <tbody>
                  {/* Row 1: Certificate ID */}
                  <tr>
                    <td className="align-middle pr-1.5" style={{ width: '22px' }}>
                      <div className="w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-xs bg-[#FFFDF5] border border-[#D4AF37]/80 flex items-center justify-center flex-shrink-0 shadow-2xs">
                        <svg
                          width="11"
                          height="11"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#B8860B"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect width="18" height="14" x="3" y="5" rx="2" />
                          <circle cx="9" cy="10" r="2" />
                          <line x1="15" x2="17" y1="9" y2="9" />
                          <line x1="15" x2="17" y1="13" y2="13" />
                        </svg>
                      </div>
                    </td>
                    <td className="align-middle pr-1.5 whitespace-nowrap font-montserrat font-semibold text-[8px] sm:text-[9px] md:text-[10.5px] text-slate-600 uppercase tracking-wider">
                      Certificate ID
                    </td>
                    <td className="align-middle pr-1.5 font-montserrat font-bold text-[8.5px] sm:text-[9.5px] md:text-[11px] text-[#0A1D37]">
                      :
                    </td>
                    <td className="align-middle whitespace-nowrap font-montserrat font-bold text-[8.5px] sm:text-[9.5px] md:text-[11px] text-[#0A1D37] tracking-tight">
                      {certificateIdText}
                    </td>
                  </tr>

                  {/* Row 2: Valid Till */}
                  <tr>
                    <td className="align-middle pr-1.5" style={{ width: '22px' }}>
                      <div className="w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-xs bg-[#FFFDF5] border border-[#D4AF37]/80 flex items-center justify-center flex-shrink-0 shadow-2xs">
                        <svg
                          width="11"
                          height="11"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#B8860B"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect width="18" height="18" x="3" y="4" rx="2" />
                          <line x1="16" x2="16" y1="2" y2="6" />
                          <line x1="8" x2="8" y1="2" y2="6" />
                          <line x1="3" x2="21" y1="10" y2="10" />
                          <path d="m9 16 2 2 4-4" />
                        </svg>
                      </div>
                    </td>
                    <td className="align-middle pr-1.5 whitespace-nowrap font-montserrat font-semibold text-[8px] sm:text-[9px] md:text-[10.5px] text-slate-600 uppercase tracking-wider">
                      Valid Till
                    </td>
                    <td className="align-middle pr-1.5 font-montserrat font-bold text-[8.5px] sm:text-[9.5px] md:text-[11px] text-[#0A1D37]">
                      :
                    </td>
                    <td className="align-middle whitespace-nowrap font-montserrat font-bold text-[8.5px] sm:text-[9.5px] md:text-[11px] text-[#0A1D37] tracking-tight">
                      {validUntilText}
                    </td>
                  </tr>

                  {/* Row 3: Date of Issue */}
                  <tr>
                    <td className="align-middle pr-1.5" style={{ width: '22px' }}>
                      <div className="w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-xs bg-[#FFFDF5] border border-[#D4AF37]/80 flex items-center justify-center flex-shrink-0 shadow-2xs">
                        <svg
                          width="11"
                          height="11"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#B8860B"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect width="18" height="18" x="3" y="4" rx="2" />
                          <line x1="16" x2="16" y1="2" y2="6" />
                          <line x1="8" x2="8" y1="2" y2="6" />
                          <line x1="3" x2="21" y1="10" y2="10" />
                        </svg>
                      </div>
                    </td>
                    <td className="align-middle pr-1.5 whitespace-nowrap font-montserrat font-semibold text-[8px] sm:text-[9px] md:text-[10.5px] text-slate-600 uppercase tracking-wider">
                      Date of Issue
                    </td>
                    <td className="align-middle pr-1.5 font-montserrat font-bold text-[8.5px] sm:text-[9.5px] md:text-[11px] text-[#0A1D37]">
                      :
                    </td>
                    <td className="align-middle whitespace-nowrap font-montserrat font-bold text-[8.5px] sm:text-[9.5px] md:text-[11px] text-[#0A1D37] tracking-tight">
                      {issueDateText}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* 3D Metallic Gold Stars below Date of Issue - Enriched Size */}
              <div className="flex items-center justify-center pt-2 sm:pt-3 w-full">
                <img
                  src="/certificate-stars.png"
                  alt="Gold Stars"
                  className="h-7 sm:h-9 md:h-11 lg:h-12 w-auto object-contain filter drop-shadow-sm"
                  crossOrigin="anonymous"
                />
              </div>
            </div>

            {/* 4. FOOTER: Montserrat Regular (9-10 pt equivalent) */}
            <div
              className="absolute left-1/2 -translate-x-1/2 pointer-events-none text-center flex items-center justify-center font-montserrat"
              style={{ top: '93.5%', width: '80%' }}
            >
              <p className="font-normal text-[8px] sm:text-[9.5px] md:text-[10.5px] text-slate-500 tracking-wide flex items-center space-x-1 whitespace-nowrap">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#D4AF37"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="inline mr-1"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                  <path d="M2 12h20" />
                </svg>
                <span>Issued by AIICQB under the Independent Certification Framework.</span>
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="bg-slate-50 px-5 sm:px-6 py-3 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-gray-500 gap-2">
          <div className="flex items-center space-x-2 font-montserrat">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>
              Cryptographically verifiable at <span className="font-semibold text-[#0A1D37]">www.aiicqb.org/verify</span>
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-[11px] text-gray-400 font-montserrat">
              Board Accredited Framework • Independent Global Standard
            </span>
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold text-xs transition-colors cursor-pointer font-montserrat"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
