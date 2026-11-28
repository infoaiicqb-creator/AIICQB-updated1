import crypto from 'crypto';
import os from 'os';
import db from '../config/db.js';
import { razorpay, verifyPaymentSignature, verifyWebhookSignature, key_id, getRazorpayInstance, getRazorpayKeyId } from '../config/razorpay.js';
import { logAudit } from '../middleware/auth.js';

export function getLocalNetworkIp() {
  try {
    const ifaces = os.networkInterfaces();
    for (const name of Object.keys(ifaces)) {
      for (const net of ifaces[name]) {
        if (net.family === 'IPv4' && !net.internal) {
          return net.address;
        }
      }
    }
  } catch (e) { }
  return 'localhost';
}

export async function createOrder(req, res) {
  try {
    const {
      certificationId,
      planType = 'Professional',
      certificationLevel,
      level,
      candidateName,
      candidateEmail,
      candidatePhone,
      country = 'India',
      currency = 'INR',
    } = req.body;

    const uid = req.user?.uid || `guest_${Date.now()}`;
    const candidateId = req.user?.candidateId || `AICQB-${Date.now().toString().slice(-7)}`;

    const cert = db.findOne('certifications', c => c.id === certificationId || c.code === certificationId);
    if (!cert) {
      return res.status(404).json({ success: false, message: 'Certification program not found.' });
    }

    const requestedLevel = (certificationLevel || level || cert.level || 'Professional Level').trim();

    // Dynamically look up level configuration from examLevels
    const allExamLevels = db.getCollection('examLevels') || [];
    const levelConfig = allExamLevels.find(l => 
      (l.certificationId === cert.id || l.certificationCode === cert.code) &&
      (l.levelName?.toLowerCase() === requestedLevel.toLowerCase() || (req.body.levelId && l.levelId === req.body.levelId))
    ) || allExamLevels.find(l => l.levelName?.toLowerCase() === requestedLevel.toLowerCase());

    // Determine actual amount server-side based on dynamic exam level & region
    const isIndia = (country && country.trim().toLowerCase() === 'india') || currency.toUpperCase() === 'INR';
    const finalCurrency = isIndia ? 'INR' : 'USD';
    let amount = isIndia ? (levelConfig?.examFee || cert.examFee || 9999) : (levelConfig?.examFeeUSD || cert.examFeeUSD || 119);

    // Subunits for Razorpay: paise for INR, cents for USD
    const amountInSubunits = Math.round(amount * 100);

    // Prevent duplicate paid enrollments
    const existingEnrollment = db.findOne(
      'enrollments',
      e => (e.candidateUid === uid || e.candidateId === candidateId || (candidateEmail && e.candidateEmail?.toLowerCase() === candidateEmail.toLowerCase())) && e.certificationId === cert.id
    );

    if (existingEnrollment && (existingEnrollment.status === 'completed' || existingEnrollment.status === 'PAID')) {
      return res.status(400).json({ success: false, message: 'You have already enrolled in or completed this certification program.' });
    }

    const receipt = `rcpt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    let razorpayOrderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    let isRazorpayLiveOrder = false;

    const activeRzp = getRazorpayInstance() || razorpay;
    const activeKeyId = getRazorpayKeyId() || key_id;

    // Try to create real Razorpay order if Razorpay SDK configured
    if (activeRzp && activeRzp.orders) {
      try {
        const orderResponse = await activeRzp.orders.create({
          amount: amountInSubunits,
          currency: finalCurrency,
          receipt,
          notes: {
            candidateUid: uid,
            candidateId,
            candidateName: candidateName || req.user?.fullName || 'Candidate',
            candidateEmail: candidateEmail || req.user?.email || 'candidate@aicqb.org',
            country: country || 'India',
            certificationId: cert.id,
            certificationName: cert.name,
            certificationLevel: requestedLevel,
          },
        });
        if (orderResponse && orderResponse.id) {
          razorpayOrderId = orderResponse.id;
          isRazorpayLiveOrder = true;
        }
      } catch (rzpErr) {
        console.warn('Live Razorpay order creation fallback:', rzpErr.message);
      }
    }

    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const invoiceId = `INV-AICQB-${new Date().getFullYear()}-${String(db.getCollection('payments').length + 1001)}`;

    const fullName = candidateName || req.user?.fullName || 'Candidate';
    const email = candidateEmail || req.user?.email || 'candidate@aicqb.org';
    const phone = candidatePhone || (req.user && (req.user.phoneNumber || req.user.mobileNumber)) || '';

    // Create payment entry in Pending status complying with Database Structure
    const paymentRecord = {
      id: paymentId,
      payment_id: paymentId,
      paymentId,
      candidate_id: candidateId,
      candidateId,
      candidateUid: uid,
      candidate_name: fullName,
      candidateName: fullName,
      candidate_email: email,
      candidateEmail: email,
      candidate_phone: phone,
      candidatePhone: phone,
      country: country || 'India',
      enrollment_id: null,
      enrollmentId: null,
      certification_id: cert.id,
      certificationId: cert.id,
      certification_name: cert.name,
      certificationName: cert.name,
      certification_level: requestedLevel,
      certificationLevel: requestedLevel,
      levelId: levelConfig?.levelId || (requestedLevel.toLowerCase().includes('foundation') ? 'lvl_fnd' : requestedLevel.toLowerCase().includes('advanced') ? 'lvl_adv' : 'lvl_prf'),
      levelName: requestedLevel,
      registrationId: null,
      certificationCode: cert.code,
      amount,
      currency: finalCurrency,
      payment_gateway: 'Razorpay',
      razorpay_order_id: razorpayOrderId,
      razorpayOrderId,
      razorpay_payment_id: null,
      razorpayPaymentId: null,
      payment_status: 'pending',
      paymentStatus: 'pending',
      paymentMethod: isIndia ? 'UPI / Cards / NetBanking' : 'International Card',
      signatureVerificationStatus: 'pending',
      invoiceId,
      created_at: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      verified_at: null,
      paidAt: null,
      refundStatus: 'none',
      refundedAmount: 0,
    };

    db.addDoc('payments', paymentRecord);

    const localIp = getLocalNetworkIp();
    const qrScanUrl = `http://${localIp}:5000/api/payment/test-qr-scan?paymentId=${paymentId}&orderId=${razorpayOrderId}`;

    return res.json({
      success: true,
      order: {
        id: razorpayOrderId,
        amount: amountInSubunits,
        currency: finalCurrency,
        receipt,
        key: activeKeyId,
        paymentId,
        certificationName: cert.name,
        certificationLevel: requestedLevel,
        certificationCode: cert.code,
        isRazorpayLiveOrder,
        candidateName: fullName,
        candidateEmail: email,
        candidatePhone: phone,
        country: country || 'India',
        qrScanUrl,
        localIp,
      },
    });
  } catch (err) {
    console.error('Create order error:', err);
    return res.status(500).json({ success: false, message: 'Failed to initiate payment order.' });
  }
}

export async function verifyPayment(req, res) {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, paymentId } = req.body;
    const uid = req.user?.uid || 'guest_user';
    const candidateId = req.user?.candidateId;

    let payment = db.findOne(
      'payments',
      p => p.paymentId === paymentId || p.payment_id === paymentId || (razorpayOrderId && (p.razorpayOrderId === razorpayOrderId || p.razorpay_order_id === razorpayOrderId))
    );

    // Prevent duplicate payment processing
    if (payment && (payment.payment_status === 'successful' || payment.paymentStatus === 'success')) {
      const existingEnrollment = db.findOne('enrollments', e => e.paymentId === payment.paymentId || e.id === payment.enrollment_id);
      return res.json({
        success: true,
        message: 'Congratulations! Your enrollment payment has been completed successfully. You can now schedule your certification examination.',
        payment,
        enrollment: existingEnrollment,
        alreadyProcessed: true,
      });
    }

    if (!payment) {
      const defaultCert = db.getCollection('certifications')[0] || { id: 'cert_1', name: 'Certified AI & ML Professional (CAIMP)', code: 'CAIMP', level: 'Professional Level', examFee: 4500 };
      const newPayId = paymentId || `pay_${Date.now()}`;
      payment = {
        id: newPayId,
        payment_id: newPayId,
        paymentId: newPayId,
        razorpay_order_id: razorpayOrderId || `order_${Date.now()}`,
        razorpayOrderId: razorpayOrderId || `order_${Date.now()}`,
        razorpay_payment_id: razorpayPaymentId,
        razorpayPaymentId,
        candidateUid: uid,
        candidate_id: candidateId || `AICQB-${Date.now().toString().slice(-7)}`,
        candidateId: candidateId || `AICQB-${Date.now().toString().slice(-7)}`,
        candidate_name: req.user?.fullName || 'Candidate',
        candidateName: req.user?.fullName || 'Candidate',
        candidate_email: req.user?.email || 'candidate@aicqb.org',
        candidateEmail: req.user?.email || 'candidate@aicqb.org',
        country: 'India',
        certification_id: defaultCert.id,
        certificationId: defaultCert.id,
        certification_name: defaultCert.name,
        certificationName: defaultCert.name,
        certification_level: defaultCert.level || 'Professional Level',
        certificationLevel: defaultCert.level || 'Professional Level',
        certificationCode: defaultCert.code,
        enrollment_id: null,
        amount: defaultCert.examFee || 4500,
        currency: 'INR',
        payment_gateway: 'Razorpay',
        payment_status: 'pending',
        paymentStatus: 'pending',
        paymentMethod: 'UPI / Cards / NetBanking',
        signatureVerificationStatus: 'verified',
        invoiceId: `INV-AICQB-${new Date().getFullYear()}-${String(db.getCollection('payments').length + 1001)}`,
        created_at: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        verified_at: null,
        paidAt: null,
        refundStatus: 'none',
        refundedAmount: 0,
      };
      db.addDoc('payments', payment);
    }

    // Cryptographic signature verification
    const isValid = verifyPaymentSignature({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });

    if (!isValid) {
      db.updateDoc('payments', payment.id, {
        payment_status: 'failed',
        paymentStatus: 'failed',
        signatureVerificationStatus: 'failed',
        razorpay_payment_id: razorpayPaymentId,
        razorpayPaymentId,
      });
      return res.status(400).json({ success: false, message: 'Payment verification failed: Invalid signature.' });
    }

    // Payment Successful
    const paidAt = new Date().toISOString();
    const cert = db.findOne('certifications', c => c.id === payment.certificationId || c.code === payment.certificationCode) || {
      id: payment.certificationId,
      name: payment.certificationName,
      level: payment.certificationLevel || 'Professional Level',
      code: payment.certificationCode || 'AICQB-CERT',
    };

    // Generate unique enrollment ID: ENR-AICQB-YYYY-XXXXXX
    const enrollmentId = `ENR-AICQB-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const effectiveCandidateId = candidateId || payment.candidate_id || payment.candidateId || `AICQB-${Date.now().toString().slice(-7)}`;
    const effectiveUid = uid || payment.candidateUid || 'guest_user';

    const targetCertLevel = payment.certificationLevel || payment.certification_level || cert.level || 'Professional Level';

    // Create enrollment record
    const enrollment = {
      id: enrollmentId,
      enrollment_id: enrollmentId,
      enrollmentId,
      candidate_id: effectiveCandidateId,
      candidateId: effectiveCandidateId,
      candidateUid: effectiveUid,
      candidate_name: payment.candidate_name || payment.candidateName,
      candidateName: payment.candidate_name || payment.candidateName,
      candidate_email: payment.candidate_email || payment.candidateEmail,
      candidateEmail: payment.candidate_email || payment.candidateEmail,
      candidate_phone: payment.candidate_phone || payment.candidatePhone || '',
      country: payment.country || 'India',
      certification_id: cert.id,
      certificationId: cert.id,
      certification_name: cert.name,
      certificationName: cert.name,
      certification_level: targetCertLevel,
      certificationLevel: targetCertLevel,
      certificationCode: cert.code,
      domain: cert.domain || 'Technology',
      enrollmentDate: paidAt,
      enrolled_at: paidAt,
      status: 'PAID',
      progressPercentage: 0,
      payment_id: payment.paymentId || payment.id,
      paymentId: payment.paymentId || payment.id,
      amount: payment.amount,
      currency: payment.currency,
      created_at: paidAt,
      createdAt: paidAt,
    };
    db.addDoc('enrollments', enrollment);

    // Increment enrolledCount
    if (cert.id && db.findOne('certifications', c => c.id === cert.id)) {
      db.updateDoc('certifications', cert.id, {
        enrolledCount: (cert.enrolledCount || 0) + 1,
      });
    }

    // Create Invoice / Receipt
    const invoiceId = payment.invoiceId || `INV-AICQB-${new Date().getFullYear()}-${String(db.getCollection('payments').length + 1001)}`;
    const invoiceRecord = {
      id: invoiceId,
      invoice_id: invoiceId,
      invoiceId,
      payment_id: payment.paymentId || payment.id,
      paymentId: payment.paymentId || payment.id,
      enrollment_id: enrollmentId,
      candidate_id: effectiveCandidateId,
      candidateUid: effectiveUid,
      candidate_name: payment.candidate_name || payment.candidateName,
      candidateName: payment.candidate_name || payment.candidateName,
      candidate_email: payment.candidate_email || payment.candidateEmail,
      candidateEmail: payment.candidate_email || payment.candidateEmail,
      country: payment.country || 'India',
      amount: payment.amount,
      currency: payment.currency,
      certification_name: cert.name,
      certification_level: targetCertLevel,
      certificationLevel: targetCertLevel,
      items: [
        {
          description: `AICQB Professional Certification: ${payment.certificationName} (${targetCertLevel})`,
          amount: payment.amount,
        },
      ],
      date: paidAt,
      created_at: paidAt,
      status: 'Paid',
    };
    db.addDoc('invoices', invoiceRecord);

    // Automatically enable & schedule examination option in examSchedules
    const scheduleId = `SCH-AICQB-${Date.now().toString().slice(-6)}`;
    const examDate = new Date();
    examDate.setDate(examDate.getDate() + 7);
    const day = String(examDate.getDate()).padStart(2, '0');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthYear = `${monthNames[examDate.getMonth()]} ${examDate.getFullYear()}`;

    // Look up exam level details from examLevels
    const allExamLevels = db.getCollection('examLevels') || [];
    const examLevelConfig = allExamLevels.find(l => 
      (l.certificationId === cert.id || l.certificationCode === cert.code) &&
      (l.levelName?.toLowerCase() === targetCertLevel.toLowerCase() || (payment.levelId && l.levelId === payment.levelId))
    ) || allExamLevels.find(l => l.levelName?.toLowerCase() === targetCertLevel.toLowerCase());

    const levelDuration = examLevelConfig?.examDuration || (cert.duration ? parseInt(cert.duration) : 90);
    const registrationId = `REG-AICQB-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    // Create persistent examRegistration record (synced to Firestore)
    const examRegistrationRecord = {
      id: registrationId,
      registrationId,
      candidateId: effectiveCandidateId,
      candidateName: payment.candidate_name || payment.candidateName,
      candidateEmail: payment.candidate_email || payment.candidateEmail,
      candidateUid: effectiveUid,
      certificationId: cert.id,
      certificationName: cert.name,
      certificationCode: cert.code,
      levelId: examLevelConfig?.levelId || payment.levelId || (targetCertLevel.toLowerCase().includes('foundation') ? 'lvl_fnd' : targetCertLevel.toLowerCase().includes('advanced') ? 'lvl_adv' : 'lvl_prf'),
      levelName: targetCertLevel,
      selectedExamLevel: targetCertLevel,
      examFee: payment.amount,
      paymentId: payment.paymentId || payment.id,
      razorpayOrderId: payment.razorpayOrderId || razorpayOrderId,
      paymentStatus: 'PAID',
      enrollmentDate: paidAt,
      examScheduleDate: examDate.toISOString().split('T')[0],
      examDate: examDate.toISOString().split('T')[0],
      examStartTime: '10:00 AM',
      examTime: '10:00 AM – 11:30 AM (IST)',
      examDuration: levelDuration,
      examinationStatus: 'scheduled',
      examStatus: 'scheduled',
      attemptNumber: 1,
      totalAllowedAttempts: examLevelConfig?.allowedAttempts || 3,
      allowedAttempts: examLevelConfig?.allowedAttempts || 3,
      createdAt: paidAt,
    };
    db.addDoc('examRegistrations', examRegistrationRecord);

    const scheduleRecord = {
      id: scheduleId,
      schedule_id: scheduleId,
      scheduleId,
      registrationId,
      candidate_id: effectiveCandidateId,
      candidateId: effectiveCandidateId,
      candidateUid: effectiveUid,
      candidate_name: payment.candidate_name || payment.candidateName,
      candidateName: payment.candidate_name || payment.candidateName,
      candidate_email: payment.candidate_email || payment.candidateEmail,
      candidateEmail: payment.candidate_email || payment.candidateEmail,
      certification_id: cert.id,
      certificationId: cert.id,
      certification_name: cert.name,
      certificationName: cert.name,
      certification_level: targetCertLevel,
      certificationLevel: targetCertLevel,
      level: targetCertLevel,
      examLevel: targetCertLevel,
      certificationCode: cert.code,
      examId: `exam_${cert.id}`,
      examName: cert.name,
      examCode: `${cert.code}-EXAM`,
      scheduledDate: examDate.toISOString().split('T')[0],
      scheduledDateDay: day,
      scheduledDateMonth: monthYear,
      scheduledDateFormatted: `${day} ${monthYear}`,
      scheduledTime: '10:00 AM – 11:30 AM (IST)',
      mode: 'Online Proctored',
      durationMinutes: levelDuration,
      status: 'scheduled',
      payment_id: payment.paymentId || payment.id,
      paymentId: payment.paymentId || payment.id,
      enrollment_id: enrollmentId,
      enrollmentId,
      instructions: [
        'Ensure a stable high-speed internet connection.',
        'Keep your camera and microphone enabled for AI proctoring.',
        'No external tabs or notes permitted during the examination.',
        'Exam will auto-submit when the countdown timer reaches 00:00.',
      ],
      createdAt: paidAt,
      created_at: paidAt,
    };
    db.addDoc('examSchedules', scheduleRecord);

    // Update candidate's upcoming exams count
    const candUser = db.findOne('candidates', c => c.uid === effectiveUid || c.candidateId === effectiveCandidateId);
    if (candUser) {
      db.updateDoc('candidates', candUser.id, {
        activeCertificationsCount: (candUser.activeCertificationsCount || 0) + 1,
        upcomingExamsCount: (candUser.upcomingExamsCount || 0) + 1,
      });
    }

    // Update payment record to successful status
    const updatedPayment = db.updateDoc('payments', payment.id, {
      registrationId,
      levelId: examRegistrationRecord.levelId,
      levelName: targetCertLevel,
      razorpay_payment_id: razorpayPaymentId,
      razorpayPaymentId,
      payment_status: 'successful',
      paymentStatus: 'success',
      signatureVerificationStatus: 'verified',
      paidAt,
      verified_at: paidAt,
      verifiedAt: paidAt,
      enrollment_id: enrollmentId,
      enrollmentId,
      schedule_id: scheduleId,
      scheduleId,
    });

    logAudit(
      req,
      'PAYMENT_VERIFIED',
      'Finance & Payments',
      `Payment of ${payment.currency} ${payment.amount} verified for ${payment.certificationName} (${razorpayPaymentId})`
    );

    return res.json({
      success: true,
      message: 'Congratulations! Your enrollment payment has been completed successfully. You can now schedule your certification examination.',
      payment: updatedPayment,
      enrollment,
      invoice: invoiceRecord,
      schedule: scheduleRecord,
      registration: examRegistrationRecord,
    });
  } catch (err) {
    console.error('Payment verification error:', err);
    return res.status(500).json({ success: false, message: 'Server error during payment verification.' });
  }
}

export async function handleWebhook(req, res) {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const bodyStr = JSON.stringify(req.body);

    const isValid = verifyWebhookSignature(bodyStr, signature);
    const event = req.body.event;
    const payload = req.body.payload;

    const eventRecord = {
      id: `wh_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      eventType: event || 'unknown',
      signatureVerified: isValid,
      payload: req.body,
      receivedAt: new Date().toISOString(),
    };
    db.addDoc('paymentWebhookEvents', eventRecord);

    if (event === 'payment.captured' && payload?.payment?.entity) {
      const orderId = payload.payment.entity.order_id;
      const paymentRecord = db.findOne('payments', p => p.razorpayOrderId === orderId);
      if (paymentRecord && paymentRecord.paymentStatus !== 'success') {
        db.updateDoc('payments', paymentRecord.id, {
          paymentStatus: 'success',
          razorpayPaymentId: payload.payment.entity.id,
          paidAt: new Date().toISOString(),
        });
      }
    }

    return res.json({ status: 'ok' });
  } catch (err) {
    console.error('Webhook processing error:', err);
    return res.status(200).json({ status: 'error_logged' });
  }
}

export async function getCandidatePayments(req, res) {
  try {
    const { candidateId } = req.params;
    // Security check: candidates can only see their own payments
    if (req.user.role === 'Candidate' && req.user.candidateId !== candidateId && req.user.uid !== candidateId) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to payment records.' });
    }

    const list = db.find(
      'payments',
      p => p.candidateId === candidateId || p.candidateUid === candidateId || p.candidateUid === req.user.uid
    );

    return res.json({ success: true, count: list.length, payments: list });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch payments' });
  }
}

export async function getPaymentById(req, res) {
  try {
    const { paymentId } = req.params;
    const payment = db.findOne('payments', p => p.paymentId === paymentId || p.id === paymentId);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    if (req.user.role === 'Candidate' && payment.candidateUid !== req.user.uid) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const invoice = db.findOne('invoices', i => i.paymentId === payment.paymentId || i.invoiceId === payment.invoiceId);

    return res.json({ success: true, payment, invoice });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch payment' });
  }
}

export async function processRefund(req, res) {
  try {
    const { paymentId, amount, reason } = req.body;
    const payment = db.findOne('payments', p => p.paymentId === paymentId || p.id === paymentId);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found.' });
    }

    if (payment.paymentStatus !== 'success') {
      return res.status(400).json({ success: false, message: 'Only successful payments can be refunded.' });
    }

    const refundAmount = amount ? Number(amount) : payment.amount;
    const refundRecord = {
      id: `ref_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      paymentId: payment.paymentId,
      amount: refundAmount,
      currency: payment.currency,
      reason: reason || 'Administrative refund approved.',
      status: 'Processed',
      processedAt: new Date().toISOString(),
      processedBy: req.user.email,
    };

    db.addDoc('refunds', refundRecord);

    db.updateDoc('payments', payment.id, {
      refundStatus: 'refunded',
      refundedAmount: refundAmount,
    });

    logAudit(req, 'REFUND_PROCESSED', 'Finance & Payments', `Refund of ${payment.currency} ${refundAmount} for ${payment.paymentId}`);

    return res.json({ success: true, message: 'Refund processed successfully.', refund: refundRecord });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to process refund.' });
  }
}

export async function getAllPaymentsAdmin(req, res) {
  try {
    const payments = db.getCollection('payments');
    const refunds = db.getCollection('refunds');

    const totalRevenue = payments
      .filter(p => p.paymentStatus === 'success')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const thisMonthRevenue = payments
      .filter(p => {
        if (p.paymentStatus !== 'success' || !p.paidAt) return false;
        const d = new Date(p.paidAt);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    return res.json({
      success: true,
      stats: {
        totalRevenue,
        thisMonthRevenue,
        totalTransactions: payments.length,
        successfulCount: payments.filter(p => p.paymentStatus === 'success').length,
        failedCount: payments.filter(p => p.paymentStatus === 'failed').length,
        pendingCount: payments.filter(p => p.paymentStatus === 'pending').length,
        refundsCount: refunds.length,
      },
      payments,
      refunds,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to load payments' });
  }
}

export async function updatePaymentAdmin(req, res) {
  try {
    const { id } = req.params;
    const payment = db.findOne('payments', p => p.id === id || p.paymentId === id);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    const updated = db.updateDoc('payments', payment.id, {
      ...req.body,
      updatedAt: new Date().toISOString(),
    });

    logAudit(req, 'UPDATE_PAYMENT', 'Finance & Payments', `Updated payment record: ${payment.paymentId}`);
    return res.json({ success: true, message: 'Payment record updated successfully', payment: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update payment' });
  }
}

export async function createPaymentAdmin(req, res) {
  try {
    const {
      candidateName,
      candidateEmail,
      country = 'India',
      certificationName = 'AICQB Certified AI Professional',
      certificationLevel = 'Professional Level',
      amount = 4500,
      currency = 'INR',
      paymentStatus = 'success',
      razorpayOrderId,
      razorpayPaymentId,
      paidAt,
    } = req.body;

    if (!candidateName || !candidateEmail) {
      return res.status(400).json({ success: false, message: 'Candidate name and email are required' });
    }

    const now = new Date().toISOString();
    const ts = Date.now();
    const newPayment = {
      id: `pay_${ts}`,
      paymentId: `pay_manual_${ts}`,
      candidateName: candidateName.trim(),
      candidateEmail: candidateEmail.toLowerCase().trim(),
      country,
      certificationName,
      certificationLevel,
      amount: Number(amount) || 0,
      currency: currency.toUpperCase(),
      paymentStatus: paymentStatus.toLowerCase(),
      status: paymentStatus === 'success' ? 'Successful' : paymentStatus === 'failed' ? 'Failed' : 'Pending',
      razorpayOrderId: razorpayOrderId || `order_man_${ts}`,
      razorpayPaymentId: razorpayPaymentId || `pay_man_${ts}`,
      paidAt: paidAt || (paymentStatus === 'success' ? now : null),
      createdAt: now,
      updatedAt: now,
    };

    db.addDoc('payments', newPayment);
    logAudit(req, 'RECORD_PAYMENT', 'Finance & Payments', `Manually recorded payment: ${newPayment.paymentId} (₹${newPayment.amount})`);

    return res.status(201).json({ success: true, message: 'Payment recorded successfully', payment: newPayment });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to create payment record' });
  }
}

export async function deletePaymentAdmin(req, res) {
  try {
    const { id } = req.params;
    const payment = db.findOne('payments', p => p.id === id || p.paymentId === id || p.razorpayOrderId === id || p.razorpayPaymentId === id);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    db.deleteDoc('payments', payment.id);
    logAudit(req, 'DELETE_PAYMENT', 'Finance & Payments', `Deleted/Voided payment: ${payment.paymentId || payment.id}`);
    return res.json({ success: true, message: 'Payment record deleted/voided successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete payment' });
  }
}

export async function handleTestQrScan(req, res) {
  try {
    const paymentId = req.query.paymentId || req.body?.paymentId;
    const orderId = req.query.orderId || req.body?.orderId;

    let payment = db.findOne('payments', p =>
      (paymentId && (p.id === paymentId || p.paymentId === paymentId)) ||
      (orderId && (p.razorpay_order_id === orderId || p.razorpayOrderId === orderId))
    );

    if (!payment) {
      const payments = db.getCollection('payments');
      payment = payments.slice().reverse().find(p => p.payment_status === 'pending');
    }

    if (!payment) {
      if (req.headers.accept?.includes('application/json') || req.method === 'POST') {
        return res.status(404).json({ success: false, message: 'Payment record not found' });
      }
      return res.status(404).send('<h3 style="font-family: sans-serif; text-align: center; padding: 40px;">Payment record not found. Please try again.</h3>');
    }

    let enrollmentId = payment.enrollment_id;
    let scheduleId = payment.schedule_id;
    let invoiceId = payment.invoiceId;

    if (payment.payment_status !== 'successful' && payment.paymentStatus !== 'success') {
      const paidAt = new Date().toISOString();
      const simulatedPaymentId = `pay_qr_test_${Date.now()}`;
      enrollmentId = `ENR-AICQB-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

      const cert = db.findOne('certifications', c => c.id === payment.certificationId || c.code === payment.certificationCode) || {
        id: payment.certificationId,
        name: payment.certificationName,
        level: payment.certificationLevel || 'Professional Level',
        code: payment.certificationCode || 'AICQB-CERT',
      };

      const effectiveCandidateId = payment.candidate_id || payment.candidateId || `AICQB-${Date.now().toString().slice(-7)}`;
      const effectiveUid = payment.candidateUid || 'guest_user';

      // 1. Create Enrollment
      const enrollment = {
        id: enrollmentId,
        enrollment_id: enrollmentId,
        enrollmentId,
        candidate_id: effectiveCandidateId,
        candidateId: effectiveCandidateId,
        candidateUid: effectiveUid,
        candidate_name: payment.candidate_name || payment.candidateName,
        candidateName: payment.candidate_name || payment.candidateName,
        candidate_email: payment.candidate_email || payment.candidateEmail,
        candidateEmail: payment.candidate_email || payment.candidateEmail,
        candidate_phone: payment.candidate_phone || payment.candidatePhone || '',
        country: payment.country || 'India',
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
        payment_id: payment.paymentId || payment.id,
        paymentId: payment.paymentId || payment.id,
        amount: payment.amount,
        currency: payment.currency,
        created_at: paidAt,
        createdAt: paidAt,
      };
      db.addDoc('enrollments', enrollment);

      // Increment enrolled count
      if (cert.id && db.findOne('certifications', c => c.id === cert.id)) {
        db.updateDoc('certifications', cert.id, {
          enrolledCount: (cert.enrolledCount || 0) + 1,
        });
      }

      // 2. Create Invoice
      invoiceId = payment.invoiceId || `INV-AICQB-${new Date().getFullYear()}-${String(db.getCollection('payments').length + 1001)}`;
      const invoiceRecord = {
        id: invoiceId,
        invoice_id: invoiceId,
        invoiceId,
        payment_id: payment.paymentId || payment.id,
        paymentId: payment.paymentId || payment.id,
        enrollment_id: enrollmentId,
        candidate_id: effectiveCandidateId,
        candidateUid: effectiveUid,
        candidate_name: payment.candidate_name || payment.candidateName,
        candidateName: payment.candidate_name || payment.candidateName,
        candidate_email: payment.candidate_email || payment.candidateEmail,
        candidateEmail: payment.candidate_email || payment.candidateEmail,
        country: payment.country || 'India',
        amount: payment.amount,
        currency: payment.currency,
        certification_name: cert.name,
        certification_level: cert.level || 'Professional Level',
        items: [
          {
            description: `AICQB Professional Certification: ${payment.certificationName} (${cert.level || 'Professional Level'})`,
            amount: payment.amount,
          },
        ],
        date: paidAt,
        created_at: paidAt,
        status: 'Paid',
      };
      db.addDoc('invoices', invoiceRecord);

      // 3. Create Exam Schedule & Enable Access
      scheduleId = `SCH-AICQB-${Date.now().toString().slice(-6)}`;
      const examDate = new Date();
      examDate.setDate(examDate.getDate() + 7);
      const day = String(examDate.getDate()).padStart(2, '0');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthYear = `${monthNames[examDate.getMonth()]} ${examDate.getFullYear()}`;

      const scheduleRecord = {
        id: scheduleId,
        schedule_id: scheduleId,
        scheduleId,
        candidate_id: effectiveCandidateId,
        candidateId: effectiveCandidateId,
        candidateUid: effectiveUid,
        candidate_name: payment.candidate_name || payment.candidateName,
        candidateName: payment.candidate_name || payment.candidateName,
        candidate_email: payment.candidate_email || payment.candidateEmail,
        candidateEmail: payment.candidate_email || payment.candidateEmail,
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
        scheduledDateFormatted: `${day} ${monthYear}`,
        scheduledTime: '10:00 AM – 11:30 AM (IST)',
        mode: 'Online Proctored',
        durationMinutes: cert.duration ? parseInt(cert.duration) : 90,
        status: 'scheduled',
        payment_id: payment.paymentId || payment.id,
        paymentId: payment.paymentId || payment.id,
        enrollment_id: enrollmentId,
        enrollmentId,
        instructions: [
          'Ensure a stable high-speed internet connection.',
          'Keep your camera and microphone enabled for AI proctoring.',
          'No external tabs or notes permitted during the examination.',
          'Exam will auto-submit when the countdown timer reaches 00:00.',
        ],
        createdAt: paidAt,
        created_at: paidAt,
      };
      db.addDoc('examSchedules', scheduleRecord);

      // Update candidate's upcoming exams count
      const candUser = db.findOne('candidates', c => c.uid === effectiveUid || c.candidateId === effectiveCandidateId);
      if (candUser) {
        db.updateDoc('candidates', candUser.id, {
          activeCertificationsCount: (candUser.activeCertificationsCount || 0) + 1,
          upcomingExamsCount: (candUser.upcomingExamsCount || 0) + 1,
        });
      }

      // 4. Update Payment Record
      payment = db.updateDoc('payments', payment.id, {
        razorpay_payment_id: simulatedPaymentId,
        razorpayPaymentId: simulatedPaymentId,
        payment_status: 'successful',
        paymentStatus: 'success',
        signatureVerificationStatus: 'verified_via_qr_scan',
        paidAt,
        verified_at: paidAt,
        verifiedAt: paidAt,
        enrollment_id: enrollmentId,
        enrollmentId,
        schedule_id: scheduleId,
        scheduleId,
        invoiceId,
      });

      // Update candidate profile stats
      if (effectiveUid) {
        const candidateProfile = db.findOne('candidates', c => c.uid === effectiveUid);
        if (candidateProfile) {
          db.updateDoc('candidates', candidateProfile.id, {
            activeCertificationsCount: (candidateProfile.activeCertificationsCount || 0) + 1,
            upcomingExamsCount: (candidateProfile.upcomingExamsCount || 0) + 1,
          });
        }
      }

      logAudit(
        req,
        'QR_SCAN_PAYMENT_SUCCESS',
        'Finance & Payments',
        `Test QR code scanned & verified for ${payment.certificationName} (${payment.amount} ${payment.currency})`
      );
    }

    const enrollment = db.findOne('enrollments', e => e.id === enrollmentId || e.enrollment_id === enrollmentId);
    const schedule = db.findOne('examSchedules', s => s.id === scheduleId || s.schedule_id === scheduleId);
    const invoice = db.findOne('invoices', i => i.id === invoiceId || i.invoice_id === invoiceId);

    if (req.headers.accept?.includes('application/json') || req.xhr || req.method === 'POST') {
      return res.json({
        success: true,
        message: 'Congratulations! Your enrollment payment has been completed successfully. You can now schedule your certification examination.',
        payment,
        enrollment,
        invoice,
        schedule,
      });
    }

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Approved - AIICQB</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0A1D37; color: white; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
    .card { background: white; color: #10264B; border-radius: 24px; padding: 36px 24px; max-width: 420px; width: 100%; text-align: center; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
    .badge { width: 72px; height: 72px; background: #DEF7EC; color: #046C4E; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 18px; font-size: 36px; font-weight: bold; }
    h2 { font-size: 22px; font-weight: 800; margin: 0 0 8px; color: #0A1D37; }
    p { font-size: 13.5px; color: #475569; margin: 0 0 22px; line-height: 1.5; }
    .details { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 14px; padding: 16px; text-align: left; font-size: 13px; margin-bottom: 24px; }
    .row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed #E2E8F0; }
    .row:last-child { border-bottom: none; }
    .label { color: #64748B; font-weight: 500; }
    .value { font-weight: 700; color: #0A1D37; }
    .btn { display: block; width: 100%; padding: 14px; background: #F47716; color: white; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 14px; box-sizing: border-box; transition: background 0.2s; }
    .btn:hover { background: #DC660E; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">✓</div>
    <h2>QR Payment Verified!</h2>
    <p>Congratulations! Your enrollment payment has been completed successfully. You can now schedule your certification examination.</p>
    <div class="details">
      <div class="row"><span class="label">Candidate:</span><span class="value">${payment.candidate_name || payment.candidateName}</span></div>
      <div class="row"><span class="label">Program:</span><span class="value">${payment.certificationName}</span></div>
      <div class="row"><span class="label">Enrollment ID:</span><span class="value" style="font-family: monospace;">${enrollmentId}</span></div>
      <div class="row"><span class="label">Amount Paid:</span><span class="value">${payment.currency === 'INR' ? '₹' : '$'}${payment.amount}</span></div>
      <div class="row"><span class="label">Status:</span><span class="value" style="color: #046C4E;">PAID • ACTIVE</span></div>
    </div>
    <a href="/portal/exams" class="btn">Return & Access Examination →</a>
  </div>
</body>
</html>`;
    return res.send(html);
  } catch (err) {
    console.error('Test QR scan error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function getPaymentStatus(req, res) {
  try {
    const { paymentId } = req.params;
    const payment = db.findOne('payments', p =>
      p.id === paymentId || p.paymentId === paymentId || p.razorpay_order_id === paymentId || p.razorpayOrderId === paymentId
    );
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    const isPaid = payment.payment_status === 'successful' || payment.paymentStatus === 'success';
    let enrollment = null;
    let schedule = null;
    let invoice = null;

    if (isPaid) {
      enrollment = payment.enrollment_id ? db.findOne('enrollments', e => e.id === payment.enrollment_id || e.enrollment_id === payment.enrollment_id) : null;
      schedule = payment.schedule_id ? db.findOne('examSchedules', s => s.id === payment.schedule_id || s.schedule_id === payment.schedule_id) : null;
      invoice = payment.invoiceId ? db.findOne('invoices', i => i.id === payment.invoiceId || i.invoice_id === payment.invoiceId) : null;
    }

    return res.json({
      success: true,
      isPaid,
      payment,
      enrollment,
      schedule,
      invoice,
      message: isPaid ? 'Congratulations! Your enrollment payment has been completed successfully. You can now schedule your certification examination.' : 'Payment pending',
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

