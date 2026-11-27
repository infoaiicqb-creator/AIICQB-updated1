const API_BASE = '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('aicqb_token');
}

export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem('aicqb_token', token);
  } else {
    localStorage.removeItem('aicqb_token');
  }
}

async function request(endpoint: string, options: RequestInit = {}) {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    if (!res.ok) {
      throw new Error(`Server request failed with status ${res.status}`);
    }
    throw new Error('API server returned an invalid response format. Please try again.');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `Request failed with status ${res.status}`);
  }
  return data;
}

export const api = {
  // Auth
  register: (body: any) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body: any) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  googleLogin: (body: any) => request('/auth/google', { method: 'POST', body: JSON.stringify(body) }),
  getMe: () => request('/auth/me'),
  updateProfile: (body: any) => request('/auth/profile', { method: 'PUT', body: JSON.stringify(body) }),
  changePassword: (body: { currentPassword: string; newPassword: string; confirmPassword?: string }) =>
    request('/auth/change-password', { method: 'PUT', body: JSON.stringify(body) }),
  verifyEmail: () => request('/auth/verify-email', { method: 'POST' }),
  sendOtp: (body: { email: string; fullName?: string }) => request('/auth/send-otp', { method: 'POST', body: JSON.stringify(body) }),
  verifyOtp: (body: { email: string; otp: string }) => request('/auth/verify-otp', { method: 'POST', body: JSON.stringify(body) }),
  forgotPassword: (email: string) => request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),

  // Certifications
  getCertifications: (params?: {
    domain?: string;
    level?: string;
    search?: string;
    status?: string;
    publicOnly?: string;
    adminView?: string;
    sortBy?: string;
    sortOrder?: string;
    [key: string]: any;
  }) => {
    const query = new URLSearchParams(params as any).toString();
    return request(`/certifications${query ? `?${query}` : ''}`);
  },
  getCertificationById: (id: string) => request(`/certifications/${id}`),
  getCandidateCertificationStatus: () => request('/certifications/candidate-status'),
  enrollCertification: (certificationId: string) =>
    request('/certifications/enroll', { method: 'POST', body: JSON.stringify({ certificationId }) }),

  // Payments (Razorpay)
  createPaymentOrder: (payload: {
    certificationId: string;
    planType?: string;
    candidateName?: string;
    candidateEmail?: string;
    candidatePhone?: string;
    country?: string;
    currency?: string;
  } | string, planType?: string) => {
    const body = typeof payload === 'string' ? { certificationId: payload, planType } : payload;
    return request('/payment/create-order', { method: 'POST', body: JSON.stringify(body) });
  },
  verifyPayment: (payload: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string; paymentId: string }) =>
    request('/payment/verify', { method: 'POST', body: JSON.stringify(payload) }),
  checkPaymentStatus: (paymentId: string) => request(`/payment/status/${paymentId}`),
  triggerTestQrScan: (payload: { paymentId?: string; orderId?: string }) =>
    request('/payment/test-qr-scan', { method: 'POST', body: JSON.stringify(payload) }),
  getCandidatePayments: (candidateId: string) => request(`/payments/candidate/${candidateId}`),
  getPaymentById: (paymentId: string) => request(`/payments/${paymentId}`),

  // Exams
  getExams: () => request('/exams'),
  getMySchedules: () => request('/exams/my-schedules'),
  scheduleExam: (body: { certificationId: string; scheduledDate?: string; scheduledTime?: string }) =>
    request('/exams/schedule', { method: 'POST', body: JSON.stringify(body) }),
  startExamSession: (scheduleId: string) => request(`/exams/session/${scheduleId}`),
  submitExam: (body: { attemptId: string; answers: Record<string, any>; scheduleId?: string }) =>
    request('/exams/submit', { method: 'POST', body: JSON.stringify(body) }),
  saveExamAnswers: (body: { attemptId: string; scheduleId?: string; answers: Record<string, any> }) =>
    request('/exams/save-answers', { method: 'POST', body: JSON.stringify(body) }),
  logProctoringEvent: (body: {
    attemptId?: string;
    scheduleId?: string;
    candidateId?: string;
    candidateName?: string;
    eventType: string;
    details?: string;
    snapshot?: string | null;
    timestamp?: string;
  }) => request('/exams/proctoring/log-event', { method: 'POST', body: JSON.stringify(body) }),
  saveIdentityVerification: (body: {
    scheduleId: string;
    candidatePhoto: string;
    idCardPhoto: string;
    matchScore?: number;
    verificationStatus?: string;
  }) => request('/exams/proctoring/identity-verification', { method: 'POST', body: JSON.stringify(body) }),
  exitExamSession: (body: { attemptId?: string; scheduleId?: string; answers?: Record<string, any> }) =>
    request('/exams/exit', { method: 'POST', body: JSON.stringify(body) }),
  reviewSessionAdmin: (body: { scheduleId?: string; attemptId?: string; status: string; notes?: string }) =>
    request('/exams/admin/review-session', { method: 'POST', body: JSON.stringify(body) }),

  // Certificates
  getMyCertificates: () => request('/certificates/my'),
  getPublicRegistry: () => request('/certificates/public-registry'),
  verifyCertificate: (certificateNo: string) => request(`/certificates/verify/${encodeURIComponent(certificateNo)}`),

  // Support
  createTicket: (body: { subject: string; category?: string; message: string; priority?: string }) =>
    request('/support/tickets', { method: 'POST', body: JSON.stringify(body) }),
  getMyTickets: () => request('/support/my-tickets'),
  contactSubmit: (body: { name: string; email: string; subject: string; message: string }) =>
    request('/support/contact', { method: 'POST', body: JSON.stringify(body) }),

  // Super Admin
  getAdminDashboard: (params?: Record<string, string>) => {
    const q = params ? new URLSearchParams(params).toString() : '';
    return request(`/admin/dashboard${q ? `?${q}` : ''}`);
  },
  getAdminCandidates: (params?: any) => {
    const query = new URLSearchParams(params).toString();
    return request(`/admin/candidates${query ? `?${query}` : ''}`);
  },
  getAdminCandidateDetails: (id: string) => request(`/admin/candidates/${id}`),
  // Admin Certification CRUD
  createCertification: (body: any) => request('/certifications', { method: 'POST', body: JSON.stringify(body) }),
  updateCertification: (id: string, body: any) => request(`/certifications/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteCertification: (id: string) => request(`/certifications/${id}`, { method: 'DELETE' }),
  toggleCertificationStatus: (id: string) => request(`/certifications/${id}/toggle-status`, { method: 'PATCH' }),
  archiveCertification: (id: string) => request(`/certifications/${id}/archive`, { method: 'PATCH' }),
  restoreCertification: (id: string) => request(`/certifications/${id}/restore`, { method: 'PATCH' }),
  generateCertificationCode: (params?: any) => {
    const q = params ? new URLSearchParams(params).toString() : '';
    return request(`/certifications/generate-code${q ? `?${q}` : ''}`);
  },

  // Domains Management CRUD
  getCertificationDomains: (params?: any) => {
    const q = params ? new URLSearchParams(params).toString() : '';
    return request(`/certifications/domains${q ? `?${q}` : ''}`);
  },
  createCertificationDomain: (body: any) => request('/certifications/domains', { method: 'POST', body: JSON.stringify(body) }),
  updateCertificationDomain: (id: string, body: any) => request(`/certifications/domains/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  toggleCertificationDomainStatus: (id: string) => request(`/certifications/domains/${id}/toggle-status`, { method: 'PATCH' }),
  deleteCertificationDomain: (id: string) => request(`/certifications/domains/${id}`, { method: 'DELETE' }),

  // Levels Management CRUD
  getCertificationLevels: (params?: any) => {
    const q = params ? new URLSearchParams(params).toString() : '';
    return request(`/certifications/levels${q ? `?${q}` : ''}`);
  },
  createCertificationLevel: (body: any) => request('/certifications/levels', { method: 'POST', body: JSON.stringify(body) }),
  updateCertificationLevel: (id: string, body: any) => request(`/certifications/levels/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  toggleCertificationLevelStatus: (id: string) => request(`/certifications/levels/${id}/toggle-status`, { method: 'PATCH' }),
  deleteCertificationLevel: (id: string) => request(`/certifications/levels/${id}`, { method: 'DELETE' }),

  // Pricing & Audit Logs
  getCertificationPricingConfig: () => request('/certifications/config'),
  updateCertificationPricingConfig: (body: any) => request('/certifications/config', { method: 'POST', body: JSON.stringify(body) }),
  getCertificationAuditLogs: () => request('/certifications/audit-logs'),

  // Admin Candidate CRUD
  createAdminCandidate: (body: any) => request('/admin/candidates', { method: 'POST', body: JSON.stringify(body) }),
  updateAdminCandidate: (id: string, body: any) => request(`/admin/candidates/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteAdminCandidate: (id: string) => request(`/admin/candidates/${id}`, { method: 'DELETE' }),

  // Admin Exam & Questions CRUD
  createAdminExam: (body: any) => request('/exams/admin/exams', { method: 'POST', body: JSON.stringify(body) }),
  updateAdminExam: (id: string, body: any) => request(`/exams/admin/exams/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteAdminExam: (id: string) => request(`/exams/admin/exams/${id}`, { method: 'DELETE' }),
  getAdminQuestions: () => request('/exams/admin/questions'),
  createAdminQuestion: (body: any) => request('/exams/admin/questions', { method: 'POST', body: JSON.stringify(body) }),
  bulkImportQuestionsAdmin: (body: any) =>
    request('/exams/admin/questions/bulk-import', { method: 'POST', body: JSON.stringify(body) }),
  updateAdminQuestion: (id: string, body: any) => request(`/exams/admin/questions/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteAdminQuestion: (id: string) => request(`/exams/admin/questions/${id}`, { method: 'DELETE' }),
  getAdminMonitoring: () => request('/exams/admin/monitoring'),
  getAdminResults: () => request('/exams/admin/results'),

  // Admin Finance & Payment CRUD
  getAdminPayments: () => request('/payments/admin/all'),
  createAdminPayment: (body: any) => request('/payments/admin/create', { method: 'POST', body: JSON.stringify(body) }),
  updateAdminPayment: (id: string, body: any) => request(`/payments/admin/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteAdminPayment: (id: string) => request(`/payments/admin/${id}`, { method: 'DELETE' }),
  processRefund: (body: { paymentId: string; amount?: number; reason?: string }) =>
    request('/payments/refund', { method: 'POST', body: JSON.stringify(body) }),

  // Admin Certificate CRUD
  getAdminCertificates: () => request('/certificates/admin/all'),
  getAdminVerificationStats: () => request('/certificates/admin/verification-stats'),
  issueCertificateAdmin: (body: any) => request('/certificates/admin/issue', { method: 'POST', body: JSON.stringify(body) }),
  updateAdminCertificate: (id: string, body: any) => request(`/certificates/admin/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteAdminCertificate: (id: string) => request(`/certificates/admin/${id}`, { method: 'DELETE' }),
  revokeCertificate: (id: string, reason?: string) =>
    request(`/certificates/admin/revoke/${id}`, { method: 'POST', body: JSON.stringify({ reason }) }),
  reinstateCertificate: (id: string) =>
    request(`/certificates/admin/reinstate/${id}`, { method: 'POST' }),
  suspendCertificate: (id: string, reason?: string) =>
    request(`/certificates/admin/suspend/${id}`, { method: 'POST', body: JSON.stringify({ reason }) }),
  approveCertificate: (id: string) =>
    request(`/certificates/admin/approve/${id}`, { method: 'POST' }),
  rejectCertificate: (id: string, reason?: string) =>
    request(`/certificates/admin/reject/${id}`, { method: 'POST', body: JSON.stringify({ reason }) }),
  reissueCertificate: (id: string, reason?: string) =>
    request(`/certificates/admin/reissue/${id}`, { method: 'POST', body: JSON.stringify({ reason }) }),
  regenerateQrCode: (id: string) =>
    request(`/certificates/admin/regenerate-qr/${id}`, { method: 'POST' }),

  // Admin Partner CRUD
  getAdminPartners: () => request('/admin/partners'),
  addAdminPartner: (body: any) => request('/admin/partners', { method: 'POST', body: JSON.stringify(body) }),
  updateAdminPartner: (id: string, body: any) => request(`/admin/partners/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteAdminPartner: (id: string) => request(`/admin/partners/${id}`, { method: 'DELETE' }),

  // Admin Membership CRUD
  getAdminMemberships: () => request('/admin/memberships'),
  addAdminMembership: (body: any) => request('/admin/memberships', { method: 'POST', body: JSON.stringify(body) }),
  updateAdminMembership: (id: string, body: any) => request(`/admin/memberships/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteAdminMembership: (id: string) => request(`/admin/memberships/${id}`, { method: 'DELETE' }),

  // Admin LMS Course CRUD
  getAdminLMS: () => request('/admin/lms-courses'),
  addAdminLMS: (body: any) => request('/admin/lms-courses', { method: 'POST', body: JSON.stringify(body) }),
  updateAdminLMS: (id: string, body: any) => request(`/admin/lms-courses/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteAdminLMS: (id: string) => request(`/admin/lms-courses/${id}`, { method: 'DELETE' }),

  // Admin Announcements CRUD
  getAdminAnnouncements: () => request('/admin/announcements'),
  createAdminAnnouncement: (body: any) => request('/admin/announcements', { method: 'POST', body: JSON.stringify(body) }),
  updateAdminAnnouncement: (id: string, body: any) => request(`/admin/announcements/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteAdminAnnouncement: (id: string) => request(`/admin/announcements/${id}`, { method: 'DELETE' }),

  getAdminAuditLogs: () => request('/admin/audit-logs'),
  getAdminSettings: () => request('/admin/settings'),
  updateAdminSettings: (data: any) =>
    request('/admin/settings', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getAdminTickets: () => request('/support/admin/tickets'),
  replyAdminTicket: (id: string, body: { message: string; status?: string }) =>
    request(`/support/admin/tickets/${id}/reply`, { method: 'POST', body: JSON.stringify(body) }),

  // Reports & Analytics
  getReportsAnalytics: () => request('/admin/reports/analytics'),

  // Firebase Dynamic Cloud Integration
  getFirebaseStatus: () => request('/admin/firebase/status'),
  getFirebaseCollections: () => request('/admin/firebase/collections'),
  testFirebase: () => request('/admin/firebase/test', { method: 'POST' }),
  syncFirebase: () => request('/admin/firebase/sync', { method: 'POST' }),
  syncFirebaseCollection: (name: string) => request(`/admin/firebase/sync/${name}`, { method: 'POST' }),
  getFirebaseCollectionData: (name: string) => request(`/admin/firebase/collection-data/${name}`),
  updateFirebaseConfig: (config: any) => request('/admin/firebase/config', { method: 'POST', body: JSON.stringify(config) }),
};

