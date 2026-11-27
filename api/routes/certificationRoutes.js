import express from 'express';
import {
  getCertifications,
  getCertificationById,
  getCandidateCertificationStatus,
  enrollCertification,
  createCertification,
  updateCertification,
  toggleStatus,
  archiveCertification,
  restoreCertification,
  deleteCertification,
  generateCertificationCode,
  getDomains,
  createDomain,
  updateDomain,
  toggleDomainStatus,
  deleteDomain,
  getLevels,
  createLevel,
  updateLevel,
  toggleLevelStatus,
  deleteLevel,
  getAuditLogs,
  getPricingConfig,
  updatePricingConfig,
} from '../controllers/certificationController.js';
import { authenticate, optionalAuthenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// General & Candidate routes
router.get('/', optionalAuthenticate, getCertifications);
router.get('/candidate-status', authenticate, getCandidateCertificationStatus);
router.post('/enroll', optionalAuthenticate, enrollCertification);

// Pricing config & code generation
router.get('/config', optionalAuthenticate, getPricingConfig);
router.post('/config', authenticate, requireAdmin, updatePricingConfig);
router.get('/generate-code', authenticate, requireAdmin, generateCertificationCode);

// Audit logs
router.get('/audit-logs', authenticate, requireAdmin, getAuditLogs);

// Domains CRUD (placed before /:id)
router.get('/domains', optionalAuthenticate, getDomains);
router.post('/domains', authenticate, requireAdmin, createDomain);
router.put('/domains/:id', authenticate, requireAdmin, updateDomain);
router.patch('/domains/:id/toggle-status', authenticate, requireAdmin, toggleDomainStatus);
router.delete('/domains/:id', authenticate, requireAdmin, deleteDomain);

// Levels CRUD (placed before /:id)
router.get('/levels', optionalAuthenticate, getLevels);
router.post('/levels', authenticate, requireAdmin, createLevel);
router.put('/levels/:id', authenticate, requireAdmin, updateLevel);
router.patch('/levels/:id/toggle-status', authenticate, requireAdmin, toggleLevelStatus);
router.delete('/levels/:id', authenticate, requireAdmin, deleteLevel);

// Detail route
router.get('/:id', getCertificationById);

// Admin Certification Program CRUD
router.post('/', authenticate, requireAdmin, createCertification);
router.put('/:id', authenticate, requireAdmin, updateCertification);
router.patch('/:id/toggle-status', authenticate, requireAdmin, toggleStatus);
router.patch('/:id/archive', authenticate, requireAdmin, archiveCertification);
router.patch('/:id/restore', authenticate, requireAdmin, restoreCertification);
router.delete('/:id', authenticate, requireAdmin, deleteCertification);

export default router;
