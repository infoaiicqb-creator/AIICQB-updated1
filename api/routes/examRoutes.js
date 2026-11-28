import express from 'express';
import {
  getExams,
  getCandidateSchedules,
  scheduleExam,
  startExam,
  submitExam,
  saveAnswers,
  logProctoringEvent,
  saveIdentityVerification,
  exitExamSession,
  reviewSessionAdmin,
  createExamAdmin,
  updateExamAdmin,
  deleteExamAdmin,
  getQuestionsAdmin,
  createQuestionAdmin,
  bulkImportQuestionsAdmin,
  updateQuestionAdmin,
  deleteQuestionAdmin,
  getExamMonitoringAdmin,
  getResultsAdmin,
  getExamLevels,
  createExamLevel,
  updateExamLevel,
  deleteExamLevel,
  getExamRegistrations,
  getExamRegistrationsAdmin,
} from '../controllers/examController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getExams);
router.get('/levels', getExamLevels);
router.get('/registrations', authenticate, getExamRegistrations);
router.get('/my-schedules', authenticate, getCandidateSchedules);
router.post('/schedule', authenticate, scheduleExam);
router.get('/session/:scheduleId', authenticate, startExam);
router.post('/submit', authenticate, submitExam);
router.post('/save-answers', authenticate, saveAnswers);
router.post('/proctoring/log-event', authenticate, logProctoringEvent);
router.post('/proctoring/identity-verification', authenticate, saveIdentityVerification);
router.post('/exit', authenticate, exitExamSession);

// Admin Exam CRUD
router.post('/admin/exams', authenticate, requireAdmin, createExamAdmin);
router.put('/admin/exams/:id', authenticate, requireAdmin, updateExamAdmin);
router.delete('/admin/exams/:id', authenticate, requireAdmin, deleteExamAdmin);

// Admin Question Bank CRUD
router.get('/admin/questions', authenticate, requireAdmin, getQuestionsAdmin);
router.post('/admin/questions', authenticate, requireAdmin, createQuestionAdmin);
router.post('/admin/questions/bulk-import', authenticate, requireAdmin, bulkImportQuestionsAdmin);
router.put('/admin/questions/:id', authenticate, requireAdmin, updateQuestionAdmin);
router.delete('/admin/questions/:id', authenticate, requireAdmin, deleteQuestionAdmin);

// Admin Monitoring & Results
router.get('/admin/monitoring', authenticate, requireAdmin, getExamMonitoringAdmin);
router.post('/admin/review-session', authenticate, requireAdmin, reviewSessionAdmin);
router.get('/admin/results', authenticate, requireAdmin, getResultsAdmin);

// Admin Exam Levels & Registrations
router.get('/admin/levels', authenticate, requireAdmin, getExamLevels);
router.post('/admin/levels', authenticate, requireAdmin, createExamLevel);
router.put('/admin/levels/:id', authenticate, requireAdmin, updateExamLevel);
router.delete('/admin/levels/:id', authenticate, requireAdmin, deleteExamLevel);
router.get('/admin/registrations', authenticate, requireAdmin, getExamRegistrationsAdmin);

export default router;

