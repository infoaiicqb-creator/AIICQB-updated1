import express from 'express';
import {
  getCertifications,
  getCertificationById,
  getCandidateCertificationStatus,
  enrollCertification,
  createCertification,
  updateCertification,
  toggleStatus,
  deleteCertification,
} from '../controllers/certificationController.js';
import { authenticate, optionalAuthenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', optionalAuthenticate, getCertifications);
router.get('/candidate-status', authenticate, getCandidateCertificationStatus);
router.post('/enroll', optionalAuthenticate, enrollCertification);
router.get('/:id', getCertificationById);

// Admin routes
router.post('/', authenticate, requireAdmin, createCertification);
router.put('/:id', authenticate, requireAdmin, updateCertification);
router.delete('/:id', authenticate, requireAdmin, deleteCertification);
router.patch('/:id/toggle-status', authenticate, requireAdmin, toggleStatus);

export default router;

