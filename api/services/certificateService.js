import QRCode from 'qrcode';
import db from '../config/db.js';

export async function generateCertificate({
  candidateUid,
  candidateName,
  candidateId,
  candidateEmail,
  certificationId,
  certificationName,
  certificationCode,
  credentialLevel = 'Professional Level',
  domainCode = 'AI',
  grade,
  percentage,
  score,
  issueDate: customIssueDate,
  validUntil: customValidUntil,
  certificateNo: customCertNo,
  forceNew = false,
}) {
  // 1. Strict Minimum 70% Passing Criteria Check
  const effectiveScore = score !== undefined ? score : (percentage !== undefined ? percentage : 85);
  if (percentage !== undefined && percentage !== null && Number(percentage) < 70) {
    throw new Error(
      `Cannot generate certificate: Candidate scored ${percentage}%, which is below the mandatory 70% passing standard.`
    );
  }

  // 2. Database Validation & One Exam - One Certificate Rule (Idempotency)
  if (!forceNew) {
    const existingCert = db.findOne('certificates', c =>
      ((candidateUid && c.candidateUid === candidateUid) ||
        (candidateId && c.candidateId === candidateId) ||
        (candidateEmail && c.candidateEmail?.toLowerCase() === candidateEmail.toLowerCase())) &&
      ((certificationId && c.certificationId === certificationId) ||
        (certificationCode && c.certificationCode === certificationCode))
    );

    if (existingCert) {
      return existingCert;
    }
  }

  const currentYear = new Date().getFullYear();
  // Count existing certificates to generate sequence
  const allCerts = db.getCollection('certificates');
  const seq = String(allCerts.length + 124).padStart(6, '0');
  
  // Format matching Screenshot: AICQB-[DOMAIN]-[YEAR]-[SEQUENCE] or custom
  const cleanDomain = (domainCode || 'AI').toUpperCase();
  const certificateNo = customCertNo || `AICQB-${cleanDomain}-${currentYear}-${seq}`;

  const calculatedGrade = grade || (effectiveScore >= 90 ? 'Grade A+ (Distinction)' : effectiveScore >= 80 ? 'Grade A (Merit)' : effectiveScore >= 70 ? 'Grade B (Pass)' : 'Grade A+ (Distinction)');

  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5000';
  const verificationUrl = `${clientUrl}/verify?id=${encodeURIComponent(certificateNo)}`;

  // Generate real QR code as data URL
  const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
    errorCorrectionLevel: 'H',
    margin: 1,
    width: 250,
    color: {
      dark: '#10264B',
      light: '#FFFFFF',
    },
  });

  const issueDate = customIssueDate ? new Date(customIssueDate) : new Date();
  const validUntil = customValidUntil ? new Date(customValidUntil) : new Date(issueDate);
  if (!customValidUntil) {
    validUntil.setFullYear(validUntil.getFullYear() + 3); // 3 years validity
  }

  const generalSettings = db.findOne('systemSettings', s => s.id === 'general') || {};
  const currentCeo = generalSettings.ceoName || 'Pushpak Wani';
  const currentCeoTitle = generalSettings.ceoTitle || 'Chief Executive Officer (CEO)';
  const currentDirector = generalSettings.directorName || 'Dr. Neha Kulkarni';
  const currentDirectorTitle = generalSettings.directorTitle || 'Director – Certification';

  const certificateRecord = {
    id: `cert_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    certificateNo,
    candidateUid,
    candidateId,
    candidateName,
    candidateEmail,
    certificationId,
    certificationName,
    certificationCode: certificationCode || `AICQB-${cleanDomain}-CP`,
    credentialLevel,
    grade: calculatedGrade,
    score: effectiveScore,
    issueDate: issueDate.toISOString(),
    issueDateFormatted: issueDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    validUntil: validUntil.toISOString(),
    validUntilFormatted: validUntil.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    status: 'Issued',
    verificationUrl,
    qrCodeDataUrl,
    issuer: {
      director: currentDirector,
      directorTitle: currentDirectorTitle,
      ceo: currentCeo,
      ceoTitle: currentCeoTitle,
      organization: 'AI International Certification & Qualification Board (AICQB)',
    },
    disclaimer: 'Issued by AICQB under its independent certification scheme. This is a private professional certification and is not a government qualification or licence.',
  };

  db.addDoc('certificates', certificateRecord);

  // Also log into certificateVerification collection
  db.addDoc('certificateVerification', {
    certificateNo,
    candidateName,
    certificationName,
    verifiedCount: 0,
    createdAt: new Date().toISOString(),
  });

  return certificateRecord;
}

export async function ensureCandidateCertificates({ uid, email, candidateId, fullName }) {
  const cleanEmail = email ? email.toLowerCase().trim() : '';
  const cleanFullName = fullName ? fullName.toLowerCase().trim() : '';

  // 1. Current certificates
  let certificates = db.find('certificates', c =>
    (uid && c.candidateUid === uid) ||
    (candidateId && (c.candidateId === candidateId || c.candidate_id === candidateId)) ||
    (cleanEmail && c.candidateEmail && c.candidateEmail.toLowerCase() === cleanEmail) ||
    (cleanFullName && c.candidateName && c.candidateName.toLowerCase() === cleanFullName)
  );

  // 2. Passed results
  const passedResults = db.find('results', r =>
    ((uid && r.candidateUid === uid) ||
     (candidateId && (r.candidateId === candidateId || r.candidate_id === candidateId)) ||
     (cleanEmail && r.candidateEmail && r.candidateEmail.toLowerCase() === cleanEmail) ||
     (cleanFullName && r.candidateName && r.candidateName.toLowerCase() === cleanFullName)) &&
    (r.passed === true || (r.percentage !== undefined && r.percentage >= 70) || (r.score !== undefined && r.score >= 70))
  );

  // 3. Completed / passed schedules
  const completedSchedules = db.find('examSchedules', s =>
    ((uid && s.candidateUid === uid) ||
     (candidateId && (s.candidateId === candidateId || s.candidate_id === candidateId)) ||
     (cleanEmail && s.candidateEmail && s.candidateEmail.toLowerCase() === cleanEmail) ||
     (cleanFullName && s.candidateName && s.candidateName.toLowerCase() === cleanFullName)) &&
    (s.passed === true || s.status === 'completed' || (s.percentage !== undefined && s.percentage >= 70) || (s.score !== undefined && s.score >= 70))
  );

  // 4. Completed enrollments
  const completedEnrollments = db.find('enrollments', e =>
    ((uid && e.candidateUid === uid) ||
     (candidateId && (e.candidateId === candidateId || e.candidate_id === candidateId)) ||
     (cleanEmail && e.candidateEmail && e.candidateEmail.toLowerCase() === cleanEmail) ||
     (cleanFullName && e.candidateName && e.candidateName.toLowerCase() === cleanFullName)) &&
    e.status === 'completed'
  );

  const passedItems = [...passedResults, ...completedSchedules, ...completedEnrollments];

  const norm = (str) => (str || '').replace(/®/g, '').trim().toLowerCase();

  for (const item of passedItems) {
    const certId = item.certificationId || item.certification_id;
    const certCode = item.certificationCode || item.certification_code;
    const certName = item.certificationName || item.certification_name || item.name;

    const normCertCode = norm(certCode);
    const normCertName = norm(certName);

    const exists = certificates.some(c =>
      (certId && c.certificationId === certId) ||
      (certCode && norm(c.certificationCode) === normCertCode) ||
      (normCertCode && norm(c.certificationCode).includes(normCertCode)) ||
      (normCertCode && normCertCode.includes(norm(c.certificationCode))) ||
      (certName && norm(c.certificationName) === normCertName)
    );

    if (!exists && (certId || certCode)) {
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
          certificationName: certName || certCatalog?.name || 'AICQB Certification',
          certificationCode: certCode || certCatalog?.code || 'AICQB-CERT',
          credentialLevel: item.certification_level || certCatalog?.level || 'Professional Level',
          percentage: item.percentage || item.score || 85,
          score: item.score || item.percentage || 85,
        });

        certificates.push(newCert);

        // Also make sure enrollment status is 'completed'
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

