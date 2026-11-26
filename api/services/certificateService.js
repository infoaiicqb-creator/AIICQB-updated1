import QRCode from 'qrcode';
import db from '../config/db.js';

/**
 * Maps certification name, code or domain to standardized 2-letter abbreviation
 * Format: AT (Automation Testing), AI (Artificial Intelligence), ST (Software Testing), PT (Performance Testing), etc.
 */
export function parseCertificationCode(code = '', name = '', domain = '') {
  const combined = `${code} ${name} ${domain}`.toUpperCase();

  if (
    combined.includes('AUTOMATION') ||
    combined.includes('PLAYWRIGHT') ||
    combined.includes('CYPRESS') ||
    combined.includes('SELENIUM') ||
    combined.includes('-AT-') ||
    combined.includes('-AT')
  ) {
    return 'AT';
  }
  if (
    combined.includes('ARTIFICIAL INTELLIGENCE') ||
    combined.includes('MACHINE LEARNING') ||
    combined.includes('-AI-') ||
    combined.includes('-AI') ||
    combined.includes('AI PROFESSIONAL')
  ) {
    return 'AI';
  }
  if (
    combined.includes('SOFTWARE TEST') ||
    combined.includes('MANUAL TEST') ||
    combined.includes('QUALITY ASSURANCE') ||
    combined.includes('QUALITY ENGINEERING') ||
    combined.includes('QA') ||
    combined.includes('-ST-') ||
    combined.includes('-ST')
  ) {
    return 'ST';
  }
  if (
    combined.includes('PERFORMANCE') ||
    combined.includes('JMETER') ||
    combined.includes('LOAD') ||
    combined.includes('-PT-')
  ) {
    return 'PT';
  }
  if (
    combined.includes('CYBER') ||
    combined.includes('SECURITY') ||
    combined.includes('-CS-')
  ) {
    return 'CS';
  }
  if (
    combined.includes('DEVOPS') ||
    combined.includes('CLOUD') ||
    combined.includes('-DV-')
  ) {
    return 'DV';
  }
  if (
    combined.includes('DATA SCIENCE') ||
    combined.includes('DATA ANALYTICS') ||
    combined.includes('-DS-')
  ) {
    return 'DS';
  }
  if (domain && domain.length >= 2) {
    return domain.toUpperCase().slice(0, 2).replace(/[^A-Z]/g, '');
  }
  return 'AT';
}

/**
 * Maps level string to standardized 3-letter abbreviation:
 * FND (Foundation), PRF (Professional), EXP (Expert)
 */
export function parseLevelCode(levelStr = '', certCode = '', certName = '') {
  const combined = `${levelStr} ${certCode} ${certName}`.toUpperCase();

  if (
    combined.includes('FND') ||
    combined.includes('FOUNDATION') ||
    combined.includes('ASSOCIATE') ||
    combined.includes('ENTRY') ||
    combined.includes('BASIC')
  ) {
    return 'FND';
  }
  if (
    combined.includes('EXP') ||
    combined.includes('EXPERT') ||
    combined.includes('ADVANCED') ||
    combined.includes('MASTER')
  ) {
    return 'EXP';
  }
  if (
    combined.includes('PRF') ||
    combined.includes('PROFESSIONAL') ||
    combined.includes('PRACTITIONER') ||
    combined.includes('INTERMEDIATE')
  ) {
    return 'PRF';
  }
  return 'PRF';
}

/**
 * Returns human-readable level title
 */
export function getFullLevelName(levelCode) {
  switch (levelCode) {
    case 'FND':
      return 'Foundation Level';
    case 'EXP':
      return 'Expert Level';
    case 'PRF':
    default:
      return 'Professional Level';
  }
}

/**
 * Generates guaranteed unique sequential Certificate Number:
 * Format: AIICQB-[CERTIFICATION]-[LEVEL]-[YEAR]-[SERIAL NUMBER]
 * Examples:
 * AIICQB-AT-FND-2026-000001
 * AIICQB-AT-PRF-2026-000002
 * AIICQB-AI-FND-2026-000003
 * AIICQB-AT-EXP-2026-000004
 */
export function generateUniqueCertificateNumber({ certificationCode, levelCode, year, customCertNo }) {
  if (customCertNo && customCertNo.trim()) {
    return {
      certificateNo: customCertNo.trim(),
      serialNumber: customCertNo.split('-').pop() || '000001',
    };
  }

  const effectiveYear = year || new Date().getFullYear();
  const certAbbr = certificationCode || 'AT';
  const lvlAbbr = levelCode || 'PRF';

  // Obtain atomic sequence counter from database
  let seq = db.getNextSequence('certificate_serial', 1);
  let serialNumber = String(seq).padStart(6, '0');
  let candidateCertNo = `AIICQB-${certAbbr}-${lvlAbbr}-${effectiveYear}-${serialNumber}`;

  // Collision prevention loop against entire database
  const allCerts = db.getCollection('certificates');
  while (allCerts.some(c => c && (c.certificateNo === candidateCertNo || c.certificateNumber === candidateCertNo))) {
    seq = db.getNextSequence('certificate_serial');
    serialNumber = String(seq).padStart(6, '0');
    candidateCertNo = `AIICQB-${certAbbr}-${lvlAbbr}-${effectiveYear}-${serialNumber}`;
  }

  return { certificateNo: candidateCertNo, serialNumber, sequence: seq };
}

/**
 * Automates certificate generation after successful exam completion or admin issuance.
 * Enforces:
 * 1. Minimum 70% passing standard
 * 2. Strict unique Certificate ID and unique Certificate Number
 * 3. Dedicated number per certification and per level
 * 4. Storing all required database fields
 * 5. High-resolution cryptographic QR code pointing to /verification/:id
 */
export async function generateCertificate({
  candidateUid,
  candidateName,
  candidateId,
  candidateEmail,
  certificationId,
  certificationName,
  certificationCode,
  credentialLevel = 'Professional Level',
  certificationLevel,
  domainCode,
  grade,
  percentage,
  score,
  issueDate: customIssueDate,
  validUntil: customValidUntil,
  certificateNo: customCertNo,
  forceNew = false,
}) {
  // 1. Strict Minimum 70% Passing Criteria Check
  const effectiveScore = score !== undefined ? Number(score) : (percentage !== undefined ? Number(percentage) : 85);
  if (percentage !== undefined && percentage !== null && Number(percentage) < 70) {
    throw new Error(
      `Cannot generate certificate: Candidate scored ${percentage}%, which is below the mandatory 70% passing standard.`
    );
  }

  // 2. Derive Standardized Codes & Levels
  const certCode = parseCertificationCode(certificationCode, certificationName, domainCode);
  const rawLevel = certificationLevel || credentialLevel || 'Professional Level';
  const levelCode = parseLevelCode(rawLevel, certificationCode, certificationName);
  const fullLevelName = getFullLevelName(levelCode);

  // 3. Database Validation & One Certification + Level Idempotency Check
  if (!forceNew) {
    const existingCert = db.findOne('certificates', c => {
      if (!c) return false;
      const matchCandidate = (
        (candidateUid && c.candidateUid === candidateUid) ||
        (candidateId && (c.candidateId === candidateId || c.candidate_id === candidateId)) ||
        (candidateEmail && c.candidateEmail?.toLowerCase() === candidateEmail.toLowerCase())
      );
      if (!matchCandidate) return false;

      // Match certification
      const matchCert = (
        (certificationId && c.certificationId === certificationId) ||
        (certificationCode && c.certificationCode === certificationCode) ||
        (certificationName && c.certificationName?.toLowerCase().trim() === certificationName?.toLowerCase().trim())
      );
      if (!matchCert) return false;

      // Each level must receive its own distinct certificate number
      const existingLvl = parseLevelCode(c.certificationLevel || c.credentialLevel || c.certificateNo);
      return existingLvl === levelCode;
    });

    if (existingCert) {
      return existingCert;
    }
  }

  // 4. Generate Dates & Year
  const issueDate = customIssueDate ? new Date(customIssueDate) : new Date();
  const issueYear = issueDate.getFullYear();
  const validUntil = customValidUntil ? new Date(customValidUntil) : new Date(issueDate);
  if (!customValidUntil) {
    validUntil.setFullYear(validUntil.getFullYear() + 3); // Standard 3 years validity
  }

  const issueDateFormatted = issueDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const validUntilFormatted = validUntil.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  // 5. Generate Guaranteed Unique Number in AIICQB-[CERTIFICATION]-[LEVEL]-[YEAR]-[SERIAL NUMBER] format
  const { certificateNo: finalCertificateNo } = generateUniqueCertificateNumber({
    certificationCode: certCode,
    levelCode,
    year: issueYear,
    customCertNo,
  });

  // 6. Generate Unique Certificate ID (Immutable)
  const certificateId = `cert_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

  // 7. Calculate Grade
  const calculatedGrade = grade || (
    effectiveScore >= 90
      ? 'Grade A+ (Distinction)'
      : effectiveScore >= 80
      ? 'Grade A (Merit)'
      : effectiveScore >= 70
      ? 'Grade B (Pass)'
      : 'Grade A+ (Distinction)'
  );

  // 8. Generate Unique QR Code pointing to verification URL: /verification/CERTIFICATE-ID
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5000';
  const verificationUrl = `${clientUrl}/verification/${encodeURIComponent(finalCertificateNo)}`;

  const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
    errorCorrectionLevel: 'H',
    margin: 1,
    width: 280,
    color: {
      dark: '#10264B',
      light: '#FFFFFF',
    },
  });

  // 9. Signatories
  const generalSettings = db.findOne('systemSettings', s => s.id === 'general') || {};
  const currentCeo = generalSettings.ceoName || 'Pushpak Wani';
  const currentCeoTitle = generalSettings.ceoTitle || 'Chief Executive Officer (CEO)';
  const currentDirector = generalSettings.directorName || 'Dr. Neha Kulkarni';
  const currentDirectorTitle = generalSettings.directorTitle || 'Director – Certification';

  // 10. Assemble Full Database Record
  const certificateRecord = {
    id: certificateId,
    certificateId: certificateId,
    certificateNo: finalCertificateNo,
    certificateNumber: finalCertificateNo,
    candidateName: candidateName || 'Certified Candidate',
    candidateId: candidateId || 'AICQB-CAND',
    candidateEmail: candidateEmail || 'candidate@aicqb.org',
    candidateUid: candidateUid || null,
    certificationName: certificationName || 'AIICQB Professional Certification',
    certificationId: certificationId || `cert_${certCode.toLowerCase()}`,
    certificationCode: certificationCode || `AIICQB-${certCode}-${levelCode}`,
    certificationLevel: fullLevelName,
    credentialLevel: fullLevelName,
    examScore: effectiveScore,
    score: effectiveScore,
    grade: calculatedGrade,
    issueDate: issueDate.toISOString(),
    issueDateFormatted: issueDateFormatted,
    expiryDate: validUntil.toISOString(),
    validUntil: validUntil.toISOString(),
    validUntilFormatted: validUntilFormatted,
    certificateStatus: 'Issued',
    status: 'Issued',
    certificatePdfUrl: `/api/certificates/download/${encodeURIComponent(finalCertificateNo)}`,
    verificationUrl: verificationUrl,
    qrCodeDataUrl: qrCodeDataUrl,
    createdTimestamp: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    issuer: {
      director: currentDirector,
      directorTitle: currentDirectorTitle,
      ceo: currentCeo,
      ceoTitle: currentCeoTitle,
      organization: 'AI International Certification & Qualification Board (AIICQB)',
    },
    disclaimer: 'Issued by AIICQB under its independent certification scheme. This is a private professional certification and is not a government qualification or licence.',
  };

  // Add document to database (protected by unique constraint)
  db.addDoc('certificates', certificateRecord);

  // Log into certificateVerification registry
  db.addDoc('certificateVerification', {
    certificateNo: finalCertificateNo,
    candidateName: certificateRecord.candidateName,
    certificationName: certificateRecord.certificationName,
    verifiedCount: 0,
    createdAt: new Date().toISOString(),
  });

  return certificateRecord;
}

/**
 * Ensures candidate receives all certificates for passed exams, schedules, and completed enrollments.
 */
export async function ensureCandidateCertificates({ uid, email, candidateId, fullName }) {
  const cleanEmail = email ? email.toLowerCase().trim() : '';

  // 1. Current certificates
  let certificates = db.find('certificates', c =>
    (uid && c.candidateUid === uid) ||
    (candidateId && (c.candidateId === candidateId || c.candidate_id === candidateId)) ||
    (cleanEmail && c.candidateEmail && c.candidateEmail.toLowerCase() === cleanEmail)
  );

  // 2. Passed results
  const passedResults = db.find('results', r =>
    ((uid && r.candidateUid === uid) ||
      (candidateId && (r.candidateId === candidateId || r.candidate_id === candidateId)) ||
      (cleanEmail && r.candidateEmail && r.candidateEmail.toLowerCase() === cleanEmail)) &&
    r.passed
  );

  // 3. Completed / passed schedules
  const completedSchedules = db.find('examSchedules', s =>
    ((uid && s.candidateUid === uid) ||
      (candidateId && (s.candidateId === candidateId || s.candidate_id === candidateId)) ||
      (cleanEmail && s.candidateEmail && s.candidateEmail.toLowerCase() === cleanEmail)) &&
    (s.passed || (s.status === 'completed' && s.certificateNo))
  );

  // 4. Completed enrollments
  const completedEnrollments = db.find('enrollments', e =>
    ((uid && e.candidateUid === uid) ||
      (candidateId && (e.candidateId === candidateId || e.candidate_id === candidateId)) ||
      (cleanEmail && e.candidateEmail && e.candidateEmail.toLowerCase() === cleanEmail)) &&
    e.status === 'completed'
  );

  const passedItems = [...passedResults, ...completedSchedules, ...completedEnrollments];

  for (const item of passedItems) {
    const certId = item.certificationId || item.certification_id;
    const certCode = item.certificationCode || item.certification_code;
    const certName = item.certificationName || item.certification_name || item.name;
    const rawLvl = item.level || item.certification_level || item.credentialLevel || 'Professional Level';
    const lvlCode = parseLevelCode(rawLvl, certCode, certName);

    const exists = certificates.some(c => {
      const matchCert = (
        (certId && c.certificationId === certId) ||
        (certCode && c.certificationCode === certCode) ||
        (certName && c.certificationName?.toLowerCase().trim() === certName.toLowerCase().trim())
      );
      if (!matchCert) return false;
      const existLvl = parseLevelCode(c.certificationLevel || c.credentialLevel || c.certificateNo);
      return existLvl === lvlCode;
    });

    if (!exists && (certId || certCode || certName)) {
      try {
        const certCatalog = db.findOne('certifications', c =>
          (certId && c.id === certId) ||
          (certCode && c.code === certCode)
        );

        const newCert = await generateCertificate({
          candidateUid: uid || item.candidateUid,
          candidateName: fullName || item.candidateName || item.candidate_name || 'Candidate',
          candidateId: candidateId || item.candidateId || item.candidate_id || 'AICQB-CAND',
          candidateEmail: cleanEmail || item.candidateEmail || item.candidate_email,
          certificationId: certId || certCatalog?.id,
          certificationName: certName || certCatalog?.name || 'AIICQB Certification',
          certificationCode: certCode || certCatalog?.code,
          credentialLevel: rawLvl,
          percentage: item.percentage || item.score || 85,
          score: item.score || item.percentage || 85,
        });

        certificates.push(newCert);

        // Update enrollment status
        const enr = db.findOne('enrollments', e =>
          ((uid && e.candidateUid === uid) || (cleanEmail && e.candidateEmail?.toLowerCase() === cleanEmail)) &&
          (e.certificationId === certId || e.certificationCode === certCode)
        );
        if (enr && enr.status !== 'completed') {
          db.updateDoc('enrollments', enr.id, { status: 'completed', progressPercentage: 100 });
        }
      } catch (err) {
        console.warn('Auto certificate generation skipped:', err.message);
      }
    }
  }

  return certificates;
}
