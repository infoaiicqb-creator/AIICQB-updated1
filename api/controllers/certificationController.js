import db from '../config/db.js';
import { logAudit } from '../middleware/auth.js';
import { ensureCandidateCertificates } from '../services/certificateService.js';

// Dedicated Audit Logger for Certification Management
export function recordCertificationAudit(req, { certificationId, certificationCode, action, previousData = null, updatedData = null }) {
  try {
    const logEntry = {
      logId: `log_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      certificationId: certificationId || '',
      certificationCode: certificationCode || '',
      action,
      previousData,
      updatedData,
      adminId: req.user?.uid || req.user?.id || 'admin',
      adminEmail: req.user?.email || 'admin@aicqb.org',
      adminName: req.user?.fullName || 'Super Admin',
      timestamp: new Date().toISOString()
    };
    db.addDoc('certification_audit_logs', logEntry);
    logAudit(req, action, 'Certification Management', `${action}: ${certificationCode || certificationId || 'Record'}`);
    return logEntry;
  } catch (e) {
    console.error('Failed to write certification audit log:', e);
  }
}

// Exchange rate helper (default 1 USD = 85 INR)
function getExchangeRate() {
  const settings = db.findOne('systemSettings', s => s.key === 'exchangeRate') || {};
  return Number(settings.usdInrRate) || 85;
}

export async function getCertifications(req, res) {
  try {
    const { domain, level, search, status, includeArchived, sortBy, sortOrder } = req.query;
    let allList = db.getCollection('certifications');

    // Calculate dynamic dashboard statistics from real Firestore/JSON records
    const nonDeleted = allList.filter(c => !c.isDeleted && c.status !== 'Archived');
    const archived = allList.filter(c => c.isDeleted === true || c.status === 'Archived');
    const activeCount = nonDeleted.filter(c => (c.status || 'Active').toLowerCase() === 'active').length;
    const inactiveCount = nonDeleted.filter(c => (c.status || '').toLowerCase() === 'inactive').length;
    const domains = db.getCollection('certification_domains');
    const levels = db.getCollection('certification_levels');

    const stats = {
      total: nonDeleted.length,
      active: activeCount,
      inactive: inactiveCount,
      archived: archived.length,
      totalDomains: domains.length,
      totalLevels: levels.length,
      usdExchangeRate: getExchangeRate()
    };

    // Filter by status / archive
    let list = [...allList];
    const isPublicOnly = req.query.publicOnly === 'true' || (req.user && req.user.role === 'Candidate');

    if (isPublicOnly) {
      list = list.filter(c => !c.isDeleted && (c.status === 'Active' || c.status === 'Published'));
    } else if (status === 'Archived') {
      list = list.filter(c => c.isDeleted === true || c.status === 'Archived');
    } else if (status && status !== 'All') {
      list = list.filter(c => !c.isDeleted && (c.status || 'Active').toLowerCase() === status.toLowerCase());
    } else if (includeArchived !== 'true') {
      list = list.filter(c => !c.isDeleted && c.status !== 'Archived');
    }

    if (domain && domain !== 'All') {
      const d = domain.toLowerCase().trim();
      list = list.filter(c => {
        const cd = (c.domain || '').toLowerCase();
        const cs = (c.domainSlug || '').toLowerCase();
        const ci = (c.domainId || '').toLowerCase();
        return cd === d || cs === d || ci === d || cd.includes(d) || d.includes(cd);
      });
    }

    if (level && level !== 'All') {
      list = list.filter(c => (c.level || '').toLowerCase().includes(level.toLowerCase()) || level.toLowerCase().includes((c.level || '').toLowerCase()));
    }

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        c =>
          (c.name && c.name.toLowerCase().includes(q)) ||
          (c.code && c.code.toLowerCase().includes(q)) ||
          (c.description && c.description.toLowerCase().includes(q)) ||
          (c.domain && c.domain.toLowerCase().includes(q)) ||
          (c.level && c.level.toLowerCase().includes(q))
      );
    }

    // Sorting
    if (sortBy) {
      const order = sortOrder === 'desc' ? -1 : 1;
      list.sort((a, b) => {
        if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '') * order;
        if (sortBy === 'code') return (a.code || '').localeCompare(b.code || '') * order;
        if (sortBy === 'fee') return ((Number(a.examFee) || 0) - (Number(b.examFee) || 0)) * order;
        if (sortBy === 'createdAt') return (new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()) * order;
        if (sortBy === 'updatedAt') return (new Date(a.updatedAt || 0).getTime() - new Date(b.updatedAt || 0).getTime()) * order;
        return 0;
      });
    }

    res.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=120');
    return res.json({
      success: true,
      count: list.length,
      certifications: list,
      stats
    });
  } catch (err) {
    console.error('getCertifications error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch certifications' });
  }
}

export async function getCertificationById(req, res) {
  try {
    const { id } = req.params;
    const cert = db.findOne('certifications', c => c.id === id || c.code.toLowerCase() === id.toLowerCase());
    if (!cert) {
      return res.status(404).json({ success: false, message: 'Certification program not found.' });
    }

    const syllabus = db.findOne('syllabi', s => s.certificationId === cert.id);
    const questionsCount = db.find('questions', q => q.certificationId === cert.id).length;

    return res.json({
      success: true,
      certification: {
        ...cert,
        syllabus: syllabus ? syllabus.modules : cert.syllabus || [],
        questionsCount,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch certification details' });
  }
}

export async function getCandidateCertificationStatus(req, res) {
  try {
    const uid = req.user?.uid;
    const email = req.user?.email?.toLowerCase();
    const candidateId = req.user?.candidateId;

    const enrollments = db.find('enrollments', e =>
      (uid && e.candidateUid === uid) ||
      (email && e.candidateEmail?.toLowerCase() === email) ||
      (candidateId && (e.candidateId === candidateId || e.candidate_id === candidateId))
    );

    const certificates = await ensureCandidateCertificates({
      uid,
      email,
      candidateId,
      fullName: req.user?.fullName,
    });

    const schedules = db.find('examSchedules', s =>
      ((uid && s.candidateUid === uid) ||
      (email && s.candidateEmail?.toLowerCase() === email) ||
      (candidateId && (s.candidateId === candidateId || s.candidate_id === candidateId))) &&
      (s.status === 'scheduled' || s.status === 'in-progress')
    );

    for (const enr of enrollments) {
      const alreadyScheduled = schedules.some(
        s => (enr.certificationId && s.certificationId === enr.certificationId) ||
             (enr.certificationCode && s.certificationCode === enr.certificationCode) ||
             (enr.certificationId && s.examId === `exam_${enr.certificationId}`)
      );

      if (!alreadyScheduled) {
        const cert = db.findOne('certifications', c => c.id === enr.certificationId || c.code === enr.certificationCode);
        const examDate = new Date();
        examDate.setDate(examDate.getDate() + 7);
        const day = String(examDate.getDate()).padStart(2, '0');
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthYear = `${monthNames[examDate.getMonth()]} ${examDate.getFullYear()}`;

        const autoSchedule = {
          id: `sch_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          scheduleId: `sch_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          candidateUid: uid || enr.candidateUid,
          candidateEmail: email || enr.candidateEmail,
          candidateId: candidateId || enr.candidateId || 'AICQB-CAND',
          candidateName: req.user?.fullName || enr.candidateName || 'Candidate',
          certificationId: enr.certificationId || cert?.id,
          certificationName: enr.certificationName || cert?.name || 'Certification Exam',
          certificationCode: enr.certificationCode || cert?.code || 'AICQB-CERT',
          examId: `exam_${enr.certificationId || cert?.id}`,
          examName: enr.certificationName || cert?.name || 'Certification Exam',
          examCode: `${enr.certificationCode || cert?.code || 'AICQB'}-EXAM`,
          scheduledDate: examDate.toISOString().split('T')[0],
          scheduledDateDay: day,
          scheduledDateMonth: monthYear,
          scheduledTime: '10:00 AM – 11:30 AM (IST)',
          mode: 'Online Proctored',
          durationMinutes: cert?.duration ? parseInt(cert.duration) : 90,
          status: 'scheduled',
          enrollmentId: enr.id,
          instructions: [
            'Ensure a stable high-speed internet connection.',
            'Keep your camera and microphone enabled for AI proctoring.',
            'No external tabs or notes permitted during the examination.',
            'Exam will auto-submit when the countdown timer reaches 00:00.',
          ],
          createdAt: new Date().toISOString(),
        };

        db.addDoc('examSchedules', autoSchedule);
        schedules.push(autoSchedule);
      }
    }

    const passedResults = db.find('results', r =>
      ((uid && r.candidateUid === uid) ||
       (candidateId && (r.candidateId === candidateId || r.candidate_id === candidateId)) ||
       (email && r.candidateEmail && r.candidateEmail.toLowerCase() === email)) &&
      r.passed
    );
    const passedSchedules = db.find('examSchedules', s =>
      ((uid && s.candidateUid === uid) ||
       (candidateId && (s.candidateId === candidateId || s.candidate_id === candidateId)) ||
       (email && s.candidateEmail && s.candidateEmail.toLowerCase() === email)) &&
      (s.passed || (s.status === 'completed' && s.certificateNo))
    );

    const completedCertIds = Array.from(new Set([
      ...certificates.map(c => c.certificationId),
      ...certificates.map(c => c.certificationCode),
      ...enrollments.filter(e => e.status === 'completed').map(e => e.certificationId),
      ...enrollments.filter(e => e.status === 'completed').map(e => e.certificationCode),
      ...passedResults.map(r => r.certificationId),
      ...passedResults.map(r => r.certificationCode),
      ...passedSchedules.map(s => s.certificationId),
      ...passedSchedules.map(s => s.certificationCode),
    ])).filter(Boolean);

    const activeEnrollments = enrollments.filter(
      e => !e.status || ['enrolled', 'in-progress', 'PAID', 'paid', 'active', 'success'].includes(e.status)
    );

    const enrolledCertIds = Array.from(new Set([
      ...activeEnrollments.map(e => e.certificationId),
      ...activeEnrollments.map(e => e.certificationCode),
      ...schedules.map(s => s.certificationId),
      ...schedules.map(s => s.certificationCode),
    ])).filter(id => Boolean(id) && !completedCertIds.includes(id));

    return res.json({
      success: true,
      enrolledCertIds,
      completedCertIds,
      enrollmentsCount: enrolledCertIds.length,
      completedCount: completedCertIds.length,
      enrollments,
      certificates,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch candidate certification status' });
  }
}

export async function enrollCertification(req, res) {
  try {
    const { certificationId, paymentId } = req.body;
    const uid = req.user?.uid;
    const email = req.user?.email;
    const candidateId = req.user?.candidateId;
    const candidateName = req.user?.fullName || 'Candidate';

    if (!uid && !email && !candidateId) {
      return res.status(401).json({ success: false, message: 'Authentication required to enroll in certifications.' });
    }

    const cert = db.findOne('certifications', c => c.id === certificationId || c.code === certificationId);
    if (!cert) {
      return res.status(404).json({ success: false, message: 'Certification not found' });
    }

    const verifiedPayment = db.findOne('payments', p =>
      ((uid && p.candidateUid === uid) ||
       (email && p.candidateEmail && p.candidateEmail.toLowerCase() === email.toLowerCase()) ||
       (candidateId && (p.candidateId === candidateId || p.candidate_id === candidateId))) &&
      (p.certificationId === cert.id || p.certificationCode === cert.code) &&
      (p.payment_status === 'successful' || p.paymentStatus === 'success' || (paymentId && (p.paymentId === paymentId || p.id === paymentId)))
    );

    if (!verifiedPayment && (cert.examFee > 0 || cert.examFeeUSD > 0)) {
      return res.status(402).json({
        success: false,
        paymentRequired: true,
        message: 'Payment Required: You must complete the certification exam fee payment via Razorpay before enrolling or scheduling any test.',
        certificationId: cert.id,
        certificationName: cert.name,
        examFee: cert.examFee,
      });
    }

    let enrollment = db.findOne(
      'enrollments',
      e =>
        ((uid && e.candidateUid === uid) || (email && e.candidateEmail?.toLowerCase() === email.toLowerCase()) || (candidateId && (e.candidateId === candidateId || e.candidate_id === candidateId))) &&
        (e.certificationId === cert.id || e.certificationCode === cert.code)
    );

    const paidAt = new Date().toISOString();

    if (!enrollment) {
      const enrollmentId = `ENR-AICQB-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
      enrollment = {
        id: enrollmentId,
        enrollment_id: enrollmentId,
        enrollmentId,
        candidate_id: candidateId,
        candidateId,
        candidateUid: uid,
        candidate_name: candidateName,
        candidateName,
        candidate_email: email,
        candidateEmail: email,
        candidate_phone: req.user?.phoneNumber || req.user?.mobileNumber || '',
        country: 'India',
        certification_id: cert.id,
        certificationId: cert.id,
        certification_name: cert.name,
        certificationName: cert.name,
        certification_level: cert.level || 'Professional Level',
        certificationLevel: cert.level || 'Professional Level',
        certificationCode: cert.code,
        domain: cert.domain || 'Technology',
        enrollmentDate: paidAt,
        enrolled_at: paidAt,
        status: 'PAID',
        progressPercentage: 0,
        payment_id: verifiedPayment?.paymentId || verifiedPayment?.id || `enroll_${Date.now()}`,
        paymentId: verifiedPayment?.paymentId || verifiedPayment?.id || `enroll_${Date.now()}`,
        amount: verifiedPayment?.amount || cert.examFee || 0,
        currency: verifiedPayment?.currency || cert.currency || 'INR',
        created_at: paidAt,
        createdAt: paidAt,
      };
      db.addDoc('enrollments', enrollment);

      db.updateDoc('certifications', cert.id, {
        enrolledCount: (cert.enrolledCount || 0) + 1,
      });

      const cand = db.findOne('candidates', c => c.uid === uid || c.id === uid);
      if (cand) {
        db.updateDoc('candidates', cand.id, {
          activeCertificationsCount: (cand.activeCertificationsCount || 0) + 1,
          upcomingExamsCount: (cand.upcomingExamsCount || 0) + 1,
        });
      }
    }

    let schedule = db.findOne(
      'examSchedules',
      s =>
        ((uid && s.candidateUid === uid) || (email && s.candidateEmail?.toLowerCase() === email.toLowerCase()) || (candidateId && (s.candidateId === candidateId || s.candidate_id === candidateId))) &&
        (s.certificationId === cert.id || s.certificationCode === cert.code) &&
        s.status === 'scheduled'
    );

    if (!schedule) {
      const scheduleId = `SCH-AICQB-${Date.now().toString().slice(-6)}`;
      const examDate = new Date();
      examDate.setDate(examDate.getDate() + 7);
      const day = String(examDate.getDate()).padStart(2, '0');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthYear = `${monthNames[examDate.getMonth()]} ${examDate.getFullYear()}`;

      schedule = {
        id: scheduleId,
        schedule_id: scheduleId,
        scheduleId,
        candidate_id: candidateId,
        candidateId,
        candidateUid: uid,
        candidate_name: candidateName,
        candidateName,
        candidate_email: email,
        candidateEmail: email,
        certification_id: cert.id,
        certificationId: cert.id,
        certification_name: cert.name,
        certificationName: cert.name,
        certification_level: cert.level || 'Professional Level',
        certificationCode: cert.code,
        examId: `exam_${cert.id}`,
        examName: cert.name,
        examCode: `${cert.code}-EXAM`,
        scheduledDate: examDate.toISOString().split('T')[0],
        scheduledDateDay: day,
        scheduledDateMonth: monthYear,
        scheduledTime: '10:00 AM – 11:30 AM (IST)',
        mode: 'Online Proctored',
        durationMinutes: cert.duration ? parseInt(cert.duration) : 90,
        status: 'scheduled',
        enrollment_id: enrollment.id,
        enrollmentId: enrollment.id,
        instructions: [
          'Ensure a stable high-speed internet connection.',
          'Keep your camera and microphone enabled for AI proctoring.',
          'No external tabs or notes permitted during the examination.',
          'Exam will auto-submit when the countdown timer reaches 00:00.',
        ],
        createdAt: paidAt,
        created_at: paidAt,
      };
      db.addDoc('examSchedules', schedule);
    }

    recordCertificationAudit(req, {
      certificationId: cert.id,
      certificationCode: cert.code,
      action: 'Candidate Enrolled',
      updatedData: { enrollmentId: enrollment.id, candidateName, examFee: cert.examFee }
    });

    return res.status(200).json({
      success: true,
      message: 'Enrolled successfully! Examination has been added to My Exams.',
      enrollment,
      schedule,
    });
  } catch (err) {
    console.error('Enroll certification error:', err);
    return res.status(500).json({ success: false, message: 'Failed to enroll in certification' });
  }
}

// 6. AUTOMATIC UNIQUE CERTIFICATION CODE GENERATION
export async function generateCertificationCode(req, res) {
  try {
    const { domain, domainPrefix } = req.query;
    let prefix = (domainPrefix || '').toUpperCase().trim();

    if (!prefix && domain) {
      const domains = db.getCollection('certification_domains');
      const foundDomain = domains.find(d =>
        (d.name && d.name.toLowerCase() === domain.toLowerCase()) ||
        (d.slug && d.slug.toLowerCase() === domain.toLowerCase()) ||
        (d.domainId && d.domainId.toLowerCase() === domain.toLowerCase())
      );
      if (foundDomain && foundDomain.codePrefix) {
        prefix = foundDomain.codePrefix.toUpperCase();
      } else {
        // Fallback mapping
        const dLower = domain.toLowerCase();
        if (dLower.includes('ai') || dLower.includes('machine')) prefix = 'AI';
        else if (dLower.includes('test') || dLower.includes('quality') || dLower.includes('playwright')) prefix = 'ST';
        else if (dLower.includes('data')) prefix = 'DS';
        else if (dLower.includes('cyber') || dLower.includes('security')) prefix = 'CY';
        else if (dLower.includes('cloud')) prefix = 'CL';
        else if (dLower.includes('devops')) prefix = 'DO';
        else if (dLower.includes('web')) prefix = 'WD';
        else prefix = 'CP';
      }
    }

    if (!prefix) prefix = 'AI';

    const allCerts = db.getCollection('certifications');
    // Search existing codes to find highest sequence
    const pattern = new RegExp(`^AIICQB-${prefix}-(?:CP-)?(\\d+)`, 'i');
    let maxSeq = 0;
    allCerts.forEach(c => {
      if (c.code) {
        const match = c.code.match(pattern);
        if (match && match[1]) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > maxSeq) {
            maxSeq = num;
          }
        }
      }
    });

    // Also check total certs in this domain to prevent collisions
    const sameDomainCount = allCerts.filter(c => (c.domain || '').toLowerCase().includes(domain?.toLowerCase() || '')).length;
    const nextSeq = Math.max(maxSeq + 1, sameDomainCount + 1);
    const paddedSeq = String(nextSeq).padStart(3, '0');
    const generatedCode = `AIICQB-${prefix}-CP-${paddedSeq}`;

    return res.json({
      success: true,
      code: generatedCode,
      prefix,
      sequence: nextSeq
    });
  } catch (err) {
    console.error('generateCertificationCode error:', err);
    return res.status(500).json({ success: false, message: 'Failed to generate certification code' });
  }
}

// 2. CREATE CERTIFICATION PROGRAM
export async function createCertification(req, res) {
  try {
    const {
      name,
      code,
      domain,
      domainId,
      domainCode,
      level,
      levelId,
      description,
      learningObjectives,
      syllabus,
      eligibility,
      examPattern,
      examFee,
      examFeeUSD,
      exchangeRate: customRate,
      currency = 'INR',
      duration,
      durationUnit = 'Minutes',
      passingCriteria = 70,
      validityYears = 3,
      status = 'Active',
      tags = [],
    } = req.body;

    if (!name || !domain) {
      return res.status(400).json({ success: false, message: 'Certification Name and Domain are required.' });
    }

    const exchangeRate = Number(customRate) || getExchangeRate();
    const inrFee = Number(examFee) >= 0 ? Number(examFee) : 4500;
    const calculatedUSD = examFeeUSD !== undefined && examFeeUSD !== ''
      ? Number(examFeeUSD)
      : Math.round((inrFee / exchangeRate) * 100) / 100;

    let cleanCode = (code || '').toUpperCase().trim();
    const allCerts = db.getCollection('certifications');

    if (!cleanCode) {
      // Auto-generate code
      const prefix = domainCode || cleanCode.split('-')[1] || 'AI';
      const count = allCerts.filter(c => c.domain === domain).length + 1;
      cleanCode = `AIICQB-${prefix}-CP-${String(count).padStart(3, '0')}`;
    }

    const existing = allCerts.find(c => c.code && c.code.toUpperCase() === cleanCode);
    if (existing) {
      return res.status(400).json({ success: false, message: `Certification code '${cleanCode}' already exists.` });
    }

    const newCert = {
      id: `cert_${cleanCode.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
      certificationId: `cert_${cleanCode.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
      certificationCode: cleanCode,
      name: name.trim(),
      certificationName: name.trim(),
      code: cleanCode,
      domain: domain.trim(),
      domainId: domainId || '',
      domainCode: domainCode || cleanCode.split('-')[1] || 'TECH',
      level: level || 'Professional Level',
      levelId: levelId || '',
      description: description ? description.trim() : '',
      learningObjectives: learningObjectives || [],
      syllabus: syllabus || [],
      eligibility: eligibility ? eligibility.trim() : 'Open to professionals, students, and practitioners worldwide.',
      eligibilityCriteria: eligibility ? eligibility.trim() : 'Open to professionals, students, and practitioners worldwide.',
      examPattern: examPattern ? examPattern.trim() : 'Online proctored exam, 60 MCQ questions, 90 minutes.',
      examFee: inrFee,
      examFeeINR: inrFee,
      examFeeUSD: calculatedUSD,
      exchangeRate,
      exchangeRateSnapshot: exchangeRate,
      currency,
      duration: duration || '90 Minutes',
      examDuration: duration ? parseInt(duration, 10) || 90 : 90,
      durationUnit: durationUnit || 'Minutes',
      passingCriteria: Number(passingCriteria) || 70,
      passingThreshold: Number(passingCriteria) || 70,
      validityYears: Number(validityYears) || 3,
      version: '2026.1',
      status: status || 'Active',
      isDeleted: false,
      tags,
      enrolledCount: 0,
      createdBy: req.user?.email || 'admin@aicqb.org',
      updatedBy: req.user?.email || 'admin@aicqb.org',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.addDoc('certifications', newCert);

    if (syllabus && Array.isArray(syllabus)) {
      db.addDoc('syllabi', {
        certificationId: newCert.id,
        certificationCode: newCert.code,
        modules: syllabus,
      });
    }

    recordCertificationAudit(req, {
      certificationId: newCert.id,
      certificationCode: newCert.code,
      action: 'Certification Created',
      updatedData: newCert
    });

    return res.status(201).json({
      success: true,
      message: `Certification program "${newCert.name}" (${newCert.code}) created successfully.`,
      certification: newCert
    });
  } catch (err) {
    console.error('createCertification error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create certification' });
  }
}

// 5. UPDATE CERTIFICATION PROGRAM
export async function updateCertification(req, res) {
  try {
    const { id } = req.params;
    const cert = db.findOne('certifications', c => c.id === id || c.code === id || (c.code && id && c.code.toLowerCase() === id.toLowerCase()));
    if (!cert) {
      return res.status(404).json({ success: false, message: 'Certification not found' });
    }

    const previousData = { ...cert };
    const updates = { ...req.body };

    const exchangeRate = Number(updates.exchangeRate) || cert.exchangeRate || getExchangeRate();
    updates.exchangeRate = exchangeRate;

    if (updates.examFee !== undefined && updates.examFee !== '') {
      updates.examFee = Number(updates.examFee);
      updates.examFeeINR = updates.examFee;
    }
    if (updates.examFeeUSD !== undefined && updates.examFeeUSD !== '') {
      updates.examFeeUSD = Number(updates.examFeeUSD);
    } else if (updates.examFee !== undefined) {
      updates.examFeeUSD = Math.round((Number(updates.examFee) / exchangeRate) * 100) / 100;
    }

    if (updates.passingCriteria !== undefined && updates.passingCriteria !== '') {
      updates.passingCriteria = Number(updates.passingCriteria);
      updates.passingThreshold = updates.passingCriteria;
    }
    if (updates.duration) {
      updates.examDuration = parseInt(updates.duration, 10) || 90;
    }
    if (updates.name) {
      updates.certificationName = updates.name.trim();
    }
    if (updates.eligibility) {
      updates.eligibilityCriteria = updates.eligibility;
    }

    updates.updatedBy = req.user?.email || 'admin@aicqb.org';
    updates.updatedAt = new Date().toISOString();

    const updated = db.updateDoc('certifications', cert.id, updates);

    recordCertificationAudit(req, {
      certificationId: cert.id,
      certificationCode: cert.code,
      action: 'Certification Updated',
      previousData,
      updatedData: updated
    });

    return res.json({
      success: true,
      message: `Certification "${cert.code}" updated successfully.`,
      certification: updated
    });
  } catch (err) {
    console.error('updateCertification error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update certification' });
  }
}

// TOGGLE STATUS
export async function toggleStatus(req, res) {
  try {
    const { id } = req.params;
    const cert = db.findOne('certifications', c => c.id === id || c.code === id || (c.code && id && c.code.toLowerCase() === id.toLowerCase()));
    if (!cert) {
      return res.status(404).json({ success: false, message: 'Certification not found' });
    }

    const currentStatus = cert.status || 'Active';
    const newStatus = (currentStatus.toLowerCase() === 'active' || currentStatus.toLowerCase() === 'published') ? 'Inactive' : 'Active';
    const updated = db.updateDoc('certifications', cert.id, {
      status: newStatus,
      updatedBy: req.user?.email || 'admin@aicqb.org',
      updatedAt: new Date().toISOString()
    });

    recordCertificationAudit(req, {
      certificationId: cert.id,
      certificationCode: cert.code,
      action: newStatus === 'Active' ? 'Certification Activated' : 'Certification Deactivated',
      previousData: { status: currentStatus },
      updatedData: { status: newStatus }
    });

    return res.json({
      success: true,
      message: `Certification ${cert.code} status changed to ${newStatus}`,
      certification: updated
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to toggle status' });
  }
}

// 5. ARCHIVE CERTIFICATION (SOFT DELETE)
export async function archiveCertification(req, res) {
  try {
    const { id } = req.params;
    const cert = db.findOne('certifications', c => c.id === id || c.code === id);
    if (!cert) {
      return res.status(404).json({ success: false, message: 'Certification not found' });
    }

    const updated = db.updateDoc('certifications', cert.id, {
      isDeleted: true,
      status: 'Archived',
      deletedAt: new Date().toISOString(),
      deletedBy: req.user?.email || 'admin@aicqb.org',
      updatedAt: new Date().toISOString()
    });

    recordCertificationAudit(req, {
      certificationId: cert.id,
      certificationCode: cert.code,
      action: 'Certification Archived',
      previousData: { isDeleted: false, status: cert.status },
      updatedData: { isDeleted: true, status: 'Archived' }
    });

    return res.json({
      success: true,
      message: `Certification "${cert.code}" has been archived successfully.`,
      certification: updated
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to archive certification' });
  }
}

// 5. RESTORE ARCHIVED CERTIFICATION
export async function restoreCertification(req, res) {
  try {
    const { id } = req.params;
    const cert = db.findOne('certifications', c => c.id === id || c.code === id);
    if (!cert) {
      return res.status(404).json({ success: false, message: 'Certification not found' });
    }

    const updated = db.updateDoc('certifications', cert.id, {
      isDeleted: false,
      status: 'Active',
      restoredAt: new Date().toISOString(),
      restoredBy: req.user?.email || 'admin@aicqb.org',
      updatedAt: new Date().toISOString()
    });

    recordCertificationAudit(req, {
      certificationId: cert.id,
      certificationCode: cert.code,
      action: 'Certification Restored',
      previousData: { isDeleted: true, status: 'Archived' },
      updatedData: { isDeleted: false, status: 'Active' }
    });

    return res.json({
      success: true,
      message: `Certification "${cert.code}" has been restored to Active status.`,
      certification: updated
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to restore certification' });
  }
}

// HARD DELETE CERTIFICATION (Safe check for historical records)
export async function deleteCertification(req, res) {
  try {
    const { id } = req.params;
    const cert = db.findOne('certifications', c => c.id === id || c.code === id);
    if (!cert) {
      return res.status(404).json({ success: false, message: 'Certification not found' });
    }

    // Constraint check: do not permanently delete if candidates are enrolled or have exam records
    const enrollmentsCount = db.find('enrollments', e => e.certificationId === cert.id || e.certificationCode === cert.code).length;
    const schedulesCount = db.find('examSchedules', s => s.certificationId === cert.id || s.certificationCode === cert.code).length;
    const certificatesCount = db.find('certificates', c => c.certificationId === cert.id || c.certificationCode === cert.code).length;

    if (enrollmentsCount > 0 || schedulesCount > 0 || certificatesCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot permanently delete "${cert.code}". It is linked to ${enrollmentsCount} candidate enrollment(s), ${schedulesCount} exam schedule(s), and ${certificatesCount} certificate(s). Please use "Archive" instead to preserve historical audit records.`,
      });
    }

    db.deleteDoc('certifications', cert.id);
    const syllabi = db.find('syllabi', s => s.certificationId === cert.id || s.certificationCode === cert.code);
    syllabi.forEach(s => db.deleteDoc('syllabi', s.id));

    recordCertificationAudit(req, {
      certificationId: cert.id,
      certificationCode: cert.code,
      action: 'Certification Deleted',
      previousData: cert
    });

    return res.json({ success: true, message: `Certification "${cert.code}" deleted permanently.` });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete certification' });
  }
}

// ==========================================
// 3. DYNAMIC CERTIFICATION DOMAIN MANAGEMENT
// ==========================================

export async function getDomains(req, res) {
  try {
    const { search, status } = req.query;
    let domains = db.getCollection('certification_domains');

    if (status && status !== 'All') {
      domains = domains.filter(d => (d.status || 'Active').toLowerCase() === status.toLowerCase());
    }
    if (search) {
      const q = search.toLowerCase();
      domains = domains.filter(d =>
        (d.name && d.name.toLowerCase().includes(q)) ||
        (d.codePrefix && d.codePrefix.toLowerCase().includes(q)) ||
        (d.description && d.description.toLowerCase().includes(q))
      );
    }

    return res.json({ success: true, count: domains.length, domains });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch domains' });
  }
}

export async function createDomain(req, res) {
  try {
    const { name, codePrefix, description, status = 'Active' } = req.body;
    if (!name || !codePrefix) {
      return res.status(400).json({ success: false, message: 'Domain name and Code Prefix are required.' });
    }

    const cleanPrefix = codePrefix.toUpperCase().trim();
    const cleanName = name.trim();
    const domains = db.getCollection('certification_domains');

    const existing = domains.find(d =>
      d.name.toLowerCase() === cleanName.toLowerCase() ||
      (d.codePrefix && d.codePrefix.toUpperCase() === cleanPrefix)
    );
    if (existing) {
      return res.status(400).json({ success: false, message: `Domain "${cleanName}" or prefix "${cleanPrefix}" already exists.` });
    }

    const domainId = `dom_${cleanPrefix.toLowerCase()}_${Date.now().toString().slice(-4)}`;
    const newDomain = {
      id: domainId,
      domainId,
      name: cleanName,
      codePrefix: cleanPrefix,
      slug: cleanName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      description: description ? description.trim() : '',
      status: status || 'Active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.addDoc('certification_domains', newDomain);

    recordCertificationAudit(req, {
      certificationId: domainId,
      certificationCode: cleanPrefix,
      action: 'Domain Created',
      updatedData: newDomain
    });

    return res.status(201).json({ success: true, message: `Domain "${cleanName}" created successfully.`, domain: newDomain });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to create domain' });
  }
}

export async function updateDomain(req, res) {
  try {
    const { id } = req.params;
    const domain = db.findOne('certification_domains', d => d.id === id || d.domainId === id);
    if (!domain) {
      return res.status(404).json({ success: false, message: 'Domain not found' });
    }

    const updates = { ...req.body };
    if (updates.codePrefix) updates.codePrefix = updates.codePrefix.toUpperCase().trim();
    if (updates.name) updates.name = updates.name.trim();
    updates.updatedAt = new Date().toISOString();

    const updated = db.updateDoc('certification_domains', domain.id, updates);

    recordCertificationAudit(req, {
      certificationId: domain.id,
      certificationCode: domain.codePrefix,
      action: 'Domain Updated',
      previousData: domain,
      updatedData: updated
    });

    return res.json({ success: true, message: 'Domain updated successfully', domain: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update domain' });
  }
}

export async function toggleDomainStatus(req, res) {
  try {
    const { id } = req.params;
    const domain = db.findOne('certification_domains', d => d.id === id || d.domainId === id);
    if (!domain) {
      return res.status(404).json({ success: false, message: 'Domain not found' });
    }

    const currentStatus = domain.status || 'Active';
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    const updated = db.updateDoc('certification_domains', domain.id, {
      status: newStatus,
      updatedAt: new Date().toISOString()
    });

    recordCertificationAudit(req, {
      certificationId: domain.id,
      certificationCode: domain.codePrefix,
      action: newStatus === 'Active' ? 'Domain Activated' : 'Domain Deactivated',
      previousData: { status: currentStatus },
      updatedData: { status: newStatus }
    });

    return res.json({ success: true, message: `Domain status changed to ${newStatus}`, domain: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to toggle domain status' });
  }
}

export async function deleteDomain(req, res) {
  try {
    const { id } = req.params;
    const domain = db.findOne('certification_domains', d => d.id === id || d.domainId === id);
    if (!domain) {
      return res.status(404).json({ success: false, message: 'Domain not found' });
    }

    // Check if any certification is using this domain
    const allCerts = db.getCollection('certifications');
    const linkedCerts = allCerts.filter(c =>
      (c.domain && c.domain.toLowerCase() === domain.name.toLowerCase()) ||
      (c.domainId && c.domainId === domain.id)
    );

    if (linkedCerts.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete domain "${domain.name}" because ${linkedCerts.length} active certification(s) are assigned to it.`
      });
    }

    db.deleteDoc('certification_domains', domain.id);

    recordCertificationAudit(req, {
      certificationId: domain.id,
      certificationCode: domain.codePrefix,
      action: 'Domain Deleted',
      previousData: domain
    });

    return res.json({ success: true, message: `Domain "${domain.name}" deleted successfully.` });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete domain' });
  }
}

// ==========================================
// 4. DYNAMIC CERTIFICATION LEVEL MANAGEMENT
// ==========================================

export async function getLevels(req, res) {
  try {
    const { status } = req.query;
    let levels = db.getCollection('certification_levels');
    if (status && status !== 'All') {
      levels = levels.filter(l => (l.status || 'Active').toLowerCase() === status.toLowerCase());
    }
    return res.json({ success: true, count: levels.length, levels });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch certification levels' });
  }
}

export async function createLevel(req, res) {
  try {
    const { name, levelCode, description, defaultExamFeeINR = 4500, status = 'Active' } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Level name is required.' });
    }

    const levels = db.getCollection('certification_levels');
    const cleanName = name.trim();
    const existing = levels.find(l => l.name.toLowerCase() === cleanName.toLowerCase());
    if (existing) {
      return res.status(400).json({ success: false, message: `Level "${cleanName}" already exists.` });
    }

    const levelId = `lvl_${Date.now().toString().slice(-6)}`;
    const newLevel = {
      id: levelId,
      levelId,
      name: cleanName,
      levelCode: (levelCode || cleanName.slice(0, 3)).toUpperCase().trim(),
      description: description ? description.trim() : '',
      defaultExamFeeINR: Number(defaultExamFeeINR) || 4500,
      status: status || 'Active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.addDoc('certification_levels', newLevel);

    recordCertificationAudit(req, {
      certificationId: levelId,
      certificationCode: newLevel.levelCode,
      action: 'Level Created',
      updatedData: newLevel
    });

    return res.status(201).json({ success: true, message: `Level "${cleanName}" created successfully.`, level: newLevel });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to create level' });
  }
}

export async function updateLevel(req, res) {
  try {
    const { id } = req.params;
    const level = db.findOne('certification_levels', l => l.id === id || l.levelId === id);
    if (!level) {
      return res.status(404).json({ success: false, message: 'Level not found' });
    }

    const updates = { ...req.body };
    if (updates.name) updates.name = updates.name.trim();
    if (updates.defaultExamFeeINR !== undefined) updates.defaultExamFeeINR = Number(updates.defaultExamFeeINR);
    updates.updatedAt = new Date().toISOString();

    const updated = db.updateDoc('certification_levels', level.id, updates);

    recordCertificationAudit(req, {
      certificationId: level.id,
      certificationCode: level.levelCode || level.name,
      action: 'Level Updated',
      previousData: level,
      updatedData: updated
    });

    return res.json({ success: true, message: 'Level updated successfully', level: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update level' });
  }
}

export async function toggleLevelStatus(req, res) {
  try {
    const { id } = req.params;
    const level = db.findOne('certification_levels', l => l.id === id || l.levelId === id);
    if (!level) {
      return res.status(404).json({ success: false, message: 'Level not found' });
    }

    const currentStatus = level.status || 'Active';
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    const updated = db.updateDoc('certification_levels', level.id, {
      status: newStatus,
      updatedAt: new Date().toISOString()
    });

    recordCertificationAudit(req, {
      certificationId: level.id,
      certificationCode: level.name,
      action: newStatus === 'Active' ? 'Level Activated' : 'Level Deactivated',
      previousData: { status: currentStatus },
      updatedData: { status: newStatus }
    });

    return res.json({ success: true, message: `Level status changed to ${newStatus}`, level: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to toggle level status' });
  }
}

export async function deleteLevel(req, res) {
  try {
    const { id } = req.params;
    const level = db.findOne('certification_levels', l => l.id === id || l.levelId === id);
    if (!level) {
      return res.status(404).json({ success: false, message: 'Level not found' });
    }

    const allCerts = db.getCollection('certifications');
    const linkedCerts = allCerts.filter(c =>
      (c.level && c.level.toLowerCase().includes(level.name.toLowerCase())) ||
      (c.levelId && c.levelId === level.id)
    );

    if (linkedCerts.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete level "${level.name}" because ${linkedCerts.length} certification(s) are configured with it.`
      });
    }

    db.deleteDoc('certification_levels', level.id);

    recordCertificationAudit(req, {
      certificationId: level.id,
      certificationCode: level.name,
      action: 'Level Deleted',
      previousData: level
    });

    return res.json({ success: true, message: `Level "${level.name}" deleted successfully.` });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete level' });
  }
}

// ==========================================
// 10. ADMIN AUDIT LOGS
// ==========================================

export async function getAuditLogs(req, res) {
  try {
    const logs = db.getCollection('certification_audit_logs');
    // Return latest 100 logs
    const sorted = [...logs].sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()).slice(0, 100);
    return res.json({ success: true, count: sorted.length, logs: sorted });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch certification audit logs' });
  }
}

// ==========================================
// PRICING CONFIGURATION (USD-INR EXCHANGE RATE)
// ==========================================

export async function getPricingConfig(req, res) {
  try {
    const rate = getExchangeRate();
    return res.json({
      success: true,
      exchangeRate: rate,
      currencyBase: 'INR',
      targetCurrency: 'USD',
      formula: 'USD = INR / ExchangeRate'
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch pricing config' });
  }
}

export async function updatePricingConfig(req, res) {
  try {
    const { exchangeRate } = req.body;
    const rate = Number(exchangeRate);
    if (!rate || rate <= 0) {
      return res.status(400).json({ success: false, message: 'Valid positive exchange rate required.' });
    }

    db.setDoc('systemSettings', 'exchangeRate', {
      key: 'exchangeRate',
      usdInrRate: rate,
      updatedBy: req.user?.email || 'admin@aicqb.org',
      updatedAt: new Date().toISOString()
    });

    recordCertificationAudit(req, {
      certificationId: 'CONFIG',
      certificationCode: 'USD-INR-RATE',
      action: 'Examination Fee Exchange Rate Updated',
      updatedData: { usdInrRate: rate }
    });

    return res.json({ success: true, message: `Exchange rate updated to 1 USD = ₹${rate} INR`, exchangeRate: rate });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update pricing config' });
  }
}
