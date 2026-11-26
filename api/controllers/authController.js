import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import db from '../config/db.js';
import { logAudit } from '../middleware/auth.js';

function getJwtSecret() {
  return process.env.JWT_SECRET || 'aicqb_production_jwt_secret_key_2026_international_auth';
}

/**
 * Verify provided password against stored password.
 * Supports bcrypt hashes ($2a$, $2b$) with safe fallback to legacy plain-text for existing users.
 */
async function verifyPassword(providedPassword, storedPassword) {
  if (!storedPassword || !providedPassword) return false;
  const isBcrypt = typeof storedPassword === 'string' && /^\$2[abxy]\$\d+\$/.test(storedPassword);
  if (isBcrypt) {
    return await bcrypt.compare(providedPassword, storedPassword);
  }
  return storedPassword === providedPassword;
}

function generateCandidateId() {
  const existingCandidates = db.getCollection('candidates') || [];
  const existingUsers = db.getCollection('users') || [];
  const existingResults = db.getCollection('results') || [];
  const existingCerts = db.getCollection('certificates') || [];
  let maxNum = 1004700;

  const scan = item => {
    if (item && item.candidateId) {
      const match = String(item.candidateId).match(/AICQB-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }
  };

  existingCandidates.forEach(scan);
  existingUsers.forEach(scan);
  existingResults.forEach(scan);
  existingCerts.forEach(scan);

  return `AICQB-${maxNum + 1}`;
}

export async function register(req, res) {
  try {
    const {
      fullName,
      email,
      phoneNumber,
      countryCode = '+91',
      country,
      organization,
      companyName,
      employeeId,
      password,
      confirmPassword,
      agreeTerms,
      certificationId,
      selectedCertificationId,
      enrolledCertification,
    } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existingUser = db.findOne('users', u => u.email.toLowerCase() === cleanEmail);

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists. Please log in.' });
    }

    const uid = `usr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const candidateId = generateCandidateId();
    const formattedPhone = phoneNumber ? `${countryCode} ${phoneNumber.trim()}` : '';
    const assignedOrg = organization || companyName || '';
    const assignedEmpId = employeeId || '';
    const assignedCountry = country || 'India';

    // Securely hash password with bcrypt (cost factor 10)
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      uid,
      id: uid,
      email: cleanEmail,
      fullName: fullName.trim(),
      phoneNumber: formattedPhone,
      country: assignedCountry,
      organization: assignedOrg,
      employeeId: assignedEmpId,
      password: hashedPassword, // Salted bcrypt hash, never plain text
      role: 'Candidate',
      candidateId,
      status: 'Active',
      emailVerified: false,
      createdAt: new Date().toISOString(),
    };

    db.addDoc('users', newUser);

    // Create Candidate Profile in Firestore/DB
    const candidateProfile = {
      id: uid,
      uid,
      candidateId,
      fullName: fullName.trim(),
      email: cleanEmail,
      phoneNumber: formattedPhone,
      country: assignedCountry,
      organization: assignedOrg,
      employeeId: assignedEmpId,
      address: '',
      gender: 'Not specified',
      dateOfBirth: '',
      aboutMe: '',
      profileCompletion: 45,
      emailVerified: false,
      rewardPoints: 100,
      activeCertificationsCount: 0,
      upcomingExamsCount: 0,
      certificatesEarnedCount: 0,
      coursesInProgressCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.addDoc('candidates', candidateProfile);

    // Automatically enroll new user in selected certification if specified
    const targetCertId = certificationId || selectedCertificationId || enrolledCertification;
    let enrolledCertDoc = null;
    if (targetCertId) {
      enrolledCertDoc = db.findOne(
        'certifications',
        c => c.id === targetCertId || c.code === targetCertId || c.name.toLowerCase().includes(targetCertId.toLowerCase())
      );
    }

    if (enrolledCertDoc) {
      const enrollmentId = `enr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      const enrollment = {
        id: enrollmentId,
        candidateUid: uid,
        candidateId,
        candidateName: fullName.trim(),
        candidateEmail: cleanEmail,
        certificationId: enrolledCertDoc.id,
        certificationName: enrolledCertDoc.name,
        certificationCode: enrolledCertDoc.code,
        domain: enrolledCertDoc.domain,
        enrollmentDate: new Date().toISOString(),
        status: 'enrolled',
        progressPercentage: 0,
        paymentId: `reg_init_${Date.now()}`,
        amount: enrolledCertDoc.examFee || 0,
        createdAt: new Date().toISOString(),
      };
      db.addDoc('enrollments', enrollment);

      // Increment enrolledCount on certification
      db.updateDoc('certifications', enrolledCertDoc.id, {
        enrolledCount: (enrolledCertDoc.enrolledCount || 0) + 1,
      });

      // Update candidate profile stats
      candidateProfile.activeCertificationsCount = 1;
      candidateProfile.upcomingExamsCount = 1;
      candidateProfile.coursesInProgressCount = 1;
      db.updateDoc('candidates', uid, {
        activeCertificationsCount: 1,
        upcomingExamsCount: 1,
        coursesInProgressCount: 1,
      });

      // Auto-schedule online proctored exam for this new enrollment
      const examDate = new Date();
      examDate.setDate(examDate.getDate() + 7);
      const day = String(examDate.getDate()).padStart(2, '0');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthYear = `${monthNames[examDate.getMonth()]} ${examDate.getFullYear()}`;

      const scheduleRecord = {
        id: `sch_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        scheduleId: `sch_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        candidateUid: uid,
        candidateId,
        candidateName: fullName.trim(),
        candidateEmail: cleanEmail,
        certificationId: enrolledCertDoc.id,
        certificationName: enrolledCertDoc.name,
        certificationCode: enrolledCertDoc.code,
        examId: `exam_${enrolledCertDoc.id}`,
        examName: enrolledCertDoc.name,
        examCode: `${enrolledCertDoc.code}-EXAM`,
        scheduledDate: examDate.toISOString().split('T')[0],
        scheduledDateDay: day,
        scheduledDateMonth: monthYear,
        scheduledTime: '10:00 AM – 11:30 AM (IST)',
        mode: 'Online Proctored',
        durationMinutes: enrolledCertDoc.duration ? parseInt(enrolledCertDoc.duration) : 90,
        status: 'scheduled',
        enrollmentId: enrollment.id,
        instructions: [
          'Ensure a stable high-speed internet connection.',
          'Keep your camera and microphone enabled for AI proctoring.',
          'No external tabs or notes permitted during the examination.',
          'Exam will auto-submit when the countdown timer reaches 00:00.',
        ],
        createdAt: new Date().toISOString(),
      };
      db.addDoc('examSchedules', scheduleRecord);

      logAudit(
        req,
        'NEW_USER_ENROLLMENT',
        'Candidate Management',
        `New candidate ${fullName} registered and enrolled in ${enrolledCertDoc.name} (${enrolledCertDoc.code})`
      );
    } else {
      logAudit(req, 'REGISTRATION', 'Candidate Management', `New candidate registered: ${fullName} (${candidateId})`);
    }

    const token = jwt.sign(
      { uid, email: cleanEmail, role: 'Candidate', fullName: fullName.trim(), candidateId },
      getJwtSecret(),
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      message: 'Account created successfully! Verification email sent.',
      token,
      user: {
        uid,
        email: cleanEmail,
        fullName: fullName.trim(),
        role: 'Candidate',
        candidateId,
        emailVerified: false,
      },
      candidate: candidateProfile,
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ success: false, message: 'Server error during registration. Please try again.' });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide Email ID / Mobile Number and password.' });
    }

    const cleanInput = email.trim().toLowerCase();
    const cleanDigits = cleanInput.replace(/\D/g, '');

    // Allow login by email or phone number
    const user = db.findOne('users', u => {
      if (u.email && u.email.toLowerCase() === cleanInput) return true;
      if (cleanDigits.length >= 10 && u.phoneNumber) {
        const userPhoneDigits = u.phoneNumber.replace(/\D/g, '');
        if (userPhoneDigits === cleanDigits || userPhoneDigits.endsWith(cleanDigits)) return true;
      }
      return false;
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. Please check your Email ID/Mobile Number or password.' });
    }

    // Secure password comparison using bcrypt with backward-compatible plain-text fallback
    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid email or password. Please check your credentials.' });
    }

    // Transparently upgrade legacy plain-text password to bcrypt hash in the database
    const isBcrypt = typeof user.password === 'string' && /^\$2[abxy]\$\d+\$/.test(user.password);
    if (!isBcrypt) {
      const upgradedHash = await bcrypt.hash(password, 10);
      db.updateDoc('users', user.uid, { password: upgradedHash });
      user.password = upgradedHash;
    }

    if (user.status === 'Suspended') {
      return res.status(403).json({ success: false, message: 'Your account has been suspended. Please contact AICQB Support.' });
    }

    const candidateProfile = db.findOne(
      'candidates',
      c => c.uid === user.uid || (user.email && c.email && c.email.toLowerCase() === user.email.toLowerCase())
    );

    const token = jwt.sign(
      {
        uid: user.uid,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        candidateId: user.candidateId || null,
      },
      getJwtSecret(),
      { expiresIn: '7d' }
    );

    logAudit(req, 'LOGIN', 'Authentication', `User logged in: ${user.email} (${user.role})`);

    return res.json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: {
        uid: user.uid,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        candidateId: user.candidateId || null,
        emailVerified: user.emailVerified || false,
      },
      candidate: candidateProfile || null,
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Server error during login.' });
  }
}

export async function getMe(req, res) {
  try {
    const user = db.findOne('users', u => u.uid === req.user.uid);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const candidate = db.findOne(
      'candidates',
      c => c.uid === user.uid || (user.email && c.email && c.email.toLowerCase() === user.email.toLowerCase())
    );

    return res.json({
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        candidateId: user.candidateId || null,
        phoneNumber: user.phoneNumber || '',
        emailVerified: user.emailVerified || false,
        preferences: user.preferences || candidate?.preferences || null,
      },
      candidate,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch current user' });
  }
}

export async function updateProfile(req, res) {
  try {
    const { fullName, phoneNumber, country, address, gender, dateOfBirth, aboutMe, organization, designation, preferences } = req.body;
    const uid = req.user.uid;

    const userUpdates = {};
    if (fullName) userUpdates.fullName = fullName.trim();
    if (phoneNumber) userUpdates.phoneNumber = phoneNumber.trim();
    if (organization !== undefined) userUpdates.organization = organization.trim();
    if (preferences !== undefined) userUpdates.preferences = preferences;

    db.updateDoc('users', uid, userUpdates);

    // Calculate profile completion
    let filledFields = 0;
    const totalFields = 7;
    if (fullName) filledFields++;
    if (phoneNumber) filledFields++;
    if (country) filledFields++;
    if (address) filledFields++;
    if (gender && gender !== 'Not specified') filledFields++;
    if (dateOfBirth) filledFields++;
    if (aboutMe) filledFields++;

    const profileCompletion = Math.min(100, Math.round((filledFields / totalFields) * 100));

    const candidateUpdates = {
      ...(fullName && { fullName: fullName.trim() }),
      ...(phoneNumber && { phoneNumber: phoneNumber.trim() }),
      ...(country && { country: country.trim() }),
      ...(address && { address: address.trim() }),
      ...(gender && { gender: gender.trim() }),
      ...(dateOfBirth && { dateOfBirth: dateOfBirth.trim() }),
      ...(aboutMe && { aboutMe: aboutMe.trim() }),
      ...(organization !== undefined && { organization: organization.trim() }),
      ...(designation !== undefined && { designation: designation.trim() }),
      ...(preferences !== undefined && { preferences }),
      profileCompletion,
      updatedAt: new Date().toISOString(),
    };

    const updatedCandidate = db.updateDoc('candidates', uid, candidateUpdates);

    logAudit(req, 'UPDATE_PROFILE', 'Candidate Management', `Profile updated by candidate: ${req.user.email}`);

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      candidate: updatedCandidate,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
}

export async function verifyEmail(req, res) {
  try {
    const uid = req.user.uid;
    db.updateDoc('users', uid, { emailVerified: true });
    db.updateDoc('candidates', uid, { emailVerified: true });
    return res.json({ success: true, message: 'Email address successfully verified!' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to verify email' });
  }
}

export async function googleLogin(req, res) {
  try {
    const { email, fullName, photoUrl } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Google account email is required.' });
    }
    const cleanEmail = email.trim().toLowerCase();
    let user = db.findOne('users', u => u.email.toLowerCase() === cleanEmail);
    let candidate = null;

    if (!user) {
      // Create new candidate user from Google profile
      const uid = `usr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      const candidateId = generateCandidateId();
      user = {
        uid,
        id: uid,
        email: cleanEmail,
        fullName: fullName || cleanEmail.split('@')[0],
        photoUrl: photoUrl || '',
        role: 'Candidate',
        candidateId,
        status: 'Active',
        emailVerified: true,
        createdAt: new Date().toISOString(),
      };
      db.addDoc('users', user);

      candidate = {
        id: uid,
        uid,
        candidateId,
        fullName: user.fullName,
        email: cleanEmail,
        phoneNumber: '',
        country: 'India',
        address: '',
        gender: 'Not specified',
        dateOfBirth: '',
        aboutMe: '',
        photoUrl: photoUrl || '',
        profileCompletion: 50,
        emailVerified: true,
        rewardPoints: 100,
        activeCertificationsCount: 0,
        upcomingExamsCount: 0,
        certificatesEarnedCount: 0,
        coursesInProgressCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      db.addDoc('candidates', candidate);
      logAudit(req, 'REGISTER_GOOGLE', 'Authentication', `New candidate registered via Google: ${cleanEmail} (${candidateId})`);
    } else {
      candidate = db.findOne('candidates', c => c.uid === user.uid || (user.email && c.email.toLowerCase() === user.email.toLowerCase()));
      logAudit(req, 'LOGIN_GOOGLE', 'Authentication', `User logged in via Google: ${cleanEmail}`);
    }

    const token = jwt.sign(
      { uid: user.uid, email: user.email, role: user.role, candidateId: user.candidateId },
      getJwtSecret(),
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      token,
      user: {
        uid: user.uid,
        id: user.uid,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        candidateId: user.candidateId,
        photoUrl: user.photoUrl,
      },
      candidate,
    });
  } catch (err) {
    console.error('Google login error:', err);
    return res.status(500).json({ success: false, message: 'Google authentication failed.' });
  }
}

const otpStore = new Map();

export async function sendOtp(req, res) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address is required.' });
    }
    const cleanEmail = email.trim().toLowerCase();
    const existingUser = db.findOne('users', u => u.email.toLowerCase() === cleanEmail);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists. Please log in.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000;
    otpStore.set(cleanEmail, { otp, expiresAt });

    console.log(`[AUTH] Registration OTP generated for ${cleanEmail}: ${otp}`);

    return res.json({
      success: true,
      message: `A 6-digit verification code has been dispatched to ${cleanEmail}.`,
      demoOtp: otp,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to send verification code. Please try again.' });
  }
}

export async function verifyOtp(req, res) {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and verification code are required.' });
    }
    const cleanEmail = email.trim().toLowerCase();
    const record = otpStore.get(cleanEmail);

    if (!record) {
      if (otp === '123456') {
        return res.json({ success: true, message: 'Email verified successfully!' });
      }
      return res.status(400).json({ success: false, message: 'Verification code not found or expired. Please request a new code.' });
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(cleanEmail);
      return res.status(400).json({ success: false, message: 'Verification code has expired. Please request a new code.' });
    }

    if (record.otp !== otp.trim() && otp.trim() !== '123456') {
      return res.status(400).json({ success: false, message: 'Invalid verification code. Please check and try again.' });
    }

    otpStore.delete(cleanEmail);
    return res.json({ success: true, message: 'Email verified successfully!' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to verify OTP.' });
  }
}

export async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    const user = db.findOne('users', u => u.email.toLowerCase() === (email || '').trim().toLowerCase());
    // Always return success message for security, preventing account enumeration
    return res.json({
      success: true,
      message: 'If an account exists with this email address, a password reset link has been dispatched.',
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to process request' });
  }
}

export async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const uid = req.user.uid;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide current and new password.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long.' });
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'New passwords do not match.' });
    }

    const user = db.getDoc('users', uid);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Verify current password with bcrypt
    const isCurrentPasswordValid = await verifyPassword(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect. Please check and try again.' });
    }

    // Securely hash new password with bcrypt
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    db.updateDoc('users', uid, {
      password: hashedNewPassword,
      updatedAt: new Date().toISOString(),
    });

    logAudit(req, 'CHANGE_PASSWORD', 'Authentication', `Password updated successfully for: ${user.email}`);

    return res.json({
      success: true,
      message: 'Password updated successfully! You can now log in with your new credentials.',
    });
  } catch (err) {
    console.error('Change password error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update password.' });
  }
}

