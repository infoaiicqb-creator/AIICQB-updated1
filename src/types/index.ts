export interface User {
  uid: string;
  id?: string;
  email: string;
  fullName: string;
  role: 'Super Admin' | 'Certification Manager' | 'Exam Controller' | 'Evaluator' | 'Partner Manager' | 'Finance Admin' | 'Support Admin' | 'Candidate';
  candidateId?: string;
  phoneNumber?: string;
  status?: string;
  emailVerified: boolean;
  organization?: string;
  employeeId?: string;
  designation?: string;
  preferences?: any;
}

export interface CandidateProfile {
  id: string;
  uid: string;
  candidateId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  country: string;
  address: string;
  gender: string;
  dateOfBirth: string;
  aboutMe: string;
  profileCompletion: number;
  emailVerified: boolean;
  rewardPoints: number;
  activeCertificationsCount: number;
  upcomingExamsCount: number;
  certificatesEarnedCount: number;
  coursesInProgressCount: number;
  organization?: string;
  employeeId?: string;
  designation?: string;
  preferences?: any;
}

export interface Certification {
  id: string;
  code: string;
  name: string;
  domain: string;
  domainId?: string;
  domainCode: string;
  domainSlug: string;
  level: string;
  levelId?: string;
  description: string;
  learningObjectives: string[];
  syllabus: { title: string; hours: number; topics: string[] }[];
  eligibility: string;
  examPattern: string;
  examFee: number;
  examFeeINR?: number;
  examFeeUSD?: number;
  exchangeRate?: number;
  currency: string;
  duration: string;
  passingCriteria: number;
  validityYears: number;
  version: string;
  status: 'Active' | 'Inactive' | 'Published' | 'Archived' | 'Draft';
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
  enrolledCount?: number;
  icon?: string;
  popular?: boolean;
}

export interface CertificationDomain {
  id: string;
  domainId?: string;
  name: string;
  codePrefix: string;
  slug?: string;
  description?: string;
  status: 'Active' | 'Inactive';
  createdAt?: string;
  updatedAt?: string;
}

export interface CertificationLevel {
  id: string;
  levelId?: string;
  name: string;
  levelCode?: string;
  description?: string;
  defaultExamFeeINR: number;
  status: 'Active' | 'Inactive';
  createdAt?: string;
  updatedAt?: string;
}

export interface CertificationAuditLog {
  id?: string;
  logId: string;
  certificationId?: string;
  certificationCode?: string;
  action: string;
  previousData?: any;
  updatedData?: any;
  adminId?: string;
  adminEmail: string;
  adminName?: string;
  timestamp: string;
}

export interface Enrollment {
  id: string;
  candidateUid: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  certificationId: string;
  certificationName: string;
  certificationCode: string;
  domain: string;
  enrollmentDate: string;
  status: 'enrolled' | 'in-progress' | 'completed';
  progressPercentage: number;
  paymentId: string;
  amount: number;
}

export interface ExamSchedule {
  id: string;
  scheduleId: string;
  candidateUid: string;
  candidateId: string;
  candidateName: string;
  certificationId: string;
  certificationName: string;
  certificationCode: string;
  examId: string;
  examName: string;
  examCode: string;
  scheduledDate: string;
  scheduledDateFormatted?: string;
  scheduledDateDay?: string;
  scheduledDateMonth?: string;
  scheduledTime: string;
  mode: string;
  durationMinutes: number;
  status: 'scheduled' | 'in-progress' | 'completed' | 'expired';
  isRetake?: boolean;
  retakeAttemptNumber?: number;
  totalAttemptsAllowed?: number;
  attemptsCompleted?: number;
  attemptsRemaining?: number;
  previousAttemptScore?: number | null;
  previousAttemptResult?: string | null;
  nextAttemptEligibility?: boolean;
  instructions?: string[];
}

export interface Certificate {
  id: string;
  certificateNo: string;
  candidateUid: string;
  candidateId: string;
  candidateName: string;
  certificationId: string;
  certificationName: string;
  certificationCode: string;
  credentialLevel: string;
  issueDate: string;
  issueDateFormatted: string;
  validUntil: string;
  validUntilFormatted: string;
  status: 'Issued' | 'Revoked' | 'Renewed';
  verificationUrl: string;
  qrCodeDataUrl: string;
  issuer?: {
    director?: string;
    directorTitle?: string;
    ceo?: string;
    ceoTitle?: string;
    authorizedSignatory?: string;
    organization?: string;
  };
  ceoName?: string;
  ceo?: string;
  directorName?: string;
  director?: string;
  disclaimer?: string;
  expiryDate?: string;
  grade?: string;
}

export interface Payment {
  id: string;
  paymentId: string;
  payment_id?: string;
  razorpayOrderId: string;
  razorpay_order_id?: string;
  razorpayPaymentId: string | null;
  razorpay_payment_id?: string | null;
  candidateUid: string;
  candidateId: string;
  candidate_id?: string;
  candidateName: string;
  candidate_name?: string;
  candidateEmail: string;
  candidate_email?: string;
  candidatePhone?: string;
  candidate_phone?: string;
  country?: string;
  certificationId: string;
  certification_id?: string;
  certificationName: string;
  certification_name?: string;
  certificationCode: string;
  certificationLevel?: string;
  certification_level?: string;
  enrollment_id?: string | null;
  enrollmentId?: string | null;
  amount: number;
  currency: string;
  payment_gateway?: string;
  paymentStatus: 'success' | 'pending' | 'failed' | string;
  payment_status?: string;
  status?: string;
  description?: string;
  date?: string;
  paymentMethod: string | null;
  invoiceId: string;
  createdAt: string;
  created_at?: string;
  paidAt: string | null;
  verifiedAt?: string | null;
  verified_at?: string | null;
  refundStatus: 'none' | 'refunded';
  refundedAmount: number;
}

export interface SupportTicket {
  id: string;
  ticketId: string;
  candidateUid: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  subject: string;
  category: string;
  priority: string;
  message: string;
  status: 'Open' | 'In Progress' | 'Resolved';
  dateFormatted?: string;
  createdAt: string;
  replies?: {
    sender: string;
    senderRole: string;
    message: string;
    timestamp: string;
  }[];
}

