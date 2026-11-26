import express from 'express';
import {
  getCandidateCertificates,
  verifyCertificate,
  getPublicCertificatesRegistry,
  getAllCertificatesAdmin,
  issueCertificateAdmin,
  reissueCertificateAdmin,
  revokeCertificate,
  reinstateCertificate,
  suspendCertificateAdmin,
  approveCertificateAdmin,
  rejectCertificateAdmin,
  regenerateQrAdmin,
  getVerificationStatsAdmin,
  updateCertificateAdmin,
  deleteCertificateAdmin,
  downloadCertificatePdf,
} from '../controllers/certificateController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public certificate verification & download
router.get('/public-registry', getPublicCertificatesRegistry);
router.get('/verify/:certificateNo', verifyCertificate);
router.get('/verification/:certificateNo', verifyCertificate);
router.get('/download/:certificateNo', downloadCertificatePdf);

// Candidate certificates
router.get('/my', authenticate, getCandidateCertificates);

// Admin routes
router.get('/admin/all', authenticate, requireAdmin, getAllCertificatesAdmin);
router.get('/admin/verification-stats', authenticate, requireAdmin, getVerificationStatsAdmin);
router.post('/admin/issue', authenticate, requireAdmin, issueCertificateAdmin);
router.post('/admin/reissue/:id', authenticate, requireAdmin, reissueCertificateAdmin);
router.put('/admin/:id', authenticate, requireAdmin, updateCertificateAdmin);
router.delete('/admin/:id', authenticate, requireAdmin, deleteCertificateAdmin);
router.post('/admin/revoke/:id', authenticate, requireAdmin, revokeCertificate);
router.post('/admin/reinstate/:id', authenticate, requireAdmin, reinstateCertificate);
router.post('/admin/suspend/:id', authenticate, requireAdmin, suspendCertificateAdmin);
router.post('/admin/approve/:id', authenticate, requireAdmin, approveCertificateAdmin);
router.post('/admin/reject/:id', authenticate, requireAdmin, rejectCertificateAdmin);
router.post('/admin/regenerate-qr/:id', authenticate, requireAdmin, regenerateQrAdmin);

export default router;

