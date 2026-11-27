import db from '../config/db.js';
import { logAudit } from '../middleware/auth.js';
import { ensureCandidateCertificates } from '../services/certificateService.js';

export async function getCertifications(req, res) {
  try {
    const { domain, level, search, status } = req.query;
    let list = db.getCollection('certifications');

    // Filter by status or public access
    const isPublicOnly = req.query.publicOnly === 'true' || (req.user && req.user.role === 'Candidate');
    if (status && status !== 'All') {
      list = list.filter(c => (c.status || 'Active').toLowerCase() === status.toLowerCase());
    } else if (isPublicOnly) {
      list = list.filter(c => c.status === 'Active' || c.status === 'Published');
    }

    if (domain && domain !== 'All') {
      const d = domain.toLowerCase().trim();
      list = list.filter(c => {
        const cd = (c.domain || '').toLowerCase();
        const cs = (c.domainSlug || '').toLowerCase();
        return cd === d || cs === d || cd.includes(d) || d.includes(cd);
      });
    }

    if (level && level !== 'All') {
      list = list.filter(c => (c.level || '').toLowerCase().includes(level.toLowerCase()) || level.toLowerCase().includes((c.level || '').toLowerCase()));
    }

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        c =>
          c.name.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.domain.toLowerCase().includes(q)
      );
    }

    res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    return res.json({ success: true, count: list.length, certifications: list });
  } catch (err) {
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

    // Find candidate's enrollments (match by uid, email or candidateId)
    const enrollments = db.find('enrollments', e =>
      (uid && e.candidateUid === uid) ||
      (email && e.candidateEmail?.toLowerCase() === email) ||
      (candidateId && (e.candidateId === candidateId || e.candidate_id === candidateId))
    );

    // Ensure all passed exams/schedules have their certificates generated and synced
    const certificates = await ensureCandidateCertificates({
      uid,
      email,
      candidateId,
      fullName: req.user?.fullName,
    });

    // Find candidate's active exam schedules
    const schedules = db.find('examSchedules', s =>
      ((uid && s.candidateUid === uid) ||
      (email && s.candidateEmail?.toLowerCase() === email) ||
      (candidateId && (s.candidateId === candidateId || s.candidate_id === candidateId))) &&
      (s.status === 'scheduled' || s.status === 'in-progress')
    );

    // Auto-create exam schedule for any enrolled certification that has no schedule yet
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

    // Collect all passed results & completed schedules
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

    // Active enrollments: enrolled, in-progress, PAID, active, success
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

    // STRICT PAYMENT VERIFICATION RULE:
    // Without payment or a verified payment record, DO NOT enroll in any certification or test!
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

    // Check if already enrolled
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

      // Increment cert enrolledCount
      db.updateDoc('certifications', cert.id, {
        enrolledCount: (cert.enrolledCount || 0) + 1,
      });

      // Update candidate profile counts
      const cand = db.findOne('candidates', c => c.uid === uid || c.id === uid);
      if (cand) {
        db.updateDoc('candidates', cand.id, {
          activeCertificationsCount: (cand.activeCertificationsCount || 0) + 1,
          upcomingExamsCount: (cand.upcomingExamsCount || 0) + 1,
        });
      }
    }

    // Auto-create exam schedule if not exists
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

    logAudit(
      req,
      'CANDIDATE_ENROLLED',
      'Certifications',
      `Candidate ${candidateName} enrolled in ${cert.name} (${cert.code}) and scheduled for examination.`
    );

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

export async function createCertification(req, res) {
  try {
    const {
      name,
      code,
      domain,
      domainCode,
      level,
      description,
      learningObjectives,
      syllabus,
      eligibility,
      examPattern,
      examFee,
      currency = 'INR',
      duration,
      passingCriteria = 70,
      validityYears = 3,
      status = 'Active',
      tags = [],
    } = req.body;

    if (!name || !code || !domain) {
      return res.status(400).json({ success: false, message: 'Name, code, and domain are required.' });
    }

    const cleanCode = code.toUpperCase().trim();
    const existing = db.findOne('certifications', c => c.code === cleanCode);
    if (existing) {
      return res.status(400).json({ success: false, message: `Certification code '${cleanCode}' already exists.` });
    }

    const newCert = {
      id: `cert_${cleanCode.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
      name: name.trim(),
      code: cleanCode,
      domain: domain.trim(),
      domainCode: domainCode || cleanCode.split('-')[1] || 'TECH',
      level: level || 'Professional Level',
      description: description || '',
      learningObjectives: learningObjectives || [],
      syllabus: syllabus || [],
      eligibility: eligibility || 'Open to professionals, students, and practitioners worldwide.',
      examPattern: examPattern || 'Online proctored exam, 60 MCQ questions, 90 minutes.',
      examFee: Number(examFee) || 4500,
      currency,
      duration: duration || '90 Minutes',
      passingCriteria: Number(passingCriteria) || 70,
      validityYears: Number(validityYears) || 3,
      version: '1.0',
      status: status || 'Active',
      tags,
      enrolledCount: 0,
      createdAt: new Date().toISOString(),
    };

    db.addDoc('certifications', newCert);

    if (syllabus && Array.isArray(syllabus)) {
      db.addDoc('syllabi', {
        certificationId: newCert.id,
        certificationCode: newCert.code,
        modules: syllabus,
      });
    }

    logAudit(req, 'CREATE_CERTIFICATION', 'Certification Management', `Created program: ${newCert.name} (${newCert.code})`);

    return res.status(201).json({ success: true, message: 'Certification created successfully', certification: newCert });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to create certification' });
  }
}

export async function updateCertification(req, res) {
  try {
    const { id } = req.params;
    const cert = db.findOne('certifications', c => c.id === id || c.code === id || (c.code && id && c.code.toLowerCase() === id.toLowerCase()));
    if (!cert) {
      return res.status(404).json({ success: false, message: 'Certification not found' });
    }

    const updates = { ...req.body };
    if (updates.examFee !== undefined && updates.examFee !== '') {
      updates.examFee = Number(updates.examFee);
    }
    if (updates.examFeeUSD !== undefined && updates.examFeeUSD !== '') {
      updates.examFeeUSD = Number(updates.examFeeUSD);
    } else if (updates.examFee !== undefined) {
      updates.examFeeUSD = Math.round(Number(updates.examFee) / 65) || 79;
    }
    if (updates.passingCriteria !== undefined && updates.passingCriteria !== '') {
      updates.passingCriteria = Number(updates.passingCriteria);
    }

    const updated = db.updateDoc('certifications', cert.id, updates);
    logAudit(req, 'UPDATE_CERTIFICATION', 'Certification Management', `Updated program: ${cert.code} (${cert.name})`);

    return res.json({ success: true, message: 'Certification updated successfully', certification: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update certification' });
  }
}

export async function toggleStatus(req, res) {
  try {
    const { id } = req.params;
    const cert = db.findOne('certifications', c => c.id === id || c.code === id || (c.code && id && c.code.toLowerCase() === id.toLowerCase()));
    if (!cert) {
      return res.status(404).json({ success: false, message: 'Certification not found' });
    }

    const currentStatus = cert.status || 'Active';
    const newStatus = (currentStatus.toLowerCase() === 'active' || currentStatus.toLowerCase() === 'published') ? 'Inactive' : 'Active';
    const updated = db.updateDoc('certifications', cert.id, { status: newStatus });
    logAudit(req, 'TOGGLE_STATUS', 'Certification Management', `Toggled ${cert.code} to ${newStatus}`);

    return res.json({ success: true, message: `Certification status changed to ${newStatus}`, certification: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to toggle status' });
  }
}

export async function deleteCertification(req, res) {
  try {
    const { id } = req.params;
    const cert = db.findOne('certifications', c => c.id === id || c.code === id);
    if (!cert) {
      return res.status(404).json({ success: false, message: 'Certification not found' });
    }

    db.deleteDoc('certifications', cert.id);
    // Also remove associated syllabi
    const syllabi = db.find('syllabi', s => s.certificationId === cert.id || s.certificationCode === cert.code);
    syllabi.forEach(s => db.deleteDoc('syllabi', s.id));

    logAudit(req, 'DELETE_CERTIFICATION', 'Certification Management', `Deleted certification: ${cert.code} (${cert.name})`);
    return res.json({ success: true, message: 'Certification deleted successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete certification' });
  }
}

