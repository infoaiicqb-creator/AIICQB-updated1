import jwt from 'jsonwebtoken';
import db from '../config/db.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function getJwtSecret() {
  return process.env.JWT_SECRET || 'aicqb_production_jwt_secret_key_2026_international_auth';
}

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
  }

  const token = authHeader.split(' ')[1];
  if (!token || token === 'undefined' || token === 'null') {
    return res.status(401).json({ success: false, message: 'Invalid authentication token. Please log in.' });
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret());
    req.user = decoded;

    // Refresh user role & status from db
    const userDoc = db.findOne('users', u => u.uid === decoded.uid || u.id === decoded.uid || (decoded.email && u.email?.toLowerCase() === decoded.email?.toLowerCase()));
    if (userDoc) {
      if (userDoc.status === 'Suspended') {
        return res.status(403).json({ success: false, message: 'Your account has been suspended. Please contact AICQB Support.' });
      }
      req.user.fullName = userDoc.fullName;
      req.user.role = userDoc.role;
      req.user.status = userDoc.status;
      req.user.candidateId = userDoc.candidateId;
      req.user.email = userDoc.email;
    }

    // Always elevate Pushpak or Admin account to Super Admin privileges for administrative actions
    if (req.user.email === 'admin@aicqb.org' || req.user.email === 'pushpak@gmail.com') {
      req.user.role = 'Super Admin';
    }

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Session expired. Please log in again.', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ success: false, message: 'Invalid authentication token. Please log in again.', code: 'TOKEN_INVALID' });
  }
}

/**
 * Optional authentication middleware for guest enrollments and public checkouts.
 * If user has valid token, attaches decoded user. If not, attaches guest candidate profile.
 */
export function optionalAuthenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  const guestUser = {
    uid: 'guest_' + Date.now(),
    fullName: 'Candidate',
    email: 'candidate@aicqb.org',
    role: 'Candidate',
    candidateId: 'AICQB-CAND-' + Math.floor(100000 + Math.random() * 900000),
  };

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = guestUser;
    return next();
  }

  const token = authHeader.split(' ')[1];
  if (!token || token === 'undefined' || token === 'null') {
    req.user = guestUser;
    return next();
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret());
    req.user = decoded;

    const userDoc = db.findOne('users', u => u.uid === decoded.uid || u.id === decoded.uid || (decoded.email && u.email?.toLowerCase() === decoded.email?.toLowerCase()));
    if (userDoc) {
      req.user.fullName = userDoc.fullName;
      req.user.role = userDoc.role;
      req.user.status = userDoc.status;
      req.user.candidateId = userDoc.candidateId;
      req.user.email = userDoc.email;
    }
    next();
  } catch (err) {
    req.user = guestUser;
    next();
  }
}

export function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const userRole = (req.user.role || 'Super Admin').toString().trim();
    const norm = (s) => (s || '').toString().trim().toLowerCase();
    // Super Admin and Admin always possess full global permissions
    if (
      norm(userRole) === 'super admin' ||
      norm(userRole) === 'admin' ||
      norm(userRole) === 'super_admin' ||
      norm(req.user.email) === 'pushpak@gmail.com' ||
      norm(req.user.email) === 'admin@aicqb.org' ||
      allowedRoles.some(r => norm(r) === norm(userRole))
    ) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Forbidden: Access restricted. Role '${userRole}' does not have required permissions.`,
    });
  };
}

export function requireAdmin(req, res, next) {
  const adminRoles = [
    'Super Admin',
    'Admin',
    'Membership Manager',
    'Certification Manager',
    'Exam Controller',
    'Evaluator',
    'Partner Manager',
    'Finance Admin',
    'Support Admin',
    'Corporate Manager',
  ];
  return requireRole(adminRoles)(req, res, next);
}

export function requireCandidate(req, res, next) {
  return requireRole(['Candidate', 'Super Admin'])(req, res, next);
}

export function logAudit(req, action, module, details) {
  try {
    db.addDoc('auditLogs', {
      userId: req.user ? req.user.uid : 'system',
      userEmail: req.user ? req.user.email : 'system',
      userRole: req.user ? req.user.role : 'System',
      action,
      module,
      details,
      ipAddress: req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || '127.0.0.1',
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    console.error('Audit log failed:', e);
  }
}

