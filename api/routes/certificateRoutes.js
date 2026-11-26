import express from 'express';
import {
  getCandidateCertificates,
  verifyCertificate,
  getPublicCertificatesRegistry,
  getAllCertificatesAdmin,
  issueCertificateAdmin,
  revokeCertificate,
  reinstateCertificate,
  updateCertificateAdmin,
  deleteCertificateAdmin,
} from '../controllers/certificateController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public certificate verification
router.get('/public-registry', getPublicCertificatesRegistry);
router.get('/verify/:certificateNo', verifyCertificate);

// Candidate certificates
router.get('/my', authenticate, getCandidateCertificates);

// Admin routes
router.get('/admin/all', authenticate, requireAdmin, getAllCertificatesAdmin);
router.post('/admin/issue', authenticate, requireAdmin, issueCertificateAdmin);
router.put('/admin/:id', authenticate, requireAdmin, updateCertificateAdmin);
router.delete('/admin/:id', authenticate, requireAdmin, deleteCertificateAdmin);
router.post('/admin/revoke/:id', authenticate, requireAdmin, revokeCertificate);
router.post('/admin/reinstate/:id', authenticate, requireAdmin, reinstateCertificate);

export default router;

