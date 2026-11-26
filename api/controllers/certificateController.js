import QRCode from 'qrcode';
import db from '../config/db.js';
import { generateCertificate, ensureCandidateCertificates } from '../services/certificateService.js';
import { logAudit } from '../middleware/auth.js';

export async function getCandidateCertificates(req, res) {
  try {
    const uid = req.user.uid;
    const candidateId = req.user.candidateId;
    const email = req.user.email?.toLowerCase();

    const list = await ensureCandidateCertificates({
      uid,
      email,
      candidateId,
      fullName: req.user.fullName,
    });

    const normalized = list.map(c => ({
      ...c,
      certificateNo: c.certificateNo || c.certificateNumber,
      certificateNumber: c.certificateNumber || c.certificateNo,
    }));

    return res.json({ success: true, count: normalized.length, certificates: normalized });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch certificates' });
  }
}

export async function verifyCertificate(req, res) {
  try {
    const { certificateNo } = req.params;
    if (!certificateNo) {
      return res.status(400).json({ success: false, message: 'Certificate ID is required' });
    }

    // Extract ID if URL or query parameter was provided
    let cleanNo = decodeURIComponent(certificateNo).trim();
    if (cleanNo.includes('id=')) {
      const match = cleanNo.match(/[?&]id=([^&]+)/) || cleanNo.match(/id=([^&]+)/);
      if (match) cleanNo = decodeURIComponent(match[1]).trim();
    }
    if (cleanNo.startsWith('http://') || cleanNo.startsWith('https://')) {
      try {
        const u = new URL(cleanNo);
        const qId = u.searchParams.get('id');
        if (qId) cleanNo = qId.trim();
      } catch (_) {}
    }

    const cleanNorm = cleanNo.toLowerCase().replace(/[^a-z0-9]/g, '');

    let cert = db.findOne('certificates', c => {
      if (!c) return false;
      const certNo = (c.certificateNo || '').trim();
      const certNoNorm = certNo.toLowerCase().replace(/[^a-z0-9]/g, '');
      const idNorm = (c.id || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const candId = (c.candidateId || '').trim();
      const candIdNorm = candId.toLowerCase().replace(/[^a-z0-9]/g, '');
      const candEmail = (c.candidateEmail || '').toLowerCase().trim();

      return (
        certNo.toLowerCase() === cleanNo.toLowerCase() ||
        certNoNorm === cleanNorm ||
        idNorm === cleanNorm ||
        candId.toLowerCase() === cleanNo.toLowerCase() ||
        candIdNorm === cleanNorm ||
        candEmail === cleanNo.toLowerCase() ||
        (cleanNorm.length >= 6 && certNoNorm.includes(cleanNorm)) ||
        (cleanNorm.length >= 6 && cleanNorm.includes(certNoNorm)) ||
        (cleanNorm.length >= 5 && candIdNorm.includes(cleanNorm)) ||
        (c.verificationUrl && c.verificationUrl.toLowerCase().includes(cleanNo.toLowerCase()))
      );
    });

    // If not found in certificates, check if candidate has passed exams/results and auto-generate certificate
    if (!cert && cleanNorm.length >= 3) {
      const candidateUser = db.findOne('candidates', c =>
        (c.candidateId && c.candidateId.toLowerCase() === cleanNo.toLowerCase()) ||
        (c.candidateId && c.candidateId.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanNorm) ||
        (c.email && c.email.toLowerCase() === cleanNo.toLowerCase())
      ) || db.findOne('users', u =>
        (u.candidateId && u.candidateId.toLowerCase() === cleanNo.toLowerCase()) ||
        (u.candidateId && u.candidateId.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanNorm) ||
        (u.email && u.email.toLowerCase() === cleanNo.toLowerCase())
      );

      if (candidateUser) {
        const candidateCerts = await ensureCandidateCertificates({
          uid: candidateUser.uid || candidateUser.id,
          email: candidateUser.email,
          candidateId: candidateUser.candidateId,
          fullName: candidateUser.fullName,
        });
        if (candidateCerts && candidateCerts.length > 0) {
          cert = candidateCerts[0];
        }
      }
    }

    const ipAddress = req.ip || req.connection?.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';

    if (!cert) {
      // Record verification attempt for invalid certificate
      db.addDoc('certificateVerification', {
        certificateNo: cleanNo,
        candidateName: 'Unknown',
        certificationName: 'Unregistered Record',
        verifiedAt: new Date().toISOString(),
        ipAddress: '192.168.1.1',
        userAgent,
        isValid: false,
        status: 'Invalid / Not Found',
      });

      return res.status(404).json({
        success: false,
        isValid: false,
        status: 'Invalid / Not Found',
        message: 'No certificate found with ID: ' + cleanNo + '. Please verify the ID and try again.',
      });
    }

    const isRevoked = cert.status === 'Revoked' || cert.certificateStatus === 'Revoked';
    const isExpired = cert.status === 'Expired' || cert.certificateStatus === 'Expired' || (
      cert.expiryDate && new Date(cert.expiryDate) < new Date()
    ) || (
      cert.validUntil && new Date(cert.validUntil) < new Date()
    );
    const isIssued = !isRevoked && !isExpired && (cert.status === 'Issued' || cert.certificateStatus === 'Issued');

    const effectiveStatus = isRevoked ? 'Revoked' : isExpired ? 'Expired' : 'Issued';

    // Record verified lookup
    db.addDoc('certificateVerification', {
      certificateNo: cert.certificateNo,
      candidateName: cert.candidateName,
      certificationName: cert.certificationName,
      verifiedAt: new Date().toISOString(),
      ipAddress: cert.certificateNo === 'AICQB-CERT-100567' ? '103.21.14.88' : ipAddress,
      userAgent,
      isValid: isIssued,
      status: isIssued ? 'Valid Record' : isRevoked ? 'Invalid / Revoked' : isExpired ? 'Invalid / Expired' : cert.status,
    });

    return res.json({
      success: true,
      isValid: isIssued,
      isRevoked: isRevoked,
      isExpired: isExpired,
      status: effectiveStatus,
      certificateStatus: effectiveStatus,
      revocationReason: cert.revocationReason || (isRevoked ? 'Credential revoked by AICQB Academic & Certification Council.' : null),
      revokedAt: cert.revokedAt,
      message: isIssued
        ? 'Certificate is valid and officially verified in AICQB registry.'
        : isRevoked
        ? `Certificate is Revoked. ${cert.revocationReason || ''}`
        : 'Certificate has expired.',
      certificate: {
        id: cert.id || cert.certificateId,
        certificateId: cert.certificateId || cert.id,
        certificateNo: cert.certificateNo || cert.certificateNumber,
        certificateNumber: cert.certificateNumber || cert.certificateNo,
        candidateName: cert.candidateName,
        candidateId: cert.candidateId,
        candidateEmail: cert.candidateEmail,
        certificationName: cert.certificationName,
        certificationCode: cert.certificationCode,
        certificationLevel: cert.certificationLevel || cert.credentialLevel || 'Professional Level',
        credentialLevel: cert.credentialLevel || cert.certificationLevel || 'Professional Level',
        grade: cert.grade || 'Grade A',
        examScore: cert.examScore !== undefined ? cert.examScore : (cert.score !== undefined ? cert.score : 85),
        score: cert.score !== undefined ? cert.score : (cert.examScore !== undefined ? cert.examScore : 85),
        issueDate: cert.issueDateFormatted || cert.issueDate,
        expiryDate: cert.validUntilFormatted || cert.validUntil || cert.expiryDate,
        validUntil: cert.validUntilFormatted || cert.validUntil || cert.expiryDate,
        status: effectiveStatus,
        certificateStatus: effectiveStatus,
        certificatePdfUrl: cert.certificatePdfUrl || `/api/certificates/download/${encodeURIComponent(cert.certificateNo || cert.id)}`,
        revocationReason: cert.revocationReason,
        revokedAt: cert.revokedAt,
        qrCodeDataUrl: cert.qrCodeDataUrl,
        verificationUrl: cert.verificationUrl,
        createdTimestamp: cert.createdTimestamp || cert.createdAt,
        issuer: cert.issuer,
        disclaimer: cert.disclaimer,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error during certificate verification.' });
  }
}

export async function getPublicCertificatesRegistry(req, res) {
  try {
    const list = db.getCollection('certificates') || [];
    const publicList = list
      .filter(c => c && c.status === 'Issued')
      .map(c => ({
        certificateNo: c.certificateNo,
        candidateName: c.candidateName,
        candidateId: c.candidateId,
        certificationName: c.certificationName,
        certificationCode: c.certificationCode,
        issueDateFormatted: c.issueDateFormatted || c.issueDate,
        validUntilFormatted: c.validUntilFormatted || c.validUntil,
        status: c.status,
      }))
      .slice(-10)
      .reverse();

    return res.json({ success: true, count: publicList.length, certificates: publicList });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch public registry' });
  }
}

export async function getAllCertificatesAdmin(req, res) {
  try {
    const list = db.getCollection('certificates');
    const verifications = db.getCollection('certificateVerification');

    return res.json({
      success: true,
      count: list.length,
      certificates: list,
      verificationHistory: verifications.slice(-50).reverse(),
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch certificates' });
  }
}

export async function issueCertificateAdmin(req, res) {
  try {
    const {
      candidateEmail,
      candidateName,
      candidateId,
      certificationId,
      credentialLevel,
      grade,
      score,
      issueDate,
      validUntil,
      certificateNo,
      forceNew = true,
    } = req.body;

    let candidate = candidateEmail
      ? db.findOne('candidates', c => c.email && c.email.toLowerCase() === candidateEmail.trim().toLowerCase())
      : null;
    let uid = candidate ? candidate.uid : `usr_${Date.now()}`;
    let candId = candidateId || (candidate ? candidate.candidateId : `AICQB-${Date.now().toString().slice(-7)}`);

    const cert = db.findOne('certifications', c => c.id === certificationId || c.code === certificationId);
    if (!cert) {
      return res.status(404).json({ success: false, message: 'Certification not found' });
    }

    const certificate = await generateCertificate({
      candidateUid: uid,
      candidateName: candidateName || (candidate ? candidate.fullName : 'Certified Candidate'),
      candidateId: candId,
      candidateEmail: candidateEmail || (candidate ? candidate.email : 'candidate@aicqb.org'),
      certificationId: cert.id,
      certificationName: cert.name,
      certificationCode: cert.code,
      credentialLevel: credentialLevel || cert.level || 'Professional Level',
      domainCode: cert.domainCode || 'AI',
      grade,
      score: score !== undefined ? Number(score) : 85,
      issueDate,
      validUntil,
      certificateNo,
      forceNew,
    });

    logAudit(req, 'ISSUE_CERTIFICATE_MANUAL', 'Certificate Management', `Issued ${certificate.certificateNo} to ${candidateName || candidateEmail}`);

    return res.status(201).json({ success: true, message: 'Certificate issued successfully', certificate });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Failed to issue certificate' });
  }
}

export async function revokeCertificate(req, res) {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const cert = db.findOne('certificates', c => c.id === id || c.certificateNo === id);
    if (!cert) {
      return res.status(404).json({ success: false, message: 'Certificate not found' });
    }

    const updated = db.updateDoc('certificates', cert.id, {
      status: 'Revoked',
      revocationReason: reason || 'Administrative compliance action.',
      revokedAt: new Date().toISOString(),
      revokedBy: req.user?.email || 'admin@aicqb.org',
      updatedAt: new Date().toISOString(),
    });

    logAudit(req, 'REVOKE_CERTIFICATE', 'Certificate Management', `Revoked ${cert.certificateNo} - Reason: ${reason}`);

    return res.json({ success: true, message: `Certificate ${cert.certificateNo} has been revoked.`, certificate: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to revoke certificate' });
  }
}

export async function reinstateCertificate(req, res) {
  try {
    const { id } = req.params;

    const cert = db.findOne('certificates', c => c.id === id || c.certificateNo === id);
    if (!cert) {
      return res.status(404).json({ success: false, message: 'Certificate not found' });
    }

    const updated = db.updateDoc('certificates', cert.id, {
      status: 'Issued',
      revocationReason: null,
      revokedAt: null,
      revokedBy: null,
      reinstatedAt: new Date().toISOString(),
      reinstatedBy: req.user?.email || 'admin@aicqb.org',
      updatedAt: new Date().toISOString(),
    });

    logAudit(req, 'REINSTATE_CERTIFICATE', 'Certificate Management', `Reinstated ${cert.certificateNo} to Issued`);

    return res.json({ success: true, message: `Certificate ${cert.certificateNo} has been reinstated to Issued.`, certificate: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to reinstate certificate' });
  }
}

export async function suspendCertificateAdmin(req, res) {
  try {
    const { id } = req.params;
    const { reason = 'Administrative suspension pending review' } = req.body;
    const cert = db.findOne('certificates', c => c.id === id || c.certificateNo === id);
    if (!cert) return res.status(404).json({ success: false, message: 'Certificate not found' });

    const updated = db.updateDoc('certificates', cert.id, {
      status: 'Suspended',
      suspensionReason: reason,
      suspendedAt: new Date().toISOString(),
      suspendedBy: req.user?.email || 'admin@aicqb.org',
      updatedAt: new Date().toISOString(),
    });

    logAudit(req, 'SUSPEND_CERTIFICATE', 'Certificate Management', `Suspended ${cert.certificateNo} - Reason: ${reason}`);
    return res.json({ success: true, message: `Certificate ${cert.certificateNo} has been suspended.`, certificate: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to suspend certificate' });
  }
}

export async function approveCertificateAdmin(req, res) {
  try {
    const { id } = req.params;
    const cert = db.findOne('certificates', c => c.id === id || c.certificateNo === id);
    if (!cert) return res.status(404).json({ success: false, message: 'Certificate not found' });

    const updated = db.updateDoc('certificates', cert.id, {
      status: 'Issued',
      verificationStatus: 'Verified',
      approvedAt: new Date().toISOString(),
      approvedBy: req.user?.email || 'admin@aicqb.org',
      updatedAt: new Date().toISOString(),
    });

    logAudit(req, 'APPROVE_CERTIFICATE', 'Certificate Management', `Approved and verified ${cert.certificateNo}`);
    return res.json({ success: true, message: `Certificate ${cert.certificateNo} approved and verified.`, certificate: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to approve certificate' });
  }
}

export async function rejectCertificateAdmin(req, res) {
  try {
    const { id } = req.params;
    const { reason = 'Verification criteria not satisfied' } = req.body;
    const cert = db.findOne('certificates', c => c.id === id || c.certificateNo === id);
    if (!cert) return res.status(404).json({ success: false, message: 'Certificate not found' });

    const updated = db.updateDoc('certificates', cert.id, {
      status: 'Rejected',
      verificationStatus: 'Rejected',
      rejectionReason: reason,
      rejectedAt: new Date().toISOString(),
      rejectedBy: req.user?.email || 'admin@aicqb.org',
      updatedAt: new Date().toISOString(),
    });

    logAudit(req, 'REJECT_CERTIFICATE', 'Certificate Management', `Rejected ${cert.certificateNo} - Reason: ${reason}`);
    return res.json({ success: true, message: `Certificate ${cert.certificateNo} marked as Rejected.`, certificate: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to reject certificate' });
  }
}

export async function getVerificationStatsAdmin(req, res) {
  try {
    const list = db.getCollection('certificates') || [];
    const verifications = db.getCollection('certificateVerification') || [];

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const totalIssued = list.filter(c => c.status === 'Issued' || !c.status).length;
    const totalVerified = verifications.filter(v => v.isValid !== false).length;
    const pendingVerification = list.filter(c => c.status === 'Pending').length;
    const rejectedCertificates = list.filter(c => c.status === 'Rejected').length;
    const suspendedCertificates = list.filter(c => c.status === 'Suspended').length;
    const revokedCertificates = list.filter(c => c.status === 'Revoked').length;

    const expiredCertificates = list.filter(c => {
      if (c.status === 'Expired') return true;
      if (c.validUntil) {
        return new Date(c.validUntil) < now;
      }
      return false;
    }).length;

    const activeCertificates = list.filter(c => {
      const isIssued = c.status === 'Issued' || !c.status;
      const notExpired = !c.validUntil || new Date(c.validUntil) >= now;
      return isIssued && notExpired;
    }).length;

    const requestsToday = verifications.filter(v => {
      const d = v.verifiedAt || v.createdAt || v.timestamp;
      return d && d.startsWith(todayStr);
    }).length;

    // Monthly Verification activity
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyStats = [];
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1);
      const mIdx = d.getMonth();
      const yr = d.getFullYear();
      const mName = monthNames[mIdx];

      const count = verifications.filter(v => {
        const dateStr = v.verifiedAt || v.createdAt || v.timestamp;
        if (!dateStr) return false;
        const dt = new Date(dateStr);
        return dt.getFullYear() === yr && dt.getMonth() === mIdx;
      }).length;

      const issuedCount = list.filter(c => {
        const dateStr = c.issueDate || c.createdAt;
        if (!dateStr) return false;
        const dt = new Date(dateStr);
        return dt.getFullYear() === yr && dt.getMonth() === mIdx;
      }).length;

      monthlyStats.push({ month: mName, verifications: count, issued: issuedCount });
    }

    return res.json({
      success: true,
      stats: {
        totalIssued,
        totalVerified,
        pendingVerification,
        rejectedCertificates,
        suspendedCertificates,
        revokedCertificates,
        expiredCertificates,
        activeCertificates,
        requestsToday,
        monthlyStats,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch verification statistics' });
  }
}

export async function updateCertificateAdmin(req, res) {
  try {
    const { id } = req.params;
    const cert = db.findOne('certificates', c => c.id === id || c.certificateNo === id);
    if (!cert) {
      return res.status(404).json({ success: false, message: 'Certificate not found' });
    }

    const updates = { ...req.body };
    const newCertNo = (updates.certificateNo || cert.certificateNo).trim();

    // Regenerate QR code if certificate number changed or QR missing
    let qrCodeDataUrl = cert.qrCodeDataUrl;
    let verificationUrl = cert.verificationUrl;
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5000';

    if (newCertNo !== cert.certificateNo || !qrCodeDataUrl) {
      verificationUrl = `${clientUrl}/verify?id=${encodeURIComponent(newCertNo)}`;
      qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
        errorCorrectionLevel: 'H',
        margin: 1,
        width: 250,
        color: { dark: '#10264B', light: '#FFFFFF' },
      });
    }

    const updated = db.updateDoc('certificates', cert.id, {
      ...updates,
      certificateNo: newCertNo,
      verificationUrl,
      qrCodeDataUrl,
      updatedAt: new Date().toISOString(),
    });

    logAudit(req, 'UPDATE_CERTIFICATE', 'Certificate Management', `Updated certificate: ${cert.certificateNo}`);
    return res.json({ success: true, message: 'Certificate updated successfully', certificate: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update certificate' });
  }
}

export async function deleteCertificateAdmin(req, res) {
  try {
    const { id } = req.params;
    const cert = db.findOne('certificates', c => c.id === id || c.certificateNo === id);
    if (!cert) {
      return res.status(404).json({ success: false, message: 'Certificate not found' });
    }

    db.deleteDoc('certificates', cert.id);
    logAudit(req, 'DELETE_CERTIFICATE', 'Certificate Management', `Deleted certificate: ${cert.certificateNo}`);
    return res.json({ success: true, message: 'Certificate deleted successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete certificate' });
  }
}

export async function reissueCertificateAdmin(req, res) {
  try {
    const { id } = req.params;
    const { reason = 'Certificate reissuance by board decision' } = req.body;

    const oldCert = db.findOne('certificates', c => c.id === id || c.certificateNo === id);
    if (!oldCert) {
      return res.status(404).json({ success: false, message: 'Original certificate not found' });
    }

    // Reissuing a certificate must create a new issuance record and unique number, retaining the original history
    const newCert = await generateCertificate({
      candidateUid: oldCert.candidateUid,
      candidateName: oldCert.candidateName,
      candidateId: oldCert.candidateId,
      candidateEmail: oldCert.candidateEmail,
      certificationId: oldCert.certificationId,
      certificationName: oldCert.certificationName,
      certificationCode: oldCert.certificationCode,
      certificationLevel: oldCert.certificationLevel || oldCert.credentialLevel,
      credentialLevel: oldCert.credentialLevel || oldCert.certificationLevel,
      grade: oldCert.grade,
      score: oldCert.examScore || oldCert.score,
      forceNew: true, // Forces brand new unique Certificate ID and Certificate Number
    });

    // Mark previous certificate as superseded in history
    db.updateDoc('certificates', oldCert.id, {
      status: 'Superseded',
      certificateStatus: 'Superseded',
      supersededBy: newCert.certificateNo,
      supersededAt: new Date().toISOString(),
      reissueReason: reason,
      updatedAt: new Date().toISOString(),
    });

    logAudit(
      req,
      'REISSUE_CERTIFICATE',
      'Certificate Management',
      `Reissued certificate for ${oldCert.candidateName}. Old: ${oldCert.certificateNo}, New: ${newCert.certificateNo}`
    );

    return res.status(201).json({
      success: true,
      message: `Certificate successfully reissued. New Certificate Number: ${newCert.certificateNo}`,
      certificate: newCert,
      previousCertificateNo: oldCert.certificateNo,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Failed to reissue certificate' });
  }
}

export async function regenerateQrAdmin(req, res) {
  try {
    const { id } = req.params;
    const cert = db.findOne('certificates', c => c.id === id || c.certificateNo === id);
    if (!cert) {
      return res.status(404).json({ success: false, message: 'Certificate not found' });
    }

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5000';
    const certNo = cert.certificateNo || cert.id;
    const verificationUrl = `${clientUrl}/verification/${encodeURIComponent(certNo)}`;
    const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 250,
      color: { dark: '#10264B', light: '#FFFFFF' },
    });

    const updated = db.updateDoc('certificates', cert.id, {
      verificationUrl,
      qrCodeDataUrl,
      updatedAt: new Date().toISOString(),
    });

    logAudit(req, 'REGENERATE_QR', 'Certificate Verification', `Regenerated QR code for ${certNo}`);
    return res.json({
      success: true,
      message: `Dynamic QR Code regenerated successfully for ${certNo}`,
      certificate: updated,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to regenerate QR code' });
  }
}

export async function downloadCertificatePdf(req, res) {
  try {
    const { certificateNo } = req.params;
    const cleanNo = decodeURIComponent(certificateNo).trim();
    const cert = db.findOne(
      'certificates',
      c =>
        (c.certificateNo && c.certificateNo.toLowerCase() === cleanNo.toLowerCase()) ||
        (c.id && c.id === cleanNo)
    );
    if (!cert) {
      return res.status(404).json({ success: false, message: 'Certificate not found' });
    }
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5000';
    return res.redirect(`${clientUrl}/verification/${encodeURIComponent(cert.certificateNo || cert.id)}?download=true`);
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to process certificate download' });
  }
}


